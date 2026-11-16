/* 일반물리학 4 각운동량 보존: 회전 의자에서 아령을 든 팔을 모으면 I가 줄고 ω가 커진다. L은 일정, K는 증가 */
Sims.register('u-angular-momentum', {
  title: '회전 의자와 아령 — 각운동량 보존',
  caption: '돌고 있는 회전 의자 위에서 아령(각 2.0 kg)까지의 거리 r을 바꾸거나 \'팔 모으기\'를 눌러 보자. 외부 토크가 없으므로 L = Iω가 일정하게 유지되어, 관성 모멘트가 줄어든 만큼 각속도가 커진다. 회전 운동 에너지 K = L²/2I는 보존되지 않고 늘어나는데, 늘어난 만큼은 팔을 안쪽으로 당기는 근육이 한 일이다. 사람과 의자의 관성 모멘트는 1.2 kg·m²로 일정하다고 보고, 팔의 질량과 축의 마찰은 무시했다(위에서 내려다본 모식도).',
  init: function (api) {
    var I0 = 1.2, M = 2.0, R_OPEN = 0.8, R_MIN = 0.25, W_START = 2.0;
    function Iof(r) { return I0 + 2 * M * r * r; }
    var L = Iof(R_OPEN) * W_START;
    var st = { r: R_OPEN, ang: 0, target: null };
    var Ii = Iof(R_OPEN), Wi = W_START, Ki = L * L / (2 * Ii);

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.58; }, label: '위에서 본 회전 의자와 아령, 그리고 I, ω, L, K 막대그래프' });
    var ctx = cv.ctx;
    var rI = api.readout('관성 모멘트 I');
    var rW = api.readout('각속도 ω');
    var rL = api.readout('각운동량 L = Iω');
    var rK = api.readout('회전 운동 에너지 K');
    var rWk = api.readout('팔을 당기며 한 일 = ΔK');

    var sl = api.slider({ id: 'u-angular-momentum-r', label: '아령까지 거리 r', min: R_MIN, max: R_OPEN, step: 0.01, value: R_OPEN,
      format: function (v) { return v.toFixed(2) + ' m'; }, onInput: function (v) { st.r = v; st.target = null; update(); } });
    var g = api.group();
    api.button('팔 모으기', function () { moveTo(R_MIN); }, { primary: true, parent: g });
    api.button('팔 벌리기', function () { moveTo(R_OPEN); }, { parent: g });

    function moveTo(r) {
      if (api.reduced) { sl.set(r); return; }
      st.target = r; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (st.target != null) {
        var d = st.target - st.r, step = 0.9 * dt;
        if (Math.abs(d) <= step) { st.r = st.target; st.target = null; } else st.r += Math.sign(d) * step;
        sl.input.value = st.r;
      }
      st.ang += (L / Iof(st.r)) * dt;
      update();
    });

    function update() {
      var I = Iof(st.r), w = L / I, K = L * L / (2 * I);
      rI.set(I.toFixed(2) + ' kg·m²');
      rW.set(w.toFixed(2) + ' rad/s (' + (w / (2 * Math.PI)).toFixed(2) + ' rev/s)');
      rL.set(L.toFixed(2) + ' kg·m²/s');
      rK.set(K.toFixed(2) + ' J');
      rWk.set((K - Ki >= 0 ? '+' : '') + (K - Ki).toFixed(2) + ' J');
      var outs = api.controls.querySelectorAll('output');
      if (outs[0]) outs[0].textContent = st.r.toFixed(2) + ' m';
      draw(I, w, K);
    }

    function draw(I, w, K) {
      var T = api.tokens(), W = cv.w, H = cv.h, narrow = W < 560;
      ctx.clearRect(0, 0, W, H);
      var vw = narrow ? { x: 0, y: 0, w: W, h: H * 0.56 } : { x: 0, y: 0, w: W * 0.5, h: H };
      var bw = narrow ? { x: 0, y: H * 0.58, w: W, h: H * 0.42 } : { x: W * 0.53, y: 0, w: W * 0.47, h: H };
      // 위에서 본 장면
      var cx = vw.x + vw.w / 2, cy = vw.y + vw.h / 2 + 6;
      var sc = Math.min(vw.w, vw.h) / 2 / 1.12;   // 1 m 당 픽셀
      ctx.strokeStyle = T.figLine; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R_OPEN * sc, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // 의자 바닥
      ctx.beginPath(); ctx.arc(cx, cy, 0.3 * sc, 0, Math.PI * 2); ctx.fillStyle = T.figSoftBlue; ctx.fill();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5; ctx.stroke();
      var a = st.ang;
      var ux = Math.cos(a), uy = Math.sin(a);
      // 팔
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - ux * st.r * sc, cy - uy * st.r * sc); ctx.lineTo(cx + ux * st.r * sc, cy + uy * st.r * sc); ctx.stroke();
      ctx.lineCap = 'butt';
      // 몸(어깨)
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 0.2 * sc, 0.12 * sc, 0, 0, Math.PI * 2);
      ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0.04 * sc, 0.08 * sc, 0, Math.PI * 2); ctx.fillStyle = T.figSoftAmber; ctx.fill(); ctx.stroke();
      ctx.restore();
      // 아령과 속도 화살표
      [1, -1].forEach(function (sg) {
        var px = cx + sg * ux * st.r * sc, py = cy + sg * uy * st.r * sc;
        ctx.beginPath(); ctx.arc(px, py, 0.075 * sc + 3, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
        var v = w * st.r, len = v * sc * 0.28;
        var tx = -uy * sg, ty = ux * sg;   // 시계 반대(화면에서는 시계 방향 증가각) 접선
        arrow(px, py, px + tx * len, py + ty * len, T.figGreen);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('점선: 팔을 벌린 자리 (r = 0.80 m)', cx, vw.y + vw.h - 6);
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'left';
      ctx.fillText('초록 화살표: 아령의 속력 v = rω', vw.x + 6, vw.y + 16);
      // 막대그래프
      var bars = [
        ['I', I / Ii, T.figAmber], ['ω', w / Wi, T.figBlue], ['L', 1, T.figGreen], ['K', K / Ki, T.figViolet],
      ];
      var L0 = bw.x + 34, R0 = bw.x + bw.w - 10, B0 = bw.y + bw.h - 34, T0 = bw.y + 30;
      var ymax = 3.5, sy = function (v) { return B0 - (v / ymax) * (B0 - T0); };
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var k = 0; k <= 3; k++) {
        ctx.strokeStyle = k === 1 ? T.figMuted : T.rule; ctx.lineWidth = 1;
        if (k === 1) ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(L0, sy(k)); ctx.lineTo(R0, sy(k)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figMuted; ctx.fillText(k + '×', L0 - 6, sy(k) + 4);
      }
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('팔을 벌렸을 때 값에 대한 비', L0, bw.y + 16);
      var slot = (R0 - L0) / bars.length;
      bars.forEach(function (b, i) {
        var x = L0 + slot * i + slot * 0.22, bwid = slot * 0.56;
        ctx.fillStyle = b[2]; ctx.fillRect(x, sy(b[1]), bwid, B0 - sy(b[1]));
        ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(b[0], x + bwid / 2, B0 + 16);
        ctx.font = '11px ' + T.fontMono; ctx.fillText(b[1].toFixed(2), x + bwid / 2, sy(b[1]) - 5);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('L은 그대로, ω와 K는 I가 준 비율만큼 커진다', (L0 + R0) / 2, B0 + 30);
    }
    function arrow(x1, y1, x2, y2, col) {
      var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy); if (l < 2) return;
      var ux = dx / l, uy = dy / l, hd = Math.min(9, l * 0.5);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hd, y2 - uy * hd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hd - uy * hd * 0.5, y2 - uy * hd + ux * hd * 0.5);
      ctx.lineTo(x2 - ux * hd + uy * hd * 0.5, y2 - uy * hd - ux * hd * 0.5); ctx.closePath(); ctx.fill();
    }
    api.onResize(update);
    update();
  },
});
