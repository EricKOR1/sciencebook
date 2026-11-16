/* 일반물리학 4 구름 운동: 빗면 구르기 경주 — 관성 모멘트 계수 β에 따라 가속도가 g sinθ/(1+β)로 달라진다 */
Sims.register('u-rolling-race', {
  title: '빗면 구르기 경주 — 관성 모멘트가 가속도를 정한다',
  caption: '경사각을 정하고 \'출발\'을 눌러 보자. 미끄러지지 않고 구르면 a = g sinθ/(1+β)(β = I/MR²)이어서 질량·반지름과 관계없이 모양만으로 순서가 정해진다: 마찰 없이 미끄러지는 상자 > 속이 찬 구 > 원기둥 > 고리. 아래 막대는 잃은 위치 에너지가 병진·회전 운동 에너지로 나뉘는 비율이다. 정지 마찰 계수를 β/(1+β)·tanθ보다 작게 하면 그 물체는 구르면서 미끄러지고(운동 마찰 계수 = 정지 마찰 계수로 가정) 일부 에너지가 열이 된다. 빗면 길이 3.0 m, 공기 저항과 구름 저항은 무시했고 화면은 실제의 1/2 속도로 재생한다.',
  init: function (api) {
    var G = 9.8, S = 3.0, SPEED = 0.5;
    var objs = [
      { name: '미끄러지는 상자', short: '상자', beta: 0, box: true, col: 'figAmber' },
      { name: '속이 찬 구', short: '구', beta: 0.4, col: 'figBlue' },
      { name: '속이 찬 원기둥', short: '원기둥', beta: 0.5, col: 'figGreen' },
      { name: '얇은 고리', short: '고리', beta: 1, col: 'figRed' },
    ];
    var st = { th: 20, mu: 0.4, t: 0, running: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.66; }, label: '네 물체가 나란한 빗면을 내려오는 경주와 에너지 분배 막대' });
    var ctx = cv.ctx;
    var rMu = api.readout('구르기에 필요한 최소 μs (구 / 원기둥 / 고리)');
    var rOrd = api.readout('도착 순서');

    api.slider({ id: 'u-rolling-race-th', label: '경사각 θ', min: 5, max: 40, step: 1, value: st.th,
      format: function (v) { return v + '°'; }, onInput: function (v) { st.th = v; reset(); } });
    api.slider({ id: 'u-rolling-race-mu', label: '정지 마찰 계수 μs', min: 0.02, max: 0.6, step: 0.01, value: st.mu,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.mu = v; reset(); } });
    var g = api.group();
    api.button('출발', function () { start(); }, { primary: true, parent: g });
    api.button('처음으로', function () { reset(); }, { parent: g });

    function phys(o) {
      var th = st.th * Math.PI / 180, s = Math.sin(th), c = Math.cos(th);
      var need = o.box ? 0 : o.beta / (1 + o.beta) * Math.tan(th);
      var a, aR, slip = false;
      if (o.box) { a = G * s; aR = 0; }
      else if (st.mu >= need) { a = G * s / (1 + o.beta); aR = a; }
      else { slip = true; a = G * (s - st.mu * c); aR = st.mu * G * c / o.beta; }
      var T = Math.sqrt(2 * S / a);
      return { a: a, aR: aR, slip: slip, need: need, T: T };
    }
    function reset() { st.t = 0; st.running = false; loop.pause(); update(); }
    function start() {
      st.t = 0;
      if (api.reduced) { st.t = phys(objs[1]).T; st.running = false; update(); return; }
      st.running = true; loop.play();
    }
    function maxT() { return Math.max.apply(null, objs.map(function (o) { return phys(o).T; })); }
    var loop = api.loop(function (dt) {
      if (!st.running) return;
      st.t += dt * SPEED;
      if (st.t >= maxT()) { st.t = maxT(); st.running = false; loop.pause(); }
      update();
    });
    loop.pause();

    function update() {
      var P = objs.map(phys);
      rMu.set(P.slice(1).map(function (p) { return p.need.toFixed(2); }).join(' / '));
      var order = objs.map(function (o, i) { return { n: o.short, T: P[i].T }; }).sort(function (a, b) { return a.T - b.T; });
      rOrd.set(order.map(function (x) { return x.n; }).join(' → '));
      draw(P);
    }

    function draw(P) {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var th = st.th * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
      var topH = h * (narrow ? 0.5 : 0.56);
      var gap = narrow ? 34 : 40, rad = 11, n = objs.length;
      var x0 = narrow ? 76 : 136, y0 = 10;
      var availW = w - x0 - 24, availH = topH - (y0 + rad * 2 + 6) - (n - 1) * gap - 26;
      var Lpx = Math.min(availW / c, availH / s);
      // 레인
      ctx.font = '12px ' + T.fontBody;
      objs.forEach(function (o, i) {
        var ly = y0 + rad * 2 + 6 + i * gap;
        var ex = x0 + Lpx * c, ey = ly + Lpx * s;
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, ly); ctx.lineTo(ex, ey); ctx.stroke();
        // 결승 표시
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ex, ey - 16); ctx.lineTo(ex, ey + 4); ctx.stroke();
        ctx.fillStyle = T[o.col]; ctx.textAlign = 'right';
        ctx.fillText(narrow ? o.short : o.name, x0 - rad - 6, ly - 4);
        // 위치
        var p = P[i], tt = Math.min(st.t, p.T);
        var d = 0.5 * p.a * tt * tt, dpx = d / S * Lpx;
        var bx = x0 + dpx * c, by = ly + dpx * s;
        var cx = bx + s * rad, cy = by - c * rad;
        ctx.save(); ctx.translate(cx, cy);
        if (o.box) {
          ctx.rotate(th);
          ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
          ctx.fillRect(-rad, -rad, rad * 2, rad * 2); ctx.strokeRect(-rad, -rad, rad * 2, rad * 2);
        } else {
          var phi = 0.5 * p.aR * tt * tt / (rad / Lpx * S);   // 화면 반지름에 맞춘 회전각(실제 각과 같은 비율)
          ctx.rotate(phi);
          ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.fillStyle = o.beta === 1 ? T.figPanel : T.figPaper; ctx.fill();
          ctx.lineWidth = o.beta === 1 ? 3.5 : 2; ctx.strokeStyle = T[o.col]; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -rad); ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.arc(0, -rad * 0.6, 2.2, 0, Math.PI * 2); ctx.fillStyle = T[o.col]; ctx.fill();
        }
        ctx.restore();
        // 도착 시간
        ctx.textAlign = 'right'; ctx.font = '12px ' + T.fontMono;
        if (st.t >= p.T - 1e-9) { ctx.fillStyle = T[o.col]; ctx.fillText(p.T.toFixed(2) + ' s', ex - 6, ey - 20); }
        if (p.slip) { ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('미끄러짐', bx + 26, by - 4); }
        ctx.font = '12px ' + T.fontBody;
      });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = '12px ' + T.fontMono;
      ctx.fillText('t = ' + st.t.toFixed(2) + ' s', narrow ? 8 : 12, topH - 4);
      // 아래: 표와 에너지 막대
      var by0 = topH + 14, rowH = (h - by0 - 30) / n;
      var colA = narrow ? 8 : 12, barX = narrow ? 112 : 330, barW = w - barX - 14;
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      if (!narrow) { ctx.fillText('물체 (β)', colA, by0); ctx.fillText('가속도 a', colA + 150, by0); ctx.fillText('도착 시간', colA + 236, by0); }
      ctx.fillText('잃은 위치 에너지의 분배', barX, by0);
      objs.forEach(function (o, i) {
        var p = P[i], y = by0 + 10 + i * rowH, mid = y + rowH / 2;
        ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T[o.col]; ctx.textAlign = 'left';
        if (narrow) {
          ctx.fillText(o.short + ' β=' + fmtB(o.beta), colA, mid - 2);
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
          ctx.fillText(p.a.toFixed(2) + ' m/s²', colA, mid + 13);
        } else {
          ctx.fillText(o.name + ' (' + fmtB(o.beta) + ')', colA, mid + 4);
          ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontMono;
          ctx.fillText(p.a.toFixed(2) + ' m/s²', colA + 150, mid + 4);
          ctx.fillText(p.T.toFixed(2) + ' s', colA + 236, mid + 4);
        }
        // 에너지 (전체 mgh = g S sinθ 기준 비율)
        var tt = Math.min(st.t, p.T), v = p.a * tt, vr = p.aR * tt;
        var E = G * S * s;
        var kt = 0.5 * v * v / E, kr = o.box ? 0 : 0.5 * o.beta * vr * vr / E;
        var lost = 0.5 * p.a * tt * tt / S;          // 잃은 위치 에너지 비율
        var heat = Math.max(0, lost - kt - kr);
        var bh = Math.min(18, rowH - 10), byy = mid - bh / 2;
        ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        ctx.fillRect(barX, byy, barW, bh); ctx.strokeRect(barX, byy, barW, bh);
        var xx = barX;
        [[kt, T.figBlue], [kr, T.figViolet], [heat, T.figRed]].forEach(function (seg) {
          var ww = seg[0] * barW; if (ww <= 0) return;
          ctx.fillStyle = seg[1]; ctx.fillRect(xx, byy, ww, bh); xx += ww;
        });
        if (lost > 0.999 && !o.box) {
          ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
          ctx.fillText('회전 ' + Math.round(kr * 100) + '%', barX + barW - 4, byy - 3);
        }
      });
      // 범례
      var ly2 = h - 10, lx = narrow ? colA : barX;
      var legend = narrow ? [['병진 K', T.figBlue], ['회전 K', T.figViolet], ['열(미끄러질 때)', T.figRed]]
        : [['병진 운동 에너지', T.figBlue], ['회전 운동 에너지', T.figViolet], ['열(미끄러질 때)', T.figRed]];
      legend.forEach(function (L) {
        ctx.fillStyle = L[1]; ctx.fillRect(lx, ly2 - 9, 10, 10);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(L[0], lx + 14, ly2); lx += ctx.measureText(L[0]).width + 26;
      });
    }
    function fmtB(b) { return b === 0 ? '0' : b === 0.4 ? '2/5' : b === 0.5 ? '1/2' : '1'; }

    api.onResize(update);
    update();
  },
});
