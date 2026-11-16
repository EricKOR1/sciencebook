/* 지구과학 3 행성의 겉보기 운동: 태양 중심 모형에서 지구가 화성을 추월할 때 화성이 역행하는 것처럼 보인다 */
Sims.register('retrograde', {
  title: '화성의 역행 — 위에서 본 궤도와 하늘에서 본 경로',
  caption: '재생을 누르거나 날짜를 움직여 보자. 왼쪽(위)은 태양계를 위에서 본 모습, 오른쪽(아래)은 지구에서 남쪽 하늘을 볼 때 별들 사이에서 화성이 움직이는 길이다. 평소에는 서→동으로 순행하던 화성이, 안쪽 궤도에서 더 빨리 도는 지구가 화성을 추월하는 충 무렵 약 두 달 남짓 동→서로 역행한다. 공전 주기는 실제 값(지구 1년, 화성 1.88년)이고 궤도는 원으로 단순화했다. 화성 궤도가 지구 궤도에 약 1.9° 기울어 있어 경로가 고리 모양이 되며, 하늘 그림의 위아래는 4배로 늘려 그렸다.',
  init: function (api) {
    var D = Math.PI / 180, YR = 365.25, PM = 1.8808, RM = 1.5237, INC = 1.85 * D, NODE = -50 * D;
    var T0 = -160, T1 = 160, VEX = 4;
    var st = { t: -100, playing: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.52; }, label: '태양계를 위에서 본 지구·화성 궤도와 하늘에서 본 화성의 경로' });
    var ctx = cv.ctx;
    var rD = api.readout('날짜'), rMo = api.readout('화성의 겉보기 운동'), rDi = api.readout('지구–화성 거리');
    var slider = api.slider({ id: 'retrograde-t', label: '날짜(충 기준)', min: T0, max: T1, step: 1, value: st.t,
      format: function (v) { return v === 0 ? '충' : v < 0 ? '충 ' + (-v) + '일 전' : '충 ' + v + '일 후'; },
      onInput: function (v) { st.t = v; update(); } });
    var play = api.button('재생', function () {
      if (st.playing) { stop(); return; }
      if (st.t >= T1) slider.set(T0);
      if (api.reduced) { slider.set(Math.min(T1, st.t + 20)); return; }
      st.playing = true; play.textContent = '멈춤'; loop.play();
    }, { primary: true });
    if (api.reduced) play.textContent = '20일 뒤로';
    api.button('처음으로', function () { stop(); slider.set(T0); });
    function stop() { st.playing = false; loop.pause(); play.textContent = api.reduced ? '20일 뒤로' : '재생'; }
    var tf = st.t;
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      tf = Math.min(T1, Math.max(tf, st.t) + dt * 24);
      if (tf >= T1) stop();
      if (Math.round(tf) !== st.t) slider.set(Math.round(tf));
    });
    loop.pause();

    function earth(t) { var a = 2 * Math.PI * t / YR; return [Math.cos(a), Math.sin(a), 0]; }
    function mars(t) {
      var u = 2 * Math.PI * t / (PM * YR) - NODE;
      return [RM * (Math.cos(NODE) * Math.cos(u) - Math.sin(NODE) * Math.sin(u) * Math.cos(INC)),
        RM * (Math.sin(NODE) * Math.cos(u) + Math.cos(NODE) * Math.sin(u) * Math.cos(INC)), RM * Math.sin(u) * Math.sin(INC)];
    }
    function sky(t) {   // 지구에서 본 화성의 방향(황경, 황위 °)
      var e = earth(t), m = mars(t), d = [m[0] - e[0], m[1] - e[1], m[2]];
      return { lon: Math.atan2(d[1], d[0]) / D, lat: Math.atan2(d[2], Math.hypot(d[0], d[1])) / D, dist: Math.hypot(d[0], d[1], d[2]) };
    }
    function rate(t) { return sky(t + 0.5).lon - sky(t - 0.5).lon; }
    function motion(t) { var r = rate(t); return Math.abs(r) < 0.06 ? '유(멈춘 듯 보임)' : r > 0 ? '순행(서 → 동)' : '역행(동 → 서)'; }
    // 배경 별(고정)
    var stars = [], seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 70; i++) stars.push({ lon: -62 + rnd() * 124, lat: -3.6 + rnd() * 11.2, m: rnd() });

    function update() {
      var s = sky(st.t);
      rD.set(slider.input ? (st.t === 0 ? '충' : st.t < 0 ? '충 ' + (-st.t) + '일 전' : '충 ' + st.t + '일 후') : '');
      rMo.set(motion(st.t));
      rDi.set(s.dist.toFixed(2) + ' AU');
      draw();
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) { var tv = Math.min(w, h * 0.6); return { top: { x: (w - tv) / 2, y: 0, s: tv }, sky: { x: 0, y: tv + 10, w: w, h: h - tv - 10 } }; }
      return { top: { x: 0, y: 0, s: h }, sky: { x: h + 16, y: h * 0.12, w: w - h - 16, h: h * 0.76 } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawTop(T, L.top); drawSky(T, L.sky);
    }
    function drawTop(T, r) {
      var cx = r.x + r.s / 2, cy = r.y + r.s / 2, R = r.s / 2 - 14, k = R * 0.62 / RM;   // 별 고리 반지름 R
      function P(v) { return [cx + v[0] * k, cy - v[1] * k]; }
      ctx.fillStyle = T.figPaper; ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, 2 * Math.PI); ctx.fill();
      // 먼 별들의 고리
      ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('먼 별들(배경)', cx, r.y + 12);
      // 궤도
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, k, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, k * RM, 0, 2 * Math.PI); ctx.stroke();
      // 지난 시선(20일마다)
      for (var t = T0; t <= st.t; t += 20) line(t, 0.28, 1);
      line(st.t, 1, 1.8);
      function line(t, alpha, lw) {
        var e = P(earth(t)), m = mars(t), mm = P(m), dx = mm[0] - e[0], dy = mm[1] - e[1], dl = Math.hypot(dx, dy);
        // 시선을 별 고리까지 연장
        var ux = dx / dl, uy = dy / dl, ox = e[0] - cx, oy = e[1] - cy, b = ox * ux + oy * uy, c = ox * ox + oy * oy - R * R, s = -b + Math.sqrt(b * b - c);
        ctx.globalAlpha = alpha; ctx.strokeStyle = rate(t) < 0 ? T.figAmber : T.figBlue; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[0] + ux * s, e[1] + uy * s); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // 태양, 지구, 화성
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 2 * Math.PI); ctx.fillStyle = T.figAmber; ctx.fill();
      var e = P(earth(st.t)), m = P(mars(st.t));
      ctx.beginPath(); ctx.arc(e[0], e[1], 6, 0, 2 * Math.PI); ctx.fillStyle = T.figBlue; ctx.fill();
      ctx.beginPath(); ctx.arc(m[0], m[1], 5, 0, 2 * Math.PI); ctx.fillStyle = T.figRed; ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figInk; ctx.fillText('태양', cx, cy + 23);
      ctx.fillStyle = T.figBlue; ctx.fillText('지구', e[0] + (e[0] < cx ? -20 : 20), e[1] + 4);
      ctx.fillStyle = T.figRed; ctx.fillText('화성', m[0] + (m[0] < cx ? -20 : 20), m[1] - 6);
      // 공전 방향
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.4; var ar = k * RM + 10;
      var a1 = -2.4, a2 = -2.0;   // 화면에서 시계 반대 방향 = 각이 줄어드는 쪽
      ctx.beginPath(); ctx.arc(cx, cy, ar, a1, a2); ctx.stroke();
      var ax = cx + ar * Math.cos(a1), ay = cy + ar * Math.sin(a1), tx = Math.sin(a1), ty = -Math.cos(a1);
      ctx.beginPath(); ctx.moveTo(ax + tx * 8, ay + ty * 8); ctx.lineTo(ax - ty * 5, ay + tx * 5); ctx.lineTo(ax + ty * 5, ay - tx * 5); ctx.closePath(); ctx.fillStyle = T.figMuted; ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('공전 방향', cx + ar * Math.cos(a1) - 8, cy + ar * Math.sin(a1));
      ctx.textAlign = 'left'; ctx.fillText('북쪽에서 내려다본 모습', r.x + 2, r.y + r.s - 2);
    }
    function drawSky(T, r) {
      var cLon = 0, wDeg = 112, sx = r.w / wDeg, latLo = -4, latHi = 8;
      var sy = (r.h - 30) / ((latHi - latLo) * VEX);
      function X(lon) { return r.x + r.w / 2 - (lon - cLon) * sx; }   // 남쪽을 볼 때 동쪽은 왼쪽
      function Y(lat) { return r.y + 18 + (latHi - lat) * VEX * sy; }
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(r.x, r.y + 18, r.w, r.h - 30);
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y + 18, r.w, r.h - 30); ctx.clip();
      stars.forEach(function (s) { ctx.beginPath(); ctx.arc(X(s.lon), Y(s.lat), 1 + s.m * 1.6, 0, 2 * Math.PI); ctx.fillStyle = T.figMuted; ctx.fill(); });
      // 화성의 길(지난 부분)
      var prev = null;
      for (var t = T0; t <= st.t; t += 1) {
        var s = sky(t), p = [X(s.lon), Y(s.lat)];
        if (prev) { ctx.strokeStyle = rate(t) < 0 ? T.figAmber : T.figBlue; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
        prev = p;
      }
      // 앞으로의 길(흐리게)
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath();
      for (t = st.t; t <= T1; t += 2) { s = sky(t); if (t === st.t) ctx.moveTo(X(s.lon), Y(s.lat)); else ctx.lineTo(X(s.lon), Y(s.lat)); }
      ctx.stroke(); ctx.setLineDash([]);
      // 20일 간격 점
      for (t = T0; t <= st.t; t += 20) { s = sky(t); ctx.beginPath(); ctx.arc(X(s.lon), Y(s.lat), 2.6, 0, 2 * Math.PI); ctx.fillStyle = T.figInk; ctx.fill(); }
      s = sky(st.t);
      ctx.beginPath(); ctx.arc(X(s.lon), Y(s.lat), 6.5, 0, 2 * Math.PI); ctx.fillStyle = T.figRed; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = T.figPanel; ctx.stroke();
      if (st.t >= 0) { var so = sky(0); ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('충', X(so.lon), Y(so.lat) - 10); }
      ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('지구에서 남쪽 하늘을 볼 때', r.x, r.y + 12);
      ctx.font = '600 12px ' + T.fontBody;
      ctx.textAlign = 'left'; ctx.fillText('← 동', r.x + 2, r.y + r.h - 1);
      ctx.textAlign = 'right'; ctx.fillText('서 →', r.x + r.w - 2, r.y + r.h - 1);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figBlue; ctx.fillText('파랑: 순행', r.x + r.w * 0.38, r.y + r.h - 1);
      ctx.fillStyle = T.figAmber; ctx.fillText('주황: 역행', r.x + r.w * 0.62, r.y + r.h - 1);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 18.5, r.w - 1, r.h - 31);
    }

    api.onResize(draw);
    update();
  },
});
