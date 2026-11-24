/* 물리화학 10 분자 분광학: 프랑크–콘돈 인자 탐색 — 두 조화 퍼텐셜의 진동 파동 함수 겹침 */
Sims.register('mj-franck-condon', {
  title: '프랑크–콘돈 인자 탐색 — 평형 거리가 밀리면 진동 진행이 길어진다',
  caption: '들뜬 상태의 평형 거리 이동 ΔR, 들뜬 상태의 진동 파수, 환산 질량을 바꾸어 보자. 위 그림의 아래 곡선은 바닥 전자 상태(진동 파수 1500 cm⁻¹ 고정, v″ = 0의 χ₀), 위 곡선은 들뜬 전자 상태이며, 고른 v′의 χ_v′와 χ₀의 곱을 가운데 띠에 색칠했다(파랑 +, 빨강 −, 넓이의 합이 겹침 적분). ' +
    '아래 막대는 겹침 적분의 제곱 |⟨v′|0⟩|²(프랑크–콘돈 인자)이다. ΔR = 0이고 두 진동 파수가 같으면 0–0 띠 하나만 남고, ΔR을 키우면 가장 센 띠가 높은 v′로 옮겨 간다. 두 진동 파수가 같을 때는 푸아송 분포 e^(−S)S^v′/v′!(S = μωΔR²/2ħ)와 일치한다. ' +
    '두 퍼텐셜을 조화 진동자로 보고 파동 함수를 수치 적분했으며, 두 곡선 사이의 전자 에너지 간격은 줄여 그렸다.',
  init: function (api) {
    var HBAR = 1.054572e-34, U = 1.66054e-27, CC = 2.99792e10, WLOW = 1500, NV = 16;
    var st = { dR: 10, wUp: 1500, mu: 6.86, v: 1 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.7; }, label: '두 퍼텐셜 곡선과 진동 파동 함수, 프랑크–콘돈 인자 막대그래프' });
    var ctx = cv.ctx;
    var rS = api.readout('S = μωΔR²/2ħ'), rMax = api.readout('가장 센 띠'), rSel = api.readout('|⟨v′|0⟩|²');
    api.slider({ id: 'mj-franck-condon-dr', label: '평형 거리 이동 ΔR', min: 0, max: 20, step: 0.1, value: st.dR,
      format: function (v) { return v.toFixed(1) + ' pm'; }, onInput: function (v) { st.dR = v; draw(); } });
    api.slider({ id: 'mj-franck-condon-w', label: '들뜬 상태 진동 파수', min: 500, max: 3000, step: 10, value: st.wUp,
      format: function (v) { return v.toFixed(0) + ' cm⁻¹'; }, onInput: function (v) { st.wUp = v; draw(); } });
    api.slider({ id: 'mj-franck-condon-mu', label: '환산 질량 μ', min: 1, max: 20, step: 0.01, value: st.mu,
      format: function (v) { return v.toFixed(2) + ' u'; }, onInput: function (v) { st.mu = v; draw(); } });
    api.slider({ id: 'mj-franck-condon-v', label: '색칠할 v′', min: 0, max: 10, step: 1, value: st.v,
      format: function (v) { return 'v′ = ' + v; }, onInput: function (v) { st.v = v; draw(); } });

    function alen(wn) { return Math.sqrt(HBAR / (st.mu * U * 2 * Math.PI * CC * wn)) * 1e12; }   // pm
    function herm(n, xi) {      // 정규화된 에르미트 함수(차원 없는 ξ), 0..n
      var out = [Math.pow(Math.PI, -0.25) * Math.exp(-xi * xi / 2)];
      if (n > 0) out.push(Math.SQRT2 * xi * out[0]);
      for (var k = 1; k < n; k++) out.push(Math.sqrt(2 / (k + 1)) * xi * out[k] - Math.sqrt(k / (k + 1)) * out[k - 1]);
      return out;
    }
    function compute() {
      var a0 = alen(WLOW), a1 = alen(st.wUp), d = st.dR;
      var lo = Math.min(-6 * a0, d - a1 * Math.sqrt(2 * NV + 1) - 4 * a1), hi = Math.max(6 * a0, d + a1 * Math.sqrt(2 * NV + 1) + 4 * a1);
      var N = 1600, dx = (hi - lo) / N, xs = [], p0 = [], pu = [];
      for (var i = 0; i <= N; i++) {
        var x = lo + i * dx; xs.push(x);
        p0.push(herm(0, x / a0)[0] / Math.sqrt(a0));
        pu.push(herm(NV, (x - d) / a1).map(function (q) { return q / Math.sqrt(a1); }));
      }
      var fc = [];
      for (var v = 0; v <= NV; v++) { var s = 0; for (var j = 0; j <= N; j++) s += pu[j][v] * p0[j]; fc.push(s * dx); }
      return { a0: a0, a1: a1, xs: xs, p0: p0, pu: pu, ov: fc, fc: fc.map(function (q) { return q * q; }), dx: dx };
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, R = compute(), d = st.dR;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var P = narrow ? { x0: 40, x1: w - 12, y0: 6, y1: h * 0.62 } : { x0: 46, x1: w * 0.62, y0: 6, y1: h - 34 };
      var Bc = narrow ? { x0: 40, x1: w - 12, y0: h * 0.62 + 50, y1: h - 34 } : { x0: w * 0.68, x1: w - 12, y0: 30, y1: h - 34 };
      // 보일 R 범위: 위 v′ = 7, 아래 v = 3의 되돌이점까지
      var vshow = 7;
      var xl = Math.min(-R.a0 * Math.sqrt(7) * 1.25, d - R.a1 * Math.sqrt(2 * vshow + 1) * 1.15);
      var xr = Math.max(R.a0 * Math.sqrt(7) * 1.25, d + R.a1 * Math.sqrt(2 * vshow + 1) * 1.15);
      var sx = function (x) { return P.x0 + (x - xl) / (xr - xl) * (P.x1 - P.x0); };
      var H = P.y1 - P.y0;
      var up = { b: P.y0 + H * 0.52, top: P.y0 + 4 }, lowB = { b: P.y1 - H * 0.02, top: P.y0 + H * 0.70 };
      var stripY = P.y0 + H * 0.61;
      // 위 곡선: 0..(vshow+1)ħω′ 를 up.b → up.top 에
      var ku = (up.b - up.top) / (vshow + 1), kl = (lowB.b - lowB.top) / 3;
      function yU(n) { return up.b - n * ku; }       // n: ħω′ 단위
      function yL(n) { return lowB.b - n * kl; }     // ħω″ 단위
      function curve(f, ytop, col, lw) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); var started = false;
        for (var i = 0; i <= 200; i++) {
          var x = xl + (xr - xl) * i / 200, y = f(x);
          if (y < ytop) { started = false; continue; }
          if (!started) { ctx.moveTo(sx(x), y); started = true; } else ctx.lineTo(sx(x), y);
        }
        ctx.stroke();
      }
      curve(function (x) { var q = (x - d) / R.a1; return yU(q * q / 2); }, up.top, T.figViolet, 2.4);
      curve(function (x) { var q = x / R.a0; return yL(q * q / 2); }, lowB.top, T.figAccent, 2.4);
      // 위 준위와 파동 함수
      var amp = ku * 0.42 * Math.sqrt(R.a1);
      for (var v = 0; v <= vshow; v++) {
        var tp = R.a1 * Math.sqrt(2 * v + 1), yv = yU(v + 0.5), on = v === st.v;
        ctx.strokeStyle = on ? T.figRed : T.figLine; ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(sx(d - tp), yv); ctx.lineTo(sx(d + tp), yv); ctx.stroke();
        ctx.beginPath();
        for (var j = 0; j < R.xs.length; j += 2) {
          var x = R.xs[j]; if (x < xl || x > xr) continue;
          var yy = yv - amp * R.pu[j][v];
          if (j === 0 || R.xs[j - 2] < xl) ctx.moveTo(sx(x), yy); else ctx.lineTo(sx(x), yy);
        }
        ctx.strokeStyle = on ? T.figRed : T.figViolet; ctx.globalAlpha = on ? 1 : 0.45; ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (st.v > vshow) { ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('v′ = ' + st.v + '는 그림 위쪽(파동 함수 생략)', P.x1, up.top + 10); }
      // 아래 v=0
      var tp0 = R.a0, y0 = yL(0.5), amp0 = kl * 0.9 * Math.sqrt(R.a0);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx(-tp0), y0); ctx.lineTo(sx(tp0), y0); ctx.stroke();
      ctx.beginPath();
      R.xs.forEach(function (x, j) { if (x < xl || x > xr) return; var yy = y0 - amp0 * R.p0[j]; if (x - R.dx < xl) ctx.moveTo(sx(x), yy); else ctx.lineTo(sx(x), yy); });
      ctx.lineWidth = 2; ctx.stroke();
      // 수직 화살표
      var yHit = yU(Math.pow(-d / R.a1, 2) / 2);
      if (yHit < up.top) yHit = up.top;
      ctx.strokeStyle = T.figInk; ctx.fillStyle = T.figInk; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(sx(0), y0); ctx.lineTo(sx(0), yHit + 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(sx(0), yHit); ctx.lineTo(sx(0) - 5, yHit + 9); ctx.lineTo(sx(0) + 5, yHit + 9); ctx.closePath(); ctx.fill();
      // 곱 띠
      var sh = H * 0.07;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P.x0, stripY); ctx.lineTo(P.x1, stripY); ctx.stroke();
      var prod = R.xs.map(function (x, j) { return R.pu[j][st.v] * R.p0[j]; });
      var pm = Math.max.apply(null, prod.map(Math.abs)) || 1;
      for (var k = 0; k < R.xs.length - 1; k += 1) {
        var xa = R.xs[k]; if (xa < xl || xa > xr) continue;
        var q = prod[k] / pm;
        ctx.fillStyle = q >= 0 ? T.figBlue : T.figRed; ctx.globalAlpha = 0.55;
        var px = sx(xa), pw = Math.max(1, sx(R.xs[k + 1]) - px + 0.4);
        ctx.fillRect(px, q >= 0 ? stripY - q * sh : stripY, pw, Math.abs(q) * sh);
      }
      ctx.globalAlpha = 1;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      ctx.fillText('χ' + sub(st.v) + '·χ₀ (넓이 합 = ' + R.ov[st.v].toFixed(3) + ')', P.x1 - 2, stripY - sh - 4);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figViolet; ctx.fillText('들뜬 전자 상태', P.x0 + 2, up.top + 10);
      ctx.fillStyle = T.figAccent; ctx.fillText('바닥 전자 상태, v″ = 0', P.x0 + 2, lowB.top + 4);
      // R 축
      ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(P.x0, P.y1); ctx.lineTo(P.x1, P.y1); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontMono;
      var stp = (xr - xl) > 80 ? 20 : (xr - xl) > 40 ? 10 : 5;
      for (var t = Math.ceil(xl / stp) * stp; t <= xr; t += stp) { ctx.beginPath(); ctx.moveTo(sx(t), P.y1); ctx.lineTo(sx(t), P.y1 + 4); ctx.stroke(); ctx.fillText(t, sx(t), P.y1 + 15); }
      ctx.font = '11px ' + T.fontBody; ctx.fillText('R − R″ₑ / pm', (P.x0 + P.x1) / 2, P.y1 + 28);
      // 막대
      var nb = NV, bw = (Bc.x1 - Bc.x0) / (nb + 1);
      ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(Bc.x0, Bc.y1); ctx.lineTo(Bc.x1, Bc.y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(Bc.x0, Bc.y0); ctx.lineTo(Bc.x0, Bc.y1); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontMono;
      [0, 0.5, 1].forEach(function (g) { var yy = Bc.y1 - g * (Bc.y1 - Bc.y0 - 16); ctx.fillText(g.toFixed(1), Bc.x0 - 4, yy + 4); });
      var imax = 0;
      for (var b = 0; b < nb; b++) {
        if (R.fc[b] > R.fc[imax]) imax = b;
        var bx = Bc.x0 + (b + 0.5) * bw, bh = R.fc[b] * (Bc.y1 - Bc.y0 - 16);
        ctx.fillStyle = b === st.v ? T.figRed : T.figViolet;
        ctx.fillRect(bx - bw * 0.32, Bc.y1 - bh, bw * 0.64, bh);
        if (b % (narrow ? 1 : 2) === 0 || b === st.v) { ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText(b, bx, Bc.y1 + 14); }
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('|⟨v′|0⟩|² (v′ →)', (Bc.x0 + Bc.x1) / 2, Bc.y1 + 28);
      // 같은 진동수면 푸아송 점
      var same = Math.abs(st.wUp - WLOW) < 1e-6;
      var S = st.mu * U * 2 * Math.PI * CC * WLOW * Math.pow(d * 1e-12, 2) / (2 * HBAR);
      if (same) {
        ctx.fillStyle = T.figInk;
        var f = Math.exp(-S);
        for (var c = 0; c < nb; c++) {
          if (c > 0) f *= S / c;
          ctx.beginPath(); ctx.arc(Bc.x0 + (c + 0.5) * bw, Bc.y1 - f * (Bc.y1 - Bc.y0 - 16), 2.6, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('● 푸아송 e^(−S)S^v′/v′!', Bc.x1, Bc.y0 + 10);
      }
      rS.set(same ? S.toFixed(2) : '— (두 진동 파수가 같을 때)');
      rMax.set('0–' + imax + ' 띠 (v′ = ' + imax + ')');
      rSel.set('v′ = ' + st.v + ': ' + R.fc[st.v].toFixed(3));
    }
    function sub(n) { var d = '₀₁₂₃₄₅₆₇₈₉'; return String(n).split('').map(function (c) { return d[+c]; }).join(''); }
    api.onResize(draw);
    draw();
  },
});
