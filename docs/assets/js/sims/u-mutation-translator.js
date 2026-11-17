/* 일반생명과학 6 돌연변이: DNA 서열을 치환·삽입·결실로 바꾸면 mRNA, 읽는 틀, 아미노산 서열이 어떻게 달라지는가 (예제 10의 서열) */
Sims.register('u-mutation-translator', {
  title: '돌연변이 번역기 — 염기 하나가 바뀌면 단백질은?',
  caption: '예제 10의 유전자(뒤쪽에 염기 몇 개를 덧붙임)를 쓴다. 염기를 눌러(또는 위치 슬라이더로) 고른 뒤 다른 염기로 치환하거나, 그 앞에 염기를 삽입하거나, 결실시켜 보자. 암호 가닥과 주형 가닥은 함께 바뀌고, mRNA는 주형 가닥에 상보적이며 첫 AUG부터 세 염기씩 읽힌다. 셋째 자리 치환은 침묵 돌연변이가 되기 쉽고, 1개 삽입·결실은 읽는 틀을 옮겨 뒤의 아미노산을 모두 바꾸지만 3개 결실은 아미노산 하나만 뺀다. 표준 유전 암호를 썼고, 프로모터·인트론 등은 생략했다.',
  init: function (api) {
    var ORIG = 'GGCATGTCAGAATGGCTTCGTTAAGCATTGACTAGGCA';
    var CODE = {}, AA = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
    var B = 'UCAG', NAME = { F: 'Phe', L: 'Leu', S: 'Ser', Y: 'Tyr', C: 'Cys', W: 'Trp', P: 'Pro', H: 'His', Q: 'Gln', R: 'Arg', I: 'Ile', M: 'Met', T: 'Thr', N: 'Asn', K: 'Lys', V: 'Val', A: 'Ala', D: 'Asp', E: 'Glu', G: 'Gly', '*': '종결' };
    for (var i = 0; i < 64; i++) CODE[B[i >> 4] + B[(i >> 2) & 3] + B[i & 3]] = AA[i];
    var COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
    var seq, sel = 9, last = null;
    var orig = translate(ORIG.split('').map(function (b) { return { b: b }; }));

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.5; }, label: 'DNA 두 가닥, mRNA, 아미노산 서열. 염기를 누르면 그 위치가 선택된다' });
    var ctx = cv.ctx, cells = [];
    var rType = api.readout('결과');
    var rLen = api.readout('아미노산 수(원래 6)');
    var rDiff = api.readout('바뀐 곳');

    var pos = api.slider({ id: 'u-mutation-translator-pos', label: '선택한 염기 위치', min: 1, max: ORIG.length, step: 1, value: sel + 1,
      format: function (v) { return v + '번' + (seq && seq[v - 1] ? ' (' + seq[v - 1].b + ')' : ''); }, onInput: function (v) { sel = v - 1; draw(); } });
    var g1 = api.group();
    ['A', 'T', 'G', 'C'].forEach(function (b) { api.button('→' + b + ' 치환', function () { sub(b); }, { parent: g1 }); });
    var g2 = api.group();
    api.button('앞에 A 삽입', function () { seq.splice(sel, 0, { b: 'A', m: 'ins' }); last = 'ins'; refresh(); }, { parent: g2 });
    api.button('1개 결실', function () { del(1); }, { parent: g2 });
    api.button('3개 결실', function () { del(3); }, { parent: g2 });
    api.button('처음으로', function () { reset(); }, { primary: true, parent: g2 });

    function reset() { seq = ORIG.split('').map(function (b) { return { b: b }; }); sel = 9; last = null; refresh(); }
    function sub(b) { if (seq[sel].b === b) return; seq[sel] = { b: b, m: 'sub' }; last = 'sub'; refresh(); }
    function del(n) {
      if (sel + n > seq.length) return;
      seq.splice(sel, n);
      if (seq[sel]) seq[sel] = { b: seq[sel].b, m: seq[sel].m, del: true };
      last = 'del'; refresh();
    }
    function refresh() {
      if (sel > seq.length - 1) sel = seq.length - 1;
      pos.input.max = seq.length; pos.set(sel + 1);
    }
    function translate(sq) {
      var m = sq.map(function (x) { return x.b === 'T' ? 'U' : x.b; }).join('');
      var start = m.indexOf('AUG'), aa = [], codons = [], stop = false;
      if (start < 0) return { start: -1, aa: aa, codons: codons, stop: false };
      for (var k = start; k + 3 <= m.length; k += 3) {
        var a = CODE[m.substr(k, 3)];
        codons.push({ i: k, a: a });
        if (a === '*') { stop = true; break; }
        aa.push(a);
      }
      return { start: start, aa: aa, codons: codons, stop: stop };
    }
    function classify(t) {
      var diff = seq.length - ORIG.length, changed = seq.some(function (x) { return x.m || x.del; });
      if (!changed) return { type: '원래 서열', diff: '–' };
      if (t.start !== orig.start && t.start >= 0 && diff === 0) { /* 개시 위치 이동 */ }
      var a = orig.aa, b = t.aa, same = a.join('') === b.join('') && t.stop === orig.stop;
      var firstDiff = -1;
      for (var k = 0; k < Math.max(a.length, b.length); k++) if (a[k] !== b[k]) { firstDiff = k; break; }
      var dtxt = firstDiff < 0 ? '없음' : (firstDiff + 1) + '번째: ' + (a[firstDiff] ? NAME[a[firstDiff]] : '(없음)') + ' → ' + (b[firstDiff] ? NAME[b[firstDiff]] : '종결');
      if (t.start < 0) return { type: '개시 코돈이 사라짐 — 번역 시작 불가', diff: dtxt };
      if (t.start !== orig.start && diff === 0) return { type: '개시 코돈이 바뀜 — 다른 AUG에서 시작', diff: dtxt };
      if (same) return { type: diff === 0 ? '침묵 돌연변이 — 단백질 변화 없음' : '단백질 변화 없음(암호 부위 밖)', diff: '없음' };
      if (diff % 3 !== 0) return { type: '틀 이동 돌연변이 — 그 뒤 아미노산이 모두 바뀜', diff: dtxt };
      if (diff !== 0) return { type: '3의 배수 ' + (diff > 0 ? '삽입' : '결실') + ' — 틀 유지, 아미노산 ' + Math.abs(diff / 3) + '개 ' + (diff > 0 ? '추가' : '제거'), diff: dtxt };
      if (b.length < a.length && a.join('').indexOf(b.join('')) === 0) return { type: '넌센스 돌연변이 — 종결 코돈이 생겨 일찍 끝남', diff: dtxt };
      if (!t.stop || b.length > a.length) return { type: '종결 코돈이 사라져 사슬이 길어짐', diff: dtxt };
      return { type: '미스센스 돌연변이 — 아미노산 하나가 바뀜', diff: dtxt };
    }

    cv.canvas.addEventListener('click', function (e) {
      var r = cv.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (var k = 0; k < cells.length; k++) { var c = cells[k]; if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { sel = c.i; pos.set(sel + 1); return; } }
    });

    function draw() {
      if (!seq) return;
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var t = translate(seq), cl = classify(t);
      rType.set(cl.type); rLen.set(t.aa.length + '개' + (t.stop ? '' : ' (종결 코돈 못 만남)')); rDiff.set(cl.diff);
      var LW = narrow ? 44 : 78, cw = narrow ? 19 : 20;
      var per = Math.floor((w - LW - 8) / cw / 3) * 3;
      var nLines = Math.ceil(seq.length / per), rowH = 22, blockH = rowH * 4 + 22;
      var y0 = Math.max(6, (h - nLines * blockH) / 2 - 6);
      var codonAt = {}; t.codons.forEach(function (c) { codonAt[c.i] = c.a; });
      var inORF = function (i) { if (t.start < 0 || i < t.start) return false; var end = t.codons.length ? t.codons[t.codons.length - 1].i + 3 : t.start; return i < end; };
      cells = [];
      var labels = narrow ? ['암호', '주형', 'mRNA', '단백질'] : ['암호 가닥', '주형 가닥', 'mRNA', '아미노산'];
      for (var ln = 0; ln < nLines; ln++) {
        var yb = y0 + ln * blockH, a0 = ln * per, a1 = Math.min(seq.length, a0 + per);
        ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        labels.forEach(function (lb, r) { ctx.fillStyle = r === 2 ? T.figViolet : r === 3 ? T.figGreen : T.figMuted; ctx.fillText(lb, 2, yb + r * rowH + 15); });
        for (var i = a0; i < a1; i++) {
          var x = LW + (i - a0) * cw, nt = seq[i];
          // ORF 배경과 코돈 구분
          if (inORF(i)) { ctx.fillStyle = ((i - t.start) / 3 | 0) % 2 ? T.figSoftViolet : T.figSoftBlue; ctx.fillRect(x, yb + 2 * rowH, cw, rowH); }
          if (nt.m) { ctx.fillStyle = T.figSoftAmber; ctx.fillRect(x, yb, cw, rowH * 3); }
          if (i === sel) { ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.strokeRect(x + 1, yb + 1, cw - 2, rowH * 3 - 2); }
          if (nt.del) { ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, yb - 2); ctx.lineTo(x, yb + rowH * 3 + 2); ctx.stroke(); }
          ctx.font = '600 13px ' + T.fontMono; ctx.textAlign = 'center';
          ctx.fillStyle = T.figInk; ctx.fillText(nt.b, x + cw / 2, yb + 15);
          ctx.fillStyle = T.figMuted; ctx.fillText(COMP[nt.b], x + cw / 2, yb + rowH + 15);
          ctx.fillStyle = T.figInk; ctx.fillText(nt.b === 'T' ? 'U' : nt.b, x + cw / 2, yb + 2 * rowH + 15);
          cells.push({ i: i, x: x, y: yb, w: cw, h: rowH * 3 });
          if (codonAt[i] !== undefined) {
            var aa = codonAt[i], cx = x + cw * 1.5;
            ctx.font = (aa === '*' ? '600 ' : '') + '12px ' + T.fontBody;
            ctx.fillStyle = aa === '*' ? T.figRed : T.figGreen;
            ctx.fillText(NAME[aa], cx, yb + 3 * rowH + 15);
          }
        }
        // 가닥 방향
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        if (ln === 0) { ctx.textAlign = 'right'; ctx.fillText('5′', LW - 2, yb + 15); ctx.fillText('3′', LW - 2, yb + rowH + 15); ctx.fillText('5′', LW - 2, yb + 2 * rowH + 15); }
        if (ln === nLines - 1) { var xe = LW + (a1 - a0) * cw + 3; ctx.textAlign = 'left'; ctx.fillText('3′', xe, yb + 15); ctx.fillText('5′', xe, yb + rowH + 15); ctx.fillText('3′', xe, yb + 2 * rowH + 15); }
      }
    }

    api.onResize(draw);
    reset();
  },
});
