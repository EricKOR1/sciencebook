/* 일반지구과학 8 경도풍: 곡선 등압선 둘레에서 기압 경도력·전향력·원심력의 균형과 지균풍 비교 (북반구) */
Sims.register('u-gradient-wind', {
  title: '경도풍 — 저기압과 고기압 둘레의 바람은 지균풍과 얼마나 다를까',
  caption: '저기압·고기압을 고르고 곡률 반지름 r, 기압 경도(같은 경도에서의 지균풍 속력 v_g로 나타냄), 위도를 바꿔 보자. 저기압 둘레에서는 원심력이 전향력을 도와 기압 경도력과 맞서므로 바람이 지균풍보다 느리고, 고기압 둘레에서는 전향력이 기압 경도력과 원심력을 함께 버텨야 하므로 더 빠르다. 고기압에서는 v_g가 fr/4를 넘으면 균형 해가 없어서, 고기압 중심 부근의 기압 경도에는 상한이 있다. 마찰이 없고 등압선이 원이며 흐름이 정상 상태라고 가정했다.',
  init: function (api) {
    var OM = 7.292e-5;
    var st = { low: true, r: 600, vg: 12, lat: 43, th: Math.PI / 2 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.52; }, label: '원형 등압선 둘레의 힘 벡터와 지균풍·경도풍 비교 그래프' });
    var ctx = cv.ctx;
    var rF = api.readout('fr ');
    var rV = api.readout('경도풍 v ');
    var rR = api.readout('v / v_g ');
    var rRo = api.readout('로스비 수 v/(fr) ');
    var g = api.group();
    var bL = api.button('저기압', function () { setKind(true); }, { toggle: true, pressed: true, parent: g });
    var bH = api.button('고기압', function () { setKind(false); }, { toggle: true, pressed: false, parent: g });
    api.slider({ id: 'u-gradient-wind-r', label: '곡률 반지름 r', min: Math.log10(100), max: Math.log10(3000), step: 0.01, value: Math.log10(st.r),
      format: function (v) { return Math.round(Math.pow(10, v)) + ' km'; }, onInput: function (v) { st.r = Math.pow(10, v); update(); } });
    api.slider({ id: 'u-gradient-wind-vg', label: '기압 경도 (지균풍 v_g)', min: 0, max: 30, step: 0.5, value: st.vg,
      format: function (v) { return v.toFixed(1) + ' m/s'; }, onInput: function (v) { st.vg = v; update(); } });
    api.slider({ id: 'u-gradient-wind-lat', label: '위도', min: 10, max: 80, step: 1, value: st.lat,
      format: function (v) { return v + '°N'; }, onInput: function (v) { st.lat = v; update(); } });
    function setKind(low) { st.low = low; bL.setAttribute('aria-pressed', low ? 'true' : 'false'); bH.setAttribute('aria-pressed', low ? 'false' : 'true'); update(); }
    function f() { return 2 * OM * Math.sin(st.lat * Math.PI / 180); }
    function solve(low, vg, fr) {
      if (low) return (-fr + Math.sqrt(fr * fr + 4 * fr * vg)) / 2;
      var D = fr * fr - 4 * fr * vg;
      return D < 0 ? null : (fr - Math.sqrt(D)) / 2;
    }
    var cur;
    function update() {
      var fr = f() * st.r * 1000;
      var v = solve(st.low, st.vg, fr);
      cur = { fr: fr, v: v };
      rF.set(fr.toFixed(0) + ' m/s' + (st.low ? '' : '  (v_g 상한 fr/4 = ' + (fr / 4).toFixed(1) + ')'));
      rV.set(v === null ? '균형 불가' : v.toFixed(1) + ' m/s');
      rR.set(v === null || st.vg === 0 ? '–' : (v / st.vg).toFixed(2));
      rRo.set(v === null ? '–' : (v / fr).toFixed(2));
      draw();
    }
    var loop = api.loop(function (dt) {
      if (dt <= 0 || !cur || cur.v === null) return;
      st.th += (st.low ? -1 : 1) * dt * (0.25 + cur.v / 40);   // 화면용 회전 속도(실제 비례 아님)
      draw();
    });
    if (api.reduced) loop.pause();

    function arrow(x1, y1, x2, y2, col, w, dash) {
      var len = Math.hypot(x2 - x1, y2 - y1); if (len < 2) return;
      var a = Math.atan2(y2 - y1, x2 - x1), hd = 9;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - hd * 0.7 * Math.cos(a), y2 - hd * 0.7 * Math.sin(a)); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hd * Math.cos(a - 0.45), y2 - hd * Math.sin(a - 0.45)); ctx.lineTo(x2 - hd * Math.cos(a + 0.45), y2 - hd * Math.sin(a + 0.45));
      ctx.closePath(); ctx.fill();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = stacked ? { x: 0, y: 0, w: w, h: h * 0.55 } : { x: 0, y: 0, w: w * 0.5, h: h };
      var B = stacked ? { x: 0, y: h * 0.57, w: w, h: h * 0.43 } : { x: w * 0.53, y: 0, w: w * 0.47, h: h };
      drawMap(T, A); drawGraph(T, B);
    }
    function drawMap(T, r) {
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 8, R = Math.min(r.w, r.h) * 0.3;
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText(st.low ? '저기압 둘레 (반시계 방향)' : '고기압 둘레 (시계 방향)', r.x + 8, r.y + 16);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('북반구, 위쪽이 북', r.x + 8, r.y + 32);
      [0.45, 1, 1.5].forEach(function (k) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = k === 1 ? 1.6 : 1; ctx.setLineDash(k === 1 ? [] : [4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.font = '700 20px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = st.low ? T.figRed : T.figBlue; ctx.fillText(st.low ? 'L' : 'H', cx, cy + 7);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('r = ' + Math.round(st.r) + ' km', cx, cy + R + 16);
      var px = cx + R * Math.cos(st.th), py = cy + R * Math.sin(st.th);   // 화면 좌표(아래 +)
      var ox = Math.cos(st.th), oy = Math.sin(st.th);                     // 바깥쪽 단위 벡터
      var tx = st.low ? oy : -oy, ty = st.low ? -ox : ox;                // 진행 방향(반시계: 화면에서)
      var fv = f();
      var pgf = fv * st.vg, v = cur.v;
      var co = v === null ? 0 : fv * v, ce = v === null ? 0 : v * v / (st.r * 1000);
      var maxA = Math.max(pgf, co, ce, 1e-6), K = Math.min(r.w, r.h) * 0.24 / maxA;
      // 힘(가속도) 벡터
      var sgnP = st.low ? -1 : 1, sgnC = st.low ? 1 : -1;
      arrow(px, py, px + sgnP * ox * pgf * K, py + sgnP * oy * pgf * K, T.figRed, 2.6);
      if (v !== null) {
        var o2 = 6;   // 바깥쪽 두 힘이 겹치지 않게 접선 방향으로 조금 비켜 그린다
        arrow(px + tx * o2, py + ty * o2, px + tx * o2 + sgnC * ox * co * K, py + ty * o2 + sgnC * oy * co * K, T.figBlue, 2.6);
        arrow(px - tx * o2, py - ty * o2, px - tx * o2 + ox * ce * K, py - ty * o2 + oy * ce * K, T.figAmber, 2.6);
        // 바람
        var WK = Math.min(r.w, r.h) * 0.2 / 30;
        arrow(px, py, px + tx * st.vg * WK, py + ty * st.vg * WK, T.figGreen, 1.4, [4, 3]);
        arrow(px, py, px + tx * v * WK, py + ty * v * WK, T.figGreen, 3.6);
      }
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
      // 범례
      var items = [[T.figRed, '기압 경도력  ' + (pgf * 1e3).toFixed(2)], [T.figBlue, '전향력  ' + (co * 1e3).toFixed(2)], [T.figAmber, '원심력  ' + (ce * 1e3).toFixed(2)], [T.figGreen, '바람(점선: 지균풍)']];
      var ly = r.y + r.h - items.length * 15 - 2;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      items.forEach(function (it, i) {
        ctx.fillStyle = it[0]; ctx.fillRect(r.x + 8, ly + i * 15 - 8, 14, 4);
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], r.x + 28, ly + i * 15 - 3);
      });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('단위: 10⁻³ m/s²', r.x + r.w - 6, r.y + r.h - 4);
      if (v === null) {
        ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('균형 불가: v_g > fr/4', cx, r.y + 52);
      }
    }
    function drawGraph(T, r) {
      var L = r.x + 46, R = r.x + r.w - 12, Tp = r.y + 28, Bt = r.y + r.h - 40, VX = 30, VY = 60;
      var sx = function (v) { return L + v / VX * (R - L); }, sy = function (v) { return Bt - v / VY * (Bt - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      for (var y = 0; y <= VY; y += 10) { ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(R, sy(y)); ctx.stroke(); ctx.fillText(y, L - 6, sy(y) + 4); }
      ctx.textAlign = 'center';
      for (var x = 0; x <= VX; x += 10) { ctx.beginPath(); ctx.moveTo(sx(x), Bt); ctx.lineTo(sx(x), Tp); ctx.stroke(); ctx.fillText(x, sx(x), Bt + 15); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('지균풍 v_g (m/s)', (L + R) / 2, Bt + 32);
      ctx.save(); ctx.translate(r.x + 12, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('실제 바람 v (m/s)', 0, 0); ctx.restore();
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('같은 r = ' + Math.round(st.r) + ' km, 위도 ' + st.lat + '°에서', L, r.y + 14);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, Bt - Tp); ctx.clip();
      var fr = cur.fr;
      // 지균풍 v = v_g
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(VX), sy(VX)); ctx.stroke(); ctx.setLineDash([]);
      [[true, T.figRed], [false, T.figBlue]].forEach(function (k) {
        ctx.strokeStyle = k[1]; ctx.lineWidth = st.low === k[0] ? 2.8 : 1.4; ctx.beginPath();
        var started = false;
        for (var i = 0; i <= 300; i++) {
          var vg = VX * i / 300, v = solve(k[0], vg, fr);
          if (v === null) break;
          if (!started) { ctx.moveTo(sx(vg), sy(v)); started = true; } else ctx.lineTo(sx(vg), sy(v));
        }
        ctx.stroke();
      });
      if (fr / 4 < VX) {
        ctx.setLineDash([2, 3]); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx(fr / 4), Tp); ctx.lineTo(sx(fr / 4), Bt); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figSoftBlue; ctx.globalAlpha = 0.5; ctx.fillRect(sx(fr / 4), Tp, R - sx(fr / 4), Bt - Tp); ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = L + 6, ly = Tp + 14;
      [[T.figBlue, '고기압 (v > v_g)'], [T.figMuted, '지균풍 v = v_g'], [T.figRed, '저기압 (v < v_g)']].forEach(function (it, i) {
        ctx.fillStyle = it[0]; ctx.fillRect(lx, ly + i * 15 - 7, 14, 3); ctx.fillStyle = T.figInk; ctx.fillText(it[1], lx + 20, ly + i * 15 - 2);
      });
      if (fr / 4 < VX) { ctx.fillStyle = T.figBlue; ctx.textAlign = 'right'; ctx.fillText('고기압 균형 불가', R - 4, Bt - 6); }
      if (cur.v !== null) {
        ctx.fillStyle = st.low ? T.figRed : T.figBlue;
        ctx.beginPath(); ctx.arc(sx(st.vg), sy(Math.min(cur.v, VY)), 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    api.onResize(draw);
    update();
  },
});
