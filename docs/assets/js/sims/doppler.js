/* 역학과 에너지 3 탄성파와 소리: 도플러 효과 — 움직이는 음원의 파면과 앞·뒤 관찰자가 듣는 진동수 */
Sims.register('doppler', {
  title: '움직이는 음원과 도플러 효과',
  caption: '음원 속력을 올려 보자. 음원은 한 주기마다 조금씩 앞으로 나아가며 다음 파면을 내므로, 앞쪽은 파면이 촘촘해지고(파장이 짧아짐) 뒤쪽은 성겨진다. 음속은 매질이 정하므로 그대로이고, 정지한 앞쪽 관찰자는 f′ = f·v/(v − vₛ), 뒤쪽 관찰자는 f′ = f·v/(v + vₛ)를 듣는다. 음속은 340 m/s, 바람은 없다고 가정했으며 화면 속 움직임과 파장은 보기 쉽게 같은 비율로 늘이거나 줄였다.',
  init: function (api) {
    var V = 340;
    var state = { vs: 60, f: 700, t: 4 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.46; }, label: '움직이는 음원에서 퍼져 나가는 파면' });
    var ctx = cv.ctx;

    var rF = api.readout('앞쪽 관찰자가 듣는 진동수');
    var rB = api.readout('뒤쪽 관찰자가 듣는 진동수');
    var rLf = api.readout('파장 (앞 · 정지 음원 · 뒤)');

    api.slider({ id: 'doppler-vs', label: '음원 속력 vₛ', min: 0, max: 300, step: 5, value: state.vs,
      format: function (v) { return v + ' m/s'; }, onInput: function (v) { state.vs = v; readouts(); draw(); } });
    api.slider({ id: 'doppler-f', label: '음원의 진동수 f', min: 300, max: 1000, step: 10, value: state.f,
      format: function (v) { return v + ' Hz'; }, onInput: function (v) { state.f = v; readouts(); draw(); } });
    var playBtn = api.button(api.reduced ? '재생' : '멈춤', function () { if (loop.wanted) loop.pause(); else loop.play(); playBtn.textContent = loop.wanted ? '멈춤' : '재생'; }, { primary: true });

    function readouts() {
      var ff = state.f * V / (V - state.vs), fb = state.f * V / (V + state.vs);
      rF.set(Math.round(ff) + ' Hz');
      rB.set(Math.round(fb) + ' Hz');
      rLf.set(((V - state.vs) / state.f).toFixed(2) + ' · ' + (V / state.f).toFixed(2) + ' · ' + ((V + state.vs) / state.f).toFixed(2) + ' m');
    }
    var loop = api.loop(function (dt) { state.t += dt; draw(); });
    if (api.reduced) loop.pause();

    function person(T, x, y, facing, color) {
      ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y - 30, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y - 2); ctx.moveTo(x, y - 2); ctx.lineTo(x - 6, y + 12); ctx.moveTo(x, y - 2); ctx.lineTo(x + 6, y + 12);
      ctx.moveTo(x, y - 16); ctx.lineTo(x + facing * 9, y - 8); ctx.stroke();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var cy = h * 0.5, left = narrow ? 34 : 60, right = w - (narrow ? 34 : 60);
      // 화면 단위: 정지 음원의 파장을 화면 px로 정한다(700 Hz일 때 약 34 px)
      var pxPerM = (narrow ? 70 : 86) * 700 / 1000;    // 1 m가 몇 px인지(진동수 슬라이더와 함께 파장이 변한다)
      var lam0 = V / state.f * pxPerM;
      var c = 80;                                      // 화면 속 음속(px/s)
      var Td = lam0 / c;                               // 화면 속 한 주기(s)
      var us = c * state.vs / V;                       // 화면 속 음원 속력
      // 음원은 화면의 25%~75% 사이를 오가지 않고, 일정하게 오른쪽으로 가다가 처음 자리로 돌아온다(파면 무늬는 그대로)
      var span = (right - left) * 0.5, x0 = left + (right - left) * 0.25;
      var travel = us > 0 ? (state.t * us) % span : 0;
      var xs = x0 + travel;
      var rMax = Math.hypot(w, h);
      // 지금까지 낸 파면: 방출 시각 te = 지금 − k·Td, 중심 = 그때 음원의 위치
      var phase = state.t % Td;
      ctx.lineWidth = 1.6;
      for (var k = 0; k < 400; k++) {
        var age = phase + k * Td, rad = c * age;
        if (rad > rMax) break;
        var xc = xs - us * age;
        ctx.strokeStyle = T.figAccent; ctx.globalAlpha = Math.max(0.15, 1 - rad / (rMax * 0.9));
        ctx.beginPath(); ctx.arc(xc, cy, rad, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 음원
      ctx.beginPath(); ctx.arc(xs, cy, 9, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
      if (us > 0) {
        var aL = Math.min(60, 12 + state.vs * 0.18);
        ctx.strokeStyle = T.figRed; ctx.fillStyle = T.figRed; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(xs, cy - 22); ctx.lineTo(xs + aL - 6, cy - 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xs + aL, cy - 22); ctx.lineTo(xs + aL - 9, cy - 27); ctx.lineTo(xs + aL - 9, cy - 17); ctx.closePath(); ctx.fill();
      }
      // 앞·뒤 파장 표시(음원 바로 앞과 뒤의 이웃한 두 파면 사이)
      var front = [], back = [];
      for (var j = 0; j < 3; j++) { var ag = phase + j * Td; front.push(xs - us * ag + c * ag); back.push(xs - us * ag - c * ag); }
      bracket(T, front[1], front[2], cy + 30, 'λ앞');
      bracket(T, back[2], back[1], cy + 30, 'λ뒤');
      // 관찰자
      var py = cy + (narrow ? 0 : 0);
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85;
      ctx.fillRect(0, 0, w, 40); ctx.fillRect(0, h - 26, w, 26); ctx.globalAlpha = 1;
      person(T, right + (narrow ? 14 : 24), py, -1, T.figInk);
      person(T, left - (narrow ? 14 : 24), py, 1, T.figInk);
      var ff = state.f * V / (V - state.vs), fb = state.f * V / (V + state.vs);
      ctx.font = '600 13px ' + T.fontBody;
      ctx.fillStyle = T.figRed; ctx.textAlign = 'right';
      ctx.fillText('앞쪽 관찰자: ' + Math.round(ff) + ' Hz (높은 소리)', w - 8, 18);
      ctx.fillStyle = T.figBlue; ctx.textAlign = 'left';
      ctx.fillText('뒤쪽 관찰자: ' + Math.round(fb) + ' Hz (낮은 소리)', 8, narrow ? 34 : 18);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('음원 ' + state.f + ' Hz · vₛ = ' + state.vs + ' m/s · 음속 v = 340 m/s', w / 2, h - 9);
    }
    function bracket(T, a, b, y, label) {
      if (!(b - a > 4)) return;
      ctx.strokeStyle = T.figViolet; ctx.fillStyle = T.figViolet; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(a, y - 5); ctx.lineTo(a, y + 5); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.moveTo(b, y - 5); ctx.lineTo(b, y + 5); ctx.stroke();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(label, (a + b) / 2, y + 17);
    }

    api.onResize(draw);
    readouts(); draw();
  },
});
