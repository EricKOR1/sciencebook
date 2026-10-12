/* 5-3 엘니뇨와 라니냐: 적도 태평양 단면에서 무역풍·따뜻한 해수·용승·수온 약층·강수 지역의 변화 */
Sims.register('el-nino', {
  title: '적도 태평양 단면 — 평상시, 엘니뇨, 라니냐',
  caption: '세 버튼을 눌러 비교해 보자. 무역풍이 약해지면(엘니뇨) 서쪽에 쌓였던 따뜻한 해수가 동쪽으로 퍼지고, 페루 연안의 용승이 약해져 동태평양 수온이 오르며 비구름이 중앙~동태평양으로 옮겨 간다. 무역풍이 강해지면(라니냐) 그 반대가 된다. 바람이 바다를 바꾸고, 바뀐 바다가 다시 바람과 비를 바꾸는 대기–해양 상호작용이다. 깊이·거리 비율은 실제와 다른 모식도이다.',
  init: function (api) {
    var STATES = {
      normal: { name: '평상시', wind: 1, dW: 0.6, dE: 0.17, warmEnd: 0.52, up: 1, rainX: 0.22, rainI: 1, dryX: 0.8,
        r: ['보통', '서쪽에 두껍게 쌓임', '활발', '낮음', '서태평양'] },
      elnino: { name: '엘니뇨', wind: 0.3, dW: 0.46, dE: 0.4, warmEnd: 0.9, up: 0.18, rainX: 0.6, rainI: 1, dryX: 0.2,
        r: ['약해짐', '동쪽으로 퍼짐', '약해짐', '평년보다 높음', '중앙~동태평양'] },
      lanina: { name: '라니냐', wind: 1.6, dW: 0.7, dE: 0.08, warmEnd: 0.4, up: 1.6, rainX: 0.16, rainI: 1.35, dryX: 0.78,
        r: ['강해짐', '서쪽에 더 두껍게 쌓임', '강해짐', '평년보다 더 낮음', '서태평양(더 많이)'] },
    };
    var KEYS = ['wind', 'dW', 'dE', 'warmEnd', 'up', 'rainX', 'rainI', 'dryX'];
    var cur = {}, target = 'normal';
    KEYS.forEach(function (k) { cur[k] = STATES.normal[k]; });

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.56; }, label: '적도 태평양의 동서 단면: 대기, 바다, 수온 약층' });
    var ctx = cv.ctx;
    var rW = api.readout('무역풍');
    var rH = api.readout('따뜻한 표층 해수');
    var rU = api.readout('동태평양 용승');
    var rS = api.readout('페루 앞바다 수온');
    var rR = api.readout('비가 많이 오는 곳');

    var g = api.group();
    var btns = {};
    ['normal', 'elnino', 'lanina'].forEach(function (k) {
      btns[k] = api.button(STATES[k].name, function () { choose(k); }, { toggle: true, pressed: k === 'normal', parent: g });
    });
    function choose(k) {
      target = k;
      Object.keys(btns).forEach(function (b) { btns[b].setAttribute('aria-pressed', b === k ? 'true' : 'false'); });
      if (api.reduced) { KEYS.forEach(function (q) { cur[q] = STATES[k][q]; }); }
      readouts(); draw();
    }
    function readouts() {
      var s = STATES[target].r;
      rW.set(s[0]); rH.set(s[1]); rU.set(s[2]); rS.set(s[3]); rR.set(s[4]);
    }

    /* 움직이는 것들: 바람 입자, 용승 입자, 빗방울 */
    var windP = [], upP = [], rainP = [];
    for (var i = 0; i < 16; i++) windP.push({ u: Math.random(), v: Math.random() });
    for (var j = 0; j < 14; j++) upP.push({ s: Math.random(), o: Math.random() });
    for (var k = 0; k < 26; k++) rainP.push({ u: Math.random(), v: Math.random() });

    var loop = api.loop(function (dt) {
      var a = 1 - Math.exp(-dt / 0.45);
      KEYS.forEach(function (q) { cur[q] += (STATES[target][q] - cur[q]) * a; });
      windP.forEach(function (p) { p.u -= dt * 0.09 * cur.wind; if (p.u < 0) { p.u += 1; p.v = Math.random(); } });
      upP.forEach(function (p) { p.s += dt * 0.16 * Math.max(0.15, cur.up); if (p.s > 1) { p.s -= 1; p.o = Math.random(); } });
      rainP.forEach(function (p) { p.v += dt * 1.4; if (p.v > 1) { p.v -= 1; p.u = Math.random(); } });
      draw();
    });

    function G() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var sea = h * (narrow ? 0.44 : 0.42), bot = h * 0.97;
      return { w: w, h: h, narrow: narrow, sea: sea, bot: bot, D: bot - sea, xW: w * 0.085, xE: w * 0.915 };
    }
    function bx(g, f) { return g.xW + f * (g.xE - g.xW); }   // 바다 폭 안의 상대 위치 → 화면 x
    function thermY(g, x) { var f = (x - g.xW) / (g.xE - g.xW); return g.sea + (cur.dW + (cur.dE - cur.dW) * f) * g.D; }

    function draw() {
      var T = api.tokens(), g = G(), w = g.w, h = g.h;
      ctx.clearRect(0, 0, w, h);
      var fs = g.narrow ? 11 : 12;
      // 하늘
      ctx.fillStyle = T.figPaper; ctx.fillRect(0, 0, w, g.sea);
      // 깊은 찬물
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(g.xW, g.sea, g.xE - g.xW, g.bot - g.sea);
      // 수온 약층 위의 표층(따뜻한 물은 붉게, 동쪽의 덜 따뜻한 물은 청록)
      var grad = ctx.createLinearGradient(g.xW, 0, g.xE, 0);
      var e = Math.max(0.1, Math.min(0.95, cur.warmEnd));
      grad.addColorStop(0, T.figSoftRed); grad.addColorStop(Math.max(0, e - 0.1), T.figSoftRed);
      grad.addColorStop(Math.min(1, e + 0.1), T.figSoftTeal); grad.addColorStop(1, T.figSoftTeal);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(g.xW, g.sea); ctx.lineTo(g.xE, g.sea); ctx.lineTo(g.xE, thermY(g, g.xE)); ctx.lineTo(g.xW, thermY(g, g.xW)); ctx.closePath(); ctx.fill();
      // 표층 수온 띠
      var sg = ctx.createLinearGradient(g.xW, 0, g.xE, 0);
      sg.addColorStop(0, T.figRed); sg.addColorStop(Math.max(0, e - 0.1), T.figRed);
      sg.addColorStop(Math.min(1, e + 0.12), T.figBlue); sg.addColorStop(1, T.figBlue);
      ctx.fillStyle = sg; ctx.fillRect(g.xW, g.sea, g.xE - g.xW, 5);
      // 수온 약층
      ctx.setLineDash([7, 5]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(g.xW, thermY(g, g.xW)); ctx.lineTo(g.xE, thermY(g, g.xE)); ctx.stroke(); ctx.setLineDash([]);
      // 육지
      ctx.fillStyle = T.figSoftGreen; ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, g.sea - h * 0.06); ctx.quadraticCurveTo(g.xW * 0.6, g.sea - h * 0.08, g.xW, g.sea); ctx.lineTo(g.xW + 6, h); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w, h); ctx.lineTo(w, g.sea - h * 0.2); ctx.lineTo(w - (w - g.xE) * 0.45, g.sea - h * 0.22); ctx.lineTo(g.xE, g.sea); ctx.lineTo(g.xE - 6, h); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(g.xW, g.sea); ctx.lineTo(g.xE, g.sea); ctx.stroke();

      // 지역 이름
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('서태평양', 6, 15);
      ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('인도네시아·오스트레일리아', 6, 15 + fs + 3);
      ctx.textAlign = 'right'; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('동태평양', w - 6, 15);
      ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('페루·에콰도르 연안', w - 6, 15 + fs + 3);
      ctx.textAlign = 'center'; ctx.fillText('← 서', w * 0.42, 15); ctx.fillText('동 →', w * 0.58, 15);

      // 비구름과 상승 기류
      var rx = bx(g, cur.rainX), cy = h * (g.narrow ? 0.2 : 0.19), cs = (g.narrow ? 0.8 : 1) * (0.85 + 0.2 * cur.rainI);
      rainP.forEach(function (p) {
        var x = rx + (p.u - 0.5) * 70 * cs, y0 = cy + 14 * cs, y = y0 + p.v * (g.sea - y0 - 4);
        if (p.u > 0.5 + 0.5 * Math.min(1, cur.rainI)) return;
        ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 7); ctx.stroke();
      });
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(rx - 22 * cs, cy + 4 * cs, 13 * cs, 0, Math.PI * 2); ctx.arc(rx, cy - 5 * cs, 18 * cs, 0, Math.PI * 2); ctx.arc(rx + 23 * cs, cy + 4 * cs, 13 * cs, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(rx, cy + 8 * cs, 34 * cs, 9 * cs, 0, 0, Math.PI * 2); ctx.fill();
      arrow(T.figRed, rx - 46 * cs, g.sea - h * 0.06, rx - 46 * cs, cy - 4, 2);
      tag(T, '상승 기류', rx + 40 * cs, cy - 2, T.figRed, fs, false, 'left');
      tag(T, '많은 비', rx + 40 * cs, cy + fs + 2, T.figBlue, fs, false, 'left');
      // 하강 기류(건조)
      var dx = bx(g, cur.dryX), dTop = h * (g.narrow ? 0.18 : 0.14), dBot = g.sea - h * 0.13;
      arrow(T.figAmber, dx, dTop + 6, dx, dBot, 2);
      tag(T, '하강 기류 · 건조', dx, dTop - 2, T.figAmber, fs);

      // 무역풍
      var wy = g.sea - h * 0.05, wl = 14 + 26 * cur.wind;
      ctx.globalAlpha = Math.min(1, 0.35 + 0.5 * cur.wind);
      [0.38, 0.58, 0.78].forEach(function (f) { var x = bx(g, f); arrow(T.figInk, x + wl / 2, wy, x - wl / 2, wy, 1.6 + cur.wind); });
      ctx.globalAlpha = 1;
      windP.forEach(function (p) {
        var x = bx(g, 0.25 + p.u * 0.7), y = wy - 10 + p.v * 20;
        ctx.globalAlpha = 0.5 * Math.min(1, cur.wind); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6 + 8 * cur.wind, y); ctx.stroke(); ctx.globalAlpha = 1;
      });
      var windWord = cur.wind > 1.3 ? '무역풍 (강함)' : cur.wind < 0.6 ? '무역풍 (약함)' : '무역풍';
      tag(T, windWord, bx(g, 0.38) - wl / 2 - 8, wy + 4, T.figInk, fs, true, 'right');

      // 용승
      var ux = bx(g, 0.93), uBot = g.sea + g.D * 0.62, uTop = g.sea + 10;
      ctx.globalAlpha = Math.min(1, 0.2 + 0.6 * cur.up);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5 + 1.2 * Math.min(1.6, cur.up);
      ctx.beginPath(); ctx.moveTo(ux, uBot); ctx.lineTo(ux, uTop + 14); ctx.quadraticCurveTo(ux, uTop, ux - 18, uTop); ctx.lineTo(bx(g, 0.78), uTop); ctx.stroke();
      head(T.figBlue, bx(g, 0.78), uTop, -1, 0);
      ctx.globalAlpha = 1;
      var nUp = Math.round(upP.length * Math.min(1, cur.up / 1.6));
      for (var q = 0; q < nUp; q++) {
        var pt = upPath(g, ux, uBot, uTop, upP[q].s);
        ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(pt[0] + (upP[q].o - 0.5) * 8, pt[1], 2.2, 0, Math.PI * 2); ctx.fill();
      }
      var upWord = cur.up > 1.3 ? '용승 (강함)' : cur.up < 0.5 ? '용승 (약함)' : '용승';
      ctx.textAlign = 'right';
      tag(T, upWord, ux - 8, g.sea + g.D * 0.56, T.figBlue, fs, false, 'right');

      // 바닷속 이름표
      var lx = bx(g, 0.2), ty = thermY(g, lx);
      if (ty - g.sea > 34) tag(T, '따뜻한 표층 해수', lx, g.sea + (ty - g.sea) / 2 + 4, T.figRed, fs, true);
      tag(T, '수온 약층', bx(g, 0.5), thermY(g, bx(g, 0.5)) + 16, T.figViolet, fs, true);
      tag(T, '차가운 깊은 바닷물', bx(g, 0.45), g.bot - 10, T.figBlue, fs, true);
      // 표층 수온 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      var lgx = g.narrow ? bx(g, 0.02) : bx(g, 0.62), lgy = g.narrow ? g.bot - 28 : g.bot - 10;
      if (!g.narrow) {
        ctx.fillStyle = T.figRed; ctx.fillRect(lgx, lgy - 8, 12, 5); ctx.fillStyle = T.figMuted; ctx.fillText('수온 높음', lgx + 16, lgy - 3);
        ctx.fillStyle = T.figBlue; ctx.fillRect(lgx + 76, lgy - 8, 12, 5); ctx.fillStyle = T.figMuted; ctx.fillText('수온 낮음', lgx + 92, lgy - 3);
      }
    }
    function upPath(g, ux, uBot, uTop, s) {
      var xEnd = bx(g, 0.78), vert = uBot - uTop, horiz = ux - xEnd, tot = vert + horiz, d = s * tot;
      return d < vert ? [ux, uBot - d] : [ux - (d - vert), uTop];
    }
    function tag(T, text, x, y, col, fs, bold, align) {
      ctx.font = (bold ? '600 ' : '') + fs + 'px ' + T.fontBody; ctx.textAlign = align || 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = T.surface; ctx.strokeText(text, x, y);
      ctx.fillStyle = col; ctx.fillText(text, x, y);
    }
    function arrow(col, x0, y0, x1, y1, lw) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      var l = Math.hypot(x1 - x0, y1 - y0) || 1; head(col, x1, y1, (x1 - x0) / l, (y1 - y0) / l, 5 + lw);
    }
    function head(col, x, y, ux, uy, s) {
      s = s || 8; var nx = -uy, ny = ux;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + ux * 2, y + uy * 2); ctx.lineTo(x - ux * s + nx * s * 0.55, y - uy * s + ny * s * 0.55); ctx.lineTo(x - ux * s - nx * s * 0.55, y - uy * s - ny * s * 0.55); ctx.closePath(); ctx.fill();
    }

    if (api.reduced) loop.pause();
    api.onResize(draw);
    readouts(); draw();
  },
});
