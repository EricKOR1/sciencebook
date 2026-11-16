/* 전자기와 양자 1 로런츠 힘: 균일한 자기장 속 하전 입자의 원운동과 나선 운동 (3D) */
Sims.register('charge-in-field', {
  title: '자기장 속을 도는 전하 — 원운동과 나선 운동',
  caption: '속력, 자기장 세기, 입사 각도, 전하의 부호를 바꾸며 궤도를 돌려 보자. 자기장에 수직으로 들어오면 원운동, 비스듬히 들어오면 자기장 방향으로 나아가며 감기는 나선 운동을 한다. 로런츠 힘(주황)은 늘 속도(초록)와 자기장(파랑)에 수직이어서 속력은 그대로이고 방향만 바뀌며, 반지름은 r = mv/qB(비스듬히 들어오면 자기장에 수직인 속도 성분으로 계산)로 속력이 클수록·자기장이 약할수록 커진다. 입자는 양성자(질량 1.67×10⁻²⁷ kg)로 보고, (−)전하는 같은 질량의 입자(반양성자)로 가정했다. 화면의 시간은 실제보다 약 5천만 배 느리게 늘였다.',
  init: function (api) {
    var M = 1.67e-27, Q = 1.6e-19;
    var st = { v: 1.0, B: 0.5, deg: 90, sign: 1, t: 0, t0: 0, playing: !api.reduced };
    var YMIN = -3, YMAX = 3, TS = 3;                // 화면 높이 6 cm, 자기장 1 T일 때 한 바퀴 3초

    var rR = api.readout('궤도 반지름 r');
    var rF = api.readout('로런츠 힘 F = qvB sinθ');
    var rDir = api.readout('회전 방향(자기장이 향하는 쪽에서 볼 때)');
    var rMove = api.readout('운동');

    function derived() {
      var th = st.deg * Math.PI / 180, vp = st.v * Math.sin(th), vl = st.v * Math.cos(th);
      var rcm = M * vp * 1e6 / (Q * st.B) * 100;
      var Tsc = TS / st.B, om = st.sign * 2 * Math.PI / Tsc;
      var vy = 2 * Math.PI * (M * 1e6 / (Q * st.B) * 100) * vl / Tsc; // 한 바퀴 동안 나아가는 거리(cm)/주기
      return { th: th, vp: vp, vl: vl, r: rcm, om: om, vy: vy, Tsc: Tsc };
    }
    function pos(t, d) {
      var R = d.r * st.sign, a = d.om * t;
      return [R * Math.sin(a), (d.vl < 1e-9 ? 0 : YMIN + 0.3) + d.vy * t, -R * Math.cos(a)];
    }

    var S = api.scene3d({
      yaw: 0.55, pitch: 0.32, dist: 22, scale: 0.075, label: '균일한 자기장 속 하전 입자의 궤도',
      aspect: function (w) { return w < 560 ? 1.05 : 0.62; },
      draw: function (g, T) {
        var d = derived();
        // 자기장: 위쪽(+y)을 향하는 화살표 다발
        for (var i = -2; i <= 2; i++) for (var k = -2; k <= 2; k++) {
          var x = i * 2.2, z = k * 2.2;
          g.arrow([x, YMIN - 0.4, z], [x, YMAX + 0.6, z], T.figBlue, { width: 1.2, alpha: 0.35, head: 7 });
        }
        g.text([4.4, YMAX + 1.1, -4.4], '자기장 B', { color: T.figBlue, size: 13, bold: true });
        // 궤도 축(나선의 중심선)
        if (d.r > 0.05) g.line([0, YMIN - 0.4, 0], [0, YMAX + 0.4, 0], T.figMuted, { dash: [4, 4], width: 1 });
        // 지나온 길(최근 1.3바퀴 또는 화면 안에서 지나온 만큼)
        var span = d.vp < 1e-6 ? 6 / Math.max(d.vy, 1e-6) : d.Tsc * 1.3;
        var from = Math.max(st.t0, st.t - span), pts = [], n = 90;
        for (var j = 0; j <= n; j++) pts.push(pos(from + (st.t - from) * j / n, d));
        var col = st.sign > 0 ? T.figRed : T.figViolet;
        g.path(pts, col, { width: 2.4 });
        // 입자, 속도, 힘
        var p = pos(st.t, d), a = d.om * st.t;
        var vx = d.vp * Math.cos(a), vz = d.vp * Math.sin(a), vy = d.vl;
        var vs = 1.6 / Math.max(st.v, 0.5);
        g.sphere(p, 0.32, col, { label: st.sign > 0 ? '+' : '−', labelColor: T.figPaper });
        g.arrow(p, [p[0] + vx * vs * 1.2, p[1] + vy * vs * 1.2, p[2] + vz * vs * 1.2], T.figGreen, { width: 2.6 });
        // F = q v × B,  B = +y : v × ŷ = (−vz, 0, vx)
        var fx = -vz * st.sign, fz = vx * st.sign, fl = Math.hypot(fx, fz);
        if (fl > 1e-6) {
          var fs = 1.3 * Math.sin(d.th) / fl;
          g.arrow(p, [p[0] + fx * fs, p[1], p[2] + fz * fs], T.figAmber, { width: 2.6 });
        }
        g.text([p[0] + vx * vs * 1.3, p[1] + vy * vs * 1.3 + 0.35, p[2] + vz * vs * 1.3], '속도 v', { color: T.figGreen, size: 12, bold: true });
        if (fl > 1e-6) g.text([p[0] + fx * 1.5 * Math.sin(d.th) / fl, p[1] - 0.45, p[2] + fz * 1.5 * Math.sin(d.th) / fl], '힘 F', { color: T.figAmber, size: 12, bold: true });
      },
    });

    function readouts() {
      var d = derived();
      rR.set(d.r < 0.005 ? '0 (원을 그리지 않음)' : d.r.toFixed(2) + ' cm');
      var F = Q * st.v * 1e6 * st.B * Math.sin(d.th);
      rF.set(F < 1e-20 ? '0 N' : (F / 1e-14).toFixed(1) + ' × 10⁻¹⁴ N');
      rDir.set(d.r < 0.005 ? '돌지 않음' : (st.sign > 0 ? '시계 방향' : '시계 반대 방향'));
      rMove.set(st.deg === 90 ? '원운동' : st.deg === 0 ? '직선 운동(힘 0)' : '나선 운동');
    }
    function restart() { st.t = 0; st.t0 = 0; if (!st.playing) settle(); readouts(); S.redraw(); }
    // 멈춘 화면: 한 바퀴 남짓 돈 상태를 바로 보여 준다
    function settle() {
      var d = derived(), want = d.vp < 1e-6 ? 3 / Math.max(d.vy, 1e-6) : d.Tsc * 1.15;
      if (d.vy > 1e-6) want = Math.min(want, (YMAX - YMIN - 0.8) / d.vy);
      st.t = want; st.t0 = 0;
    }

    S.onFrame(function (dt) {
      if (!st.playing || dt <= 0) return;
      st.t += dt;
      var d = derived(), p = pos(st.t, d);
      if (p[1] > YMAX + 0.3) { st.t = 0; st.t0 = 0; }   // 위로 빠져나가면 아래에서 다시 들어온다
    });
    if (!st.playing) { S.loop.pause(); settle(); }

    var g1 = api.group();
    var bPlus = api.button('(+)전하', function () { setSign(1); }, { toggle: true, pressed: true, parent: g1 });
    var bMinus = api.button('(−)전하', function () { setSign(-1); }, { toggle: true, parent: g1 });
    function setSign(s) { st.sign = s; bPlus.setAttribute('aria-pressed', s > 0 ? 'true' : 'false'); bMinus.setAttribute('aria-pressed', s < 0 ? 'true' : 'false'); restart(); }
    var bPlay = api.button(st.playing ? '멈춤' : '움직이기', function () {
      st.playing = !st.playing; bPlay.textContent = st.playing ? '멈춤' : '움직이기';
      if (st.playing) S.loop.play(); else { if (!S.auto) S.loop.pause(); S.redraw(); }
    }, { primary: true, parent: g1 });
    api.slider({ id: 'charge-in-field-v', label: '속력 v', min: 0.5, max: 2, step: 0.1, value: st.v,
      format: function (v) { return v.toFixed(1) + ' × 10⁶ m/s'; }, onInput: function (v) { st.v = v; restart(); } });
    api.slider({ id: 'charge-in-field-b', label: '자기장 세기 B', min: 0.5, max: 2, step: 0.1, value: st.B,
      format: function (v) { return v.toFixed(1) + ' T'; }, onInput: function (v) { st.B = v; restart(); } });
    api.slider({ id: 'charge-in-field-a', label: '속도와 자기장 사이의 각 θ', min: 0, max: 90, step: 5, value: st.deg,
      format: function (v) { return v + '°'; }, onInput: function (v) { st.deg = v; restart(); } });
    readouts();
    S.redraw();
  },
});
