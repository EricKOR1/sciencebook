/* 3-5 효소: 활성화 에너지를 낮춘다(반응 전후 에너지 차이는 그대로), 기질 특이성, 온도와 변성 */
Sims.register('enzyme', {
  title: '효소가 하는 일 — 낮아진 고개, 꼭 맞는 짝, 알맞은 온도',
  caption: '‘효소 있음’을 누르면 반응이 넘어야 할 고개(활성화 에너지)는 낮아지지만, 반응물과 생성물의 높이 차이(반응 전후 에너지 차이)는 그대로이다. 효소는 활성 부위에 모양이 맞는 기질과만 결합하고, 반응 뒤에도 변하지 않는다. 온도를 올리면 반응 속도가 빨라지다가 사람 효소의 최적 온도(약 35~40 °C)를 넘으면 단백질 구조가 변해(변성) 급격히 느려진다. 그래프와 모양은 정성적인 모식도이며, 온도 그래프는 각 온도에서 새 효소로 잰 결과를 나타낸다.',
  init: function (api) {
    var st = { enz: true, temp: 37, dead: false, u: 0.45 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.9 : 0.64; }, label: '반응 진행에 따른 에너지 그래프, 효소와 기질의 결합, 온도에 따른 반응 속도 그래프' });
    var ctx = cv.ctx;

    var rEa = api.readout('활성화 에너지');
    var rDiff = api.readout('반응 전후 에너지 차이');
    var rRate = api.readout('반응 속도(최대 = 100)');
    var rState = api.readout('효소 상태');

    var g = api.group();
    var bOff = api.button('효소 없음', function () { setEnz(false); }, { toggle: true, parent: g });
    var bOn = api.button('효소 있음', function () { setEnz(true); }, { toggle: true, pressed: true, parent: g });
    api.slider({ id: 'enzyme-temp', label: '온도', min: 0, max: 70, step: 1, value: st.temp,
      format: function (v) { return v + ' °C'; },
      onInput: function (v) { st.temp = v; if (v >= 50) st.dead = true; update(); } });
    var bNew = api.button('새 효소 넣기', function () { st.dead = false; update(); });

    function setEnz(on) {
      st.enz = on; bOn.setAttribute('aria-pressed', on ? 'true' : 'false'); bOff.setAttribute('aria-pressed', on ? 'false' : 'true');
      update();
    }
    /* 온도에 따른 상대 반응 속도(정성적 모형): 입자 운동 증가 × 변성되지 않은 효소의 비율 */
    function intact(T) { return 1 / (1 + Math.exp((T - 43.5) / 2.2)); }
    function rawRate(T) { return Math.exp(0.05 * (T - 37)) * intact(T); }
    var RMAX = 0; for (var t = 0; t <= 70; t += 0.1) RMAX = Math.max(RMAX, rawRate(t));
    function freshRate(T) { return rawRate(T) / RMAX; }
    function noEnzRate(T) { return 0.004 * Math.exp(0.05 * (T - 37)); }
    function deform() { return st.dead ? 1 : 1 - intact(st.temp); }
    function curRate() { if (!st.enz) return noEnzRate(st.temp); return st.dead ? 0 : freshRate(st.temp); }
    function works() { return st.enz && deform() < 0.85; }

    function update() {
      bNew.disabled = !st.dead;
      rEa.set(works() ? '낮다' : '높다');
      rDiff.set('변하지 않음');
      var r = curRate() * 100;
      rRate.set(r < 1 && r > 0 ? '1 미만' : Math.round(r).toString());
      var s;
      if (!st.enz) s = '없음';
      else if (st.dead) s = st.temp >= 50 ? '변성됨' : '변성됨(식혀도 회복 안 됨)';
      else if (deform() >= 0.85) s = '대부분 변성됨';
      else if (deform() >= 0.4) s = '일부 변성되는 중';
      else if (st.temp < 30) s = '정상(온도가 낮아 느림)';
      else s = '정상';
      rState.set(s);
      if (api.reduced) draw();
    }

    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;   // 첫 프레임의 dt가 0 이하일 수 있음
      var sp = works() ? Math.max(0.12, curRate()) : 0.5;
      if (!st.enz) sp = 0.35;
      st.u = (st.u + dt * sp / 7) % 1;
      draw();
    });

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { e: { x: 0, y: 0, w: w, h: h * 0.37 }, s: { x: 0, y: h * 0.38, w: w, h: h * 0.27 }, t: { x: 0, y: h * 0.66, w: w, h: h * 0.34 } };
      return { e: { x: 0, y: 0, w: w * 0.52, h: h }, s: { x: w * 0.55, y: 0, w: w * 0.45, h: h * 0.47 }, t: { x: w * 0.55, y: h * 0.5, w: w * 0.45, h: h * 0.5 } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawEnergy(T, L.e); drawSpec(T, L.s); drawTemp(T, L.t);
    }
    function arrowHead(x, y, ang, color, size) {
      size = size || 8; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(ang - 0.45) * size, y - Math.sin(ang - 0.45) * size);
      ctx.lineTo(x - Math.cos(ang + 0.45) * size, y - Math.sin(ang + 0.45) * size); ctx.closePath(); ctx.fill();
    }
    function vArrow(x, y1, y2, color, both) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
      arrowHead(x, y2, y2 > y1 ? Math.PI / 2 : -Math.PI / 2, color);
      if (both) arrowHead(x, y1, y2 > y1 ? -Math.PI / 2 : Math.PI / 2, color);
    }
    function title(T, r, text) {
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, r.x + 4, r.y + 16);
    }

    /* ① 반응 진행에 따른 에너지 */
    var ER = 0.55, EP = 0.18, TOP0 = 0.95, TOP1 = 0.7;
    function energy(x, top) {
      var s = 1 / (1 + Math.exp(-(x - 0.5) / 0.07));
      var base = ER + (EP - ER) * s, b = top - (ER + EP) / 2;
      return base + b * Math.exp(-Math.pow((x - 0.5) / 0.13, 2));
    }
    function drawEnergy(T, r) {
      title(T, r, '① 반응 진행에 따른 에너지');
      var L = r.x + 30, R = r.x + r.w - 10, Tp = r.y + 34, B = r.y + r.h - 30;
      var sx = function (x) { return L + x * (R - L); }, sy = function (e) { return B - e * (B - Tp); };
      // 축
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, Tp - 6); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      arrowHead(L, Tp - 8, -Math.PI / 2, T.figInk, 7); arrowHead(R + 2, B, 0, T.figInk, 7);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('반응 진행 →', (L + R) / 2, B + 18);
      ctx.save(); ctx.translate(r.x + 14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('에너지', 0, 0); ctx.restore();
      // 반응물 높이 기준선
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(0.05), sy(ER)); ctx.lineTo(sx(0.97), sy(ER)); ctx.stroke(); ctx.setLineDash([]);
      var good = works();
      function curve(top, color, lw, dash) {
        ctx.beginPath();
        for (var i = 0; i <= 120; i++) { var x = 0.02 + 0.96 * i / 120; var X = sx(x), Y = sy(energy(x, top)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
      }
      curve(TOP0, good ? T.figLine : T.figRed, good ? 1.5 : 3, good ? [6, 4] : null);
      if (good) curve(TOP1, T.figGreen, 3);
      // 반응물·생성물
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('반응물', sx(0.03), sy(ER) - 7);
      ctx.textAlign = 'right'; ctx.fillText('생성물', sx(0.98), sy(EP) - 7);
      // 활성화 에너지 화살표
      var narrowE = r.w < 330;
      vArrow(sx(0.45), sy(ER), sy(TOP0) + 2, good ? T.figMuted : T.figRed);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = good ? T.figMuted : T.figRed;
      ctx.fillText('활성화 에너지', sx(0.43), sy((ER + TOP0) / 2) - 2);
      ctx.fillText(good ? '(효소 없음)' : '(높다)', sx(0.43), sy((ER + TOP0) / 2) + 13);
      if (good) {
        vArrow(sx(0.55), sy(ER), sy(TOP1) + 2, T.figGreen);
        ctx.textAlign = 'left'; ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText('활성화 에너지', sx(0.57), sy(TOP1) + 4);
        ctx.fillText('(효소 있음, 낮다)', sx(0.57), sy(TOP1) + 19);
      }
      // 반응 전후 에너지 차이
      var dx = sx(0.86);
      vArrow(dx, sy(ER), sy(EP) - 1, T.figBlue, true);
      ctx.fillStyle = T.figBlue; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      var ly = sy((ER + EP) / 2);
      ctx.fillText('반응 전후', dx - 6, ly - 4);
      ctx.fillText('에너지 차이', dx - 6, ly + 11);
      ctx.fillText(narrowE ? '(같다)' : '(효소와 관계없이 같다)', dx - 6, ly + 26);
      if (st.enz && !good) {
        ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('변성된 효소는 고개를 낮추지 못한다', L + 6, Tp + 2);
      }
    }

    /* ② 기질 특이성 */
    function drawSpec(T, r) {
      title(T, r, '② 활성 부위에 맞는 기질만 결합');
      var cx = r.x + r.w / 2, base = r.y + r.h - 12;
      var ex = cx, ey = base - 38;        // 효소 중심
      var notchY = ey - 30;               // 활성 부위 입구 높이
      var u = st.u, d = Math.min(1, deform() / 0.85), hasE = st.enz, fits = works();
      var homeSq = { x: r.x + r.w * 0.16, y: r.y + 44 }, homeCi = { x: r.x + r.w * 0.84, y: r.y + 44 }, homeTr = { x: cx, y: r.y + 40 };
      function lerp(a, b, k) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
      function ease(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
      function visit(home, t0, t1, stopY) {   // 다가왔다가 맞지 않아 돌아감
        if (!hasE || u < t0 || u > t1) return home;
        var k = (u - t0) / (t1 - t0), tgt = { x: ex, y: stopY };
        return k < 0.5 ? lerp(home, tgt, ease(k * 2)) : lerp(tgt, home, ease((k - 0.5) * 2));
      }
      // 효소
      if (hasE) {
        ctx.beginPath();
        var w2 = 64, hh = 30, nw = 18 + d * 8, nd = 24 - d * 12;
        ctx.moveTo(ex - w2, ey - hh + 10);
        ctx.quadraticCurveTo(ex - w2, ey - hh, ex - w2 + 12, ey - hh);
        ctx.lineTo(ex - nw - d * 6, ey - hh);
        if (d < 1) { ctx.lineTo(ex, ey - hh + nd); ctx.lineTo(ex + nw, ey - hh); }
        else { ctx.quadraticCurveTo(ex - 10, ey - hh + nd * 1.6, ex + 2, ey - hh + 4); ctx.quadraticCurveTo(ex + 12, ey - hh + nd * 1.8, ex + nw + 4, ey - hh - 4); }
        ctx.lineTo(ex + w2 - 12, ey - hh);
        ctx.quadraticCurveTo(ex + w2, ey - hh, ex + w2, ey - hh + 10);
        ctx.quadraticCurveTo(ex + w2 + 6 * d, ey + hh, ex, ey + hh + 4 * d);
        ctx.quadraticCurveTo(ex - w2 - 4 * d, ey + hh, ex - w2, ey - hh + 10);
        ctx.closePath();
        ctx.fillStyle = d < 1 ? T.figSoftTeal : T.figSoftRed; ctx.fill();
        ctx.strokeStyle = d < 1 ? T.figTeal : T.figRed; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = d < 1 ? T.figTeal : T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(d < 1 ? '효소' : '변성된 효소', ex, ey + 12);
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
        ctx.fillText(d < 1 ? '← 활성 부위' : '← 모양이 바뀐 활성 부위', ex + 26, ey - hh + 6);
      } else {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('효소가 없으면 체온에서', cx, ey - 2);
        ctx.fillText('이 반응은 매우 느리다', cx, ey + 14);
      }
      // 맞지 않는 물질(사각형, 원)
      var sq = visit(homeSq, 0.02, 0.22, notchY - 22);
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(sq.x - 12, sq.y - 12, 24, 24); ctx.fill(); ctx.stroke();
      var ci = visit(homeCi, 0.78, 0.98, notchY - 22);
      ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet;
      ctx.beginPath(); ctx.arc(ci.x, ci.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      if (sq.y < homeSq.y + 4) ctx.fillText('맞지 않는 물질', homeSq.x, homeSq.y + 26);
      if (ci.y < homeCi.y + 4) ctx.fillText('맞지 않는 물질', homeCi.x, homeCi.y + 26);
      // 기질(역삼각형): 다가옴 → 결합 → 둘로 나뉨 → 생성물이 떠남
      var bound = { x: ex, y: notchY + 9 };
      var phase, k;
      if (!hasE || u < 0.26 || u > 0.76) phase = 'home';
      else if (!fits) { phase = 'bounce'; k = (u - 0.26) / 0.5; }
      else if (u < 0.38) { phase = 'come'; k = (u - 0.26) / 0.12; }
      else if (u < 0.52) phase = 'bound';
      else if (u < 0.58) { phase = 'split'; k = (u - 0.52) / 0.06; }
      else { phase = 'leave'; k = (u - 0.58) / 0.18; }
      function tri(x, y, part, alpha) {
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.beginPath();
        if (part === 0) { ctx.moveTo(x - 17, y - 12); ctx.lineTo(x + 17, y - 12); ctx.lineTo(x, y + 13); }
        else if (part === 1) { ctx.moveTo(x - 17, y - 12); ctx.lineTo(x, y - 12); ctx.lineTo(x, y + 13); }
        else { ctx.moveTo(x, y - 12); ctx.lineTo(x + 17, y - 12); ctx.lineTo(x, y + 13); }
        ctx.closePath(); ctx.fillStyle = T.figSoftGreen; ctx.fill(); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      if (phase === 'home') {
        tri(homeTr.x, homeTr.y, 0); ctx.fillStyle = T.figGreen; ctx.fillText('기질', homeTr.x, homeTr.y - 16);
      } else if (phase === 'bounce') {
        var stop = { x: ex, y: notchY - 20 }, p2 = k < 0.5 ? lerp(homeTr, stop, ease(k * 2)) : lerp(stop, homeTr, ease((k - 0.5) * 2));
        tri(p2.x, p2.y, 0);
      } else if (phase === 'come') {
        var p = lerp(homeTr, bound, ease(k)); tri(p.x, p.y, 0);
      } else if (phase === 'bound') {
        tri(bound.x, bound.y, 0);
        ctx.fillStyle = T.figGreen; ctx.font = '600 11px ' + T.fontBody;
        ctx.fillText('효소·기질 복합체', ex, homeTr.y - 4);
      } else if (phase === 'split') {
        tri(bound.x - 3 * k, bound.y, 1); tri(bound.x + 3 * k, bound.y, 2);
      } else {
        var e2 = ease(k), fade = 1 - Math.max(0, (k - 0.7) / 0.3);
        tri(bound.x - 3 - e2 * r.w * 0.2, bound.y - e2 * 46, 1, fade);
        tri(bound.x + 3 + e2 * r.w * 0.2, bound.y - e2 * 46, 2, fade);
        ctx.fillStyle = T.figGreen; ctx.globalAlpha = fade;
        ctx.fillText('생성물', ex, bound.y - 30 - e2 * 10); ctx.globalAlpha = 1;
        tri(homeTr.x, homeTr.y, 0, Math.max(0, (k - 0.6) / 0.4));
      }
      if (st.enz && !fits && (phase === 'home' || phase === 'bounce')) {
        ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('기질도 더 이상 맞지 않는다', cx, base + 2);
      }
    }

    /* ③ 온도와 반응 속도 */
    function drawTemp(T, r) {
      title(T, r, '③ 온도에 따른 반응 속도');
      var L = r.x + 30, R = r.x + r.w - 12, Tp = r.y + 30, B = r.y + r.h - 32;
      var sx = function (t) { return L + t / 70 * (R - L); }, sy = function (v) { return B - v * (B - Tp); };
      // 최적 온도 영역
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(sx(35), Tp, sx(40) - sx(35), B - Tp);
      ctx.fillStyle = T.figAmber; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('최적 온도', sx(37.5), Tp - 3);
      // 축
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [0, 20, 40, 60].forEach(function (t) { ctx.fillText(t, sx(t), B + 13); });
      ctx.font = '12px ' + T.fontBody; ctx.fillText('온도 (°C)', (L + R) / 2, B + 27);
      ctx.save(); ctx.translate(r.x + 14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('반응 속도', 0, 0); ctx.restore();
      // 곡선
      ctx.beginPath();
      for (var t = 0; t <= 70; t += 0.5) { var X = sx(t), Y = sy(freshRate(t)); if (t) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.strokeStyle = st.enz ? T.figAccent : T.figLine; ctx.lineWidth = st.enz ? 2.5 : 1.5; ctx.stroke();
      ctx.beginPath();
      for (var t2 = 0; t2 <= 70; t2 += 1) { var X2 = sx(t2), Y2 = sy(noEnzRate(t2)); if (t2) ctx.lineTo(X2, Y2); else ctx.moveTo(X2, Y2); }
      ctx.setLineDash([4, 3]); ctx.strokeStyle = st.enz ? T.figLine : T.figRed; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = st.enz ? T.figMuted : T.figRed;
      ctx.fillText('효소 없음', sx(2), sy(0.04) - 2);
      ctx.fillStyle = st.enz ? T.figAccent : T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('변성 → 급감', sx(46), sy(0.55));
      // 현재 점
      var v = curRate(), px = sx(st.temp), py = sy(v);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, B); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = st.enz ? (st.dead ? T.figRed : T.figAccent) : T.figRed; ctx.fill();
      ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.stroke();
      if (st.enz && st.dead && st.temp < 50) {
        ctx.fillStyle = T.figRed; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = st.temp < 35 ? 'left' : 'right';
        ctx.fillText('한 번 변성된 효소: 식혀도 회복 안 됨', px + (st.temp < 35 ? 8 : -8), py - 10);
      }
    }

    api.onResize(draw);
    update(); draw();
  },
});
