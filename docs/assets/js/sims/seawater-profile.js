/* 중3-3 수권과 해수의 순환: 햇빛(계절)과 바람에 따른 해수의 연직 수온 분포(혼합층·수온 약층·심해층) */
Sims.register('seawater-profile', {
  title: '햇빛과 바람이 만드는 바닷물의 층',
  caption: '햇빛의 세기를 바꾸면 표층 수온이, 바람의 세기를 바꾸면 물이 섞이는 깊이(혼합층의 두께)가 달라진다. 여름처럼 햇빛이 강하고 바람이 약하면 혼합층이 얇고 그 아래 수온 약층이 뚜렷해지며, 겨울처럼 표면이 식고 바람이 강하면 혼합층이 두꺼워진다. 심해층은 계절에 관계없이 차갑고 거의 일정하다. 우리나라 동해처럼 깊은 바다를 가정한 모형이며 수치는 본문 예제 3의 자료와 비슷하게 맞춘 대략값이다. 100 m보다 깊은 곳은 그래프 눈금 간격을 줄였다.',
  init: function (api) {
    var BG = [[0, 14], [50, 9.5], [100, 5], [200, 2], [500, 1.5]];   // 계절에 거의 관계없는 깊은 곳의 수온(°C)
    var ZMAX = 500, L = 12;
    var st = { s: 1, w: 0.07, ghost: null, ghostName: '', t: 0 };

    function B(z) { for (var i = 1; i < BG.length; i++) if (z <= BG[i][0]) { var a = BG[i - 1], b = BG[i]; return a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]); } return BG[BG.length - 1][1]; }
    function model(s, w) {
      var Tsun = 10 + 15 * s, hw = 5 + 70 * w, Ts = Tsun;
      if (Tsun > B(hw)) Ts = Tsun - (Tsun - B(hw)) * 0.25 * w;
      var hc = 0; if (Ts < B(0)) { var lo = 0, hi = 200; for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (B(m) > Ts) lo = m; else hi = m; } hc = (lo + hi) / 2; }
      var h = Math.max(hw, hc);
      var Bh = B(h);
      function T(z) { return z <= h ? Ts : B(z) + (Ts - Bh) * Math.exp(-(z - h) / L); }
      var g = 0; for (var z = h; z < 200; z += 1) g = Math.max(g, (T(z) - T(z + 10)));
      return { Ts: Ts, h: h, T: T, grad: g, conv: hc > hw + 0.5 };
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.6; }, label: '바다의 단면과 깊이에 따른 수온 그래프' });
    var ctx = cv.ctx;
    var rTs = api.readout('표층 수온');
    var rH = api.readout('혼합층 두께');
    var rG = api.readout('수온 약층');

    var sS = api.slider({ id: 'seawater-profile-sun', label: '햇빛의 세기 (계절)', min: 0, max: 1, step: 0.01, value: st.s,
      format: function (v) { return v < 0.3 ? '약함 · 겨울' : v < 0.7 ? '중간 · 봄·가을' : '강함 · 여름'; },
      onInput: function (v) { st.s = v; update(); } });
    var sW = api.slider({ id: 'seawater-profile-wind', label: '바람의 세기', min: 0, max: 1, step: 0.01, value: st.w,
      format: function (v) { return v < 0.3 ? '약함' : v < 0.65 ? '보통' : '강함'; },
      onInput: function (v) { st.w = v; update(); } });
    var g = api.group();
    api.button('여름 (8월) 예', function () { preset(1, 0.07, '여름'); }, { parent: g });
    api.button('겨울 (2월) 예', function () { preset(0, 0.65, '겨울'); }, { parent: g });
    function preset(s, w, name) {
      st.ghost = model(st.s, st.w); st.ghostName = '바꾸기 전';
      sS.set(s); sW.set(w);
    }

    var loop = api.loop(function (dt) { if (dt > 0) { st.t += dt; draw(); } });
    if (api.reduced) loop.pause();

    function update() {
      var M = model(st.s, st.w);
      rTs.set(M.Ts.toFixed(1) + ' °C');
      rH.set('약 ' + Math.round(M.h) + ' m' + (M.conv ? ' (표면이 식어 깊이 섞임)' : ''));
      rG.set((M.grad > 2 ? '뚜렷함' : M.grad > 0.8 ? '보통' : '약함') + ' · 위아래 수온 차 ' + (M.Ts - 2).toFixed(0) + ' °C');
      draw();
    }
    function lerpHex(a, b, t) {
      function h(c) { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join(''); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
      var A = h(a), Bc = h(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(A[i] + (Bc[i] - A[i]) * t); }).join(',') + ')';
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, M = model(st.s, st.w);
      ctx.clearRect(0, 0, w, h);
      var top = 64, bot = h - 34;
      var zBreak = top + (bot - top) * 0.58;
      function Y(z) { return z <= 100 ? top + (zBreak - top) * z / 100 : zBreak + (bot - zBreak) * (z - 100) / (ZMAX - 100); }
      var colX = 8, colW = narrow ? w * 0.3 : w * 0.3;
      var gL = colX + colW + (narrow ? 56 : 76), gR = w - 14;
      function X(t) { return gL + t / 30 * (gR - gL); }
      // 하늘: 해와 바람
      var sunR = 8 + 10 * st.s;
      ctx.beginPath(); ctx.arc(colX + 22, 26, sunR, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('햇빛', colX + 44, 22);
      var wl = 10 + 50 * st.w;
      for (var k = 0; k < 2; k++) {
        var wy = 34 + k * 12, wx = colX + 44 + ((st.t * 30 * (0.3 + st.w)) % 20);
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + wl, wy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + wl, wy); ctx.lineTo(wx + wl - 5, wy - 3); ctx.lineTo(wx + wl - 5, wy + 3); ctx.closePath(); ctx.fillStyle = T.figMuted; ctx.fill();
      }
      ctx.fillStyle = T.figInk; ctx.fillText('바람', colX + 44 + wl + 26 > colX + colW ? colX + 44 : colX + 44 + wl + 26, 58 - 2);
      // 바다 단면(깊이별 수온 색)
      for (var y = top; y < bot; y += 2) {
        var z = y <= zBreak ? (y - top) / (zBreak - top) * 100 : 100 + (y - zBreak) / (bot - zBreak) * (ZMAX - 100);
        var t = Math.max(0, Math.min(1, M.T(z) / 26));
        ctx.fillStyle = lerpHex(T.figSoftBlue, T.figSoftRed, t); ctx.fillRect(colX, y, colW, 2.2);
      }
      // 물결
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.beginPath();
      for (var xx = 0; xx <= colW; xx += 2) { var yy = top - 2 + Math.sin(xx / 8 + st.t * 3) * (1 + 3 * st.w); if (xx === 0) ctx.moveTo(colX + xx, yy); else ctx.lineTo(colX + xx, yy); }
      ctx.stroke();
      // 섞이는 소용돌이
      var yh = Y(M.h);
      var nSw = Math.max(1, Math.floor((yh - top) / 26));
      for (var i = 0; i < nSw; i++) {
        var sy = top + (yh - top) * (i + 0.5) / nSw, rr = Math.min(10, (yh - top) / nSw * 0.4);
        if (rr < 3) continue;
        for (var j = 0; j < 2; j++) {
          var sx = colX + colW * (0.3 + 0.4 * j), a0 = st.t * (1 + 3 * st.w) * (j ? -1 : 1);
          ctx.strokeStyle = T.figInk; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sx, sy, rr, a0, a0 + 4.5, j === 1); ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
      // 층 경계와 이름
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
      [[M.h], [200]].forEach(function (b) { ctx.beginPath(); ctx.moveTo(colX, Y(b[0])); ctx.lineTo(gR, Y(b[0])); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      var mid = colX + colW / 2;
      if (yh - top > 15) ctx.fillText('혼합층', mid, (top + yh) / 2 + 4); else { ctx.textAlign = 'left'; ctx.fillText('← 혼합층', colX + colW + 4, top + 8); ctx.textAlign = 'center'; }
      ctx.fillText('수온 약층', mid, (yh + Y(200)) / 2 + 4);
      ctx.fillText('심해층', mid, (Y(200) + bot) / 2 + 4);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(colX, top, colW, bot - top);
      // 그래프 축
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      [0, 5, 10, 15, 20, 25, 30].forEach(function (t) { ctx.beginPath(); ctx.moveTo(X(t), top); ctx.lineTo(X(t), bot); ctx.stroke(); ctx.fillText(t, X(t), top - 6); });
      ctx.textAlign = 'right';
      [0, 20, 40, 60, 80, 100, 200, 300, 400, 500].forEach(function (z) { ctx.beginPath(); ctx.moveTo(gL, Y(z)); ctx.lineTo(gR, Y(z)); ctx.stroke(); ctx.fillText(z, gL - 6, Y(z) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('수온 (°C)', (gL + gR) / 2, top - 22);
      ctx.save(); ctx.translate(gL - (narrow ? 42 : 50), (top + bot) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('깊이 (m)', 0, 0); ctx.restore();
      // 눈금 간격이 바뀌는 곳
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(gL - 5, zBreak - 3); ctx.lineTo(gL + 5, zBreak - 7); ctx.moveTo(gL - 5, zBreak + 3); ctx.lineTo(gL + 5, zBreak - 1); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('↓ 100 m 아래는 눈금 간격을 줄임', gR - 2, zBreak + 14);
      // 수온 곡선
      function curve(Mx, color, lw, dash) {
        ctx.setLineDash(dash || []); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (var z = 0; z <= ZMAX; z += (z < 100 ? 0.5 : 2)) { var x = X(Mx.T(z)), y = Y(z); if (z === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (st.ghost) {
        curve(st.ghost, T.figLine, 1.8, [5, 4]);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(st.ghostName, Math.min(X(st.ghost.Ts) + 4, gR - 50), top + 14 + 14);
      }
      curve(M, T.figRed, 3);
      ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = X(M.Ts) + 6; ctx.fillText('지금', Math.min(lx, gR - 30), top + 14);
    }

    api.onResize(update);
    update();
  },
});
