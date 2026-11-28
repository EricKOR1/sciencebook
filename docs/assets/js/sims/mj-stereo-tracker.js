/* 유기화학 6: 입체 결과 추적기 — 알코올에서 출발해 시약을 차례로 고르며 입체 중심의 유지·반전·라세미·제거를 따라간다.
   규칙: 입체 중심 탄소의 결합이 끊기지 않으면 유지, 이탈기 반대쪽 공격(SN2)이면 반전, 탄소 양이온(SN1)이면 라세미, 강한 부피 큰 염기는 E2.
   이 표의 모든 생성물에서 들어오는 원자단이 입체 중심의 1순위이므로 R/S 는 유지이면 그대로, 반전이면 바뀐다(문제 7·예제 11과 같은 판단). */
Sims.register('mj-stereo-tracker', {
  title: '입체 결과 추적기 — 끊기는 결합을 따라가기',
  caption: '출발 알코올을 고른 뒤 시약 카드를 순서대로 눌러 보자(카드를 누르는 순서가 반응 순서이다). 입체 중심 주위의 공-막대 모형이 단계마다 바뀌며, 반전 단계에서는 떨어져 나간 원자단과 끊긴 결합을 빨간 점선으로, 유지 단계에서는 그대로 남은 C–O 결합을 초록으로 표시한다. 토실화·메실화·알콕사이드의 메틸화·에스터 가수 분해는 산소 쪽 결합만 바뀌므로 유지, CN⁻·N₃⁻·CH₃COO⁻·PBr₃·SOCl₂(피리딘)는 뒤쪽 공격이라 반전, 진한 HBr은 탄소 양이온을 거쳐 라세미(고리 기질은 수소화 이온 이동)이다. 2° 기질에 KOtBu를 쓰면 E2가 주반응이 되어 입체 중심이 사라진다. 고리 기질은 C1만 바뀌고 C2(R)는 그대로이며, 반전되면 trans가 cis로 바뀐다. 실제 반응에서는 벤질 자리의 SN1 경쟁, 고리 2° 자리의 느린 SN2처럼 부반응이 섞일 수 있다.',
  init: function (api) {
    var SUBS = {
      b2R: { lab: '(R)-뷰탄-2-올', d: 'R', g1: 'C₂H₅', g2: 'CH₃', kind: 'chain',
        n: { OH: '뷰탄-2-올', OTs: '뷰탄-2-일 토실레이트', OMs: '뷰탄-2-일 메실레이트', OMe: '2-메톡시뷰테인', Br: '2-브로모뷰테인', Cl: '2-클로로뷰테인', CN: '2-메틸뷰테인나이트릴', N3: '2-아자이도뷰테인', OAc: '뷰탄-2-일 아세테이트' },
        e2: function () { return '뷰트-2-엔(주, E > Z) + 뷰트-1-엔'; } },
      b2S: { lab: '(S)-뷰탄-2-올', d: 'S', g1: 'C₂H₅', g2: 'CH₃', kind: 'chain' },
      pe: { lab: '(R)-1-페닐에탄올', d: 'R', g1: 'C₆H₅', g2: 'CH₃', kind: 'benzyl',
        n: { OH: '1-페닐에탄-1-올', OTs: '1-페닐에틸 토실레이트', OMs: '1-페닐에틸 메실레이트', OMe: '(1-메톡시에틸)벤젠', Br: '(1-브로모에틸)벤젠', Cl: '(1-클로로에틸)벤젠', CN: '2-페닐프로페인나이트릴', N3: '(1-아자이도에틸)벤젠', OAc: '1-페닐에틸 아세테이트' },
        e2: function () { return '스타이렌(에텐일벤젠)'; } },
      mc: { lab: '(1R,2R)-2-메틸사이클로헥산-1-올', d: 'R', g1: 'C2(CH₃)', g2: 'C6', kind: 'ring',
        n: { OH: '2-메틸사이클로헥산-1-올', OTs: '2-메틸사이클로헥실 토실레이트', OMs: '2-메틸사이클로헥실 메실레이트', OMe: '1-메톡시-2-메틸사이클로헥세인', Br: '1-브로모-2-메틸사이클로헥세인', Cl: '1-클로로-2-메틸사이클로헥세인', CN: '2-메틸사이클로헥세인-1-카보나이트릴', N3: '1-아자이도-2-메틸사이클로헥세인', OAc: '2-메틸사이클로헥실 아세테이트' },
        e2: function (sp) { return sp > 0 ? '3-메틸사이클로헥센만 (trans: C2의 H가 안티가 아님)' : '1-메틸사이클로헥센(주) + 3-메틸사이클로헥센'; } }
    };
    SUBS.b2S.n = SUBS.b2R.n; SUBS.b2S.e2 = SUBS.b2R.e2;
    var LG = { OTs: 1, OMs: 1, Br: 1, Cl: 1 };
    var XLAB = { OH: 'OH', OTs: 'OTs', OMs: 'OMs', OMe: 'OCH₃', Br: 'Br', Cl: 'Cl', CN: 'CN', N3: 'N₃', OAc: 'OAc' };
    var XCOL = { OH: 'figRed', OTs: 'figRed', OMs: 'figRed', OMe: 'figRed', Br: 'figGreen', Cl: 'figGreen', CN: 'figBlue', N3: 'figBlue', OAc: 'figRed' };
    var REAG = [
      { t: 'TsCl/피리딘', f: function (x) { return x === 'OH' ? ['OTs', 'ret', 'O–H, S–Cl이 끊기고 O–S가 생김'] : null; } },
      { t: 'MsCl/Et₃N', f: function (x) { return x === 'OH' ? ['OMs', 'ret', 'O–H, S–Cl이 끊기고 O–S가 생김'] : null; } },
      { t: 'NaH 뒤 CH₃I', f: function (x) { return x === 'OH' ? ['OMe', 'ret', 'O–H가 끊기고 O–CH₃가 생김(CH₃–I가 끊김)'] : null; } },
      { t: 'PBr₃', f: function (x, s) { return x === 'OH' ? ['Br', 'inv', 'C–O가 끊김(Br⁻ 뒤쪽 공격)' + (s.kind === 'benzyl' ? ' · 벤질 자리라 일부 라세미화 가능' : '')] : null; } },
      { t: 'SOCl₂/피리딘', f: function (x) { return x === 'OH' ? ['Cl', 'inv', 'C–O가 끊김(Cl⁻ 뒤쪽 공격)'] : null; } },
      { t: '진한 HBr', f: function (x, s) { return x === 'OH' ? (s.kind === 'ring' ? ['RING_REARR', 'rac', 'C–O가 끊겨 탄소 양이온 → 수소화 이온 이동'] : ['Br', 'rac', 'C–O가 끊겨 평면 탄소 양이온(SN1)']) : null; } },
      { t: 'NaCN/DMSO', f: function (x, s) { return LG[x] ? ['CN', 'inv', 'C–' + XLAB[x] + '가 끊김(뒤쪽 공격)' + (s.kind === 'ring' ? ' · 고리 2°: SN2 느림, E2 경쟁' : '')] : null; } },
      { t: 'NaN₃/DMF', f: function (x, s) { return LG[x] ? ['N3', 'inv', 'C–' + XLAB[x] + '가 끊김(뒤쪽 공격)' + (s.kind === 'ring' ? ' · 고리 2°: SN2 느림' : '')] : null; } },
      { t: 'CH₃COONa/DMF', f: function (x) { return LG[x] ? ['OAc', 'inv', 'C–' + XLAB[x] + '가 끊김(아세트산 이온의 뒤쪽 공격)'] : null; } },
      { t: 'NaOH/H₂O', f: function (x) { return x === 'OAc' ? ['OH', 'ret', '아실 C–O가 끊김 · 알킬 C–O는 그대로'] : (LG[x] ? ['E2', 'elim', '강염기 + 2° 기질: E2 주'] : null); } },
      { t: 'KOtBu', f: function (x) { return LG[x] ? ['E2', 'elim', 'C–H와 C–' + XLAB[x] + '가 끊김: E2 주'] : null; } }
    ];
    var st = { s: 'b2R', x: 'OH', sp: 1, rac: false, gone: false, prev: null, step: null, msg: '', t: 1, steps: [] };
    var rName = api.readout('지금 화합물 '), rStep = api.readout('이번 단계 '), rBond = api.readout('끊긴 결합 '), rHist = api.readout('지나온 길 ');
    function flipD(d) { return d === 'R' ? 'S' : 'R'; }
    function desc() {
      var S0 = SUBS[st.s], d = st.sp > 0 ? S0.d : flipD(S0.d);
      if (S0.kind === 'ring') return '(1' + d + ',2R)-' + (st.sp > 0 ? 'trans' : 'cis') + '-';
      return '(' + d + ')-';
    }
    function nameNow() {
      var S0 = SUBS[st.s];
      if (st.gone === 'e2') return S0.e2(st.sp);
      if (st.gone === 'ring') return '1-브로모-1-메틸사이클로헥세인(3° 양이온 경유, 입체 중심 없음)';
      if (st.rac) return '라세미 ' + S0.n[st.x] + ' — (R)·(S) 같은 양';
      return desc() + S0.n[st.x];
    }
    // 3차원 배치: X 는 +x(공간 배치 1) 또는 −x(반전), 나머지 셋은 반대쪽 우산
    var TET = [[-1 / 3, 0.943, 0], [-1 / 3, -0.471, 0.816], [-1 / 3, -0.471, -0.816]];
    function chir(pX, p1, p2, pH) {   // X > g1 > g2 > H 로 R/S
      function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
      var a = sub(pX, pH), b = sub(p1, pH), c = sub(p2, pH);
      var T = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
      return T < 0 ? 'R' : 'S';
    }
    function layout(sp, u) {   // u: 0..1 애니메이션 비율(반전 중간)
      var S0 = SUBS[st.s], order = [0, 1, 2];
      if (chir([1, 0, 0], TET[0], TET[1], TET[2]) !== S0.d) order = [1, 0, 2];
      var sx = sp > 0 ? 1 : -1, fx = function (p, s) { return [p[0] * s, p[1], p[2]]; };
      var k = st.step === 'inv' ? (sp > 0 ? 1 : -1) * (2 * u - 1) : sx;   // −1 → +1 로 우산이 뒤집힘
      return { g1: fx(TET[order[0]], k), g2: fx(TET[order[1]], k), H: fx(TET[order[2]], k), X: [sx, 0, 0] };
    }
    var S = api.scene3d({
      yaw: 0.25, pitch: 0.25, dist: 10, scale: 0.2, label: '입체 중심의 공-막대 모형',
      aspect: function (w) { return w < 560 ? 0.85 : 0.5; },
      draw: function (g, T) {
        var S0 = SUBS[st.s], L = 1.5, C = [0, 0, 0];
        var Lp = layout(st.sp, st.t);
        g.sphere(C, 0.32, T.figMuted, { label: 'C' });
        if (st.gone) {
          g.text([0, -1.4, 0], st.gone === 'e2' ? '알켄 — sp² 평면, 입체 중심 없음' : '3° 브로민화물 — 입체 중심 없음', { size: 14, bold: true, color: T.figRed });
          return;
        }
        function bond(p, lab, col, r, opt) {
          var q = [p[0] * L, p[1] * L, p[2] * L];
          g.line(C, q, opt && opt.bc ? opt.bc : T.figInk, { width: opt && opt.bw ? opt.bw : 4, dash: opt && opt.dash, alpha: opt && opt.alpha });
          g.sphere(q, r, col, { label: lab, alpha: opt && opt.alpha == null ? 1 : (opt ? opt.alpha : 1) });
        }
        bond(Lp.g1, S0.g1, T.figLine, 0.42, {});
        bond(Lp.g2, S0.g2, T.figLine, 0.36, {});
        bond(Lp.H, 'H', T.figPanel, 0.24, {});
        if (st.rac) {
          bond([1, 0, 0], XLAB[st.x], T[XCOL[st.x]], 0.4, { alpha: 0.5 });
          bond([-1, 0, 0], XLAB[st.x], T[XCOL[st.x]], 0.4, { alpha: 0.5 });
          g.text([0, 1.9, 0], '두 면에서 같은 확률로 공격 → 라세미', { size: 13, color: T.figViolet });
          return;
        }
        var keep = st.step === 'ret' && /^O/.test(st.x);
        bond(Lp.X, XLAB[st.x], T[XCOL[st.x]], 0.42, { bc: keep ? T.figGreen : T.figInk, bw: keep ? 6 : 4 });
        if (st.step === 'inv' && st.prev) {
          var old = [-Lp.X[0] * L * (1 + 0.6 * st.t), 0, 0];
          g.line(C, old, T.figRed, { width: 3, dash: [6, 5], alpha: 0.85 });
          g.sphere(old, 0.38, T[XCOL[st.prev]] || T.figRed, { label: XLAB[st.prev] || st.prev, alpha: 0.45 });
          g.text([old[0], 0.75, 0], '떠남', { size: 12, color: T.figRed });
          g.text([Lp.X[0] * L, 0.85, 0], '뒤쪽에서 들어옴', { size: 12, color: T.figViolet });
        }
        if (keep) g.text([Lp.X[0] * 0.8, -0.55, 0], 'C–O 유지', { size: 12, color: T.figGreen, bold: true });
      }
    });
    function show() {
      rName.set(nameNow());
      var lab = { ret: '유지', inv: '반전', rac: '라세미화', elim: '제거(E2)' };
      rStep.set(st.step ? lab[st.step] + (st.msg && st.step === 'none' ? '' : '') : (st.msg || '출발 물질'));
      rBond.set(st.bond || '—');
      rHist.set(st.steps.length ? st.steps.join(' → ') : '(시약을 눌러 보자)');
      S.redraw();
    }
    var loop = api.loop(function (dt) { st.t = Math.min(1, st.t + dt * 1.1); S.redraw(); if (st.t >= 1) loop.pause(); });
    loop.pause();
    function apply(R) {
      if (st.gone || st.rac) { st.step = null; st.msg = ''; st.bond = '더 따라갈 입체 중심이 없다 — 다시 시작을 누르자'; show(); return; }
      var r = R.f(st.x, SUBS[st.s]);
      if (!r) { st.step = null; st.bond = XLAB[st.x] + '에는 ' + R.t + '가 반응하지 않는다(' + (st.x === 'OH' ? 'OH는 이탈기가 아니다' : '알맞은 이탈기·작용기가 없다') + ')'; show(); return; }
      st.prev = st.x; st.step = r[1]; st.bond = r[2]; st.steps.push(R.t);
      if (r[0] === 'E2') { st.gone = 'e2'; st.step = 'elim'; }
      else if (r[0] === 'RING_REARR') { st.gone = 'ring'; st.step = 'rac'; }
      else {
        st.x = r[0];
        if (r[1] === 'inv') st.sp = -st.sp;
        if (r[1] === 'rac') st.rac = true;
      }
      st.t = (api.reduced || r[1] !== 'inv') ? 1 : 0;
      if (st.t < 1) loop.play();
      show();
    }
    function reset() { st.x = 'OH'; st.sp = 1; st.rac = false; st.gone = false; st.prev = null; st.step = null; st.bond = ''; st.steps = []; st.t = 1; show(); }
    var gS = api.group();
    var bS = Object.keys(SUBS).map(function (k) {
      return api.button(SUBS[k].lab, function () { st.s = k; bS.forEach(function (b, i) { b.setAttribute('aria-pressed', String(Object.keys(SUBS)[i] === k)); }); reset(); }, { toggle: true, pressed: k === st.s, parent: gS });
    });
    var gR = api.group();
    REAG.forEach(function (R) { api.button(R.t, function () { apply(R); }, { parent: gR }); });
    api.button('다시 시작', reset, { primary: true });
    show();
  },
});
