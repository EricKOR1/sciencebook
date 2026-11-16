/* 일반물리학 1 운동의 기술: 강을 건너는 배 — 상대 속도의 벡터 덧셈 v_BG = v_BW + v_WG */
Sims.register('u-relative-velocity', {
  title: '강을 건너는 배 — 뱃머리 방향과 실제로 가는 방향',
  caption: '물살의 속력, 물에 대한 배의 속력, 뱃머리 방향을 정하고 「건너기」를 눌러 보자. 오른쪽 벡터 삼각형처럼 땅에 대한 배의 속도는 물에 대한 배의 속도와 물의 속도를 더한 것이다(v_BG = v_BW + v_WG). 건너는 시간은 강을 가로지르는 성분(v_BW cos α)만으로 정해지므로 뱃머리를 정북으로 할 때 가장 빠르고, 맞은편에 곧장 가려면 상류 쪽으로 sin α = v_WG / v_BW만큼 돌려야 한다. 강 폭은 80.0 m, 물살은 강 어디서나 같다고 보았다.',
  init: function (api) {
    var WID = 80;
    var st = { u: 1.2, vb: 2.0, deg: 0, t: 0, playing: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.52; }, label: '강을 건너는 배의 경로와 속도 벡터 삼각형' });
    var ctx = cv.ctx;

    var rV = api.readout('땅에 대한 속력');
    var rT = api.readout('건너는 시간');
    var rD = api.readout('하류로 떠내려간 거리');
    var rDir = api.readout('실제 진행 방향');

    var sU = api.slider({ id: 'u-relative-velocity-u', label: '물살 v_WG', min: 0, max: 3, step: 0.1, value: st.u,
      format: function (v) { return v.toFixed(1) + ' m/s'; }, onInput: function (v) { st.u = v; changed(); } });
    var sB = api.slider({ id: 'u-relative-velocity-b', label: '물에 대한 배 v_BW', min: 0.5, max: 3, step: 0.1, value: st.vb,
      format: function (v) { return v.toFixed(1) + ' m/s'; }, onInput: function (v) { st.vb = v; changed(); } });
    var sA = api.slider({ id: 'u-relative-velocity-a', label: '뱃머리 α (−: 상류 쪽)', min: -80, max: 80, step: 0.1, value: st.deg,
      format: function (v) { return (v < 0 ? '북에서 서쪽 ' : v > 0 ? '북에서 동쪽 ' : '정북 ') + Math.abs(v).toFixed(1) + '°'; },
      onInput: function (v) { st.deg = v; changed(); } });
    var g = api.group();
    api.button('가장 빨리(정북)', function () { sA.set(0); }, { parent: g });
    var bStraight = api.button('맞은편으로 곧장', function () {
      if (st.u < st.vb) sA.set(-Math.asin(st.u / st.vb) * 180 / Math.PI);
    }, { parent: g });
    api.button('건너기', function () { go(); }, { primary: true, parent: g });

    function calc() {
      var a = st.deg * Math.PI / 180;
      var bx = st.vb * Math.sin(a), by = st.vb * Math.cos(a);   // 물에 대한 배 (동, 북)
      var gx = bx + st.u, gy = by;                               // 땅에 대한 배
      var T = WID / gy;
      return { bx: bx, by: by, gx: gx, gy: gy, T: T, drift: gx * T, speed: Math.sqrt(gx * gx + gy * gy) };
    }
    function changed() {
      bStraight.disabled = !(st.u < st.vb);
      st.t = 0; st.playing = false; loop.pause();
      var c = calc();
      rV.set(c.speed.toFixed(2) + ' m/s');
      rT.set(c.T.toFixed(1) + ' s');
      rD.set((Math.abs(c.drift) < 0.05 ? '0.0' : c.drift.toFixed(1)) + ' m' + (c.drift < -0.05 ? ' (상류 쪽)' : ''));
      var ang = Math.atan2(c.gx, c.gy) * 180 / Math.PI;
      rDir.set(Math.abs(ang) < 0.05 ? '정북' : '북에서 ' + (ang > 0 ? '동' : '서') + '쪽 ' + Math.abs(ang).toFixed(1) + '°');
      draw();
    }
    function go() {
      if (api.reduced) { st.t = 1; draw(); return; }
      st.t = 0; st.playing = true; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!st.playing) return;
      st.t += dt / 3.5;           // 화면에서는 3.5초 동안 건너는 모습을 보여 준다
      if (st.t >= 1) { st.t = 1; st.playing = false; loop.pause(); }
      draw();
    });
    loop.pause();

    function arrow(x1, y1, x2, y2, col, lw) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy); if (L < 2) return;
      var ux = dx / L, uy = dy / L, hl = Math.min(11, L * 0.45);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hl - uy * hl * 0.5, y2 - uy * hl + ux * hl * 0.5); ctx.lineTo(x2 - ux * hl + uy * hl * 0.5, y2 - uy * hl - ux * hl * 0.5); ctx.closePath(); ctx.fill();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var sc = narrow ? { x: 0, y: 0, w: w, h: h * 0.56 } : { x: 0, y: 0, w: w * 0.6, h: h };
      var tr = narrow ? { x: 0, y: h * 0.58, w: w, h: h * 0.42 } : { x: w * 0.62, y: 0, w: w * 0.38, h: h };
      var c = calc();
      scene(T, sc, c); triangle(T, tr, c);
    }
    function scene(T, r, c) {
      var bankH = 26, top = r.y + 22 + bankH, bot = r.y + r.h - 22 - bankH;
      var s = (bot - top) / WID;                    // 1 m 당 픽셀
      var x0 = r.x + Math.min(r.w * 0.3, 90);      // 출발점 x
      var X = function (m) { return x0 + m * s; }, Y = function (m) { return bot - m * s; };
      // 강가와 강
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(r.x, r.y + 22, r.w, bankH); ctx.fillRect(r.x, bot, r.w, bankH);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(r.x, top, r.w, bot - top);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('북쪽 강가', r.x + 6, r.y + 22 + 17); ctx.fillText('남쪽 강가', r.x + 6, bot + 17);
      ctx.textAlign = 'right'; ctx.fillText('강 폭 80.0 m', r.x + r.w - 6, r.y + 16);
      // 물결 화살표
      if (st.u > 0.05) {
        for (var i = 0; i < 3; i++) for (var j = 0; j < 4; j++) {
          var yy = top + (bot - top) * (i + 0.5) / 3, xx = r.x + r.w * (j + 0.25) / 4 + (i % 2) * 20;
          arrow(xx, yy, xx + 10 + st.u * 9, yy, T.figLine, 1.5);
        }
      }
      // 맞은편 지점
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(WID)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('맞은편', X(0), r.y + 16);
      // 경로 (화면 밖이면 잘라서)
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y + 22, r.w, r.h - 44); ctx.clip();
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(c.drift), Y(WID)); ctx.stroke(); ctx.setLineDash([]);
      var tt = st.t * c.T, bx = X(c.gx * tt), by = Y(c.gy * tt);
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(bx, by); ctx.stroke();
      // 배: 뱃머리 방향으로 그린다
      var a = st.deg * Math.PI / 180;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -15); ctx.quadraticCurveTo(8, -4, 7, 10); ctx.lineTo(-7, 10); ctx.quadraticCurveTo(-8, -4, 0, -15); ctx.closePath();
      ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      // 배 위의 속도 화살표 (뱃머리 = 물에 대한 속도, 실제 = 땅에 대한 속도)
      var k = 22;
      arrow(bx, by, bx + c.bx * k, by - c.by * k, T.figRed, 2.2);
      arrow(bx, by, bx + c.gx * k, by - c.gy * k, T.figGreen, 2.6);
      ctx.restore();
      var landX = X(c.drift);
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figGreen;
      if (landX > r.x + r.w - 10) { ctx.textAlign = 'right'; ctx.fillText('→ 하류 ' + c.drift.toFixed(0) + ' m 지점에 닿음', r.x + r.w - 6, Y(WID) - 6 - bankH / 2 + 4); }
      else if (landX < r.x + 10) { ctx.textAlign = 'left'; ctx.fillText('← 상류 ' + (-c.drift).toFixed(0) + ' m 지점', r.x + 6, Y(WID) - 6); }
      else { ctx.beginPath(); ctx.arc(landX, Y(WID), 5, 0, Math.PI * 2); ctx.fill(); ctx.textAlign = 'center'; ctx.fillText('도착', Math.min(Math.max(landX, r.x + 20), r.x + r.w - 20), Y(WID) - 10); }
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('출발', X(0), bot + bankH + 14);
    }
    function triangle(T, r, c) {
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('속도 벡터 삼각형', r.x + 8, r.y + 18);
      var lo = Math.min(c.bx, 0), hi = Math.max(c.gx, 0);
      var k = Math.min((r.w - 40) / Math.max(hi - lo, 0.5), (r.h - 100) / Math.max(c.by, 0.3), 70);
      var ox = r.x + r.w / 2 - (lo + hi) / 2 * k, oy = r.y + r.h - 50;
      // 기준 방향
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - st.vb * k - 6); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('북', ox, oy - st.vb * k - 10);
      arrow(ox, oy, ox + c.bx * k, oy - c.by * k, T.figRed, 2.6);
      arrow(ox + c.bx * k, oy - c.by * k, ox + c.gx * k, oy - c.gy * k, T.figBlue, 2.6);
      arrow(ox, oy, ox + c.gx * k, oy - c.gy * k, T.figGreen, 3);
      ctx.beginPath(); ctx.arc(ox, oy, 3, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
      // 범례(아래)
      var ly = r.y + r.h - 22, lx = r.x + 8;
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figRed; ctx.fillText('■ 물에 대한 배 v_BW', lx, ly);
      ctx.fillStyle = T.figBlue; ctx.fillText('■ 물 v_WG', lx + 138, ly);
      ctx.fillStyle = T.figGreen; ctx.fillText('■ 땅에 대한 배 v_BG = v_BW + v_WG', lx, ly + 17);
    }
    api.onResize(draw);
    changed();
  },
});
