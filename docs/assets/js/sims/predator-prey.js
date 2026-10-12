/* 5-2 생태계 평형: 포식자(스라소니)–피식자(눈신토끼) 개체 수의 주기적 변동과 교란 후 회복 */
Sims.register('predator-prey', {
  title: '눈신토끼와 스라소니 — 오르내리며 유지되는 균형',
  caption: '시간을 흐르게 하면 토끼(피식자)가 먼저 늘고, 조금 늦게 스라소니(포식자)가 최고점에 이른다. 사냥이나 가뭄 버튼으로 생태계를 흔들어 보자. 균형이 잠시 크게 깨졌다가 몇 주기 뒤 다시 비슷한 오르내림으로 돌아온다(음성 되먹임). 이 그래프는 두 종과 먹이 풀만 있다고 단순화한 수학 모형으로 계산한 상대값이며, 실제 눈신토끼·스라소니 자료나 주기(약 10년)를 그대로 나타낸 것은 아니다. 두 종의 세로 눈금은 서로 다르다.',
  init: function (api) {
    /* 단순화한 포식자–피식자 모형(먹이 풀의 한계가 있는 형태). 모형 시간 S 단위 = 1년 → 한 주기 약 10년 */
    var K0 = 2.6, E = 0.5, M = 0.2, S = 2.283, WIN = 40, DT = 0.02;
    var PREY_SCALE = 100, PRED_SCALE = 10, PREY_MAX = 300, PRED_MAX = 30;
    var st = { N: 1, P: 1, t: 0, droughtUntil: -1, lastEvt: -99, hist: [], events: [] };

    function deriv(N, P, K) { var g = N / (1 + N); return [N * (1 - N / K) - g * P, E * g * P - M * P]; }
    function stepModel(dYear) {
      var n = Math.max(1, Math.round(dYear * S / DT)), h = dYear * S / n;
      for (var i = 0; i < n; i++) {
        var K = st.t < st.droughtUntil ? K0 * 0.45 : K0, N = st.N, P = st.P;
        var a = deriv(N, P, K), b = deriv(N + h / 2 * a[0], P + h / 2 * a[1], K),
          c = deriv(N + h / 2 * b[0], P + h / 2 * b[1], K), d = deriv(N + h * c[0], P + h * c[1], K);
        st.N = Math.max(1e-4, N + h / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]));
        st.P = Math.max(1e-4, P + h / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1]));
        st.t += h / S;
      }
    }
    var SAMPLE = 0.1, acc = 0;   // 0.1년마다 기록
    function advance(years) {
      acc += years;
      var n = Math.floor(acc / SAMPLE + 1e-9); acc -= n * SAMPLE;
      for (var i = 0; i < n; i++) { stepModel(SAMPLE); st.hist.push({ t: st.t, N: st.N, P: st.P, dr: st.t < st.droughtUntil }); }
      var cut = st.t - WIN - 1;
      while (st.hist.length && st.hist[0].t < cut) st.hist.shift();
      st.events = st.events.filter(function (e) { return e.t > cut; });
    }
    function reset() {
      st.N = 1; st.P = 1; st.t = 0; st.droughtUntil = -1; st.lastEvt = -99; st.hist = []; st.events = [];
      stepModel(300);            // 처음 흔들림이 가라앉아 규칙적인 주기에 들어설 때까지 미리 계산
      st.t = 0; st.droughtUntil = -1; st.lastEvt = -99;
      st.hist.push({ t: 0, N: st.N, P: st.P, dr: false });
      advance(WIN);
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.22 : 0.5; }, label: '작은 생태계 장면과 토끼·스라소니 개체 수 그래프' });
    var ctx = cv.ctx;
    var rT = api.readout('지난 시간');
    var rN = api.readout('눈신토끼(상대값)');
    var rP = api.readout('스라소니(상대값)');
    var rS = api.readout('지금 상태');

    var playBtn = api.button(api.reduced ? '10년 뒤로 넘기기' : '▶ 시간 흐르게 하기', function () {
      if (api.reduced) { advance(10); refresh(); return; }
      if (loop.playing || loop.wanted) { loop.pause(); setPlay(false); } else { loop.play(); setPlay(true); }
    }, { primary: true });
    api.button('사냥꾼이 스라소니를 잡음', function () {
      st.P *= 0.3; st.lastEvt = st.t; st.events.push({ t: st.t, kind: 'hunt' }); after();
    });
    api.button('가뭄으로 먹이 풀 감소', function () {
      st.droughtUntil = st.t + 4; st.lastEvt = st.t; st.events.push({ t: st.t, kind: 'drought' }); after();
    });
    api.button('처음 상태로', function () { reset(); loop.pause(); setPlay(false); refresh(); });

    function setPlay(on) { if (!api.reduced) playBtn.textContent = on ? '❚❚ 멈추기' : '▶ 시간 흐르게 하기'; }
    function after() {
      if (api.reduced) { advance(25); refresh(); return; }
      loop.play(); setPlay(true); refresh();
    }

    var loop = api.loop(function (dt) { advance(Math.min(dt, 0.05) * 1.6); refresh(); });
    loop.pause();

    function status() {
      if (st.t < st.droughtUntil) return '가뭄: 먹이 풀 부족';
      if (st.t - st.lastEvt < 20) return '균형이 흔들림 → 회복 중';
      return '주기적으로 오르내림(평형)';
    }
    function refresh() {
      rT.set(Math.floor(st.t) + '년');
      rN.set(Math.round(st.N * PREY_SCALE));
      rP.set(Math.round(st.P * PRED_SCALE));
      rS.set(status());
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { scene: { x: 0, y: 0, w: w, h: h * 0.38 }, graph: { x: 0, y: h * 0.41, w: w, h: h * 0.59 } }
        : { scene: { x: 0, y: 0, w: w * 0.33, h: h }, graph: { x: w * 0.36, y: 0, w: w * 0.64, h: h } };
    }
    function draw() {
      var T = api.tokens();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var L = layout();
      drawScene(T, L.scene); drawGraph(T, L.graph);
    }

    /* 고정된 자리(난수 씨앗) — 개체 수가 바뀌어도 같은 자리에서 나타나고 사라진다 */
    function seeded(n, seed) {
      var a = [], s = seed;
      for (var i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; var u = s / 233280; s = (s * 9301 + 49297) % 233280; a.push([u, s / 233280]); }
      return a;
    }
    var hareSpots = seeded(30, 7), lynxSpots = seeded(12, 91), grassSpots = seeded(26, 33);

    function drawScene(T, r) {
      var pad = 8, x0 = r.x + pad, y0 = r.y + 24, w = r.w - pad * 2, h = r.h - 24 - pad;
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      rr(x0, y0, w, h, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('작은 생태계 (지금 모습)', r.x + pad, r.y + 15);
      var dry = st.t < st.droughtUntil;
      // 풀
      var grassN = dry ? 9 : grassSpots.length;
      for (var i = 0; i < grassN; i++) {
        var gx = x0 + 10 + grassSpots[i][0] * (w - 20), gy = y0 + h * 0.2 + grassSpots[i][1] * (h * 0.75);
        ctx.strokeStyle = dry ? T.figAmber : T.figGreen; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(gx - 4, gy); ctx.lineTo(gx - 6, gy - 8); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 10); ctx.moveTo(gx + 4, gy); ctx.lineTo(gx + 6, gy - 8); ctx.stroke();
      }
      var nH = Math.min(hareSpots.length, Math.round(st.N * PREY_SCALE / 12));
      var nL = Math.min(lynxSpots.length, Math.round(st.P * PRED_SCALE / 2.5));
      var sc = Math.max(0.75, Math.min(1.1, w / 230));
      for (var j = 0; j < nH; j++) hare(T, x0 + 14 + hareSpots[j][0] * (w - 28), y0 + 18 + hareSpots[j][1] * (h - 30), sc);
      for (var k = 0; k < nL; k++) lynx(T, x0 + 20 + lynxSpots[k][0] * (w - 40), y0 + 22 + lynxSpots[k][1] * (h - 38), sc);
      // 범례
      var ly = y0 + h - 10;
      ctx.fillStyle = T.figPanel; rr(x0 + 6, ly - 16, Math.min(w - 12, 214), 22, 6); ctx.fill();
      hare(T, x0 + 18, ly - 4, 0.8);
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('토끼', x0 + 28, ly);
      lynx(T, x0 + 74, ly - 5, 0.8);
      ctx.fillText('스라소니', x0 + 88, ly);
      ctx.strokeStyle = dry ? T.figAmber : T.figGreen; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x0 + 148, ly); ctx.lineTo(x0 + 148, ly - 9); ctx.stroke();
      ctx.fillText('풀', x0 + 154, ly);
      if (dry) {
        ctx.fillStyle = T.figAmber; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('가뭄', x0 + w - 8, y0 + 16);
      }
    }
    function hare(T, x, y, s) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(6, -3, 3.5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(6, -9, 1.4, 4, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    function lynx(T, x, y, s) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = T.figSoftRed; ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, 2, 11, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(10, -4, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -8); ctx.lineTo(7.5, -13); ctx.lineTo(9.5, -8.5); ctx.moveTo(11.5, -8.5); ctx.lineTo(13, -13); ctx.lineTo(14, -7.5); ctx.stroke();
      ctx.restore();
    }

    function drawGraph(T, r) {
      var L = r.x + 44, R = r.x + r.w - 30, Tp = r.y + 50, B = r.y + r.h - 36;
      var t1 = Math.max(WIN, st.t), t0 = t1 - WIN;
      var sx = function (t) { return L + (t - t0) / WIN * (R - L); };
      var syN = function (v) { return B - Math.min(v * PREY_SCALE, PREY_MAX) / PREY_MAX * (B - Tp); };
      var syP = function (v) { return B - Math.min(v * PRED_SCALE, PRED_MAX) / PRED_MAX * (B - Tp); };
      // 가뭄 구간
      var inDr = null;
      st.hist.forEach(function (p, i) {
        if (p.dr && inDr === null) inDr = p.t;
        if ((!p.dr || i === st.hist.length - 1) && inDr !== null) {
          var a = Math.max(t0, inDr), b = p.t;
          if (b > t0) { ctx.fillStyle = T.figSoftAmber; ctx.fillRect(sx(a), Tp, sx(b) - sx(a), B - Tp); }
          inDr = null;
        }
      });
      // 격자와 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono;
      for (var i = 0; i <= 3; i++) {
        var y = B - i / 3 * (B - Tp);
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
        ctx.fillStyle = T.figBlue; ctx.textAlign = 'right'; ctx.fillText(String(PREY_MAX * i / 3), L - 5, y + 4);
        ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.fillText(String(PRED_MAX * i / 3), R + 5, y + 4);
      }
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      for (var yr = Math.ceil(t0 / 10) * 10; yr <= t1 + 1e-6; yr += 10) ctx.fillText(yr + '', sx(yr), B + 14);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('시간 (년)', (L + R) / 2, B + 30);
      // 축 이름(위쪽 범례)
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('● 눈신토끼(피식자) — 왼쪽 눈금', r.x + 4, r.y + 13);
      ctx.fillStyle = T.figRed; ctx.fillText('● 스라소니(포식자) — 오른쪽 눈금', r.x + 4, r.y + 30);
      // 교란 표시
      st.events.forEach(function (e) {
        if (e.t < t0) return;
        var x = sx(e.t);
        ctx.setLineDash([4, 3]); ctx.strokeStyle = e.kind === 'hunt' ? T.figRed : T.figAmber; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, Tp); ctx.lineTo(x, B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = ctx.strokeStyle; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = x > R - 40 ? 'right' : 'left';
        ctx.fillText(e.kind === 'hunt' ? '사냥' : '가뭄', x + (x > R - 40 ? -3 : 3), Tp + 12);
      });
      // 곡선
      line(T.figBlue, function (p) { return syN(p.N); }, 2.4);
      line(T.figRed, function (p) { return syP(p.P); }, 2.4);
      function line(col, fy, lw) {
        ctx.beginPath(); var started = false;
        st.hist.forEach(function (p) { if (p.t < t0) return; var x = sx(p.t), y = fy(p); if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); });
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
      }
      // 현재 점
      var last = st.hist[st.hist.length - 1];
      if (last) {
        [[syN(last.N), T.figBlue], [syP(last.P), T.figRed]].forEach(function (q) {
          ctx.beginPath(); ctx.arc(sx(last.t), q[0], 4, 0, Math.PI * 2); ctx.fillStyle = q[1]; ctx.fill();
        });
      }
      // 봉우리 시간차 표시: 교란 영향이 없는 가장 최근의 토끼 봉우리와 그 뒤 스라소니 봉우리
      var pk = findPeaks(t0);
      if (pk) {
        var xa = sx(pk.n.t), xb = sx(pk.p.t), ya = syN(pk.n.N), yb = syP(pk.p.P);
        var yArrow = Math.max(Tp + 26, Math.min(ya, yb) - 16);
        ctx.setLineDash([2, 3]); ctx.lineWidth = 1; ctx.strokeStyle = T.figMuted;
        ctx.beginPath(); ctx.moveTo(xa, ya - 5); ctx.lineTo(xa, yArrow - 4); ctx.moveTo(xb, yb - 5); ctx.lineTo(xb, yArrow - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(xa, yArrow); ctx.lineTo(xb, yArrow); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xb, yArrow); ctx.lineTo(xb - 6, yArrow - 4); ctx.lineTo(xb - 6, yArrow + 4); ctx.closePath(); ctx.fillStyle = T.figInk; ctx.fill();
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
        ctx.fillText('포식자 최고점이 늦게', Math.min(R - 52, Math.max(L + 52, (xa + xb) / 2)), yArrow - 8);
      }
    }
    function findPeaks(t0) {
      var h = st.hist, nPk = null;
      for (var i = h.length - 2; i > 0; i--) {
        if (h[i].t < t0 + 1) break;
        if (h[i].N > h[i - 1].N && h[i].N >= h[i + 1].N) {
          // 그 뒤 스라소니 봉우리
          for (var j = i + 1; j < h.length - 1; j++) {
            if (h[j].P > h[j - 1].P && h[j].P >= h[j + 1].P) { nPk = { n: h[i], p: h[j] }; break; }
          }
          if (nPk) return nPk;
        }
      }
      return null;
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    reset();
    api.onResize(draw);
    refresh();
  },
});
