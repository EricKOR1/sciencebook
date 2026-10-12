/* 3-6 전사와 번역: 핵 속 DNA → mRNA(전사) → 세포질의 리보솜에서 아미노산 사슬(번역). 예제 2·3의 서열을 그대로 쓴다 */
Sims.register('transcription', {
  title: '유전자에서 단백질까지 — 전사와 번역 따라가기',
  caption: '‘다음 단계’를 눌러 예제 2·3의 유전자가 단백질이 되는 과정을 따라가 보자. 핵 속에서 주형 가닥의 염기와 상보적인 염기(A→U, T→A, G→C, C→G)가 이어져 mRNA가 되고, 세포질의 리보솜은 mRNA를 코돈(염기 3개)씩 읽는다. tRNA가 코돈에 맞는 아미노산을 가져와 사슬이 길어지다가 종결 코돈에서 끝난다. 가닥의 방향, 여러 tRNA가 동시에 붙는 모습, 실제 크기 비율 등은 설명을 위해 생략하거나 단순화했다.',
  init: function (api) {
    var TPL = 'TACCTTCAAACCATT';                               // 예제 2의 DNA 주형 가닥
    var PAIR_DNA = { A: 'T', T: 'A', G: 'C', C: 'G' };
    var PAIR_RNA = { A: 'U', T: 'A', G: 'C', C: 'G' };        // 주형 가닥 → mRNA
    var OTHER = TPL.split('').map(function (b) { return PAIR_DNA[b]; }).join('');
    var MRNA = TPL.split('').map(function (b) { return PAIR_RNA[b]; }).join('');
    var CODE = { AUG: '메싸이오닌', GAA: '글루탐산', GUU: '발린', UGG: '트립토판', UAA: null, UAG: null, UGA: null }; // 표준 유전 암호(이 서열에 쓰인 것)
    var ANTI = { A: 'U', U: 'A', G: 'C', C: 'G' };
    var CODONS = [0, 1, 2, 3, 4].map(function (i) { return MRNA.substr(i * 3, 3); });
    var AA = CODONS.map(function (c) { return CODE[c]; });     // 마지막은 null(종결)
    var ANTIC = CODONS.map(function (c) { return c.split('').map(function (b) { return ANTI[b]; }).join(''); });

    var STEPS = [
      { t: '처음 — 핵 속의 유전자(DNA 두 가닥)', d: '위쪽이 주형 가닥, 아래쪽이 다른 가닥이다. 단백질을 만드는 리보솜은 핵 밖 세포질에 있다.', dur: 0, place: '핵' },
      { t: '① 전사 시작 — DNA 두 가닥이 풀린다', d: '유전자 부분의 이중 나선이 풀려 두 가닥이 떨어진다. 위쪽 가닥만 틀(주형)로 쓰인다.', dur: 1.4, place: '핵' },
      { t: '① 전사 — 주형 가닥을 따라 mRNA를 만든다', d: 'RNA 중합 효소가 주형 가닥의 염기와 상보적인 RNA 염기를 하나씩 잇는다. A→U, T→A, G→C, C→G', dur: 6, place: '핵' },
      { t: '② mRNA가 핵공을 지나 세포질로 나간다', d: 'DNA는 다시 이중 나선으로 돌아가며, DNA 자체는 변하지 않는다.', dur: 3.2, place: '핵 → 세포질' },
      { t: '③ 번역 시작 — 개시 코돈 AUG', d: '리보솜이 mRNA에 붙고, 안티코돈 UAC를 가진 tRNA가 메싸이오닌을 가져온다.', dur: 2.4, place: '세포질(리보솜)' },
      { t: '③ 번역 — 코돈 GAA', d: '리보솜이 코돈 하나만큼 옮겨 간다. 안티코돈 CUU인 tRNA가 글루탐산을 가져와 앞의 아미노산과 연결한다(펩타이드 결합).', dur: 2.4, place: '세포질(리보솜)' },
      { t: '③ 번역 — 코돈 GUU', d: '안티코돈 CAA인 tRNA가 발린을 가져와 사슬에 연결한다.', dur: 2.4, place: '세포질(리보솜)' },
      { t: '③ 번역 — 코돈 UGG', d: '안티코돈 ACC인 tRNA가 트립토판을 가져와 사슬에 연결한다.', dur: 2.4, place: '세포질(리보솜)' },
      { t: '④ 종결 — 종결 코돈 UAA', d: '종결 코돈에 맞는 tRNA는 없다. 번역이 끝나고 아미노산 사슬이 떨어져 나와 입체 구조로 접혀 단백질이 된다.', dur: 2.8, place: '세포질(리보솜)' },
    ];
    var LAST = STEPS.length - 1;
    var st = { s: 0, p: 1, auto: false, wait: 0 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.36 : 0.72; }, label: '핵 속에서 DNA가 전사되어 mRNA가 되고 세포질의 리보솜에서 번역되는 과정' });
    var ctx = cv.ctx;
    var rStep = api.readout('단계');
    var rPlace = api.readout('장소');
    var rPair = api.readout('짝 맞추기');
    var rChain = api.readout('아미노산 사슬');

    var bReset = api.button('처음으로', function () { go(0, true); });
    var bNext = api.button('다음 단계', function () { next(); }, { primary: true });
    var bAuto = api.button('자동 재생', function () { toggleAuto(); }, { toggle: true });
    if (api.reduced) { bAuto.disabled = true; bAuto.title = '움직임 줄이기 설정에서는 다음 단계 버튼으로 넘겨 보자'; }

    function go(s, instant) {
      st.s = s; st.p = (instant || api.reduced || STEPS[s].dur === 0) ? 1 : 0; st.wait = 0;
      if (s === 0) { st.auto = false; bAuto.setAttribute('aria-pressed', 'false'); }
      sync(); draw();
      if (st.p < 1 || st.auto) loop.play();
    }
    function next() { if (st.s < LAST) go(st.s + 1); }
    function toggleAuto() {
      st.auto = !st.auto; bAuto.setAttribute('aria-pressed', st.auto ? 'true' : 'false');
      if (st.auto) { if (st.s === LAST && st.p >= 1) go(0, true); st.auto = true; bAuto.setAttribute('aria-pressed', 'true'); st.wait = st.p >= 1 ? 0.6 : 0; loop.play(); }
    }
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;   // 첫 프레임의 dt가 0 이하일 수 있음
      if (st.p < 1) st.p = Math.min(1, st.p + dt / STEPS[st.s].dur);
      else if (st.auto) {
        st.wait += dt;
        if (st.wait > 1.4) { if (st.s < LAST) go(st.s + 1); else { st.auto = false; bAuto.setAttribute('aria-pressed', 'false'); } }
      }
      sync(); draw();
      if (st.p >= 1 && !st.auto) loop.pause();
    });
    loop.pause();

    function clamp(x) { return Math.max(0, Math.min(1, x)); }
    function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
    function built() { return st.s < 2 ? 0 : st.s === 2 ? Math.min(15, Math.floor(st.p * 15.999)) : 15; }
    function chainLen() {   // 사슬에 붙은 아미노산 수
      if (st.s < 4) return 0;
      var n = Math.min(4, st.s - 4);
      if (st.s <= 7 && st.p >= 1) n += 1;
      return n;
    }
    function sync() {
      bNext.disabled = st.s >= LAST;
      rStep.set(st.s === 0 ? '처음' : st.s + ' / ' + LAST);
      rPlace.set(STEPS[st.s].place);
      var pair = '–';
      if (st.s === 2) { var i = Math.max(0, built() - 1); pair = '주형 ' + TPL[i] + ' → mRNA ' + MRNA[i]; }
      else if (st.s === 3) pair = 'mRNA ' + CODONS.join(' ');
      else if (st.s >= 4 && st.s <= 7) { var c = st.s - 4; pair = '코돈 ' + CODONS[c] + ' ↔ 안티코돈 ' + ANTIC[c]; }
      else if (st.s === 8) pair = CODONS[4] + ' = 종결 코돈';
      rPair.set(pair);
      var n = chainLen();
      rChain.set(n ? AA.slice(0, n).join('–') : '아직 없음');
      bAuto.setAttribute('aria-pressed', st.auto ? 'true' : 'false');
    }

    /* ───── 배치 ───── */
    function geo() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var textH = narrow ? 64 : 46;
      var bw = Math.min(25, (w - 36) / (15 + 4 * 0.45)), gap = bw * 0.45, bh = Math.min(24, Math.max(17, bw * 1.02));
      var total = 15 * bw + 4 * gap, x0 = (w - total) / 2;
      var nTop = textH + 4, nBot = nTop + 4.5 * bh + 80;
      return { w: w, h: h, narrow: narrow, textH: textH, bw: bw, gap: gap, bh: bh, x0: x0, total: total,
        nTop: nTop, nBot: nBot, yc: nTop + 1.5 * bh + 46, cTop: nBot + 8,
        xOf: function (i) { return x0 + i * bw + Math.floor(i / 3) * gap; },
        codonX: function (c) { return x0 + c * (3 * bw + gap) + 1.5 * bw; },
        codonW: 3 * bw + gap };
    }
    var BASECOL = { A: ['figSoftRed', 'figRed'], T: ['figSoftAmber', 'figAmber'], U: ['figSoftViolet', 'figViolet'], G: ['figSoftGreen', 'figGreen'], C: ['figSoftBlue', 'figBlue'] };
    function base(T, G, x, y, letter, alpha) {
      var c = BASECOL[letter];
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.fillStyle = T[c[0]]; ctx.strokeStyle = T[c[1]]; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(x + 1, y, G.bw - 2, G.bh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + Math.round(Math.max(11, Math.min(14, G.bw * 0.56))) + 'px ' + T.fontMono;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(letter, x + G.bw / 2, y + G.bh / 2 + 1);
      ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    }
    function backbone(G, xs, y, color, lw) {
      ctx.strokeStyle = color; ctx.lineWidth = lw || 3; ctx.beginPath();
      xs.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1] + y); else ctx.moveTo(p[0], p[1] + y); });
      ctx.stroke();
    }
    function wrap(text, maxW) {
      var words = text.split(' '), lines = [], cur = '';
      words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; });
      if (cur) lines.push(cur); return lines;
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function draw() {
      var T = api.tokens(), G = geo(), s = st.s, p = st.p;
      ctx.clearRect(0, 0, G.w, G.h);
      // 단계 설명
      var S = STEPS[s];
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontBody;
      ctx.fillText(S.t, 6, 16);
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      wrap(S.d, G.w - 12).slice(0, 3).forEach(function (ln, i) { ctx.fillText(ln, 6, 33 + i * 15); });
      drawNucleus(T, G, s, p);
      drawCyto(T, G, s, p);
      drawRibosome(T, G, s, p);
      drawMRNA(T, G, s, p);
      drawTranslation(T, G, s, p);
    }

    function drawNucleus(T, G, s, p) {
      // 핵막(이중 막)과 핵공
      var px = G.w / 2, pw = 22;
      ctx.fillStyle = T.figSoftBlue; rr(4, G.nTop, G.w - 8, G.nBot - G.nTop, 16); ctx.fill();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      [0, 5].forEach(function (o) {
        ctx.beginPath();
        ctx.moveTo(px - pw / 2, G.nBot - o); ctx.lineTo(4 + 16 + o, G.nBot - o);
        ctx.arcTo(4 + o, G.nBot - o, 4 + o, G.nTop + o, 16);
        ctx.arcTo(4 + o, G.nTop + o, G.w - 4 - o, G.nTop + o, 16);
        ctx.arcTo(G.w - 4 - o, G.nTop + o, G.w - 4 - o, G.nBot - o, 16);
        ctx.arcTo(G.w - 4 - o, G.nBot - o, px + pw / 2, G.nBot - o, 16);
        ctx.lineTo(px + pw / 2, G.nBot - o); ctx.stroke();
      });
      ctx.fillStyle = T.figBlue; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('핵', 16, G.nTop + 20);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('핵공', px, G.nBot + 16);
      // DNA 두 가닥
      var U = s === 0 ? 0 : s === 1 ? ease(p) : s === 2 ? 1 : s === 3 ? 1 - ease((p - 0.45) / 0.5) : 0;
      var up = U * G.bh * 0.5, down = U * G.bh * 1.75;
      var tTop = G.yc - G.bh - 2 - up, oTop = G.yc + 2 + down;
      var xs = []; for (var i = 0; i < 15; i++) xs.push([G.xOf(i) + G.bw / 2, 0]);
      xs = [[G.x0 - 8, 0]].concat(xs, [[G.x0 + G.total + 8, 0]]);
      var dA = s === 3 ? 0.35 + 0.65 * ease((p - 0.55) / 0.3) : 1;   // mRNA가 지나가는 동안 DNA를 흐리게
      ctx.globalAlpha = dA;
      backbone(G, xs, tTop - 3, T.figInk); backbone(G, xs, oTop + G.bh + 3, T.figInk);
      ctx.globalAlpha = 1;
      for (var j = 0; j < 15; j++) { base(T, G, G.xOf(j), tTop, TPL[j], dA); base(T, G, G.xOf(j), oTop, OTHER[j], dA); }
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('DNA 주형 가닥', G.x0, tTop - 9);
      ctx.fillText('DNA 다른 가닥', G.x0, oTop + G.bh + 17);
      if (s === 0) {
        ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
        ctx.fillText('유전자 부분', G.x0 + G.total, tTop - 9);
      }
      // RNA 중합 효소
      if (s === 2 && p < 1) {
        var k = Math.min(14, built()), ex = G.xOf(k) + G.bw / 2, ey = tTop + G.bh + 4 + G.bh / 2;
        ctx.globalAlpha = 0.5; ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(ex, ey, G.bw * 1.6, G.bh * 1.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
        ctx.fillStyle = T.figViolet; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = ex > G.w / 2 ? 'right' : 'left';
        ctx.fillText('RNA 중합 효소', ex + (ex > G.w / 2 ? -G.bw * 1.7 : G.bw * 1.7), ey + G.bh * 1.25 + 4);
      }
    }
    function mrnaNucleusY(G, s, p) {   // 핵 속 mRNA 염기 상자의 위쪽 y (주형 가닥 바로 아래)
      var up = G.bh * 0.5;
      return G.yc - G.bh - 2 - up + G.bh + 4;
    }
    function cytoY(G) {   // 세포질 mRNA 염기 상자의 위쪽 y
      var cH = G.h - G.cTop;
      return G.cTop + Math.min(Math.max(118 + 2 * G.bh, cH * 0.55), cH - 34 - G.bh);
    }
    function drawMRNA(T, G, s, p) {
      var n = built(); if (!n) return;
      var yN = mrnaNucleusY(G), yC = cytoY(G), pxp = G.w / 2, pyp = G.nBot - 2;
      var pts = [];
      for (var i = 0; i < n; i++) {
        var x = G.xOf(i), y = yN;
        if (s === 3) {
          var st0 = i / 14 * 0.5, q = ease((p - st0) / 0.5);
          var ax = x, ay = yN, bx = pxp - G.bw / 2, by = pyp - G.bh / 2, cx = x, cy = yC;
          var d1 = Math.hypot(bx - ax, by - ay), d2 = Math.hypot(cx - bx, cy - by), dd = q * (d1 + d2);
          if (dd <= d1) { x = ax + (bx - ax) * dd / d1; y = ay + (by - ay) * dd / d1; }
          else { var k = (dd - d1) / d2; x = bx + (cx - bx) * k; y = by + (cy - by) * k; }
        } else if (s > 3) { y = yC; }
        pts.push([x, y]);
      }
      // 뼈대(아래쪽)
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 3; ctx.beginPath();
      pts.forEach(function (q, i) { var X = q[0] + G.bw / 2, Y = q[1] + G.bh + 3; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.stroke();
      pts.forEach(function (q, i) {
        var fresh = s === 2 && i === n - 1 && p < 1;
        base(T, G, q[0], q[1], MRNA[i]);
        if (fresh) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.strokeRect(q[0], q[1] - 1, G.bw, G.bh + 2); }
      });
      // 이름표
      ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figViolet; ctx.textAlign = 'left';
      if (s <= 2) ctx.fillText('mRNA', G.x0, yN + G.bh + 17);
      else if (s >= 4 || p >= 1) {
        var rp = ribPos(s, p), lab = rp < 2 ? 4 : 0;
        ctx.textAlign = 'center'; ctx.fillText('mRNA', G.codonX(lab), yC + G.bh + 18);
      }
      // 코돈 구분(세포질)
      if (s >= 4 || (s === 3 && p >= 1)) {
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      }
    }
    function ribPos(s, p) {
      if (s <= 4) return 0;
      if (s <= 8) return (s - 5) + ease(p / 0.3);
      return 4;
    }
    function drawCyto(T, G, s, p) {
      ctx.fillStyle = T.figMuted; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('세포질', G.w - 8, G.cTop + 16);
    }
    function pillW(T, name) { ctx.font = '600 11px ' + T.fontBody; return ctx.measureText(name).width + 14; }
    function pill(T, x, y, name, color, soft, alpha) {   // x, y: 가운데
      var wdt = pillW(T, name);
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      rr(x - wdt / 2, y - 10, wdt, 20, 10); ctx.fillStyle = T[soft]; ctx.fill(); ctx.strokeStyle = T[color]; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 11px ' + T.fontBody;
      ctx.fillText(name, x, y + 1); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    }
    function drawRibosome(T, G, s, p) {
      var yC = cytoY(G), cw = G.codonW;
      var rel = s === 8 ? ease((p - 0.45) / 0.55) : 0;
      // 리보솜
      var rp = s < 4 ? 1 : ribPos(s, p), rx = G.codonX(0) + rp * cw;
      var ra = s < 4 ? 0.35 : s === 4 ? 0.35 + 0.65 * ease(p / 0.3) : 1;
      var sep = rel * 10;
      ctx.globalAlpha = ra;
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(rx - cw * 0.5, yC + G.bh * 0.15 - sep, cw * 1.25, G.bh * 1.55, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      var smY = yC + G.bh + 4 + sep, smH = Math.max(11, G.bh * 0.55);
      ctx.beginPath(); ctx.ellipse(rx - cw * 0.5, smY + smH * 0.2, cw * 1.2, smH, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figAmber; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(s < 4 ? '리보솜(대기 중)' : '리보솜', Math.max(rx - cw * 0.5, 48), smY + smH * 0.2 + 13);
      ctx.globalAlpha = 1;
    }
    function drawTranslation(T, G, s, p) {
      var yC = cytoY(G), cw = G.codonW;
      var chainY = G.cTop + 32, aaY = chainY + 36;
      var antiTop = yC - G.bh - 3;
      // 사슬 자리
      var slots = [], sx = G.x0 + 2;
      for (var i = 0; i < 4; i++) { var wd = pillW(T, AA[i]); slots.push(sx + wd / 2); sx += wd + 12; }
      var rel = s === 8 ? ease((p - 0.45) / 0.55) : 0;
      // tRNA
      var bound = -1;
      for (var c = 0; c < 4; c++) {
        var a = st.s === 4 + c ? ease((p - 0.15) / 0.45) : (s > 4 + c ? 1 : 0);
        var l = s === 5 + c ? ease(p / 0.4) : (s > 5 + c ? 1 : 0);
        if (a <= 0 || l >= 1) continue;
        if (a >= 1 && l === 0) bound = c;
        var ox = (1 - a) * cw * 1.3 - l * cw * 1.1, oy = -(1 - a) * 60 - l * 50, al = Math.min(a * 1.5, 1) * (1 - l);
        var cx0 = G.codonX(c) + ox, bodyTop = aaY + 11 + oy, bodyBot = antiTop - G.bh + oy;
        ctx.globalAlpha = al;
        rr(cx0 - cw * 0.32, bodyTop, cw * 0.64, bodyBot - bodyTop, 6);
        ctx.fillStyle = T.figSoftTeal; ctx.fill(); ctx.strokeStyle = T.figTeal; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = T.figTeal; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        if (bodyBot - bodyTop > 14) ctx.fillText('tRNA', cx0, (bodyTop + bodyBot) / 2 + 4);
        ctx.globalAlpha = 1;
        for (var j = 0; j < 3; j++) base(T, G, G.xOf(c * 3 + j) + ox, antiTop - G.bh + oy, ANTIC[c][j], al);
        // 실려 온 아미노산
        var onT = s === 4 + c && p < 0.72;
        if (onT) pill(T, cx0, aaY + oy, AA[c], 'figGreen', 'figSoftGreen', al);
        else if (s === 4 + c && p < 1) {
          var k = ease((p - 0.72) / 0.28);
          pill(T, cx0 + (slots[c] - cx0) * k, aaY + (chainY - aaY) * k, AA[c], 'figGreen', 'figSoftGreen');
        }
      }
      // 사슬
      var n = chainLen(), shownN = Math.min(n, 4);
      var dy = -rel * 4;
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2.5;
      for (var m = 1; m < shownN; m++) { ctx.beginPath(); ctx.moveTo(slots[m - 1], chainY + dy); ctx.lineTo(slots[m], chainY + dy); ctx.stroke(); }
      for (var q = 0; q < shownN; q++) pill(T, slots[q], chainY + dy, AA[q], 'figGreen', 'figSoftGreen');
      if (bound >= 0 && shownN && s < 8) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(slots[shownN - 1], chainY + 10); ctx.lineTo(G.codonX(bound), aaY + 11); ctx.stroke(); ctx.setLineDash([]);
      }
      if (n && s < 8) {
        ctx.fillStyle = T.figGreen; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        var endX = slots[shownN - 1] + pillW(T, AA[shownN - 1]) / 2 + 8;
        if (endX + 70 < G.w) ctx.fillText('← 아미노산 사슬', endX, chainY + 4);
      }
      if (s === 0 && G.cTop) {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('아직 mRNA가 오지 않았다', G.codonX(2) + cw * 0.25, yC + G.bh / 2);
      }
      // 종결
      if (s === 8 && p > 0.3) {
        var sx4 = Math.min(G.codonX(4) + cw / 2, G.w - 6);
        ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('종결 코돈', sx4, antiTop - 22);
        ctx.fillText('맞는 tRNA 없음', sx4, antiTop - 7);
      }
      if (s === 8 && rel > 0) {
        ctx.globalAlpha = rel; ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        var msg = '완성된 아미노산 사슬(폴리펩타이드) → 접혀서 단백질';
        var lines = ctx.measureText(msg).width > G.w - G.x0 - 8 ? ['완성된 아미노산 사슬(폴리펩타이드)', '→ 입체 구조로 접혀 단백질이 된다'] : [msg];
        lines.forEach(function (ln, i) { ctx.fillText(ln, G.x0, chainY + 27 + i * 15); });
        ctx.globalAlpha = 1;
      }
    }

    api.onResize(draw);
    sync(); draw();
  },
});
