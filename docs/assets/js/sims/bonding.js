/* 2-4 이온 결합과 공유 결합: ① 전자껍질 모형에서 전자 이동(이온 결합)·전자쌍 공유(공유 결합) ② 상태에 따른 전기 전도성 */
Sims.register('bonding', {
  title: '전자를 주고받을까, 함께 나눌까? — 결합과 전기 전도성',
  caption: '① [결합 만들기]에서 물질을 고르고 [결합시키기]를 누르면, 소금은 Na의 전자 1개가 Cl로 이동해 이온이 되고, 물과 산소는 원자들이 전자쌍을 함께 가진다. ② [전기가 통할까?]에서 상태를 바꿔 보면, 이온이 있어도 고체에서는 제자리에 묶여 전류가 흐르지 않고, 녹이거나 물에 녹여 이온이 움직일 수 있을 때만 전구가 켜진다. 전자껍질 모형과 입자의 크기·개수는 설명을 위해 단순화했고, 전극에서 일어나는 변화는 나타내지 않았다.',
  init: function (api) {
    var state = { tab: 1, mol: 'salt', p: 0, playing: false, mat: 'solid', on: true };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.12 : 0.52; }, label: '전자껍질 모형의 결합 과정과 전기 전도성 실험 장치' });
    var ctx = cv.ctx;

    /* ── 조작 ── */
    var gTab = api.group();
    var tabBtns = [
      api.button('① 결합 만들기', function () { setTab(1); }, { toggle: true, pressed: true, parent: gTab }),
      api.button('② 전기가 통할까?', function () { setTab(2); }, { toggle: true, pressed: false, parent: gTab }),
    ];
    var g1 = api.group();
    var MOLS = [['salt', '소금 (NaCl)'], ['water', '물 (H₂O)'], ['oxygen', '산소 (O₂)']];
    var molBtns = MOLS.map(function (m) {
      return api.button(m[1], function () { state.mol = m[0]; state.p = 0; state.playing = false; refresh(); }, { toggle: true, pressed: m[0] === state.mol, parent: g1 });
    });
    var playBtn = api.button('결합시키기 ▶', function () {
      if (state.p >= 1) { state.p = 0; state.playing = false; refresh(); return; }
      if (api.reduced) { state.p = 1; refresh(); return; }
      state.playing = true; loop.play(); refresh();
    }, { primary: true, parent: g1 });

    var g2 = api.group();
    var MATS = [['solid', '염화 나트륨 고체'], ['melt', '염화 나트륨 액체(녹은 상태)'], ['aq', '염화 나트륨 수용액'], ['sugar', '설탕 수용액']];
    var matBtns = MATS.map(function (m) {
      return api.button(m[1], function () { state.mat = m[0]; resetParticles(); refresh(); }, { toggle: true, pressed: m[0] === state.mat, parent: g2 });
    });
    var swBtn = api.button('전압 끄기', function () { state.on = !state.on; refresh(); }, { primary: true, parent: g2 });

    var r1a = api.readout('결합의 종류'), r1b = api.readout('전자는'), r1c = api.readout('만들어지는 입자');
    var r2a = api.readout('전하를 띤 입자'), r2b = api.readout('그 입자가 이동할 수 있나'), r2c = api.readout('전류');
    var spans = [].slice.call(api.readouts.children);

    function setTab(t) {
      state.tab = t;
      tabBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i + 1 === t ? 'true' : 'false'); });
      refresh();
    }
    function refresh() {
      var t = state.tab;
      g1.style.display = t === 1 ? '' : 'none';
      g2.style.display = t === 2 ? '' : 'none';
      spans.forEach(function (s, i) { s.style.display = (i < 3) === (t === 1) ? '' : 'none'; });
      molBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', MOLS[i][0] === state.mol ? 'true' : 'false'); });
      matBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', MATS[i][0] === state.mat ? 'true' : 'false'); });
      playBtn.textContent = state.p >= 1 ? '처음으로 ↺' : '결합시키기 ▶';
      playBtn.disabled = state.playing;
      swBtn.textContent = state.on ? '전압 끄기' : '전압 켜기';
      swBtn.setAttribute('aria-pressed', state.on ? 'true' : 'false');
      if (state.mol === 'salt') { r1a.set('이온 결합'); r1b.set('Na → Cl로 1개 이동'); r1c.set('Na⁺, Cl⁻ (이온)'); }
      else if (state.mol === 'water') { r1a.set('공유 결합'); r1b.set('O–H마다 전자쌍 1개 공유'); r1c.set('H₂O 분자'); }
      else { r1a.set('공유 결합 (이중 결합)'); r1b.set('전자쌍 2개 공유'); r1c.set('O₂ 분자'); }
      var ion = state.mat !== 'sugar', mobile = state.mat === 'melt' || state.mat === 'aq';
      r2a.set(ion ? '있음 (Na⁺, Cl⁻)' : '없음 (설탕 분자는 중성)');
      r2b.set(!ion ? '— (전하가 없음)' : mobile ? '예' : '아니요 (결정 속에 고정)');
      r2c.set(!state.on ? '전압 꺼짐' : (ion && mobile) ? '흐른다 (전구 켜짐)' : '흐르지 않는다');
      if (t === 2 && !api.reduced) loop.play();
      draw();
    }

    /* ── 움직임 ── */
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var parts = [], waters = [];
    function resetParticles() {
      parts = []; waters = [];
      var m = state.mat, i;
      if (m === 'solid') return;
      if (m === 'sugar') { for (i = 0; i < 7; i++) parts.push({ k: 'sugar', u: rnd(), v: 0.1 + rnd() * 0.8, a: rnd() * 6.3, rot: rnd() * 6.3 }); }
      else {
        var n = m === 'melt' ? 13 : 8;
        for (i = 0; i < n; i++) { parts.push({ k: 'na', u: rnd(), v: 0.08 + rnd() * 0.84, a: rnd() * 6.3, f: 1 }); parts.push({ k: 'cl', u: rnd(), v: 0.08 + rnd() * 0.84, a: rnd() * 6.3, f: 1 }); }
      }
      if (m === 'aq' || m === 'sugar') for (i = 0; i < 34; i++) waters.push({ u: rnd(), v: 0.05 + rnd() * 0.9, a: rnd() * 6.3, rot: rnd() * 6.3 });
    }
    var tAll = 0;
    var loop = api.loop(function (dt) {
      tAll += dt;
      if (state.tab === 1) {
        if (state.playing) {
          state.p = Math.min(1, state.p + dt / 3.2);
          if (state.p >= 1) { state.playing = false; loop.pause(); refresh(); return; }
        } else { loop.pause(); }
      } else {
        var mobile = (state.mat === 'melt' || state.mat === 'aq') && state.on;
        parts.forEach(function (q) {
          q.a += (rnd() - 0.5) * 5 * dt;
          var drift = mobile ? (q.k === 'na' ? -0.09 : 0.09) : 0;
          q.u += (Math.cos(q.a) * 0.06 + drift) * dt; q.v += Math.sin(q.a) * 0.1 * dt;
          if (q.rot != null) q.rot += dt * 0.6;
          if (q.v < 0.08) { q.v = 0.08; q.a = -q.a; } if (q.v > 0.92) { q.v = 0.92; q.a = -q.a; }
          if (q.f < 1) q.f = Math.min(1, q.f + dt * 1.5);
          if (q.u < 0 || q.u > 1) {
            if (mobile) { q.u = 0.15 + rnd() * 0.7; q.v = 0.1 + rnd() * 0.8; q.f = 0; }   // 전극에 닿은 이온 대신 새 이온을 그림(전극 변화는 생략)
            else { q.u = Math.max(0, Math.min(1, q.u)); q.a = Math.PI - q.a; }
          }
        });
        waters.forEach(function (q) {
          q.a += (rnd() - 0.5) * 5 * dt; q.rot += dt * 1.5;
          q.u += Math.cos(q.a) * 0.06 * dt; q.v += Math.sin(q.a) * 0.08 * dt;
          if (q.u < 0) q.u += 1; if (q.u > 1) q.u -= 1; if (q.v < 0.04) q.v = 0.96; if (q.v > 0.96) q.v = 0.04;
        });
      }
      draw();
    });

    /* ── 공통 그리기 도구 ── */
    function ease(x) { return x <= 0 ? 0 : x >= 1 ? 1 : (1 - Math.cos(Math.PI * x)) / 2; }
    function seg(p, a, b) { return ease((p - a) / (b - a)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function P(c, r, deg) { var a = deg * Math.PI / 180; return [c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)]; }
    function dot(x, y, r, col, T) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1; ctx.stroke(); }
    function text(t, x, y, col, size, align, weight) {
      var T = api.tokens();
      ctx.fillStyle = col; ctx.font = (weight || '') + ' ' + (size || 12) + 'px ' + T.fontBody; ctx.textAlign = align || 'center';
      ctx.fillText(t, x, y);
    }
    function arrowTo(x0, y0, x1, y1, col, dash) {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.8;
      if (dash) ctx.setLineDash([5, 4]);
      var a = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - 6 * Math.cos(a), y1 - 6 * Math.sin(a)); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - 9 * Math.cos(a - 0.4), y1 - 9 * Math.sin(a - 0.4)); ctx.lineTo(x1 - 9 * Math.cos(a + 0.4), y1 - 9 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    }
    function wrapLines(t, maxW) {
      var words = t.split(' '), lines = [], cur = '';
      words.forEach(function (w) { var test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; });
      if (cur) lines.push(cur); return lines;
    }
    function shellDraw(c, r, T, alpha) {
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function nucleus(c, sym, rr, T, col) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c[0], c[1], rr, 0, 7); ctx.fill();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.stroke();
      text(sym, c[0], c[1] + 5, T.figInk, Math.max(12, Math.round(rr * 0.85)), 'center', '700');
    }
    function innerElectrons(c, R, n, col, er, T, off) {
      for (var i = 0; i < n; i++) { var p = P(c, R, (off || 0) + 360 * i / n); dot(p[0], p[1], er, col, T); }
    }
    function pairAt(c, R, deg, er) { var d = Math.asin(Math.min(0.9, 1.35 * er / R)) * 180 / Math.PI; return [P(c, R, deg + d), P(c, R, deg - d)]; }

    function draw() {
      var T = api.tokens();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (state.tab === 1) drawBond(T); else drawCond(T);
    }

    /* ── ① 결합 만들기 ── */
    function drawBond(T) {
      var w = cv.w, h = cv.h, p = state.p;
      var wf = state.mol === 'salt' ? 11.8 : state.mol === 'water' ? 10.4 : 9.8;
      var s = Math.max(14, Math.min((h - 120) / 5.9, (w - 16) / wf, 46));
      var r1 = s, r2 = 1.7 * s, r3 = 2.4 * s, er = Math.max(3, s * 0.13), cx = w / 2;
      var ionic = state.mol === 'salt';
      text(ionic ? '이온 결합 — 전자를 주고받는다' : '공유 결합 — 전자쌍을 함께 가진다', 4, 16, T.figInk, 14, 'left', '600');
      var bottomLines = [], legend = [];
      if (state.mol === 'salt') {
        var cE = T.figAmber, cC = T.figBlue;
        legend = [[cE, 'Na의 전자'], [cC, 'Cl의 전자']];
        var D0 = 2 * r3 + 2.2 * s, D1 = r2 + r3 + 1.7 * s;
        var D = lerp(D0, D1, seg(p, 0.6, 0.95));
        var cy = 46 + r3;
        var na = [cx - D / 2, cy], cl = [cx + D / 2, cy];
        var moved = seg(p, 0.05, 0.45), ionized = seg(p, 0.45, 0.6);
        // 껍질
        shellDraw(na, r1, T); shellDraw(na, r2, T); shellDraw(na, r3, T, 1 - ionized);
        shellDraw(cl, r1, T); shellDraw(cl, r2, T); shellDraw(cl, r3, T);
        nucleus(na, 'Na', s * 0.45, T, T.figSoftAmber); nucleus(cl, 'Cl', s * 0.45, T, T.figSoftBlue);
        innerElectrons(na, r1, 2, cE, er, T, 90); innerElectrons(na, r2, 8, cE, er, T, 22.5);
        innerElectrons(cl, r1, 2, cC, er, T, 90); innerElectrons(cl, r2, 8, cC, er, T, 22.5);
        [0, 90, 270].forEach(function (a) { pairAt(cl, r3, a, er).forEach(function (q) { dot(q[0], q[1], er, cC, T); }); });
        var vac = pairAt(cl, r3, 180, er);       // [위, 아래]
        dot(vac[1][0], vac[1][1], er, cC, T);      // Cl의 홀전자
        var st = P(na, r3, 0), en = vac[0];
        var ex = lerp(st[0], en[0], moved), ey = lerp(st[1], en[1], moved) - Math.sin(Math.PI * moved) * s * 1.3;
        if (moved <= 0) { // 빈자리 표시 + 예고 화살표
          ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(en[0], en[1], er, 0, 7); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = T.figAccent; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(st[0] + 4, st[1] - 6); ctx.quadraticCurveTo((st[0] + en[0]) / 2, st[1] - s * 2.4, en[0] - 4, en[1] - 8); ctx.stroke(); ctx.setLineDash([]);
          arrowTo(en[0] - 14, en[1] - 18, en[0] - 4, en[1] - 8, T.figAccent);
          text('전자 1개 이동', (st[0] + en[0]) / 2, st[1] - s * 1.35, T.figAccent, 13, 'center', '600');
        }
        dot(ex, ey, er * 1.15, cE, T);
        // 이름표
        var lyN = cy - r3 - 10;
        text(ionized > 0.5 ? 'Na⁺  (2, 8)' : 'Na  (2, 8, 1)', na[0], ionized > 0.5 ? cy - r2 - 10 : lyN, T.figInk, 13, 'center', '600');
        text(ionized > 0.5 ? 'Cl⁻  (2, 8, 8)' : 'Cl  (2, 8, 7)', cl[0], lyN, T.figInk, 13, 'center', '600');
        if (ionized > 0) {
          ctx.globalAlpha = ionized;
          chargeBadge(P(na, r2, 45), '+', T.figRed, T, s);
          chargeBadge(P(cl, r3, 40), '−', T.figBlue, T, s);
          ctx.globalAlpha = 1;
        }
        var att = seg(p, 0.65, 0.95);
        if (att > 0) {
          ctx.globalAlpha = att;
          var gx0 = na[0] + r2 + 3, gx1 = cl[0] - r3 - 3, gm = (gx0 + gx1) / 2;
          arrowTo(gx0, cy, gm - 2, cy, T.figRed); arrowTo(gx1, cy, gm + 2, cy, T.figRed);
          text('정전기적 인력', gm, cy + r3 + 22, T.figRed, 13, 'center', '600');
          ctx.strokeStyle = T.figRed; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gm, cy + 10); ctx.lineTo(gm, cy + r3 + 8); ctx.stroke(); ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        bottomLines = p >= 1
          ? ['Na은 전자를 잃어 네온, Cl은 전자를 얻어 아르곤과 같은 전자 배치가 된다.', '반대 전하를 띤 Na⁺과 Cl⁻이 서로 끌어당긴다 → 이온 결합']
          : ['Na은 바깥 껍질의 전자 1개를 잃기 쉽고, Cl은 전자 1개를 얻기 쉽다.', '[결합시키기]를 눌러 전자의 이동을 보자.'];
        drawBottom(T, bottomLines, legend, cy + r3 + (att > 0 ? 34 : 16));
      } else if (state.mol === 'water') {
        var cO = T.figBlue, cH = T.figGreen;
        legend = [[cO, 'O의 전자'], [cH, 'H의 전자']];
        var Dh0 = r2 + r1 + 2.4 * s, Dh1 = r2 + 0.35 * r1;
        var k = seg(p, 0.05, 0.8);
        var Dh = lerp(Dh0, Dh1, k);
        var cyW = 46 + r2 + 4;
        var o = [cx, cyW];
        var bonds = [-37.75, -142.25];
        var m = (Dh1 - r1 + r2) / 2;
        shellDraw(o, r1, T); shellDraw(o, r2, T);
        nucleus(o, 'O', s * 0.42, T, T.figSoftBlue);
        innerElectrons(o, r1, 2, cO, er, T, 0);
        [38, 142].forEach(function (a) { pairAt(o, r2, a, er).forEach(function (q) { dot(q[0], q[1], er, cO, T); }); });
        var hs = [];
        bonds.forEach(function (ba, i) {
          var hc = P(o, Dh, ba); hs.push(hc);
          shellDraw(hc, r1, T); nucleus(hc, 'H', s * 0.34, T, T.figSoftGreen);
          var rad = ba * Math.PI / 180, perp = [Math.sin(rad), Math.cos(rad)];   // 결합 방향에 수직(화면 좌표)
          var mid = P(o, m, ba), off = er * 1.3;
          var oS = P(o, r2, ba), oE = [mid[0] - perp[0] * off, mid[1] - perp[1] * off];
          var hS = P(hc, r1, ba + 180), hE = [mid[0] + perp[0] * off, mid[1] + perp[1] * off];
          dot(lerp(oS[0], oE[0], k), lerp(oS[1], oE[1], k), er, cO, T);
          dot(lerp(hS[0], hE[0], k), lerp(hS[1], hE[1], k), er, cH, T);
          if (p <= 0) arrowTo(P(o, Dh0 - r1 - 6, ba)[0], P(o, Dh0 - r1 - 6, ba)[1], P(o, r2 + 8, ba)[0], P(o, r2 + 8, ba)[1], T.figAccent, true);
          text(p >= 1 ? 'H' : 'H (1)', hc[0], hc[1] + r1 + 16, T.figInk, 13, 'center', '600');
        });
        text(p >= 1 ? 'O (바깥 껍질 8개)' : 'O  (2, 6)', o[0], cyW - r2 - 10, T.figInk, 13, 'center', '600');
        var lab = seg(p, 0.8, 1);
        if (lab > 0) {
          ctx.globalAlpha = lab;
          bonds.forEach(function (ba) { var mm = P(o, m, ba); ring(mm, er * 2.6, T.figRed); });
          var ly = hs[0][1] + r1 + 34;
          text('공유 전자쌍', cx, ly, T.figRed, 13, 'center', '600');
          bonds.forEach(function (ba) { var mm = P(o, m, ba); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + (mm[0] - cx) * 0.25, ly - 14); ctx.lineTo(mm[0] + (cx - mm[0]) * 0.1, mm[1] + er * 2.6); ctx.stroke(); });
          var lp = P(o, r2, 38); ring(lp, er * 2.6, T.figMuted);
          text('비공유 전자쌍', lp[0] + er * 3, lp[1] - er * 3, T.figMuted, 12, 'left');
          ctx.globalAlpha = 1;
        }
        bottomLines = p >= 1
          ? ['O는 바깥 껍질 전자 8개(네온), 각 H는 2개(헬륨)처럼 된다.', '선 구조 H–O–H: 공유 전자쌍 2개, 비공유 전자쌍 2개']
          : ['O는 전자 2개, H는 전자 1개가 더 필요하다. 둘 다 전자를 얻고 싶은 비금속이다.', '[결합시키기]를 눌러 전자쌍이 만들어지는 것을 보자.'];
        drawBottom(T, bottomLines, legend, hs[0][1] + r1 + (lab > 0 ? 46 : 26));
      } else {
        var cL = T.figBlue, cR = T.figViolet;
        legend = [[cL, '왼쪽 O의 전자'], [cR, '오른쪽 O의 전자']];
        var Do0 = 2 * r2 + 2.5 * s, Do1 = 1.5 * r2;
        var k2 = seg(p, 0.05, 0.8);
        var Do = lerp(Do0, Do1, k2);
        var cyO = 46 + r2 + 4;
        var L = [cx - Do / 2, cyO], R = [cx + Do / 2, cyO];
        [L, R].forEach(function (c, i) {
          shellDraw(c, r1, T); shellDraw(c, r2, T); nucleus(c, 'O', s * 0.42, T, i ? T.figSoftViolet : T.figSoftBlue);
          innerElectrons(c, r1, 2, i ? cR : cL, er, T, 90);
        });
        [125, 235].forEach(function (a) { pairAt(L, r2, a, er).forEach(function (q) { dot(q[0], q[1], er, cL, T); }); });
        [55, -55].forEach(function (a) { pairAt(R, r2, a, er).forEach(function (q) { dot(q[0], q[1], er, cR, T); }); });
        var py = 0.45 * s, px = 0.2 * s;
        [[L, 28, -px, -py, cL], [L, -28, -px, py, cL], [R, 152, px, -py, cR], [R, 208, px, py, cR]].forEach(function (d) {
          var a0 = P(d[0], r2, d[1]); var e1 = [cx + d[2], cyO + d[3]];
          dot(lerp(a0[0], e1[0], k2), lerp(a0[1], e1[1], k2), er, d[4], T);
        });
        if (p <= 0) { arrowTo(L[0] + r2 + 6, cyO, cx - 6, cyO, T.figAccent, true); arrowTo(R[0] - r2 - 6, cyO, cx + 6, cyO, T.figAccent, true); }
        text(p >= 1 ? 'O (바깥 껍질 8개)' : 'O  (2, 6)', L[0], cyO - r2 - 10, T.figInk, 13, 'center', '600');
        text(p >= 1 ? 'O (바깥 껍질 8개)' : 'O  (2, 6)', R[0], cyO - r2 - 10, T.figInk, 13, 'center', '600');
        var lab2 = seg(p, 0.8, 1);
        if (lab2 > 0) {
          ctx.globalAlpha = lab2;
          ring([cx, cyO - py], er * 2.6, T.figRed); ring([cx, cyO + py], er * 2.6, T.figRed);
          var ly2 = cyO + r2 + 22;
          text('공유 전자쌍 2개 = 이중 결합', cx, ly2, T.figRed, 13, 'center', '600');
          ctx.strokeStyle = T.figRed; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, ly2 - 14); ctx.lineTo(cx, cyO + py + er * 2.6); ctx.stroke();
          var lp2 = P(L, r2, 125); ring(lp2, er * 2.6, T.figMuted);
          text('비공유 전자쌍', lp2[0] - er * 3, lp2[1] - er * 3, T.figMuted, 12, 'right');
          ctx.globalAlpha = 1;
        }
        bottomLines = p >= 1
          ? ['각 O: 공유 전자쌍 2개(전자 4개) + 비공유 전자쌍 2개(전자 4개) = 8개', '선 구조 O=O: 공유 전자쌍이 2개인 이중 결합']
          : ['두 O 모두 전자 2개가 더 필요하다. 각자 전자 2개씩을 내놓으면 어떻게 될까?', '[결합시키기]를 눌러 보자.'];
        drawBottom(T, bottomLines, legend, cyO + r2 + (lab2 > 0 ? 40 : 18));
      }
    }
    function chargeBadge(pt, sign, col, T, s) {
      var rr = Math.max(9, s * 0.3);
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pt[0] + rr * 0.6, pt[1] - rr * 0.6, rr, 0, 7); ctx.fill(); ctx.stroke();
      text(sign, pt[0] + rr * 0.6, pt[1] - rr * 0.6 + 5, col, Math.round(rr * 1.4), 'center', '700');
    }
    function ring(c, rr, col) { ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(c[0], c[1], rr, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    function drawBottom(T, lines, legend, y0) {
      var w = cv.w, y = Math.max(y0 + 10, cv.h - 18 * (lines.length + 1) - 18);
      ctx.font = '12px ' + T.fontBody;
      // 범례
      var x = 4;
      legend.forEach(function (lg) {
        ctx.fillStyle = lg[0]; ctx.beginPath(); ctx.arc(x + 5, y - 4, 4, 0, 7); ctx.fill();
        text(lg[1], x + 14, y, T.figMuted, 12, 'left'); x += ctx.measureText(lg[1]).width + 30;
      });
      y += 20;
      ctx.font = '13px ' + T.fontBody;
      lines.forEach(function (ln, i) {
        wrapLines(ln, w - 8).forEach(function (l) { text(l, 4, y, i === 0 ? T.figInk : T.figMuted, 13, 'left'); y += 18; });
      });
    }

    /* ── ② 전기가 통할까? ── */
    function drawCond(T) {
      var w = cv.w, h = cv.h, m = state.mat;
      var narrow = w < 560;
      var bw = Math.min(w - 24, 480), bx0 = (w - bw) / 2, bx1 = bx0 + bw;
      var topY = 30, by0 = 100, by1 = h - (narrow ? 70 : 52);
      var eL = bx0 + bw * 0.14, eR = bx1 - bw * 0.14;
      var ion = m !== 'sugar', mobile = m === 'melt' || m === 'aq';
      var lit = state.on && ion && mobile;
      // 도선·전원·전구
      var wireCol = state.on ? T.figInk : T.figMuted;
      var batX = eL + (eR - eL) * 0.3, bulbX = eL + (eR - eL) * 0.68;
      ctx.strokeStyle = wireCol; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(eL, by0 - 4); ctx.lineTo(eL, topY); ctx.lineTo(batX - 7, topY);
      ctx.moveTo(batX + 7, topY); ctx.lineTo(bulbX - 14, topY);
      ctx.moveTo(bulbX + 14, topY); ctx.lineTo(eR, topY); ctx.lineTo(eR, by0 - 4);
      ctx.stroke();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(batX - 7, topY - 8); ctx.lineTo(batX - 7, topY + 8); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(batX + 7, topY - 15); ctx.lineTo(batX + 7, topY + 15); ctx.stroke();
      text('−', batX - 16, topY - 6, T.figMuted, 13); text('+', batX + 17, topY - 6, T.figMuted, 13);
      text(state.on ? '전원 켜짐' : '전원 꺼짐', batX, topY + 38, state.on ? T.figInk : T.figMuted, 12);
      // 전구
      if (lit) {
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
        for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(bulbX + Math.cos(a) * 18, topY + Math.sin(a) * 18); ctx.lineTo(bulbX + Math.cos(a) * 25, topY + Math.sin(a) * 25); ctx.stroke(); }
      }
      ctx.fillStyle = lit ? T.figSoftAmber : T.figPanel; ctx.strokeStyle = lit ? T.figAmber : T.figInk; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(bulbX, topY, 14, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bulbX - 10, topY + 10); ctx.lineTo(bulbX + 10, topY - 10); ctx.moveTo(bulbX - 10, topY - 10); ctx.lineTo(bulbX + 10, topY + 10); ctx.stroke();
      text(lit ? '전구 켜짐' : '전구 꺼짐', bulbX, topY + 38, lit ? T.figAmber : T.figMuted, 12, 'center', lit ? '600' : '');
      // 용기
      var fillTop = by0 + 12;
      if (m === 'solid') {
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
        ctx.fillRect(bx0, by1 - 6, bw, 6); ctx.strokeRect(bx0, by1 - 6, bw, 6);
      } else {
        ctx.fillStyle = m === 'melt' ? T.figSoftAmber : T.figSoftBlue;
        ctx.fillRect(bx0, fillTop, bw, by1 - fillTop);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx0, by1); ctx.lineTo(bx1, by1); ctx.lineTo(bx1, by0); ctx.stroke();
      }
      // 입자 영역(두 전극 사이)
      var ux0 = eL + 10, ux1 = eR - 10, vy0 = fillTop + 6, vy1 = by1 - 8;
      var X = function (u) { return ux0 + u * (ux1 - ux0); }, Y = function (v) { return vy0 + v * (vy1 - vy0); };
      var unit = Math.max(5.5, Math.min(10, (ux1 - ux0) / 40));
      if (m === 'solid') {
        // 이온 결정: Na⁺과 Cl⁻이 번갈아 고정
        var cols = Math.max(6, Math.floor((ux1 - ux0) / (unit * 3.1))), rows = Math.max(4, Math.floor((vy1 - vy0 - 10) / (unit * 3.1)));
        var gw = (ux1 - ux0 + 20) / cols, gh = (by1 - 6 - fillTop) / rows;
        ctx.fillStyle = T.figSoftViolet; ctx.fillRect(eL, fillTop, eR - eL, by1 - 6 - fillTop);
        for (var yy = 0; yy < rows; yy++) for (var xx = 0; xx < cols; xx++) {
          var jx = api.reduced ? 0 : Math.sin(tAll * 9 + xx * 1.7 + yy * 2.3) * 1.2, jy = api.reduced ? 0 : Math.cos(tAll * 8 + xx * 2.1 + yy) * 1.2;
          ionDot(eL + (xx + 0.5) * gw + jx, fillTop + (yy + 0.5) * gh + jy, (xx + yy) % 2 === 0 ? 'na' : 'cl', unit, T, 1);
        }
        text('결정 속 이온은 제자리에서 진동만 한다', (eL + eR) / 2, by1 + 20, T.figRed, 12, 'center', '600');
      } else {
        waters.forEach(function (q) { waterMol(X(q.u), Y(q.v), q.rot, unit * 0.55, T); });
        parts.forEach(function (q) {
          if (q.k === 'sugar') sugarMol(X(q.u), Y(q.v), q.rot, unit * 1.5, T);
          else ionDot(X(q.u), Y(q.v), q.k, unit, T, q.f);
        });
        var note = m === 'sugar' ? '설탕 분자는 전하를 띠지 않는다' : (state.on ? 'Na⁺은 (−)극 쪽, Cl⁻은 (+)극 쪽으로 이동' : '이온이 자유롭게 움직인다(전압 없음)');
        text(note, (bx0 + bx1) / 2, by1 + 20, m === 'sugar' ? T.figMuted : T.figBlue, 12, 'center', '600');
        if (state.on && (m === 'melt' || m === 'aq') && (api.reduced || !loop.playing)) {
          var my = (vy0 + vy1) / 2;
          arrowTo(X(0.62), my, X(0.38), my, T.figRed); arrowTo(X(0.38), my + 22, X(0.62), my + 22, T.figGreen);
        }
      }
      // 전극
      ctx.fillStyle = T.figMuted;
      ctx.fillRect(eL - 4, by0 - 6, 8, by1 - by0 - 6); ctx.fillRect(eR - 4, by0 - 6, 8, by1 - by0 - 6);
      text('(−)극', eL - 7, by0 - 10, T.figInk, 12, 'right', '600'); text('(+)극', eR + 7, by0 - 10, T.figInk, 12, 'left', '600');
      var nameMap = { solid: '염화 나트륨 고체', melt: '가열하여 녹인 염화 나트륨(액체)', aq: '염화 나트륨 수용액', sugar: '설탕 수용액' };
      text(nameMap[m], (bx0 + bx1) / 2, by0 - 2, T.figMuted, 12, 'center');
      // 범례
      var ly = h - (narrow ? 34 : 10), lx = bx0;
      var items = m === 'sugar' ? [['sugar', '설탕 분자(중성)'], ['water', '물 분자']] : m === 'aq' ? [['na', 'Na⁺'], ['cl', 'Cl⁻'], ['water', '물 분자']] : [['na', 'Na⁺ (나트륨 이온)'], ['cl', 'Cl⁻ (염화 이온)']];
      ctx.font = '12px ' + T.fontBody;
      items.forEach(function (it) {
        if (it[0] === 'water') waterMol(lx + 7, ly - 4, 0, unit * 0.55, T);
        else if (it[0] === 'sugar') sugarMol(lx + 7, ly - 4, 0, 6, T);
        else ionDot(lx + 7, ly - 4, it[0], Math.min(unit, 7), T, 1);
        text(it[1], lx + 18, ly, T.figMuted, 12, 'left');
        lx += ctx.measureText(it[1]).width + 36;
      });
    }
    function ionDot(x, y, k, u, T, f) {
      var rr = k === 'na' ? u * 0.85 : u * 1.25;
      ctx.globalAlpha = f == null ? 1 : f;
      ctx.fillStyle = k === 'na' ? T.figSoftRed : T.figSoftGreen; ctx.strokeStyle = k === 'na' ? T.figRed : T.figGreen; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = k === 'na' ? T.figRed : T.figGreen; ctx.lineWidth = 1.6;
      var q = rr * 0.5; ctx.beginPath(); ctx.moveTo(x - q, y); ctx.lineTo(x + q, y); if (k === 'na') { ctx.moveTo(x, y - q); ctx.lineTo(x, y + q); } ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function waterMol(x, y, rot, u, T) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(x, y, u, 0, 7); ctx.fill();
      ctx.fillStyle = T.figLine;
      [rot + 0.9, rot - 0.9].forEach(function (a) { ctx.beginPath(); ctx.arc(x + Math.cos(a) * u * 1.25, y + Math.sin(a) * u * 1.25, u * 0.6, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    function sugarMol(x, y, rot, u, T) {
      ctx.strokeStyle = T.figViolet; ctx.fillStyle = T.figSoftViolet; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var i = 0; i < 6; i++) { var a = rot + i * Math.PI / 3; var px = x + Math.cos(a) * u, py = y + Math.sin(a) * u; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    api.onResize(draw);
    resetParticles(); refresh();
  },
});
