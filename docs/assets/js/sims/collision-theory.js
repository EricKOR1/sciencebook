/* 물질과 에너지 4: 충돌 모형과 활성화 에너지 — 농도·온도·촉매가 반응 속도를 바꾸는 방법 */
Sims.register('collision-theory', {
  title: '충돌과 언덕 — 농도·온도·촉매로 반응 속도 바꾸기',
  caption: '농도를 높이면 충돌 횟수가 늘고, 온도를 높이면 분포 곡선이 오른쪽으로 넓게 퍼져 활성화 에너지(Eₐ)보다 큰 에너지를 가진 분자의 비율(색칠한 넓이)이 크게 는다. 촉매는 Eₐ 선을 왼쪽으로 옮긴다. 테두리가 굵은 입자는 Eₐ 이상의 에너지를 가진 입자로, 이런 입자가 다른 종류의 입자와 부딪치면 반응(번쩍임)하는 것으로 단순화했다. 충돌 방향은 따지지 않았고, 반응 속도는 처음 조건을 1로 둔 상대값인 정성적 모형이다.',
  init: function (api) {
    var T0 = 300, EA = 3.5, EAC = 2.0, N0 = 10;   // 에너지 단위: 300 K에서의 kT
    var st = { T: 300, n: 10, cat: false, parts: [], flash: [], col: 0, eff: 0, time: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.5; }, label: '반응 용기 속 입자와 운동 에너지 분포 곡선' });
    var ctx = cv.ctx;
    var rF = api.readout('Eₐ 이상인 분자의 비율'), rC = api.readout('충돌 횟수(상대)'), rV = api.readout('반응 속도(상대)'), rS = api.readout('용기 속 충돌');

    api.slider({ id: 'collision-theory-n', label: '농도(입자 수)', min: 4, max: 20, step: 1, value: 10, format: function (v) { return 'A, B 각 ' + v + '개'; }, onInput: function (v) { st.n = v; build(); update(); } });
    api.slider({ id: 'collision-theory-t', label: '온도', min: 250, max: 500, step: 5, value: 300, format: function (v) { return v + ' K'; }, onInput: function (v) { var old = st.T; st.T = v; rescale(old); update(); } });
    var cb = api.button('촉매 넣기', function () { st.cat = !st.cat; cb.setAttribute('aria-pressed', st.cat ? 'true' : 'false'); st.parts.forEach(mark); update(); }, { toggle: true });
    api.button('세기 다시 시작', function () { st.col = 0; st.eff = 0; st.time = 0; update(); });

    // 3차원 맥스웰–볼츠만 에너지 분포에서 E > Ea 인 비율
    function erfc(x) { var t = 1 / (1 + 0.5 * x), y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return y; }
    function frac(ea, T) { var x = ea * T0 / T; return erfc(Math.sqrt(x)) + 2 * Math.sqrt(x / Math.PI) * Math.exp(-x); }
    function dens(E, T) { var kT = T / T0; return 2 / Math.sqrt(Math.PI) * Math.pow(kT, -1.5) * Math.sqrt(E) * Math.exp(-E / kT); }
    function ea() { return st.cat ? EAC : EA; }
    function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    function sampleE(T) { var a = gauss(), b = gauss(), c = gauss(); return (T / T0) * (a * a + b * b + c * c) / 2; }
    function mark(p) { p.hot = p.E >= ea(); }
    function build() {
      var keep = { A: [], B: [] };
      st.parts.forEach(function (p) { keep[p.k].push(p); });
      st.parts = [];
      ['A', 'B'].forEach(function (k) {
        for (var i = 0; i < st.n; i++) {
          var p = keep[k][i];
          if (!p) { var ang = Math.random() * Math.PI * 2; p = { k: k, x: 0.05 + Math.random() * 0.9, y: 0.05 + Math.random() * 0.9, dx: Math.cos(ang), dy: Math.sin(ang), E: sampleE(st.T) }; mark(p); }
          st.parts.push(p);
        }
      });
    }
    function rescale(old) { st.parts.forEach(function (p) { p.E *= st.T / old; mark(p); }); }
    function rates() {
      var c = Math.pow(st.n / N0, 2) * Math.sqrt(st.T / T0), f = frac(ea(), st.T), f0 = frac(EA, T0);
      return { c: c, f: f, v: c * f / f0 };
    }
    function update() {
      var r = rates();
      rF.set((r.f * 100).toFixed(1) + ' %'); rC.set('× ' + r.c.toFixed(2)); rV.set('× ' + r.v.toFixed(2));
      rS.set(st.col ? '유효 ' + st.eff + ' / 전체 ' + st.col : '세는 중…');
      draw();
    }

    var loop = api.loop(function (dt) {
      var sp = 0.12;
      st.time += dt;
      st.parts.forEach(function (p) {
        var v = sp * Math.sqrt(Math.max(p.E, 0.05));
        p.x += p.dx * v * dt; p.y += p.dy * v * dt;
        if (p.x < 0.03) { p.x = 0.06 - p.x; p.dx = Math.abs(p.dx); } if (p.x > 0.97) { p.x = 1.94 - p.x; p.dx = -Math.abs(p.dx); }
        if (p.y < 0.03) { p.y = 0.06 - p.y; p.dy = Math.abs(p.dy); } if (p.y > 0.97) { p.y = 1.94 - p.y; p.dy = -Math.abs(p.dy); }
      });
      var rr = 0.035;
      for (var i = 0; i < st.parts.length; i++) for (var j = i + 1; j < st.parts.length; j++) {
        var a = st.parts[i], b = st.parts[j];
        if (a.k === b.k) continue;
        var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < rr * 2 && d > 0) {
          var nx = dx / d, ny = dy / d;
          if ((b.dx - a.dx) * nx + (b.dy - a.dy) * ny >= 0) continue;   // 이미 멀어지는 중
          var da = a.dx * nx + a.dy * ny, db = b.dx * nx + b.dy * ny;
          a.dx -= 2 * da * nx; a.dy -= 2 * da * ny; b.dx -= 2 * db * nx; b.dy -= 2 * db * ny;
          st.col++;
          if (a.hot || b.hot) { st.eff++; st.flash.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0.5 }); }
        }
      }
      if (Math.random() < dt * 0.4) { var q = st.parts[Math.floor(Math.random() * st.parts.length)]; q.E = sampleE(st.T); mark(q); }   // 에너지 주고받기를 단순하게 흉내
      st.flash = st.flash.filter(function (f) { f.t -= dt; return f.t > 0; });
      rS.set(st.col ? '유효 ' + st.eff + ' / 전체 ' + st.col : '세는 중…');
      draw();
    });
    if (api.reduced) loop.pause();

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { a: { x: 0, y: 0, w: w, h: h * 0.45 }, b: { x: 0, y: h * 0.47, w: w, h: h * 0.53 } };
      return { a: { x: 0, y: 0, w: w * 0.42, h: h }, b: { x: w * 0.45, y: 0, w: w * 0.55, h: h } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawVessel(T, L.a); drawDist(T, L.b);
    }
    function drawVessel(T, r) {
      var s = Math.min(r.w - 16, r.h - 40), bx = r.x + (r.w - s) / 2, by = r.y + 26;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('반응 용기 (A + B → 생성물)', bx, r.y + 16);
      ctx.fillStyle = T.figPaper; ctx.fillRect(bx, by, s, s); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.strokeRect(bx, by, s, s);
      if (st.cat) { ctx.fillStyle = T.figSoftGreen; ctx.fillRect(bx + 2, by + s - 10, s - 4, 8); }
      var rad = Math.max(4, s * 0.035);
      st.flash.forEach(function (f) { ctx.globalAlpha = f.t * 2; ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(bx + f.x * s, by + f.y * s, rad * (3.5 - f.t * 3), 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      st.parts.forEach(function (p) {
        ctx.fillStyle = p.k === 'A' ? T.figBlue : T.figRed;
        ctx.beginPath(); ctx.arc(bx + p.x * s, by + p.y * s, rad, 0, 7); ctx.fill();
        if (p.hot) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5; ctx.stroke(); }
      });
      var ly = by + s + 15, lx = bx;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      [[T.figBlue, 'A', false], [T.figRed, 'B', false], [T.figPaper, 'Eₐ 이상', true]].concat(st.cat ? [[T.figSoftGreen, '촉매', false]] : []).forEach(function (it) {
        ctx.fillStyle = it[0]; ctx.beginPath(); ctx.arc(lx + 5, ly - 4, 5, 0, 7); ctx.fill();
        if (it[2]) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5; ctx.stroke(); }
        ctx.fillStyle = T.figMuted; ctx.fillText(it[1], lx + 13, ly); lx += 24 + ctx.measureText(it[1]).width;
      });
    }
    function drawDist(T, r) {
      var L = r.x + 40, R = r.x + r.w - 12, Tp = r.y + 34, B = r.y + r.h - 40, EM = 7, YM = 0.62;
      var sx = function (E) { return L + E / EM * (R - L); }, sy = function (y) { return B - y / YM * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('분자 운동 에너지 분포', r.x + 4, r.y + 16);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(L, Tp - 6); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('운동 에너지 →', (L + R) / 2, B + 16);
      ctx.save(); ctx.translate(r.x + 14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('분자 수 →', 0, 0); ctx.restore();
      var e = ea();
      // 색칠: Ea 이상
      ctx.fillStyle = T.figSoftRed; ctx.beginPath(); ctx.moveTo(sx(e), sy(0));
      for (var E = e; E <= EM; E += 0.05) ctx.lineTo(sx(E), sy(dens(E, st.T)));
      ctx.lineTo(sx(EM), sy(0)); ctx.closePath(); ctx.fill();
      function curve(Tk, col, dash, w) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var i = 0; i <= 200; i++) { var E2 = EM * i / 200; var y = dens(E2, Tk); if (i) ctx.lineTo(sx(E2), sy(y)); else ctx.moveTo(sx(E2), sy(y)); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (st.T !== T0) curve(T0, T.figLine, [5, 4], 1.5);
      curve(st.T, T.figAccent, null, 2.6);
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(EA), Tp); ctx.lineTo(sx(EA), B); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('Eₐ', sx(EA) + 4, Tp + 10);
      if (st.cat) {
        ctx.strokeStyle = T.figGreen; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(sx(EAC), Tp + 18); ctx.lineTo(sx(EAC), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figGreen; ctx.fillText('촉매가 있을 때 Eₐ', sx(EAC) + 4, Tp + 30);
      }
      var f = frac(e, st.T);
      ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('색칠한 넓이 = ' + (f * 100).toFixed(1) + ' %', R, B - 10 - (B - Tp) * 0.25);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(st.T !== T0 ? '파란 실선: ' + st.T + ' K / 회색 점선: 300 K' : '파란 실선: 300 K', R, Tp - 14);
    }

    api.onResize(draw);
    build(); update();
    if (!api.reduced) loop.play();
  },
});
