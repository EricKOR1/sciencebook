/* 5-3 온실효과 강화: 온실기체가 늘면 우주로 나가는 복사가 잠시 줄고, 지표 온도가 올라 새 복사 평형에 이른다 */
Sims.register('greenhouse', {
  title: '두꺼워진 담요 — 온실기체 농도와 새로운 복사 평형',
  caption: '이산화 탄소 농도를 올려 보자. 대기가 흡수하는 지구 복사가 늘어 우주로 빠져나가는 에너지가 잠시 줄고(들어옴 > 나감), 쌓인 에너지로 지표 온도가 오른다. 온도가 오르면 지표가 더 많은 복사를 내보내므로 결국 나가는 에너지가 다시 들어오는 에너지(태양 복사 중 흡수한 70)와 같아지는 더 높은 온도에서 새 평형을 이룬다. 빛 알갱이의 수와 그래프의 높낮이, 변화 속도는 설명을 위해 단순화·과장한 상대값이며, 실제 온도 예측값이 아니다.',
  init: function (api) {
    var BASE = 280, TAU = 3.2, SENS = 1 / Math.log(2);
    var st = { ppm: BASE, T: 0, hist: [], packets: [], flash: [], spawnSW: 0, spawnIR: 0, clock: 0, sampleAcc: 0 };
    var HIST_N = 360, SAMPLE = 0.05;   // 18초 분량
    function teq() { return SENS * Math.log(st.ppm / BASE); }
    function imbalance() { return (teq() - st.T) / SENS; }   // 들어옴 − 나감 (상대값)
    function pAbs() { return 1 - 0.10 * Math.pow(420 / st.ppm, 1.5); }   // 420 ppm에서 약 0.9 (= 104/116)
    function fillHist() { st.hist = []; for (var i = 0; i < HIST_N; i++) st.hist.push({ T: st.T, N: imbalance() }); }
    function pushHist() { st.hist.push({ T: st.T, N: imbalance() }); if (st.hist.length > HIST_N) st.hist.shift(); }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.6; }, label: '태양 복사, 지구 복사, 대기 역복사가 오가는 장면과 에너지·온도 그래프' });
    var ctx = cv.ctx;
    var rC = api.readout('CO₂ 농도');
    var rE = api.readout('들어오는 에너지 vs 나가는 에너지');
    var rT = api.readout('지표 온도');

    var slider = api.slider({ id: 'greenhouse-ppm', label: '대기 중 이산화 탄소 농도', min: 280, max: 800, step: 10, value: BASE,
      format: function (v) { return v + ' ppm' + (v === 280 ? ' (산업혁명 전)' : v >= 410 && v <= 430 ? ' (현재 수준)' : ''); },
      onInput: function (v) { setPpm(v); } });
    var g = api.group();
    api.button('280 ppm · 산업혁명 전', function () { slider.set(280); }, { parent: g });
    api.button('420 ppm · 현재', function () { slider.set(420); }, { parent: g });
    api.button('560 ppm · 미래의 예', function () { slider.set(560); }, { parent: g });

    function setPpm(v) {
      st.ppm = v;
      if (api.reduced) {   // 움직임 줄이기: 새 평형까지의 변화를 한 번에 계산해 보여 준다
        for (var i = 0; i < HIST_N; i++) { relax(SAMPLE); pushHist(); }
      }
      readouts(); draw();
    }
    function relax(dt) { st.T += (teq() - st.T) * (1 - Math.exp(-dt / TAU)); }

    var loop = api.loop(function (dt) {
      relax(dt);
      st.sampleAcc += dt;
      while (st.sampleAcc >= SAMPLE) { st.sampleAcc -= SAMPLE; pushHist(); }
      movePackets(dt);
      readouts(); draw();
    });

    function readouts() {
      rC.set(st.ppm + ' ppm');
      var n = imbalance();
      rE.set(Math.abs(n) < 0.015 ? '같다 → 복사 평형' : n > 0 ? '나가는 쪽이 적다 → 에너지가 쌓임' : '나가는 쪽이 많다 → 에너지가 빠짐');
      var d = teq() - st.T;
      rT.set(Math.abs(d) < 0.01 ? (st.ppm === BASE ? '변화 없음(기준)' : '더 높은 온도에서 일정(새 평형)') : d > 0 ? '오르는 중 ↑' : '내려가는 중 ↓');
    }

    /* ── 장면 배치 ── */
    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { scene: { x: 0, y: 0, w: w, h: h * 0.53 }, graph: { x: 0, y: h * 0.56, w: w, h: h * 0.44 } }
        : { scene: { x: 0, y: 0, w: w * 0.58, h: h }, graph: { x: w * 0.62, y: 0, w: w * 0.38, h: h } };
    }
    function geo(r) {
      return {
        spaceB: r.y + r.h * 0.17, atmT: r.y + r.h * 0.22, atmB: r.y + r.h * 0.62, surf: r.y + r.h * 0.84,
        sun: { x: r.x + r.w * 0.25, y: r.y + r.h * 0.085 }, cloud: { x: r.x + r.w * 0.3, y: r.y + r.h * 0.34 },
      };
    }
    function seeded(n, seed) { var a = [], s = seed; for (var i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; var u = s / 233280; s = (s * 9301 + 49297) % 233280; a.push([u, s / 233280]); } return a; }
    var molSpots = seeded(70, 17);

    /* ── 빛 알갱이 ── */
    function rnd() { return Math.random(); }
    function spawnSW(G, r) {
      var x0 = G.sun.x - 6 + rnd() * 14, y0 = G.sun.y + 14;
      var tx = r.x + r.w * (0.26 + rnd() * 0.16), ty = G.surf;
      var len = Math.hypot(tx - x0, ty - y0);
      var refl = rnd(), mode = refl < 0.23 ? 'cloud' : refl < 0.30 ? 'ground' : 'absorb';
      st.packets.push({ kind: 'sw', x: x0, y: y0, dx: (tx - x0) / len, dy: (ty - y0) / len, mode: mode, turnY: mode === 'cloud' ? G.cloud.y + (rnd() - 0.5) * 14 : ty });
    }
    function spawnIR(G, r) {
      var x = r.x + r.w * (0.46 + rnd() * 0.5);
      var abs = rnd() < pAbs();
      st.packets.push({ kind: 'ir', x: x, y: G.surf - 4, dx: 0, dy: -1, absAt: abs ? G.atmT + 8 + rnd() * (G.atmB - G.atmT - 16) : null });
    }
    function movePackets(dt) {
      var L = layout(), r = L.scene, G = geo(r), sp = r.h * 0.42;
      st.spawnSW += dt * 3.4; st.spawnIR += dt * 3.9 * (1 + 0.16 * st.T);
      while (st.spawnSW >= 1) { st.spawnSW -= 1; spawnSW(G, r); }
      while (st.spawnIR >= 1) { st.spawnIR -= 1; spawnIR(G, r); }
      st.packets = st.packets.filter(function (p) {
        p.x += p.dx * sp * dt; p.y += p.dy * sp * dt;
        if (p.kind === 'sw') {
          if (p.dy > 0 && p.y >= p.turnY) {
            if (p.mode === 'absorb') return false;
            p.dy = -p.dy; p.dx = -Math.abs(p.dx) * 0.6; p.kind = 'swr'; p.y = p.turnY;
          }
        } else if (p.kind === 'ir' && p.absAt !== null && p.y <= p.absAt) {
          st.flash.push({ x: p.x, y: p.y, life: 0.35 });
          // 다시 방출: 아래(대기 역복사) 쪽이 위(우주)보다 많다 (지구 열수지의 97 : 58)
          if (rnd() < 97 / 155) { p.kind = 'back'; p.dy = 1; } else { p.kind = 'up'; }
          p.absAt = null;
        } else if (p.kind === 'back' && p.y >= G.surf) return false;
        return p.y > r.y - 20 && p.x > r.x - 20 && p.x < r.x + r.w + 20;
      });
      st.flash = st.flash.filter(function (f) { f.life -= dt; return f.life > 0; });
    }

    /* ── 그리기 ── */
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, L.scene); drawGraph(T, L.graph);
    }
    function mix(a, b, t) {
      function p(c) { c = c.replace('#', ''); if (c.length === 3) c = c.replace(/./g, '$&$&'); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
      try { var A = p(a), B = p(b); return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')'; } catch (e) { return b; }
    }
    function drawScene(T, r) {
      var G = geo(r);
      // 대기 띠
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(r.x, G.atmT, r.w, G.atmB - G.atmT);
      // 지표
      var heat = Math.max(0, Math.min(1, st.T / 1.6));
      ctx.fillStyle = mix(T.figSoftGreen, T.figSoftRed, heat); ctx.fillRect(r.x, G.surf, r.w, r.y + r.h - G.surf);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x, G.surf); ctx.lineTo(r.x + r.w, G.surf); ctx.stroke();
      // 이름표
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      ctx.fillText('우주', r.x + r.w - 6, r.y + 14);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText('대기', r.x + 6, G.atmT + 16);
      ctx.fillText('지표', r.x + 6, r.y + r.h - 8);
      // 온실기체 분자
      var nMol = Math.round(st.ppm / 14);
      for (var i = 0; i < nMol && i < molSpots.length; i++) {
        var mx = r.x + 8 + molSpots[i][0] * (r.w - 16), my = G.atmT + 26 + molSpots[i][1] * (G.atmB - G.atmT - 32);
        if (mx < r.x + 112 && my < G.atmT + 40) my += 22;   // 이름표 자리 피하기
        ctx.fillStyle = T.figViolet;
        ctx.beginPath(); ctx.arc(mx - 4, my, 2, 0, Math.PI * 2); ctx.arc(mx + 4, my, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx, my, 2.6, 0, Math.PI * 2); ctx.fill();
      }
      // 태양과 구름
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(G.sun.x, G.sun.y, Math.min(16, r.h * 0.05), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
      var cx = G.cloud.x, cy = G.cloud.y, cs = Math.min(1, r.w / 380);
      ctx.beginPath(); ctx.arc(cx - 16 * cs, cy + 2, 10 * cs, 0, Math.PI * 2); ctx.arc(cx, cy - 4, 13 * cs, 0, Math.PI * 2); ctx.arc(cx + 17 * cs, cy + 2, 10 * cs, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 고정 안내 화살표(멈춘 화면에서도 흐름이 보이게)
      var s = Math.min(1, r.w / 420);
      wave(T.figAmber, G.sun.x + 4, G.sun.y + 20, r.x + r.w * 0.36, G.surf - 6, 7, 2.2, 0.55);
      wave(T.figAmber, G.cloud.x - 20, G.cloud.y - 12, r.x + r.w * 0.09, r.y + r.h * 0.05, 7, 2, 0.45);
      var xIR = r.x + r.w * 0.56, xUp = r.x + r.w * 0.72, xBack = r.x + r.w * 0.88;
      wave(T.figRed, xIR, G.surf - 6, xIR, r.y + 8, 18, 2.2, 0.5);
      wave(T.figRed, xUp, G.atmB - 12, xUp, r.y + 8, 18, 2.2, 0.5);
      wave(T.figRed, xBack, G.atmT + 30, xBack, G.surf - 6, 18, 2.2, 0.5);
      // 라벨
      ctx.font = Math.round(11 + s) + 'px ' + T.fontBody; ctx.textAlign = 'left';
      label(T, '태양 복사', G.sun.x + 22, G.sun.y - 2, T.figAmber, 'left');
      label(T, '(짧은 파장)', G.sun.x + 22, G.sun.y + 12, T.figAmber, 'left');
      label(T, '반사', r.x + 6, G.spaceB - 2, T.figAmber, 'left');
      ctx.font = '11px ' + T.fontBody;
      label(T, '● 온실기체 분자', r.x + 6, G.atmT + 32, T.figViolet, 'left');
      ctx.font = Math.round(11 + s) + 'px ' + T.fontBody;
      label(T, '지구 복사', xIR, G.surf + 16, T.figRed, 'center');
      label(T, '(긴 파장)', xIR, G.surf + 30, T.figRed, 'center');
      label(T, '대기 역복사', xBack, G.surf + 16, T.figRed, 'center');
      label(T, '통과', xIR + 6, G.spaceB - 2, T.figRed, 'left');
      label(T, '대기가 방출', xUp + 6, G.spaceB - 2, T.figRed, 'left');
      // 흡수 순간 빛남
      st.flash.forEach(function (f) {
        ctx.globalAlpha = Math.max(0, f.life / 0.35);
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      });
      // 움직이는 빛 알갱이
      st.packets.forEach(function (p) {
        var short = p.kind === 'sw' || p.kind === 'swr';
        var col = short ? T.figAmber : T.figRed;
        wave(col, p.x - p.dx * 24, p.y - p.dy * 24, p.x, p.y, short ? 6 : 14, 2, 1);
      });
    }
    function label(T, text, x, y, col, align) {
      ctx.textAlign = align; ctx.lineWidth = 3; ctx.strokeStyle = T.surface; ctx.strokeText(text, x, y);
      ctx.fillStyle = col; ctx.fillText(text, x, y);
    }
    /* 물결 모양 화살(파장을 눈으로 비교) */
    function wave(col, x0, y0, x1, y1, lam, lw, alpha) {
      var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 2) return;
      var ux = dx / len, uy = dy / len, nx = -uy, ny = ux, amp = lam < 10 ? 2.6 : 3.6;
      ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var s = 0; s <= len - 6; s += 1) {
        var o = Math.sin(s / lam * Math.PI * 2) * amp * Math.min(1, s / 6, (len - 6 - s) / 6);
        var px = x0 + ux * s + nx * o, py = y0 + uy * s + ny * o;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ux * 8 + nx * 4, y1 - uy * 8 + ny * 4); ctx.lineTo(x1 - ux * 8 - nx * 4, y1 - uy * 8 - ny * 4); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }

    function drawGraph(T, r) {
      var L = r.x + 14, R = r.x + r.w - 8, gap = 34, top0 = r.y + 50, hh = (r.h - (top0 - r.y) - gap - 22) / 2;
      var A = { top: top0, bot: top0 + hh }, B = { top: top0 + hh + gap, bot: r.y + r.h - 20 };
      var n = st.hist.length, sx = function (i) { return L + i / (HIST_N - 1) * (R - L); };
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText('지구 전체의 에너지 출입', L, r.y + 13);
      ctx.fillText('지표 온도 (상대값)', L, B.top - 10);
      ctx.font = '11px ' + T.fontBody;
      ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, r.y + 25); ctx.lineTo(L + 20, r.y + 25); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figAmber; ctx.fillText('들어옴: 흡수한 태양 복사', L + 26, r.y + 29);
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(L, r.y + 40); ctx.lineTo(L + 20, r.y + 40); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.fillText('나감: 우주로 가는 지구 복사', L + 26, r.y + 44);
      [A, B].forEach(function (P) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, P.top); ctx.lineTo(L, P.bot); ctx.lineTo(R, P.bot); ctx.stroke();
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('시간 →', R, B.bot + 15);
      // 위 그래프: 들어옴(일정) vs 나감
      var yIn = A.top + (A.bot - A.top) * 0.18, span = (A.bot - A.top) * 0.74;
      var yOut = function (N) { return yIn + Math.max(-0.2, Math.min(1.05, N)) / 1.05 * span; };
      ctx.beginPath(); ctx.moveTo(L, yIn);
      for (var i = 0; i < n; i++) ctx.lineTo(sx(i), yOut(st.hist[i].N));
      ctx.lineTo(sx(n - 1), yIn); ctx.closePath(); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      ctx.beginPath(); for (var j = 0; j < n; j++) { if (j === 0) ctx.moveTo(sx(j), yOut(st.hist[j].N)); else ctx.lineTo(sx(j), yOut(st.hist[j].N)); }
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.setLineDash([6, 5]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, yIn); ctx.lineTo(R, yIn); ctx.stroke(); ctx.setLineDash([]);
      var lastN = 0; for (var q = n - 1; q >= 0; q--) { if (Math.abs(st.hist[q].N) > 0.02) { lastN = st.hist[q].N; break; } }
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'right';
      if (lastN > 0) ctx.fillText('색칠한 차이만큼 에너지가 쌓임', R, A.bot - 4);
      else if (lastN < 0) ctx.fillText('색칠한 차이만큼 에너지가 빠져나감', R, A.bot - 4);
      // 아래 그래프: 온도
      var yT = function (t) { return B.bot - 18 - Math.max(0, Math.min(1.6, t)) / 1.6 * (B.bot - B.top - 22); };
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, yT(0)); ctx.lineTo(R, yT(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText('산업혁명 전(280 ppm) 수준', R, yT(0) + 13);
      ctx.beginPath(); for (var k = 0; k < n; k++) { if (k === 0) ctx.moveTo(sx(k), yT(st.hist[k].T)); else ctx.lineTo(sx(k), yT(st.hist[k].T)); }
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx(n - 1), yT(st.hist[n - 1].T), 4, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
    }

    fillHist();
    // 멈춘 첫 화면에도 빛 알갱이가 보이도록 미리 조금 진행
    (function () { for (var i = 0; i < 60; i++) movePackets(1 / 30); })();
    api.onResize(function () { st.packets = []; for (var i = 0; i < 60; i++) movePackets(1 / 30); draw(); });
    readouts(); draw();
  },
});
