/* 일반지구과학 2 지각 평형(에어리 모형): 지각 두께·밀도 → 산의 높이와 뿌리, 침식 뒤의 융기 */
Sims.register('u-isostasy', {
  title: '떠 있는 산 — 지각 평형과 침식 뒤의 융기',
  caption: '산 아래 지각 두께와 밀도를 바꾸어 보자. 지각 평형(에어리 모형)에서는 보상 깊이에서 두 기둥의 압력이 같아야 하므로, 두꺼워진 지각의 약 85 %는 맨틀 속 뿌리가 되고 약 15 %만 산으로 솟는다(r = ρc h/(ρm − ρc)). ‘1 km 깎아 내기’를 거듭 누르면 깎은 양보다 고도는 훨씬 조금 낮아지고, 깊은 곳의 암석(별)이 지표로 올라온다. 높이와 깊이는 같은 축척이고, 기준 지각은 두께 35 km·지표 높이 0으로 두었으며 암석권의 강도와 맨틀의 점성(되돌아오는 데 걸리는 시간)은 무시했다.',
  init: function (api) {
    var T0 = 35, G = 9.8;
    var state = { Tm: 65, rc: 2800, rm: 3300, eroded: 0, mark: 0, shown: null };
    function eq() {
      var dT = state.Tm - T0;
      return { e: dT * (state.rm - state.rc) / state.rm, r: dT * state.rc / state.rm };
    }
    function resetMark() { state.eroded = 0; state.mark = state.Tm - 22; }   // 별: 처음 산꼭대기에서 22 km 아래(지각 바닥에서 잰 높이)
    resetMark();

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.56; }, label: '맨틀 위에 떠 있는 지각 기둥과 산의 뿌리' });
    var ctx = cv.ctx;
    var rH = api.readout('산의 높이 h');
    var rR = api.readout('뿌리 깊이 r');
    var rRatio = api.readout('r / h');
    var rEr = api.readout('깎아 낸 두께 → 고도 감소');
    var rP = api.readout('보상 깊이의 압력');

    var sT = api.slider({ id: 'u-isostasy-t', label: '산 아래 지각 두께', min: 36, max: 75, step: 1, value: state.Tm,
      format: function (v) { return v + ' km'; }, onInput: function (v) { state.Tm = v; resetMark(); target(); } });
    var sRc = api.slider({ id: 'u-isostasy-rc', label: '지각 밀도 ρc', min: 2600, max: 3000, step: 50, value: state.rc,
      format: function (v) { return v + ' kg/m³'; }, onInput: function (v) { state.rc = v; target(); } });
    var sRm = api.slider({ id: 'u-isostasy-rm', label: '맨틀 밀도 ρm', min: 3200, max: 3400, step: 50, value: state.rm,
      format: function (v) { return v + ' kg/m³'; }, onInput: function (v) { state.rm = v; target(); } });
    var eb = api.button('1 km 깎아 내기', function () {
      if (state.Tm <= T0 + 1) return;
      state.Tm -= 1; state.eroded += 1;
      sT.input.value = state.Tm; var o = sT.input.parentNode.querySelector('output'); if (o) o.textContent = state.Tm + ' km';
      target();
    }, { primary: true });
    api.button('처음으로', function () { sRc.set(2800); sRm.set(3300); sT.set(65); });

    function target() {
      var E = eq();
      if (!state.shown || api.reduced) state.shown = { e: E.e, r: E.r };
      eb.disabled = state.Tm <= T0 + 1;
      readouts(E);
      loop.play();
    }
    var loop = api.loop(function (dt) {
      var E = eq(), s = state.shown, k = Math.min(1, dt * 4);
      s.e += (E.e - s.e) * k; s.r += (E.r - s.r) * k;
      if (Math.abs(E.e - s.e) < 1e-3 && Math.abs(E.r - s.r) < 1e-3) { s.e = E.e; s.r = E.r; loop.pause(); }
      draw();
    });
    loop.pause();

    function readouts(E) {
      rH.set(E.e.toFixed(2) + ' km');
      rR.set(E.r.toFixed(1) + ' km');
      rRatio.set(E.e > 0.001 ? (E.r / E.e).toFixed(1) + ' 배' : '–');
      var drop = state.eroded * (state.rm - state.rc) / state.rm;
      rEr.set(state.eroded + ' km → ' + drop.toFixed(2) + ' km');
      var zc = (T0 + E.r) * 1000;   // 보상 깊이: 뿌리 바닥(지표 0 아래, m)
      var pM = state.rc * G * (E.e * 1000 + zc) / 1e6, pR = (state.rc * T0 * 1000 + state.rm * E.r * 1000) * G / 1e6;
      rP.set('산 ' + pM.toFixed(0) + ' MPa = 기준 ' + pR.toFixed(0) + ' MPa');
      draw();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, mob = w < 560;
      ctx.clearRect(0, 0, w, h);
      var s = state.shown || eq();
      var top = 26, ZMAX = 10, ZMIN = -85, sy = function (z) { return top + (ZMAX - z) / (ZMAX - ZMIN) * (h - top - 30); };
      var L = mob ? 44 : 56, R = w - (mob ? 10 : 150), mw = (R - L) * 0.36, mx0 = (L + R) / 2 - mw / 2, mx1 = mx0 + mw;
      // 맨틀
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(L, sy(-T0), R - L, sy(ZMIN) - sy(-T0));
      // 공기/기준면
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(R, sy(0)); ctx.stroke(); ctx.setLineDash([]);
      // 기준 지각(양옆)
      function crust(x0, x1, zt, zb, a) {
        ctx.fillStyle = T.figSoftAmber; ctx.globalAlpha = a || 1; ctx.fillRect(x0, sy(zt), x1 - x0, sy(zb) - sy(zt)); ctx.globalAlpha = 1;
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.strokeRect(x0, sy(zt), x1 - x0, sy(zb) - sy(zt));
      }
      crust(L, mx0, 0, -T0); crust(mx1, R, 0, -T0);
      // 산 기둥
      var zt = s.e, zb = -(T0 + s.r);
      // 깎여 나간 부분(점선)
      if (state.eroded > 0) {
        var oldTop = zt + state.eroded;   // 깎기 전 같은 기둥의 꼭대기(지금 위치로 옮겨 그림)
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
        ctx.strokeRect(mx0, sy(oldTop), mw, sy(zt) - sy(oldTop)); ctx.setLineDash([]);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        if (sy(zt) - sy(oldTop) > 12) ctx.fillText('깎여 나간 ' + state.eroded + ' km', (mx0 + mx1) / 2, sy(oldTop) - 4);
      }
      crust(mx0, mx1, zt, zb);
      ctx.fillStyle = T.figAmber; ctx.globalAlpha = 0.35; ctx.fillRect(mx0, sy(zt), mw, sy(0) - sy(zt)); ctx.globalAlpha = 1;
      // 보상 깊이
      ctx.strokeStyle = T.figRed; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, sy(zb)); ctx.lineTo(R, sy(zb)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('보상 깊이: 두 기둥의 압력이 같다', L + 6, sy(zb) + 15);
      // 깊은 곳의 암석(별)
      var mz = zb + state.mark, exposed = mz >= zt - 1e-6;
      if (exposed) mz = zt;
      star((mx0 + mx1) / 2, sy(mz), 8, exposed ? T.figRed : T.figViolet, T);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(exposed ? '깊은 곳의 암석이 지표에 드러남' : '깊은 곳의 암석', (mx0 + mx1) / 2 + 12, sy(mz) + 4);
      // 치수 화살표
      dim(mx1 + 10, 0, zt, 'h', T); dim(mx1 + 10, -T0, zb, 'r', T);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('지각 ' + state.rc, (L + mx0) / 2, sy(-T0 / 2) + 4);
      ctx.fillText('맨틀 ' + state.rm + ' kg/m³', (L + mx0) / 2 + (mob ? 0 : 20), sy(-70));
      // 깊이 눈금
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var z = 0; z >= -80; z -= 20) { ctx.fillText(z === 0 ? '0' : z, L - 6, sy(z) + 4); }
      ctx.fillText('+10', L - 6, sy(10) + 4);
      ctx.font = '11px ' + T.fontBody; ctx.fillText('km', L - 6, sy(ZMIN) + 14);
      if (!mob) {
        ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
        var tx = R + 14;
        ctx.fillText('두꺼워진 지각', tx, sy(5));
        ctx.fillText((s.e + s.r).toFixed(1) + ' km 중', tx, sy(5) + 16);
        ctx.fillStyle = T.figAmber; ctx.fillText('위로 ' + s.e.toFixed(1) + ' km', tx, sy(5) + 34);
        ctx.fillStyle = T.figGreen; ctx.fillText('아래로 ' + s.r.toFixed(1) + ' km', tx, sy(5) + 50);
      }
    }
    function dim(x, z0, z1, lab, T) {
      var y0 = cv.h, a = sy0(z0), b = sy0(z1);
      if (Math.abs(b - a) < 4) return;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, a); ctx.lineTo(x, b); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 4, a); ctx.lineTo(x + 4, a); ctx.moveTo(x - 4, b); ctx.lineTo(x + 4, b); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(lab, x + 6, (a + b) / 2 + 4);
      function sy0(z) { var top = 26; return top + (10 - z) / 95 * (cv.h - top - 30); }
    }
    function star(x, y, r, col, T) {
      ctx.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1; ctx.stroke();
    }
    api.onResize(draw);
    target();
  },
});
