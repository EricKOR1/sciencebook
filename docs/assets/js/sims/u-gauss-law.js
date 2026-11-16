/* 일반물리학 8 전기장과 전위: 가우스 법칙 — 가우스 구면의 반지름을 바꾸며 둘러싼 전하, 선속, E(r) 보기 */
Sims.register('u-gauss-law', {
  title: '가우스 법칙 — 구면을 키우며 둘러싼 전하·선속·E(r) 읽기',
  caption: '전하 분포를 고르고 가우스 구면(청록 점선)의 반지름 r을 바꿔 보자. 화살표는 곡면 위 각 점에서 바깥 법선 방향의 전기장 성분 E·n̂이다(파랑은 안쪽). 알짜 선속 Φ = q안/ε₀는 언제나 곡면 안의 전하로만 정해지고, 대칭이면 곡면 위의 E가 고르므로 E = Φ/(4πr²)로 전기장까지 구할 수 있다. 전하가 중심을 벗어나면 Φ는 그대로지만 E가 곳곳에서 달라(오른쪽 그래프의 띠) 가우스 법칙만으로는 E를 구할 수 없다. 전하 Q = 8.0 nC, 구의 반지름 R = 5.0 cm(예제 7)이며 단면만 그렸다.',
  init: function (api) {
    var K = 8.99e9, EPS = 8.854e-12, Q = 8.0e-9, RS = 0.05, A_OFF = 0.03, RMAX = 0.15;
    var kinds = ['점전하', '균일한 구(절연체)', '얇은 구 껍질', '중심을 벗어난 점전하'];
    var st = { kind: 1, r: 0.07 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.56; }, label: '전하 분포와 가우스 구면 단면, E(r)와 둘러싼 전하 그래프' });
    var ctx = cv.ctx;

    var rQ = api.readout('둘러싼 전하 q안');
    var rPhi = api.readout('알짜 선속 Φ = q안/ε₀');
    var rE = api.readout('곡면 위 전기장');

    var g = api.group();
    var btns = kinds.map(function (k, i) {
      return api.button(k, function () { st.kind = i; btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }, { toggle: true, pressed: i === st.kind, parent: g });
    });
    api.slider({ id: 'u-gauss-law-r', label: '가우스 구면의 반지름 r', min: 0.5, max: 15, step: 0.1, value: st.r * 100,
      format: function (v) { return v.toFixed(1) + ' cm'; }, onInput: function (v) { st.r = v / 100; draw(); } });

    function qenc(kind, r) {
      if (kind === 0) return Q;
      if (kind === 1) return r >= RS ? Q : Q * Math.pow(r / RS, 3);
      if (kind === 2) return r >= RS ? Q : 0;
      return r > A_OFF ? Q : 0;
    }
    // 중심을 벗어난 점전하: 곡면 위 각 θ에서 법선 성분
    function enOff(r, th) {
      var d2 = r * r + A_OFF * A_OFF - 2 * A_OFF * r * Math.cos(th);
      return K * Q * (r - A_OFF * Math.cos(th)) / Math.pow(d2, 1.5);
    }
    function enRange(r) {
      var lo = Infinity, hi = -Infinity;
      for (var i = 0; i <= 180; i++) { var e = enOff(r, Math.PI * i / 180); if (e < lo) lo = e; if (e > hi) hi = e; }
      return [lo, hi];
    }
    function eSym(kind, r) { return K * qenc(kind, r) / (r * r); }
    function sci(v, unit) {
      if (v === 0) return '0 ' + unit;
      var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
      var sup = String(e).split('').map(function (c) { return { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c]; }).join('');
      return m.toFixed(2) + '×10' + sup + ' ' + unit;
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { sc: { x: 0, y: 0, w: w, h: w * 0.92 }, g1: { x: 0, y: w * 0.94, w: w, h: (h - w * 0.94) * 0.55 }, g2: { x: 0, y: w * 0.94 + (h - w * 0.94) * 0.55, w: w, h: (h - w * 0.94) * 0.45 } };
      return { sc: { x: 0, y: 0, w: w * 0.42, h: h }, g1: { x: w * 0.44, y: 0, w: w * 0.56, h: h * 0.56 }, g2: { x: w * 0.44, y: h * 0.56, w: w * 0.56, h: h * 0.44 } };
    }
    function draw() {
      var T = api.tokens(), Lo = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, Lo.sc); drawE(T, Lo.g1); drawQ(T, Lo.g2);
      var q = qenc(st.kind, st.r);
      rQ.set((q * 1e9).toFixed(2) + ' nC');
      rPhi.set(Math.round(q / EPS) + ' N·m²/C');
      if (st.kind === 3) { var rg = enRange(st.r); rE.set('고르지 않음: E·n̂ ' + sci(rg[0], '') + '~' + sci(rg[1], 'N/C')); }
      else rE.set('E = ' + sci(eSym(st.kind, st.r), 'N/C') + ' (어디서나 같음)');
    }
    function drawScene(T, b) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, sc = (Math.min(b.w, b.h) / 2 - 14) / RMAX;
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
      // 전하 분포
      if (st.kind === 1) {
        ctx.beginPath(); ctx.arc(cx, cy, RS * sc, 0, 7); ctx.fillStyle = T.figSoftRed; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = T.figRed; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) { var px = i * RS * 0.36, py = j * RS * 0.36; if (px * px + py * py < RS * RS * 0.8) ctx.fillText('+', cx + px * sc, cy + py * sc + 4); }
      } else if (st.kind === 2) {
        ctx.beginPath(); ctx.arc(cx, cy, RS * sc, 0, 7); ctx.strokeStyle = T.figRed; ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = T.figRed; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; ctx.fillText('+', cx + Math.cos(a) * (RS * sc + 10), cy + Math.sin(a) * (RS * sc + 10) + 4); }
      } else {
        var ox = st.kind === 3 ? A_OFF * sc : 0;
        ctx.beginPath(); ctx.arc(cx + ox, cy, 7, 0, 7); ctx.fillStyle = T.figRed; ctx.fill();
        ctx.fillStyle = T.figPanel; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('+', cx + ox, cy + 4);
        if (st.kind === 3) { ctx.fillStyle = T.figMuted; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill(); }
      }
      // 가우스 구면
      var rp = st.r * sc;
      ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 7);
      ctx.globalAlpha = 0.25; ctx.fillStyle = T.figSoftTeal; ctx.fill(); ctx.globalAlpha = 1;
      ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      // 법선 성분 화살표
      var Eref = K * Q / (RS * RS), N = 16;
      for (var n = 0; n < N; n++) {
        var th = (n + 0.5) * 2 * Math.PI / N, en = st.kind === 3 ? enOff(st.r, th) : eSym(st.kind, st.r);
        var len = Math.sign(en) * Math.min(46, 30 * Math.sqrt(Math.abs(en) / Eref));
        if (Math.abs(len) < 1.5) continue;
        var x0 = cx + Math.cos(th) * rp, y0 = cy - Math.sin(th) * rp;
        arrow(x0, y0, x0 + Math.cos(th) * len, y0 - Math.sin(th) * len, en >= 0 ? T.figAccent : T.figBlue);
      }
      // r 표시
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - rp * 0.707, cy + rp * 0.707); ctx.stroke();
      ctx.fillStyle = T.figTeal; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('r', cx - rp * 0.36 - 4, cy + rp * 0.36 + 2);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(kinds[st.kind] + (st.kind === 1 || st.kind === 2 ? ' (R = 5 cm)' : st.kind === 3 ? ' (중심에서 3 cm)' : ''), b.x + 12, b.y + 22);
      ctx.fillText('단면 ±15 cm', b.x + 12, b.y + b.h - 14);
    }
    function arrow(x1, y1, x2, y2, col) {
      var a = Math.atan2(y2 - y1, x2 - x1), hs = 6;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hs * 0.7, y2 - Math.sin(a) * hs * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - hs * Math.cos(a - 0.45), y2 - hs * Math.sin(a - 0.45)); ctx.lineTo(x2 - hs * Math.cos(a + 0.45), y2 - hs * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    function frame(T, b, ylab, ymax, yticks, fmtY) {
      var L = b.x + 50, R = b.x + b.w - 10, Tp = b.y + 24, B = b.y + b.h - 34;
      var o = { L: L, R: R, T: Tp, B: B, sx: function (r) { return L + r / RMAX * (R - L); }, sy: function (v) { return B - Math.min(v / ymax, 1.04) * (B - Tp); } };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      [0, 5, 10, 15].forEach(function (cm) { var x = o.sx(cm / 100); ctx.beginPath(); ctx.moveTo(x, Tp); ctx.lineTo(x, B); ctx.stroke(); ctx.fillText(cm, x, B + 13); });
      ctx.textAlign = 'right';
      yticks.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, o.sy(v)); ctx.lineTo(R, o.sy(v)); ctx.stroke(); ctx.fillText(fmtY(v), L - 5, o.sy(v) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(ylab, b.x + 6, b.y + 14);
      ctx.textAlign = 'right'; ctx.fillText('r (cm)', R, B + 28);
      // R 표시
      if (st.kind === 1 || st.kind === 2) { ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(o.sx(RS), Tp); ctx.lineTo(o.sx(RS), B); ctx.stroke(); ctx.setLineDash([]); }
      return o;
    }
    function drawE(T, b) {
      var ymax = 5e4;
      var o = frame(T, b, '곡면 위 전기장 E (10⁴ N/C)', ymax, [0, 1e4, 2e4, 3e4, 4e4, 5e4], function (v) { return v / 1e4; });
      ctx.save(); ctx.beginPath(); ctx.rect(o.L, o.T - 6, o.R - o.L, o.B - o.T + 6); ctx.clip();
      if (st.kind === 3) {
        // 띠: 곡면 위 E·n̂의 최솟값~최댓값
        var top = [], bot = [];
        for (var i = 1; i <= 140; i++) { var r = RMAX * i / 140, rg = enRange(r); top.push([o.sx(r), o.sy(rg[1])]); bot.push([o.sx(r), o.sy(Math.max(rg[0], -2e4))]); }
        ctx.beginPath(); top.forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
        for (var j = bot.length - 1; j >= 0; j--) ctx.lineTo(bot[j][0], bot[j][1]);
        ctx.closePath(); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      }
      ctx.beginPath();
      for (var k = 1; k <= 300; k++) { var rr = RMAX * k / 300, y = o.sy(eSym(st.kind, rr)); if (k === 1) ctx.moveTo(o.sx(rr), y); else ctx.lineTo(o.sx(rr), y); }
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.restore();
      var e = eSym(st.kind, st.r);
      ctx.beginPath(); ctx.arc(o.sx(st.r), o.sy(e), 5.5, 0, 7); ctx.fillStyle = T.figTeal; ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(st.kind === 3 ? '선: Φ/(4πr²) (평균)   띠: 실제 E·n̂ 범위' : '선: E = Φ/(4πr²)', o.R, o.T + 12);
    }
    function drawQ(T, b) {
      var o = frame(T, b, '둘러싼 전하 q안 (nC)', 9e-9, [0, 4e-9, 8e-9], function (v) { return Math.round(v * 1e9); });
      ctx.beginPath();
      for (var k = 0; k <= 300; k++) { var rr = RMAX * k / 300, y = o.sy(qenc(st.kind, rr)); if (k === 0) ctx.moveTo(o.sx(rr), y); else ctx.lineTo(o.sx(rr), y); }
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(o.sx(st.r), o.sy(qenc(st.kind, st.r)), 5, 0, 7); ctx.fillStyle = T.figTeal; ctx.fill();
    }
    api.onResize(draw);
    draw();
  },
});
