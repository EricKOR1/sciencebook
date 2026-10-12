/* 3-3 중력과 운동: ① 자유 낙하와 수평으로 던진 공의 다중 섬광 비교 ② 뉴턴의 대포(역제곱 중력을 수치 적분) */
Sims.register('projectile', {
  title: '떨어지는 공에서 도는 위성까지 — 수평 속력만 바꿔 보자',
  caption: '‘나란히 떨어뜨리기’에서 수평 속력을 바꿔도 두 공은 매 순간 같은 높이에 있고 동시에 바닥에 닿는다(0.1초 간격, g = 9.8 m/s²). ‘뉴턴의 대포’에서 발사 속력을 높이면 대포알은 점점 더 멀리 떨어지다가, 약 7.9 km/s에서는 떨어지는 만큼 지면도 휘어져 지구를 계속 돈다. 대포알 궤적은 지구 중심으로부터의 거리에 따라 약해지는 실제 중력으로 계산했지만, 산과 궤적의 높이는 보이도록 크게 과장해 그렸다. 공기 저항은 무시했고, 7.9 km/s는 지표 근처 기준이다.',
  init: function (api) {
    var G = 9.8, H = 4.9, TEND = 1.0, FLASH = 0.1, XB0 = 0.5;
    var GM = 398600, RE = 6371, VC = 7.9, R0 = GM / (VC * VC), A0 = R0 - RE; // 발사 높이: 7.9 km/s가 정확히 원 궤도가 되는 높이(약 16 km)
    var state = { tab: 0, v: 3, t: TEND, playing: false, vl: 7.7, prog: 1, hist: [7.85, 7.9, 8.5] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.6; }, label: '자유 낙하와 수평으로 던진 공, 뉴턴의 대포' });
    var ctx = cv.ctx;

    var tabs = api.group();
    var tabBtns = ['나란히 떨어뜨리기', '뉴턴의 대포'].map(function (n, i) {
      return api.button(n, function () { setTab(i); }, { toggle: true, pressed: i === 0, parent: tabs });
    });
    var sV = api.slider({ id: 'projectile-v', label: '공 B의 수평 속력', min: 0, max: 6, step: 0.5, value: state.v,
      format: function (v) { return v.toFixed(1) + ' m/s'; },
      onInput: function (v) { state.v = v; readouts(); draw(); } });
    var sL = api.slider({ id: 'projectile-launch', label: '발사 속력', min: 1, max: 9, step: 0.1, value: state.vl,
      format: function (v) { return v.toFixed(1) + ' km/s'; },
      onInput: function (v) { state.vl = Math.round(v * 10) / 10; state.prog = 1; loop.pause(); state.playing = false; readouts(); draw(); } });
    var go = api.button('떨어뜨리기', function () { start(); }, { primary: true });

    function ro(label) { var r = api.readout(label); r.el = api.readouts.lastChild; return r; }
    var r1 = [ro('시간'), ro('두 공이 떨어진 거리'), ro('B의 수평 이동 거리'), ro('0.1초마다 B의 수평 이동')];
    var r2 = [ro('발사 속력'), ro('결과'), ro('걸린 시간')];

    function setTab(i) {
      state.tab = i; loop.pause(); state.playing = false;
      tabBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', i === j ? 'true' : 'false'); });
      sV.input.parentNode.style.display = i === 0 ? '' : 'none';
      sL.input.parentNode.style.display = i === 1 ? '' : 'none';
      r1.forEach(function (r) { r.el.style.display = i === 0 ? '' : 'none'; });
      r2.forEach(function (r) { r.el.style.display = i === 1 ? '' : 'none'; });
      go.textContent = i === 0 ? (api.reduced ? '0.1초씩 넘기기' : '떨어뜨리기') : (api.reduced ? '조금씩 날리기' : '발사');
      readouts(); draw();
    }
    function start() {
      if (state.tab === 0) {
        if (api.reduced) { state.t = state.t >= TEND - 1e-9 ? 0 : Math.min(TEND, Math.round((state.t + FLASH) * 10) / 10); readouts(); draw(); return; }
        state.t = 0; state.playing = true; loop.play();
      } else {
        var P = path(state.vl);
        if (api.reduced) { state.prog = state.prog >= 1 ? 0.2 : Math.min(1, state.prog + 0.2); if (state.prog >= 1) remember(); readouts(); draw(); return; }
        state.prog = 0; state.playing = true; loop.play(); void P;
      }
    }
    function remember() {
      var v = state.vl, h = state.hist.filter(function (x) { return Math.abs(x - v) > 1e-9; });
      h.push(v); if (h.length > 5) h.shift(); state.hist = h;
    }
    var loop = api.loop(function (dt) {
      if (state.tab === 0) {
        state.t += dt / 3; // 실제 1초를 화면 3초로 늘림
        if (state.t >= TEND) { state.t = TEND; state.playing = false; loop.pause(); }
      } else {
        var P = path(state.vl), dur = Math.max(1.2, Math.min(5, P.T / 1500));
        state.prog += dt / dur;
        if (state.prog >= 1) { state.prog = 1; state.playing = false; loop.pause(); remember(); }
      }
      readouts(); draw();
    });
    loop.pause();

    /* ───── 뉴턴의 대포: 역제곱 중력 수치 적분 (단위 km, s) ───── */
    var cache = {};
    function path(v) {
      var key = v.toFixed(2); if (cache[key]) return cache[key];
      var x = 0, y = R0, vx = v, vy = 0, t = 0, dt = 2, sw = 0, prev = 0, pts = [[0, R0, 0]], end = 'orbit';
      function acc(px, py) { var r = Math.hypot(px, py), k = -GM / (r * r * r); return [k * px, k * py]; }
      while (t < 20000) {
        var s = [x, y, vx, vy];
        var d = function (q) { var a = acc(q[0], q[1]); return [q[2], q[3], a[0], a[1]]; };
        var add = function (q, k, h) { return q.map(function (z, i) { return z + h * k[i]; }); };
        var k1 = d(s), k2 = d(add(s, k1, dt / 2)), k3 = d(add(s, k2, dt / 2)), k4 = d(add(s, k3, dt));
        var n = s.map(function (z, i) { return z + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
        var r = Math.hypot(n[0], n[1]);
        var ang = Math.atan2(n[0], n[1]), da = ang - prev; if (da < -Math.PI) da += 2 * Math.PI; if (da > Math.PI) da -= 2 * Math.PI;
        if (r < RE) { // 땅에 닿는 순간을 선형 보간
          var r0 = Math.hypot(x, y), u = (r0 - RE) / (r0 - r);
          sw += da * u; t += dt * u; pts.push([sw, RE, t]); end = 'land'; break;
        }
        x = n[0]; y = n[1]; vx = n[2]; vy = n[3]; t += dt; sw += da; prev = ang;
        if (sw >= 2 * Math.PI) { pts.push([2 * Math.PI, r, t]); break; }
        pts.push([sw, r, t]);
      }
      var e = Math.abs(R0 * v * v / GM - 1); // 발사 지점이 근지점 또는 원지점이므로
      return (cache[key] = { pts: pts, end: end, T: t, range: RE * sw, e: e });
    }

    function readouts() {
      if (state.tab === 0) {
        var t = state.t, fall = 0.5 * G * t * t;
        r1[0].set(t.toFixed(2) + ' s'); r1[1].set(fall.toFixed(2) + ' m (같음)');
        r1[2].set((state.v * t).toFixed(2) + ' m'); r1[3].set((state.v * FLASH).toFixed(2) + ' m (일정)');
      } else {
        var P = path(state.vl);
        r2[0].set(state.vl.toFixed(1) + ' km/s');
        if (P.end === 'land') {
          r2[1].set('발사 지점에서 지표를 따라 약 ' + fmtKm(P.range) + ' 떨어진 곳에 떨어짐');
          r2[2].set('약 ' + Math.round(P.T) + '초');
        } else {
          r2[1].set(P.e < 0.01 ? '땅에 닿지 않고 지표 가까이를 원 궤도로 돈다' : '땅에 닿지 않고 타원 궤도로 지구를 돈다');
          r2[2].set('한 바퀴 약 ' + Math.round(P.T / 60) + '분');
        }
      }
    }
    function fmtKm(d) { return d >= 1000 ? (Math.round(d / 10) * 10).toLocaleString('ko-KR') + ' km' : Math.round(d) + ' km'; }

    /* ───── 그리기 ───── */
    function arrow(x1, y1, x2, y2, color, lw, head) {
      head = head || 9; var a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
      if (L < 2) return;
      var hh = Math.min(head, L * 0.8);
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - hh * 0.8 * Math.cos(a), y2 - hh * 0.8 * Math.sin(a)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hh * Math.cos(a - 0.45), y2 - hh * Math.sin(a - 0.45));
      ctx.lineTo(x2 - hh * Math.cos(a + 0.45), y2 - hh * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    function text(s, x, y, T, opt) {
      opt = opt || {};
      ctx.font = (opt.bold ? '600 ' : '') + (opt.size || 12) + 'px ' + T.fontBody;
      ctx.textAlign = opt.align || 'left'; ctx.fillStyle = opt.color || T.figInk; ctx.fillText(s, x, y);
    }
    function draw() {
      var T = api.tokens();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (state.tab === 0) drawDrop(T); else drawCannon(T);
    }

    function drawDrop(T) {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var area = narrow ? { x: 0, y: 0, w: w, h: h - 92 } : { x: 0, y: 0, w: w * 0.7, h: h };
      var left = area.x + 54, topY = area.y + 46;
      var s = Math.min((area.w - 54 - 24) / (XB0 + 6 + 0.4), (area.h - 46 - 34) / H);
      var X = function (m) { return left + m * s; }, Y = function (m) { return topY + m * s; };
      var br = Math.max(6, Math.min(9, s * 0.12)), av = Math.min(5, s * 0.075); // 공 반지름, 속도 화살표 배율(px per m/s)
      // 바닥과 눈금
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(area.x + 10, Y(H) + br, area.w - 20, 8);
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(area.x + 10, Y(H) + br); ctx.lineTo(area.x + area.w - 10, Y(H) + br); ctx.stroke();
      text('A 가만히 놓음', X(0) - br, topY - 30, T, { bold: true, size: 12, color: T.figViolet });
      text('B 수평으로 던짐', X(XB0) + br + 4, topY - 12, T, { bold: true, size: 12, color: T.figAmber });
      text('출발 높이 4.9 m', area.x + 14, Y(H) + br + 24, T, { size: 11, color: T.figMuted });
      // 섬광 사진 (지금까지 찍힌 것)
      var n = Math.floor(state.t / FLASH + 1e-6);
      for (var k = 0; k <= n; k++) {
        var tk = k * FLASH, yk = 0.5 * G * tk * tk;
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(0), Y(yk)); ctx.lineTo(X(XB0 + state.v * tk), Y(yk)); ctx.stroke(); ctx.restore();
        ball(X(0), Y(yk), br, T.figSoftViolet, T.figViolet, 0.55);
        ball(X(XB0 + state.v * tk), Y(yk), br, T.figSoftAmber, T.figAmber, 0.55);
        if (k > 0 && k % 2 === 0) {
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
          ctx.fillText(tk.toFixed(1) + ' s', X(0) - br - 4, Y(yk) + 4);
        }
      }
      // 현재 위치
      var t = state.t, yy = 0.5 * G * t * t, vy = G * t;
      var ax = X(0), bx = X(XB0 + state.v * t), py = Y(yy);
      ball(ax, py, br, T.figSoftViolet, T.figViolet, 1);
      ball(bx, py, br, T.figSoftAmber, T.figAmber, 1);
      if (t < TEND - 1e-6) {
        arrow(ax, py + br, ax, py + br + vy * av, T.figRed, 2.5, 8);
        arrow(bx, py + br, bx, py + br + vy * av, T.figRed, 2.5, 8);
        arrow(bx + br, py, bx + br + state.v * av, py, T.figBlue, 2.5, 8);
      }
      // 설명
      var nx = narrow ? 12 : area.x + area.w + 6, ny = narrow ? h - 74 : 70;
      var lines = [
        ['같은 시각 → 같은 높이', true, T.figInk],
        ['둘 다 1.00 s 만에 바닥에 닿는다', false, T.figInk],
        ['B의 수평 간격: ' + (state.v * FLASH).toFixed(2) + ' m (일정)', false, T.figInk],
      ];
      if (!narrow) lines.push(['', false, T.figInk], ['↓ 연직 방향 속도: 점점 커짐', false, T.figRed], ['→ 수평 방향 속도: 그대로', false, T.figBlue], ['', false, T.figInk], ['0.1초 간격 · 공기 저항 무시', false, T.figMuted]);
      lines.forEach(function (L, i) { if (L[0]) text(L[0], nx, ny + i * 20, T, { bold: L[1], size: L[1] ? 13 : 12, color: L[2] }); });
      if (narrow) text('↓ 연직 속도 커짐  → 수평 속도 그대로', nx, ny + 60, T, { size: 11, color: T.figMuted });
    }
    function ball(x, y, r, fill, stroke, alpha) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); ctx.restore();
    }

    function drawCannon(T) {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var M0 = 0.16;
      var Rd = Math.min((h - 40) / (2.85 + 2 * M0), (narrow ? w - 12 : w * 0.66) / (2 * (1.37 + M0)));
      var M = M0 * Rd;
      var cx = narrow ? w / 2 : w * 0.36, cy = 26 + Rd + M;
      function rd(r) { var a = r - RE; return Rd + a * Rd / RE + M * Math.min(1, Math.max(0, a / A0)); }
      function pt(th, r) { var q = rd(r); return [cx + q * Math.sin(th), cy - q * Math.cos(th)]; }
      // 지구
      ctx.beginPath(); ctx.arc(cx, cy, Rd, 0, Math.PI * 2); ctx.fillStyle = T.figSoftBlue; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = T.figBlue; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
      text('지구 중심', cx, cy + 18, T, { align: 'center', size: 12, color: T.figMuted });
      // 산 (높이 과장)
      ctx.beginPath(); ctx.moveTo(cx - Rd * Math.sin(0.12), cy - Rd * Math.cos(0.12));
      ctx.lineTo(cx - 3, cy - Rd - M); ctx.lineTo(cx + 3, cy - Rd - M);
      ctx.lineTo(cx + Rd * Math.sin(0.12), cy - Rd * Math.cos(0.12)); ctx.closePath();
      ctx.fillStyle = T.figSoftGreen; ctx.fill(); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.fillRect(cx - 7, cy - Rd - M - 5, 12, 5);
      text(narrow ? '높은 산(과장)' : '높은 산 (높이 과장)', cx - Rd * 0.35, cy - Rd - M - 8, T, { align: 'right', size: 11, color: T.figMuted });
      // 이전 궤적
      state.hist.forEach(function (v) {
        if (Math.abs(v - state.vl) < 1e-9) return;
        var P = path(v);
        trace(P.pts, P.pts.length - 1, T.figLine, 1.4, true);
        var last = P.pts[P.pts.length - 1], lp;
        if (P.end === 'land') lp = pt(last[0], RE + A0 * 2.2);
        else { var j = Math.floor(P.pts.length * 0.36), q = P.pts[j]; lp = pt(q[0], q[1]); lp = [lp[0] + (lp[0] - cx) / Rd * 14, lp[1] + (lp[1] - cy) / Rd * 14]; }
        text(v.toFixed(v * 100 % 10 ? 2 : 1), lp[0], lp[1] + 4, T, { align: 'center', size: 11, color: T.figMuted });
      });
      // 지금 궤적
      var P = path(state.vl), last = Math.max(1, Math.round(state.prog * (P.pts.length - 1)));
      if (state.prog < 1) trace(P.pts, P.pts.length - 1, T.figLine, 1, true);
      trace(P.pts, last, T.figAccent, 2.6, false);
      // 대포알, 중력(지구 중심 방향), 속도
      var bi = P.end === 'land' || state.prog < 1 ? last : Math.floor((P.pts.length - 1) * 0.1);
      var b = pt(P.pts[bi][0], P.pts[bi][1]), b2 = pt(P.pts[Math.min(bi + 1, P.pts.length - 1)][0], P.pts[Math.min(bi + 1, P.pts.length - 1)][1]);
      var b0 = pt(P.pts[Math.max(bi - 1, 0)][0], P.pts[Math.max(bi - 1, 0)][1]);
      var gx = cx - b[0], gy = cy - b[1], gl = Math.hypot(gx, gy), GL = Math.min(38, Rd * 0.3);
      if (!(P.end === 'land' && state.prog >= 1)) {
        var tx = b2[0] - b0[0], ty = b2[1] - b0[1], tl = Math.hypot(tx, ty) || 1;
        arrow(b[0], b[1], b[0] + tx / tl * GL, b[1] + ty / tl * GL, T.figBlue, 2.5, 8);
      }
      arrow(b[0], b[1], b[0] + gx / gl * GL, b[1] + gy / gl * GL, T.figRed, 2.8, 9);
      text('중력', b[0] + gx / gl * (GL + 12) - 2, b[1] + gy / gl * (GL + 12) + 4, T, { align: 'center', size: 12, bold: true, color: T.figRed });
      ctx.beginPath(); ctx.arc(b[0], b[1], 5, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
      // 설명
      if (!narrow) {
        var nx = w * 0.72, ny = 60;
        [['중력은 늘 지구 중심을 향한다', T.figRed, true], ['속력이 클수록 더 멀리 떨어진다', T.figInk, false], ['약 7.9 km/s: 떨어지는 만큼', T.figInk, false], ['지면도 휘어 지구를 계속 돈다', T.figInk, false], ['', 0, 0], ['회색 선: 이전 궤적 (km/s)', T.figMuted, false], ['파란 화살표: 속도', T.figBlue, false]]
          .forEach(function (L, i) { if (L[0]) text(L[0], nx, ny + i * 20, T, { size: 12, bold: L[2], color: L[1] }); });
      } else {
        text('회색 선: 이전 궤적(km/s) · 파란 화살표: 속도', 8, h - 8, T, { size: 11, color: T.figMuted });
      }
      function trace(pts, upto, color, lw, dashed) {
        ctx.save(); if (dashed) ctx.setLineDash([5, 4]);
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (var i = 0; i <= upto; i++) { var p = pt(pts[i][0], pts[i][1]); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
        ctx.stroke(); ctx.restore();
      }
    }

    api.onResize(draw);
    setTab(0);
  },
});
