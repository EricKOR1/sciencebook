/* 지구과학 2 방사성 동위 원소와 절대 연령: 입자는 무작위로 붕괴하지만 전체는 반감기마다 절반씩 줄어든다 */
Sims.register('radiometric-dating', {
  title: '돌 속의 시계 — 방사성 동위 원소의 붕괴',
  caption: '동위 원소를 고르고 시간을 흘려보내면, 파란 모원소가 하나씩 주황 자원소로 바뀐다. 어느 입자가 언제 바뀔지는 알 수 없지만(새 시료를 눌러 비교해 보자), 400개 전체는 반감기마다 남은 양의 절반씩 줄어드는 곡선을 따른다. "남은 모원소 비율"을 정하면 곡선에서 나이를 읽어 낸다. 처음에 자원소가 없었고, 광물이 만들어진 뒤 원소가 드나들지 않았다고 가정했다. 반감기는 원고의 표에 있는 어림값이다.',
  init: function (api) {
    var ISO = [
      { key: 'u238', name: '우라늄-238', p: 'U-238', d: 'Pb-206', T: 45e8 },
      { key: 'u235', name: '우라늄-235', p: 'U-235', d: 'Pb-207', T: 7e8 },
      { key: 'k40', name: '칼륨-40', p: 'K-40', d: 'Ar-40', T: 12.5e8 },
      { key: 'rb87', name: '루비듐-87', p: 'Rb-87', d: 'Sr-87', T: 490e8 },
      { key: 'c14', name: '탄소-14', p: 'C-14', d: 'N-14', T: 5730 },
    ];
    var N = 400, NMAX = 5, EARTH = 46e8;
    var st = { iso: ISO[2], n: 0, playing: false };
    var life = [];
    function reseed() { life = []; for (var i = 0; i < N; i++) life.push(-Math.log(1 - Math.random()) / Math.LN2); } // 반감기 단위의 붕괴 시각
    reseed();

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.5; }, label: '모원소와 자원소 입자 상자와 붕괴 곡선' });
    var ctx = cv.ctx;
    var rT = api.readout('지난 시간'), rN = api.readout('반감기 횟수'), rP = api.readout('남은 모원소(곡선)'), rC = api.readout('실제 입자'), rR = api.readout('모원소 : 자원소');

    var g = api.group();
    var btns = ISO.map(function (s) {
      return api.button(s.name, function () { st.iso = s; btns.forEach(function (b, i) { b.setAttribute('aria-pressed', ISO[i] === s ? 'true' : 'false'); }); update(); },
        { toggle: true, pressed: s === st.iso, parent: g });
    });
    var sT = api.slider({ id: 'radiometric-dating-t', label: '시간(반감기 단위)', min: 0, max: NMAX, step: 0.01, value: 0,
      format: function (v) { return v.toFixed(2) + '회'; },
      onInput: function (v) { st.n = v; if (!syncing) { syncing = true; sF.set(Math.round(Math.pow(0.5, v) * 1000) / 10); syncing = false; } update(); } });
    var sF = api.slider({ id: 'radiometric-dating-f', label: '남은 모원소 비율로 나이 읽기', min: 3.1, max: 100, step: 0.1, value: 100,
      format: function (v) { return v.toFixed(1) + ' %'; },
      onInput: function (v) { if (!syncing) { syncing = true; sT.set(Math.min(NMAX, Math.log(100 / v) / Math.LN2)); syncing = false; } } });
    var syncing = false;
    var g2 = api.group();
    var play = api.button('시간 흘려보내기', function () {
      if (st.playing) { stopPlay(); return; }
      if (st.n >= NMAX - 0.001) sT.set(0);
      if (api.reduced) { sT.set(Math.min(NMAX, Math.floor(st.n + 1e-6) + 1)); return; }
      st.playing = true; play.textContent = '멈춤'; loop.play();
    }, { primary: true, parent: g2 });
    if (api.reduced) play.textContent = '반감기 1회 지나기';
    api.button('새 시료(다시 섞기)', function () { reseed(); update(); }, { parent: g2 });
    function stopPlay() { st.playing = false; loop.pause(); play.textContent = api.reduced ? '반감기 1회 지나기' : '시간 흘려보내기'; }
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var v = st.n + dt * 0.5;
      if (v >= NMAX) { v = NMAX; stopPlay(); }
      sT.set(v);
    });
    loop.pause();

    function fmtYears(y) {
      if (y < 1) return '0년';
      if (y < 1e4) return Math.round(y).toLocaleString('ko-KR') + '년';
      if (y < 1e8) return (Math.round(y / 1e3) / 10).toLocaleString('ko-KR') + '만 년';
      var e = y / 1e8;
      return (e < 10 ? e.toFixed(1) : Math.round(e).toLocaleString('ko-KR')) + '억 년';
    }
    function alive() { var c = 0; for (var i = 0; i < N; i++) if (life[i] > st.n) c++; return c; }
    function update() {
      var c = alive(), frac = Math.pow(0.5, st.n), age = st.n * st.iso.T;
      rT.set(fmtYears(age) + (age > EARTH ? ' (지구 나이보다 김)' : ''));
      rN.set(st.n.toFixed(2) + '회');
      rP.set((frac * 100).toFixed(1) + ' %');
      rC.set(c + ' / ' + N + '개');
      var dch = 1 / frac - 1;
      rR.set('1 : ' + (dch < 10 ? dch.toFixed(2) : dch.toFixed(1)));
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) { var bh = Math.min(w * 0.62, h * 0.46); return { box: { x: 0, y: 0, w: w, h: bh }, gr: { x: 0, y: bh + 10, w: w, h: h - bh - 10 } }; }
      return { box: { x: 0, y: 0, w: w * 0.38, h: h }, gr: { x: w * 0.42, y: 0, w: w * 0.58, h: h } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawBox(T, L.box); drawGraph(T, L.gr);
    }
    function drawBox(T, r) {
      var cols = 20, rows = 20, top = r.y + 24, size = Math.min((r.w - 8) / cols, (r.h - top - 30) / rows);
      var ox = r.x + (r.w - size * cols) / 2;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('광물 속 원자 ' + N + '개', r.x + r.w / 2, r.y + 14);
      for (var i = 0; i < N; i++) {
        var cx = ox + (i % cols + 0.5) * size, cy = top + (Math.floor(i / cols) + 0.5) * size, on = life[i] > st.n;
        var justNow = !on && st.n - life[i] < 0.06;
        ctx.beginPath(); ctx.arc(cx, cy, size * (justNow ? 0.46 : 0.36), 0, 2 * Math.PI);
        ctx.fillStyle = on ? T.figBlue : T.figAmber; ctx.fill();
      }
      var ly = top + rows * size + 16;
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      dot(r.x + r.w * 0.08, ly, T.figBlue); ctx.fillStyle = T.figInk; ctx.fillText('모원소 ' + st.iso.p, r.x + r.w * 0.08 + 10, ly + 4);
      dot(r.x + r.w * 0.55, ly, T.figAmber); ctx.fillStyle = T.figInk; ctx.fillText('자원소 ' + st.iso.d, r.x + r.w * 0.55 + 10, ly + 4);
      function dot(x, y, c) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fillStyle = c; ctx.fill(); }
    }
    function drawGraph(T, r) {
      var L = r.x + 48, R = r.x + r.w - 26, Tp = r.y + 22, B = r.y + r.h - 46;
      function X(n) { return L + n / NMAX * (R - L); }
      function Y(f) { return B - f * (B - Tp); }
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      [0, 25, 50, 75, 100].forEach(function (p) { ctx.beginPath(); ctx.moveTo(L, Y(p / 100)); ctx.lineTo(R, Y(p / 100)); ctx.stroke(); ctx.fillText(p, L - 5, Y(p / 100) + 4); });
      ctx.textAlign = 'center';
      for (var k = 0; k <= NMAX; k++) {
        ctx.beginPath(); ctx.moveTo(X(k), Tp); ctx.lineTo(X(k), B); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.fillText(k, X(k), B + 13);
        ctx.font = '11px ' + T.fontBody; if (k > 0 && (r.w > 330 || k % 2 === 1)) ctx.fillText(fmtYears(k * st.iso.T), X(k), B + 27);
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('지난 반감기 횟수 (아래: ' + st.iso.name + '의 시간)', (L + R) / 2, B + 42);
      ctx.save(); ctx.translate(r.x + 11, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('남은 모원소 (%)', 0, 0); ctx.restore();
      // 지구 나이 표시
      var nE = EARTH / st.iso.T;
      if (nE <= NMAX) {
        ctx.strokeStyle = T.figRed; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(nE), Tp); ctx.lineTo(X(nE), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figRed; ctx.textAlign = nE > NMAX * 0.7 ? 'right' : 'left'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('지구 나이 46억 년', X(nE) + (nE > NMAX * 0.7 ? -4 : 4), Tp + 12);
      } else {
        ctx.fillStyle = T.figRed; ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('지구 나이(46억 년)는 반감기 ' + nE.toFixed(2) + '회', R, Tp - 6);
      }
      // 이론 곡선
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.2; ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var n = NMAX * i / 200; if (i) ctx.lineTo(X(n), Y(Math.pow(0.5, n))); else ctx.moveTo(X(n), Y(1)); }
      ctx.stroke();
      // 실제 입자 수(계단)
      var sorted = life.slice().sort(function (a, b) { return a - b; });
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(0), Y(1));
      var remain = N;
      for (i = 0; i < sorted.length && sorted[i] <= st.n; i++) {
        ctx.lineTo(X(sorted[i]), Y(remain / N)); remain--; ctx.lineTo(X(sorted[i]), Y(remain / N));
      }
      ctx.lineTo(X(st.n), Y(remain / N)); ctx.stroke();
      // 현재 점과 안내선
      var f = Math.pow(0.5, st.n);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(L, Y(f)); ctx.lineTo(X(st.n), Y(f)); ctx.lineTo(X(st.n), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(X(st.n), Y(f), 5, 0, 2 * Math.PI); ctx.fillStyle = T.figAccent; ctx.fill();
      // 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figBlue; ctx.fillText('파란 곡선: 반감기마다 절반', R, Y(0.6));
      ctx.fillStyle = T.figAmber; ctx.fillText('주황 계단: 실제 남은 입자 수', R, Y(0.6) + 15);
    }

    api.onResize(draw);
    update();
  },
});
