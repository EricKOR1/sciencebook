/* 3-2 판과 판의 경계: 경계 종류별로 판의 움직임, 생기는 지형, 지진·화산 위치를 단면(보존형은 평면)으로 보여 준다 */
Sims.register('plates', {
  title: '판의 경계 네 가지 — 무엇이 생기고, 어디서 흔들리나?',
  caption: '버튼으로 경계의 종류를 고르고 ‘움직여 보기’를 눌러 판이 어떻게 움직이는지 보자. 별은 지진이 일어나는 곳(진원), 빨간 삼각형은 화산이다. 섭입대에서는 밀도가 큰 해양판이 가라앉으며 대륙 쪽으로 갈수록 진원이 깊어지고, 대륙판끼리 부딪치는 곳에서는 화산 없이 높은 습곡 산맥이 생긴다. 판은 1년에 몇 cm씩 움직이므로 수백만 년을 몇 초로 줄여 보여 주며, 맨틀 대류 화살표와 지형의 높이·두께는 설명을 위해 단순화했다.',
  init: function (api) {
    var MODES = [
      { key: 'div', label: '발산형 (해령·열곡)', motion: '서로 멀어진다', land: '해령, 열곡', quake: '얕은 곳(천발)', volc: '활발', ex: '대서양 중앙 해령, 아이슬란드, 동아프리카 열곡대' },
      { key: 'sub', label: '수렴형 – 섭입 (해구·화산)', motion: '가까워지며 밀도가 큰 해양판이 대륙판 아래로 들어간다', land: '해구, 화산이 늘어선 산맥 (해양판끼리라면 호상 열도)', quake: '얕은 곳~깊은 곳', volc: '활발', ex: '페루–칠레 해구와 안데스산맥 (해양판끼리: 일본 해구와 일본 열도)' },
      { key: 'col', label: '수렴형 – 충돌 (습곡 산맥)', motion: '대륙판끼리 부딪친다', land: '거대한 습곡 산맥', quake: '얕은 곳~중간 깊이', volc: '거의 없음', ex: '히말라야산맥' },
      { key: 'tra', label: '보존형 (변환 단층)', motion: '서로 어긋나며 미끄러진다', land: '변환 단층', quake: '얕은 곳(천발)', volc: '거의 없음', ex: '산안드레아스 단층, 해령과 해령 사이' },
    ];
    var state = { mode: 0, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.0 : 0.56; }, label: '판의 경계 단면 모식도' });
    var ctx = cv.ctx;

    var rMotion = api.readout('판의 움직임');
    var rLand = api.readout('생기는 지형');
    var rQuake = api.readout('지진');
    var rVolc = api.readout('화산');
    var rEx = api.readout('예');

    var g = api.group();
    var btns = MODES.map(function (m, i) {
      return api.button(m.label, function () { state.mode = i; sync(); draw(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    var playBtn = api.button(api.reduced ? '조금씩 진행' : '움직여 보기', function () {
      if (api.reduced) { state.t += 0.8; draw(); return; }
      if (loop.playing || loop.wanted) { loop.pause(); } else { loop.play(); }
      syncPlay();
    }, { primary: true });

    var loop = api.loop(function (dt) { state.t += dt; draw(); });
    loop.pause();

    function syncPlay() { if (!api.reduced) playBtn.textContent = loop.wanted ? '멈춤' : '움직여 보기'; }
    function sync() {
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === state.mode ? 'true' : 'false'); });
      var m = MODES[state.mode];
      rMotion.set(m.motion); rLand.set(m.land); rQuake.set(m.quake); rVolc.set(m.volc); rEx.set(m.ex);
    }

    /* ───── 공통 도구 ───── */
    var POL = [1.1, 0.6, 1.5, 0.8, 0.5, 1.3, 0.9, 0.7, 1.2, 0.6, 1.0, 0.8];
    var POLSUM = POL.reduce(function (a, b) { return a + b; }, 0);
    function polarity(tau) { // 그 시각에 만들어진 지각의 자기장 방향 (true = 정자극기)
      var m = ((tau % POLSUM) + POLSUM) % POLSUM, i = 0;
      while (m > POL[i]) { m -= POL[i]; i++; }
      return i % 2 === 0;
    }
    function star(x, y, r, T, alpha) {
      ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.beginPath();
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
        ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
      }
      ctx.closePath(); ctx.fillStyle = T.figAmber; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = T.figInk; ctx.stroke(); ctx.restore();
    }
    function volcano(x, y, s, T) { // (x, y) = 꼭대기
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 0.9, y + s * 1.3); ctx.lineTo(x + s * 0.9, y + s * 1.3); ctx.closePath();
      ctx.fillStyle = T.figRed; ctx.fill();
    }
    function arrow(x1, y1, x2, y2, color, lw, head) {
      head = head || 9;
      var a = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - head * 0.8 * Math.cos(a), y2 - head * 0.8 * Math.sin(a)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
      ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    function label(text, x, y, T, opt) {
      opt = opt || {};
      ctx.font = (opt.bold ? '600 ' : '') + (opt.size || 12) + 'px ' + T.fontBody;
      ctx.textAlign = opt.align || 'center'; ctx.textBaseline = 'middle';
      if (opt.box) {
        var w = ctx.measureText(text).width, x0 = opt.align === 'left' ? x : opt.align === 'right' ? x - w : x - w / 2;
        ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.88;
        ctx.fillRect(x0 - 4, y - 9, w + 8, 18); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = opt.color || T.figInk; ctx.fillText(text, x, y);
      ctx.textBaseline = 'alphabetic';
    }
    function poly(pts, fill, stroke, lw) {
      ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    }
    // 맨틀 대류(단순화): 점선 타원 + 화살촉. cw=true 이면 화면에서 시계 방향
    function convection(cx, cy, rx, ry, cw, T) {
      ctx.save();
      ctx.setLineDash([7, 6]); ctx.lineDashOffset = -state.t * 18;
      ctx.strokeStyle = T.figRed; ctx.globalAlpha = 0.7; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, !cw); ctx.stroke();
      ctx.setLineDash([]);
      var d = cw ? 1 : -1;
      arrow(cx - d * 6, cy - ry, cx + d * 6, cy - ry, T.figRed, 2, 10);
      arrow(cx + d * 6, cy + ry, cx - d * 6, cy + ry, T.figRed, 2, 10);
      ctx.restore();
    }

    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560, legH = narrow ? 46 : 26;
      return { narrow: narrow, scene: { x: 0, y: 0, w: w, h: h - legH }, leg: { x: 0, y: h - legH, w: w, h: legH } };
    }

    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var key = MODES[state.mode].key;
      ctx.save(); ctx.beginPath(); ctx.rect(L.scene.x, L.scene.y, L.scene.w, L.scene.h); ctx.clip();
      if (key === 'div') drawDiv(T, L);
      else if (key === 'sub') drawSub(T, L);
      else if (key === 'col') drawCol(T, L);
      else drawTra(T, L);
      ctx.restore();
      drawLegend(T, L, key);
    }

    /* ───── 발산형 ───── */
    function drawDiv(T, L) {
      var r = L.scene, X = function (f) { return r.x + f * r.w; }, Y = function (f) { return r.y + f * r.h; };
      var SEA = 0.16, CR = 0.035, V = 0.035;
      function floor(f) { var d = Math.abs(f - 0.5), y = 0.30 + 0.12 * Math.sqrt(d / 0.5); if (d < 0.03) y += 0.035 * (1 - d / 0.03); return y; }
      function thick(f) { var d = Math.abs(f - 0.5); return 0.03 + 0.16 * Math.sqrt(d / 0.5); }
      var N = 140, i, f;
      // 연약권
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(r.x, Y(0.25), r.w, r.h);
      // 바다
      var water = [[X(0), Y(SEA)], [X(1), Y(SEA)]];
      for (i = N; i >= 0; i--) { f = i / N; water.push([X(f), Y(floor(f))]); }
      poly(water, T.figSoftBlue);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(0), Y(SEA)); ctx.lineTo(X(1), Y(SEA)); ctx.stroke();
      // 판(맨틀 최상부)
      var lith = [];
      for (i = 0; i <= N; i++) { f = i / N; lith.push([X(f), Y(floor(f) + CR)]); }
      for (i = N; i >= 0; i--) { f = i / N; lith.push([X(f), Y(floor(f) + CR + thick(f))]); }
      poly(lith, T.figSoftViolet, T.figViolet, 1);
      // 해양 지각: 고지자기 줄무늬가 해령에서 양쪽으로 이동
      var step = 2 / r.w;
      for (f = 0; f < 1; f += step) {
        var d = Math.abs(f + step / 2 - 0.5), age = d / V, nrm = polarity(state.t - age);
        ctx.fillStyle = nrm ? T.figBlue : T.figPaper;
        var y0 = Y(floor(f + step / 2));
        ctx.fillRect(X(f), y0, 2.2, Y(floor(f + step / 2) + CR) - y0);
      }
      // 지각의 위·아래 경계
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1;
      [0, CR].forEach(function (o) { ctx.beginPath(); for (var j = 0; j <= N; j++) { var q = j / N; if (j) ctx.lineTo(X(q), Y(floor(q) + o)); else ctx.moveTo(X(q), Y(floor(q) + o)); } ctx.stroke(); });
      // 마그마 상승
      var top = Y(floor(0.5)), bot = Y(1.02);
      ctx.save(); ctx.globalAlpha = 0.55;
      poly([[X(0.465), bot], [X(0.49), Y(0.5)], [X(0.497), top], [X(0.503), top], [X(0.51), Y(0.5)], [X(0.535), bot]], T.figRed);
      ctx.restore();
      for (i = 0; i < 4; i++) {
        var p = ((state.t * 0.15 + i / 4) % 1), yy = bot - p * (bot - top - 6);
        ctx.beginPath(); ctx.arc(X(0.5), yy, 3.5 * (1 - p * 0.5), 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      }
      volcano(X(0.5), top - 9, 6, T);
      // 맨틀 대류
      convection(X(0.27), Y(0.84), r.w * 0.19, r.h * 0.09, false, T);
      convection(X(0.73), Y(0.84), r.w * 0.19, r.h * 0.09, true, T);
      // 지진 (얕은 곳)
      var fl = 0.55 + 0.45 * Math.abs(Math.sin(state.t * 2.2));
      star(X(0.475), Y(floor(0.475) + 0.05), 7, T, fl);
      star(X(0.522), Y(floor(0.522) + 0.03), 7, T, 1.55 - fl);
      star(X(0.505), Y(floor(0.505) + 0.075), 6, T, fl);
      // 판 이동 화살표와 이름
      var ay = Y(floor(0.2) + CR + thick(0.2) * 0.55);
      arrow(X(0.30), ay, X(0.12), ay, T.figInk, 3);
      arrow(X(0.70), ay, X(0.88), ay, T.figInk, 3);
      label('해양판', X(0.21), ay - 15, T, { bold: true });
      label('해양판', X(0.79), ay - 15, T, { bold: true });
      label('해령', X(0.5), Y(0.07), T, { bold: true, size: 14 });
      label(L.narrow ? '← 열곡' : '← 열곡(가운데 골짜기)', X(0.535), Y(floor(0.535) - 0.045), T, { align: 'left', size: 12 });
      label('연약권', X(0.27), Y(0.84), T, { size: 12, color: T.figMuted });
      label(L.narrow ? '맨틀 대류' : '맨틀 대류(단순화)', X(0.73), Y(0.84), T, { size: 12, color: T.figMuted });
    }

    /* ───── 섭입형 ───── */
    function drawSub(T, L) {
      var r = L.scene, X = function (f) { return r.x + f * r.w; }, Y = function (f) { return r.y + f * r.h; };
      var SEA = 0.20, TH = 0.13 * r.h, ANG = 30 * Math.PI / 180, ca = Math.cos(ANG), sa = Math.sin(ANG);
      var P0 = [X(-0.02), Y(0.27)], P1 = [X(0.30), Y(0.27)], P2 = [X(0.42), Y(0.34)];
      var len3 = (Y(1.1) - P2[1]) / sa, P3 = [P2[0] + ca * len3, P2[1] + sa * len3];
      var top = [P0, P1, P2, P3];
      function slabX(y) { return P2[0] + (y - P2[1]) / Math.tan(ANG); }
      // 위 선에서 아래쪽으로 두께만큼 띄운 선
      function offset(pts, d) {
        return pts.map(function (p, i) {
          var ns = [];
          if (i > 0) ns.push(norm(pts[i - 1], p));
          if (i < pts.length - 1) ns.push(norm(p, pts[i + 1]));
          var nx = 0, ny = 0;
          ns.forEach(function (n) { nx += n[0]; ny += n[1]; });
          var l = Math.hypot(nx, ny); nx /= l; ny /= l;
          var dot = nx * ns[0][0] + ny * ns[0][1];
          return [p[0] + nx * d / dot, p[1] + ny * d / dot];
        });
      }
      function norm(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; }
      var bottom = offset(top, TH);
      // 대륙 표면 (화산 위치는 섭입판이 충분히 깊어진 곳 위)
      var vx = Math.max(slabX(Y(0.47)), X(0.55)), mw = r.w * 0.045;
      var surf = [[P2[0] + 2, P2[1] - 2], [X(0.45), Y(0.26)], [X(0.48), Y(SEA)], [X(0.50), Y(0.175)],
        [vx - mw * 1.2, Y(0.13)], [vx, Y(0.075)], [vx + mw, Y(0.115)], [vx + mw * 2.2, Y(0.095)],
        [vx + mw * 3.6, Y(0.14)], [X(1.02), Y(0.16)]];
      // 연약권
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(r.x, Y(0.25), r.w, r.h);
      // 바다
      poly([[X(-0.02), Y(SEA)], [X(0.48), Y(SEA)], [X(0.45), Y(0.26)], P2, P1, P0], T.figSoftBlue);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(-0.02), Y(SEA)); ctx.lineTo(X(0.48), Y(SEA)); ctx.stroke();
      // 대륙판: 지각 + 맨틀 최상부
      var MOHO = Y(0.37), LB = Y(0.50);
      var crust = surf.slice(); crust.push([X(1.02), MOHO], [slabX(MOHO), MOHO]);
      var lithC = [[slabX(MOHO), MOHO], [X(1.02), MOHO], [X(1.02), LB], [slabX(LB), LB]];
      poly(lithC, T.figSoftViolet, T.figViolet, 1);
      poly(crust, T.figSoftAmber, T.figAmber, 1.5);
      // 해양판
      var plate = top.concat(bottom.slice().reverse());
      poly(plate, T.figSoftViolet, T.figViolet, 1.2);
      var crustTop = top, crustBot = offset(top, TH * 0.22);
      poly(crustTop.concat(crustBot.slice().reverse()), T.figTeal);
      // 해양판 위의 표지: 판을 따라 이동
      var segs = [], total = 0;
      for (var i = 0; i < top.length - 1; i++) { var l = Math.hypot(top[i + 1][0] - top[i][0], top[i + 1][1] - top[i][1]); segs.push(l); total += l; }
      var gap = 46, sp = 22;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.globalAlpha = 0.45;
      for (var s0 = (state.t * sp) % gap; s0 < total; s0 += gap) {
        var s = s0, k = 0; while (k < segs.length - 1 && s > segs[k]) { s -= segs[k]; k++; }
        var a = top[k], b = top[k + 1], u = s / segs[k];
        var px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u;
        var ab = bottom[k], bb = bottom[k + 1];
        var qx = ab[0] + (bb[0] - ab[0]) * u, qy = ab[1] + (bb[1] - ab[1]) * u;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 맨틀 대류 (단순화)
      convection(X(0.17), Y(0.74), r.w * 0.13, r.h * 0.11, true, T);
      // 마그마: 섭입판 위에서 생겨 화산으로 올라감
      var my = Y(0.47), mx = slabX(my) + 6, peakY = Y(0.075);
      ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = T.figRed; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(vx + 4, (my + peakY) / 2, vx, peakY + 8); ctx.stroke(); ctx.restore();
      for (i = 0; i < 3; i++) {
        var p = (state.t * 0.25 + i / 3) % 1, qy2 = my + (peakY + 8 - my) * p;
        var qx2 = (1 - p) * (1 - p) * mx + 2 * (1 - p) * p * (vx + 4) + p * p * vx;
        ctx.beginPath(); ctx.arc(qx2, qy2, 3.5, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      }
      volcano(vx, peakY - 6, 7, T);
      // 지진: 섭입하는 판을 따라 점점 깊어짐
      var fl = 0.55 + 0.45 * Math.abs(Math.sin(state.t * 2.2));
      [0.36, 0.44, 0.53, 0.63, 0.74, 0.86].forEach(function (fy, j) {
        var y = Y(fy) + 5, x = slabX(Y(fy)) + 2;
        star(x, y, j < 2 ? 7 : 6, T, j % 2 ? fl : 1.55 - fl);
      });
      star(X(0.47), Y(0.29), 6, T, fl);
      // 이름표
      var ay = Y(0.27) + TH * 0.8;
      arrow(X(0.08), ay, X(0.26), ay, T.figInk, 3);
      label('해양판 (밀도 큼)', X(0.17), Y(0.27) + TH * 0.47, T, { bold: true });
      arrow(X(0.95), Y(0.47), X(0.82), Y(0.47), T.figInk, 3);
      label('대륙판 (밀도 작음)', X(L.narrow ? 0.80 : 0.85), Y(0.41), T, { bold: true });
      label('해구', P2[0], Y(SEA) - 14, T, { bold: true, size: 13 });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P2[0], Y(SEA) - 6); ctx.lineTo(P2[0], P2[1] - 4); ctx.stroke();
      label('화산', vx + 14, Y(0.035), T, { bold: true, size: 13, align: 'left' });
      // 진원 깊이 설명 (섭입판 아래쪽, 판을 따라 기울여 씀)
      ctx.save();
      var mid = Y(0.60), off = TH + 14;
      ctx.translate(slabX(mid) - sa * off, mid + ca * off); ctx.rotate(ANG);
      label(L.narrow ? '진원이 점점 깊어짐 →' : '대륙 쪽으로 갈수록 진원이 깊어짐 →', 0, 0, T, { size: 12, color: T.figInk });
      ctx.restore();
      label('맨틀 대류(단순화)', X(0.17), Y(0.74), T, { size: 11, color: T.figMuted });
      label('연약권', X(L.narrow ? 0.55 : 0.86), Y(L.narrow ? 0.92 : 0.62), T, { size: 12, color: T.figMuted });
      label('해양판끼리 만나면 → 호상 열도 (예: 일본 열도)', X(0.02), Y(0.06), T, { size: L.narrow ? 11 : 12, align: 'left', color: T.figMuted });
    }

    /* ───── 충돌형 ───── */
    function drawCol(T, L) {
      var r = L.scene, X = function (f) { return r.x + f * r.w; }, Y = function (f) { return r.y + f * r.h; };
      function bump(f) { var q = 1 - Math.pow((f - 0.5) / 0.21, 2); return q > 0 ? Math.pow(q, 1.2) : 0; }
      function surf(f) { var b = bump(f); return 0.27 - 0.15 * b + 0.012 * Math.sin(f * 95) * b; }
      function moho(f) { return 0.40 + 0.15 * bump(f); }
      function lb(f) { return 0.54 + 0.10 * bump(f); }
      var N = 160, i, f;
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(r.x, Y(0.3), r.w, r.h);
      var lith = [], crust = [];
      for (i = 0; i <= N; i++) { f = i / N; lith.push([X(f), Y(moho(f))]); crust.push([X(f), Y(surf(f))]); }
      for (i = N; i >= 0; i--) { f = i / N; lith.push([X(f), Y(lb(f))]); crust.push([X(f), Y(moho(f))]); }
      poly(lith, T.figSoftViolet, T.figViolet, 1);
      poly(crust, T.figSoftAmber, T.figAmber, 1.5);
      // 습곡: 지층 선이 산맥 쪽에서 구불구불 접힌다
      ctx.save(); poly(crust); ctx.clip();
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.8;
      for (var k = 1; k <= 3; k++) {
        ctx.beginPath();
        for (i = 0; i <= N * 2; i++) {
          f = i / (N * 2);
          var base = surf(f) + (moho(f) - surf(f)) * k / 4.2;
          var y = Y(base) + Math.sin((f - 0.5) * 70) * 9 * bump(f);
          if (i) ctx.lineTo(X(f), y); else ctx.moveTo(X(f), y);
        }
        ctx.stroke();
      }
      ctx.restore();
      // 봉합선
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figInk; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(0.5), Y(surf(0.5)) + 4); ctx.lineTo(X(0.5), Y(lb(0.5))); ctx.stroke(); ctx.restore();
      // 판 위 표지: 양쪽에서 산맥 쪽으로 다가오다 산맥 속으로 사라짐
      var gap = 0.075, v = 0.03;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      for (var s = (state.t * v) % gap; s < 0.30; s += gap) {
        var al = Math.max(0, Math.min(1, (0.30 - s) / 0.08)) * 0.5;
        ctx.globalAlpha = al;
        [s, 1 - s].forEach(function (fx) {
          ctx.beginPath(); ctx.moveTo(X(fx), Y(surf(fx)) + 3); ctx.lineTo(X(fx), Y(moho(fx)) - 3); ctx.stroke();
        });
      }
      ctx.globalAlpha = 1;
      // 맨틀 대류(단순화): 산맥 아래로 모여 내려간다
      convection(X(0.25), Y(0.84), r.w * 0.17, r.h * 0.08, true, T);
      convection(X(0.75), Y(0.84), r.w * 0.17, r.h * 0.08, false, T);
      // 지진: 얕은 곳~중간 깊이
      var fl = 0.55 + 0.45 * Math.abs(Math.sin(state.t * 2.2));
      [[0.42, 0.30], [0.56, 0.33], [0.47, 0.44], [0.60, 0.25], [0.37, 0.36], [0.57, 0.43]].forEach(function (p, j) {
        star(X(p[0]), Y(p[1]), 6.5, T, j % 2 ? fl : 1.55 - fl);
      });
      var ay = Y((surf(0.12) + moho(0.12)) / 2);
      arrow(X(0.03), ay, X(0.2), ay, T.figInk, 3);
      arrow(X(0.97), ay, X(0.8), ay, T.figInk, 3);
      label('대륙판', X(0.115), ay - 16, T, { bold: true });
      label('대륙판', X(0.885), ay - 16, T, { bold: true });
      label('습곡 산맥 (예: 히말라야)', X(0.5), Y(0.05), T, { bold: true, size: 13 });
      if (!L.narrow) label('두꺼워진 지각 (산맥의 뿌리)', X(0.5), Y(0.49), T, { size: 12, box: true });
      label('화산 거의 없음', X(L.narrow ? 0.18 : 0.15), Y(0.18), T, { size: 12, color: T.figMuted });
      label('연약권', X(0.25), Y(0.84), T, { size: 12, color: T.figMuted });
      label(L.narrow ? '맨틀 대류' : '맨틀 대류(단순화)', X(0.75), Y(0.84), T, { size: 12, color: T.figMuted });
    }

    /* ───── 보존형 (위에서 내려다본 모습) ───── */
    function drawTra(T, L) {
      var r = L.scene, X = function (f) { return r.x + f * r.w; }, Y = function (f) { return r.y + f * r.h; };
      var top = 0.12, bot = 0.88, FY = 0.50, RA = 0.37, RB = 0.63, V = 0.04;
      ctx.fillStyle = T.figPaper; ctx.fillRect(X(0.03), Y(top), r.w * 0.94, Y(bot) - Y(top));
      // 줄무늬: 각 해령에서 양쪽으로 이동
      var step = 2 / r.w;
      ctx.save(); ctx.globalAlpha = 0.42;
      for (var f = 0.03; f < 0.97; f += step) {
        var c = f + step / 2;
        if (polarity(state.t - Math.abs(c - RA) / V)) { ctx.fillStyle = T.figBlue; ctx.fillRect(X(f), Y(top), 2.2, Y(FY) - Y(top)); }
        if (polarity(state.t - Math.abs(c - RB) / V)) { ctx.fillStyle = T.figBlue; ctx.fillRect(X(f), Y(FY), 2.2, Y(bot) - Y(FY)); }
      }
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(X(0.03), Y(top), r.w * 0.94, Y(bot) - Y(top));
      // 단열대(지진 거의 없음)
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(0.03), Y(FY)); ctx.lineTo(X(RA), Y(FY)); ctx.moveTo(X(RB), Y(FY)); ctx.lineTo(X(0.97), Y(FY)); ctx.stroke(); ctx.restore();
      // 해령
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(X(RA), Y(top)); ctx.lineTo(X(RA), Y(FY)); ctx.moveTo(X(RB), Y(FY)); ctx.lineTo(X(RB), Y(bot)); ctx.stroke();
      // 변환 단층
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(X(RA), Y(FY)); ctx.lineTo(X(RB), Y(FY)); ctx.stroke();
      var fl = 0.55 + 0.45 * Math.abs(Math.sin(state.t * 2.2));
      [0.42, 0.5, 0.58].forEach(function (fx, j) { star(X(fx), Y(FY), 7.5, T, j % 2 ? fl : 1.55 - fl); });
      // 판의 이동 방향
      var big = L.narrow ? 0.12 : 0.1;
      arrow(X(0.25), Y(0.28), X(0.25 - big), Y(0.28), T.figInk, 3);
      arrow(X(0.75), Y(0.28), X(0.75 + big), Y(0.28), T.figInk, 3);
      arrow(X(0.25), Y(0.74), X(0.25 - big), Y(0.74), T.figInk, 3);
      arrow(X(0.75), Y(0.74), X(0.75 + big), Y(0.74), T.figInk, 3);
      // 변환 단층 양쪽: 서로 반대 방향
      arrow(X(0.44), Y(FY) - 14, X(0.56), Y(FY) - 14, T.figAccent, 3);
      arrow(X(0.56), Y(FY) + 14, X(0.44), Y(FY) + 14, T.figAccent, 3);
      label('해령', X(RA), Y(top) - 12, T, { bold: true, size: 13, color: T.figRed });
      label('해령', X(RB), Y(bot) + 12, T, { bold: true, size: 13, color: T.figRed });
      label('변환 단층', X(0.5), Y(FY) - 34, T, { bold: true, size: 13, box: true });
      label(L.narrow ? '반대로 미끄러짐 → 지진' : '양쪽 판이 반대로 미끄러짐 → 지진', X(0.5), Y(FY) + 36, T, { size: 12, box: true });
      label(L.narrow ? '단열대' : '단열대 (같은 방향, 지진 거의 없음)', X(0.05), Y(FY) - 14, T, { size: 12, align: 'left', box: true });
      label(L.narrow ? '단열대' : '단열대 (같은 방향, 지진 거의 없음)', X(0.95), Y(FY) + 16, T, { size: 12, align: 'right', box: true });
      label('위에서 내려다본 모습', X(0.97), Y(top) - 12, T, { size: 12, align: 'right', color: T.figMuted });
    }

    function drawLegend(T, L, key) {
      var r = L.leg, items = [];
      items.push(['star', '지진(진원)']);
      if (key !== 'tra') items.push(['volc', '화산']);
      items.push(['arrow', '판의 이동']);
      if (key !== 'tra') items.push(['conv', '맨틀 대류(단순화)']);
      else items.push(['stripe', '정자극기 줄무늬']);
      ctx.font = '12px ' + T.fontBody; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      var perRow = L.narrow ? 2 : 4, colW = r.w / perRow;
      items.forEach(function (it, i) {
        var row = Math.floor(i / perRow), col = i % perRow;
        var x = r.x + col * colW + 10, y = r.y + 13 + row * 20;
        if (it[0] === 'star') star(x + 8, y, 6.5, T);
        else if (it[0] === 'volc') volcano(x + 8, y - 7, 6, T);
        else if (it[0] === 'arrow') arrow(x, y, x + 20, y, T.figInk, 2.5, 8);
        else if (it[0] === 'conv') { ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y); ctx.stroke(); ctx.restore(); }
        else { ctx.save(); ctx.globalAlpha = 0.42; ctx.fillStyle = T.figBlue; ctx.fillRect(x, y - 6, 20, 12); ctx.restore(); }
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], x + 28, y);
      });
      ctx.textBaseline = 'alphabetic';
    }

    api.onResize(draw);
    sync(); draw();
  },
});
