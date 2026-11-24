/* 물리화학 9: 휘켈 계산기 — 선형 사슬·고리, π 전자 수, 결합 교대 */
Sims.register('mj-huckel-calculator', {
  title: '휘켈 계산기 — 사슬과 고리의 π 오비탈, 전하, 결합 차수',
  caption: '사슬/고리를 고르고 탄소 수 N, π 전자 수, 결합 교대 δ를 바꾸어 보자. 왼쪽은 에너지 준위 α + xβ(β < 0이므로 x가 클수록 낮다)와 전자 배치, 오른쪽 위는 고른 오비탈의 계수(원의 넓이 ∝ c², 색은 부호: 파랑 +, 빨강 −)와 각 원자의 π 전하(원자 아래), 결합의 π 결합 차수(결합 위)이다. 오른쪽 아래는 중성(π 전자 N개)일 때 HOMO–LUMO 간격을 짝수 N에 대해 그린 것으로, 사슬에서 δ = 0이면 0으로 다가가고 δ > 0이면 2·2δ|β|쯤에 머문다. 고리에서 π 전자를 4n + 2개로 하면 껍질이 꽉 차고, 4n개이면 축퇴한 비결합 준위가 반만 찬다. 휘켈 근사(겹침 무시, 이웃 원자 사이만 공명 적분 β(1 ± δ)를 번갈아 둠)이며, 축퇴 준위의 전자는 전하·결합 차수를 계산할 때 고르게 나누었다.',
  init: function (api) {
    var st = { ring: false, N: 6, ne: 6, d: 0, k: 3 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.9 : 0.68; }, label: '휘켈 에너지 준위도, 분자 오비탈 계수, HOMO–LUMO 간격 그래프' });
    var ctx = cv.ctx;
    var rE = api.readout('E_π'), rG = api.readout('HOMO–LUMO 간격'), rO = api.readout('고른 오비탈'), rSh = api.readout('껍질');
    var g = api.group();
    var bC = api.button('선형 사슬', function () { setRing(false); }, { toggle: true, pressed: true, parent: g });
    var bR = api.button('고리', function () { setRing(true); }, { toggle: true, pressed: false, parent: g });
    var sN = api.slider({ id: 'mj-huckel-calculator-n', label: '탄소 수 N', min: 2, max: 12, step: 1, value: st.N, format: function (v) { return String(v); },
      onInput: function (v) { if (st.ring && v < 3) { sN.set(3); return; } st.N = v; sE.input.max = 2 * v; st.ne = v; sE.input.value = v; sE.set(v); } });
    var sE = api.slider({ id: 'mj-huckel-calculator-e', label: 'π 전자 수', min: 0, max: 2 * st.N, step: 1, value: st.ne, format: function (v) { return String(v); },
      onInput: function (v) { st.ne = v; var r = solve(); lastSol = r; st.k = Math.max(1, r.homo + 1); sK.input.max = st.N; sK.input.value = st.k; sK.set(st.k); } });
    var sD = api.slider({ id: 'mj-huckel-calculator-d', label: '결합 교대 δ', min: 0, max: 0.3, step: 0.01, value: 0, format: function (v) { return v.toFixed(2) + ' (β(1 ± δ))'; },
      onInput: function (v) { st.d = v; draw(); } });
    var sK = api.slider({ id: 'mj-huckel-calculator-k', label: '그릴 오비탈 (아래부터)', min: 1, max: st.N, step: 1, value: st.k, format: function (v) { return 'ψ' + v + tag(v); },
      onInput: function (v) { st.k = v; draw(); } });
    function setRing(r) { st.ring = r; bC.setAttribute('aria-pressed', String(!r)); bR.setAttribute('aria-pressed', String(r)); if (r && st.N < 3) sN.set(3); else { sE.set(st.ne); } }
    var lastSol = null;
    function tag(v) { if (!lastSol) return ''; if (v - 1 === lastSol.homo) return ' (HOMO)'; if (v - 1 === lastSol.lumo) return ' (LUMO)'; return ''; }

    function jacobi(A) {
      var n = A.length, V = [], i, j, k, a = A.map(function (r) { return r.slice(); });
      for (i = 0; i < n; i++) { V.push([]); for (j = 0; j < n; j++) V[i].push(i === j ? 1 : 0); }
      for (var sweep = 0; sweep < 100; sweep++) {
        var off = 0; for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
        if (off < 1e-22) break;
        for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) {
          if (Math.abs(a[p][q]) < 1e-15) continue;
          var th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
          for (k = 0; k < n; k++) { var akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
          for (k = 0; k < n; k++) { var apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
          for (k = 0; k < n; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
        }
      }
      var out = [];
      for (i = 0; i < n; i++) { var vec = []; for (k = 0; k < n; k++) vec.push(V[k][i]); out.push({ x: a[i][i], c: vec }); }
      return out;
    }
    function matrix(N, ring, d) {
      var H = [], i, nb = ring ? N : N - 1;
      for (i = 0; i < N; i++) { H.push([]); for (var j = 0; j < N; j++) H[i].push(0); }
      if (N === 2 && ring) nb = 1;
      for (i = 0; i < nb; i++) { var a = i, b = (i + 1) % N, v = 1 + (i % 2 === 0 ? d : -d); H[a][b] = v; H[b][a] = v; }
      return H;
    }
    function solve(N, ring, d, ne) {
      N = N || st.N; ring = (ring === undefined) ? st.ring : ring; d = (d === undefined) ? st.d : d; ne = (ne === undefined) ? st.ne : ne;
      var orb = jacobi(matrix(N, ring, d)).sort(function (p, q) { return q.x - p.x; });
      orb.forEach(function (o) { var m = 0, s = 0; o.c.forEach(function (v) { if (Math.abs(v) > Math.abs(m) + 1e-9) m = v; s += v; }); if ((Math.abs(s) > 1e-6 ? s : m) < 0) o.c = o.c.map(function (v) { return -v; }); });
      // 축퇴 묶음
      var groups = [], i = 0;
      while (i < N) { var gr = [i]; while (i + gr.length < N && Math.abs(orb[i + gr.length].x - orb[i].x) < 1e-6) gr.push(i + gr.length); groups.push(gr); i += gr.length; }
      var left = ne, occ = new Array(N).fill(0), arrows = new Array(N).fill(''), homo = -1, lumo = -1, open = false;
      groups.forEach(function (gr) {
        var cap = 2 * gr.length, put = Math.min(cap, left); left -= put;
        gr.forEach(function (j) { occ[j] = put / gr.length; });
        var partial = put > 0 && put < cap;
        if (partial && gr.length > 1) open = true;
        gr.forEach(function (j, t) { var n = (put >= gr.length + t + 1) ? 2 : (put >= t + 1 ? 1 : 0); arrows[j] = n === 2 ? '↑↓' : n === 1 ? '↑' : ''; });
        if (put > 0) homo = gr[gr.length - 1];
        if (lumo < 0 && !(put > 0) ) lumo = gr[0];
        if (lumo < 0 && partial && gr.length > 1) lumo = gr[0];
      });
      var q = [], p = [];
      for (var a = 0; a < N; a++) { var s = 0; for (var k = 0; k < N; k++) s += occ[k] * orb[k].c[a] * orb[k].c[a]; q.push(s); }
      var nb = st.ring && N > 2 ? N : N - 1;
      for (var b = 0; b < (ring && N > 2 ? N : N - 1); b++) { var u = b, v = (b + 1) % N, s2 = 0; for (k = 0; k < N; k++) s2 += occ[k] * orb[k].c[u] * orb[k].c[v]; p.push(s2); }
      var Epi = 0; for (k = 0; k < N; k++) Epi += occ[k] * orb[k].x;
      var gap = (homo >= 0 && lumo >= 0) ? orb[homo].x - orb[lumo].x : NaN;
      if (open) gap = 0;
      // HOMO/LUMO: 열린 껍질이면 HOMO = 반쯤 찬 준위
      var homoIdx = homo, lumoIdx = open ? -1 : lumo;
      return { orb: orb, occ: occ, arrows: arrows, q: q, p: p, Epi: Epi, gap: gap, homo: homoIdx, lumo: lumoIdx, open: open, groups: groups };
    }
    function f2(v, d) { var s = Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v; return (s < 0 ? '−' : s > 0 ? '+' : '') + Math.abs(s).toFixed(d); }

    function panelLevels(T, sol, x0, y0, w, h) {
      var Tp = y0 + 34, B = y0 + h - 16, L = x0 + 34, Rr = x0 + w - 8, xm = (L + Rr) / 2 + 4;
      var sy = function (x) { return (Tp + B) / 2 + x / 2.45 * (B - Tp) / 2; };   // x = +2 아래
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('준위 α + xβ', x0 + 8, y0 + 18);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(Rr, sy(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      [2, 1, 0, -1, -2].forEach(function (x) { ctx.fillText(x === 0 ? 'α' : (x > 0 ? '+' : '−') + Math.abs(x), L - 6, sy(x) + 4); ctx.beginPath(); ctx.moveTo(L - 3, sy(x)); ctx.lineTo(L, sy(x)); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(L, Tp - 6); ctx.lineTo(L, B); ctx.stroke();
      ctx.save(); ctx.translate(x0 + 9, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody; ctx.fillText('x (β 단위, 위로 갈수록 높은 에너지)', 0, 0); ctx.restore();
      sol.groups.forEach(function (gr) {
        var n = gr.length, lw = Math.min(46, (Rr - L - 40) / n - 6), tot = n * lw + (n - 1) * 6, sx0 = xm - tot / 2;
        gr.forEach(function (j, t) {
          var xx = sx0 + t * (lw + 6), yy = sy(sol.orb[j].x);
          var sel = (j === st.k - 1), hl = (j === sol.homo) ? T.figAmber : (j === sol.lumo ? T.figGreen : null);
          if (sel) { ctx.fillStyle = T.figSoftViolet; ctx.fillRect(xx - 3, yy - 13, lw + 6, 17); }
          ctx.strokeStyle = hl || T.figInk; ctx.lineWidth = hl ? 3.2 : 2.2; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + lw, yy); ctx.stroke();
          if (sol.arrows[j]) { ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(sol.arrows[j], xx + lw / 2, yy - 3); }
        });
        var x = sol.orb[gr[0]].x, lab = '', last = gr[gr.length - 1];
        if (gr.indexOf(sol.homo) >= 0) lab = 'HOMO'; else if (gr.indexOf(sol.lumo) >= 0) lab = 'LUMO';
        ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        ctx.fillText(f2(x, 3), sx0 + tot + 6, sy(x) + 4);
        if (lab) { ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = lab === 'LUMO' ? T.figGreen : T.figAmber; ctx.textAlign = 'right'; ctx.fillText(lab, sx0 - 5, sy(x) + 4); }
      });
    }

    function positions(N, ring, x0, y0, w, h) {
      var P = [], i;
      if (ring) {
        var r = Math.min(w, h) * 0.27;
        for (i = 0; i < N; i++) { var a = -Math.PI / 2 + 2 * Math.PI * i / N; P.push([x0 + w / 2 + r * Math.cos(a), y0 + h / 2 + r * Math.sin(a)]); }
      } else {
        var dx = Math.min(56, (w - 50) / Math.max(1, N - 1)), dy = dx * 0.55, tot = dx * (N - 1);
        for (i = 0; i < N; i++) P.push([x0 + w / 2 - tot / 2 + i * dx, y0 + h / 2 + (i % 2 ? -dy / 2 : dy / 2)]);
      }
      return P;
    }
    function panelMol(T, sol, x0, y0, w, h) {
      var o = sol.orb[st.k - 1];
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('ψ' + st.k + tag(st.k) + ' 의 계수 · π 전하 · π 결합 차수', x0 + 8, y0 + 18);
      var P = positions(st.N, st.ring, x0 + 10, y0 + 26, w - 20, h - 40), N = st.N, i;
      var nb = st.ring && N > 2 ? N : N - 1, small = w < 400;
      ctx.lineWidth = 2.4; ctx.strokeStyle = T.figInk;
      for (i = 0; i < nb; i++) { var a = P[i], b = P[(i + 1) % N]; ctx.lineWidth = 1.6 + 2 * (1 + (i % 2 === 0 ? st.d : -st.d)) - 2 + 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      var dist = st.N > 1 ? Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) : 50, rmax = Math.min(20, dist * 0.42);
      for (i = 0; i < N; i++) {
        var c = o.c[i], r = rmax * Math.abs(c) / 0.75;
        if (Math.abs(c) > 1e-3) { ctx.globalAlpha = 0.55; ctx.fillStyle = c > 0 ? T.figBlue : T.figRed; ctx.beginPath(); ctx.arc(P[i][0], P[i][1], Math.max(2, Math.sqrt(Math.abs(c)) * rmax), 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = c > 0 ? T.figBlue : T.figRed; ctx.lineWidth = 1.4; ctx.stroke(); }
        ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(P[i][0], P[i][1], 3, 0, 7); ctx.fill();
      }
      // 숫자
      var cx = 0, cy = 0; P.forEach(function (p) { cx += p[0] / N; cy += p[1] / N; });
      ctx.font = (small ? '11px ' : '12px ') + T.fontMono; ctx.textAlign = 'center';
      for (i = 0; i < N; i++) {
        var ux, uy;
        if (st.ring) { ux = P[i][0] - cx; uy = P[i][1] - cy; var L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L; }
        else { ux = 0; uy = (i % 2 ? -1 : 1); }
        var off = rmax + 12;
        var ch = 1 - sol.q[i];
        ctx.fillStyle = Math.abs(ch) < 0.005 ? T.figMuted : (ch > 0 ? T.figBlue : T.figRed);
        ctx.fillText(f2(ch, 2).replace('+0.00', '0').replace('−0.00', '0'), P[i][0] + ux * off, P[i][1] + uy * off + 4);
      }
      ctx.fillStyle = T.figViolet;
      for (i = 0; i < nb; i++) {
        var a2 = P[i], b2 = P[(i + 1) % N], mx = (a2[0] + b2[0]) / 2, my = (a2[1] + b2[1]) / 2, vx, vy;
        if (st.ring) { vx = mx - cx; vy = my - cy; var l2 = Math.hypot(vx, vy) || 1; vx /= l2; vy /= l2; vx = -vx; vy = -vy; }
        else { vx = 0; vy = (i % 2 ? 1 : -1); }
        ctx.fillText(sol.p[i].toFixed(2), mx + vx * 20, my + vy * 20 + 4);
      }
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      ctx.fillText('원 넓이 ∝ c², 파랑 +, 빨강 −', x0 + 8, y0 + h - 6);
      ctx.textAlign = 'right'; ctx.fillStyle = T.figViolet; ctx.fillText('보라: π 결합 차수', x0 + w - 8, y0 + h - 6);
      ctx.fillStyle = T.figMuted; ctx.fillText('원자 옆: π 전하 1 − q', x0 + w - 8, y0 + h - 20);
    }

    function panelGap(T, x0, y0, w, h) {
      var L = x0 + 46, Rr = x0 + w - 12, Tp = y0 + 28, B = y0 + h - 34, Ns = [2, 4, 6, 8, 10, 12].filter(function (n) { return !st.ring || n >= 4; });
      var sx = function (n) { return L + (n - 2) / 10 * (Rr - L); }, sy = function (gp) { return B - gp / 2.8 * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('HOMO–LUMO 간격 / |β| (중성, π 전자 N개)', x0 + 8, y0 + 18);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [0, 1, 2].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(String(v), L - 5, sy(v) + 4); });
      [2, 4, 6, 8, 10, 12].forEach(function (n) { ctx.textAlign = 'center'; ctx.fillText(String(n), sx(n), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('N', (L + Rr) / 2, B + 29);
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      function series(d, color, tri) {
        var pts = Ns.map(function (n) { var s = solve(n, st.ring, d, n); return [n, isNaN(s.gap) ? 0 : s.gap]; });
        ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(sx(p[0]), sy(p[1])); else ctx.moveTo(sx(p[0]), sy(p[1])); }); ctx.stroke();
        pts.forEach(function (p) {
          var X = sx(p[0]), Y = sy(p[1]); ctx.fillStyle = color; ctx.beginPath();
          if (tri) { ctx.moveTo(X, Y - 6); ctx.lineTo(X + 5.5, Y + 4); ctx.lineTo(X - 5.5, Y + 4); ctx.closePath(); } else ctx.arc(X, Y, 4.5, 0, 7);
          ctx.fill();
        });
      }
      series(0, T.figBlue, false);
      if (st.d > 0) series(st.d, T.figRed, true);
      if (st.N % 2 === 0 && Ns.indexOf(st.N) >= 0) { ctx.strokeStyle = T.figInk; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sx(st.N), Tp); ctx.lineTo(sx(st.N), B); ctx.stroke(); ctx.setLineDash([]); }
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figBlue; ctx.fillText('● δ = 0', Rr - 6, Tp + 14);
      if (st.d > 0) { ctx.fillStyle = T.figRed; ctx.fillText('▲ δ = ' + st.d.toFixed(2), Rr - 6, Tp + 28); }
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, sol = solve();
      lastSol = sol;
      if (st.k > st.N) st.k = st.N;
      ctx.clearRect(0, 0, w, h);
      if (w < 560) { panelLevels(T, sol, 0, 0, w, h * 0.38); panelMol(T, sol, 0, h * 0.38, w, h * 0.34); panelGap(T, 0, h * 0.72, w, h * 0.28); }
      else { panelLevels(T, sol, 0, 0, w * 0.36, h); panelMol(T, sol, w * 0.36, 0, w * 0.64, h * 0.58); panelGap(T, w * 0.36, h * 0.58, w * 0.64, h * 0.42); }
      var n = st.ne, bx = sol.Epi;
      rE.set(n + 'α ' + (bx >= 0 ? '+ ' : '− ') + Math.abs(bx).toFixed(3) + 'β');
      rG.set(sol.open ? '0 (축퇴 준위가 반쯤 참)' : (isNaN(sol.gap) ? '–' : sol.gap.toFixed(3) + ' |β|'));
      var x = sol.orb[st.k - 1].x;
      rO.set('ψ' + st.k + ' = α ' + (x >= 0 ? '+ ' : '− ') + Math.abs(x).toFixed(3) + 'β');
      rSh.set(sol.open ? '열린 껍질 (홀전자 있음)' : (n % 2 ? '홀전자 1개' : '닫힌 껍질'));
      sK.input.max = st.N;
    }
    api.onResize(draw);
    draw();
  },
});
