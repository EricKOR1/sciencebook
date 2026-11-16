/* 역학과 에너지 1 시공간과 운동: 빛 시계 — 움직이는 시계는 빛이 가는 길이 길어져 느리게 똑딱인다(운동에 의한 시간 팽창) */
Sims.register('light-clock', {
  title: '빛 시계로 보는 운동에 의한 시간 팽창',
  caption: '두 거울 사이를 빛이 한 번 왕복하면 \'똑딱\' 한 번이다. 속력을 올리면, 땅에 선 사람이 보기에 움직이는 시계의 빛은 비스듬한 지그재그 길을 가야 한다. 빛의 속력은 누가 보아도 같으므로(광속 불변) 길이 긴 만큼 한 번 똑딱이는 데 시간이 더 걸린다. 화면의 두 빛은 같은 속력으로 움직이며, 시계의 속력은 빛의 속력에 대한 비로 나타냈다.',
  init: function (api) {
    var state = { b: 0.6, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.44; }, label: '정지한 빛 시계와 움직이는 빛 시계' });
    var ctx = cv.ctx;

    var rB = api.readout('시계의 속력 (빛의 속력 = 1)');
    var rP = api.readout('한 번 왕복하는 빛의 경로 (정지 시계 = 1)');
    var rT = api.readout('한 번 똑딱이는 시간');
    var rN = api.readout('똑딱 횟수 (정지 : 움직임)');

    api.slider({ id: 'light-clock-beta', label: '움직이는 시계의 속력(빛의 속력에 대한 비)', min: 0, max: 0.9, step: 0.05, value: state.b,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { state.b = v; state.t = 0; readouts(); draw(); } });
    var playBtn = api.button(api.reduced ? '재생' : '멈춤', function () { if (loop.wanted) { loop.pause(); } else { loop.play(); } sync(); }, { primary: true });
    api.button('처음부터', function () { state.t = 0; readouts(); draw(); });
    function sync() { playBtn.textContent = loop.wanted ? '멈춤' : '재생'; }

    function ratio() { return 1 / Math.sqrt(1 - state.b * state.b); }
    function readouts() {
      var r = ratio();
      rB.set(state.b.toFixed(2));
      rP.set(r.toFixed(2) + '배');
      rT.set('정지 시계의 ' + r.toFixed(2) + '배');
      var T0 = 1.5;
      rN.set(Math.floor(state.t / T0 + 1e-9) + ' : ' + Math.floor(state.t / (T0 * r) + 1e-9));
    }
    var loop = api.loop(function (dt) { state.t += dt; readouts(); draw(); });
    if (api.reduced) { loop.pause(); state.t = 1.5 * 2 * 1 / Math.sqrt(1 - 0.36); }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        var Lm = Math.min(90, h * 0.2, (w - 60) / 4.3);
        return { L: Lm, still: { x: 0, y: 0, w: w, h: h * 0.4 }, move: { x: 0, y: h * 0.42, w: w, h: h * 0.58 } };
      }
      var L = Math.min(h * 0.5, 120, (w * 0.74 - 60) / 4.3);
      return { L: L, still: { x: 0, y: 0, w: w * 0.24, h: h }, move: { x: w * 0.26, y: 0, w: w * 0.74, h: h } };
    }
    function mirror(T, cx, y, flash) {
      ctx.fillStyle = flash ? T.figAmber : T.figTeal;
      ctx.fillRect(cx - 22, y - 3, 44, 6);
    }
    function photon(T, x, y) {
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.stroke();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, P = layout(), L = P.L;
      ctx.clearRect(0, 0, w, h);
      var T0 = 1.5, c = 2 * L / T0;          // 화면 속 빛의 속력(px/s): 정지 시계가 1.5초에 한 번 똑딱
      var r = ratio(), Tm = T0 * r;
      // ── 정지한 시계 ──
      var S = P.still, cx = S.x + S.w / 2, top = S.y + (S.h - L) / 2 + 8, bot = top + L;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('정지한 시계', cx, S.y + 18);
      var ph0 = (state.t % T0) / T0;            // 0: 아래 거울에서 출발, 0.5: 위 거울, 1: 다시 아래
      var y0 = ph0 < 0.5 ? bot - L * ph0 * 2 : top + L * (ph0 - 0.5) * 2;
      ctx.strokeStyle = T.figSoftAmber; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx, bot); ctx.lineTo(cx, top); ctx.stroke();
      mirror(T, cx, top, false); mirror(T, cx, bot, ph0 < 0.06 && state.t > 0.1);
      photon(T, cx, y0);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('L', cx + 28, (top + bot) / 2 + 4);
      ctx.textAlign = 'center';
      ctx.fillText('빛의 경로 2L', cx, bot + 26);

      // ── 움직이는 시계(땅에서 본 모습) ──
      var M = P.move, mtop = M.y + (M.h - L) / 2 + 8, mbot = mtop + L;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('움직이는 시계 (땅에 선 사람이 본 모습)', M.x + M.w / 2, M.y + 18);
      // 바닥선
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(M.x + 4, mbot + 12); ctx.lineTo(M.x + M.w - 4, mbot + 12); ctx.stroke();
      var x0 = M.x + 30, span = M.w - 60, u = state.b * c;   // 시계의 화면 속력
      // 시계가 오른쪽 끝을 지나면, 지금까지 지나간 거리를 한 번 왕복 단위로 잘라 다시 왼쪽에서 시작
      var tickLen = u * Tm;                       // 한 번 똑딱이는 동안 시계가 가는 거리
      var nTicksFit = tickLen > 0 ? Math.max(1, Math.floor(span / tickLen)) : 1;
      var passDur = Tm * nTicksFit;
      var tp = u > 0 ? state.t % passDur : state.t % Tm;
      var xc = x0 + u * tp;
      // 지그재그 빛의 경로(이번 구간에서 지나온 길)
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x0, mbot);
      var half = Tm / 2;
      for (var k = 1; k * half <= tp + 1e-9; k++) ctx.lineTo(x0 + u * k * half, k % 2 ? mtop : mbot);
      var phm = (tp % Tm) / Tm;
      var ym = phm < 0.5 ? mbot - L * phm * 2 : mtop + L * (phm - 0.5) * 2;
      ctx.lineTo(xc, ym); ctx.stroke();
      // 다음 한 번 똑딱의 예정 경로(점선)
      if (u > 0) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
        var k0 = Math.floor(tp / Tm) * 2;
        ctx.beginPath(); ctx.moveTo(x0 + u * k0 * half, mbot);
        ctx.lineTo(x0 + u * (k0 + 1) * half, mtop); ctx.lineTo(x0 + u * (k0 + 2) * half, mbot); ctx.stroke();
        ctx.setLineDash([]);
      }
      // 시계 틀
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.strokeRect(xc - 24, mtop - 8, 48, L + 16);
      mirror(T, xc, mtop, false); mirror(T, xc, mbot, phm < 0.06 && state.t > 0.1);
      photon(T, xc, ym);
      // 운동 방향 화살표
      if (u > 0) {
        ctx.strokeStyle = T.figInk; ctx.fillStyle = T.figInk; ctx.lineWidth = 2;
        var ay = mtop - 20;
        ctx.beginPath(); ctx.moveTo(xc - 18, ay); ctx.lineTo(xc + 16, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xc + 24, ay); ctx.lineTo(xc + 14, ay - 5); ctx.lineTo(xc + 14, ay + 5); ctx.closePath(); ctx.fill();
      }
      // 한 번 똑딱하는 동안의 경로 설명
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('빛의 경로 ' + (2 * r).toFixed(2) + 'L  (정지 시계의 ' + r.toFixed(2) + '배)', M.x + M.w / 2, mbot + 32);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('두 빛은 같은 속력으로 움직인다', M.x + M.w / 2, M.y + M.h - 8);
    }

    api.onResize(draw);
    readouts(); draw();
  },
});
