/* 일반생명과학 12 막전위: 네른스트 식(평형 전위)과 골드먼 식(투과도로 가중한 막전위) */
Sims.register('u-membrane-potential', {
  title: '이온 농도와 투과도가 정하는 막전위 — 네른스트와 골드먼',
  caption: '바깥 K⁺·Na⁺ 농도를 바꾸면 그 이온의 평형 전위(네른스트 식)가 움직이고, 투과도 비를 바꾸면 막전위(골드먼 식)가 투과도가 큰 이온의 평형 전위 쪽으로 끌려간다. "정점" 단추로 P_Na를 P_K의 20배로 올리면 막전위가 E_Na 쪽으로 뛰어오르는 것을 확인해 보자. 37 °C, 세포 안 농도(K⁺ 140, Na⁺ 15, Cl⁻ 10 mM)와 바깥 Cl⁻(110 mM)는 고정했고, 펌프의 직접 기여(수 mV)는 무시했다. 화살표는 막전위에서 각 이온이 실제로 움직이려는 방향이다.',
  init: function (api) {
    var RTF = 26.7, LOG = 61.5;   // mV, 37 °C
    var IN = { K: 140, Na: 15, Cl: 10 }, CL_OUT = 110;
    var s = { kOut: 5, naOut: 145, pNa: 0.04, pCl: 0.45 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.5; }, label: '막 양쪽의 이온 농도와 평형 전위, 막전위를 나타낸 그림' });
    var ctx = cv.ctx;

    var rVm = api.readout('막전위 V_m');
    var rK = api.readout('E_K');
    var rNa = api.readout('E_Na');
    var rCl = api.readout('E_Cl');

    var g = api.group();
    api.button('휴지 상태', function () { preset(5, 145, 0.04, 0.45); }, { parent: g });
    api.button('활동 전위 정점(P_Na = 20 P_K)', function () { preset(s.kOut, s.naOut, 20, 0.45); }, { parent: g });
    var sK = api.slider({ id: 'u-membrane-potential-k', label: '바깥 [K⁺]', min: Math.log10(1), max: Math.log10(140), step: 0.01, value: Math.log10(5),
      format: function (v) { return fmtC(Math.pow(10, v)) + ' mM'; }, onInput: function (v) { s.kOut = Math.pow(10, v); update(); } });
    var sNa = api.slider({ id: 'u-membrane-potential-na', label: '바깥 [Na⁺]', min: 15, max: 200, step: 1, value: 145,
      format: function (v) { return v + ' mM'; }, onInput: function (v) { s.naOut = v; update(); } });
    var sPNa = api.slider({ id: 'u-membrane-potential-pna', label: 'P_Na / P_K', min: -3, max: Math.log10(30), step: 0.01, value: Math.log10(0.04),
      format: function (v) { return fmtP(Math.pow(10, v)); }, onInput: function (v) { s.pNa = Math.pow(10, v); update(); } });
    var sPCl = api.slider({ id: 'u-membrane-potential-pcl', label: 'P_Cl / P_K', min: 0, max: 2, step: 0.01, value: 0.45,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { s.pCl = v; update(); } });

    function fmtC(c) { return c < 10 ? c.toFixed(1) : c.toFixed(0); }
    function fmtP(p) { return p < 0.01 ? p.toFixed(3) : p < 1 ? p.toFixed(2) : p.toFixed(1); }
    function preset(k, na, pna, pcl) {
      sK.set(Math.log10(k)); sNa.set(na); sPNa.set(Math.log10(pna)); sPCl.set(pcl);
    }
    function nernst(out, inn, z) { return LOG / z * Math.log10(out / inn); }
    function calc() {
      var num = s.kOut + s.pNa * s.naOut + s.pCl * IN.Cl;
      var den = IN.K + s.pNa * IN.Na + s.pCl * CL_OUT;
      return {
        EK: nernst(s.kOut, IN.K, 1), ENa: nernst(s.naOut, IN.Na, 1), ECl: nernst(CL_OUT, IN.Cl, -1),
        Vm: RTF * Math.log(num / den),
      };
    }
    function mv(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(0) + ' mV'; }
    function update() {
      var c = calc();
      rVm.set(mv(c.Vm)); rK.set(mv(c.EK)); rNa.set(mv(c.ENa)); rCl.set(mv(c.ECl));
      draw();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var c = calc();
      var A = stacked ? { x: 0, y: 0, w: w, h: h * 0.5 } : { x: 0, y: 0, w: w * 0.5, h: h };
      var B = stacked ? { x: 0, y: h * 0.52, w: w, h: h * 0.48 } : { x: w * 0.54, y: 0, w: w * 0.46, h: h };
      drawMembrane(T, A, c);
      drawScale(T, B, c);
    }

    function drawMembrane(T, r, c) {
      var ions = [
        { key: 'K', name: 'K⁺', out: s.kOut, inn: IN.K, E: c.EK, z: 1, col: T.figBlue, P: 1 },
        { key: 'Na', name: 'Na⁺', out: s.naOut, inn: IN.Na, E: c.ENa, z: 1, col: T.figRed, P: s.pNa },
        { key: 'Cl', name: 'Cl⁻', out: CL_OUT, inn: IN.Cl, E: c.ECl, z: -1, col: T.figGreen, P: s.pCl },
      ];
      var top = r.y + 30, bot = r.y + r.h - 12;
      var memY = (top + bot) / 2;
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      ctx.fillText('세포 밖', r.x + 8, top - 10);
      ctx.fillText('세포 안', r.x + 8, bot - 2);
      // 막(인지질 이중층)
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(r.x + 4, memY - 9, r.w - 8, 18);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(r.x + 4, memY - 9); ctx.lineTo(r.x + r.w - 4, memY - 9); ctx.moveTo(r.x + 4, memY + 9); ctx.lineTo(r.x + r.w - 4, memY + 9); ctx.stroke();
      var colW = (r.w - 70) / 3, maxBar = memY - 9 - top - 18;
      function barH(conc) { return Math.max(2, Math.log10(conc * 10) / Math.log10(2000) * maxBar); }   // 로그 눈금(0.1~200 mM)
      ions.forEach(function (ion, i) {
        var x = r.x + 62 + i * colW, bw = Math.min(38, colW * 0.36);
        // 바깥 막대
        var hO = barH(ion.out), hI = barH(ion.inn);
        ctx.fillStyle = ion.col; ctx.globalAlpha = 0.85;
        ctx.fillRect(x, memY - 9 - hO, bw, hO);
        ctx.fillRect(x, memY + 9, bw, hI);
        ctx.globalAlpha = 1;
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
        ctx.fillText(fmtC(ion.out), x + bw / 2, memY - 13 - hO);
        ctx.fillText(fmtC(ion.inn), x + bw / 2, memY + 21 + hI);
        ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = ion.col;
        ctx.fillText(ion.name, x + bw / 2, top - 10);
        // 이동 방향 화살표: 양이온은 V_m > E 이면 밖으로, 음이온은 V_m > E 이면 안으로
        var drive = c.Vm - ion.E;
        var outward = ion.z > 0 ? drive > 0 : drive < 0;
        var ax = x + bw + 14;
        var mag = Math.abs(drive);
        var lw = ion.P <= 0 ? 0 : Math.max(1.2, Math.min(7, 1.2 + Math.log10(1 + ion.P * mag) * 2.4));
        if (mag > 1 && lw > 0) {
          var y1 = outward ? memY + 26 : memY - 26, y2 = outward ? memY - 26 : memY + 26;
          ctx.strokeStyle = ion.col; ctx.fillStyle = ion.col; ctx.lineWidth = lw;
          ctx.beginPath(); ctx.moveTo(ax, y1); ctx.lineTo(ax, y2 + (outward ? 8 : -8)); ctx.stroke();
          ctx.beginPath(); var d = outward ? -1 : 1;
          ctx.moveTo(ax, y2); ctx.lineTo(ax - 6 - lw / 2, y2 - d * 10); ctx.lineTo(ax + 6 + lw / 2, y2 - d * 10); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
          ctx.fillText('평형', ax - 6, memY + 4);
        }
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('막대: 농도(mM, 로그 눈금) · 화살표 굵기: 투과도×추진력(모식)', r.x + 8, r.y + 12);
    }

    function drawScale(T, r, c) {
      var VMIN = -120, VMAX = 140;
      var top = r.y + 22, bot = r.y + r.h - 20, x = r.x + 70;
      var sy = function (v) { return bot - (v - VMIN) / (VMAX - VMIN) * (bot - top); };
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var v = -120; v <= 140; v += 40) {
        ctx.beginPath(); ctx.moveTo(x - 4, sy(v)); ctx.lineTo(x + 4, sy(v)); ctx.stroke();
        ctx.fillText(v, x - 8, sy(v) + 4);
      }
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, sy(0)); ctx.lineTo(r.x + r.w - 6, sy(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('막전위 (mV)', r.x + 4, r.y + 12);
      // 평형 전위 표시(겹치지 않게 글자만 살짝 밀기)
      var marks = [
        { name: 'E_K', v: c.EK, col: T.figBlue }, { name: 'E_Na', v: c.ENa, col: T.figRed }, { name: 'E_Cl', v: c.ECl, col: T.figGreen },
      ].sort(function (a, b) { return a.v - b.v; });
      var lastY = Infinity;
      marks.forEach(function (m) {
        var yy = sy(Math.max(VMIN, Math.min(VMAX, m.v)));
        ctx.strokeStyle = m.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 10, yy); ctx.lineTo(x + 34, yy); ctx.stroke();
        var ty = Math.min(yy + 4, lastY - 14); lastY = ty;
        ctx.fillStyle = m.col; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(m.name + ' ' + mv(m.v), x + 38, ty);
      });
      // 막전위
      var vy = sy(Math.max(VMIN, Math.min(VMAX, c.Vm)));
      var bx = Math.min(r.x + r.w - 70, x + 150);
      ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 2, vy); ctx.lineTo(x + 14, vy - 7); ctx.lineTo(x + 14, vy + 7); ctx.closePath(); ctx.fillStyle = T.figViolet; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 14, vy); ctx.lineTo(bx, vy); ctx.stroke();
      ctx.fillStyle = T.figViolet; ctx.font = '700 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('V_m ' + mv(c.Vm), bx + 4, vy + 4);
      // 골드먼 식의 가중치 설명
      var num = s.kOut + s.pNa * s.naOut + s.pCl * IN.Cl, den = IN.K + s.pNa * IN.Na + s.pCl * CL_OUT;
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'left';
      ctx.fillText('V_m = 26.7 ln(' + num.toFixed(1) + ' / ' + den.toFixed(1) + ')', x + 10, bot + 14);
    }

    api.onResize(draw);
    update();
  },
});
