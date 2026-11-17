/* 일반지구과학 8 국지풍: 해륙풍 — 육지와 바다의 기온 차 → 층 두께 차 → 상층 기압 차 → 순환 */
Sims.register('u-sea-breeze', {
  title: '해풍과 육풍 — 층 두께 차이가 만드는 순환',
  caption: '시각과 육지·바다의 최대 기온 차를 바꾸거나 \'하루 재생\'을 눌러 보자. 낮에 육지 위 공기층(1000~900 hPa)이 더 따뜻하면 층이 두꺼워져 900 hPa 면이 육지 위에서 높아지고, 같은 높이에서 육지 상공의 기압이 높아져 상층에서는 육지 → 바다, 지표에서는 바다 → 육지(해풍)로 바람이 분다. 밤에는 육지가 더 빨리 식어 반대(육풍)가 된다. 층 평균 기온 차는 오후 3시에 최대인 사인 곡선으로 단순화했고, 기압면의 기울기와 순환의 높이는 크게 과장했으며 전향력은 넣지 않았다.',
  init: function (api) {
    var RD = 287, G = 9.8, RHO = 1.1, LN = Math.log(1000 / 900);
    var st = { t: 15, A: 5, play: false, phase: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '해안의 연직 단면: 기압면 높이와 해륙풍 순환' });
    var ctx = cv.ctx;
    var rT = api.readout('기온 차(육지 − 바다) ');
    var rZ = api.readout('900 hPa 면 높이 차 ');
    var rP = api.readout('같은 높이의 기압 차 ');
    var rW = api.readout('지상 바람 ');
    var sTime = api.slider({ id: 'u-sea-breeze-t', label: '시각', min: 0, max: 24, step: 0.25, value: st.t,
      format: function (v) { var hh = Math.floor(v) % 24, mm = Math.round((v - Math.floor(v)) * 60); return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; },
      onInput: function (v) { st.t = v; update(); } });
    api.slider({ id: 'u-sea-breeze-a', label: '최대 기온 차', min: 1, max: 10, step: 0.5, value: st.A,
      format: function (v) { return v.toFixed(1) + ' K'; }, onInput: function (v) { st.A = v; update(); } });
    var bPlay = api.button('하루 재생', function () {
      st.play = !st.play; bPlay.textContent = st.play ? '멈춤' : '하루 재생';
      if (st.play && !api.reduced) loop.play();
    }, { primary: true });
    if (api.reduced) bPlay.style.display = 'none';

    function dT() { return st.A * Math.sin(2 * Math.PI * (st.t - 9) / 24); }
    function dz() { return RD * dT() / G * LN; }
    function dp() { return RHO * G * dz() / 100; }   // hPa
    function update() {
      var d = dT();
      rT.set((d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + ' K');
      rZ.set((dz() >= 0 ? '육지 쪽 ' : '바다 쪽 ') + Math.abs(dz()).toFixed(0) + ' m 높음');
      rP.set(Math.abs(dp()).toFixed(2) + ' hPa');
      rW.set(Math.abs(d) < 0.3 ? '거의 없음(전환)' : d > 0 ? '해풍 (바다 → 육지)' : '육풍 (육지 → 바다)');
      draw();
    }
    var loop = api.loop(function (dt) {
      if (dt <= 0) return;
      st.phase += dt * Math.min(1.2, Math.abs(dp()) * 0.9);
      if (st.play) { var t = st.t + dt * 1.5; if (t >= 24) t -= 24; sTime.set(t); } else draw();
    });
    if (api.reduced) loop.pause();

    function arrowHead(x, y, a, col, s) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x - s * Math.cos(a - 0.45), y - s * Math.sin(a - 0.45)); ctx.lineTo(x - s * Math.cos(a + 0.45), y - s * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var ground = h - 46, top = 30, coast = w * 0.5;
      var d = dT(), day = st.t >= 6 && st.t < 18;
      // 하늘
      ctx.fillStyle = day ? T.figPaper : T.figSoftViolet; ctx.fillRect(0, 0, w, ground);
      // 해·달
      ctx.fillStyle = day ? T.figAmber : T.figMuted; ctx.beginPath(); ctx.arc(w - 26, 22, 10, 0, Math.PI * 2); ctx.fill();
      if (!day) { ctx.fillStyle = T.figSoftViolet; ctx.beginPath(); ctx.arc(w - 21, 18, 9, 0, Math.PI * 2); ctx.fill(); }
      // 바다·육지
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(0, ground, coast, h - ground);
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(coast, ground - 4, w - coast, h - ground + 4);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(coast, ground); ctx.stroke();
      ctx.strokeStyle = T.figGreen; ctx.beginPath(); ctx.moveTo(coast, ground - 4); ctx.lineTo(w, ground - 4); ctx.stroke();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figBlue; ctx.fillText('바다', coast * 0.5, h - 22);
      ctx.fillStyle = T.figGreen; ctx.fillText('육지', coast + (w - coast) * 0.5, h - 22);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText(d >= 0 ? '상대적으로 차가움' : '상대적으로 따뜻함', coast * 0.5, h - 7);
      ctx.fillText(d >= 0 ? '빨리 데워짐(열용량 작음)' : '빨리 식음(열용량 작음)', coast + (w - coast) * 0.5, h - 7);
      // 기압면: 900 hPa(과장), 950 hPa
      var H900 = (ground - top) * 0.62, ex = 2.2;   // 과장: 1 m → ex px
      [[0.5, '950 hPa'], [1, '900 hPa']].forEach(function (k) {
        var base = ground - H900 * k[0], off = dz() * k[0] * ex / 2;
        ctx.strokeStyle = k[0] === 1 ? T.figViolet : T.figLine; ctx.lineWidth = k[0] === 1 ? 2.2 : 1.4;
        ctx.beginPath();
        for (var i = 0; i <= 60; i++) {
          var x = w * i / 60, s = Math.tanh((x - coast) / (w * 0.12));
          var y = base - off * s;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = k[0] === 1 ? T.figViolet : T.figMuted; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText(k[1], 6, base + off - 6);
      });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('기압면 기울기는 크게 과장함', 6, top - 12);
      // 순환 고리
      var mag = Math.abs(dp()), on = Math.abs(d) >= 0.3;
      var x0 = w * 0.2, x1 = w * 0.8, yt = ground - H900 * 0.72, yb = ground - 16;
      if (on) {
        var col = T.figAccent, lw = 1.5 + mag * 1.6;
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.globalAlpha = 0.85;
        var rr = 18;
        ctx.beginPath();
        ctx.moveTo(x0 + rr, yt); ctx.lineTo(x1 - rr, yt); ctx.quadraticCurveTo(x1, yt, x1, yt + rr); ctx.lineTo(x1, yb - rr);
        ctx.quadraticCurveTo(x1, yb, x1 - rr, yb); ctx.lineTo(x0 + rr, yb); ctx.quadraticCurveTo(x0, yb, x0, yb - rr); ctx.lineTo(x0, yt + rr);
        ctx.quadraticCurveTo(x0, yt, x0 + rr, yt); ctx.stroke(); ctx.globalAlpha = 1;
        var sea = d > 0;   // 낮: 지표 바다→육지(오른쪽), 육지 위 상승, 상층 왼쪽, 바다 위 하강
        var hs = 10 + mag * 3;
        arrowHead((x0 + x1) / 2 + (sea ? hs / 2 : -hs / 2), yb, sea ? 0 : Math.PI, col, hs);
        arrowHead((x0 + x1) / 2 + (sea ? -hs / 2 : hs / 2), yt, sea ? Math.PI : 0, col, hs);
        arrowHead(x1, (yt + yb) / 2 + (sea ? -hs / 2 : hs / 2), sea ? -Math.PI / 2 : Math.PI / 2, col, hs);
        arrowHead(x0, (yt + yb) / 2 + (sea ? hs / 2 : -hs / 2), sea ? Math.PI / 2 : -Math.PI / 2, col, hs);
        // 움직이는 공기 알갱이
        var per = 2 * (x1 - x0) + 2 * (yb - yt);
        for (var k = 0; k < 10; k++) {
          var u = ((st.phase * 60 + k * per / 10) % per + per) % per;
          if (!sea) u = per - u;
          var px, py;
          // 경로: 지표(왼→오), 오른쪽(아래→위), 상층(오→왼), 왼쪽(위→아래)
          if (u < x1 - x0) { px = x0 + u; py = yb; }
          else if ((u -= x1 - x0) < yb - yt) { px = x1; py = yb - u; }
          else if ((u -= yb - yt) < x1 - x0) { px = x1 - u; py = yt; }
          else { u -= x1 - x0; px = x0; py = yt + u; }
          ctx.fillStyle = T.figInk; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
        // 기압 표시
        ctx.font = '700 15px ' + T.fontBody; ctx.textAlign = 'center';
        var hiCol = T.figBlue, loCol = T.figRed;
        ctx.fillStyle = sea ? hiCol : loCol; ctx.fillText(sea ? 'H' : 'L', x1, yt - 10);
        ctx.fillStyle = sea ? loCol : hiCol; ctx.fillText(sea ? 'H' : 'L', x0, yt - 10);
        ctx.fillStyle = sea ? loCol : hiCol; ctx.fillText(sea ? 'L' : 'H', x1 + 22, yb + 4);
        ctx.fillStyle = sea ? hiCol : loCol; ctx.fillText(sea ? 'H' : 'L', x0 - 22, yb + 4);
        // 이름 (바다에서 하강하는 구간의 바깥쪽이 아니라 고리 안쪽 가운데)
        ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk;
        ctx.fillText(sea ? '해풍' : '육풍', (x0 + x1) / 2, yb - 10);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText(sea ? '육지 위 상승, 바다 위 하강' : '바다 위 상승, 육지 위 하강', (x0 + x1) / 2, (yt + yb) / 2 + 4);
      } else {
        ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
        ctx.fillText('기온 차가 거의 없음 → 바람이 바뀌는 때', w / 2, (top + ground) / 2);
      }
    }
    api.onResize(draw);
    update();
  },
});
