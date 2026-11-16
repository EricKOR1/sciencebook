/* 물질과 에너지 3: 엔트로피 — 기체가 퍼지는 방향과 경우의 수, 그리고 자발성의 네 가지 경우(정성적) */
Sims.register('entropy-mixing', {
  title: '왜 저절로 퍼지기만 할까? — 경우의 수와 자발성',
  caption: '‘퍼져 나가기’에서 입자 수를 고르고 칸막이를 치워 보자. 입자 하나가 왼쪽에 있을 확률은 1/2이므로 N개가 모두 왼쪽에 모일 확률은 (1/2)ᴺ이다. 입자가 몇 개면 가끔 다시 모이지만, 100개만 되어도 사실상 0이고 실제 기체(10²³개 정도)에서는 결코 일어나지 않는다. ‘자발성 네 가지 경우’에서는 계의 엔트로피 변화와, 열의 출입이 주위에 주는 엔트로피 변화를 함께 저울질한다(막대 길이는 정성적인 비교이다).',
  init: function (api) {
    var NS = [2, 4, 6, 10, 20, 50, 100];
    var st = { tab: 'mix', N: 10, open: false, parts: [], back: 0, wasAll: true, simT: 0, dH: -1, dS: 1, temp: 5 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.5; }, label: '칸막이 상자 속 기체 입자와 경우의 수 그래프' });
    var ctx = cv.ctx;
    var r1 = api.readout(''), r2 = api.readout(''), r3 = api.readout(''), r4 = api.readout('');
    function rl(i, t) { var e = api.readouts.children[i]; if (e) e.firstChild.textContent = t; }

    var gt = api.group();
    var tabs = [api.button('퍼져 나가기', function () { setTab('mix'); }, { toggle: true, pressed: true, parent: gt }),
      api.button('자발성 네 가지 경우', function () { setTab('four'); }, { toggle: true, parent: gt })];
    // 퍼져 나가기
    var gm = api.group();
    var sN = api.slider({ id: 'entropy-mixing-n', label: '입자 수 N', min: 0, max: NS.length - 1, step: 1, value: 3, parent: gm,
      format: function (v) { return NS[v] + '개'; }, onInput: function (v) { st.N = NS[v]; reset(); } });
    var bOpen = api.button('칸막이 치우기', function () { if (st.open) reset(); else openWall(); }, { primary: true, parent: gm });
    var bStep = api.button('1초 지나기', function () { advance(1); draw(); }, { parent: gm });
    if (!api.reduced) bStep.style.display = 'none';
    // 네 가지 경우
    var gf = api.group();
    var bH = [api.button('발열 (ΔH < 0)', function () { st.dH = -1; four(); }, { toggle: true, pressed: true, parent: gf }),
      api.button('흡열 (ΔH > 0)', function () { st.dH = 1; four(); }, { toggle: true, parent: gf })];
    var gf2 = api.group();
    var bS = [api.button('흩어짐 증가 (ΔS > 0)', function () { st.dS = 1; four(); }, { toggle: true, pressed: true, parent: gf2 }),
      api.button('흩어짐 감소 (ΔS < 0)', function () { st.dS = -1; four(); }, { toggle: true, parent: gf2 })];
    var sT = api.slider({ id: 'entropy-mixing-t', label: '온도', min: 1, max: 9, step: 0.1, value: 5,
      format: function (v) { return v < 3.5 ? '낮다' : v > 6.5 ? '높다' : '중간'; }, onInput: function (v) { st.temp = v; four(); } });

    function setTab(t) {
      st.tab = t;
      tabs.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 0) === (t === 'mix') ? 'true' : 'false'); });
      gm.style.display = t === 'mix' ? '' : 'none';
      gf.style.display = gf2.style.display = sT.input.parentNode.style.display = t === 'four' ? '' : 'none';
      if (t === 'mix') { reset(); } else { loop.pause(); four(); }
    }

    // ── 퍼져 나가기 ──
    function reset() {
      st.open = false; st.back = 0; st.simT = 0; st.wasAll = true; bOpen.textContent = '칸막이 치우기';
      st.parts = [];
      for (var i = 0; i < st.N; i++) { var a = Math.random() * Math.PI * 2; st.parts.push({ x: 0.03 + Math.random() * 0.44, y: 0.03 + Math.random() * 0.94, vx: Math.cos(a), vy: Math.sin(a) }); }
      loop.pause(); mixReadouts(); draw();
    }
    function openWall() {
      st.open = true; bOpen.textContent = '처음으로';
      if (!api.reduced) loop.play(); else { advance(1); draw(); }
    }
    function advance(sec) {
      var n = Math.round(sec / 0.01);
      for (var i = 0; i < n; i++) step(0.01);
      mixReadouts();
    }
    function step(dt) {
      var sp = 0.35;
      st.parts.forEach(function (p) {
        p.x += p.vx * sp * dt; p.y += p.vy * sp * dt;
        var right = st.open ? 0.98 : 0.48;
        if (p.x < 0.02) { p.x = 0.04 - p.x; p.vx = Math.abs(p.vx); }
        if (p.x > right) { p.x = 2 * right - p.x; p.vx = -Math.abs(p.vx); }
        if (p.y < 0.02) { p.y = 0.04 - p.y; p.vy = Math.abs(p.vy); }
        if (p.y > 0.98) { p.y = 1.96 - p.y; p.vy = -Math.abs(p.vy); }
        if (Math.random() < dt * 0.6) { var a = Math.random() * Math.PI * 2; p.vx = Math.cos(a); p.vy = Math.sin(a); }
      });
      if (st.open) {
        st.simT += dt;
        var all = leftCount() === st.N;
        if (all && !st.wasAll) st.back++;
        st.wasAll = all;
      }
    }
    function leftCount() { var c = 0; st.parts.forEach(function (p) { if (p.x < 0.5) c++; }); return c; }
    function probText(N) {
      if (N <= 20) return '1/' + Math.pow(2, N).toLocaleString('ko-KR');
      var e = N * Math.LN2 / Math.LN10, ex = Math.ceil(e), m = Math.pow(10, ex - e);
      return m.toFixed(1) + ' × 10⁻' + String(ex).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }).join('');
    }
    function mixReadouts() {
      rl(0, '입자 수'); rl(1, '왼쪽 : 오른쪽'); rl(2, '모두 왼쪽에 있을 확률'); rl(3, '다시 모두 왼쪽에 모인 횟수');
      var L = leftCount();
      r1.set(st.N + '개'); r2.set(L + ' : ' + (st.N - L)); r3.set(probText(st.N));
      r4.set(st.open ? st.back + '번 (' + st.simT.toFixed(0) + '초 동안)' : '칸막이를 치워 보자');
    }
    var loop = api.loop(function (dt) {
      if (st.tab !== 'mix') return;
      var n = Math.max(1, Math.round(dt / 0.01));
      for (var i = 0; i < n; i++) step(dt / n);
      mixReadouts(); draw();
    });
    loop.pause();

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { a: { x: 0, y: 0, w: w, h: h * 0.48 }, b: { x: 0, y: h * 0.5, w: w, h: h * 0.5 } };
      return { a: { x: 0, y: 0, w: w * 0.5, h: h }, b: { x: w * 0.53, y: 0, w: w * 0.47, h: h } };
    }
    function draw() {
      var T = api.tokens();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (st.tab === 'mix') { var L = layout(); drawBox(T, L.a); drawChart(T, L.b); } else drawFour(T);
    }
    function drawBox(T, r) {
      var bx = r.x + 8, by = r.y + 26, bw = r.w - 20, bh = r.h - 50;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(st.open ? '칸막이를 치운 뒤' : '처음: 모든 입자가 왼쪽에', bx, r.y + 16);
      ctx.fillStyle = T.figPaper; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = T.figSoftBlue; ctx.globalAlpha = 0.6; ctx.fillRect(bx, by, bw / 2, bh); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      ctx.strokeStyle = st.open ? T.figLine : T.figInk; ctx.lineWidth = st.open ? 1 : 4; ctx.setLineDash(st.open ? [4, 5] : []);
      ctx.beginPath(); ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, by + bh); ctx.stroke(); ctx.setLineDash([]);
      var rad = st.N <= 10 ? 7 : st.N <= 20 ? 5.5 : st.N <= 50 ? 4 : 3;
      st.parts.forEach(function (p) { ctx.fillStyle = p.x < 0.5 ? T.figBlue : T.figRed; ctx.beginPath(); ctx.arc(bx + p.x * bw, by + p.y * bh, rad, 0, 7); ctx.fill(); });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('왼쪽', bx + bw / 4, by + bh + 15); ctx.fillText('오른쪽', bx + bw * 3 / 4, by + bh + 15);
    }
    function lnC(n, k) { var s = 0; for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; }
    function drawChart(T, r) {
      var N = st.N, L = r.x + 44, R = r.x + r.w - 10, Tp = r.y + 46, B = r.y + r.h - 36;
      var pr = []; var mx = 0;
      for (var k = 0; k <= N; k++) { var p = Math.exp(lnC(N, k) - N * Math.LN2); pr.push(p); if (p > mx) mx = p; }
      var yMax = Math.ceil(mx * 10 + 0.001) / 10;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('왼쪽 입자 수에 따른 확률(경우의 수 ÷ 2ᴺ)', r.x + 2, r.y + 16);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('모두 왼쪽: 경우의 수 1 / 전체 ' + (N <= 20 ? Math.pow(2, N).toLocaleString('ko-KR') : '2^' + N), r.x + 2, r.y + 32);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono;
      for (var g = 0; g <= 2; g++) { var yv = yMax * g / 2, yy = B - yv / yMax * (B - Tp); ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(R, yy); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted; ctx.fillText(yv.toFixed(2), L - 4, yy + 4); }
      var bw = (R - L) / (N + 1), cur = leftCount();
      pr.forEach(function (p, k) {
        var x = L + k * bw, hh = p / yMax * (B - Tp);
        ctx.fillStyle = k === cur ? T.figAccent : k === N ? T.figRed : T.figLine;
        ctx.fillRect(x + bw * 0.12, B - hh, Math.max(1, bw * 0.76), hh);
      });
      // 모두 왼쪽 표시
      var xN = L + N * bw + bw / 2;
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xN, B - 2); ctx.lineTo(xN, B - 22); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('모두 왼쪽: ' + probText(N), xN + 4, B - 26);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('0', L + bw / 2, B + 13); ctx.fillText(String(N), xN, B + 13); ctx.fillText(String(N / 2), L + (N / 2) * bw + bw / 2, B + 13);
      ctx.fillText('왼쪽에 있는 입자 수 (파란 막대: 지금 상태)', (L + R) / 2, B + 28);
    }

    // ── 네 가지 경우 ──
    var CASES = {
      '-1,1': { n: 'Ⅰ', v: '모든 온도에서 자발적', ex: '예: 과산화 수소의 분해, 대부분의 연소' },
      '1,-1': { n: 'Ⅱ', v: '모든 온도에서 비자발적', ex: '예: 이산화 탄소와 물이 저절로 포도당이 되는 반응' },
      '-1,-1': { n: 'Ⅲ', v: '낮은 온도에서 자발적', ex: '예: 0 °C 아래에서 물이 언다, 암모니아 합성' },
      '1,1': { n: 'Ⅳ', v: '높은 온도에서 자발적', ex: '예: 0 °C 위에서 얼음이 녹는다, 탄산 칼슘의 열분해' },
    };
    function four() {
      bH.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 0) === (st.dH < 0) ? 'true' : 'false'); });
      bS.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 0) === (st.dS > 0) ? 'true' : 'false'); });
      var v = vals(), c = CASES[st.dH + ',' + st.dS];
      rl(0, '경우'); rl(1, '계의 흩어짐'); rl(2, '열 출입 → 주위'); rl(3, '지금 온도에서');
      r1.set(c.n + ' — ' + c.v); r2.set(st.dS > 0 ? '증가' : '감소');
      r3.set(st.dH < 0 ? '열을 내보내 주위의 엔트로피 증가' : '열을 빼앗아 주위의 엔트로피 감소');
      r4.set(v.tot > 0 ? '전체 엔트로피 증가 → 자발적' : '전체 엔트로피 감소 → 비자발적');
      draw();
    }
    function vals() { var sys = st.dS * 1, sur = -st.dH * 5 / st.temp; return { sys: sys, sur: sur, tot: sys + sur }; }
    function drawFour(T) {
      var v = vals(), c = CASES[st.dH + ',' + st.dS], w = cv.w, h = cv.h, narrow = w < 560;
      var L = narrow ? 16 : 40, R = w - (narrow ? 16 : 40), mid = (L + R) / 2, unit = (R - L) / 2 / 5.5;
      ctx.fillStyle = T.figInk; ctx.font = '600 15px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('경우 ' + c.n + ': ' + c.v, L, 26);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.fillText(c.ex, L, 46);
      var rows = [
        { lab: '계의 엔트로피 변화 (흩어짐)', val: v.sys, col: T.figTeal },
        { lab: '주위의 엔트로피 변화 (열 출입 때문)', val: v.sur, col: T.figAmber },
        { lab: '전체 엔트로피 변화 (계 + 주위)', val: v.tot, col: v.tot > 0 ? T.figGreen : T.figRed },
      ];
      var top = 70, rh = (h - top - 60) / 3;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mid, top); ctx.lineTo(mid, top + rh * 3); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('← 감소', mid - 6, top + rh * 3 + 16);
      ctx.textAlign = 'left'; ctx.fillText('증가 →', mid + 6, top + rh * 3 + 16);
      rows.forEach(function (rw, i) {
        var y = top + i * rh, bh = Math.min(26, rh * 0.38), len = Math.max(-5.4, Math.min(5.4, rw.val)) * unit;
        ctx.fillStyle = T.figInk; ctx.font = (i === 2 ? '600 ' : '') + '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(rw.lab, L, y + 16);
        ctx.fillStyle = rw.col; ctx.fillRect(Math.min(mid, mid + len), y + 24, Math.abs(len), bh);
        if (i === 2) { ctx.strokeStyle = T.figLine; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(L, y + 4); ctx.lineTo(R, y + 4); ctx.stroke(); ctx.setLineDash([]); }
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('같은 양의 열이라도 온도가 낮을수록 주위의 엔트로피를 크게 바꾼다.', L, h - 12);
    }

    api.onResize(draw);
    setTab('mix');
  },
});
