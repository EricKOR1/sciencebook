/* 중2-8 별과 우주: 지구 공전에 따른 가까운 별의 위치 변화(연주시차)와 거리 */
Sims.register('parallax', {
  title: '6개월 사이 별이 움직여 보인다 — 연주시차와 별까지의 거리',
  caption: '지구를 1월 위치와 7월 위치에 두고, 오른쪽 하늘 사진에서 가까운 별이 먼 배경 별들에 대해 어떻게 움직여 보이는지 비교해 보자. 별까지의 거리를 늘리면 두 사진 사이의 위치 변화(시차)와 그 절반인 연주시차가 작아지고, 가까울수록 커진다. 실제 연주시차는 1″보다 작을 만큼 아주 작아서 그림에서는 각도와 움직임을 크게 과장했고, 배경 별은 연주시차를 무시할 수 있을 만큼 아주 멀리 있다고 가정했다.',
  init: function (api) {
    var state = { d: 2, th: Math.PI, playing: false };   // th: 지구의 공전 각도(π = 1월 위치, 0 = 7월 위치)
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.56; }, label: '공전 궤도 위 지구의 두 위치에서 가까운 별을 바라보는 모습과, 그때 찍은 하늘 사진' });
    var ctx = cv.ctx;
    var rD = api.readout('별까지의 거리');
    var rP = api.readout('연주시차');
    var rS = api.readout('1월과 7월 사이 시차');

    api.slider({ id: 'parallax-d', label: '별까지의 거리', min: 1.25, max: 20, step: 0.25, value: 2,
      format: function (v) { return v.toFixed(2).replace(/\.?0+$/, '') + ' pc'; }, onInput: function (v) { state.d = v; update(); } });
    var g = api.group();
    var bJan = api.button('1월 위치', function () { stop(); state.th = Math.PI; update(); }, { toggle: true, pressed: true, parent: g });
    var bJul = api.button('7월 위치', function () { stop(); state.th = 0; update(); }, { toggle: true, parent: g });
    var playBtn = api.button('지구 공전시키기', function () {
      if (state.playing) { stop(); update(); return; }
      if (api.reduced) { state.th = state.th === Math.PI ? 0 : Math.PI; update(); return; }
      state.playing = true; playBtn.textContent = '공전 멈추기'; loop.play();
    });
    function stop() { state.playing = false; playBtn.textContent = '지구 공전시키기'; loop.pause(); }

    var p = function () { return 1 / state.d; };     // 연주시차(″)
    function fmtP(x) { return (x >= 0.1 ? x.toFixed(2) : x.toFixed(3)) + '″'; }
    function update() {
      rD.set(state.d.toFixed(2).replace(/\.?0+$/, '') + ' pc (약 ' + (state.d * 3.26).toFixed(1) + '광년)');
      rP.set(fmtP(p()));
      rS.set(fmtP(2 * p()));
      var jan = Math.abs(Math.cos(state.th) + 1) < 1e-6, jul = Math.abs(Math.cos(state.th) - 1) < 1e-6;
      bJan.setAttribute('aria-pressed', jan && !state.playing ? 'true' : 'false');
      bJul.setAttribute('aria-pressed', jul && !state.playing ? 'true' : 'false');
      draw();
    }
    var loop = api.loop(function (dt) { if (!(dt > 0)) return; state.th = (state.th + dt * 0.9) % (2 * Math.PI); update(); });
    loop.pause();

    // 배경 별(하늘 사진 속 고정 위치, 0~1 좌표)
    var BG = [[0.12, 0.2], [0.3, 0.72], [0.47, 0.15], [0.62, 0.82], [0.8, 0.3], [0.9, 0.68], [0.2, 0.5], [0.72, 0.55], [0.38, 0.38], [0.55, 0.6], [0.08, 0.85], [0.93, 0.12]];

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = narrow ? { x: 0, y: 0, w: w, h: h * 0.62 } : { x: 0, y: 0, w: w * 0.56, h: h };
      var B = narrow ? { x: 0, y: h * 0.64, w: w, h: h * 0.36 } : { x: w * 0.6, y: 0, w: w * 0.4, h: h };
      ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip(); drawSpace(T, A); ctx.restore();
      drawSky(T, B, narrow);
    }
    function drawSpace(T, r) {
      var cx = r.x + r.w / 2, oy = r.y + r.h - 46, R = Math.min(r.w * 0.3, 110);
      var topY = r.y + 34;   // 배경 별이 있는 곳
      // 가까운 별의 위치: 거리에 따라(그림에서는 압축해서) 위로
      var f = Math.log(state.d / 1.25) / Math.log(20 / 1.25);
      var sy = oy - 0.12 * R - (oy - topY - 30 - 0.12 * R) * (0.08 + 0.92 * f) ;
      sy = Math.min(sy, oy - R * 0.9);
      // 배경 별
      ctx.fillStyle = T.figMuted;
      for (var i = 0; i < 16; i++) { var bx = r.x + 14 + (r.w - 28) * ((i * 0.618) % 1); ctx.beginPath(); ctx.arc(bx, topY - 6 + (i % 3) * 6, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('아주 먼 배경 별들', r.x + 10, r.y + 12);
      // 궤도와 태양
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.ellipse(cx, oy, R, R * 0.32, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, oy, 9, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('태양', cx, oy + 20);
      // 1월·7월 위치와 시선
      var Jx = cx - R, Ux = cx + R;
      [[Jx, '1월', T.figBlue], [Ux, '7월', T.figRed]].forEach(function (e) {
        // 시선을 배경까지 연장
        var dx = cx - e[0], dy = sy - oy, t = (topY - oy) / dy;
        ctx.strokeStyle = e[2]; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(e[0], oy); ctx.lineTo(e[0] + dx * t, topY); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(e[0], oy, 5, 0, Math.PI * 2); ctx.strokeStyle = e[2]; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = e[2]; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(e[1] + ' 지구', e[0], oy + 20);
        // 배경에 투영된 위치
        ctx.beginPath(); ctx.arc(e[0] + dx * t, topY + 6, 3.5, 0, Math.PI * 2); ctx.fill();
      });
      // 시차 각도(별에서), 연주시차(절반)
      var a1 = Math.atan2(oy - sy, Jx - cx), a2 = Math.atan2(oy - sy, Ux - cx);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, sy, 26, a2, a1); ctx.stroke();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, sy); ctx.lineTo(cx, oy); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, sy, 38, Math.PI / 2, a1); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
      var lyA = Math.min(sy + 44, oy - R * 0.32 - 22);
      ctx.fillStyle = T.figViolet; ctx.fillText('시차', cx + 30, sy + 14);
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'right'; ctx.fillText('연주시차(절반)', cx - 40, lyA);
      // 가까운 별
      ctx.beginPath(); ctx.arc(cx, sy, 7, 0, Math.PI * 2); ctx.fillStyle = T.figAccent; ctx.fill();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('가까운 별', cx + 12, sy - 10);
      // 지금 지구
      var ex = cx + R * Math.cos(state.th), ey = oy + R * 0.32 * Math.sin(state.th);
      ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fillStyle = T.figTeal; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = T.figPanel; ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('각도는 크게 과장한 모식도', r.x + r.w - 6, r.y + 12);
    }
    function drawSky(T, r, narrow) {
      // 하늘 사진: 왼쪽 = 지금 보이는 하늘, 오른쪽(또는 아래) = 1월·7월 사진 겹치기
      var gap = 10, pw, ph, p1, p2;
      if (narrow) { pw = (r.w - gap - 8) / 2; ph = Math.min(r.h - 30, pw * 0.9); p1 = { x: r.x + 4, y: r.y + 22 }; p2 = { x: r.x + 4 + pw + gap, y: r.y + 22 }; }
      else { pw = r.w - 8; ph = (r.h - 60) / 2; p1 = { x: r.x + 4, y: r.y + 22 }; p2 = { x: r.x + 4, y: r.y + 44 + ph }; }
      var shiftMax = pw * 0.36;                       // 1.25 pc(가장 가까움)일 때의 화면 이동
      var s = shiftMax * (p() / 0.8);
      function frame(o, title) {
        ctx.fillStyle = T.figPaper; ctx.fillRect(o.x, o.y, pw, ph);
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(o.x, o.y, pw, ph);
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(title, o.x, o.y - 10);
        ctx.fillStyle = T.figMuted;
        BG.forEach(function (b) { ctx.beginPath(); ctx.arc(o.x + b[0] * pw, o.y + b[1] * ph, 2.2, 0, Math.PI * 2); ctx.fill(); });
      }
      function star(o, dx, color, ring) {
        var x = o.x + pw / 2 + dx, y = o.y + ph * 0.45;
        ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        if (ring) { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); } else { ctx.fillStyle = color; ctx.fill(); }
        return x;
      }
      // 지금: 지구가 궤도 왼쪽(1월)에 있으면 가까운 별은 배경에 대해 오른쪽으로 보인다
      frame(p1, '지금 보이는 하늘');
      star(p1, -Math.cos(state.th) * s, T.figAccent, false);
      frame(p2, narrow ? '1월·7월 겹치기' : '1월 사진과 7월 사진 겹치기');
      var xj = star(p2, s, T.figBlue, false), xu = star(p2, -s, T.figRed, false);
      var yy = p2.y + ph * 0.45 + 16;
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.5;
      if (xj - xu > 6) {
        ctx.beginPath(); ctx.moveTo(xu, yy); ctx.lineTo(xj, yy); ctx.stroke();
        [xu, xj].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, yy - 4); ctx.lineTo(x, yy + 4); ctx.stroke(); });
      }
      ctx.fillStyle = T.figViolet; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('시차', (xu + xj) / 2, yy + 12);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figBlue; ctx.fillText('● 1월', p2.x + 4, p2.y + ph - 10);
      ctx.fillStyle = T.figRed; ctx.fillText('● 7월', p2.x + 44, p2.y + ph - 10);
    }

    api.onResize(draw);
    update();
  },
});
