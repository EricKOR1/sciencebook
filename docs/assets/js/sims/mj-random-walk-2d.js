/* umath-7 확률과 통계: 2차원 마구걷기 — 점 구름의 퍼짐, ⟨r²⟩ = 4Dt, x 좌표의 정규 분포 */
Sims.register('mj-random-walk-2d', {
  title: '2차원 마구걷기 — 퍼지는 점 구름과 ⟨r²⟩ = 4Dt',
  caption: '모든 입자가 원점에서 출발해 시간 τ마다 x와 y 방향으로 각각 ±l씩(확률 1/2, 서로 독립) 움직인다. 1차원 마구걷기 두 개를 겹친 것이므로 ⟨x²⟩ = ⟨y²⟩ = 2Dt, ⟨r²⟩ = 4Dt(D = l²/2τ)이다. 입자 수를 줄였다가 늘려 보자. 몇 개뿐이면 측정한 ⟨r²⟩(파란 선)이 이론 직선(빨간 선) 둘레로 크게 흔들리고, 수천 개면 직선에 붙는다. 처음 값 l = 0.10 nm, τ = 5.0 ps는 물속 작은 분자의 D ≈ 1×10⁻⁹ m²/s에 해당하며, 걸음 1000번(5 ns)까지 계산한다.',
  init: function (api) {
    var NMAX = 1000, PER_FRAME = 4;
    var st = { np: 500, l: 0.10, tau: 5.0, step: 0, seed: 1 };
    var X, Y, msd, path, rnd;
    function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function reset() {
      rnd = mulberry(st.seed * 7919 + 13);
      X = new Int16Array(st.np); Y = new Int16Array(st.np);   // 걸음 단위 정수 좌표
      msd = [0]; path = [[0, 0]]; st.step = 0;
    }
    function advance(k) {
      for (var s = 0; s < k && st.step < NMAX; s++) {
        var sum = 0;
        for (var i = 0; i < st.np; i++) {
          var u = rnd() * 4 | 0;
          X[i] += (u & 1) ? 1 : -1; Y[i] += (u & 2) ? 1 : -1;
          sum += X[i] * X[i] + Y[i] * Y[i];
        }
        st.step++; msd.push(sum / st.np); path.push([X[0], Y[0]]);
      }
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 2.0 : 0.56; }, label: '퍼지는 입자 구름, 제곱 평균 변위 그래프, x 좌표 히스토그램' });
    var ctx = cv.ctx;
    var rN = api.readout('걸음 수 N ');
    var rT = api.readout('시간 t ');
    var rM = api.readout('측정 ⟨r²⟩ ');
    var rTh = api.readout('이론 4Dt ');
    var rD = api.readout('D = l²/2τ ');

    var g = api.group();
    var bPlay = api.button('일시 정지', function () {
      if (loop.playing || loop.wanted) { loop.pause(); bPlay.textContent = '재생'; }
      else { if (st.step >= NMAX) { reset(); } if (api.reduced) { advance(NMAX); draw(); } else { loop.play(); bPlay.textContent = '일시 정지'; } }
    }, { primary: true, parent: g });
    api.button('초기화', function () { st.seed++; reset(); draw(); if (api.reduced) return; loop.play(); bPlay.textContent = '일시 정지'; }, { parent: g });
    api.slider({ id: 'mj-random-walk-2d-np', label: '입자 수', min: 0, max: Math.log10(2000), step: 0.001, value: Math.log10(500),
      format: function (v) { return String(Math.round(Math.pow(10, v))); },
      onInput: function (v) { st.np = Math.max(1, Math.round(Math.pow(10, v))); var n = st.step; reset(); advance(n); draw(); } });
    api.slider({ id: 'mj-random-walk-2d-l', label: '걸음 길이 l', min: 0.05, max: 0.30, step: 0.01, value: 0.10,
      format: function (v) { return v.toFixed(2) + ' nm'; }, onInput: function (v) { st.l = v; draw(); } });
    api.slider({ id: 'mj-random-walk-2d-tau', label: '걸음 시간 간격 τ', min: 1, max: 10, step: 0.5, value: 5,
      format: function (v) { return v.toFixed(1) + ' ps'; }, onInput: function (v) { st.tau = v; draw(); } });

    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      advance(PER_FRAME); draw();
      if (st.step >= NMAX) { loop.pause(); bPlay.textContent = '다시 재생'; }
    });

    function D() { return st.l * st.l / (2 * st.tau); }   // nm²/ps
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        var s = Math.min(w - 20, h * 0.42);
        return { cloud: { x: (w - s) / 2, y: 8, w: s, h: s }, msd: { x: 52, y: s + 40, w: w - 70, h: h * 0.24 }, hist: { x: 52, y: s + 70 + h * 0.24, w: w - 70, h: h - s - 110 - h * 0.24 } };
      }
      var cs = Math.min(h - 16, w * 0.42);
      var rx = cs + 80, rw = w - rx - 16;
      return { cloud: { x: 8, y: 8, w: cs, h: cs }, msd: { x: rx, y: 14, w: rw, h: h * 0.40 }, hist: { x: rx, y: h * 0.40 + 70, w: rw, h: h - h * 0.40 - 110 } };
    }
    function axesBox(T, r, xl, yl) {
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(xl, r.x + r.w / 2, r.y + r.h + 20);
      ctx.save(); ctx.translate(r.x - 40, r.y + r.h / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText(yl, 0, 0); ctx.restore();
    }
    function tick(T, x, y, s, align, base) { ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y); }
    function draw() {
      var T = api.tokens(), Lw = layout(), l = st.l, N = st.step, Dv = D();
      ctx.clearRect(0, 0, cv.w, cv.h);
      // 점 구름: 화면 반폭 = 3.3 l √NMAX (걸음 단위)
      var c = Lw.cloud, half = 3.3 * Math.sqrt(NMAX), sc = c.w / 2 / half, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.strokeRect(c.x, c.y, c.w, c.h);
      // rms 원 (이론)
      var rr = Math.sqrt(2 * N) * sc;
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figBlue; ctx.globalAlpha = st.np > 800 ? 0.45 : 0.7;
      var ds = st.np > 800 ? 1.6 : 2.4;
      for (var i = 0; i < st.np; i++) ctx.fillRect(cx + X[i] * sc - ds / 2, cy - Y[i] * sc - ds / 2, ds, ds);
      ctx.globalAlpha = 1;
      // 한 입자의 궤적
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.4; ctx.beginPath();
      for (i = 0; i < path.length; i++) { var px = cx + path[i][0] * sc, py = cy - path[i][1] * sc; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(cx + X[0] * sc, cy - Y[0] * sc, 4, 0, 7); ctx.fill();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = T.figAmber;
      ctx.fillText('주황: 입자 하나의 궤적', c.x + 6, c.y + 6);
      ctx.fillStyle = T.figRed; ctx.fillText('점선 원: 반지름 √(4Dt)', c.x + 6, c.y + 22);
      // 축척 막대: 2 nm 또는 5 nm
      var bar = l * half > 6 ? 5 : 2, bpx = bar / l * sc;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.x + c.w - 12 - bpx, c.y + c.h - 14); ctx.lineTo(c.x + c.w - 12, c.y + c.h - 14); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(bar + ' nm', c.x + c.w - 12 - bpx / 2, c.y + c.h - 18);

      // ⟨r²⟩–t 그래프 (실제 단위: nm², ns)
      var m = Lw.msd, tmax = NMAX * st.tau / 1000, ymax = 4 * Dv * NMAX * st.tau * 1.35;
      axesBox(T, m, '시간 t (ns)', '⟨r²⟩ (nm²)');
      var mx = function (t) { return m.x + t / tmax * m.w; }, my = function (y) { return m.y + m.h - Math.min(y, ymax) / ymax * m.h; };
      for (var k = 0; k <= 5; k++) { tick(T, mx(tmax * k / 5), m.y + m.h + 4, (tmax * k / 5).toFixed(tmax < 5 ? 1 : 0), 'center', 'top'); }
      var ys = nice(ymax / 4);
      for (var yv = 0; yv <= ymax; yv += ys) tick(T, m.x - 5, my(yv), String(+yv.toPrecision(3)), 'right', 'middle');
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx(0), my(0)); ctx.lineTo(mx(tmax), my(4 * Dv * tmax * 1000)); ctx.stroke();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.8; ctx.beginPath();
      for (k = 0; k < msd.length; k++) { var t = k * st.tau / 1000, yy = msd[k] * l * l; if (k) ctx.lineTo(mx(t), my(yy)); else ctx.moveTo(mx(t), my(yy)); }
      ctx.stroke();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = T.figRed; ctx.fillText('이론 4Dt', m.x + 8, m.y + 2);
      ctx.fillStyle = T.figBlue; ctx.fillText('측정 ⟨r²⟩', m.x + 8, m.y + 18);

      // x 좌표 히스토그램 + 정규 분포 (σ = l√N)
      var hb = Lw.hist, xr = 3.3 * Math.sqrt(NMAX);   // 걸음 단위
      axesBox(T, hb, 'x 좌표 (nm)', '확률 밀도');
      var NB = 33, bw = 2 * xr / NB, cnt = new Array(NB).fill(0);
      for (i = 0; i < st.np; i++) { var b = Math.floor((X[i] + xr) / bw); if (b >= 0 && b < NB) cnt[b]++; }
      var sig = Math.sqrt(Math.max(N, 1)), peak = 1 / (sig * Math.sqrt(2 * Math.PI));
      var dmax = Math.max(peak, 1e-9);
      for (b = 0; b < NB; b++) dmax = Math.max(dmax, cnt[b] / st.np / bw);
      dmax *= 1.1;
      var hx = function (x) { return hb.x + (x + xr) / (2 * xr) * hb.w; }, hy = function (d) { return hb.y + hb.h - Math.min(d, dmax) / dmax * hb.h; };
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1;
      for (b = 0; b < NB; b++) { var d = cnt[b] / st.np / bw; if (!d) continue; var x0 = hx(-xr + b * bw), x1 = hx(-xr + (b + 1) * bw); ctx.fillRect(x0, hy(d), x1 - x0, hy(0) - hy(d)); ctx.strokeRect(x0, hy(d), x1 - x0, hy(0) - hy(d)); }
      if (N > 0) {
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath();
        for (k = 0; k <= 200; k++) { var xx = -xr + k / 200 * 2 * xr, dv = Math.exp(-xx * xx / (2 * sig * sig)) / (sig * Math.sqrt(2 * Math.PI)); if (k) ctx.lineTo(hx(xx), hy(dv)); else ctx.moveTo(hx(xx), hy(dv)); }
        ctx.stroke();
      }
      for (k = -2; k <= 2; k++) { var xv = k * xr / 2; tick(T, hx(xv), hb.y + hb.h + 4, (xv * l).toFixed(1).replace('-', '−'), 'center', 'top'); }
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = T.figRed;
      ctx.fillText('정규 분포 σ = l√N', hb.x + hb.w - 4, hb.y + 2);

      rN.set(String(N)); rT.set((N * st.tau / 1000).toFixed(2) + ' ns');
      rM.set((msd[msd.length - 1] * l * l).toFixed(2) + ' nm²'); rTh.set((4 * Dv * N * st.tau).toFixed(2) + ' nm²');
      rD.set(Dv.toFixed(4) + ' nm²/ps = ' + sci(Dv * 1e-6) + ' m²/s');
    }
    function sci(v) {
      var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e), sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
      return m.toFixed(1) + '×10⁻' + String(-e).split('').map(function (d) { return sup[+d]; }).join('');
    }
    function nice(x) { var e = Math.pow(10, Math.floor(Math.log10(x))), f = x / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; }
    reset(); advance(api.reduced ? NMAX : 300);
    if (api.reduced) bPlay.textContent = '다시 재생';
    api.onResize(draw);
    draw();
  },
});
