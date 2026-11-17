/* 일반생명과학 3 다른 자리 입체성 조절: 협동성이 만드는 S자형 속도 곡선, 활성화제·저해제가 곡선을 옮기는 효과 (PFK 예) */
Sims.register('u-allosteric', {
  title: '스위치처럼 켜지는 효소 — 협동성과 다른 자리 입체성 조절',
  caption: '협동성의 세기를 키우면 속도 곡선이 쌍곡선(점선, 미카엘리스–멘텐형)에서 S자로 바뀌어, 최대 속도의 10 %에서 90 %로 가는 데 필요한 기질 농도 배수가 81배에서 크게 줄어든다(스위치). 활성화제(PFK의 AMP)는 활성형을 안정화해 곡선을 왼쪽으로, 저해제(높은 농도의 ATP)는 비활성형을 안정화해 오른쪽으로 옮기므로, 같은 기질 농도에서 속도가 크게 달라진다. 곡선은 힐 식 v = V_max·[S]ⁿ/(K₀.₅ⁿ + [S]ⁿ)로 그린 모형이며, 조절 분자는 K₀.₅만 바꾼다고(활성화제 ½배, 저해제 3배) 단순화했다. 오른쪽 소단위 4개는 기질이 찬 비율을 나타낸다.',
  init: function (api) {
    var VMAX = 100, K0 = 2.0, SMAX = 10;
    var MODS = { none: { k: 1, name: '조절 분자 없음' }, act: { k: 0.5, name: '활성화제(AMP)' }, inh: { k: 3, name: '저해제(ATP 많음)' } };
    var s = { n: 2.8, mod: 'none', S: 2.0 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.5 : 0.5; }, label: '기질 농도에 따른 반응 속도 곡선과 효소 소단위 그림' });
    var ctx = cv.ctx;

    var rV = api.readout('반응 속도 v');
    var rK = api.readout('K₀.₅');
    var rSw = api.readout('10 % → 90 %에 필요한 [S] 배수');

    api.slider({ id: 'u-allosteric-n', label: '협동성(힐 계수 n)', min: 1, max: 4, step: 0.1, value: s.n,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { s.n = v; update(); } });
    api.slider({ id: 'u-allosteric-s', label: '기질 [S]', min: 0, max: SMAX, step: 0.1, value: s.S,
      format: function (v) { return v.toFixed(1) + ' mM'; }, onInput: function (v) { s.S = v; update(); } });
    var g = api.group();
    var btn = {};
    ['none', 'act', 'inh'].forEach(function (k) {
      btn[k] = api.button(MODS[k].name, function () { s.mod = k; sync(); update(); }, { toggle: true, pressed: k === s.mod, parent: g });
    });
    function sync() { Object.keys(btn).forEach(function (k) { btn[k].setAttribute('aria-pressed', k === s.mod ? 'true' : 'false'); }); }
    function K(mod) { return K0 * MODS[mod].k; }
    function v(S, n, k) { if (S <= 0) return 0; var a = Math.pow(S, n); return VMAX * a / (Math.pow(k, n) + a); }
    function update() {
      var k = K(s.mod);
      rV.set(v(s.S, s.n, k).toFixed(0) + ' (V_max = 100)');
      rK.set(k.toFixed(1) + ' mM');
      rSw.set(Math.pow(81, 1 / s.n).toFixed(1) + '배');
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { g: { x: 0, y: 0, w: w, h: h * 0.6 }, e: { x: 0, y: h * 0.62, w: w, h: h * 0.38 } }
        : { g: { x: 0, y: 0, w: w * 0.66, h: h }, e: { x: w * 0.68, y: 0, w: w * 0.32, h: h } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      graph(T, L.g); enzyme(T, L.e);
    }
    function graph(T, r) {
      var Lx = r.x + 48, Rx = r.x + r.w - 12, Tp = r.y + 16, B = r.y + r.h - 40;
      var sx = function (S) { return Lx + S / SMAX * (Rx - Lx); };
      var sy = function (y) { return B - y / 110 * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 25, 50, 75, 100].forEach(function (y) { ctx.beginPath(); ctx.moveTo(Lx, sy(y)); ctx.lineTo(Rx, sy(y)); ctx.stroke(); ctx.fillText(y, Lx - 6, sy(y) + 4); });
      ctx.textAlign = 'center';
      for (var S = 0; S <= SMAX; S += 2) { ctx.beginPath(); ctx.moveTo(sx(S), Tp); ctx.lineTo(sx(S), B); ctx.stroke(); ctx.fillText(S, sx(S), B + 14); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('기질 농도 [S] (mM)', (Lx + Rx) / 2, B + 31);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('반응 속도 v (상대값)', 0, 0); ctx.restore();
      var k = K(s.mod);
      // 미카엘리스–멘텐 비교(같은 K0.5, n = 1)
      curve(1, k, T.figLine, 1.5, [5, 4]);
      // 다른 조절 상태의 곡선(흐리게)
      ['none', 'act', 'inh'].forEach(function (m) { if (m !== s.mod) curve(s.n, K(m), m === 'act' ? T.figGreen : m === 'inh' ? T.figRed : T.figMuted, 1.2, null, 0.45); });
      var col = s.mod === 'act' ? T.figGreen : s.mod === 'inh' ? T.figRed : T.figAccent;
      curve(s.n, k, col, 3);
      // K0.5 표시
      ctx.setLineDash([3, 3]); ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Lx, sy(50)); ctx.lineTo(sx(k), sy(50)); ctx.lineTo(sx(k), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('K₀.₅', sx(k) + 4, B - 6);
      // 10 %, 90 % 지점
      var s10 = k * Math.pow(1 / 9, 1 / s.n), s90 = k * Math.pow(9, 1 / s.n);
      if (s90 <= SMAX) {
        ctx.fillStyle = col; ctx.globalAlpha = 0.12; ctx.fillRect(sx(s10), Tp, sx(s90) - sx(s10), B - Tp); ctx.globalAlpha = 1;
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('10 %→90 % 구간', (sx(s10) + sx(s90)) / 2, Tp + 10);
      }
      // 현재 점
      var vv = v(s.S, s.n, k);
      ctx.beginPath(); ctx.arc(sx(s.S), sy(vv), 6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('점선: 협동성 없음(n = 1)', Rx - 4, sy(52) + 18);
      function curve(n, kk, c, lw, dash, alpha) {
        ctx.beginPath();
        for (var i = 0; i <= 120; i++) { var S2 = SMAX * i / 120, y = sy(v(S2, n, kk)); if (i) ctx.lineTo(sx(S2), y); else ctx.moveTo(sx(S2), y); }
        ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.globalAlpha = alpha || 1; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
    }
    function enzyme(T, r) {
      var k = K(s.mod), th = v(s.S, s.n, k) / VMAX, filled = Math.round(th * 4);
      var cx = r.x + r.w / 2, cy = r.y + r.h * 0.42, d = Math.min(r.w * 0.17, r.h * 0.13, 34);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('소단위 4개', cx, r.y + 18);
      var round = th;   // 0: 비활성형(네모), 1: 활성형(동그라미)
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p, i) {
        var x = cx + p[0] * (d + 3), y = cy + p[1] * (d + 3), rr = d * (0.15 + 0.85 * round);
        ctx.beginPath();
        ctx.moveTo(x - d + rr, y - d); ctx.arcTo(x + d, y - d, x + d, y + d, rr); ctx.arcTo(x + d, y + d, x - d, y + d, rr); ctx.arcTo(x - d, y + d, x - d, y - d, rr); ctx.arcTo(x - d, y - d, x + d, y - d, rr); ctx.closePath();
        ctx.fillStyle = T.figSoftViolet; ctx.fill(); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2; ctx.stroke();
        // 활성 부위의 기질
        ctx.beginPath(); ctx.arc(x + p[0] * d * 0.35, y + p[1] * d * 0.35, d * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = i < filled ? T.figAmber : T.figPanel; ctx.fill(); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // 조절 부위(가운데)
      if (s.mod !== 'none') {
        ctx.beginPath(); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 9, cy + 7); ctx.lineTo(cx - 9, cy + 7); ctx.closePath();
        ctx.fillStyle = s.mod === 'act' ? T.figGreen : T.figRed; ctx.fill();
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('기질이 찬 비율 ' + Math.round(th * 100) + ' %', cx, cy + 2 * d + 24);
      ctx.fillText(round > 0.65 ? '대부분 활성형(둥근 모양)' : round < 0.35 ? '대부분 비활성형(각진 모양)' : '두 형태가 섞여 있음', cx, cy + 2 * d + 40);
    }

    api.onResize(draw);
    update();
  },
});
