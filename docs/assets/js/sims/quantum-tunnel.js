/* 전자기와 양자 3 터널 효과: 에너지 장벽에 입사하는 전자의 확률 파동과 투과 확률, 고전적인 공과 비교 */
Sims.register('quantum-tunnel', {
  title: '장벽을 지나는 확률 파동 — 터널 효과',
  caption: '장벽의 높이와 두께를 바꾸며 전자의 확률 파동(위)과 언덕으로 굴러가는 공(아래)을 비교해 보자. 공은 에너지가 언덕 꼭대기보다 작으면 반드시 되돌아오지만, 전자의 확률 파동은 장벽 안에서 급격히 줄어들 뿐 0이 되지 않아 반대편에 작은 파동이 남는다. 장벽이 두꺼울수록, 높을수록 투과 확률은 매우 빠르게 작아진다. 에너지 1 eV인 전자와 직사각형 장벽이라는 단순한 모형으로 계산한 값이므로 상대적인 크기 비교로만 보자. 반대편 파동이 너무 작으면 확대 배율을 표시해 크게 그렸다.',
  init: function (api) {
    var E = 1, K0 = 5.123;                 // 전자 1 eV: k = 5.123·√E  (nm⁻¹)
    var st = { V: 2, a: 0.4, t: 0, playing: !api.reduced, ball: { x: -3, v: 1 } };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.55; }, label: '에너지 장벽을 지나는 전자의 확률 파동과 언덕을 오르는 공' });
    var ctx = cv.ctx;
    var rT = api.readout('전자의 투과 확률(모형값)');
    var rN = api.readout('전자 1만 개를 보내면');
    var rB = api.readout('공(고전적 입자)');

    // 복소수 도우미
    function c(re, im) { return { re: re, im: im || 0 }; }
    function add(a, b) { return c(a.re + b.re, a.im + b.im); }
    function sub(a, b) { return c(a.re - b.re, a.im - b.im); }
    function mul(a, b) { return c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
    function div(a, b) { var d = b.re * b.re + b.im * b.im; return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
    function cexp(im) { return c(Math.cos(im), Math.sin(im)); }

    function solve() {
      var k = K0 * Math.sqrt(E), q = K0 * Math.sqrt(st.V - E), a = st.a;
      var ik = c(0, k), eka = cexp(k * a);
      var kq = div(ik, c(q));                                          // ik/κ
      var Cf = mul(mul(eka, c(0.5 * Math.exp(-q * a))), add(c(1), kq)); // C = t·Cf
      var Df = mul(mul(eka, c(0.5 * Math.exp(q * a))), sub(c(1), kq)); // D = t·Df
      var qk = div(c(q), ik);                                          // κ/(ik)
      var denom = add(add(Cf, Df), mul(qk, sub(Cf, Df)));
      var t = div(c(2), denom), C = mul(t, Cf), D = mul(t, Df);
      var r = sub(add(C, D), c(1));
      return { k: k, q: q, t: t, r: r, C: C, D: D, T: t.re * t.re + t.im * t.im };
    }
    function psi(x, s) {
      if (x < 0) return add(cexp(s.k * x), mul(s.r, cexp(-s.k * x)));
      if (x <= st.a) return add(mul(s.C, c(Math.exp(s.q * x))), mul(s.D, c(Math.exp(-s.q * x))));
      return mul(s.t, cexp(s.k * x));
    }
    function fmtT(T) {
      if (T >= 0.01) return (T * 100).toFixed(T >= 0.1 ? 0 : 1) + '%';
      if (T >= 1e-4) return (T * 100).toFixed(3) + '%';
      var e = Math.floor(Math.log10(T)), m = T / Math.pow(10, e);
      var sup = String(e).split('').map(function (ch) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(ch)] || '⁻'; }).join('');
      return '약 ' + m.toFixed(1) + ' × 10' + sup;
    }

    var XL = -3, XR = 3.2;
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, s = solve();
      ctx.clearRect(0, 0, w, h);
      var top = { y: 22, h: h * 0.56 }, bot = { y: h * 0.64, h: h * 0.33 };
      var X = function (x) { return 14 + (x - XL) / (XR - XL) * (w - 28); };
      // ── 위: 퍼텐셜 장벽과 확률 파동
      var base = top.y + top.h * 0.62, eu = top.h * 0.17;              // 1 eV 당 픽셀
      var vTop = base - Math.min(st.V, 3.4) * eu;
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(X(0), vTop, X(st.a) - X(0), base - vTop);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.strokeRect(X(0), vTop, X(st.a) - X(0), base - vTop);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(XL), base); ctx.lineTo(X(XR), base); ctx.stroke();
      var yE = base - E * eu;
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(X(XL), yE); ctx.lineTo(X(XR), yE); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('전자의 에너지 1 eV', X(XL), yE - 4);
      ctx.fillStyle = T.figAmber; ctx.textAlign = 'center';
      ctx.fillText('장벽 ' + st.V.toFixed(1) + ' eV', (X(0) + X(st.a)) / 2, vTop - 5);
      // 오른쪽 확대 배율
      var tAmp = Math.sqrt(s.T), mag = 1;
      if (tAmp < 0.15) { mag = Math.pow(10, Math.ceil(Math.log10(0.25 / tAmp))); }
      var ph = st.t * 2.4, A = top.h * 0.2, mid = top.y + top.h * 0.3;
      // 파동: |ψ| 포락선(옅게)과 실수부(진하게)
      var N = Math.round(w * 1.2);
      ['env', 're'].forEach(function (kind) {
        ctx.beginPath();
        for (var i = 0; i <= N; i++) {
          var x = XL + (XR - XL) * i / N, p = psi(x, s), m = x > st.a ? mag : 1, v;
          if (kind === 'env') v = Math.hypot(p.re, p.im) * m;
          else { var e = cexp(-ph); v = (p.re * e.re - p.im * e.im) * m; }
          var y = mid - Math.max(-2.2, Math.min(2.2, v)) * A / 2;
          if (i) ctx.lineTo(X(x), y); else ctx.moveTo(X(x), y);
        }
        ctx.strokeStyle = kind === 'env' ? T.figBlue : T.figAccent; ctx.globalAlpha = kind === 'env' ? 0.45 : 1;
        ctx.lineWidth = kind === 'env' ? 1.4 : 2.2; ctx.setLineDash(kind === 'env' ? [3, 3] : []); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      });
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('전자의 확률 파동', X(XL), top.y - 6);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('들어오는 파동 + 반사파', X(XL), mid + A * 0.75 + 12);
      ctx.textAlign = 'right';
      ctx.fillText(mag > 1 ? '투과파 (×' + mag.toLocaleString('ko-KR') + ' 확대)' : '투과파', X(XR), mid + A * 0.75 + 12);
      if (mag > 1) { ctx.setLineDash([2, 3]); ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(X(st.a) + 4, top.y); ctx.lineTo(X(st.a) + 4, base); ctx.stroke(); ctx.setLineDash([]); }
      // 거리 눈금
      ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      ctx.beginPath(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.moveTo(X(XR - 1.0), base + 14); ctx.lineTo(X(XR), base + 14); ctx.stroke();
      ctx.fillText('1 nm', X(XR - 0.5), base + 27);
      ctx.fillText('두께 ' + st.a.toFixed(2) + ' nm', (X(0) + X(st.a)) / 2, base + 14);
      // ── 아래: 같은 높이의 언덕과 공
      var gb = bot.y + bot.h - 4, gh = bot.h * 0.62 / 3.4;
      var hill = function (x) { var u = (x - st.a / 2) / (st.a / 2 + 0.35); return Math.abs(u) >= 1 ? 0 : st.V * Math.pow(Math.cos(u * Math.PI / 2), 2); };
      ctx.beginPath(); ctx.moveTo(X(XL), gb);
      for (var j = 0; j <= 160; j++) { var xx = XL + (XR - XL) * j / 160; ctx.lineTo(X(xx), gb - Math.min(hill(xx), 3.4) * gh); }
      ctx.lineTo(X(XR), gb); ctx.closePath(); ctx.fillStyle = T.figSoftGreen; ctx.fill(); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.stroke();
      var bx = st.ball.x, br = 8;
      ctx.beginPath(); ctx.arc(X(bx), gb - Math.min(hill(bx), 3.4) * gh - br, br, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(XL), gb - E * gh - br); ctx.lineTo(X(XR), gb - E * gh - br); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('같은 에너지의 공(고전적 입자)', X(XL), bot.y - 2);
      // 읽은 값
      rT.set(fmtT(s.T));
      var n = s.T * 10000;
      rN.set(n >= 1 ? '약 ' + Math.round(n).toLocaleString('ko-KR') + '개가 반대편에서 발견' : '거의 모두 되돌아옴(1개 미만)');
      rB.set('0% — 언제나 되돌아옴');
    }
    // 공의 운동: 에너지 보존, 속력 ∝ √(E − 높이)
    function hillH(x) { var u = (x - st.a / 2) / (st.a / 2 + 0.35); return Math.abs(u) >= 1 ? 0 : st.V * Math.pow(Math.cos(u * Math.PI / 2), 2); }
    var loop = api.loop(function (dt) {
      if (dt <= 0) return;
      st.t += dt;
      var b = st.ball, sp = 1.6 * Math.sqrt(Math.max(E - hillH(b.x), 0.0025));
      b.x += b.v * sp * dt;
      if (b.v > 0 && hillH(b.x) >= E * 0.997) b.v = -1;
      if (b.x < XL + 0.1) { b.x = XL + 0.1; b.v = 1; }
      draw();
    });
    if (!st.playing) { loop.pause(); st.t = 0.3; st.ball.x = -1.2; }

    api.slider({ id: 'quantum-tunnel-v', label: '장벽 높이', min: 1.2, max: 3.4, step: 0.1, value: st.V,
      format: function (v) { return v.toFixed(1) + ' eV'; }, onInput: function (v) { st.V = v; draw(); } });
    api.slider({ id: 'quantum-tunnel-a', label: '장벽 두께', min: 0.1, max: 1.0, step: 0.05, value: st.a,
      format: function (v) { return v.toFixed(2) + ' nm'; }, onInput: function (v) { st.a = v; draw(); } });
    var bPlay = api.button(st.playing ? '멈춤' : '움직이기', function () {
      st.playing = !st.playing; bPlay.textContent = st.playing ? '멈춤' : '움직이기';
      if (st.playing) loop.play(); else loop.pause();
    }, { primary: true });
    api.onResize(draw);
    draw();
  },
});
