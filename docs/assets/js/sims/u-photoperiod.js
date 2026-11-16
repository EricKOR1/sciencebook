/* 일반생명과학 10 광주기성: 명암 시간, 밤 중간의 섬광, 적색·원적색광 → 단일·장일 식물의 개화 */
Sims.register('u-photoperiod', {
  title: '광주기 실험실 — 식물은 밤의 길이를 잰다',
  caption: '명기 길이를 바꾸고, 밤 중간에 섬광을 비춰 보자. 적색광(R) 섬광은 밤을 두 개의 짧은 밤으로 끊지만, 바로 뒤에 원적색광(FR)을 비추면 효과가 사라진다 — 마지막에 비춘 빛이 결과를 정한다(피토크롬 Pr ⇄ Pfr). 단일 식물은 가장 긴 연속 암기가 임계 암기보다 길 때, 장일 식물은 짧을 때 꽃이 핀다고 단순화했다. 두 식물의 임계 암기를 같다고 놓고(예제 9), 섬광의 길이와 온도·춘화 같은 다른 조건은 무시했다.',
  init: function (api) {
    var st = { D: 10, fpos: 50, crit: 11, flash: 'none' };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.2 : 0.56; }, label: '24시간 명암 주기, 연속 암기, 단일·장일 식물의 개화 여부' });
    var ctx = cv.ctx;
    var rN = api.readout('가장 긴 연속 암기');
    var rP = api.readout('밤 동안 피토크롬');
    var rS = api.readout('단일 식물');
    var rL = api.readout('장일 식물');

    api.slider({ id: 'u-photoperiod-day', label: '명기', min: 4, max: 20, step: 0.5, value: st.D,
      format: function (v) { return v + ' h (암기 ' + (24 - v) + ' h)'; }, onInput: function (v) { st.D = v; fSl.set(st.fpos); } });
    var fSl = api.slider({ id: 'u-photoperiod-flash', label: '섬광 시각', min: 5, max: 95, step: 1, value: st.fpos,
      format: function (v) { return '밤 시작 후 ' + fh(v).toFixed(1) + ' h'; }, onInput: function (v) { st.fpos = v; draw(); } });
    api.slider({ id: 'u-photoperiod-crit', label: '임계 암기', min: 8, max: 14, step: 0.5, value: st.crit,
      format: function (v) { return v + ' h'; }, onInput: function (v) { st.crit = v; draw(); } });
    var g = api.group();
    var kinds = [['none', '섬광 없음'], ['R', '적색(R)'], ['RF', 'R → 원적색(FR)'], ['RFR', 'R → FR → R']];
    var btns = kinds.map(function (k) {
      return api.button(k[1], function () { st.flash = k[0]; btns.forEach(function (b, j) { b.setAttribute('aria-pressed', kinds[j][0] === st.flash ? 'true' : 'false'); }); draw(); },
        { toggle: true, pressed: k[0] === st.flash, parent: g });
    });

    function night() { return 24 - st.D; }
    function fh(p) { return night() * p / 100; }
    function breaks() { return st.flash === 'R' || st.flash === 'RFR'; }
    function segs() {
      var N = night();
      if (st.flash !== 'none' && breaks()) { var t = fh(st.fpos); return [t, N - t]; }
      return [N];
    }
    function verdict(longest) {
      var e = 1e-9;
      if (Math.abs(longest - st.crit) < e) return { s: 'edge', l: 'edge' };
      return { s: longest > st.crit ? 'yes' : 'no', l: longest < st.crit ? 'yes' : 'no' };
    }
    function word(v) { return v === 'yes' ? '개화' : v === 'no' ? '개화 안 함' : '경계(임계값과 같음)'; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var fs = narrow ? 11 : 13;
      var L = narrow ? 14 : 40, R = w - (narrow ? 14 : 40);
      var X = function (t) { return L + (t / 24) * (R - L); };
      var N = night(), S = segs(), longest = Math.max.apply(null, S), V = verdict(longest);
      // ── 24시간 띠
      var y0 = narrow ? 34 : 40, bh = narrow ? 34 : 40;
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('하루 24시간의 명암 처리', L, y0 - 14);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(X(0), y0, X(st.D) - X(0), bh);
      ctx.fillStyle = T.dark ? '#0b0f18' : '#2a3245';   // 어둠(실제 '어두움'을 나타내는 색)
      ctx.fillRect(X(st.D), y0, X(24) - X(st.D), bh);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(X(0), y0, X(24) - X(0), bh);
      ctx.textAlign = 'center'; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillStyle = T.figInk; ctx.fillText('명 ' + st.D + ' h', (X(0) + X(st.D)) / 2, y0 + bh / 2 + 4);
      // 섬광
      var tf = st.D + fh(st.fpos), xf = X(tf);
      if (st.flash !== 'none') {
        var seq = st.flash === 'R' ? ['R'] : st.flash === 'RF' ? ['R', 'FR'] : ['R', 'FR', 'R'];
        seq.forEach(function (c, i) {
          var xx = xf + (i - (seq.length - 1) / 2) * 5;
          ctx.strokeStyle = c === 'R' ? '#ff4a3d' : '#b02020'; ctx.lineWidth = 4;   // 실제 빛의 색: 적색 / 원적색(사람 눈에는 거의 안 보이는 짙은 빨강)
          ctx.setLineDash(c === 'FR' ? [4, 3] : []);
          ctx.beginPath(); ctx.moveTo(xx, y0 - 4); ctx.lineTo(xx, y0 + bh + 4); ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.fillStyle = T.figRed; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
        ctx.fillText(seq.join('→'), xf, y0 - 8 < 14 ? y0 + bh + 16 : y0 - 6);
      }
      // 눈금
      ctx.fillStyle = T.figMuted; ctx.font = (narrow ? 11 : 12) + 'px ' + T.fontMono;
      [0, 6, 12, 18, 24].forEach(function (t) { ctx.fillText(t + 'h', X(t), y0 + bh + 15); });
      // ── 연속 암기 구간 괄호
      var yb = y0 + bh + (narrow ? 32 : 36);
      var start = st.D;
      ctx.font = fs + 'px ' + T.fontBody;
      S.forEach(function (len) {
        var a = X(start), b = X(start + len), isL = len === longest;
        ctx.strokeStyle = isL ? T.figAccent : T.figLine; ctx.lineWidth = isL ? 2.5 : 1.5;
        ctx.beginPath(); ctx.moveTo(a + 2, yb - 8); ctx.lineTo(a + 2, yb); ctx.lineTo(b - 2, yb); ctx.lineTo(b - 2, yb - 8); ctx.stroke();
        ctx.fillStyle = isL ? T.figAccent : T.figMuted; ctx.textAlign = 'center';
        ctx.fillText(len.toFixed(1) + ' h', (a + b) / 2, yb + 16);
        start += len;
      });
      ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      if (!narrow) ctx.fillText('연속 암기', L, yb + 16);
      // ── 가장 긴 암기 vs 임계 암기
      var yc = yb + (narrow ? 40 : 44), ch = narrow ? 16 : 18;
      var cL = narrow ? L : L + 150, cR = R, CX = function (t) { return cL + (t / 20) * (cR - cL); };
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
      if (narrow) { ctx.fillText('가장 긴 연속 암기 vs 임계 암기', L, yc - 6); yc += 4; }
      else ctx.fillText('가장 긴 연속 암기', L, yc + ch - 4);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(cL, yc, cR - cL, ch);
      ctx.fillStyle = T.figAccent; ctx.fillRect(cL, yc, CX(Math.min(20, longest)) - cL, ch);
      var xc = CX(st.crit);
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(xc, yc - 6); ctx.lineTo(xc, yc + ch + 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('임계 암기 ' + st.crit + ' h', xc, yc + ch + 20);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'left'; ctx.fillText('0', cL, yc + ch + 14); ctx.textAlign = 'right'; ctx.fillText('20 h', cR, yc + ch + 14);
      // ── 두 식물
      var py = yc + ch + (narrow ? 34 : 34), ph = h - py - 8;
      var colW = (R - L) / 2;
      plant(T, L, py, colW - 8, ph, '단일 식물', '국화', V.s, 'amber');
      plant(T, L + colW + 8, py, colW - 8, ph, '장일 식물', '시금치', V.l, 'violet');
      rN.set(longest.toFixed(1) + ' h');
      var last = st.flash === 'none' ? '' : st.flash === 'RF' ? 'FR' : 'R';
      rP.set(last === 'R' ? 'Pfr로 바뀜 → 밤이 끊김' : last === 'FR' ? 'R 효과 취소 → 밤이 이어짐' : '어둠 속 Pfr → Pr');
      rS.set(word(V.s)); rL.set(word(V.l));
    }
    function plant(T, x, y, w, h, title, ex, v, col) {
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
      var fs = w < 200 ? 11 : 13;
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(title, x + 8, y + fs + 6);
      ctx.fillStyle = T.figMuted; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('예: ' + ex, x + 8, y + 2 * fs + 10);
      var gx = x + w / 2, gy = y + h - 30, sh = Math.max(40, h - 2 * fs - 70);
      // 화분
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber;
      ctx.beginPath(); ctx.moveTo(gx - 24, gy); ctx.lineTo(gx + 24, gy); ctx.lineTo(gx + 18, gy + 22); ctx.lineTo(gx - 18, gy + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
      var flower = v === 'yes';
      var top = gy - (flower ? sh : sh * 0.6);
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, top); ctx.stroke();
      ctx.fillStyle = T.figSoftGreen; ctx.lineWidth = 1.5;
      for (var i = 0; i < 3; i++) {
        var ly = gy - 12 - i * (gy - top - 10) / 3, s = i % 2 ? -1 : 1;
        ctx.beginPath(); ctx.ellipse(gx + s * 14, ly, 14, 6, s * -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      if (flower) {
        ctx.fillStyle = T['fig' + (col === 'amber' ? 'Amber' : 'Violet')];
        for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; ctx.beginPath(); ctx.ellipse(gx + Math.cos(a) * 10, top + Math.sin(a) * 10, 7, 4, a, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = T.figSoftAmber; ctx.beginPath(); ctx.arc(gx, top, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.ellipse(gx, top - 4, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.textAlign = 'right'; ctx.font = '600 ' + (fs + 1) + 'px ' + T.fontBody;
      ctx.fillStyle = v === 'yes' ? T.figGreen : v === 'no' ? T.figMuted : T.figAmber;
      ctx.fillText(v === 'yes' ? '개화' : v === 'no' ? '개화 안 함' : '경계', x + w - 8, y + fs + 6);
    }
    api.onResize(draw);
    draw();
  },
});
