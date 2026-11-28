/* 유기화학 5 알켄과 알카인: 알켄 첨가 반응 탐색기 (3D)
   C=C 축을 x 축, 알켄 평면을 xz 평면, π 결합의 두 면을 +y(위)·−y(아래)로 둔다.
   왼쪽 탄소 Ca = 덜 치환된 탄소, 오른쪽 Cb = 더 치환된 탄소.
   생성물 이름·판정은 원고(유기화학 5)의 결론과 같은 미리 정한 표에서 가져온다(계산하지 않는다). */
Sims.register('mj-alkene-addition', {
  title: '알켄 첨가 반응 탐색기 — 어느 탄소에, 어느 면으로',
  caption: '알켄과 시약을 고르면 먼저 중간체(탄소 양이온·브로모늄·수은니움 이온, 4중심 전이 상태, 금속 표면 등)와 시약이 들어오는 면이, ‘생성물 보기’를 누르면 두 원자단이 붙은 모습과 생성물 이름, 메조·라세미·아카이랄 판정이 나온다. '
    + '‘같은 면/반대 면’ 단추로 신·안티를 일부러 바꾸어 보면, (Z)·(E)-뷰트-2-엔과 1-메틸사이클로헥센에서 생성물의 입체가 어떻게 달라지는지 비교할 수 있다(실제 반응이 고르는 면은 ‘시약대로’). '
    + '분자는 공-막대 모식도이며 결합 길이·각은 실제 비율이 아니다. 고리(사이클로헥센)는 C=C 뒤쪽의 꺾은선으로 줄여 그렸고, 자리 옮김은 글로만 표시한다.',
  init: function (api) {
    // 알켄: Ca 의 [앞, 뒤], Cb 의 [앞, 뒤] 치환기. ring: 뒤쪽 두 치환기를 고리로 잇는다.
    var ALK = [
      { n: '프로펜', a: ['H', 'H'], b: ['CH₃', 'H'] },
      { n: '2-메틸프로펜', a: ['H', 'H'], b: ['CH₃', 'CH₃'] },
      { n: '3,3-다이메틸뷰트-1-엔', a: ['H', 'H'], b: ['C(CH₃)₃', 'H'] },
      { n: '1-메틸사이클로헥센', a: ['H', ''], b: ['CH₃', ''], ring: true },
      { n: '(Z)-뷰트-2-엔', a: ['CH₃', 'H'], b: ['CH₃', 'H'], geo: 'Z' },
      { n: '(E)-뷰트-2-엔', a: ['CH₃', 'H'], b: ['H', 'CH₃'], geo: 'E' },
    ];
    // 시약: 중간체, 방식(none: 면 선택 없음, syn, anti, cleave), Ca 에 붙는 것, Cb 에 붙는 것(최종)
    var RG = [
      { n: 'HBr', it: '탄소 양이온(평면, 빈 p 오비탈)', mode: 'none', x: 'H', y: 'Br', reg: '마르코브니코프: H는 Ca(덜 치환), Br은 Cb' },
      { n: 'HBr, ROOR', it: '탄소 라디칼(Br·가 먼저 Ca에)', mode: 'none', x: 'Br', y: 'H', reg: '안티 마르코브니코프: Br은 Ca, H는 Cb' },
      { n: 'H₃O⁺', it: '탄소 양이온', mode: 'none', x: 'H', y: 'OH', reg: '마르코브니코프: OH는 Cb' },
      { n: 'Hg(OAc)₂, H₂O → NaBH₄', it: '수은니움 이온(열린 양이온 없음)', mode: 'none', x: 'H', y: 'OH', reg: '마르코브니코프: OH는 Cb, 자리 옮김 없음' },
      { n: 'BH₃ → H₂O₂, NaOH', it: '4중심 고리형 전이 상태', mode: 'syn', x: 'OH', y: 'H', reg: '안티 마르코브니코프: OH(처음엔 B)는 Ca' },
      { n: 'Br₂', it: '브로모늄 이온', mode: 'anti', x: 'Br', y: 'Br', reg: '해당 없음(같은 두 원자)' },
      { n: 'Br₂, H₂O', it: '브로모늄 이온(물이 Cb를 공격)', mode: 'anti', x: 'Br', y: 'OH', reg: 'OH는 더 치환된 Cb, Br은 Ca' },
      { n: 'H₂, Pd/C', it: '금속 표면(두 H가 표면 쪽에서)', mode: 'syn', x: 'H', y: 'H', reg: '해당 없음' },
      { n: 'mCPBA', it: "협동 '나비' 전이 상태", mode: 'syn', x: 'O', y: 'O', epox: true, reg: '해당 없음(O 하나가 두 탄소에)' },
      { n: 'OsO₄, NMO', it: '오스뮴산 에스터(5원자 고리)', mode: 'syn', x: 'OH', y: 'OH', reg: '해당 없음' },
      { n: 'O₃ → (CH₃)₂S', it: '몰오조나이드 → 오조나이드', mode: 'cleave', x: '', y: '', reg: 'C=C가 끊겨 양쪽이 C=O' },
    ];
    // 생성물 [이름, 판정] (시약대로의 면)
    var P = [
      [['2-브로모프로페인', '아카이랄'], ['1-브로모프로페인', '아카이랄'], ['프로판-2-올', '아카이랄'], ['프로판-2-올', '아카이랄'], ['프로판-1-올', '아카이랄'], ['1,2-다이브로모프로페인', '새 입체 중심 1개 → (R)·(S) 1 : 1, 라세미'], ['1-브로모프로판-2-올', '라세미((R)·(S) 1 : 1)'], ['프로페인', '아카이랄'], ['2-메틸옥시레인', '라세미((R)·(S) 1 : 1)'], ['프로페인-1,2-다이올', '라세미((R)·(S) 1 : 1)'], ['에탄알 + 메탄알', '아카이랄']],
      [['2-브로모-2-메틸프로페인', '아카이랄'], ['1-브로모-2-메틸프로페인', '아카이랄'], ['2-메틸프로판-2-올', '아카이랄'], ['2-메틸프로판-2-올', '아카이랄'], ['2-메틸프로판-1-올', '아카이랄'], ['1,2-다이브로모-2-메틸프로페인', '아카이랄'], ['1-브로모-2-메틸프로판-2-올', '아카이랄'], ['2-메틸프로페인', '아카이랄'], ['2,2-다이메틸옥시레인', '아카이랄'], ['2-메틸프로페인-1,2-다이올', '아카이랄'], ['프로판온 + 메탄알', '아카이랄']],
      [['2-브로모-2,3-다이메틸뷰테인(1,2-메틸 이동, 자리 옮김) + 3-브로모-2,2-다이메틸뷰테인', '자리 옮긴 것은 아카이랄, 옮기지 않은 것은 라세미'], ['1-브로모-3,3-다이메틸뷰테인', '아카이랄'], ['2,3-다이메틸뷰탄-2-올(자리 옮김)', '아카이랄'], ['3,3-다이메틸뷰탄-2-올(자리 옮김 없음)', '라세미((R)·(S) 1 : 1)'], ['3,3-다이메틸뷰탄-1-올', '아카이랄'], ['1,2-다이브로모-3,3-다이메틸뷰테인', '라세미'], ['1-브로모-3,3-다이메틸뷰탄-2-올', '라세미'], ['2,2-다이메틸뷰테인', '아카이랄'], ['2-tert-뷰틸옥시레인', '라세미'], ['3,3-다이메틸뷰테인-1,2-다이올', '라세미'], ['2,2-다이메틸프로판알 + 메탄알', '아카이랄']],
      [['1-브로모-1-메틸사이클로헥세인', '입체 중심 없음(아카이랄)'], ['1-브로모-2-메틸사이클로헥세인', '시스·트랜스 혼합물(각각 라세미)'], ['1-메틸사이클로헥산-1-올', '아카이랄'], ['1-메틸사이클로헥산-1-올', '아카이랄'], null, null, null, ['메틸사이클로헥세인', '아카이랄'], ['1-메틸-7-옥사바이사이클로[4.1.0]헵테인(에폭사이드)', '라세미'], null, ['6-옥소헵탄알', '아카이랄']],
      [['2-브로모뷰테인', '라세미((R)·(S) 1 : 1)'], ['2-브로모뷰테인', '라세미'], ['뷰탄-2-올', '라세미'], ['뷰탄-2-올', '라세미'], ['뷰탄-2-올', '라세미'], null, null, ['뷰테인', '아카이랄'], null, null, ['에탄알 2분자', '아카이랄']],
      [['2-브로모뷰테인', '라세미((R)·(S) 1 : 1)'], ['2-브로모뷰테인', '라세미'], ['뷰탄-2-올', '라세미'], ['뷰탄-2-올', '라세미'], ['뷰탄-2-올', '라세미'], null, null, ['뷰테인', '아카이랄'], null, null, ['에탄알 2분자', '아카이랄']],
    ];
    // 면에 따라 달라지는 생성물(같은 면 / 반대 면)
    function faceDep(ai, ri, same) {
      var A = ALK[ai];
      if (A.geo) {
        var z = A.geo === 'Z', ms = (z === same);       // 같은 두 원자: 시스+신, 트랜스+안티 → 메조
        if (ri === 5) return ms ? ['메조-(2R,3S)-2,3-다이브로모뷰테인', '메조(아카이랄)'] : ['(2R,3R)- + (2S,3S)-2,3-다이브로모뷰테인', '라세미'];
        if (ri === 9) return ms ? ['메조-(2R,3S)-뷰테인-2,3-다이올', '메조(아카이랄)'] : ['(2R,3R)- + (2S,3S)-뷰테인-2,3-다이올', '라세미'];
        if (ri === 6) return ms ? ['(2R,3S)- + (2S,3R)-3-브로모뷰탄-2-올', '라세미(다른 부분 입체 이성질체)'] : ['(2R,3R)- + (2S,3S)-3-브로모뷰탄-2-올', '라세미'];
        if (ri === 8) return z ? ['cis-2,3-다이메틸옥시레인 (2R,3S)', '메조(아카이랄)'] : ['trans-2,3-다이메틸옥시레인 (2R,3R) + (2S,3S)', '라세미'];
      }
      if (A.ring) {
        if (ri === 5) return same ? ['cis-1,2-다이브로모-1-메틸사이클로헥세인', '라세미(가상의 신 첨가)'] : ['trans-1,2-다이브로모-1-메틸사이클로헥세인 (1R,2R) + (1S,2S)', '라세미'];
        if (ri === 6) return same ? ['cis-2-브로모-1-메틸사이클로헥산-1-올', '라세미(가상의 신 첨가)'] : ['trans-2-브로모-1-메틸사이클로헥산-1-올 (1R,2R) + (1S,2S)', '라세미'];
        if (ri === 9) return same ? ['cis-1-메틸사이클로헥세인-1,2-다이올 (1R,2S) + (1S,2R)', '라세미'] : ['trans-1-메틸사이클로헥세인-1,2-다이올', '라세미(가상의 안티 첨가)'];
        if (ri === 4) return same ? ['trans-2-메틸사이클로헥산-1-올 (1R,2R) + (1S,2S)', '라세미 — H·OH 신, OH와 CH₃는 트랜스'] : ['cis-2-메틸사이클로헥산-1-올', '라세미(가상의 안티 첨가)'];
      }
      return null;
    }
    var st = { a: 4, r: 5, face: 'auto', prod: false };
    var rIt = api.readout('중간체·전이 상태 '), rReg = api.readout('위치 선택성 '), rP = api.readout('생성물 '), rV = api.readout('판정 ');
    var g1 = api.group();
    var bA = ALK.map(function (A, k) { return api.button(A.n, function () { st.a = k; st.face = 'auto'; sync(); }, { toggle: true, pressed: k === st.a, parent: g1 }); });
    var g2 = api.group();
    var bR = RG.map(function (R, k) { return api.button(R.n, function () { st.r = k; st.face = 'auto'; sync(); }, { toggle: true, pressed: k === st.r, parent: g2 }); });
    var g3 = api.group();
    var bStep = api.button('생성물 보기', function () { st.prod = !st.prod; sync(); }, { primary: true, parent: g3 });
    var bF = [['auto', '시약대로'], ['same', '같은 면(신)'], ['opp', '반대 면(안티)']].map(function (f) {
      return api.button(f[1], function () { st.face = f[0]; sync(); }, { toggle: true, pressed: f[0] === 'auto', parent: g3 });
    });
    function face() {                       // 'same' | 'opp' | 'both' | 'cleave'
      var R = RG[st.r];
      if (R.mode === 'cleave') return 'cleave';
      if (R.epox) return 'same';
      if (st.face !== 'auto' && R.mode !== 'none') return st.face;
      if (st.face !== 'auto' && R.mode === 'none') return st.face;
      return R.mode === 'syn' ? 'same' : R.mode === 'anti' ? 'opp' : 'both';
    }
    function result() {
      var R = RG[st.r], f = face(), def = R.mode === 'syn' ? 'same' : R.mode === 'anti' ? 'opp' : null;
      var fd = (f === 'same' || f === 'opp') && def ? faceDep(st.a, st.r, f === 'same') : null;
      var p = fd || P[st.a][st.r] || faceDep(st.a, st.r, def === 'same');
      var note = '';
      if (st.face !== 'auto' && def && f !== def) note = ' ※ 실제 반응은 ' + (def === 'same' ? '같은 면(신)' : '반대 면(안티)');
      if (st.face !== 'auto' && !def && R.mode === 'none') note = ' ※ 이 반응은 실제로 두 면에서 같은 확률(면 통제 없음)';
      if (R.epox && st.face === 'opp') note = ' ※ 에폭시화는 O 하나가 한 면에 붙으므로 반대 면 첨가가 없다';
      return [p[0], p[1] + note];
    }
    function sync() {
      bA.forEach(function (b, k) { b.setAttribute('aria-pressed', k === st.a ? 'true' : 'false'); });
      bR.forEach(function (b, k) { b.setAttribute('aria-pressed', k === st.r ? 'true' : 'false'); });
      bF.forEach(function (b, k) { b.setAttribute('aria-pressed', ['auto', 'same', 'opp'][k] === st.face ? 'true' : 'false'); });
      bStep.textContent = st.prod ? '중간체 보기' : '생성물 보기';
      var R = RG[st.r], res = result();
      rIt.set(R.it + (st.a === 2 && (st.r === 0 || st.r === 2) ? ' → 1,2-메틸 이동(3° 양이온)' : ''));
      rReg.set(R.reg);
      rP.set(res[0]); rV.set(res[1]);
      S.redraw();
    }
    var CA = [-0.67, 0, 0], CB = [0.67, 0, 0];
    function add(p, d, s) { return [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s]; }
    var S = api.scene3d({
      yaw: 0.55, pitch: 0.38, dist: 10, scale: 0.16, label: '알켄의 두 탄소와 위·아래 면, 시약이 들어오는 방향과 생성물의 3차원 배치',
      aspect: function (w) { return w < 560 ? 0.95 : 0.55; },
      draw: function (g, T) {
        var A = ALK[st.a], R = RG[st.r], f = face(), prod = st.prod;
        var ink = T.figInk, col = { H: T.figPanel, O: T.figRed, OH: T.figRed, Br: T.figGreen };
        function atom(p, lab, small) {
          if (!lab) return;
          var isH = lab === 'H', r = isH ? 0.2 : (lab.length > 3 ? 0.36 : 0.3);
          var c = col[lab] || (lab.charAt(0) === 'C' ? T.figMuted : ink);
          g.sphere(p, small ? r * 0.8 : r, c, { outline: ink, label: isH ? 'H' : '' });
          if (!isH) g.text([p[0], p[1] + 0.48, p[2]], lab, { size: 12, bold: true });
        }
        var cleave = prod && f === 'cleave';
        var ca = cleave ? add(CA, [-1, 0, 0], 0.7) : CA, cb = cleave ? add(CB, [1, 0, 0], 0.7) : CB;
        // 탄소와 C–C 결합
        g.sphere(ca, 0.3, ink, { label: '' }); g.sphere(cb, 0.3, ink, { label: '' });
        g.text([ca[0], ca[1] - 0.55, ca[2]], 'Ca', { size: 11, color: T.figMuted }); g.text([cb[0], cb[1] - 0.55, cb[2]], 'Cb', { size: 11, color: T.figMuted });
        if (!cleave) {
          g.line(ca, cb, ink, { width: 4 });
          if (!prod) g.line(add(ca, [0, 0, 0.12], 1), add(cb, [0, 0, 0.12], 1), ink, { width: 2, dash: [5, 4] });
        }
        // 생성물에서 붙는 면: 위(+y) 또는 아래(−y)
        var xUp = 1, yUp = f === 'opp' ? -1 : 1;
        var pyr = prod && !cleave ? 0.3 : 0;
        function subs(c, list, sx, dy) {
          var front = add(add(c, [sx * 0.55, -dy * pyr, 0.95], 1), [0, 0, 0], 1), back = add(c, [sx * 0.55, -dy * pyr, -0.95], 1);
          [front, back].forEach(function (p, k) { if (list[k]) { g.line(c, p, ink, { width: 3 }); atom(p, list[k]); } });
          return back;
        }
        var ba = subs(ca, A.a, -1, xUp), bb = subs(cb, A.b, 1, f === 'both' ? 0 : yUp);
        if (A.ring) {                       // 고리: 뒤쪽으로 4개 탄소를 잇는다
          var r1 = add(ca, [-0.5, -0.05, -1.0], 1), r2 = add(ca, [-0.2, 0, -2.2], 1), r3 = add(cb, [0.2, 0, -2.2], 1), r4 = add(cb, [0.5, -0.05, -1.0], 1);
          g.path([ca, r1, r2, r3, r4, cb], ink, { width: 3 });
          [r1, r2, r3, r4].forEach(function (p) { g.sphere(p, 0.16, T.figMuted, { flat: true }); });
        }
        if (cleave) {
          var oa = add(ca, [1, 0, 0], 0.62), ob = add(cb, [-1, 0, 0], 0.62);
          g.line(ca, oa, T.figRed, { width: 4 }); g.line(cb, ob, T.figRed, { width: 4 });
          atom(oa, 'O'); atom(ob, 'O');
          g.text([0, 1.3, 0], 'C=C가 끊겨 C=O 두 개', { size: 12, color: T.figViolet });
          return;
        }
        if (!prod) {                         // 중간체·전이 상태
          var up = [0, 1, 0];
          if (st.r === 0 || st.r === 2 || st.r === 1) {
            atom(add(ca, up, 1.05), R.x); g.line(ca, add(ca, up, 1.05), ink, { width: 3 });
            if (st.r === 1) { g.sphere(add(cb, up, 0.45), 0.08, ink, { flat: true }); g.text(add(cb, up, 0.85), '·  라디칼', { size: 12 }); }
            else {
              g.sphere(add(cb, up, 0.55), 0.32, T.figSoftBlue, { alpha: 0.35, outline: T.figBlue });
              g.sphere(add(cb, up, -0.55), 0.32, T.figSoftBlue, { alpha: 0.35, outline: T.figBlue });
              g.text(add(cb, [0.5, 0.3, 0.3], 1), '+', { size: 16, bold: true });
            }
            g.arrow(add(cb, up, 2.15), add(cb, up, 1.15), T.figViolet, { width: 2 });
            g.arrow(add(cb, up, -2.15), add(cb, up, -1.15), T.figViolet, { width: 2 });
            g.text(add(cb, up, 2.4), R.y + ' (위)', { size: 12, color: T.figViolet });
            g.text(add(cb, up, -2.4), R.y + ' (아래)', { size: 12, color: T.figViolet });
          } else if (st.r === 3 || st.r === 5 || st.r === 6) {
            var br = [-0.2, 1.25, 0], lab = st.r === 3 ? 'Hg' : 'Br';
            g.line(ca, br, ink, { width: 3 }); g.line(cb, br, ink, { width: 2, dash: st.r === 5 ? null : [5, 4] });
            g.sphere(br, 0.36, st.r === 3 ? T.figViolet : T.figGreen, { outline: ink });
            g.text([br[0], br[1] + 0.6, 0], lab + '⁺ 다리(위쪽 면)', { size: 12, bold: true });
            g.arrow(add(cb, up, -2.15), add(cb, up, -0.75), T.figViolet, { width: 2 });
            g.text(add(cb, up, -2.4), (st.r === 5 ? 'Br⁻' : 'H₂O') + ' — 반대 면에서', { size: 12, color: T.figViolet });
          } else if (st.r === 4) {
            var B = add(ca, up, 1.3), Hh = add(cb, up, 1.3);
            g.sphere(B, 0.3, T.figAmber, { outline: ink }); g.text(add(B, up, 0.55), 'B', { size: 12, bold: true });
            g.sphere(Hh, 0.2, T.figPanel, { outline: ink, label: 'H' });
            g.line(ca, B, ink, { width: 2, dash: [5, 4] }); g.line(cb, Hh, ink, { width: 2, dash: [5, 4] }); g.line(B, Hh, ink, { width: 2, dash: [5, 4] });
            g.text([0, 2.3, 0], '4중심 전이 상태: B와 H가 같은 면에서', { size: 12, color: T.figViolet });
          } else if (st.r === 7) {
            var yS = -1.35;
            g.poly([[-2.4, yS, -1.8], [2.4, yS, -1.8], [2.4, yS, 1.8], [-2.4, yS, 1.8]], T.figMuted, { alpha: 0.25, stroke: T.figMuted, strokeWidth: 1 });
            g.sphere(add(ca, up, -0.95), 0.2, T.figPanel, { outline: ink, label: 'H' });
            g.sphere(add(cb, up, -0.95), 0.2, T.figPanel, { outline: ink, label: 'H' });
            g.text([1.9, yS - 0.3, 1.6], 'Pd 표면', { size: 12 });
          } else if (st.r === 8 || st.r === 9) {
            if (st.r === 8) {
              var Oo = [0, 1.2, 0];
              g.sphere(Oo, 0.3, T.figRed, { outline: ink }); g.line(ca, Oo, ink, { width: 2, dash: [5, 4] }); g.line(cb, Oo, ink, { width: 2, dash: [5, 4] });
              g.text([0, 1.85, 0], 'RCO₃H의 O(위쪽 면)', { size: 12, color: T.figViolet });
            } else {
              var o1 = add(ca, up, 1.1), o2 = add(cb, up, 1.1), os = [0, 1.9, 0];
              [o1, o2].forEach(function (o, k) { g.sphere(o, 0.26, T.figRed, { outline: ink }); g.line(k ? cb : ca, o, ink, { width: 3 }); g.line(o, os, ink, { width: 3 }); });
              g.sphere(os, 0.36, T.figViolet, { outline: ink }); g.text([0, 2.45, 0], 'Os 고리 에스터(위쪽 면)', { size: 12, bold: true });
            }
          }
          return;
        }
        // 생성물
        if (R.epox) {
          var Oe = [0, 1.0, 0];
          g.line(ca, Oe, T.figRed, { width: 3 }); g.line(cb, Oe, T.figRed, { width: 3 }); atom(Oe, 'O');
          return;
        }
        var pa = add(ca, [0, xUp, 0], 1.05);
        g.line(ca, pa, ink, { width: 3 }); atom(pa, R.x);
        if (f === 'both') {
          var p1 = add(cb, [0, 1, 0], 1.05), p2 = add(cb, [0, -1, 0], 1.05);
          g.line(cb, p1, ink, { width: 2, dash: [4, 4] }); g.line(cb, p2, ink, { width: 2, dash: [4, 4] });
          atom(p1, R.y, true); atom(p2, R.y, true);
          g.text([cb[0] + 1.0, -0.55, 0], '두 면 1 : 1', { size: 12, color: T.figViolet });
        } else {
          var pb = add(cb, [0, yUp, 0], 1.05);
          g.line(cb, pb, ink, { width: 3 }); atom(pb, R.y);
          g.text([0, -2.1, 0], f === 'same' ? '같은 면(신)' : '반대 면(안티)', { size: 13, bold: true, color: T.figViolet });
        }
      },
    });
    api.onTheme(function () { S.redraw(); });
    sync();
  },
});
