/* 2-6 물질의 전기적 성질: 도체·부도체·반도체에서 움직일 수 있는 전하의 수와 전류(로그 눈금) 비교 */
Sims.register('conductivity', {
  title: '같은 크기의 막대, 전류는 얼마나 다를까?',
  caption: '물질을 고르고 [전압 켜기]를 눌러 막대 속에서 움직이는 전하와 전류계 바늘을 비교해 보자. 규소는 \'불순물 양\'을 늘리면 움직일 수 있는 전하가 늘어 전류가 수천 배 이상 커진다. 전류계는 한 칸이 1000배인 로그 눈금이며, 전류 값은 상온에서 같은 모양의 막대를 가정해 비저항의 대략적인 크기로 어림한 것이다. 그림 속 원자와 전하의 개수·크기는 설명을 위해 단순화했고, 불순물 종류에 따른 차이는 나타내지 않았다.',
  init: function (api) {
    // 상대 전류 = (물질의 전기 전도도) / (구리의 전기 전도도). 비저항: 구리 1.7e-8, 순수 규소 약 1e3, 유리 약 1e10 Ω·m (원고 STEP 5 값)
    var SIG_CU = 1 / 1.7e-8, SIG_SI = 1 / 1e3, SIG_GLASS = 1 / 1e10;
    var LOGMIN = -18, LOGMAX = 0;
    var mats = {
      cu: { name: '구리', kind: '도체', carriers: '아주 많음 (자유 전자)' },
      glass: { name: '유리', kind: '부도체', carriers: '거의 없음' },
      si: { name: '순수한 규소', kind: '반도체', carriers: '아주 적음' },
      dsi: { name: '불순물을 넣은 규소', kind: '반도체', carriers: '불순물 양에 따라 늘어남' },
    };
    var DOPE_LABEL = ['없음', '규소 원자 10억 개당 1개', '규소 원자 1억 개당 1개', '규소 원자 1000만 개당 1개',
      '규소 원자 100만 개당 1개', '규소 원자 10만 개당 1개', '규소 원자 1만 개당 1개'];
    var state = { mat: 'cu', level: 0, on: true, needle: LOGMIN - 1.2 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.7 : 0.44; }, label: '막대 속 전하의 움직임과 로그 눈금 전류계' });
    var ctx = cv.ctx;

    var rKind = api.readout('분류');
    var rCar = api.readout('움직일 수 있는 전하');
    var rI = api.readout('전류 (구리 = 1)');

    var g = api.group();
    var keys = ['cu', 'glass', 'si', 'dsi'];
    var btns = keys.map(function (k) {
      return api.button(mats[k].name, function () { choose(k); }, { toggle: true, pressed: k === state.mat, parent: g });
    });
    var slider = api.slider({ id: 'conductivity-dope', label: '불순물 양 (규소)', min: 0, max: 6, step: 1, value: 0,
      format: function (v) { return DOPE_LABEL[Math.round(v)]; },
      onInput: function (v) {
        state.level = Math.round(v);
        if (state.mat === 'si' || state.mat === 'dsi') { state.mat = state.level > 0 ? 'dsi' : 'si'; sync(); }
        update();
      } });
    var sw = api.button('전압 끄기', function () { state.on = !state.on; update(); }, { primary: true });

    /* ── 입자 준비 (막대 안의 0~1 좌표) ── */
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var COLS = 18, ROWS = 5;
    var glassAtoms = [];
    for (var gy = 0; gy < ROWS; gy++) for (var gx = 0; gx < COLS; gx++) {
      glassAtoms.push({ u: (gx + 0.5 + (rnd() - 0.5) * 0.7) / COLS, v: (gy + 0.5 + (rnd() - 0.5) * 0.6) / ROWS, ph: rnd() * 6.28 });
    }
    var dopeSites = [];
    var order = [];
    for (var i = 0; i < COLS * ROWS; i++) order.push(i);
    for (i = order.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
    // 이웃하지 않게 고른 불순물 자리 12개
    order.forEach(function (s) {
      if (dopeSites.length >= 12) return;
      var cx = s % COLS, cy = Math.floor(s / COLS);
      if (cx === 0 || cx === COLS - 1) return;
      if (dopeSites.some(function (d) { return Math.abs(d % COLS - cx) + Math.abs(Math.floor(d / COLS) - cy) < 3; })) return;
      dopeSites.push(s);
    });
    function makeCarrier() { return { u: rnd(), v: 0.08 + rnd() * 0.84, a: rnd() * 6.28 }; }
    var electrons = []; for (i = 0; i < 64; i++) electrons.push(makeCarrier());
    var siCarriers = []; for (i = 0; i < 12; i++) siCarriers.push(makeCarrier());

    function nCarriers() {
      if (state.mat === 'cu') return electrons.length;
      if (state.mat === 'si') return 1;
      if (state.mat === 'dsi') return state.level * 2;
      return 0;
    }
    function carriers() { return state.mat === 'cu' ? electrons : siCarriers.slice(0, nCarriers()); }

    function relCurrent() {
      if (state.mat === 'cu') return 1;
      if (state.mat === 'glass') return SIG_GLASS / SIG_CU;
      if (state.mat === 'si' || state.level === 0) return SIG_SI / SIG_CU;
      var f = Math.pow(10, state.level - 10);                      // 불순물 원자 비율
      var mu = 0.1 / (1 + Math.sqrt(f / 1e-5));                    // 많이 넣으면 이동이 조금 어려워짐(어림)
      return (SIG_SI + f * 5e28 * 1.6e-19 * mu) / SIG_CU;
    }
    function targetNeedle() { return state.on ? Math.log10(relCurrent()) : LOGMIN - 1.2; }

    var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    function pow10(n) { return '10' + String(n).split('').map(function (c) { return SUP[c]; }).join(''); }

    function choose(k) {
      state.mat = k;
      if (k === 'si') slider.set(0);
      else if (k === 'dsi' && state.level === 0) slider.set(4);
      sync(); update();
    }
    function sync() {
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', keys[i] === state.mat ? 'true' : 'false'); });
      slider.input.disabled = !(state.mat === 'si' || state.mat === 'dsi');
    }
    function update() {
      var m = mats[state.mat];
      rKind.set(m.kind);
      rCar.set(state.mat === 'dsi' ? (state.level >= 4 ? '많이 늘어남' : '늘어남') : m.carriers);
      if (!state.on) rI.set('0 (전압 꺼짐)');
      else {
        var e = Math.round(Math.log10(relCurrent()));
        rI.set(state.mat === 'cu' ? '1' : (state.mat === 'glass' ? '약 ' + pow10(e) + ' 이하' : '약 ' + pow10(e)));
      }
      sw.textContent = state.on ? '전압 끄기' : '전압 켜기';
      sw.setAttribute('aria-pressed', state.on ? 'true' : 'false');
      if (api.reduced) { state.needle = targetNeedle(); draw(); } else { loop.play(); draw(); }
    }

    /* ── 움직임 ── */
    var tAll = 0;
    var loop = api.loop(function (dt) {
      tAll += dt;
      var drift = state.on ? 0.11 : 0;
      carriers().forEach(function (p) {
        p.a += (rnd() - 0.5) * 6 * dt;
        p.u += (Math.cos(p.a) * 0.07 + drift) * dt;
        p.v += Math.sin(p.a) * 0.18 * dt;
        if (p.v < 0.06) { p.v = 0.06; p.a = -p.a; }
        if (p.v > 0.94) { p.v = 0.94; p.a = -p.a; }
        if (p.u > 1) p.u -= 1;          // 오른쪽 전극으로 나간 전하만큼 왼쪽 전극에서 들어온다(회로가 이어져 있음)
        if (p.u < 0) p.u += 1;
      });
      var tg = targetNeedle();
      state.needle += (tg - state.needle) * Math.min(1, dt * 4);
      draw();
    });

    /* ── 그리기 ── */
    function panel() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { scene: { x: 0, y: 0, w: w, h: h * 0.5 }, gauge: { x: 0, y: h * 0.5, w: w, h: h * 0.5 } }
        : { scene: { x: 0, y: 0, w: w * 0.64, h: h }, gauge: { x: w * 0.66, y: 0, w: w * 0.34, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = panel();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, P.scene); drawGauge(T, P.gauge);
    }
    function drawScene(T, r) {
      var topY = r.y + 26;
      var bx0 = r.x + 40, bx1 = r.x + r.w - 40;
      var bh = Math.min(110, Math.max(70, r.h * 0.4));
      var by0 = r.y + Math.max(70, r.h * 0.26), by1 = by0 + bh;
      var bw = bx1 - bx0;
      var X = function (u) { return bx0 + u * bw; }, Y = function (v) { return by0 + v * bh; };
      var wireCol = state.on ? T.figInk : T.figMuted;
      // 회로 도선
      ctx.strokeStyle = wireCol; ctx.lineWidth = 2;
      var lx = r.x + 16, rx = r.x + r.w - 16, my = (by0 + by1) / 2;
      var batX = r.x + r.w * 0.3, swX = r.x + r.w * 0.52, amX = r.x + r.w * 0.74;
      ctx.beginPath();
      ctx.moveTo(bx0 - 9, my); ctx.lineTo(lx, my); ctx.lineTo(lx, topY); ctx.lineTo(batX - 7, topY);
      ctx.moveTo(batX + 7, topY); ctx.lineTo(swX - 20, topY);
      ctx.moveTo(swX + 20, topY); ctx.lineTo(amX - 12, topY);
      ctx.moveTo(amX + 12, topY); ctx.lineTo(rx, topY); ctx.lineTo(rx, my); ctx.lineTo(bx1 + 9, my);
      ctx.stroke();
      // 전지: 짧은 판(−) 왼쪽, 긴 판(+) 오른쪽
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(batX - 7, topY - 8); ctx.lineTo(batX - 7, topY + 8); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(batX + 7, topY - 15); ctx.lineTo(batX + 7, topY + 15); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('−', batX - 16, topY - 6); ctx.fillText('+', batX + 17, topY - 6);
      ctx.fillText('전원', batX, topY + 30);
      // 스위치
      ctx.fillStyle = T.figInk;
      ctx.beginPath(); ctx.arc(swX - 20, topY, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(swX + 20, topY, 3, 0, 7); ctx.fill();
      ctx.strokeStyle = state.on ? T.figGreen : T.figRed; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(swX - 20, topY);
      if (state.on) ctx.lineTo(swX + 20, topY); else ctx.lineTo(swX + 16, topY - 16);
      ctx.stroke();
      ctx.fillStyle = state.on ? T.figGreen : T.figRed;
      ctx.fillText(state.on ? '스위치 켜짐' : '스위치 꺼짐', swX, topY + 30);
      // 전류계 기호
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(amX, topY, 12, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.fillText('A', amX, topY + 4);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.fillText('전류계', amX, topY + 30);

      // 막대
      var m = state.mat;
      var fillCol = m === 'cu' ? T.figSoftAmber : m === 'glass' ? T.figSoftTeal : T.figSoftViolet;
      ctx.fillStyle = fillCol; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
      ctx.fillRect(bx0, by0, bw, bh); ctx.strokeRect(bx0, by0, bw, bh);
      // 전극
      ctx.fillStyle = T.figMuted;
      ctx.fillRect(bx0 - 9, by0 - 8, 8, bh + 16); ctx.fillRect(bx1 + 1, by0 - 8, 8, bh + 16);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('(−)', bx0 - 5, by0 - 13); ctx.fillText('(+)', bx1 + 5, by0 - 13);

      ctx.save(); ctx.beginPath(); ctx.rect(bx0, by0, bw, bh); ctx.clip();
      var sx = bw / COLS, sy = bh / ROWS, ar = Math.max(3.5, Math.min(sx, sy) * 0.24);
      if (m === 'cu') {
        for (var yy = 0; yy < ROWS; yy++) for (var xx = 0; xx < COLS; xx++) {
          var ax = X((xx + 0.5) / COLS), ay = Y((yy + 0.5) / ROWS);
          ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(ax, ay, ar, 0, 7); ctx.fill(); ctx.stroke();
          plus(ax, ay, ar * 0.55, T.figAmber);
        }
      } else if (m === 'glass') {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        glassAtoms.forEach(function (a, i) {
          glassAtoms.forEach(function (b, k) {
            if (k <= i) return;
            var dx = (a.u - b.u) * bw, dy = (a.v - b.v) * bh;
            if (dx * dx + dy * dy < Math.pow(Math.max(sx, sy) * 1.25, 2)) { ctx.beginPath(); ctx.moveTo(X(a.u), Y(a.v)); ctx.lineTo(X(b.u), Y(b.v)); ctx.stroke(); }
          });
        });
        glassAtoms.forEach(function (a) {
          ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figTeal; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(X(a.u), Y(a.v), ar, 0, 7); ctx.fill(); ctx.stroke();
          // 원자에 묶인 전자: 제자리에서 조금 흔들릴 뿐
          var j = api.reduced ? 0 : Math.sin(tAll * 5 + a.ph) * 1.2;
          ctx.fillStyle = T.figMuted;
          ctx.beginPath(); ctx.arc(X(a.u) + ar + 2.5 + j, Y(a.v) - ar * 0.4, 1.8, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(X(a.u) - ar - 2.5 - j, Y(a.v) + ar * 0.4, 1.8, 0, 7); ctx.fill();
        });
      } else {
        // 규소 결정: 이웃 원자와 전자쌍을 공유(결합선 위의 점 2개)
        var nd = m === 'dsi' ? state.level * 2 : 0;
        var dset = {}; dopeSites.slice(0, nd).forEach(function (s) { dset[s] = true; });
        ctx.lineWidth = 1;
        for (yy = 0; yy < ROWS; yy++) for (xx = 0; xx < COLS; xx++) {
          ax = X((xx + 0.5) / COLS); ay = Y((yy + 0.5) / ROWS);
          ctx.strokeStyle = T.figLine;
          if (xx < COLS - 1) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + sx, ay); ctx.stroke(); pair(ax + sx / 2, ay, true, T); }
          if (yy < ROWS - 1) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + sy); ctx.stroke(); pair(ax, ay + sy / 2, false, T); }
        }
        for (yy = 0; yy < ROWS; yy++) for (xx = 0; xx < COLS; xx++) {
          ax = X((xx + 0.5) / COLS); ay = Y((yy + 0.5) / ROWS);
          var dop = dset[yy * COLS + xx];
          ctx.fillStyle = dop ? T.figAmber : T.figPanel; ctx.strokeStyle = dop ? T.figAmber : T.figViolet; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(ax, ay, ar, 0, 7); ctx.fill(); ctx.stroke();
        }
      }
      // 움직일 수 있는 전하
      carriers().forEach(function (p) {
        var px = X(p.u), py = Y(p.v);
        ctx.fillStyle = T.figBlue;
        ctx.beginPath(); ctx.arc(px, py, m === 'cu' ? 3 : 4.2, 0, 7); ctx.fill();
        if (m !== 'cu') { ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1; ctx.stroke(); }
        if (state.on && (api.reduced || !loop.playing) && m !== 'cu') arrow(px + 6, py, px + 16, py, T.figBlue);
      });
      ctx.restore();

      // 아래쪽 설명
      var ly = by1 + 26;
      ctx.textAlign = 'center'; ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk;
      var nm = mats[m].name + ' 막대';
      ctx.fillText(nm, (bx0 + bx1) / 2, ly);
      ly += 20;
      ctx.font = '12px ' + T.fontBody;
      var has = nCarriers() > 0;
      if (state.on && has) {
        ctx.fillStyle = T.figBlue;
        var mid = (bx0 + bx1) / 2;
        var txt = m === 'cu' ? '자유 전자가 (+)극 쪽으로 이동' : '움직일 수 있는 전하가 이동';
        ctx.fillText(txt, mid, ly);
        arrow(mid - 70, ly + 10, mid + 70, ly + 10, T.figBlue);
      } else if (state.on) {
        ctx.fillStyle = T.figRed; ctx.fillText('전자가 묶여 있어 거의 이동하지 않음', (bx0 + bx1) / 2, ly);
      } else {
        ctx.fillStyle = T.figMuted; ctx.fillText('전압이 없으면 한쪽으로 흐르지 않음', (bx0 + bx1) / 2, ly);
      }
      // 범례
      ly += 30;
      if (ly + 6 < r.y + r.h) {
        var items = [];
        if (m === 'cu') items = [[T.figBlue, '자유 전자', 3], [T.figAmber, '구리 원자(양이온)', -1]];
        else if (m === 'glass') items = [[T.figMuted, '묶인 전자', 2], [T.figTeal, '유리를 이루는 원자', -1]];
        else items = [[T.figBlue, '움직일 수 있는 전하', 4], [T.figViolet, '규소 원자', -1]].concat(m === 'dsi' ? [[T.figAmber, '불순물 원자', -2]] : []);
        ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        var widths = items.map(function (it) { return ctx.measureText(it[1]).width + 30; });
        var tot = widths.reduce(function (a, b) { return a + b; }, 0);
        var x = Math.max(r.x + 4, (bx0 + bx1) / 2 - tot / 2);
        items.forEach(function (it, i) {
          if (it[2] > 0) { ctx.fillStyle = it[0]; ctx.beginPath(); ctx.arc(x + 6, ly - 4, it[2], 0, 7); ctx.fill(); }
          else { ctx.fillStyle = it[2] === -2 ? T.figAmber : T.figPanel; ctx.strokeStyle = it[0]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + 6, ly - 4, 5, 0, 7); ctx.fill(); ctx.stroke(); }
          ctx.fillStyle = T.figMuted; ctx.fillText(it[1], x + 16, ly);
          x += widths[i];
        });
      }
      ctx.textAlign = 'center';
    }
    function pair(x, y, horiz, T) {
      ctx.fillStyle = T.figMuted;
      var o = 2.2;
      ctx.beginPath(); ctx.arc(horiz ? x : x - o, horiz ? y - o : y, 1.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(horiz ? x : x + o, horiz ? y + o : y, 1.4, 0, 7); ctx.fill();
    }
    function plus(x, y, s, col) {
      ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    }
    function arrow(x0, y0, x1, y1, col) {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - 5, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 7, y1 - 4); ctx.lineTo(x1 - 7, y1 + 4); ctx.closePath(); ctx.fill();
    }

    function drawGauge(T, r) {
      var A0 = 215 * Math.PI / 180, A1 = -35 * Math.PI / 180;      // 0(꺼짐) 위치 ~ 10⁰
      var SPAN0 = LOGMIN - 1.2;
      var ang = function (lg) { return A0 + (Math.max(SPAN0, Math.min(LOGMAX, lg)) - SPAN0) / (LOGMAX - SPAN0) * (A1 - A0); };
      var R = Math.max(50, Math.min(100, r.w / 2 - 36, (r.h - 92) / 2));
      var cx = r.x + r.w / 2, cy = r.y + 28 + 30 + R;
      var P = function (a, rr) { return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)]; };
      // 판
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, R + 31, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('전류계 (로그 눈금)', cx, r.y + 16);
      // 눈금 호
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, -ang(SPAN0), -ang(LOGMAX), false); ctx.stroke();
      for (var e = LOGMIN; e <= LOGMAX; e++) {
        var a = ang(e), major = e % 3 === 0;
        var p0 = P(a, R), p1 = P(a, R - (major ? 10 : 5));
        ctx.strokeStyle = T.figInk; ctx.lineWidth = major ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
        if (major && (e % 6 === 0 || R > 70)) {
          var pt = P(a, R + 17);
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
          ctx.fillText(pow10(e), pt[0], pt[1] + 4);
        }
      }
      var pz = P(ang(SPAN0), R + 15);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.fillText('0', pz[0], pz[1] + 4);
      // 바늘
      var an = ang(state.needle), tip = P(an, R - 4);
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill();
      // 설명
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      var by = cy + R * 0.6 + 24;
      ctx.fillText('구리를 1로 한 전류', cx, by);
      ctx.fillText('큰 눈금 한 칸 = 1000배', cx, by + 17);
    }

    api.onResize(draw);
    sync(); update();
  },
});
