/* 중1-2 생물의 구성과 다양성: 특징 질문에 따라 생물 카드를 5계로 분류해 보기 */
Sims.register('kingdom-sort', {
  title: '생물 카드를 5계로 나누어 보자',
  caption: '생물 카드를 고르고 특징을 읽은 뒤, 아래 다섯 칸 가운데 알맞은 계를 눌러 넣어 보자. 틀리면 어떤 특징 때문에 그 계가 아닌지 알려 주고, 막히면 \'질문 따라가기\'로 순서도의 질문에 하나씩 답하며 분류할 수 있다. 미역은 광합성을 해도 조직과 기관이 발달하지 않아 원생생물계, 버섯은 땅에서 자라도 균사로 된 몸으로 양분을 흡수해 균계이다. 키보드: 화살표로 카드 고르기, 1~5로 넣기, Enter로 질문 따라가기. 질문은 본문의 5계 분류 순서도를 따른 단순화이다.',
  init: function (api) {
    var KING = ['원핵생물계', '원생생물계', '균계', '식물계', '동물계'];
    var KCOL = ['Teal', 'Blue', 'Amber', 'Green', 'Red'];
    // nuc: 뚜렷한 핵(핵막), multi: 다세포, photo: 광합성, hypha: 균사로 된 몸·양분 흡수, organ: 조직·기관 발달
    var CARDS = [
      { n: '대장균', k: 0, nuc: 0, multi: 0, photo: 0, hypha: 0, organ: 0 },
      { n: '남세균', k: 0, nuc: 0, multi: 0, photo: 1, hypha: 0, organ: 0 },
      { n: '짚신벌레', k: 1, nuc: 1, multi: 0, photo: 0, hypha: 0, organ: 0 },
      { n: '유글레나', k: 1, nuc: 1, multi: 0, photo: 1, hypha: 0, organ: 0 },
      { n: '미역', k: 1, nuc: 1, multi: 1, photo: 1, hypha: 0, organ: 0 },
      { n: '표고버섯', k: 2, nuc: 1, multi: 1, photo: 0, hypha: 1, organ: 0 },
      { n: '푸른곰팡이', k: 2, nuc: 1, multi: 1, photo: 0, hypha: 1, organ: 0 },
      { n: '고사리', k: 3, nuc: 1, multi: 1, photo: 1, hypha: 0, organ: 1 },
      { n: '소나무', k: 3, nuc: 1, multi: 1, photo: 1, hypha: 0, organ: 1 },
      { n: '지렁이', k: 4, nuc: 1, multi: 1, photo: 0, hypha: 0, organ: 1 },
      { n: '개구리', k: 4, nuc: 1, multi: 1, photo: 0, hypha: 0, organ: 1 },
      { n: '벼', k: 3, nuc: 1, multi: 1, photo: 1, hypha: 0, organ: 1 },
    ];
    // 화면 순서를 섞어 둔다(계별로 몰려 있지 않게)
    var ORDER = [4, 0, 9, 5, 2, 7, 1, 10, 6, 3, 8, 11];
    CARDS = ORDER.map(function (i) { return CARDS[i]; });
    var QS = [
      { q: '뚜렷한 핵(핵막)이 있는가?', key: 'nuc', yes: '뚜렷한 핵이 있다', no: '뚜렷한 핵이 없다' },
      { q: '몸이 균사로 되어 있고 양분을 흡수하는가?', key: 'hypha', yes: '몸이 균사로 되어 있고 양분을 흡수한다', no: '균사로 된 몸이 아니다' },
      { q: '조직과 기관이 발달한 다세포 생물인가?', key: 'organ', yes: '조직과 기관이 발달한 다세포 생물이다', no: '조직과 기관이 발달하지 않았다' },
      { q: '광합성을 하는가?', key: 'photo', yes: '광합성을 한다', no: '광합성을 하지 않는다' },
    ];
    // 각 계에 이르는 답(순서도 경로)
    var PATH = [[[0, 0]], [[0, 1], [1, 0], [2, 0]], [[0, 1], [1, 1]], [[0, 1], [1, 0], [2, 1], [3, 1]], [[0, 1], [1, 0], [2, 1], [3, 0]]];

    var st = { sel: 0, placed: CARDS.map(function () { return -1; }), missed: CARDS.map(function () { return false; }), step: 0, msg: null, flash: -1 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? Math.max(1.2, 650 / w) : 0.8; }, label: '생물 카드, 고른 생물의 특징과 분류 질문, 다섯 계의 칸' });
    var ctx = cv.ctx, cvs = cv.canvas;
    cvs.tabIndex = 0;
    cvs.style.cursor = 'pointer';

    var rDone = api.readout('분류한 생물');
    var rFirst = api.readout('한 번에 맞힌 생물');
    api.button('질문 따라가기', function () { stepQuestion(); }, { primary: true });
    api.button('처음부터', function () { reset(); });

    function path(c) {   // 이 카드가 순서도에서 거치는 [질문, 답] 목록
      var out = [];
      out.push([0, c.nuc]); if (!c.nuc) return out;
      out.push([1, c.hypha]); if (c.hypha) return out;
      out.push([2, c.organ]); if (!c.organ) return out;
      out.push([3, c.photo]); return out;
    }
    function facts(c) {
      return [
        ['핵막(뚜렷한 핵)', c.nuc ? '있다' : '없다'],
        ['세포 수', c.multi ? '다세포' : '단세포'],
        ['광합성', c.photo ? '한다' : '하지 않는다'],
        ['균사로 된 몸', c.hypha ? '그렇다(양분 흡수)' : '아니다'],
        ['조직·기관', c.organ ? '발달했다' : (c.multi ? '발달하지 않았다' : '없다(단세포)')],
      ];
    }
    function nextFree(from) {
      for (var i = 1; i <= CARDS.length; i++) { var j = (from + i) % CARDS.length; if (st.placed[j] < 0) return j; }
      return -1;
    }
    function select(i) { if (i < 0) return; st.sel = i; st.step = 0; st.msg = null; draw(); }
    function place(k) {
      var i = st.sel; if (i < 0 || st.placed[i] >= 0) return;
      var c = CARDS[i];
      if (k === c.k) {
        st.placed[i] = k;
        var why = path(c).map(function (a) { return a[1] ? QS[a[0]].yes : QS[a[0]].no; }).join(', ');
        st.msg = { ok: true, text: '맞다! ' + c.n + ' → ' + KING[k] + ' (' + why + ')' };
        st.flash = k;
        var nx = nextFree(i); st.sel = nx; st.step = 0;
      } else {
        st.missed[i] = true;
        var need = PATH[k], why2 = '';
        for (var q = 0; q < need.length; q++) {
          var qi = need[q][0], ans = c[QS[qi].key];
          if (ans !== need[q][1]) { why2 = ans ? QS[qi].yes : QS[qi].no; break; }
        }
        st.msg = { ok: false, text: c.n + '은(는) ' + KING[k] + '가 아니다: ' + why2 + '. 특징을 다시 읽어 보자.' };
        st.flash = -1;
      }
      update(); draw();
    }
    function stepQuestion() {
      var i = st.sel; if (i < 0) return;
      var p = path(CARDS[i]);
      st.msg = null;
      if (st.step < p.length) { st.step++; draw(); return; }
      st.missed[i] = true;         // 질문을 따라 넣은 것은 '한 번에 맞힘'에서 뺀다
      place(CARDS[i].k);
    }
    function reset() {
      st.placed = CARDS.map(function () { return -1; }); st.missed = CARDS.map(function () { return false; });
      st.sel = 0; st.step = 0; st.msg = null; st.flash = -1; update(); draw();
    }
    function update() {
      var n = 0, f = 0;
      st.placed.forEach(function (p, i) { if (p >= 0) { n++; if (!st.missed[i]) f++; } });
      rDone.set(n + ' / ' + CARDS.length); rFirst.set(f + '개');
      if (n === CARDS.length) st.msg = { ok: true, text: '12개 생물을 모두 분류했다! 같은 계 안에서도 단세포와 다세포, 광합성 여부가 섞여 있는 곳을 찾아보자.' };
    }

    /* ── 배치 ── */
    var L = {};
    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var binH = narrow ? 112 : 118;
      var binY = h - binH;
      var cards = [], bins = [];
      var cols = narrow ? 3 : 3, rows = 4;
      var cx0 = 0, cw = narrow ? w : w * 0.44, cy0 = 22;
      var gap = 8, ch = narrow ? 40 : Math.min(66, (binY - 14 - cy0) / rows - gap);
      var cwid = (cw - gap * (cols - 1)) / cols;
      for (var i = 0; i < CARDS.length; i++) {
        var r = Math.floor(i / cols), c = i % cols;
        cards.push({ x: cx0 + c * (cwid + gap), y: cy0 + r * (ch + gap), w: cwid, h: ch });
      }
      var panel = narrow ? { x: 0, y: cy0 + rows * (ch + gap) + 6, w: w, h: binY - (cy0 + rows * (ch + gap) + 6) - 10 }
        : { x: w * 0.47, y: 0, w: w * 0.53, h: binY - 12 };
      var bw = (w - gap * 4) / 5;
      for (var k = 0; k < 5; k++) bins.push({ x: k * (bw + gap), y: binY, w: bw, h: binH });
      L = { cards: cards, bins: bins, panel: panel, narrow: narrow };
    }

    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function wrap(text, x, y, maxW, lh) {
      var words = text.split(' '), line = '', n = 0;
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y + n * lh); n++; line = words[i]; }
        else line = test;
      }
      if (line) { ctx.fillText(line, x, y + n * lh); n++; }
      return n;
    }

    function draw() {
      layout();
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      ctx.textBaseline = 'alphabetic';
      // 카드
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('생물 카드 — 눌러서 고르기', 0, 13);
      CARDS.forEach(function (c, i) {
        var b = L.cards[i], placed = st.placed[i];
        rr(b.x, b.y, b.w, b.h, 8);
        if (placed >= 0) { ctx.fillStyle = T['figSoft' + KCOL[placed]]; ctx.fill(); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke(); }
        else { ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = i === st.sel ? T.figAccent : T.figLine; ctx.lineWidth = i === st.sel ? 3 : 1.2; ctx.stroke(); }
        ctx.textAlign = 'center';
        ctx.fillStyle = placed >= 0 ? T.figMuted : T.figInk;
        ctx.font = (i === st.sel ? '700 ' : '') + (L.narrow ? '13px ' : '14px ') + T.fontBody;
        ctx.fillText(c.n, b.x + b.w / 2, b.y + (placed >= 0 ? b.h / 2 : b.h / 2 + 5));
        if (placed >= 0) { ctx.font = '11px ' + T.fontBody; ctx.fillText('✓ ' + KING[placed], b.x + b.w / 2, b.y + b.h / 2 + 15); }
      });
      drawPanel(T);
      // 계 칸
      L.bins.forEach(function (b, k) {
        rr(b.x, b.y, b.w, b.h, 10);
        ctx.fillStyle = T['figSoft' + KCOL[k]]; ctx.fill();
        ctx.strokeStyle = T['fig' + KCOL[k]]; ctx.lineWidth = st.flash === k ? 3 : 1.6; ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
        var nm = KING[k];
        ctx.font = '700 ' + (L.narrow ? '11px ' : '13px ') + T.fontBody;
        if (ctx.measureText(nm).width > b.w - 6) { ctx.fillText(nm.slice(0, 2), b.x + b.w / 2, b.y + 17); ctx.fillText(nm.slice(2), b.x + b.w / 2, b.y + 31); }
        else ctx.fillText(nm, b.x + b.w / 2, b.y + 20);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText((k + 1) + '번', b.x + b.w / 2, b.y + (L.narrow ? 45 : 36));
        var yy = b.y + (L.narrow ? 62 : 56);
        ctx.font = (L.narrow ? '11px ' : '12px ') + T.fontBody; ctx.fillStyle = T.figInk;
        CARDS.forEach(function (c, i) { if (st.placed[i] === k) { ctx.fillText(c.n, b.x + b.w / 2, yy); yy += L.narrow ? 14 : 15; } });
      });
    }

    function drawPanel(T) {
      var P = L.panel, x = P.x + 14, y = P.y + 20, mw = P.w - 28;
      rr(P.x, P.y, P.w, P.h, 10); ctx.fillStyle = T.figPaper; ctx.fill(); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign = 'left';
      if (st.sel < 0) {
        ctx.fillStyle = T.figInk; ctx.font = '14px ' + T.fontBody;
        wrap(st.msg ? st.msg.text : '', x, y + 6, mw, 19);
        return;
      }
      var c = CARDS[st.sel];
      ctx.fillStyle = T.figInk; ctx.font = '700 15px ' + T.fontBody;
      ctx.fillText(c.n + '의 특징', x, y);
      y += 8;
      var fs = L.narrow ? 12 : 13, lh = L.narrow ? 17 : 19;
      facts(c).forEach(function (f, i) {
        ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText(f[0], x, y + (i + 1) * lh);
        ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
        ctx.fillText(f[1], x + (L.narrow ? 110 : 118), y + (i + 1) * lh);
      });
      y += 5 * lh + 14;
      // 질문 따라가기
      var p = path(c);
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + mw, y - 4); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      ctx.fillText(st.step === 0 ? '질문 따라가기를 누르면 순서도의 질문에 차례로 답한다' : '순서도 질문', x, y + 12);
      y += 20;
      var pillW = 50, qlh = L.narrow ? 16 : 17;
      for (var s = 0; s < st.step && s < p.length; s++) {
        var qi = p[s][0], ans = p[s][1];
        ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk;
        var nl = wrap((qi + 1) + '. ' + QS[qi].q, x, y + 12, mw - pillW - 8, qlh);
        rr(x + mw - pillW, y - 2, pillW, 19, 9);
        ctx.fillStyle = ans ? T.figSoftGreen : T.figSoftRed; ctx.fill();
        ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText(ans ? '예' : '아니요', x + mw - pillW / 2, y + 12);
        ctx.textAlign = 'left';
        y += nl * qlh + 7;
      }
      if (st.step >= p.length && st.step > 0) {
        ctx.fillStyle = T['fig' + KCOL[c.k]]; ctx.font = '700 14px ' + T.fontBody;
        ctx.fillText('→ ' + KING[c.k] + ' (한 번 더 누르면 넣는다)', x, y + 14);
        y += 22;
      }
      // 안내 메시지
      if (st.msg) {
        var my = y + 22;
        ctx.fillStyle = st.msg.ok ? T.figGreen : T.figRed; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
        wrap(st.msg.text, x, my, mw, lh);
      } else if (st.step === 0) {
        ctx.fillStyle = T.figAccent; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
        wrap('특징을 읽고 아래에서 알맞은 계를 눌러 넣어 보자.', x, y + 18, mw, lh);
      }
    }

    function hit(e) {
      var r = cvs.getBoundingClientRect();
      var px = (e.clientX - r.left) * (cv.w / r.width), py = (e.clientY - r.top) * (cv.h / r.height);
      function inside(b) { return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h; }
      for (var i = 0; i < L.cards.length; i++) if (inside(L.cards[i])) { if (st.placed[i] < 0) select(i); return; }
      for (var k = 0; k < L.bins.length; k++) if (inside(L.bins[k])) { place(k); return; }
    }
    cvs.addEventListener('click', hit);
    cvs.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { select(nextFree(st.sel < 0 ? -1 : st.sel)); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        for (var i = 1; i <= CARDS.length; i++) { var j = ((st.sel < 0 ? 0 : st.sel) - i + CARDS.length * 2) % CARDS.length; if (st.placed[j] < 0) { select(j); break; } }
        e.preventDefault();
      } else if (/^[1-5]$/.test(e.key)) { place(+e.key - 1); e.preventDefault(); }
      else if (e.key === 'Enter') { stepQuestion(); e.preventDefault(); }
    });

    api.onResize(draw);
    update(); draw();
  },
});
