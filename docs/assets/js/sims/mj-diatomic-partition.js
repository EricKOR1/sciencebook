/* 물리화학 11 통계 열역학: 이원자 기체의 회전·진동 분배 함수와 열용량 탐색기 — 온도·회전 상수·진동 파수·대칭수를 바꾸며 점유, q, C_V, S°를 본다 */
Sims.register('mj-diatomic-partition', {
  title: '이원자 기체의 분배 함수와 열용량 탐색기',
  caption: '예시 분자를 고르거나 회전 상수 B, 진동 파수 ν̃, 대칭수 σ를 바꾼 뒤 온도 T를 옮겨 보자. 왼쪽 막대는 회전 준위 J = 0~20과 진동 준위 v = 0~5의 점유 비율, 오른쪽은 C_V,m/R을 log T에 대해 그린 곡선과 현재 온도의 점이다. T가 θ_R = hcB/k_B보다 충분히 크면 정확한 합 q_R이 고온 근사 T/σθ_R(+1/3)에 다가가고, T가 θ_V에 다가가야 진동이 풀려 열용량이 5/2에서 7/2로 오른다. 강체 회전자·조화 진동자, 이상 기체(1 bar), 전자 바닥 상태 하나(q_E = 1)를 가정했다. 회전의 정확한 합은 모든 J를 더한 뒤 σ로 나눈 값이라, 동핵 분자(σ = 2)에서 T가 θ_R에 가까우면 맞지 않는다(실제로는 핵스핀 통계로 짝수·홀수 J를 나누어야 한다). 병진 엔트로피에는 고른 예시 분자의 질량을 쓴다.',
  init: function (api) {
    var C2 = 1.4388, R = 8.314, KB = 1.380649e-23, H = 6.62607e-34, NA = 6.02214e23, P0 = 1e5;
    var MOLS = [
      { name: 'H₂', B: 60.85, nu: 4401, s: 2, M: 2.016 },
      { name: 'HCl', B: 10.59, nu: 2886, s: 1, M: 36.46 },
      { name: 'N₂', B: 1.998, nu: 2359, s: 2, M: 28.01 },
      { name: 'I₂', B: 0.0374, nu: 214.5, s: 2, M: 253.8 },
    ];
    var st = { k: 2, logT: Math.log10(298.15), B: 1.998, nu: 2359, s: 2, M: 28.01 };
    var TMIN = 10, TMAX = 5000;

    var cv = api.canvas({ aspect: function (w) { return w < 640 ? 1.75 : 0.5; }, label: '회전·진동 준위 점유 막대와 열용량–로그 온도 곡선' });
    var ctx = cv.ctx;
    var rQR = api.readout('q_R 정확한 합 / 고온 근사');
    var rQV = api.readout('q_V');
    var rC = api.readout('C_V,m/R');
    var rS = api.readout('S° 병진 + 회전 + 진동 (J/(mol·K))');
    var rW = api.readout('알림');

    var g0 = api.group();
    var mb = MOLS.map(function (m, i) { return api.button(m.name, function () { pick(i); }, { toggle: true, pressed: i === st.k, parent: g0 }); });
    var sT = api.slider({ id: 'mj-diatomic-partition-t', label: '온도 T', min: 1, max: Math.log10(TMAX), step: 0.0005, value: st.logT,
      format: function (v) { var T = Math.pow(10, v); return (T < 100 ? T.toFixed(1) : T.toFixed(0)) + ' K'; }, onInput: function (v) { st.logT = v; draw(); } });
    var sB = api.slider({ id: 'mj-diatomic-partition-b', label: '회전 상수 B', min: Math.log10(0.03), max: Math.log10(60.85), step: 0.0005, value: Math.log10(st.B),
      format: function (v) { var b = Math.pow(10, v); return (b < 1 ? b.toFixed(4) : b < 10 ? b.toFixed(3) : b.toFixed(2)) + ' cm⁻¹'; }, onInput: function (v) { st.B = Math.pow(10, v); clearPick(); draw(); } });
    var sN = api.slider({ id: 'mj-diatomic-partition-nu', label: '진동 파수 ν̃', min: 100, max: 4401, step: 0.5, value: st.nu,
      format: function (v) { return v.toFixed(v < 1000 ? 1 : 0) + ' cm⁻¹'; }, onInput: function (v) { st.nu = v; clearPick(); draw(); } });
    var g1 = api.group();
    var sb = [1, 2].map(function (s) { return api.button('σ = ' + s, function () { st.s = s; syncS(); clearPick(); draw(); }, { toggle: true, pressed: s === st.s, parent: g1 }); });

    function syncS() { sb.forEach(function (b, i) { b.setAttribute('aria-pressed', i + 1 === st.s ? 'true' : 'false'); }); }
    function clearPick() { mb.forEach(function (b, i) { var m = MOLS[i]; var same = Math.abs(m.B - st.B) / m.B < 0.01 && Math.abs(m.nu - st.nu) < 1 && m.s === st.s; b.setAttribute('aria-pressed', same ? 'true' : 'false'); }); }
    function pick(i) {
      var m = MOLS[i]; st.k = i; st.M = m.M; st.s = m.s;
      sB.set(Math.log10(m.B)); sN.set(m.nu); st.B = m.B; st.nu = m.nu; syncS(); clearPick(); draw();
    }

    // 회전: 정확한 합. 반환 { Z(σ 나누기 전), ex = <E/kT>, var = <(E/kT)^2> - <E/kT>^2 }
    function rot(T, thR) {
      var Z = 0, s1 = 0, s2 = 0;
      for (var J = 0; J < 20000; J++) {
        var x = thR * J * (J + 1) / T;
        if (x > 60) break;
        var w = (2 * J + 1) * Math.exp(-x);
        Z += w; s1 += w * x; s2 += w * x * x;
      }
      var e1 = s1 / Z;
      return { Z: Z, ex: e1, cv: s2 / Z - e1 * e1 };
    }
    function vib(T, thV) {
      var x = thV / T;
      if (x > 300) return { q: 1, cv: 0, s: 0 };
      var e = Math.exp(x), em = Math.exp(-x);
      return { q: 1 / (1 - em), cv: x * x * e / ((e - 1) * (e - 1)), s: x / (e - 1) - Math.log(1 - em) };
    }
    function cvTot(T, thR, thV) { return 1.5 + rot(T, thR).cv + vib(T, thV).cv; }
    function sTrans(T) {
      var m = st.M / 1000 / NA, L = H / Math.sqrt(2 * Math.PI * m * KB * T);
      return R * (Math.log(KB * T / (P0 * L * L * L)) + 2.5);
    }

    function draw() {
      var Tk = api.tokens(), w = cv.w, h = cv.h, narrow = w < 640;
      var T = Math.pow(10, st.logT), thR = C2 * st.B, thV = C2 * st.nu;
      ctx.clearRect(0, 0, w, h);
      // 패널 배치
      var P1, P2, P3;
      if (narrow) {
        var hh = h / 3.05;
        P1 = { x: 44, y: 22, w: w - 56, h: hh - 52 };
        P2 = { x: 44, y: hh + 22, w: w - 56, h: hh - 52 };
        P3 = { x: 44, y: 2 * hh + 26, w: w - 56, h: hh - 56 };
      } else {
        var lw = w * 0.47;
        P1 = { x: 44, y: 22, w: lw - 56, h: h * 0.5 - 58 };
        P2 = { x: 44, y: h * 0.5 + 18, w: lw - 56, h: h * 0.5 - 58 };
        P3 = { x: lw + 50, y: 22, w: w - lw - 64, h: h - 64 };
      }
      var r = rot(T, thR), Z = r.Z;
      // ── 회전 점유
      var pr = [], pmax = 0, psum = 0;
      for (var J = 0; J <= 20; J++) { var p = (2 * J + 1) * Math.exp(-thR * J * (J + 1) / T) / Z; pr.push(p); pmax = Math.max(pmax, p); psum += p; }
      var top = pmax > 0.5 ? 1 : pmax > 0.2 ? 0.5 : pmax > 0.1 ? 0.2 : pmax > 0.05 ? 0.1 : pmax > 0.02 ? 0.05 : 0.02;
      bars(P1, pr, top, Tk.figBlue, Tk.figSoftBlue, 'J', '회전 점유 p_J (J ≤ 20 합 ' + (psum * 100).toFixed(psum > 0.995 ? 1 : 0) + ' %)', Tk);
      // ── 진동 점유
      var v = vib(T, thV), pv = [];
      for (var k = 0; k <= 5; k++) pv.push((1 - Math.exp(-thV / T)) * Math.exp(-k * thV / T));
      bars(P2, pv, 1, Tk.figViolet, Tk.figSoftViolet, 'v', '진동 준위 점유 p_v', Tk);
      // ── 열용량 곡선
      var X = function (t) { return P3.x + (Math.log10(t) - 1) / (Math.log10(TMAX) - 1) * P3.w; };
      var Y = function (c) { return P3.y + P3.h - (c - 1) / 3 * P3.h; };
      ctx.strokeStyle = Tk.rule; ctx.lineWidth = 1; ctx.font = '11px ' + Tk.fontMono; ctx.fillStyle = Tk.figMuted; ctx.textAlign = 'center';
      [10, 100, 1000].concat([5000]).forEach(function (t) { ctx.beginPath(); ctx.moveTo(X(t), P3.y); ctx.lineTo(X(t), P3.y + P3.h); ctx.stroke(); ctx.fillText(t, X(t), P3.y + P3.h + 14); });
      for (var d = 10; d < TMAX; d *= 10) for (var m = 2; m < 10; m++) { var tt = d * m; if (tt > TMAX) break; ctx.beginPath(); ctx.moveTo(X(tt), P3.y + P3.h); ctx.lineTo(X(tt), P3.y + P3.h + 3); ctx.stroke(); }
      ctx.textAlign = 'right';
      [1, 1.5, 2, 2.5, 3, 3.5, 4].forEach(function (c) { ctx.beginPath(); ctx.moveTo(P3.x, Y(c)); ctx.lineTo(P3.x + P3.w, Y(c)); ctx.stroke(); ctx.fillText(c.toFixed(1), P3.x - 5, Y(c) + 4); });
      ctx.strokeStyle = Tk.figLine; ctx.strokeRect(P3.x, P3.y, P3.w, P3.h);
      ctx.fillStyle = Tk.figInk; ctx.font = '12px ' + Tk.fontBody; ctx.textAlign = 'center';
      ctx.fillText('온도 T (K, 로그 눈금)', P3.x + P3.w / 2, P3.y + P3.h + 30);
      ctx.textAlign = 'left'; ctx.fillText('C_V,m/R', P3.x + 4, P3.y - 8);
      ctx.save(); ctx.beginPath(); ctx.rect(P3.x, P3.y, P3.w, P3.h); ctx.clip();
      [[thR, 'θ_R'], [thV, 'θ_V']].forEach(function (a) {
        if (a[0] < TMIN || a[0] > TMAX) return;
        ctx.setLineDash([3, 4]); ctx.strokeStyle = Tk.figTeal; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(a[0]), P3.y); ctx.lineTo(X(a[0]), P3.y + P3.h); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = Tk.figTeal; ctx.font = '11px ' + Tk.fontBody; var nearR = X(a[0]) > P3.x + P3.w - 30; ctx.textAlign = nearR ? 'right' : 'left'; ctx.fillText(a[1], X(a[0]) + (nearR ? -3 : 3), P3.y + P3.h - 6);
      });
      ctx.strokeStyle = Tk.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var i = 0; i <= 160; i++) { var t = Math.pow(10, 1 + i / 160 * (Math.log10(TMAX) - 1)), c = cvTot(t, thR, thV); if (i) ctx.lineTo(X(t), Y(c)); else ctx.moveTo(X(t), Y(c)); }
      ctx.stroke();
      ctx.restore();
      var cNow = 1.5 + r.cv + v.cv;
      if (T >= TMIN) {
        ctx.fillStyle = Tk.figRed; ctx.beginPath(); ctx.arc(X(T), Y(cNow), 6, 0, 7); ctx.fill();
        ctx.strokeStyle = Tk.figInk; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '600 12px ' + Tk.fontBody; ctx.fillStyle = Tk.figInk; ctx.textAlign = X(T) > P3.x + P3.w - 90 ? 'right' : 'left';
        ctx.fillText(cNow.toFixed(2), X(T) + (ctx.textAlign === 'right' ? -10 : 10), Y(cNow) - 10);
      } else {
        ctx.font = '11px ' + Tk.fontBody; ctx.fillStyle = Tk.figMuted; ctx.textAlign = 'left';
        ctx.fillText('← 현재 온도는 10 K 아래(곡선 밖)', P3.x + 6, P3.y + 16);
      }
      // 읽은 값
      var qR = Z / st.s, qHi = T / (st.s * thR);
      rQR.set(fmt(qR) + ' / ' + fmt(qHi) + ' (+1/3 → ' + fmt(qHi + 1 / 3) + ')');
      rQV.set(v.q.toFixed(4));
      rC.set(cNow.toFixed(3) + '  (병진 1.5 + 회전 ' + r.cv.toFixed(3) + ' + 진동 ' + v.cv.toFixed(3) + ')');
      var S1 = sTrans(T), S2 = R * (r.ex + Math.log(qR)), S3 = R * v.s;
      rS.set(S1.toFixed(1) + ' + ' + S2.toFixed(1) + ' + ' + S3.toFixed(2) + ' = ' + (S1 + S2 + S3).toFixed(1) + '  (병진: ' + MOLS[st.k].name + ' 질량)');
      if (st.s === 2 && T < 5 * thR) rW.set('T가 θ_R(' + thR.toFixed(thR < 1 ? 3 : 1) + ' K)에 가까워 σ로 나누는 근사가 맞지 않는다(핵스핀 통계 필요)');
      else if (T < 1.5 * thR) rW.set('T < 1.5θ_R: 고온 근사 T/σθ_R이 정확한 합과 크게 다르다');
      else rW.set('θ_R = ' + thR.toFixed(thR < 1 ? 4 : 2) + ' K, θ_V = ' + thV.toFixed(0) + ' K');
    }
    function fmt(x) { return x >= 1000 ? x.toFixed(0) : x >= 100 ? x.toFixed(1) : x >= 10 ? x.toFixed(2) : x.toFixed(3); }
    function bars(P, vals, top, col, soft, sym, title, Tk) {
      var n = vals.length, bw = P.w / n;
      ctx.strokeStyle = Tk.rule; ctx.lineWidth = 1; ctx.font = '11px ' + Tk.fontMono; ctx.fillStyle = Tk.figMuted; ctx.textAlign = 'right';
      [0, 0.5, 1].forEach(function (f) { var y = P.y + P.h - f * P.h; ctx.beginPath(); ctx.moveTo(P.x, y); ctx.lineTo(P.x + P.w, y); ctx.stroke(); ctx.fillText(+(top * f).toFixed(3), P.x - 4, y + 4); });
      for (var i = 0; i < n; i++) {
        var hgt = Math.min(vals[i] / top, 1) * P.h;
        ctx.fillStyle = soft; ctx.fillRect(P.x + i * bw + bw * 0.15, P.y + P.h - hgt, bw * 0.7, hgt);
        ctx.strokeStyle = col; ctx.lineWidth = 1.2; if (hgt > 0.5) ctx.strokeRect(P.x + i * bw + bw * 0.15, P.y + P.h - hgt, bw * 0.7, hgt);
        var lab = n > 10 ? (i % 5 === 0 ? String(i) : '') : String(i);
        if (lab) { ctx.fillStyle = Tk.figMuted; ctx.textAlign = 'center'; ctx.font = '11px ' + Tk.fontMono; ctx.fillText(lab, P.x + (i + 0.5) * bw, P.y + P.h + 13); }
        if (n <= 10 && vals[i] >= 0.001) { ctx.fillStyle = Tk.figInk; ctx.textAlign = 'center'; ctx.font = '11px ' + Tk.fontBody; ctx.fillText(vals[i] < 0.01 ? vals[i].toFixed(3) : vals[i].toFixed(2), P.x + (i + 0.5) * bw, P.y + P.h - hgt - 4 < P.y + 10 ? P.y + P.h - hgt + 13 : P.y + P.h - hgt - 4); }
      }
      ctx.fillStyle = Tk.figInk; ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'left'; ctx.fillText(title, P.x, P.y - 8);
      ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontBody; ctx.textAlign = 'right'; ctx.fillText(sym, P.x + P.w, P.y + P.h + 26);
    }
    api.onResize(draw);
    draw();
  },
});
