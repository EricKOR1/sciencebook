/* 유기화학 6: 에폭사이드 고리 열림 탐색기 — 염기성(덜 치환된 탄소)과 산성(더 치환된 탄소)의 위치·입체 선택성.
   결과 표(이름·R/S·메조/라세미)는 scratchpad v-ochem-6/gen_epox_data.py 가 RDKit 으로 계산한 것이다. */
Sims.register('mj-epoxide-opening', {
  title: '에폭사이드 고리 열림 탐색기',
  caption: '에폭사이드와 조건을 고르면, 친핵체(초록 공)가 어느 탄소를 어느 방향에서 공격하는지 3차원 모형에 화살표로 보여 준다. 공격은 언제나 C–O 결합의 반대쪽(뒤쪽)에서 일어나므로 공격받은 탄소는 반전되고 OH와 친핵체는 트랜스가 된다. 염기성(강한 친핵체)에서는 덜 치환된 탄소(a), 산성(약한 친핵체 + H⁺)에서는 δ+를 더 잘 견디는 더 치환된 탄소(b)가 공격받는다. 산성일 때 모형 아래 막대는 두 C–O 결합의 상대 길이와 두 탄소의 부분 양전하를 정성적으로 나타낸다. 2-메틸옥시레인(1° 대 2°)의 산성 열림에서는 슬라이더로 양전하 안정화와 입체 장애의 상대 크기를 바꾸어 두 위치 이성질체의 비가 어떻게 섞이는지 볼 수 있다(정성적 모형, 실제 비는 친핵체·용매에 따라 다르다).',
  init: function (api) {
    var DATA = {"po": {"name": "2-메틸옥시레인(라세미)", "res": {"a:OMe": ["1-메톡시프로판-2-올", "라세미(출발 물질이 라세미)"], "a:CN": ["3-하이드록시뷰테인나이트릴", "라세미(출발 물질이 라세미)"], "a:N3": ["1-아자이도프로판-2-올", "라세미(출발 물질이 라세미)"], "a:Ph": ["1-페닐프로판-2-올", "라세미(출발 물질이 라세미)"], "a:H": ["프로판-2-올", "입체 중심 없음"], "a:OH": ["프로페인-1,2-다이올", "라세미(출발 물질이 라세미)"], "a:Br": ["1-브로모프로판-2-올", "라세미(출발 물질이 라세미)"], "b:OMe": ["2-메톡시프로판-1-올", "라세미(출발 물질이 라세미)"], "b:OH": ["프로페인-1,2-다이올", "라세미(출발 물질이 라세미)"], "b:Br": ["2-브로모프로판-1-올", "라세미(출발 물질이 라세미)"]}}, "dmo": {"name": "2,2-다이메틸옥시레인", "res": {"a:OMe": ["1-메톡시-2-메틸프로판-2-올", "입체 중심 없음"], "a:CN": ["3-하이드록시-3-메틸뷰테인나이트릴", "입체 중심 없음"], "a:N3": ["1-아자이도-2-메틸프로판-2-올", "입체 중심 없음"], "a:Ph": ["2-메틸-1-페닐프로판-2-올", "입체 중심 없음"], "a:H": ["2-메틸프로판-2-올", "입체 중심 없음"], "a:OH": ["2-메틸프로페인-1,2-다이올", "입체 중심 없음"], "a:Br": ["1-브로모-2-메틸프로판-2-올", "입체 중심 없음"], "b:OMe": ["2-메톡시-2-메틸프로판-1-올", "입체 중심 없음"], "b:OH": ["2-메틸프로페인-1,2-다이올", "입체 중심 없음"], "b:Br": ["2-브로모-2-메틸프로판-1-올", "입체 중심 없음"]}}, "cho": {"name": "사이클로헥센 옥사이드(메조)", "res": {"a:OMe": ["trans-2-메톡시사이클로헥산-1-올", "(1R,2R) / (1S,2S) 라세미"], "a:CN": ["trans-2-하이드록시사이클로헥세인-1-카보나이트릴", "(1S,2R) / (1R,2S) 라세미"], "a:N3": ["trans-2-아자이도사이클로헥산-1-올", "(1R,2R) / (1S,2S) 라세미"], "a:Ph": ["trans-2-페닐사이클로헥산-1-올", "(1R,2S) / (1S,2R) 라세미"], "a:H": ["사이클로헥산올", "입체 중심 없음"], "a:OH": ["trans-사이클로헥세인-1,2-다이올", "(1R,2R) / (1S,2S) 라세미"], "a:Br": ["trans-2-브로모사이클로헥산-1-올", "(1R,2R) / (1S,2S) 라세미"], "b:OMe": ["trans-2-메톡시사이클로헥산-1-올", "(1R,2R) / (1S,2S) 라세미"], "b:CN": ["trans-2-하이드록시사이클로헥세인-1-카보나이트릴", "(1S,2R) / (1R,2S) 라세미"], "b:N3": ["trans-2-아자이도사이클로헥산-1-올", "(1R,2R) / (1S,2S) 라세미"], "b:Ph": ["trans-2-페닐사이클로헥산-1-올", "(1R,2S) / (1S,2R) 라세미"], "b:H": ["사이클로헥산올", "입체 중심 없음"], "b:OH": ["trans-사이클로헥세인-1,2-다이올", "(1R,2R) / (1S,2S) 라세미"], "b:Br": ["trans-2-브로모사이클로헥산-1-올", "(1R,2R) / (1S,2S) 라세미"]}}, "mcho": {"name": "1-메틸사이클로헥센 옥사이드(라세미)", "res": {"a:OMe": ["trans-2-메톡시-1-메틸사이클로헥산-1-올", "라세미(출발 물질이 라세미)"], "a:CN": ["trans-2-하이드록시-2-메틸사이클로헥세인-1-카보나이트릴", "라세미(출발 물질이 라세미)"], "a:N3": ["trans-2-아자이도-1-메틸사이클로헥산-1-올", "라세미(출발 물질이 라세미)"], "a:Ph": ["trans-1-메틸-2-페닐사이클로헥산-1-올", "라세미(출발 물질이 라세미)"], "a:H": ["1-메틸사이클로헥산-1-올", "입체 중심 없음"], "b:OMe": ["trans-2-메톡시-2-메틸사이클로헥산-1-올", "라세미(출발 물질이 라세미)"], "b:OH": ["trans-1-메틸사이클로헥세인-1,2-다이올", "라세미(출발 물질이 라세미)"], "b:Br": ["trans-2-브로모-2-메틸사이클로헥산-1-올", "라세미(출발 물질이 라세미)"]}}, "cdmo": {"name": "cis-2,3-다이메틸옥시레인(메조)", "res": {"a:OMe": ["3-메톡시뷰탄-2-올", "(2R,3R) / (2S,3S) 라세미"], "a:CN": ["3-하이드록시-2-메틸뷰테인나이트릴", "(2S,3R) / (2R,3S) 라세미"], "a:N3": ["3-아자이도뷰탄-2-올", "(2R,3R) / (2S,3S) 라세미"], "a:Ph": ["3-페닐뷰탄-2-올", "(2R,3S) / (2S,3R) 라세미"], "a:H": ["뷰탄-2-올", "(2R) / (2S) 라세미"], "a:OH": ["뷰테인-2,3-다이올", "(2R,3R) / (2S,3S) 라세미"], "a:Br": ["3-브로모뷰탄-2-올", "(2R,3R) / (2S,3S) 라세미"], "b:OMe": ["3-메톡시뷰탄-2-올", "(2R,3R) / (2S,3S) 라세미"], "b:CN": ["3-하이드록시-2-메틸뷰테인나이트릴", "(2S,3R) / (2R,3S) 라세미"], "b:N3": ["3-아자이도뷰탄-2-올", "(2R,3R) / (2S,3S) 라세미"], "b:Ph": ["3-페닐뷰탄-2-올", "(2R,3S) / (2S,3R) 라세미"], "b:H": ["뷰탄-2-올", "(2R) / (2S) 라세미"], "b:OH": ["뷰테인-2,3-다이올", "(2R,3R) / (2S,3S) 라세미"], "b:Br": ["3-브로모뷰탄-2-올", "(2R,3R) / (2S,3S) 라세미"]}}, "tdmo": {"name": "(2R,3R)-2,3-다이메틸옥시레인(trans)", "res": {"a:OMe": ["3-메톡시뷰탄-2-올", "(2R,3S) 한 가지 거울상"], "a:CN": ["3-하이드록시-2-메틸뷰테인나이트릴", "(2R,3R) 한 가지 거울상"], "a:N3": ["3-아자이도뷰탄-2-올", "(2R,3S) 한 가지 거울상"], "a:Ph": ["3-페닐뷰탄-2-올", "(2R,3R) 한 가지 거울상"], "a:H": ["뷰탄-2-올", "(2R) 한 가지 거울상"], "a:OH": ["뷰테인-2,3-다이올", "(2R,3S) 메조"], "a:Br": ["3-브로모뷰탄-2-올", "(2R,3S) 한 가지 거울상"], "b:OMe": ["3-메톡시뷰탄-2-올", "(2R,3S) 한 가지 거울상"], "b:CN": ["3-하이드록시-2-메틸뷰테인나이트릴", "(2R,3R) 한 가지 거울상"], "b:N3": ["3-아자이도뷰탄-2-올", "(2R,3S) 한 가지 거울상"], "b:Ph": ["3-페닐뷰탄-2-올", "(2R,3R) 한 가지 거울상"], "b:H": ["뷰탄-2-올", "(2R) 한 가지 거울상"], "b:OH": ["뷰테인-2,3-다이올", "(2R,3S) 메조"], "b:Br": ["3-브로모뷰탄-2-올", "(2R,3S) 한 가지 거울상"]}}, "emo": {"name": "(S)-2-에틸-2-메틸옥시레인", "res": {"a:OMe": ["1-메톡시-2-메틸뷰탄-2-올", "(2S) 한 가지 거울상"], "a:CN": ["3-하이드록시-3-메틸펜테인나이트릴", "(3S) 한 가지 거울상"], "a:N3": ["1-아자이도-2-메틸뷰탄-2-올", "(2S) 한 가지 거울상"], "a:Ph": ["2-메틸-1-페닐뷰탄-2-올", "(2S) 한 가지 거울상"], "a:H": ["2-메틸뷰탄-2-올", "입체 중심 없음"], "a:OH": ["2-메틸뷰테인-1,2-다이올", "(2S) 한 가지 거울상"], "a:Br": ["1-브로모-2-메틸뷰탄-2-올", "(2S) 한 가지 거울상"], "b:OMe": ["2-메톡시-2-메틸뷰탄-1-올", "(2R) 한 가지 거울상"], "b:OH": ["2-메틸뷰테인-1,2-다이올", "(2R) 한 가지 거울상"], "b:Br": ["2-브로모-2-메틸뷰탄-1-올", "(2R) 한 가지 거울상"]}}};
    // 고리 탄소 a(덜 치환)·b(더 치환)의 치환기: [위쪽(+z), 아래쪽(−z)]
    var SUB = {
      po: { a: ['H', 'H'], b: ['CH₃', 'H'] },
      dmo: { a: ['H', 'H'], b: ['CH₃', 'CH₃'] },
      cho: { a: ['ring', 'H'], b: ['ring', 'H'] },
      mcho: { a: ['ring', 'H'], b: ['ring', 'CH₃'] },
      cdmo: { a: ['CH₃', 'H'], b: ['CH₃', 'H'] },
      tdmo: { a: ['CH₃', 'H'], b: ['H', 'CH₃'] },
      emo: { a: ['H', 'H'], b: ['C₂H₅', 'CH₃'] }
    };
    var ORDER = ['po', 'dmo', 'cho', 'mcho', 'cdmo', 'tdmo', 'emo'];
    var CONDS = [
      { k: 'meo', t: 'CH₃O⁻', x: 'OMe', acid: false, nu: 'CH₃O⁻' }, { k: 'cn', t: 'CN⁻', x: 'CN', acid: false, nu: 'CN⁻' },
      { k: 'n3', t: 'N₃⁻', x: 'N3', acid: false, nu: 'N₃⁻' }, { k: 'ph', t: 'PhMgBr', x: 'Ph', acid: false, nu: 'Ph⁻' },
      { k: 'lah', t: 'LiAlH₄', x: 'H', acid: false, nu: 'H⁻' },
      { k: 'h3o', t: 'H₃O⁺', x: 'OH', acid: true, nu: 'H₂O' }, { k: 'meoh', t: 'CH₃OH/H⁺', x: 'OMe', acid: true, nu: 'CH₃OH' },
      { k: 'hbr', t: 'HBr', x: 'Br', acid: true, nu: 'Br⁻' }
    ];
    var st = { e: 'dmo', c: 'meo', s: 0.6, t: 1, anim: null };
    var rSite = api.readout('공격 탄소 '), rProd = api.readout('주생성물 '), rSt = api.readout('입체 ');
    var cond = function () { return CONDS.filter(function (c) { return c.k === st.c; })[0]; };
    function fracB() {
      var c = cond();
      if (SUB[st.e].a.join() === SUB[st.e].b.join() || st.e === 'cho' || st.e === 'cdmo' || st.e === 'tdmo') return 0.5;  // 두 탄소가 같음
      if (!c.acid) return 0.02;
      if (st.e === 'po') { var z = (st.s - 0.5) * 6 - 0.0; return 1 / (1 + Math.exp(-(z + 0.25))); }   // s=0.6 → 약 0.7, 0 → 약 0.06
      return 0.97;   // 한쪽이 3°
    }
    var S = api.scene3d({
      yaw: 0.35, pitch: 0.3, dist: 10, scale: 0.17, label: '에폭사이드와 친핵체의 입체 모형',
      aspect: function (w) { return w < 560 ? 0.95 : 0.55; },
      draw: function (g, T) {
        var c = cond(), fb = fracB(), sym = (st.e === 'cho' || st.e === 'cdmo' || st.e === 'tdmo');
        var A = [-0.78, 0, 0], B = [0.78, 0, 0], O = [0, 1.15, 0];
        var hit = sym ? 'a' : (fb >= 0.5 ? 'b' : 'a');
        var lenA = 1, lenB = 1;
        if (c.acid && !sym) { lenB = 1 + 0.35 * fb; lenA = 1 + 0.35 * (1 - fb); }
        var Oa = O;
        // 고리 결합
        g.line(A, B, T.figInk, { width: 4 });
        var cA = hit === 'a' ? T.figRed : T.figInk, cB = hit === 'b' ? T.figRed : T.figInk;
        g.line(A, O, cA, { width: 4, dash: c.acid && lenA > 1.12 ? [6, 4] : null });
        g.line(B, O, cB, { width: 4, dash: c.acid && lenB > 1.12 ? [6, 4] : null });
        g.sphere(A, 0.28, T.figMuted, { label: 'a' });
        g.sphere(B, 0.28, T.figMuted, { label: 'b' });
        g.sphere(O, 0.3, T.figRed, { label: 'O' });
        if (c.acid) { var H = [0, 1.75, 0.55]; g.line(O, H, T.figInk, { width: 3 }); g.sphere(H, 0.17, T.figPanel, { label: 'H⁺' }); }
        var sub = SUB[st.e];
        function subs(P, side, list) {
          var sx = side === 'a' ? -1 : 1;
          [[0.55, -0.45, 0.9], [0.55, -0.45, -0.9]].forEach(function (d, i) {
            var lab = list[i], Q = [P[0] + sx * d[0], P[1] + d[1], P[2] + d[2]];
            if (lab === 'ring') return;
            g.line(P, Q, T.figInk, { width: 3 });
            g.sphere(Q, lab === 'H' ? 0.15 : 0.26, lab === 'H' ? T.figPanel : T.figLine, { label: lab, alpha: 0.95 });
          });
        }
        subs(A, 'a', sub.a); subs(B, 'b', sub.b);
        if (sub.a[0] === 'ring') {   // 사이클로헥세인 고리(위쪽 면의 CH₂ 넷)
          var pts = [A, [-1.4, -0.6, 0.9], [-0.6, -1.3, 1.5], [0.6, -1.3, 1.5], [1.4, -0.6, 0.9], B];
          g.path(pts, T.figInk, { width: 3 });
          pts.slice(1, 5).forEach(function (p) { g.sphere(p, 0.16, T.figMuted, { alpha: 0.9 }); });
        }
        // 친핵체: 공격 탄소의 C–O 반대쪽
        var Ct = hit === 'a' ? A : B;
        var d = [Ct[0] - O[0], Ct[1] - O[1], Ct[2] - O[2]], L = Math.hypot(d[0], d[1], d[2]);
        d = [d[0] / L, d[1] / L, d[2] / L];
        var far = 2.9 - 1.0 * st.t;   // 검토: 친핵체 공이 치환기 공과 겹치지 않게 조금 멀리
        var N = [Ct[0] + d[0] * far, Ct[1] + d[1] * far, Ct[2] + d[2] * far];
        g.sphere(N, 0.34, T.figSoftGreen, { label: c.nu, outline: T.figGreen });
        g.arrow([N[0] - d[0] * 0.3, N[1] - d[1] * 0.3, N[2] - d[2] * 0.3], [Ct[0] + d[0] * 0.38, Ct[1] + d[1] * 0.38, Ct[2] + d[2] * 0.38], T.figViolet, { width: 3 });
        g.text([Ct[0] + d[0] * 0.9 + 0.3, Ct[1] + d[1] * 0.9 - 0.3, Ct[2]], '뒤쪽 공격', { size: 12, color: T.figViolet });
        if (c.acid && !sym) {
          g.text([B[0] + 0.2, B[1] + 0.55, 0], 'δ+' + (fb > 0.5 ? ' 큼' : ''), { size: 13, color: T.figBlue, bold: fb > 0.5 });
          g.text([A[0] - 0.2, A[1] + 0.55, 0], 'δ+' + (fb < 0.5 ? ' 큼' : ''), { size: 12, color: T.figBlue });
        }
      }
    });
    // 막대(C–O 길이, 부분 전하)
    var bar = api.canvas({ aspect: function (w) { return w < 560 ? 0.42 : 0.16; }, label: '두 C–O 결합의 상대 길이와 부분 전하 막대' });
    function drawBars() {
      var T = api.tokens(), ctx = bar.ctx, w = bar.w, h = bar.h, c = cond(), fb = fracB();
      var sym = (st.e === 'cho' || st.e === 'cdmo' || st.e === 'tdmo');
      ctx.clearRect(0, 0, w, h);
      ctx.font = '13px ' + T.fontBody; ctx.textBaseline = 'middle';
      var rows = [], narrow = w < 560;
      var la = c.acid && !sym ? 1 + 0.35 * (1 - fb) : 1, lb = c.acid && !sym ? 1 + 0.35 * fb : 1;
      var qa = c.acid ? (sym ? 0.5 : 1 - fb) : 0.15, qb = c.acid ? (sym ? 0.5 : fb) : 0.15;
      rows.push(['C(a)–O 길이', la / 1.35, T.figInk], ['C(b)–O 길이', lb / 1.35, T.figInk], ['C(a) δ+', qa, T.figBlue], ['C(b) δ+', qb, T.figBlue]);
      var cols = narrow ? 1 : 2, rh = narrow ? h / 4 : h / 2, cw = w / cols;
      rows.forEach(function (r, i) {
        var col = narrow ? 0 : i % 2, row = narrow ? i : Math.floor(i / 2);
        var x0 = col * cw + 8, y = row * rh + rh / 2;
        ctx.fillStyle = T.figInk; ctx.fillText(r[0], x0, y);
        var bx = x0 + 96, bw = cw - 120;
        ctx.fillStyle = T.figPanel; ctx.fillRect(bx, y - 7, bw, 14);
        ctx.strokeStyle = T.figLine; ctx.strokeRect(bx, y - 7, bw, 14);
        ctx.fillStyle = r[2]; ctx.globalAlpha = c.acid || i < 2 ? 0.75 : 0.25; ctx.fillRect(bx, y - 7, bw * Math.min(r[1], 1), 14); ctx.globalAlpha = 1;
      });
    }
    function update() {
      var c = cond(), fb = fracB(), D = DATA[st.e], sym = (st.e === 'cho' || st.e === 'cdmo' || st.e === 'tdmo');
      var site = sym ? 'a' : (fb >= 0.5 ? 'b' : 'a');
      var key = site + ':' + c.x, r = D.res[key];
      if (!r) { key = (site === 'a' ? 'b' : 'a') + ':' + c.x; r = D.res[key]; }
      var other = D.res[(site === 'a' ? 'b' : 'a') + ':' + c.x];
      var pctB = Math.round(fb * 100);
      if (sym) rSite.set('두 탄소가 같다 (어느 쪽이든 같은 공격)');
      else rSite.set((site === 'a' ? 'a (덜 치환)' : 'b (더 치환)') + (c.acid && st.e === 'po' ? ' — b : a = ' + pctB + ' : ' + (100 - pctB) : (c.acid ? ' — 거의 b만' : ' — 거의 a만')));
      rProd.set(r ? r[0] : '—');
      var s = r ? r[1] : '';
      if (st.e === 'po' && c.acid && other && other[0] !== r[0] && fb > 0.15 && fb < 0.85) s += ' · 부생성물 ' + other[0];
      rSt.set(s + (r && /trans/.test(r[0]) ? ' · 트랜스(뒤쪽 공격)' : ''));
      sl.input.disabled = !(st.e === 'po' && c.acid);
      S.redraw(); drawBars();
    }
    var gE = api.group(), gC = api.group();
    var bE = ORDER.map(function (k) { return api.button(DATA[k].name, function () { st.e = k; sync(); go(); }, { toggle: true, pressed: k === st.e, parent: gE }); });
    var bC = CONDS.map(function (c) { return api.button((c.acid ? '산성 ' : '염기성 ') + c.t, function () { st.c = c.k; sync(); go(); }, { toggle: true, pressed: c.k === st.c, parent: gC }); });
    function sync() {
      ORDER.forEach(function (k, i) { bE[i].setAttribute('aria-pressed', String(k === st.e)); });
      CONDS.forEach(function (c, i) { bC[i].setAttribute('aria-pressed', String(c.k === st.c)); });
    }
    var sl = api.slider({ id: 'mj-epoxide-opening-s', label: '입체 장애 ↔ 양전하 안정화 (2-메틸옥시레인, 산성)', min: 0, max: 1, step: 0.01, value: st.s,
      format: function (v) { return v < 0.35 ? '입체 장애 우세' : v > 0.65 ? '양전하 안정화 우세' : '비슷함'; }, onInput: function (v) { st.s = v; update(); } });
    var loop = api.loop(function (dt) { st.t = Math.min(1, st.t + dt * 1.2); S.redraw(); if (st.t >= 1) loop.pause(); });
    function go() { if (api.reduced) { st.t = 1; update(); } else { st.t = 0; update(); loop.play(); } }
    loop.pause();
    api.onResize(drawBars);
    update();
  },
});
