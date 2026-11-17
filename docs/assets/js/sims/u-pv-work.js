/* 일반화학 3 열화학: 반응이 하는 PV 일 — 일정 압력(피스톤)과 일정 부피(단단한 통)에서 q, w, ΔU, ΔH 비교 */
Sims.register('u-pv-work', {
  title: '반응이 하는 PV 일 — 일정 압력과 일정 부피에서 다른 열',
  caption: '반응과 조건을 고르고 「반응 진행 정도」를 끝까지 밀어 보자. 피스톤(일정 압력)에서는 기체 몰수가 변하는 만큼 부피가 변하고, P–V 그래프의 직사각형 넓이 P외부·ΔV가 일의 크기이다(w = −P외부ΔV). 단단한 통(일정 부피)에서는 부피가 그대로라 넓이가 0이고 w = 0이다. ΔU와 ΔH는 두 조건에서 같지만 출입하는 열 q는 Δn기체·RT만큼 다르다. 25 °C로 온도가 유지되고(처음과 나중 온도가 같음), 기체는 이상 기체, 고체·액체의 부피는 무시했다. 외부 압력은 1.00 atm, 반응식 1 mol 기준이다.',
  init: function (api) {
    var R = 8.314e-3, TK = 298.15, RTL = 0.08206 * 298.15;   // kJ/(mol·K), L·atm/mol
    var RX = [
      { name: 'CH₄ 연소', eq: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)', nr: 3, np: 1, dH: -890.3 },
      { name: '암모니아 합성', eq: 'N₂(g) + 3H₂(g) → 2NH₃(g)', nr: 4, np: 2, dH: -92.2 },
      { name: '탄소 연소', eq: 'C(s) + O₂(g) → CO₂(g)', nr: 1, np: 1, dH: -393.5 },
      { name: 'CaCO₃ 분해', eq: 'CaCO₃(s) → CaO(s) + CO₂(g)', nr: 0, np: 1, dH: 178.3 },
    ];
    var VMAX = 100, PMAX = 4;
    var st = { r: 0, constP: true, xi: 1 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.6 : 0.56; }, label: '피스톤 또는 단단한 통 속의 반응, P–V 그래프, 에너지 장부' });
    var ctx = cv.ctx;
    var rq = api.readout('열 q');
    var rw = api.readout('일 w');
    var rU = api.readout('ΔU');
    var rH = api.readout('ΔH');

    var gr = api.group();
    var rb = RX.map(function (x, i) {
      return api.button(x.name, function () { st.r = i; rb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); update(); }, { toggle: true, pressed: i === 0, parent: gr });
    });
    var gc = api.group();
    var cb = [['일정 압력 (피스톤)', true], ['일정 부피 (단단한 통)', false]].map(function (c, i) {
      return api.button(c[0], function () { st.constP = c[1]; cb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); update(); }, { toggle: true, pressed: i === 0, parent: gc });
    });
    api.slider({ id: 'u-pv-work-xi', label: '반응 진행 정도', min: 0, max: 1, step: 0.01, value: st.xi,
      format: function (v) { return v.toFixed(2) + ' mol'; }, onInput: function (v) { st.xi = v; update(); } });

    function X() { return RX[st.r]; }
    function calc() {
      var x = X(), xi = st.xi, dn = x.np - x.nr;
      var ngas = x.nr + dn * xi;
      var V0 = x.nr > 0 ? x.nr * RTL : RTL;      // 단단한 통의 부피(기체가 없으면 1 mol 크기의 통)
      var V = st.constP ? ngas * RTL : V0;
      var P = st.constP ? 1.0 : ngas * RTL / V0;
      var P0 = st.constP ? 1.0 : x.nr * RTL / V0;
      var dH = x.dH * xi, dU = (x.dH - dn * R * TK) * xi;
      var w = st.constP ? -dn * R * TK * xi : 0;
      var q = st.constP ? dH : dU;
      return { dn: dn, ngas: ngas, V0: st.constP ? x.nr * RTL : V0, V: V, P: P, P0: P0, dH: dH, dU: dU, w: w, q: q };
    }
    function kj(v) { return (v > 0.005 ? '+' : v < -0.005 ? '−' : '') + Math.abs(v).toFixed(2) + ' kJ'; }
    function update() {
      var c = calc();
      rq.set(kj(c.q)); rw.set(kj(c.w)); rU.set(kj(c.dU)); rH.set(kj(c.dH));
      draw();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, c = calc();
      ctx.clearRect(0, 0, w, h);
      var P1 = narrow ? { x: 0, y: 0, w: w, h: h * 0.33 } : { x: 0, y: 0, w: w * 0.3, h: h };
      var P2 = narrow ? { x: 0, y: h * 0.35, w: w, h: h * 0.36 } : { x: w * 0.32, y: 0, w: w * 0.68, h: h * 0.6 };
      var P3 = narrow ? { x: 0, y: h * 0.73, w: w, h: h * 0.27 } : { x: w * 0.32, y: h * 0.63, w: w * 0.68, h: h * 0.37 };
      drawVessel(T, P1, c); drawPV(T, P2, c); drawLedger(T, P3, c);
    }
    function hash(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
    function drawVessel(T, r, c) {
      var x = X(), cw = Math.min(120, r.w * 0.5), cx = r.x + r.w / 2, bot = r.y + r.h - 34, Hmax = r.h - 96;
      var hv = Math.max(4, (c.V / VMAX) * Hmax), topY = bot - hv;
      var left = cx - cw / 2;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(st.constP ? '피스톤 (P외부 = 1.00 atm)' : '단단한 강철 통', cx, r.y + 16);
      // 기체 영역
      ctx.fillStyle = T.figSoftTeal; ctx.fillRect(left, topY, cw, hv);
      // 분자(반응물 기체: 파랑, 생성물 기체: 빨강) 1 mol당 6개
      var nR = Math.round(x.nr * (1 - st.xi) * 6), nP = Math.round(x.np * st.xi * 6);
      for (var i = 0; i < nR + nP; i++) {
        ctx.fillStyle = i < nR ? T.figBlue : T.figRed;
        ctx.beginPath(); ctx.arc(left + 6 + hash(i) * (cw - 12), topY + 6 + hash(i + 50) * Math.max(0, hv - 12), 3.2, 0, Math.PI * 2); ctx.fill();
      }
      // 고체·액체
      var cond = x.name === 'CH₄ 연소' ? st.xi : (x.name === '탄소 연소' ? 1 - st.xi : x.name === 'CaCO₃ 분해' ? 1 : 0);
      if (cond > 0.001) { ctx.fillStyle = x.name === 'CH₄ 연소' ? T.figSoftBlue : T.figSoftAmber; ctx.fillRect(left + 2, bot - 6, cw - 4, 6); }
      // 벽
      ctx.strokeStyle = T.figInk; ctx.lineWidth = st.constP ? 2 : 5;
      if (st.constP) {
        ctx.beginPath(); ctx.moveTo(left, r.y + 42); ctx.lineTo(left, bot); ctx.lineTo(left + cw, bot); ctx.lineTo(left + cw, r.y + 42); ctx.stroke();
        ctx.fillStyle = T.figLine; ctx.fillRect(left + 1, topY - 10, cw - 2, 10);
        ctx.fillRect(cx - 4, Math.max(r.y + 26, topY - 30), 8, topY - 10 - Math.max(r.y + 26, topY - 30));
        // 처음 피스톤 위치
        var y0 = bot - Math.max(4, (c.V0 / VMAX) * Hmax);
        ctx.strokeStyle = T.figMuted; ctx.setLineDash([4, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left - 8, y0); ctx.lineTo(left + cw + 8, y0); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('처음', left + cw + 10, y0 + 4);
      } else {
        ctx.strokeRect(left, topY, cw, hv);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('기체 ' + c.ngas.toFixed(2) + ' mol, ' + c.V.toFixed(1) + ' L, ' + c.P.toFixed(2) + ' atm', cx, bot + 18);
      // 범례
      ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(r.x + 10, r.y + 30, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = T.figMuted; ctx.fillText('반응물 기체', r.x + 17, r.y + 34);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(r.x + 92, r.y + 30, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = T.figMuted; ctx.fillText('생성물 기체', r.x + 99, r.y + 34);
    }
    function drawPV(T, r, c) {
      var L = r.x + 46, Rr = r.x + r.w - 12, Tp = r.y + 28, B = r.y + r.h - 34;
      var sx = function (v) { return L + (v / VMAX) * (Rr - L); }, sy = function (p) { return B - (p / PMAX) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var p = 0; p <= PMAX; p++) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(Rr, sy(p)); ctx.stroke(); ctx.fillText(String(p), L - 5, sy(p) + 4); }
      ctx.textAlign = 'center';
      for (var v = 0; v <= VMAX; v += 20) ctx.fillText(String(v), sx(v), B + 14);
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('기체의 부피 V (L)', (L + Rr) / 2, B + 29);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('압력 (atm)', 0, 0); ctx.restore();
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(X().eq, r.x + 8, r.y + 14);
      // 경로와 넓이
      if (st.constP) {
        var a = sx(Math.min(c.V0, c.V)), b = sx(Math.max(c.V0, c.V));
        ctx.fillStyle = T.figSoftViolet; ctx.fillRect(a, sy(1), b - a, B - sy(1));
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(sx(c.V0), sy(1)); ctx.lineTo(sx(c.V), sy(1)); ctx.stroke();
        dot(sx(c.V0), sy(1), T.figMuted, T); dot(sx(c.V), sy(1), T.figViolet, T);
        ctx.fillStyle = T.figViolet; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        var lab = Math.abs(c.V - c.V0) < 0.05 ? 'ΔV = 0 → 넓이 0, w = 0' : '넓이 = P외부·|ΔV| = |w| = ' + Math.abs(c.w).toFixed(2) + ' kJ';
        ctx.fillText(lab, Math.max(L + 6, Math.min(sx(Math.min(c.V0, c.V)), Rr - 250)), sy(1) - 10);
      } else {
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(sx(c.V), sy(c.P0)); ctx.lineTo(sx(c.V), sy(c.P)); ctx.stroke();
        dot(sx(c.V), sy(c.P0), T.figMuted, T); dot(sx(c.V), sy(c.P), T.figViolet, T);
        ctx.fillStyle = T.figViolet; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('부피가 그대로 → 넓이 0, w = 0 (압력만 변함)', Math.min(sx(c.V) + 10, Rr - 270), sy(Math.max(c.P0, c.P)) - 10);
      }
    }
    function dot(x, y, col, T) { ctx.fillStyle = col; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); ctx.stroke(); }
    function drawLedger(T, r, c) {
      var narrow = cv.w < 560;
      var x0 = r.x + 8, y = r.y + 14, col2 = r.x + (narrow ? 150 : 210);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody;
      ctx.fillText('에너지 장부 (계의 입장, 반응 ' + st.xi.toFixed(2) + ' mol)', x0, y);
      var rows = [
        [st.constP ? '열 q = q_P = ΔH' : '열 q = q_V = ΔU', c.q, T.figRed],
        [st.constP ? '일 w = −P외부ΔV = −Δn·RT' : '일 w = 0 (ΔV = 0)', c.w, T.figViolet],
        ['ΔU = q + w', c.dU, T.figAccent],
        ['ΔH = ΔU + Δn·RT', c.dH, T.figInk],
      ];
      ctx.font = '12px ' + T.fontBody;
      rows.forEach(function (rw, i) {
        var yy = y + 22 + i * 19;
        ctx.fillStyle = T.figInk; ctx.fillText(rw[0], x0, yy);
        ctx.fillStyle = rw[2]; ctx.font = '600 12px ' + T.fontMono; ctx.fillText(kj(rw[1]), col2 + (narrow ? 40 : 60), yy); ctx.font = '12px ' + T.fontBody;
      });
      ctx.fillStyle = T.figMuted;
      var note = 'Δn기체 = ' + (c.dn > 0 ? '+' : c.dn < 0 ? '−' : '') + Math.abs(c.dn) + ' mol, RT = 2.48 kJ/mol → q_P − q_V = ' + kj(c.dn * R * TK * st.xi);
      if (narrow) { ctx.fillText('Δn기체 = ' + (c.dn > 0 ? '+' : c.dn < 0 ? '−' : '') + Math.abs(c.dn) + ' mol, RT = 2.48 kJ/mol', x0, y + 22 + 4 * 19 + 2); ctx.fillText('→ q_P − q_V = ΔH − ΔU = ' + kj(c.dn * R * TK * st.xi), x0, y + 22 + 5 * 19 + 2); }
      else ctx.fillText(note, x0, y + 22 + 4 * 19 + 2);
    }
    api.onResize(draw);
    update();
  },
});
