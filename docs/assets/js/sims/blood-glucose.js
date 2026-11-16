/* 생명과학 2 혈당 조절: 인슐린·글루카곤과 간의 글리코젠 합성·분해로 이루어지는 음성 피드백(정성적 모형) */
Sims.register('blood-glucose', {
  title: '식사와 운동에 따른 혈당 조절',
  caption: '"식사하기"를 누르면 소화관에서 흡수된 포도당으로 혈당이 오르고, 이자의 β세포가 인슐린을 분비해 간의 글리코젠 합성과 조직 세포의 포도당 흡수를 늘려 혈당을 낮춘다. "운동하기"를 누르면 근육의 포도당 소비가 늘어 혈당이 내려가고, α세포가 글루카곤을 분비해 간의 글리코젠 분해를 늘려 혈당을 올린다. 결과가 원인을 억제하는 음성 피드백으로 혈당이 정상 범위 근처로 돌아온다. 수치와 곡선은 원리를 보이기 위한 정성적 모형이며, 신경(자율 신경)과 에피네프린의 작용은 생략했다.',
  init: function (api) {
    var SET = 90, WIN = 240, SPEED = 8;   // 기준 혈당(mg/dL), 그래프 폭(분), 화면 1초당 8분
    var s, hist, events;
    function reset() {
      s = { t: 0, G: SET, gut: 0, I: 0, C: 0, ex: 0, L: 50, ab: 0, syn: 0, rel: 1, up: 1 };
      hist = [{ t: 0, G: SET, I: 0, C: 0 }]; events = [];
    }
    function step(dt) {
      var ab = s.gut / 25; s.gut -= ab * dt;
      var It = Math.max(0, s.G - SET) * 0.06, Ct = Math.max(0, SET - s.G) * 0.15;
      s.I += (It - s.I) / 6 * dt; s.C += (Ct - s.C) / 6 * dt;
      var E = s.ex > 0 ? 1 : 0;
      var syn = 0.5 * s.I, rel = 1 + 1.5 * s.C, up = (1 + 0.3 * s.I + 1.8 * E) * (s.G / SET);
      s.G += (ab + rel - syn - up) * dt;
      s.L = Math.max(5, Math.min(95, s.L + (syn - 1.5 * s.C) * dt * 0.4));
      s.ex = Math.max(0, s.ex - dt);
      s.ab = ab; s.syn = syn; s.rel = rel; s.up = up;
      s.t += dt;
      if (s.t - hist[hist.length - 1].t >= 1) hist.push({ t: s.t, G: s.G, I: s.I, C: s.C });
      if (hist.length > 2000) hist.shift();
    }
    var acc = 0;
    function advance(min) { acc += min; while (acc >= 0.25) { step(0.25); acc -= 0.25; } }
    function steady() { return s.gut < 0.3 && s.ex <= 0 && Math.abs(s.G - SET) < 0.4 && s.I < 0.03 && s.C < 0.03; }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.5 : 0.58; }, label: '혈당 조절 흐름도와 혈당·호르몬 그래프' });
    var ctx = cv.ctx;
    var rG = api.readout('혈당량'), rI = api.readout('인슐린 분비'), rC = api.readout('글루카곤 분비'), rL = api.readout('간');
    api.button('식사하기', function () { s.gut += 120; events.push({ t: s.t, k: '식사' }); go(); }, { primary: true });
    api.button('운동하기(30분)', function () { s.ex = 30; events.push({ t: s.t, k: '운동', end: s.t + 30 }); go(); });
    api.button('처음부터', function () { loop.pause(); reset(); update(); });
    function go() {
      if (api.reduced) { advance(150); update(); return; }
      loop.play();
    }
    var loop = api.loop(function (dt) {
      advance(dt * SPEED);
      update();
      if (steady()) loop.pause();
    });
    loop.pause();

    function lvl(x, a, b) { return x < a ? '거의 없음' : x < b ? '조금 ↑' : '많이 ↑'; }
    function update() {
      rG.set(s.G.toFixed(0) + ' mg/dL');
      rI.set(lvl(s.I, 0.08, 0.8)); rC.set(lvl(s.C, 0.08, 0.6));
      rL.set(s.syn > s.rel - 1 + 0.05 && s.I > 0.08 ? '글리코젠 합성' : s.C > 0.08 ? '글리코젠 분해' : '거의 변화 없음');
      draw();
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { d: { x: 0, y: 0, w: w, h: h * 0.47 }, g: { x: 0, y: h * 0.5, w: w, h: h * 0.5 } };
      return { d: { x: 0, y: 0, w: w * 0.45, h: h }, g: { x: w * 0.48, y: 0, w: w * 0.52, h: h } };
    }
    function draw() {
      var T = api.tokens(); ctx.clearRect(0, 0, cv.w, cv.h);
      var L = layout(); drawFlow(T, L.d); drawGraph(T, L.g);
    }
    function box(T, cx, cy, w, h, fill, stroke, lines, bold) {
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = bold ? 2.4 : 1.5;
      rr(cx - w / 2, cy - h / 2, w, h, 8); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center';
      lines.forEach(function (ln, i) {
        ctx.fillStyle = i === 0 ? T.figInk : T.figMuted; ctx.font = (i === 0 ? '700 12px ' : '11px ') + T.fontBody;
        ctx.fillText(ln, cx, cy - (lines.length - 1) * 7 + i * 14 + 4);
      });
    }
    function arr(T, x1, y1, x2, y2, col, w, dash) {
      if (w <= 0.2) return;
      var a = Math.atan2(y2 - y1, x2 - x1), hl = 7 + w * 1.5;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - hl * Math.cos(a), y2 - hl * Math.sin(a)); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hl * Math.cos(a) + (hl * 0.55) * Math.sin(a), y2 - hl * Math.sin(a) - (hl * 0.55) * Math.cos(a));
      ctx.lineTo(x2 - hl * Math.cos(a) - (hl * 0.55) * Math.sin(a), y2 - hl * Math.sin(a) + (hl * 0.55) * Math.cos(a));
      ctx.closePath(); ctx.fill();
    }
    function tag(T, txt, x, y, col, align) { ctx.fillStyle = col; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = align || 'center'; ctx.fillText(txt, x, y); }
    function drawFlow(T, r) {
      var W = r.w, H = r.h - 22, x = function (f) { return r.x + f * W; }, y = function (f) { return r.y + 6 + f * H; };
      var bw = Math.min(124, W * 0.34), bh = 54;
      var high = s.G > 100, low = s.G < 80;
      var gCol = high ? T.figRed : low ? T.figBlue : T.figGreen;
      var LV = [x(0.18), y(0.12)], PA = [x(0.82), y(0.12)], BL = [x(0.5), y(0.5)], GU = [x(0.18), y(0.86)], TI = [x(0.82), y(0.86)];
      // 상자
      box(T, LV[0], LV[1], bw, bh, T.figPanel, T.figLine, ['간', '', ''], false);
      var gx = LV[0] - bw / 2 + 12, gw = bw - 24, gy = LV[1] + 4;
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('글리코젠', gx, gy);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(gx, gy + 5, gw, 9);
      ctx.fillStyle = T.figViolet; ctx.fillRect(gx, gy + 5, gw * s.L / 100, 9);
      box(T, PA[0], PA[1], bw, bh, T.figPanel, T.figLine, ['이자', 'β세포: 인슐린', 'α세포: 글루카곤'], false);
      box(T, GU[0], GU[1], bw, bh - 12, T.figPanel, s.ab > 0.3 ? T.figAmber : T.figLine, ['소화관', '포도당 흡수'], s.ab > 0.3);
      box(T, TI[0], TI[1], bw, bh, T.figPanel, s.ex > 0 ? T.figAmber : T.figLine, ['조직 세포·근육', '포도당 흡수·소비', s.ex > 0 ? '운동 중' : ''], s.ex > 0);
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = gCol; ctx.lineWidth = 2.6;
      rr(BL[0] - bw / 2 - 4, BL[1] - 26, bw + 8, 52, 26); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = T.figInk; ctx.font = '700 12px ' + T.fontBody; ctx.fillText('혈액 속 포도당', BL[0], BL[1] - 7);
      ctx.fillStyle = gCol; ctx.font = '700 15px ' + T.fontMono; ctx.fillText(s.G.toFixed(0) + ' mg/dL', BL[0], BL[1] + 14);
      var bx0 = BL[0] - bw / 2 + 6, bx1 = BL[0] + bw / 2 - 6;
      // 소화관 → 혈액
      arr(T, GU[0] + 10, GU[1] - bh / 2 + 4, bx0 + 6, BL[1] + 28, T.figAmber, Math.min(6, s.ab * 1.6));
      // 혈액 → 조직
      arr(T, bx1 - 6, BL[1] + 28, TI[0] - 10, TI[1] - bh / 2 - 4, T.figGreen, Math.min(6, s.up * 1.2));
      // 혈당 감지
      arr(T, bx1 - 4, BL[1] - 28, PA[0] - 12, PA[1] + bh / 2 + 4, T.figMuted, 1.3, true);
      tag(T, '혈당 감지', (bx1 + PA[0]) / 2 + 12, (BL[1] + PA[1]) / 2 + 22, T.figMuted, 'left');
      // 호르몬: 이자 → 간(위쪽 가로), 이자 → 조직(인슐린, 오른쪽 세로)
      var iw = Math.min(5, s.I * 2.2), cw = Math.min(5, s.C * 4);
      var ax0 = PA[0] - bw / 2 - 2, ax1 = LV[0] + bw / 2 + 2, mx = (ax0 + ax1) / 2;
      if (iw > 0.3) {
        arr(T, ax0, PA[1] - 8, ax1, LV[1] - 8, T.figBlue, iw);
        tag(T, '인슐린', mx, PA[1] - 15, T.figBlue);
        arr(T, PA[0] + bw / 2 - 14, PA[1] + bh / 2 + 2, TI[0] + bw / 2 - 14, TI[1] - bh / 2 - 4, T.figBlue, iw);
        tag(T, '인슐린', TI[0] + bw / 2 - 20, (PA[1] + TI[1]) / 2, T.figBlue, 'right');
      }
      if (cw > 0.3) {
        arr(T, ax0, PA[1] + 10, ax1, LV[1] + 10, T.figRed, cw);
        tag(T, '글루카곤', mx, PA[1] + 28, T.figRed);
      }
      // 간 ↔ 혈액
      var net = s.syn - (s.rel - 1);
      var lx = LV[0] - 6, ly = LV[1] + bh / 2 + 4, px = bx0 + 8, py = BL[1] - 28;
      if (s.I > 0.08 && net > 0.05) {
        arr(T, px, py, lx, ly, T.figViolet, Math.min(5, net * 3));
        tag(T, '포도당 → 글리코젠', lx - bw / 2 + 6, (ly + py) / 2 + 4, T.figViolet, 'left');
      } else if (s.C > 0.08) {
        arr(T, lx, ly, px, py, T.figViolet, Math.min(5, s.C * 4));
        tag(T, '글리코젠 → 포도당', lx - bw / 2 + 6, (ly + py) / 2 + 4, T.figViolet, 'left');
      }
      var msg = high ? '혈당 높음 → 인슐린 ↑ → 혈당이 내려간다' : low ? '혈당 낮음 → 글루카곤 ↑ → 혈당이 올라간다' : '정상 범위 근처 — 분비가 줄어든다(음성 피드백)';
      ctx.fillStyle = gCol; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(msg, x(0.5), r.y + r.h - 4);
    }
    function drawGraph(T, r) {
      var Lx = r.x + 44, R = r.x + r.w - 10, top = r.y + 22, gB = r.y + r.h * 0.66, hT = gB + 30, hB = r.y + r.h - 22;
      var tEnd = Math.max(WIN, s.t), tStart = tEnd - WIN;
      var sx = function (t) { return Lx + (t - tStart) / WIN * (R - Lx); };
      var gy = function (g) { return gB - (g - 50) / 130 * (gB - top); };
      // 정상 범위 띠
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(Lx, gy(100), R - Lx, gy(70) - gy(100));
      ctx.fillStyle = T.figGreen; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('공복 정상 범위 70~100', R - 4, gy(70) - 4);
      // 운동 구간
      events.forEach(function (e) {
        if (e.k === '운동') { var a = Math.max(sx(e.t), Lx), b = Math.min(sx(e.end), R); if (b > a) { ctx.fillStyle = T.figSoftAmber; ctx.globalAlpha = 0.7; ctx.fillRect(a, top, b - a, gB - top); ctx.globalAlpha = 1; } }
      });
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [60, 100, 140, 180].forEach(function (g) { ctx.beginPath(); ctx.moveTo(Lx, gy(g)); ctx.lineTo(R, gy(g)); ctx.stroke(); ctx.fillText(g, Lx - 5, gy(g) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('혈당량 (mg/dL)', Lx, r.y + 12);
      // 혈당 곡선
      var pts = hist.filter(function (h) { return h.t >= tStart; });
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.6; ctx.beginPath();
      pts.forEach(function (h, i) { var X = sx(h.t), Y = gy(Math.max(50, Math.min(180, h.G))); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.lineTo(sx(s.t), gy(s.G)); ctx.stroke();
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(sx(s.t), gy(s.G), 4, 0, 7); ctx.fill();
      // 사건 표시
      events.forEach(function (e) {
        if (e.t < tStart) return;
        ctx.strokeStyle = T.figMuted; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(sx(e.t), top); ctx.lineTo(sx(e.t), hB); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(e.k, sx(e.t) + 3, top + 11);
      });
      // 호르몬 그래프
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('호르몬 분비량 (상대값)', Lx, hT - 8);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Lx, hB); ctx.lineTo(R, hB); ctx.moveTo(Lx, hT); ctx.lineTo(Lx, hB); ctx.stroke();
      var hy = function (v) { return hB - Math.min(1, v) * (hB - hT - 4); };
      [['I', 1 / 2.5, T.figBlue, '인슐린'], ['C', 1 / 1.4, T.figRed, '글루카곤']].forEach(function (c, k) {
        ctx.strokeStyle = c[2]; ctx.lineWidth = 2; ctx.beginPath();
        pts.forEach(function (h, i) { var X = sx(h.t), Y = hy(h[c[0]] * c[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.stroke();
        ctx.fillStyle = c[2]; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText(c[3], R - (k ? 0 : 60), hT - 8);
      });
      // 시간 축
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      for (var m = Math.ceil(tStart / 60) * 60; m <= tEnd; m += 60) ctx.fillText((m / 60) + '시간', sx(m), hB + 14);
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    api.onResize(draw);
    // 첫 화면: 식사 40분 뒤(혈당이 높고 인슐린이 분비되는 순간)를 그려 두고, 화면에 보이면 이어서 진행한다
    reset(); advance(15); s.gut += 120; events.push({ t: s.t, k: '식사' }); advance(40); update();
    if (!api.reduced) loop.play();
  },
});
