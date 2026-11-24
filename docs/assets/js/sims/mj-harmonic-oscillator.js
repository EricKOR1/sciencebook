/* 물리화학 8 진동·회전 운동: 조화 진동자의 준위 사다리, 에르미트 함수, 고전 분포와 터널링 꼬리, H → D 치환 비교 */
Sims.register('mj-harmonic-oscillator', {
  title: '조화 진동자 탐색기 — 준위 사다리, 파동 함수, 금지 영역의 꼬리',
  caption: 'v, 힘 상수 k, 환산 질량 μ를 바꾸어 보자. 위 그래프는 포물선 퍼텐셜 ½kx²와 준위 사다리(간격 ħω), 고른 준위 위에 그린 ψᵥ이고, 아래 그래프는 |ψᵥ|²(실선)와 같은 에너지의 고전 확률 밀도(점선)이다. 전환점 바깥(주황)으로 스며 나간 꼬리가 고전적 금지 영역에서 발견될 확률이며, v가 커질수록 작아지고 |ψᵥ|²의 봉우리는 전환점 쪽으로 몰린다(대응 원리). 오른쪽 막대는 ⟨T⟩와 ⟨V⟩로, 어느 상태에서나 같다(비리얼 정리). ‘H 하나를 D로’는 결합의 가벼운 원자를 수소로 보고 μ를 바꾼 뒤, 바꾸기 전의 퍼텐셜·준위·ψ를 회색 점선으로 남겨 비교한다(k는 그대로). 순수한 조화 근사이므로 해리와 비조화성은 없다.',
  init: function (api) {
    var HBAR = 1.054571817e-34, U = 1.66053907e-27, C = 2.99792458e10, KJ = 0.0119627; // cm⁻¹ → kJ/mol
    var MH = 1.00783, MD = 2.01410;
    var st = { v: 0, k: 516, mu: 0.980, ghost: null, swapped: false };

    function props(k, mu) {
      var m = mu * U, w = Math.sqrt(k / m);
      return { w: w, nu: w / (2 * Math.PI * C), alpha: Math.sqrt(HBAR / (m * w)) * 1e12 };   // α (pm)
    }
    // 규격화된 에르미트 함수 ψ_n(y) (점화식, 넘침 없음)
    function psiAll(n, y) {
      var p0 = Math.pow(Math.PI, -0.25) * Math.exp(-y * y / 2), p1 = Math.SQRT2 * y * p0;
      if (n === 0) return p0;
      for (var j = 1; j < n; j++) { var p2 = Math.sqrt(2 / (j + 1)) * y * p1 - Math.sqrt(j / (j + 1)) * p0; p0 = p1; p1 = p2; }
      return p1;
    }
    function forbidden(n) {
      var yt = Math.sqrt(2 * n + 1), M = 800, b = yt + 9, h = (b - yt) / M, s = 0;
      for (var i = 0; i <= M; i++) { var y = yt + i * h, p = psiAll(n, y); s += (i === 0 || i === M ? 1 : (i % 2 ? 4 : 2)) * p * p; }
      return 2 * s * h / 3;
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.66; }, label: '조화 진동자의 퍼텐셜, 준위, 파동 함수와 확률 밀도' });
    var ctx = cv.ctx;
    var rNu = api.readout('ν̃'), rZpe = api.readout('영점 에너지'), rA = api.readout('α'), rTp = api.readout('전환점'), rF = api.readout('금지 영역 확률');

    var sV = api.slider({ id: 'mj-harmonic-oscillator-v', label: '양자수 v', min: 0, max: 20, step: 1, value: st.v, format: function (x) { return String(x); }, onInput: function (x) { st.v = x; draw(); } });
    var sK = api.slider({ id: 'mj-harmonic-oscillator-k', label: '힘 상수 k', min: 100, max: 2500, step: 1, value: st.k, format: function (x) { return x + ' N/m'; }, onInput: function (x) { st.k = x; draw(); } });
    var sM = api.slider({ id: 'mj-harmonic-oscillator-mu', label: '환산 질량 μ', min: 0.5, max: 30, step: 0.001, value: st.mu, format: function (x) { return x.toFixed(3) + ' u'; }, onInput: function (x) { st.mu = x; if (!st.lock) { st.ghost = null; st.swapped = false; swapBtn.textContent = 'H 하나를 D로'; } draw(); } });
    var g = api.group();
    var presets = [['H₂', 575, 0.504], ['HCl', 516, 0.980], ['CO', 1902, 6.856], ['N₂', 2295, 7.00], ['I₂', 172, 63.5]];
    presets.forEach(function (p) {
      if (p[2] > 30) return;
      api.button(p[0], function () { st.lock = true; st.ghost = null; st.swapped = false; swapBtn.textContent = 'H 하나를 D로'; sK.set(p[1]); sM.set(p[2]); st.lock = false; draw(); }, { parent: g });
    });
    var swapBtn = api.button('H 하나를 D로', function () {
      if (!st.swapped) {
        if (st.mu >= MH * 0.995) { msg = 'μ가 1 u보다 커서 수소를 포함한 결합으로 볼 수 없다'; draw(); return; }
        var m2 = st.mu * MH / (MH - st.mu), muD = m2 * MD / (m2 + MD);
        st.ghost = { k: st.k, mu: st.mu }; st.swapped = true; st.lock = true; sM.set(+muD.toFixed(3)); st.lock = false;
        swapBtn.textContent = 'D를 H로 되돌리기';
      } else {
        var gh = st.ghost; st.ghost = null; st.swapped = false; st.lock = true; sK.set(gh.k); sM.set(gh.mu); st.lock = false;
        swapBtn.textContent = 'H 하나를 D로';
      }
      draw();
    }, { primary: true, parent: g });
    var msg = '';

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var P = props(st.k, st.mu), G = st.ghost ? props(st.ghost.k, st.ghost.mu) : null;
      var v = st.v, yt = Math.sqrt(2 * v + 1);
      var E = function (n, pp) { return (n + 0.5) * pp.nu * KJ; };              // kJ/mol
      var aMax = Math.max(P.alpha, G ? G.alpha : 0);
      var XR = (yt + 2.6) * aMax;                                                // pm
      var vt = Math.max(v + 1.3, 3.6), Etop = Math.max(E(vt, P), G ? E(vt, G) : 0);
      var barW = narrow ? 0 : 92;
      var A = { x: 54, y: 12, w: w - 54 - 12 - barW, h: narrow ? h * 0.48 : h * 0.56 };
      var B = { x: 54, y: A.y + A.h + 46, w: A.w, h: narrow ? h * 0.26 : h - A.h - 46 - 52 };
      var sx = function (x) { return A.x + (x + XR) / (2 * XR) * A.w; };
      var sy = function (e) { return A.y + A.h - e / Etop * A.h; };
      ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule;
      // 가로 눈금(pm)
      var step = niceStep(XR / 2.5);
      ctx.textAlign = 'center';
      for (var t = -Math.floor(XR / step) * step; t <= XR + 1e-9; t += step) {
        ctx.beginPath(); ctx.moveTo(sx(t), A.y); ctx.lineTo(sx(t), A.y + A.h); ctx.stroke();
        ctx.fillText(fmt(t), sx(t), A.y + A.h + 13);
        ctx.beginPath(); ctx.moveTo(sx(t), B.y); ctx.lineTo(sx(t), B.y + B.h); ctx.stroke();
        ctx.fillText(fmt(t), sx(t), B.y + B.h + 13);
      }
      var es = niceStep(Etop / 4); ctx.textAlign = 'right';
      for (var e = 0; e <= Etop + 1e-9; e += es) { ctx.beginPath(); ctx.moveTo(A.x, sy(e)); ctx.lineTo(A.x + A.w, sy(e)); ctx.stroke(); ctx.fillText(fmt(e), A.x - 5, sy(e) + 4); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('x = r − rₑ (pm)', A.x + A.w / 2, A.y + A.h + 28);
      ctx.save(); ctx.translate(13, A.y + A.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('E (kJ/mol)', 0, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
      // 바꾸기 전(회색 점선)
      if (G) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.3;
        for (var n = 0; E(n, G) < Etop; n++) { var hx = Math.sqrt(2 * E(n, G) / (G.nu * KJ)) * G.alpha; ctx.beginPath(); ctx.moveTo(sx(-hx), sy(E(n, G))); ctx.lineTo(sx(hx), sy(E(n, G))); ctx.stroke(); }
        drawPsi(G, T.figMuted, false); ctx.setLineDash([]);
      }
      // 퍼텐셜 ½kx² (E/(kJ/mol) = (x/α)²·½ħω)
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var x = -XR + 2 * XR * i / 200, ee = 0.5 * (x / P.alpha) * (x / P.alpha) * P.nu * KJ; if (i) ctx.lineTo(sx(x), sy(ee)); else ctx.moveTo(sx(x), sy(ee)); }
      ctx.stroke();
      for (n = 0; E(n, P) < Etop; n++) {
        var hx2 = Math.sqrt(2 * n + 1) * P.alpha;
        ctx.strokeStyle = n === v ? T.figBlue : T.figLine; ctx.lineWidth = n === v ? 2 : 1.2;
        ctx.beginPath(); ctx.moveTo(sx(-hx2), sy(E(n, P))); ctx.lineTo(sx(hx2), sy(E(n, P))); ctx.stroke();
      }
      drawPsi(P, T.figBlue, true);
      ctx.restore();
      ctx.fillStyle = T.figPaper; ctx.globalAlpha = 0.82; ctx.fillRect(A.x + 2, A.y + 2, Math.min(250, A.w - 4), G || msg ? 50 : 34); ctx.globalAlpha = 1;
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figBlue;
      ctx.fillText('ψ' + sub(v) + '  (E' + sub(v) + ' = ' + E(v, P).toFixed(E(v, P) < 10 ? 2 : 1) + ' kJ/mol)', A.x + 6, A.y + 14);
      ctx.fillStyle = T.figAmber; ctx.font = '12px ' + T.fontBody; ctx.fillText('주황: 전환점 바깥의 꼬리', A.x + 6, A.y + 30);
      if (G) { ctx.fillStyle = T.figMuted; ctx.fillText('회색 점선: 바꾸기 전(μ = ' + st.ghost.mu.toFixed(3) + ' u)', A.x + 6, A.y + 46); }
      if (msg) { ctx.fillStyle = T.figRed; ctx.fillText(msg, A.x + 6, A.y + (G ? 62 : 46)); msg = ''; }

      // 아래: |ψ|²와 고전 분포
      var ymax = 0, NS = 400, ys = [];
      for (i = 0; i <= NS; i++) { var xx = -XR + 2 * XR * i / NS, p = psiAll(v, xx / P.alpha); ys.push(p * p / P.alpha); if (p * p / P.alpha > ymax) ymax = p * p / P.alpha; }
      var pclMin = 1 / (Math.PI * yt * P.alpha);
      ymax = Math.max(ymax, pclMin * 2.2) * 1.12;
      var by = function (d) { return B.y + B.h - d / ymax * B.h; };
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.strokeRect(B.x, B.y, B.w, B.h);
      ctx.fillStyle = T.figSoftAmber; var xt = yt * P.alpha;
      [-1, 1].forEach(function (sg) {
        ctx.beginPath(); ctx.moveTo(sx(sg > 0 ? xt : -XR), by(0));
        for (var j = 0; j <= NS; j++) { var x3 = -XR + 2 * XR * j / NS; if (sg * x3 >= xt) ctx.lineTo(sx(x3), by(ys[j])); }
        ctx.lineTo(sx(sg > 0 ? XR : -xt), by(0)); ctx.closePath(); ctx.fill();
      });
      ctx.save(); ctx.beginPath(); ctx.rect(B.x, B.y, B.w, B.h); ctx.clip();
      ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.8;
      [-1, 1].forEach(function (sg) {
        ctx.beginPath(); var first = true;
        for (var j = 0; j <= 300; j++) { var yy = sg * yt * (j / 300) * 0.99995, d = 1 / (Math.PI * P.alpha * Math.sqrt(2 * v + 1 - yy * yy)); var px = sx(yy * P.alpha), py = Math.max(by(d), B.y - 4); if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py); }
        ctx.stroke();
      });
      ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
      [-1, 1].forEach(function (sg) { ctx.beginPath(); ctx.moveTo(sx(sg * xt), B.y); ctx.lineTo(sx(sg * xt), B.y + B.h); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.2; ctx.beginPath();
      for (i = 0; i <= NS; i++) { var x4 = -XR + 2 * XR * i / NS; if (i) ctx.lineTo(sx(x4), by(ys[i])); else ctx.moveTo(sx(x4), by(ys[i])); }
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('|ψ' + sub(v) + '|² (실선), 고전 확률 밀도 (점선)', B.x + 6, B.y + 15);
      ctx.textAlign = 'center'; ctx.fillText('x (pm)', B.x + B.w / 2, B.y + B.h + 28);

      // ⟨T⟩, ⟨V⟩ 막대
      var Ev = E(v, P), half = Ev / 2;
      if (!narrow) {
        var bx = A.x + A.w + 26, top = A.y + 20, hh = A.h + B.h, bot = top + hh * 0.8;
        var bs = function (e) { return bot - e / Ev * (bot - top); };
        ctx.fillStyle = T.figRed; ctx.fillRect(bx, bs(half), 22, bot - bs(half));
        ctx.fillStyle = T.figGreen; ctx.fillRect(bx + 32, bs(half), 22, bot - bs(half));
        ctx.strokeStyle = T.figInk; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(bx - 4, bs(Ev)); ctx.lineTo(bx + 58, bs(Ev)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('⟨T⟩', bx + 11, bot + 16); ctx.fillText('⟨V⟩', bx + 43, bot + 16);
        ctx.fillText('Eᵥ', bx + 27, bs(Ev) - 6);
        ctx.font = '11px ' + T.fontMono; ctx.fillText(half.toFixed(half < 10 ? 2 : 1), bx + 27, bs(half) - 6);
        ctx.font = '11px ' + T.fontBody; ctx.fillText('kJ/mol', bx + 27, bot + 32);
      } else {
        var yb = B.y + B.h + 44, full = w - 54 - 20;
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('⟨T⟩', 14, yb + 11); ctx.fillText('⟨V⟩', 14, yb + 31);
        ctx.fillStyle = T.figRed; ctx.fillRect(54, yb, full / 2, 13);
        ctx.fillStyle = T.figGreen; ctx.fillRect(54, yb + 20, full / 2, 13);
        ctx.strokeStyle = T.figInk; ctx.strokeRect(54, yb - 2, full, 37);
        ctx.fillStyle = T.figInk; ctx.fillText('½Eᵥ = ' + half.toFixed(half < 10 ? 2 : 1) + ' kJ/mol', 54 + full / 2 + 6, yb + 22);
      }
      rNu.set(P.nu.toFixed(0) + ' cm⁻¹');
      rZpe.set((0.5 * P.nu * KJ).toFixed(2) + ' kJ/mol');
      rA.set(P.alpha.toFixed(2) + ' pm');
      rTp.set('±' + (yt * P.alpha).toFixed(2) + ' pm');
      rF.set(forbidden(v).toFixed(3));

      function drawPsi(pp, col, main) {
        var amp = 0.42 * pp.nu * KJ / Etop * A.h, base = sy(E(v, pp)), ytp = Math.sqrt(2 * v + 1);
        ctx.lineWidth = main ? 2 : 1.3;
        var prev = null;
        for (var j = 0; j <= 400; j++) {
          var x5 = -XR + 2 * XR * j / 400, y5 = x5 / pp.alpha, py5 = base - psiAll(v, y5) / 0.76 * amp, out = Math.abs(y5) > ytp;
          if (prev) {
            ctx.strokeStyle = main && out ? T.figAmber : col;
            ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(sx(x5), py5); ctx.stroke();
          }
          prev = [sx(x5), py5];
        }
      }
    }
    function sub(n) { return String(n).replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; }); }
    function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
    function fmt(x) { var s = Math.abs(x) < 1e-9 ? '0' : (Math.abs(x) >= 10 ? x.toFixed(0) : +x.toFixed(2) + ''); return s.replace('-', '−'); }
    api.onResize(draw);
    draw();
  },
});
