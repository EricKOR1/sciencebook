/* 물리화학 7 양자역학의 기초: 사각 장벽 터널링 — 정확한 T(sinh 식)와 두꺼운 장벽 근사, 입자 질량·장벽 폭·높이에 따른 투과 확률의 로그 눈금 변화, E > V0의 공명 투과 */
Sims.register('mj-barrier-tunneling', {
  title: '사각 장벽 터널링 — 질량·폭·높이와 투과 확률',
  caption: '입자를 고르고 에너지 E, 장벽 높이 V₀, 폭 a를 바꿔 보자. 왼쪽 위는 퍼텐셜(회색)과 에너지(점선)를 기준선으로 그린 Re ψ, 그 아래는 |ψ|²이며, 둘 다 경계 조건을 정확히 풀어 계산했다(들어오는 파의 진폭 1). 오른쪽 그래프는 같은 E와 V₀에서 장벽 폭에 따른 투과 확률을 로그 눈금으로 그린 것으로, 거의 직선이라는 것이 T ∝ e^(−2κa)의 뜻이고, 질량이 클수록 기울기가 √m에 비례해 가팔라진다. 막대는 정확한 T와 근사식 16(E/V₀)(1 − E/V₀)e^(−2κa)의 비교이다. E > V₀이면 근사식은 쓸 수 없고, T는 1보다 작다가 sin k₂a = 0인 폭에서만 1이 된다(공명 투과). 1차원 사각 장벽, 비상대론적 입자를 가정했고, 영역 III의 파동이 너무 작으면 확대해 점선으로 덧그렸다.',
  init: function (api) {
    var HB = 1.054571817e-34, EV = 1.602176634e-19, ME = 9.1093837e-31;
    var P = [{ n: '전자', m: ME, s: 'e⁻' }, { n: '양성자', m: 1.67262192e-27, s: 'p' }, { n: '중양성자', m: 3.3435837e-27, s: 'd' }];
    var st = { p: 0, E: 2.0, V: 5.0, a: 0.30 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.7 : 0.6; }, label: '사각 장벽의 파동 함수와 확률 밀도, 장벽 폭에 따른 투과 확률 그래프' });
    var ctx = cv.ctx;
    var rK = api.readout('k, κ (또는 k₂)');
    var rT = api.readout('정확한 T');
    var rA = api.readout('근사 16(E/V₀)(1−E/V₀)e^(−2κa)');
    var rC = api.readout('세 입자의 T (같은 E, V₀, a)');

    var g = api.group();
    var bs = P.map(function (q, i) { return api.button(q.n, function () { pick(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    api.slider({ id: 'mj-barrier-tunneling-e', label: '입자 에너지 E', min: 0.05, max: 10, step: 0.05, value: st.E, format: function (v) { return v.toFixed(2) + ' eV'; }, onInput: function (v) { st.E = v; draw(); } });
    api.slider({ id: 'mj-barrier-tunneling-v', label: '장벽 높이 V₀', min: 0, max: 10, step: 0.05, value: st.V, format: function (v) { return v.toFixed(2) + ' eV'; }, onInput: function (v) { st.V = v; draw(); } });
    api.slider({ id: 'mj-barrier-tunneling-a', label: '장벽 폭 a', min: 0.05, max: 1.0, step: 0.005, value: st.a, format: function (v) { return v.toFixed(3) + ' nm'; }, onInput: function (v) { st.a = v; draw(); } });
    function pick(i) { st.p = i; bs.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }

    // 복소수
    function c(re, im) { return { re: re, im: im || 0 }; }
    function add(a, b) { return c(a.re + b.re, a.im + b.im); }
    function sub(a, b) { return c(a.re - b.re, a.im - b.im); }
    function mul(a, b) { return c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
    function div(a, b) { var d = b.re * b.re + b.im * b.im; return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
    function cexp(z) { var e = Math.exp(z.re); return c(e * Math.cos(z.im), e * Math.sin(z.im)); }
    function abs2(z) { return z.re * z.re + z.im * z.im; }
    function sc(z, s) { return c(z.re * s, z.im * s); }

    function wn(m, e) { return Math.sqrt(2 * m * Math.abs(e) * EV) / HB * 1e-9; }   // nm⁻¹
    // ln T (정확한 식). E와 V는 eV, a는 nm
    function lnT(m, E, V, a) {
      var d = V - E;
      if (Math.abs(d) < 1e-9) { var y0 = m * a * a * 1e-18 * V * EV / (2 * HB * HB); return -Math.log(1 + y0); }
      if (V <= 0) return 0;
      var pre = V * V / (4 * E * Math.abs(d)), y = wn(m, d) * a;
      if (d < 0) { var s = Math.sin(y); return -Math.log(1 + pre * s * s); }
      if (y > 20) return -(Math.log(pre) + 2 * y - Math.log(4));
      var sh = Math.sinh(y); return -Math.log(1 + pre * sh * sh);
    }
    function lnTapprox(m, E, V, a) { if (E >= V) return null; return Math.log(16 * (E / V) * (1 - E / V)) - 2 * wn(m, V - E) * a; }
    function solve(m, E, V, a) {
      var k = wn(m, E), d = V - E, q = d >= 0 ? c(wn(m, d)) : c(0, wn(m, -d));
      if (Math.abs(d) < 1e-6) q = c(1e-6);
      if (q.re * a > 300) {   // 매우 두꺼운 장벽: 반무한 장벽으로 그린다(투과파 0)
        var B0 = div(c(q.re, k), c(-q.re, k));   // (κ + ik)/(ik − κ)
        return { k: k, q: q, thick: true, B: B0, Cdec: add(c(1), B0), F: c(0) };
      }
      var ik = c(0, k), eika = cexp(c(0, k * a)), ikq = div(ik, q);
      var C1 = mul(sc(mul(eika, cexp(c(-q.re * a, -q.im * a))), 0.5), add(c(1), ikq));
      var D1 = mul(sc(mul(eika, cexp(c(q.re * a, q.im * a))), 0.5), sub(c(1), ikq));
      var p0 = add(C1, D1), dp0 = mul(q, sub(C1, D1)), r = div(dp0, ik);
      var A = sc(add(p0, r), 0.5), Bb = sc(sub(p0, r), 0.5);
      return { k: k, q: q, thick: false, F: div(c(1), A), C: div(C1, A), D: div(D1, A), B: div(Bb, A) };
    }
    function psi(s, x, a) {
      if (x < 0) return add(cexp(c(0, s.k * x)), mul(s.B, cexp(c(0, -s.k * x))));
      if (s.thick) return x <= a ? sc(s.Cdec, Math.exp(-s.q.re * x)) : c(0);
      if (x <= a) return add(mul(s.C, cexp(sc(s.q, x))), mul(s.D, cexp(sc(s.q, -x))));
      return mul(s.F, cexp(c(0, s.k * x)));
    }
    function fmtT(lt) {
      var l10 = lt / Math.LN10;
      if (l10 > -3) return Math.exp(lt).toFixed(4);
      var e = Math.floor(l10), mnt = Math.pow(10, l10 - e);
      return mnt.toFixed(2) + ' × 10' + String(e).replace('-', '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; });
    }

    function draw() {
      var Tk = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var m = P[st.p].m, E = st.E, V = st.V, a = st.a;
      var s = solve(m, E, V, a), lt = lnT(m, E, V, a), T = Math.exp(lt);
      // 영역 배치
      var A1, A2, A3;
      if (narrow) { A1 = { x: 44, y: 18, w: w - 56, h: h * 0.27 }; A2 = { x: 44, y: h * 0.27 + 40, w: w - 56, h: h * 0.17 }; A3 = { x: 44, y: h * 0.52 + 30, w: w - 56, h: h * 0.36 }; }
      else { A1 = { x: 44, y: 18, w: w * 0.56 - 44, h: h * 0.5 - 30 }; A2 = { x: 44, y: h * 0.5 + 18, w: w * 0.56 - 44, h: h * 0.5 - 56 }; A3 = { x: w * 0.62 + 22, y: 18, w: w * 0.38 - 36, h: h * 0.62 - 30 }; }
      var span = Math.max(0.5, 0.9 * a), x0 = -span, x1 = a + span;
      var sx = function (x) { return A1.x + (x - x0) / (x1 - x0) * A1.w; };
      // ── 위: 퍼텐셜 + Re ψ
      var Emax = 10.5, syE = function (e) { return A1.y + A1.h - e / Emax * A1.h; };
      ctx.fillStyle = Tk.figPanel; ctx.strokeStyle = Tk.figMuted; ctx.lineWidth = 1.2;
      ctx.fillRect(sx(0), syE(V), sx(a) - sx(0), syE(0) - syE(V)); ctx.strokeRect(sx(0), syE(V), sx(a) - sx(0), syE(0) - syE(V));
      ctx.strokeStyle = Tk.figLine; ctx.strokeRect(A1.x, A1.y, A1.w, A1.h);
      ctx.strokeStyle = Tk.figAmber; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(A1.x, syE(E)); ctx.lineTo(A1.x + A1.w, syE(E)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontMono; ctx.textAlign = 'right';
      [0, 5, 10].forEach(function (e) { ctx.fillText(e + '', A1.x - 4, syE(e) + 4); });
      ctx.save(); ctx.translate(12, A1.y + A1.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = Tk.figInk; ctx.font = '12px ' + Tk.fontBody; ctx.fillText('에너지/eV', 0, 0); ctx.restore();
      var N = Math.min(2400, Math.max(600, Math.round(A1.w * 3)));
      var pts = [], maxA = 0;
      for (var i = 0; i <= N; i++) { var x = x0 + (x1 - x0) * i / N, ps = psi(s, x, a); pts.push([x, ps]); maxA = Math.max(maxA, Math.sqrt(abs2(ps))); }
      var amp = Math.min(A1.h * 0.42, A1.h * 0.42) / Math.max(maxA, 1e-9);
      var pxPerWave = 2 * Math.PI / s.k / (x1 - x0) * A1.w;
      ctx.save(); ctx.beginPath(); ctx.rect(A1.x, A1.y, A1.w, A1.h); ctx.clip();
      var base = syE(E);
      // 포락선 |ψ|
      ctx.fillStyle = Tk.figSoftBlue; ctx.globalAlpha = 0.6; ctx.beginPath();
      pts.forEach(function (p, j) { var X = sx(p[0]), Y = base - Math.sqrt(abs2(p[1])) * amp; if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      for (var j2 = pts.length - 1; j2 >= 0; j2--) ctx.lineTo(sx(pts[j2][0]), base + Math.sqrt(abs2(pts[j2][1])) * amp);
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      if (pxPerWave >= 6) {
        ctx.strokeStyle = Tk.figBlue; ctx.lineWidth = 2; ctx.beginPath();
        pts.forEach(function (p, j) { var X = sx(p[0]), Y = base - p[1].re * amp; if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.stroke();
      }
      var Famp = Math.sqrt(abs2(s.F)), mag = 0;
      if (Famp > 0 && Famp < 0.1 * maxA) {
        mag = Math.pow(10, Math.floor(Math.log10(0.4 * maxA / Famp)));
        ctx.strokeStyle = Tk.figTeal; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]); ctx.beginPath();
        var st0 = false;
        pts.forEach(function (p) { if (p[0] < a) return; var v = (pxPerWave >= 6 ? p[1].re : Math.sqrt(abs2(p[1]))) * mag; var X = sx(p[0]), Y = base - v * amp; if (st0) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); st0 = true; } });
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
      ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = Tk.figInk;
      ctx.fillText('I', sx(x0 / 2), A1.y + 14); ctx.fillText('II', sx(a / 2), A1.y + 14); ctx.fillText('III', sx(a + span / 2), A1.y + 14);
      ctx.textAlign = 'left'; ctx.font = '11px ' + Tk.fontBody;
      ctx.fillStyle = Tk.figAmber; ctx.fillText('E', A1.x + 4, base - 4);
      ctx.fillStyle = Tk.figBlue; ctx.fillText(pxPerWave >= 6 ? 'Re ψ (옅은 띠: ±|ψ|)' : '파장이 너무 짧아 ±|ψ|만 그림', A1.x + 18, A1.y + A1.h - 6);
      if (mag) { ctx.fillStyle = Tk.figTeal; ctx.textAlign = 'right'; ctx.fillText('영역 III ×' + (mag >= 1e4 ? '10' + String(Math.round(Math.log10(mag))).replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }) : mag) + ' 확대', A1.x + A1.w - 4, A1.y + 28); }
      // ── 가운데: |ψ|²
      var ym = 0; pts.forEach(function (p) { ym = Math.max(ym, abs2(p[1])); }); ym = Math.max(ym * 1.1, 0.05);
      var sy2 = function (v) { return A2.y + A2.h - v / ym * A2.h; };
      ctx.fillStyle = Tk.figPanel; ctx.fillRect(sx(0), A2.y, sx(a) - sx(0), A2.h);
      ctx.strokeStyle = Tk.figLine; ctx.lineWidth = 1; ctx.strokeRect(A2.x, A2.y, A2.w, A2.h);
      ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontMono; ctx.textAlign = 'right';
      ctx.fillText('0', A2.x - 4, A2.y + A2.h + 4); ctx.fillText(ym.toPrecision(2), A2.x - 4, A2.y + 9);
      ctx.save(); ctx.beginPath(); ctx.rect(A2.x, A2.y, A2.w, A2.h); ctx.clip();
      ctx.strokeStyle = Tk.figRed; ctx.lineWidth = 2; ctx.beginPath();
      pts.forEach(function (p, j) { var X = sx(p[0]), Y = sy2(abs2(p[1])); if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = Tk.figInk; ctx.font = '12px ' + Tk.fontBody; ctx.textAlign = 'left';
      ctx.fillText('|ψ|²', A2.x + 4, A2.y - 5);
      ctx.fillStyle = Tk.figRed; ctx.textAlign = 'right'; ctx.font = '600 11px ' + Tk.fontBody;
      ctx.fillText('영역 III: |ψ|² = T = ' + fmtT(lt), A2.x + A2.w - 4, A2.y - 5);
      ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontMono; ctx.textAlign = 'center';
      ctx.fillText('0', sx(0), A2.y + A2.h + 13); ctx.fillText('a', sx(a), A2.y + A2.h + 13);
      ctx.fillText('x 범위 ' + x0.toFixed(2) + ' ~ ' + x1.toFixed(2) + ' nm', A2.x + A2.w / 2, A2.y + A2.h + 26);
      // ── 오른쪽: log T 대 a
      var curves = P.map(function (q) { var arr = []; for (var n = 0; n <= 160; n++) { var aa = 0.05 + 0.95 * n / 160; arr.push([aa, lnT(q.m, E, V, aa) / Math.LN10]); } return arr; });
      var lo = Math.min(-2, curves[st.p][160][1]); lo = Math.max(-60, Math.floor(lo / 5) * 5);
      var sxa = function (aa) { return A3.x + (aa - 0) / 1.0 * A3.w; }, sya = function (l) { return A3.y + (0 - l) / (0 - lo) * A3.h; };
      ctx.strokeStyle = Tk.rule; ctx.lineWidth = 1; ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontMono;
      var stp = (-lo) <= 10 ? 2 : (-lo) <= 30 ? 5 : 10;
      ctx.textAlign = 'right';
      for (var l = 0; l >= lo; l -= stp) { ctx.beginPath(); ctx.moveTo(A3.x, sya(l)); ctx.lineTo(A3.x + A3.w, sya(l)); ctx.stroke(); ctx.fillText(l === 0 ? '1' : '10' + String(l).replace('-', '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }), A3.x - 4, sya(l) + 4); }
      ctx.textAlign = 'center';
      [0, 0.25, 0.5, 0.75, 1.0].forEach(function (aa) { ctx.beginPath(); ctx.moveTo(sxa(aa), A3.y); ctx.lineTo(sxa(aa), A3.y + A3.h); ctx.stroke(); ctx.fillText(aa.toFixed(2), sxa(aa), A3.y + A3.h + 13); });
      ctx.strokeStyle = Tk.figLine; ctx.strokeRect(A3.x, A3.y, A3.w, A3.h);
      ctx.fillStyle = Tk.figInk; ctx.font = '12px ' + Tk.fontBody;
      ctx.fillText('장벽 폭 a / nm', A3.x + A3.w / 2, A3.y + A3.h + 28);
      ctx.textAlign = 'left'; ctx.fillText('투과 확률 T (로그 눈금)', A3.x + 4, A3.y - 5 < 12 ? A3.y + 14 : A3.y - 5);
      var cols = [Tk.figBlue, Tk.figRed, Tk.figViolet];
      ctx.save(); ctx.beginPath(); ctx.rect(A3.x, A3.y, A3.w, A3.h); ctx.clip();
      curves.forEach(function (arr, qi) {
        ctx.strokeStyle = cols[qi]; ctx.lineWidth = qi === st.p ? 2.8 : 1.4; ctx.setLineDash(qi === st.p ? [] : [5, 4]); ctx.beginPath();
        arr.forEach(function (p, j) { var X = sxa(p[0]), Y = sya(Math.max(p[1], lo - 5)); if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
      });
      ctx.setLineDash([]); ctx.restore();
      ctx.fillStyle = cols[st.p]; ctx.beginPath(); ctx.arc(sxa(a), sya(Math.max(lt / Math.LN10, lo)), 5, 0, 7); ctx.fill();
      ctx.font = '600 11px ' + Tk.fontBody; ctx.textAlign = 'right';
      P.forEach(function (q, qi) { ctx.fillStyle = cols[qi]; ctx.fillText(q.n + (qi === st.p ? ' (선택)' : ''), A3.x + A3.w - 6, A3.y + 16 + qi * 15); });
      // 막대: 정확 대 근사
      var la = lnTapprox(m, E, V, a);
      var bx = narrow ? A3.x : A3.x, by = A3.y + A3.h + 44, bw = A3.w, bh = 14;
      if (narrow) by = A3.y + A3.h + 40;
      var barLo = lo;
      var bar = function (val, y, col, lab) {
        ctx.fillStyle = Tk.figPanel; ctx.fillRect(bx, y, bw, bh);
        if (val !== null) { var f = Math.max(0, Math.min(1, (val / Math.LN10 - barLo) / (0 - barLo))); ctx.fillStyle = col; ctx.fillRect(bx, y, bw * f, bh); }
        ctx.strokeStyle = Tk.figLine; ctx.strokeRect(bx, y, bw, bh);
        ctx.fillStyle = Tk.figInk; ctx.font = '11px ' + Tk.fontBody; ctx.textAlign = 'left';
        ctx.fillText(lab, bx, y - 3);
      };
      if (by + 2 * bh + 24 < h) {
        bar(lt, by + 12, Tk.figBlue, '정확: ' + fmtT(lt));
        bar(la, by + bh + 36, Tk.figAmber, la === null ? '근사식: E ≥ V₀이면 쓸 수 없음' : '근사: ' + fmtT(Math.min(la, 0)) + (la > 0 ? ' (1을 넘음: 얇은 장벽에서 무너짐)' : ''));
      }
      // 읽은 값
      var kk = s.k, qq = Math.abs(V - E) < 1e-9 ? 0 : wn(m, V - E);
      rK.set('k = ' + kk.toPrecision(3) + ' nm⁻¹, ' + (V > E ? 'κ = ' + qq.toPrecision(3) + ' nm⁻¹, κa = ' + (qq * a).toPrecision(3) : 'k₂ = ' + qq.toPrecision(3) + ' nm⁻¹, k₂a/π = ' + (qq * a / Math.PI).toFixed(2)));
      rT.set(fmtT(lt) + (V <= E && V > 0 ? (Math.abs(Math.sin(qq * a)) < 0.03 ? ' — 공명 투과(sin k₂a ≈ 0)' : ' — E > V₀인데도 반사 R = ' + (1 - T).toFixed(3)) : ''));
      rA.set(la === null ? '해당 없음 (E ≥ V₀)' : fmtT(Math.min(la, 0)) + ' (정확값의 ' + Math.exp(la - lt).toFixed(3) + '배)');
      rC.set(P.map(function (q) { return q.s + ' ' + fmtT(lnT(q.m, E, V, a)); }).join(', '));
    }
    api.onResize(draw);
    draw();
  },
});
