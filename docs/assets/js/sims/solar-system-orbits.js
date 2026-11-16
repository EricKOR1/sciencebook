/* 행성우주과학 1: 케플러 법칙 — 타원 궤도, 면적 속도 일정, T² = a³ (케플러 방정식을 풀어 정확히 움직인다) */
Sims.register('solar-system-orbits', {
  title: '케플러의 세 법칙 — 타원 궤도 위를 도는 행성',
  caption: '이심률과 긴반지름을 바꾸거나 행성 버튼으로 실제 궤도를 불러와 보자. 색칠된 부채꼴 12개는 공전 주기의 1/12씩 같은 시간 동안 태양–행성 선분이 쓸고 지나간 넓이로, 모양은 달라도 넓이는 모두 같다. 그래서 행성은 근일점에서 빠르고 원일점에서 느리며, 긴반지름이 클수록 공전 주기가 T² = a³(년·AU)에 따라 길어진다. 행성끼리의 인력은 무시했고, 근일점 방향은 모두 같은 쪽으로 그렸다. 화면에서는 고른 궤도를 약 8초에 한 바퀴 돌도록 시간을 줄였고, 점선 원은 같은 시간 동안의 지구이다.',
  init: function (api) {
    var N = 12, TWO_PI = Math.PI * 2;
    var presets = [
      { name: '수성', a: 0.387, e: 0.206, i: 7.0 },
      { name: '금성', a: 0.723, e: 0.007, i: 3.4 },
      { name: '지구', a: 1.0, e: 0.017, i: 0 },
      { name: '화성', a: 1.524, e: 0.093, i: 1.85 },
      { name: '목성', a: 5.203, e: 0.049, i: 1.3 },
    ];
    var st = { a: 1.524, e: 0.093, inc: 1.85, M: 0, earthM: 0, playing: !api.reduced };

    var rAE = api.readout('긴반지름 a · 이심률 e');
    var rQ = api.readout('근일점 q · 원일점 Q');
    var rT = api.readout('공전 주기 T');
    var rK = api.readout('T² 과 a³');
    var rNow = api.readout('지금 거리 · 속력');
    var rRatio = api.readout('근일점 속력 ÷ 원일점 속력 (= Q/q)');

    function solveE(M, e) {
      var E = e < 0.8 ? M : Math.PI;
      for (var k = 0; k < 30; k++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-12) break; }
      return E;
    }
    function scale() { return 2.55 / Math.max(st.a * (1 + st.e), 1.08); }
    // 궤도면 좌표(x: 근일점 방향, w: 진행 방향 90°)를 3D로: 궤도면은 x축(교점선)을 축으로 i만큼 기울어진다
    function to3(x, w, s) {
      var ci = Math.cos(st.inc * Math.PI / 180), si = Math.sin(st.inc * Math.PI / 180);
      return [x * s, w * s * si, -w * s * ci];
    }
    function posE(E, s) { var b = st.a * Math.sqrt(1 - st.e * st.e); return to3(st.a * (Math.cos(E) - st.e), b * Math.sin(E), s); }
    function period() { return Math.pow(st.a, 1.5); }

    var S = api.scene3d({
      yaw: 0.35, pitch: 0.62, dist: 10, scale: 0.155, label: '태양 둘레의 타원 궤도와 같은 시간 동안 쓸고 지나간 넓이',
      aspect: function (w) { return w < 560 ? 0.95 : 0.62; },
      draw: function (g, T) {
        var s = scale(), e = st.e, a = st.a;
        // 기준면(지구 궤도면)
        g.circle([0, 0, 0], 2.85, [0, 1, 0], T.figLine, { width: 0.8, alpha: 0.12, fill: T.figSoftTeal, lineAlpha: 0.5 });
        g.circle([0, 0, 0], s * 1.0, [0, 1, 0], T.figBlue, { width: 1.2, dash: [4, 4] });
        // 같은 시간 간격의 부채꼴
        var cur = Math.floor(st.M / (TWO_PI / N)) % N;
        for (var k = 0; k < N; k++) {
          var E0 = solveE(k * TWO_PI / N, e), E1 = solveE((k + 1) * TWO_PI / N, e);
          if (k === N - 1) E1 = TWO_PI;
          var pts = [[0, 0, 0]];
          for (var j = 0; j <= 10; j++) pts.push(posE(E0 + (E1 - E0) * j / 10, s));
          var col = k === cur ? T.figAccent : (k % 2 ? T.figAmber : T.figBlue);
          g.poly(pts, col, { alpha: k === cur ? 0.45 : 0.2 });
        }
        // 궤도
        var orbit = []; for (var m = 0; m < 120; m++) orbit.push(posE(m / 120 * TWO_PI, s));
        g.path(orbit, T.figInk, { width: 2, closed: true });
        // 근일점·원일점·빈 초점
        var peri = posE(0, s), aph = posE(Math.PI, s);
        g.line(aph, peri, T.figMuted, { width: 1, dash: [3, 4] });
        g.sphere(peri, 0.035, T.figMuted, { flat: true }); g.sphere(aph, 0.035, T.figMuted, { flat: true });
        g.text([peri[0] + 0.05, peri[1] - 0.22, peri[2]], '근일점', { size: 12, color: T.figMuted, align: 'left' });
        g.text([aph[0] - 0.05, aph[1] - 0.22, aph[2]], '원일점', { size: 12, color: T.figMuted, align: 'right' });
        if (e > 0.12) { var f2 = to3(-2 * a * e, 0, s); g.sphere(f2, 0.04, T.figLine, { flat: true }); g.text([f2[0], f2[1] + 0.2, f2[2]], '빈 초점', { size: 11, color: T.figMuted }); }
        // 태양
        g.sphere([0, 0, 0], 0.2, T.figAmber, { label: '' });
        g.text([0, 0.36, 0], '태양(초점)', { size: 12, bold: true });
        // 지구(비교용)
        if (Math.abs(a - 1) > 0.03 || e > 0.05) {
          var ea = st.earthM; g.sphere([Math.cos(ea) * s, 0, -Math.sin(ea) * s], 0.07, T.figBlue, { alpha: 0.75 });
        }
        // 행성과 속도 화살표
        var E = solveE(st.M, e), p = posE(E, s), r = a * (1 - e * Math.cos(E));
        var b = a * Math.sqrt(1 - e * e), dx = -a * Math.sin(E), dw = b * Math.cos(E), dl = Math.hypot(dx, dw);
        var v = 29.78 * Math.sqrt(2 / r - 1 / a), vq = 29.78 * Math.sqrt(2 / (a * (1 - e)) - 1 / a);
        var L = 0.95 * v / vq, tip = to3(a * (Math.cos(E) - e) + dx / dl * L / s, b * Math.sin(E) + dw / dl * L / s, s);
        g.line([0, 0, 0], p, T.figAccent, { width: 1.6 });
        g.arrow(p, tip, T.figRed, { width: 2.4 });
        g.sphere(p, 0.12, T.figRed, {});
        g.text([tip[0], tip[1] + 0.18, tip[2]], v.toFixed(1) + ' km/s', { size: 12, color: T.figRed, bold: true });
        readouts(r, v);
      },
    });
    function readouts(r, v) {
      var a = st.a, e = st.e, Tp = period(), q = a * (1 - e), Q = a * (1 + e);
      rAE.set(a.toFixed(3) + ' AU · ' + e.toFixed(3));
      rQ.set(q.toFixed(2) + ' AU · ' + Q.toFixed(2) + ' AU');
      rT.set(Tp < 2 ? Tp.toFixed(3) + '년 (' + Math.round(Tp * 365.25) + '일)' : Tp.toFixed(2) + '년');
      rK.set('T² = ' + (Tp * Tp).toFixed(3) + ', a³ = ' + Math.pow(a, 3).toFixed(3));
      rNow.set(r.toFixed(2) + ' AU · ' + v.toFixed(1) + ' km/s');
      rRatio.set(((1 + e) / (1 - e)).toFixed(2) + '배');
    }

    var gp = api.group();
    var pbtn = presets.map(function (p, idx) {
      return api.button(p.name, function () { load(idx); }, { toggle: true, pressed: idx === 3, parent: gp });
    });
    function load(idx) {
      var p = presets[idx];
      sA.set(p.a); sE.set(p.e); sI.set(p.i);
      pbtn.forEach(function (b, j) { b.setAttribute('aria-pressed', j === idx ? 'true' : 'false'); });
    }
    function unpress() { pbtn.forEach(function (b, j) { var p = presets[j]; b.setAttribute('aria-pressed', Math.abs(p.a - st.a) < 1e-6 && Math.abs(p.e - st.e) < 1e-6 ? 'true' : 'false'); }); }
    var sA = api.slider({ id: 'solar-system-orbits-a', label: '긴반지름 a', min: 0.3, max: 6, step: 0.001, value: st.a,
      format: function (v) { return v.toFixed(2) + ' AU'; }, onInput: function (v) { st.a = v; unpress(); S.redraw(); } });
    var sE = api.slider({ id: 'solar-system-orbits-e', label: '이심률 e', min: 0, max: 0.9, step: 0.001, value: st.e,
      format: function (v) { return v.toFixed(3); }, onInput: function (v) { st.e = v; unpress(); S.redraw(); } });
    var sI = api.slider({ id: 'solar-system-orbits-i', label: '궤도 기울기', min: 0, max: 30, step: 0.05, value: st.inc,
      format: function (v) { return v.toFixed(1) + '°'; }, onInput: function (v) { st.inc = v; S.redraw(); } });
    var g2 = api.group();
    var playBtn = api.button(st.playing ? '멈춤' : '움직이기', function () { setPlay(!st.playing); }, { primary: true, parent: g2 });
    api.button('1/12 주기만큼 앞으로', function () {
      setPlay(false);
      var k = Math.floor(st.M / (TWO_PI / N) + 1e-9) + 1;
      var dM = k * TWO_PI / N - st.M; st.M = (k % N) * TWO_PI / N;
      st.earthM = (st.earthM + dM * period()) % TWO_PI;
      S.redraw();
    }, { parent: g2 });
    function setPlay(on) {
      st.playing = on; playBtn.textContent = on ? '멈춤' : '움직이기';
      if (on) S.loop.play(); else if (!S.auto) S.loop.pause();
    }
    S.onFrame(function (dt) {
      if (!st.playing || !(dt > 0)) return;
      var Tp = period(), yrs = dt * Tp / 8;          // 고른 궤도를 8초에 한 바퀴
      st.M = (st.M + TWO_PI * yrs / Tp) % TWO_PI;
      st.earthM = (st.earthM + TWO_PI * yrs) % TWO_PI;
    });
    if (!st.playing) S.loop.pause();
    S.redraw();
  },
});
