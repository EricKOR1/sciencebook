/* 중1-7 태양계: 태양–지구–달의 위치에 따라 달의 위상이 바뀌는 까닭, 일식·월식이 일어나는 자리 (3D) */
Sims.register('moon-phases', {
  title: '달은 왜 모양이 바뀔까? — 태양·지구·달 모형',
  caption: '슬라이더나 ‘재생’으로 달을 공전시키며, 달의 햇빛 받는 절반은 늘 태양 쪽을 향하지만 지구에서 그 절반이 보이는 정도가 달라지는 것을 확인해 보자. 아래 칸은 우리나라에서 본 달의 모양이다. 삭일 때는 달 그림자가 지구에(일식), 망일 때는 달이 지구 그림자 속에(월식) 들어갈 수 있다. 그러나 실제 달의 공전 궤도는 지구의 공전 궤도면에 대해 조금 기울어져 있어, 대부분의 삭·망에서는 세 천체가 정확히 일직선이 되지 않으므로 식이 매달 일어나지는 않는다(‘궤도 기울기 보기’는 기울기를 과장해 보여 준다). 천체의 크기와 거리 비율, 그림자의 길이는 실제와 다른 모식도이다.',
  init: function (api) {
    var PERIOD = 29.5, R = 1.8, RE = 0.42, RM = 0.2, SUNX = -3.1, TILT = 18 * Math.PI / 180;
    var state = { day: 7.4, tilt: false };
    // 실제 색이 내용인 부분(햇빛 받는 면, 밤 쪽, 그림자)은 고정 색을 쓴다
    var C = { moonLit: '#f1e3a2', moonDark: '#4b5262', moonRed: '#a5482f', earthDay: '#5b9be6', earthNight: '#22324e', shadow: '#0a0f1c', sky: '#0f1726' };

    var rDay = api.readout('삭 이후 지난 날');
    var rName = api.readout('지구에서 본 달');
    var rFrac = api.readout('밝게 보이는 부분');
    var rEcl = api.readout('식');

    function elong() { return (state.day / PERIOD) * Math.PI * 2; }   // 태양에서 동쪽으로 떨어진 각
    function moonPos(e) {
      var phi = Math.PI + e, x = R * Math.cos(phi), z = -R * Math.sin(phi), y = 0;
      if (state.tilt) { y = x * Math.sin(TILT); x = x * Math.cos(TILT); }   // 교점을 z축에 두어 삭·망에서 가장 벗어나게
      return [x, y, z];
    }
    var OX = 0.6;   // 태양까지 포함한 장면이 화면 가운데 오도록 조금 오른쪽으로 옮긴다
    function sh(p) { return [p[0] + OX, p[1], p[2]]; }
    function shifted(g) {
      return {
        sphere: function (p, r, c, o) { g.sphere(sh(p), r, c, o); },
        text: function (p, t, o) { g.text(sh(p), t, o); },
        arrow: function (a, b, c, o) { g.arrow(sh(a), sh(b), c, o); },
        path: function (pts, c, o) { g.path(pts.map(sh), c, o); },
        poly: function (pts, c, o) { g.poly(pts.map(sh), c, o); },
        circle: function (p, r, n, c, o) { g.circle(sh(p), r, n, c, o); },
      };
    }
    function shadowR(x) { return RE - 0.06 * x; }   // 지구 그림자(본그림자) 반지름: 멀어질수록 조금씩 가늘어짐
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function camDir(S) { var cp = Math.cos(S.pitch), sp = Math.sin(S.pitch); return [-cp * Math.sin(S.yaw), sp, cp * Math.cos(S.yaw)]; }

    // 햇빛 방향(태양 쪽 = -x)을 극으로 삼아 구를 나누면 밝은 면과 어두운 면의 경계가 깔끔하다
    function litSphere(g, c, r, colorFn, cam) {
      var NA = 8, NB = 16;
      function pt(a, b) { var s = Math.sin(a); return [c[0] - r * Math.cos(a), c[1] + r * s * Math.cos(b), c[2] + r * s * Math.sin(b)]; }
      for (var i = 0; i < NA; i++) for (var j = 0; j < NB; j++) {
        var a0 = Math.PI * i / NA, a1 = Math.PI * (i + 1) / NA, b0 = 2 * Math.PI * j / NB, b1 = 2 * Math.PI * (j + 1) / NB;
        var am = (a0 + a1) / 2, bm = (b0 + b1) / 2, sm = Math.sin(am);
        var n = [-Math.cos(am), sm * Math.cos(bm), sm * Math.sin(bm)];
        if (n[0] * cam[0] + n[1] * cam[1] + n[2] * cam[2] < -0.08) continue;
        var col = colorFn(am < Math.PI / 2, [c[0] + r * n[0], c[1] + r * n[1], c[2] + r * n[2]]);
        g.poly([pt(a0, b0), pt(a1, b0), pt(a1, b1), pt(a0, b1)], col, { alpha: 1, stroke: col, strokeWidth: 0.8 });
      }
    }
    // 그림자 원뿔(끝이 잘린 원뿔)을 십자 모양 반투명 면 두 장으로 나타낸다
    function shadowCone(g, from, r0, len, r1, dir, alpha) {
      var N = 6, base = [[0, 1, 0], [0, 0, 1]];
      base.forEach(function (u) {
        for (var k = 0; k < N; k++) {
          var t0 = k / N, t1 = (k + 1) / N, ra = r0 + (r1 - r0) * t0, rb = r0 + (r1 - r0) * t1;
          var p0 = [from[0] + dir * len * t0, from[1], from[2]], p1 = [from[0] + dir * len * t1, from[1], from[2]];
          g.poly([[p0[0], p0[1] + u[1] * ra, p0[2] + u[2] * ra], [p1[0], p1[1] + u[1] * rb, p1[2] + u[2] * rb],
            [p1[0], p1[1] - u[1] * rb, p1[2] - u[2] * rb], [p0[0], p0[1] - u[1] * ra, p0[2] - u[2] * ra]], C.shadow, { alpha: alpha });
        }
      });
    }

    function eclipse() {
      var e = elong(), m = moonPos(e), off = Math.hypot(m[1], m[2]);
      if (m[0] > 0 && off < shadowR(m[0]) + RM) return { kind: 'lunar', full: off < shadowR(m[0]) - RM };
      if (m[0] < 0 && off < RE) return { kind: 'solar' };
      return null;
    }

    var S = api.scene3d({
      yaw: 0.45, pitch: 0.62, dist: 12, scale: 0.18,
      aspect: function (w) { return w < 560 ? 0.7 : 0.46; },
      label: '태양 빛을 받는 지구와 달의 공전 모형',
      draw: function (g0, T, S) {
        var g = shifted(g0);
        var cam = camDir(S), e = elong(), m = moonPos(e), ecl = eclipse();
        var sa = T.dark ? 0.32 : 0.16;
        // 태양과 햇빛
        g.sphere([SUNX, 0, 0], 0.42, '#f2b84b', { flat: false });
        g.text([SUNX, -0.7, 0], '태양', { bold: true, size: 13 });
        [-0.7, 0.7].forEach(function (y) { g.arrow([SUNX + 0.55, y, 0], [SUNX + 1.0, y, 0], T.figAmber, { width: 2 }); });
        g.text([SUNX + 0.78, 1.0, 0], '햇빛', { color: T.figAmber, size: 12, bold: true });
        // 달의 궤도
        var orbit = [];
        for (var k = 0; k < 96; k++) {
          var phi = Math.PI * 2 * k / 96, x = R * Math.cos(phi), y = 0, z = -R * Math.sin(phi);
          if (state.tilt) { y = x * Math.sin(TILT); x = x * Math.cos(TILT); }
          orbit.push([x, y, z]);
        }
        g.path(orbit, T.figMuted, { dash: [4, 4], width: 1.3, closed: true });
        if (state.tilt) g.circle([0, 0, 0], R, [0, 1, 0], T.figLine, { dash: [2, 5], width: 1 });
        // 공전 방향 화살표 (북극 쪽에서 볼 때 시계 반대 방향)
        var pa = moonPos(Math.PI * 0.68), pb = moonPos(Math.PI * 0.78);
        g.arrow([pa[0] * 1.1, pa[1] * 1.1, pa[2] * 1.1], [pb[0] * 1.1, pb[1] * 1.1, pb[2] * 1.1], T.figMuted, { width: 1.6, head: 8 });
        // 삭·상현·망·하현 자리
        [[0, '삭', '일식 가능'], [Math.PI / 2, '상현'], [Math.PI, '망', '월식 가능'], [Math.PI * 1.5, '하현']].forEach(function (p) {
          var q = moonPos(p[0]), f = 1 + (p[2] ? 0.5 : 0.32) / R;
          g.text([q[0] * f, q[1] * f, q[2] * f], p[1], { color: T.figMuted, size: 12, bold: true, dy: p[2] ? -8 : 0 });
          if (p[2]) g.text([q[0] * f, q[1] * f, q[2] * f], p[2], { color: T.figRed, size: 11, dy: 8 });
        });
        // 그림자
        shadowCone(g, [0, 0, 0], RE, 3.0, shadowR(3.0), 1, sa);
        shadowCone(g, m, RM, R - RE + 0.05, 0.0, 1, sa);
        // 지구
        litSphere(g, [0, 0, 0], RE, function (lit) { return lit ? C.earthDay : C.earthNight; }, cam);
        g.circle([0, 0, 0], RE * 1.03, cam, T.figLine, { width: 1 });
        g.arrow([0, RE, 0], [0, RE + 0.45, 0], T.figInk, { width: 1.6, head: 7 });
        g.text([0, RE + 0.62, 0], '북극', { size: 11 });
        g.text([0, -RE - 0.28, 0], '지구', { bold: true, size: 13 });
        // 달 (지구 그림자에 든 부분은 붉고 어둡게)
        litSphere(g, m, RM, function (lit, p) {
          if (!lit) return C.moonDark;
          if (p[0] > 0 && Math.hypot(p[1], p[2]) < shadowR(p[0])) return C.moonRed;
          return C.moonLit;
        }, cam);
        g.circle(m, RM * 1.05, cam, T.figLine, { width: 1 });
        g.text([m[0], m[1] + RM + 0.25, m[2]], '달', { bold: true, size: 13 });
        if (ecl && ecl.kind === 'solar') g.text([0, RE + 1.0, 0], '일식!', { color: T.figRed, bold: true, size: 13 });
      },
    });

    // 아래 칸: 지구(우리나라)에서 본 달의 모양
    var PH = [[0, '삭'], [45, '초승달'], [90, '상현달'], [180, '보름달'], [270, '하현달'], [315, '그믐달']];
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.72 : 0.24; }, label: '지구에서 본 달의 모양' });
    var ctx = cv.ctx;
    function phaseName(deg) {
      if (deg < 8 || deg > 352) return '삭';
      if (deg < 80) return '초승달';
      if (deg <= 100) return '상현달';
      if (deg < 172) return '상현달과 보름달 사이';
      if (deg <= 188) return '보름달 (망)';
      if (deg < 260) return '보름달과 하현달 사이';
      if (deg <= 280) return '하현달';
      return '그믐달';
    }
    function drawMoon(cx, cy, r, eRad, red) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = C.moonDark; ctx.fill();
      var waxing = Math.sin(eRad) >= 0, c = Math.cos(eRad), N = 40;
      ctx.beginPath();
      for (var i = 0; i <= N; i++) {   // 밝은 쪽 가장자리(위→아래)
        var a = -Math.PI / 2 + Math.PI * i / N, x = Math.cos(a) * r * (waxing ? 1 : -1), y = Math.sin(a) * r;
        ctx.lineTo(cx + x, cy + y);
      }
      for (var j = N; j >= 0; j--) {   // 명암 경계(아래→위)
        var b = -Math.PI / 2 + Math.PI * j / N, yy = Math.sin(b) * r, w = Math.cos(b) * r;
        ctx.lineTo(cx + (waxing ? c * w : -c * w), cy + yy);
      }
      ctx.closePath(); ctx.fillStyle = red ? C.moonRed : C.moonLit; ctx.fill();
    }
    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      return narrow ? { big: { x: 0, y: 0, w: w, h: h * 0.56 }, strip: { x: 0, y: h * 0.58, w: w, h: h * 0.42 } }
        : { big: { x: 0, y: 0, w: w * 0.36, h: h }, strip: { x: w * 0.38, y: 0, w: w * 0.62, h: h } };
    }
    function draw2() {
      var T = api.tokens(), L = layout(), e = elong(), deg = e * 180 / Math.PI, ecl = eclipse();
      ctx.clearRect(0, 0, cv.w, cv.h);
      // 큰 그림: 밤하늘 칸
      var B = L.big;
      ctx.fillStyle = C.sky; roundRect(B.x + 2, B.y + 2, B.w - 4, B.h - 4, 8); ctx.fill();
      var r = Math.min(B.h * 0.3, B.w * 0.18);
      var red = ecl && ecl.kind === 'lunar';
      drawMoon(B.x + B.w * 0.3, B.y + B.h * 0.5, r, e, red);
      ctx.fillStyle = '#e5ebf3'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var tx = B.x + B.w * 0.3 + r + 14;
      ctx.font = '12px ' + T.fontBody; ctx.fillText('지구에서 본 모양', tx, B.y + B.h * 0.5 - 20);
      ctx.font = '600 15px ' + T.fontBody;
      var nm = red ? '월식 중인 보름달' : phaseName(deg);
      wrapText(nm, tx, B.y + B.h * 0.5 + 2, B.x + B.w - tx - 8, 18);
      // 위상 띠
      var Sd = L.strip, n = PH.length, cw = Sd.w / n, rr = Math.min(cw * 0.3, Sd.h * 0.26);
      PH.forEach(function (p, i) {
        var cx = Sd.x + cw * (i + 0.5), cy = Sd.y + Math.max(rr + 10, Sd.h * 0.5 - rr * 0.6 - 14), er = p[0] * Math.PI / 180;
        var near = Math.abs(((deg - p[0] + 540) % 360) - 180) < 12;
        if (near) { ctx.fillStyle = T.accentSoft; roundRect(cx - cw / 2 + 3, Sd.y + 4, cw - 6, Sd.h - 8, 8); ctx.fill(); }
        ctx.fillStyle = C.sky; ctx.beginPath(); ctx.arc(cx, cy, rr + 4, 0, Math.PI * 2); ctx.fill();
        drawMoon(cx, cy, rr, er, false);
        ctx.fillStyle = near ? T.ink : T.figMuted; ctx.textAlign = 'center';
        ctx.font = (near ? '600 ' : '') + '12px ' + T.fontBody; ctx.fillText(p[1], cx, cy + rr + 15);
        ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
        ctx.fillText('약 ' + (p[0] / 360 * PERIOD).toFixed(0) + '일', cx, cy + rr + 30);
      });
    }
    function wrapText(t, x, y, maxW, lh) {
      var k = t.indexOf(' ');
      if (ctx.measureText(t).width <= maxW || k < 0) { ctx.fillText(t, x, y); return; }
      ctx.fillText(t.slice(0, k), x, y - lh / 2); ctx.fillText(t.slice(k + 1), x, y + lh / 2);
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    // 띠의 위상을 누르면 그 날로 이동
    cv.canvas.addEventListener('click', function (ev) {
      var L = layout(), rect = cv.canvas.getBoundingClientRect(), x = ev.clientX - rect.left, y = ev.clientY - rect.top, Sd = L.strip;
      if (x < Sd.x || y < Sd.y || y > Sd.y + Sd.h) return;
      var i = Math.floor((x - Sd.x) / (Sd.w / PH.length));
      if (i >= 0 && i < PH.length) slider.set(+(PH[i][0] / 360 * PERIOD).toFixed(1));
    });

    function update() {
      var e = elong(), deg = e * 180 / Math.PI, m = moonPos(e), ecl = eclipse();
      var cosPsi = -m[0] / Math.hypot(m[0], m[1], m[2]);   // 지구에서 본 태양과 달 사이 각의 코사인
      var frac = (1 - cosPsi) / 2;
      rDay.set(state.day.toFixed(1) + '일 (음력 약 ' + (Math.floor(state.day) + 1) + '일)');
      rName.set(ecl && ecl.kind === 'lunar' ? '보름달 — 월식 중' : phaseName(deg));
      rFrac.set(Math.round(frac * 100) + '%');
      if (ecl && ecl.kind === 'solar') rEcl.set('일식 — 달 그림자가 지구에 닿음');
      else if (ecl) rEcl.set(ecl.full ? '개기 월식 — 달 전체가 지구 그림자 속' : '부분 월식 — 달 일부가 지구 그림자 속');
      else if (state.tilt && (deg < 10 || deg > 350 || Math.abs(deg - 180) < 10)) rEcl.set('없음 — 달이 일직선 위·아래로 비켜 지나감');
      else rEcl.set('없음');
      S.redraw(); draw2();
    }

    var slider = api.slider({ id: 'moon-phases-day', label: '달의 공전 위치 (삭 이후)', min: 0, max: PERIOD, step: 0.1, value: state.day,
      format: function (v) { return v.toFixed(1) + '일'; }, onInput: function (v) { state.day = v; update(); } });
    var g1 = api.group();
    var playBtn = api.button(api.reduced ? '다음 위상으로' : '재생', function () {
      if (api.reduced) { var d = (Math.round(state.day / (PERIOD / 8)) + 1) * PERIOD / 8; slider.set(+(d % PERIOD).toFixed(1)); return; }
      if (loop.wanted) loop.pause(); else loop.play();
      playBtn.textContent = loop.wanted ? '멈춤' : '재생';
    }, { primary: true, parent: g1 });
    var tiltBtn = api.button('궤도 기울기 보기 (과장)', function () {
      state.tilt = !state.tilt; tiltBtn.setAttribute('aria-pressed', state.tilt ? 'true' : 'false'); update();
    }, { toggle: true, parent: g1 });
    var out = slider.input.parentNode.querySelector('output');
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var d = state.day + dt * 2.2; if (d >= PERIOD) d -= PERIOD;
      state.day = d; slider.input.value = d; out.textContent = d.toFixed(1) + '일';
      update();
    });
    loop.pause();

    api.onResize(draw2);
    update();
  },
});
