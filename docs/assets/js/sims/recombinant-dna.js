/* 생물의 유전 3 생명공학기술: 재조합 DNA 만들기 — 제한 효소(EcoRI, G^AATTC), 점착 말단, DNA 연결 효소, 대장균 형질 전환과 항생제 선별 */
Sims.register('recombinant-dna', {
  title: '재조합 DNA 만들기 — 자르고, 붙이고, 넣고, 고르기',
  caption: '단계 버튼으로 재조합 DNA를 만들어 보자. 제한 효소 EcoRI는 GAATTC를 인식해 두 가닥 모두 G와 A 사이를 엇갈리게 잘라 AATT가 튀어나온 점착 말단을 만든다. 같은 효소로 자른 목적 유전자와 플라스미드는 말단이 상보적이라 짝을 이루고, DNA 연결 효소가 당–인산 골격의 끊어진 곳을 이어 붙인다. 항생제 배지에서는 플라스미드(항생제 저항성 유전자)를 받은 대장균만 자라므로, 목적 유전자가 들어갔는지는 따로 확인해야 한다. 서열은 인식 부위 주변만 보인 예시이고, 크기 비율은 실제와 다르다.',
  init: function (api) {
    var STEPS = [
      { name: '재료 준비', who: '—', desc: '목적 유전자 양옆과 플라스미드에 EcoRI 인식 서열 GAATTC가 있다' },
      { name: '목적 유전자 자르기', who: '제한 효소 EcoRI', desc: '두 가닥 모두 G와 A 사이를 잘라 AATT가 튀어나온 점착 말단이 생긴다' },
      { name: '플라스미드 자르기', who: '같은 제한 효소 EcoRI', desc: '플라스미드도 같은 점착 말단을 가진 열린 고리가 된다' },
      { name: '점착 말단 짝짓기', who: '상보적 염기 사이 수소 결합', desc: 'AATT와 TTAA가 짝을 이루지만 당–인산 골격에는 틈이 남는다' },
      { name: 'DNA 연결 효소로 잇기', who: 'DNA 연결 효소', desc: '틈을 이어 재조합 플라스미드 완성(GAATTC가 다시 생긴다)' },
      { name: '대장균에 넣기', who: '숙주 세포(대장균)', desc: '일부 대장균만 플라스미드를 받아들인다' },
      { name: '항생제 배지에서 고르기', who: '항생제 저항성 유전자', desc: '플라스미드를 가진 대장균만 살아남아 군체를 만든다' },
    ];
    var state = { step: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.6; }, label: '재조합 DNA를 만드는 단계별 모식도와 인식 부위의 염기 서열' });
    var ctx = cv.ctx;
    var rStep = api.readout('단계');
    var rWho = api.readout('작용하는 것');
    var g = api.group();
    api.button('◀ 이전', function () { go(state.step - 1); }, { parent: g });
    var nextBtn = api.button('다음 단계 ▶', function () { go(state.step + 1); }, { primary: true, parent: g });
    api.button('처음으로', function () { go(0); }, { parent: g });
    function go(s) {
      state.step = Math.max(0, Math.min(STEPS.length - 1, s));
      nextBtn.disabled = state.step === STEPS.length - 1;
      rStep.set((state.step + 1) + ' / ' + STEPS.length + ' ' + STEPS[state.step].name);
      rWho.set(STEPS[state.step].who);
      draw();
    }

    function lay() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      return narrow
        ? { narrow: true, head: 0, sch: { x: 0, y: 46, w: w, h: h * 0.5 }, seq: { x: 0, y: 46 + h * 0.52, w: w, h: h - 46 - h * 0.52 } }
        : { narrow: false, head: 0, sch: { x: 0, y: 44, w: w * 0.5, h: h - 44 }, seq: { x: w * 0.52, y: 44, w: w * 0.48, h: h - 44 } };
    }

    function draw() {
      var T = api.tokens(), Ly = lay(), w = cv.w;
      ctx.clearRect(0, 0, w, cv.h);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontBody;
      ctx.fillText((state.step + 1) + '. ' + STEPS[state.step].name, 8, 12);
      ctx.fillStyle = T.figMuted; ctx.font = (Ly.narrow ? 11 : 12) + 'px ' + T.fontBody;
      ctx.fillText(STEPS[state.step].desc, 8, 32);
      schematic(T, Ly.sch, Ly.narrow);
      sequence(T, Ly.seq, Ly.narrow);
    }

    /* ── 모식도 ── */
    function schematic(T, r, narrow) {
      var s = state.step, cx = r.x + r.w / 2;
      var R = Math.min(r.w, r.h) * 0.24;
      if (s <= 4) {
        // 사람 DNA(위)와 플라스미드(아래)
        var dy = r.y + 24, x0 = r.x + 14, x1 = r.x + r.w - 14;
        var gA = x0 + (x1 - x0) * 0.36, gB = x0 + (x1 - x0) * 0.64;
        if (s === 0) {
          label(T, '사람 DNA', x0, dy - 14, 'left');
          dsLine(T, x0, gA, dy); geneBox(T, gA, gB, dy); dsLine(T, gB, x1, dy);
          siteMark(T, gA, dy); siteMark(T, gB, dy);
        } else if (s <= 2) {
          label(T, '사람 DNA → 목적 유전자 조각', x0, dy - 14, 'left');
          dsLine(T, x0, gA - 12, dy); geneBox(T, gA, gB, dy + 0); dsLine(T, gB + 12, x1, dy);
          stickyMark(T, gA, dy, -1); stickyMark(T, gB, dy, 1);
        }
        // 플라스미드
        var py = r.y + r.h * 0.6, ins = s >= 3;
        var gapA = ins ? 0.42 : (s >= 2 ? 0.16 : 0);   // 열린 각(라디안 반폭)
        var col = T.figTeal;
        ctx.lineWidth = 6; ctx.strokeStyle = col;
        ctx.beginPath(); ctx.arc(cx, py, R, -Math.PI / 2 + gapA, 3 * Math.PI / 2 - gapA); ctx.stroke();
        // 항생제 저항성 유전자
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(cx, py, R, Math.PI * 0.55, Math.PI * 0.95); ctx.stroke();
        label(T, '항생제 저항성 유전자', cx - R * 0.95, py + R * 0.95 + 16, 'center', T.figViolet);
        label(T, s >= 4 ? '재조합 플라스미드' : '플라스미드', cx, py, 'center');
        if (s <= 1) siteMark(T, cx, py - R);
        if (s === 2) { stickyMark(T, cx - R * Math.sin(gapA), py - R * Math.cos(gapA), -1); stickyMark(T, cx + R * Math.sin(gapA), py - R * Math.cos(gapA), 1); }
        if (s === 1) {
          ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
          ctx.fillText('✂ EcoRI', gA - 12, dy + 40); ctx.fillText('✂ EcoRI', gB + 12, dy + 40);
        }
        if (s === 2) { ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('✂ EcoRI', cx, py - R - 18); }
        if (ins) {
          // 목적 유전자가 틈에 끼워짐
          ctx.strokeStyle = T.figGreen; ctx.lineWidth = 10;
          ctx.beginPath(); ctx.arc(cx, py, R, -Math.PI / 2 - gapA + 0.03, -Math.PI / 2 + gapA - 0.03); ctx.stroke();
          label(T, '목적 유전자', cx, py - R - 18, 'center', T.figGreen);
          [-1, 1].forEach(function (sg) {
            var an = -Math.PI / 2 + sg * gapA, x = cx + R * Math.cos(an), y = py + R * Math.sin(an);
            if (s === 3) { ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
            else { ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.stroke(); }
          });
          label(T, s === 3 ? '● 골격의 틈' : '○ 연결 효소가 이은 곳', cx, py + R + 34 + (narrow ? 0 : 0), 'center', s === 3 ? T.figRed : T.figInk);
        }
      } else {
        // 대장균들
        var cells = [
          { p: 'rec' }, { p: 'none' }, { p: 'none' }, { p: 'empty' }, { p: 'none' }, { p: 'rec' }, { p: 'none' }, { p: 'none' },
        ];
        var cols = 4, cw = r.w / cols, ch = Math.min(r.h / 2.6, 70);
        if (s === 5) {
          cells.forEach(function (c, i) {
            var x = r.x + cw * (i % cols) + cw / 2, y = r.y + 30 + Math.floor(i / cols) * (ch + 22) + ch / 2;
            ecoli(T, x, y, cw * 0.38, ch * 0.32, c.p, false);
          });
          legendCells(T, r.x + 8, r.y + r.h - 40);
        } else {
          // 배지(페트리 접시)
          var dR = Math.min(r.w, r.h) * 0.38, dX = cx, dYc = r.y + dR + 14;
          ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(dX, dYc, dR, 0, 7); ctx.fill(); ctx.stroke();
          label(T, '항생제가 든 배지', dX, dYc + dR + 14, 'center');
          var spots = [[-0.45, -0.3, 'rec'], [0.3, -0.45, 'none'], [0.5, 0.15, 'rec'], [-0.1, 0.45, 'empty'], [-0.55, 0.3, 'none'], [0.05, -0.05, 'none'], [0.2, 0.6, 'none']];
          spots.forEach(function (sp) {
            var x = dX + sp[0] * dR, y = dYc + sp[1] * dR;
            if (sp[2] === 'none') {
              ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
            } else {
              ctx.fillStyle = sp[2] === 'rec' ? T.figGreen : T.figTeal; ctx.beginPath(); ctx.arc(x, y, dR * 0.11, 0, 7); ctx.fill();
              ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.stroke();
            }
          });
          var lx = r.x + 8, ly = dYc + dR + 36;
          ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
          ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.arc(lx + 6, ly, 6, 0, 7); ctx.fill(); ctx.fillStyle = T.figInk; ctx.fillText('재조합 플라스미드를 가진 군체', lx + 16, ly);
          ctx.fillStyle = T.figTeal; ctx.beginPath(); ctx.arc(lx + 6, ly + 18, 6, 0, 7); ctx.fill(); ctx.fillStyle = T.figInk; ctx.fillText('유전자 없이 닫힌 플라스미드를 가진 군체', lx + 16, ly + 18);
          ctx.fillStyle = T.figMuted; ctx.fillText('✕ 플라스미드가 없는 대장균은 자라지 못함', lx, ly + 36);
        }
      }
    }
    function label(T, t, x, y, al, col) { ctx.font = '12px ' + T.fontBody; ctx.fillStyle = col || T.figInk; ctx.textAlign = al || 'left'; ctx.fillText(t, x, y); }
    function dsLine(T, a, b, y) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a, y - 3); ctx.lineTo(b, y - 3); ctx.moveTo(a, y + 3); ctx.lineTo(b, y + 3); ctx.stroke(); }
    function geneBox(T, a, b, y) { ctx.fillStyle = T.figSoftGreen; ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.fillRect(a, y - 7, b - a, 14); ctx.strokeRect(a, y - 7, b - a, 14); label(T, '목적 유전자', (a + b) / 2, y + 20, 'center', T.figGreen); }
    function siteMark(T, x, y) { ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x - 6, y - 17); ctx.lineTo(x + 6, y - 17); ctx.closePath(); ctx.fill(); }
    function stickyMark(T, x, y) { ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); ctx.stroke(); }
    function ecoli(T, x, y, rx, ry, p) {
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (p !== 'none') {
        ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, ry * 0.55, 0, 7); ctx.stroke();
        if (p === 'rec') { ctx.strokeStyle = T.figGreen; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, ry * 0.55, -2.1, -1.0); ctx.stroke(); }
      }
    }
    function legendCells(T, x, y) {
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText('대장균 대부분은 플라스미드를 받지 못한다.', x, y);
      ctx.fillStyle = T.figMuted;
      ctx.fillText('초록 조각: 목적 유전자가 든 재조합 플라스미드', x, y + 18);
    }

    /* ── 염기 서열 ── */
    function sequence(T, r, narrow) {
      var s = state.step;
      var fsz = narrow ? 12 : 13;
      ctx.font = '600 ' + fsz + 'px ' + T.fontMono;
      var cw = ctx.measureText('G').width + (narrow ? 1 : 1.5), lh = fsz + 7;
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(r.x + 4, r.y, r.w - 8, r.h - 6); ctx.fill(); ctx.stroke();
      var x0 = r.x + 16, y = r.y + 18;
      function head(t) { ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.fillText(t, x0, y); y += lh + 2; }
      function note(t, col) { ctx.font = '12px ' + T.fontBody; ctx.fillStyle = col || T.figMuted; ctx.textAlign = 'left'; ctx.fillText(t, x0, y); y += lh; }
      // 두 가닥 쓰기: top/bot 문자열(공백 = 비어 있음), hl: 강조할 열 범위, 반환: 각 줄 y
      function ds(top, bot, opt) {
        opt = opt || {};
        ctx.font = '600 ' + fsz + 'px ' + T.fontMono; ctx.textAlign = 'center';
        var yT = y, yB = y + lh, xs = x0 + 22;
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
        ctx.fillText(opt.lt != null ? opt.lt : '5′', xs - 4, yT); ctx.fillText(opt.lb != null ? opt.lb : '3′', xs - 4, yB);
        if (opt.hl) opt.hl.forEach(function (h) {
          ctx.fillStyle = T.figSoftRed; ctx.fillRect(xs + h[0] * cw, yT - lh / 2, (h[1] - h[0]) * cw, lh * 2);
        });
        ctx.textAlign = 'center';
        var n = Math.max(top.length, bot.length);
        for (var i = 0; i < n; i++) {
          var a = top[i] || ' ', b = bot[i] || ' ';
          var cxp = xs + (i + 0.5) * cw;
          if (a !== ' ') { ctx.fillStyle = (opt.green && opt.green(i, 0)) ? T.figGreen : T.figInk; ctx.fillText(a, cxp, yT); }
          if (b !== ' ') { ctx.fillStyle = (opt.green && opt.green(i, 1)) ? T.figGreen : T.figInk; ctx.fillText(b, cxp, yB); }
        }
        var lastT = top.replace(/\s+$/, '').length, lastB = bot.replace(/\s+$/, '').length;
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        if (opt.rt !== '') ctx.fillText(opt.rt || '3′', xs + lastT * cw + 4, yT);
        if (opt.rb !== '') ctx.fillText(opt.rb || '5′', xs + lastB * cw + 4, yB);
        var res = { yT: yT, yB: yB, xs: xs };
        y += lh * 2 + 10;
        return res;
      }
      function cutLine(res, colTop, colBot) {
        var xT = res.xs + colTop * cw, xB = res.xs + colBot * cw, ym = (res.yT + res.yB) / 2;
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(xT, res.yT - lh / 2); ctx.lineTo(xT, ym); ctx.lineTo(xB, ym); ctx.lineTo(xB, res.yB + lh / 2); ctx.stroke();
      }
      function nick(res, col, row) {
        var x = res.xs + col * cw, yy = row ? res.yB : res.yT;
        ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(x, yy + (row ? lh / 2 : -lh / 2), 3.5, 0, 7); ctx.fill();
      }
      if (s === 0) {
        head('사람 DNA: 목적 유전자 왼쪽 끝');
        ds('TCGGAATTCATG…', 'AGCCTTAAGTAC…', { hl: [[3, 9]], rt: '', rb: '' });
        head('플라스미드의 인식 부위');
        ds('…ACGAATTCCA…', '…TGCTTAAGGT…', { hl: [[3, 9]], rt: '', rb: '', lt: '5′', lb: '3′' });
        note('빨간 칸: EcoRI 인식 서열 GAATTC');
        note('(거꾸로 읽어도 같은 회문 구조: 아래 가닥도 5′-GAATTC-3′)');
      } else if (s === 1) {
        head('EcoRI가 자르는 위치: G^AATTC');
        var c1 = ds('TCGGAATTCATG…', 'AGCCTTAAGTAC…', { hl: [[3, 9]], rt: '', rb: '' });
        cutLine(c1, 4, 8);
        head('잘린 뒤: 목적 유전자 조각의 왼쪽 끝');
        ds('AATTCATG…', '    GTAC…', { rt: '', rb: '' });
        note('5′ 쪽에 AATT 4개 염기가 한 가닥으로 튀어나옴', T.figRed);
        note('= 점착 말단. 오른쪽 끝도 같은 방식으로 잘린다');
      } else if (s === 2) {
        head('열린 플라스미드의 두 끝');
        ds('…ACG', '…TGCTTAA', { rt: '3′', rb: '5′' });
        ds('    AATTCCA…', '        GGT…', { rt: '', rb: '' });
        note('목적 유전자 조각과 똑같은 AATT 점착 말단');
      } else if (s === 3) {
        head('이음 부위(플라스미드 | 목적 유전자)');
        var c3 = ds('…ACGAATTCATG…', '…TGCTTAAGTAC…', { rt: '', rb: '', green: function (i, row) { return row === 0 ? i >= 4 : i >= 8; } });
        nick(c3, 4, 0); nick(c3, 8, 1);
        note('AATT–TTAA가 상보적으로 짝(수소 결합)');
        note('● 당–인산 골격의 틈이 남아 있다', T.figRed);
      } else if (s === 4) {
        head('DNA 연결 효소가 이은 뒤');
        ds('…ACGAATTCATG…', '…TGCTTAAGTAC…', { hl: [[3, 9]], rt: '', rb: '', green: function (i, row) { return row === 0 ? i >= 4 : i >= 8; } });
        note('골격이 이어져 GAATTC가 다시 생겼다');
        note('초록 글자: 목적 유전자 쪽에서 온 염기');
      } else if (s === 5) {
        head('형질 전환');
        note('재조합 플라스미드를 대장균과 섞으면');
        note('일부 대장균만 플라스미드를 받아들인다.');
        note('어떤 플라스미드는 유전자 없이 다시 닫힌다.');
      } else {
        head('선별');
        note('항생제 저항성 유전자는 플라스미드에 있다.');
        note('→ 플라스미드를 받은 대장균만 군체를 만든다.');
        note('목적 유전자가 들어갔는지는 따로 확인한다.', T.figRed);
        note('고른 대장균을 키우면 목적 유전자가 복제되고,');
        note('발현되면 원하는 단백질(예: 인슐린)을 얻는다.');
      }
    }

    api.onResize(draw);
    go(0);
  },
});
