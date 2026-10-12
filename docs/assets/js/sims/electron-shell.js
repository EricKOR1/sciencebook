/* 2-3 전자껍질 모형: 원자 번호 1~20의 전자 배치, 원자가 전자, 옥텟 규칙에 따라 이온이 되는 과정 */
Sims.register('electron-shell', {
  title: '전자껍질 모형 — 원자가 전자와 18족 닮기',
  caption: '원자 번호를 바꾸거나 오른쪽(휴대폰에서는 아래쪽) 주기율표 칸을 눌러 원자를 고른 뒤 \'이온 되기\'를 눌러 보자. 1족은 원자가 전자 1개를 잃고 17족은 1개를 얻어, 가장 가까운 18족 원소와 같은 전자 배치가 된다(2족·16족 등도 같은 규칙). 원자가 전자(진한 색)가 주인공이고, 18족은 이미 안정하다. 전자껍질 모형은 설명을 위해 단순화한 그림으로, 껍질 크기와 전자 위치는 실제와 다르며 20번까지는 2, 8, 8, 2 순서로 채운다.',
  init: function (api) {
    var SYM = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca'];
    var NAME = ['', '수소', '헬륨', '리튬', '베릴륨', '붕소', '탄소', '질소', '산소', '플루오린', '네온', '나트륨', '마그네슘', '알루미늄', '규소', '인', '황', '염소', '아르곤', '칼륨', '칼슘'];
    var CAP = [2, 8, 8, 2], SHELL = ['K', 'L', 'M', 'N'];
    var state = { z: 11, phase: 'atom', p: 0 };

    function config(n) { var c = [], left = n; for (var i = 0; i < 4 && left > 0; i++) { var k = Math.min(CAP[i], left); c.push(k); left -= k; } return c; }
    function valence(z) { var c = config(z), v = c[c.length - 1]; return (z === 2 || v === 8) ? 0 : v; }
    function group(z) { if (z === 1) return 1; if (z === 2) return 18; var c = config(z), v = c[c.length - 1]; return v === 8 ? 18 : v <= 2 ? v : v + 10; }
    function period(z) { return config(z).length; }
    function noble(n) { return [2, 10, 18].indexOf(n) >= 0; }
    // 옥텟 규칙에 따른 이온(통합과학 수준). change: 잃으면 −, 얻으면 +
    function ionRule(z) {
      var g = group(z);
      if (g === 18) return { kind: 'stable' };
      if (z === 1) return { kind: 'share', msg: '수소는 전자 1개를 다른 원자와 공유해 첫째 껍질에 2개를 채운다(헬륨처럼)' };
      if (g === 1 || g === 2) return { kind: 'ion', d: -g };
      if (z === 13) return { kind: 'ion', d: -3 };
      if (g === 16 || g === 17) return { kind: 'ion', d: 18 - g };
      return { kind: 'share', msg: NAME[z] + josa(NAME[z]) + ' 이온이 되기보다 주로 다른 원자와 전자를 공유한다(다음 단원)' };
    }
    function ionName(z, d) { var q = -d, m = Math.abs(q); return SYM[z] + (m > 1 ? ['', '', '²', '³'][m] : '') + (q > 0 ? '⁺' : '⁻'); }
    function supText(z, d) { var q = -d, m = Math.abs(q); return { base: SYM[z], sup: (m > 1 ? m : '') + (q > 0 ? '+' : '−') }; }
    function josa(w) { var c = w.charCodeAt(w.length - 1) - 0xAC00; return (c >= 0 && c % 28) ? '은' : '는'; }
    function nobleOf(n) { return n === 2 ? 2 : n === 10 ? 10 : 18; }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.4 : 0.62; }, label: '전자껍질 모형과 간이 주기율표' });
    var ctx = cv.ctx;

    var rEl = api.readout('원소');
    var rCfg = api.readout('전자 배치');
    var rVal = api.readout('원자가 전자');
    var rPos = api.readout('주기 · 족');
    var rState = api.readout('상태');

    var slider = api.slider({ id: 'electron-shell-z', label: '원자 번호', min: 1, max: 20, step: 1, value: state.z,
      format: function (v) { return v + ' (' + SYM[v] + ' ' + NAME[v] + ')'; },
      onInput: function (v) { if (v !== state.z) { state.z = v; reset(); } } });
    var bIon = api.button('이온 되기', function () { makeIon(); }, { primary: true });
    api.button('원자로 되돌리기', function () { reset(); });

    var loop = api.loop(function (dt) {
      state.p = Math.min(1, state.p + dt / 1.8);
      if (state.p >= 1) { state.phase = 'ion'; loop.pause(); readouts(); }
      draw();
    });
    loop.pause();

    function reset() { state.phase = 'atom'; state.p = 0; loop.pause(); readouts(); draw(); }
    function makeIon() {
      var r = ionRule(state.z);
      if (r.kind !== 'ion') { state.phase = r.kind; state.p = 1; readouts(); draw(); return; }
      if (state.phase === 'ion' || state.phase === 'moving') return;
      if (api.reduced) { state.phase = 'ion'; state.p = 1; readouts(); draw(); return; }
      state.phase = 'moving'; state.p = 0; readouts(); loop.play();
    }
    function readouts() {
      var z = state.z, r = ionRule(z), c = config(z);
      var isIon = state.phase === 'ion' && r.kind === 'ion';
      var n = isIon ? z + r.d : z;
      rEl.set(isIon ? ionName(z, r.d) + ' (' + NAME[z] + ' 이온)' : SYM[z] + ' ' + NAME[z]);
      rCfg.set(config(n).join(', '));
      rVal.set(valence(z) + '개' + (group(z) === 18 ? ' (18족은 0으로 본다)' : ''));
      rPos.set(period(z) + '주기 · ' + group(z) + '족');
      var st;
      if (r.kind === 'stable') st = '이미 안정 (가장 바깥 껍질이 꽉 참)';
      else if (state.phase === 'share') st = '주로 전자 공유';
      else if (isIon) st = (r.d < 0 ? '전자 ' + (-r.d) + '개 잃음' : '전자 ' + r.d + '개 얻음') + ' → ' + SYM[nobleOf(n)] + '과 같은 배치';
      else if (state.phase === 'moving') st = r.d < 0 ? '전자를 잃는 중…' : '전자를 얻는 중…';
      else st = '중성 원자 (양성자 ' + z + ' = 전자 ' + z + ')';
      rState.set(st);
      bIon.disabled = r.kind === 'stable';
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { narrow: true, atom: { x: 0, y: 0, w: w, h: h * 0.56 }, table: { x: 4, y: h * 0.585, w: w - 8, h: h * 0.26 }, cmp: { x: 0, y: h * 0.88, w: w, h: h * 0.12 } };
      return { narrow: false, atom: { x: 0, y: 0, w: w * 0.55, h: h }, table: { x: w * 0.57, y: 10, w: w * 0.43 - 6, h: h * 0.44 }, cmp: { x: w * 0.57, y: h * 0.52, w: w * 0.43 - 6, h: h * 0.48 } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawAtom(T, P.atom);
      drawTable(T, P.table);
      drawCompare(T, P.cmp, P.narrow);
    }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function slotAngle(k, n) { return -Math.PI / 2 + 2 * Math.PI * k / n; }

    // 원자(이온) 그림
    function drawAtom(T, r) {
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      drawAtomInner(T, r);
      ctx.restore();
    }
    function drawAtomInner(T, r) {
      var z = state.z, rule = ionRule(z), c0 = config(z);
      var moving = state.phase === 'moving', done = state.phase === 'ion';
      var d = (moving || done) && rule.kind === 'ion' ? rule.d : 0;
      var cx = r.x + r.w / 2, cy = r.y + r.h * 0.47;
      var R = Math.min(r.w * 0.44, r.h * 0.38), nr = Math.max(14, R * 0.15);
      var nShell = 4, dr = (R - nr) / nShell;
      var rad = function (i) { return nr + dr * (i + 0.85); };
      var t = done ? 1 : moving ? ease(state.p) : 0;
      var last = c0.length - 1;
      // 껍질 고리
      var nShellsShown = c0.length;
      var cFinal = config(z + d);
      for (var i = 0; i < nShellsShown; i++) {
        var vanish = d < 0 && i === last && cFinal.length < c0.length;
        var alpha = vanish ? 1 - t * 0.85 : 1;
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.strokeStyle = i === last && !vanish ? T.figAccent : T.figLine; ctx.lineWidth = i === last ? 1.6 : 1.1;
        if (vanish && t > 0.5) ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, rad(i), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        var la = -Math.PI / 2 - 0.39;
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
        ctx.fillText(SHELL[i], cx + (rad(i) + 9) * Math.cos(la), cy + (rad(i) + 9) * Math.sin(la) + 4);
        ctx.restore();
      }
      // 원자핵
      ctx.beginPath(); ctx.arc(cx, cy, nr, 0, Math.PI * 2);
      ctx.fillStyle = T.figSoftRed; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + (nr > 18 ? 13 : 11) + 'px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('+' + z, cx, cy + 4);
      // 전자
      var er = Math.max(4.5, Math.min(7, dr * 0.22));
      c0.forEach(function (n, i) {
        var isVal = i === last && valence(z) > 0;
        var nSlots = n;
        if (i === last && d > 0) nSlots = n + d;
        for (var k = 0; k < n; k++) {
          var a = slotAngle(k, nSlots), x = cx + rad(i) * Math.cos(a), y = cy + rad(i) * Math.sin(a);
          var lost = i === last && d < 0 && k >= n + d;
          if (lost) {
            // 원자 밖으로 멀어진다
            var out = rad(i) + t * (R * 0.45);
            x = cx + out * Math.cos(a + t * 0.5); y = cy + out * Math.sin(a + t * 0.5);
            electron(T, x, y, er, T.figRed, 1 - t * 0.75);
          } else electron(T, x, y, er, isVal ? T.figAccent : T.figMuted, 1);
        }
        // 얻는 전자: 바깥에서 날아와 빈자리로
        if (i === last && d > 0) {
          for (var g = 0; g < d; g++) {
            var a2 = slotAngle(n + g, n + d), fr = rad(i) + (1 - t) * R * 0.45, a3 = a2 - (1 - t) * 0.6;
            electron(T, cx + fr * Math.cos(a3), cy + fr * Math.sin(a3), er, T.figGreen, 0.4 + 0.6 * t);
          }
        }
      });
      // 이온 괄호와 전하
      if (done && d !== 0) {
        var br = rad(cFinal.length - 1) + er + 8;
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - br + 8, cy - br); ctx.lineTo(cx - br, cy - br); ctx.lineTo(cx - br, cy + br); ctx.lineTo(cx - br + 8, cy + br); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + br - 8, cy - br); ctx.lineTo(cx + br, cy - br); ctx.lineTo(cx + br, cy + br); ctx.lineTo(cx + br - 8, cy + br); ctx.stroke();
        ctx.fillStyle = d < 0 ? T.figRed : T.figGreen; ctx.font = '600 15px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(supText(z, d).sup, cx + br + 4, cy - br + 8);
      }
      // 아래 설명
      var ty = Math.min(r.y + r.h - 34, cy + R + 22);
      var label;
      if (done && d !== 0) label = ionName(z, d) + ' (' + NAME[z] + ' 이온) — 양성자 ' + z + '개, 전자 ' + (z + d) + '개';
      else label = NAME[z] + ' ' + SYM[z] + ' — 양성자 ' + z + '개, 전자 ' + z + '개';
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(label, cx, ty);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      var sub;
      if (rule.kind === 'stable') sub = '가장 바깥 껍질이 꽉 차 있다: 이미 안정';
      else if (state.phase === 'share') sub = rule.msg;
      else if (done && d !== 0) sub = '전자 배치 ' + cFinal.join(', ') + ' = ' + NAME[nobleOf(z + d)] + '(' + SYM[nobleOf(z + d)] + ')와 같다';
      else sub = '전자 배치 ' + c0.join(', ') + ' · 진한 점 = 원자가 전자 ' + valence(z) + '개';
      wrap(sub, cx, ty + 17, r.w - 16, 15);
    }
    function electron(T, x, y, r, col, a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    function wrap(text, cx, y, maxW, lh) {
      var words = text.split(' '), line = '', lines = [];
      words.forEach(function (wd) { var tst = line ? line + ' ' + wd : wd; if (ctx.measureText(tst).width > maxW && line) { lines.push(line); line = wd; } else line = tst; });
      lines.push(line);
      lines.forEach(function (l, i) { ctx.fillText(l, cx, y + i * lh); });
    }

    // 간이 주기율표(1~20번), 칸을 누르면 그 원소로
    var COLS = [1, 2, 13, 14, 15, 16, 17, 18];
    var cells = [];
    function drawTable(T, r) {
      cells = [];
      var head = 16, cw = r.w / 8, ch = (r.h - head) / 4;
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      COLS.forEach(function (g, j) { ctx.fillText(g + '족', r.x + cw * (j + 0.5), r.y + 11); });
      for (var z = 1; z <= 20; z++) {
        var row = period(z) - 1, j = COLS.indexOf(group(z));
        var x = r.x + j * cw, y = r.y + head + row * ch, g = group(z);
        var fill = g === 1 && z !== 1 ? T.figSoftRed : g === 17 ? T.figSoftGreen : g === 18 ? T.figSoftViolet : T.figPanel;
        ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
        var sel = z === state.z;
        ctx.strokeStyle = sel ? T.figAccent : T.figLine; ctx.lineWidth = sel ? 2.5 : 1;
        ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
        if (ch > 30) ctx.fillText(z, x + cw / 2, y + 12);
        ctx.fillStyle = T.figInk; ctx.font = (sel ? '600 ' : '') + '13px ' + T.fontBody;
        ctx.fillText(SYM[z], x + cw / 2, y + (ch > 30 ? ch - 7 : ch / 2 + 5));
        cells.push({ z: z, x: x, y: y, w: cw, h: ch });
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var ly = r.y + r.h + 13;
      legend(T, r.x, ly, T.figSoftRed, '1족(H 제외)');
      legend(T, r.x + r.w * 0.36, ly, T.figSoftGreen, '17족');
      legend(T, r.x + r.w * 0.62, ly, T.figSoftViolet, '18족');
    }
    function legend(T, x, y, col, text) {
      ctx.fillStyle = col; ctx.fillRect(x, y - 9, 11, 11); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y - 8.5, 10, 10);
      ctx.fillStyle = T.figMuted; ctx.fillText(text, x + 15, y);
    }

    // 가장 가까운 18족 원소와 비교
    function drawCompare(T, r, narrow) {
      var z = state.z, rule = ionRule(z), done = state.phase === 'ion' && rule.kind === 'ion';
      var target = rule.kind === 'ion' ? nobleOf(z + rule.d) : rule.kind === 'stable' ? z : (z === 1 ? 2 : nobleOf(z + (valence(z) >= 4 ? 8 - valence(z) : -valence(z))));
      var cfgNow = config(done ? z + rule.d : z).join(', '), cfgT = config(target).join(', ');
      var same = cfgNow === cfgT;
      ctx.textAlign = 'left';
      if (narrow) {
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
        var y = r.y + 16;
        ctx.fillText('지금: ' + cfgNow + '   ·   가까운 18족 ' + SYM[target] + ': ' + cfgT, r.x + 8, y);
        ctx.fillStyle = same ? T.figGreen : T.figMuted; ctx.font = (same ? '600 ' : '') + '12px ' + T.fontBody;
        ctx.fillText(same ? (rule.kind === 'stable' ? '18족 그 자체 — 이미 안정' : '같은 배치가 되었다!') : '아직 다르다', r.x + 8, y + 17);
        return;
      }
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody;
      ctx.fillText('가장 가까운 18족과 비교', r.x + 4, r.y + 14);
      // 작은 원자 그림
      var c = config(target), mcx = r.x + r.w * 0.28, mcy = r.y + r.h * 0.55, mR = Math.min(r.w * 0.25, r.h * 0.36);
      var mnr = 9, mdr = (mR - mnr) / 3;
      c.forEach(function (n, i) {
        var rr2 = mnr + mdr * (i + 0.8);
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mcx, mcy, rr2, 0, Math.PI * 2); ctx.stroke();
        for (var k = 0; k < n; k++) { var a = slotAngle(k, n); electron(T, mcx + rr2 * Math.cos(a), mcy + rr2 * Math.sin(a), 3.5, T.figViolet, 1); }
      });
      ctx.beginPath(); ctx.arc(mcx, mcy, mnr, 0, Math.PI * 2); ctx.fillStyle = T.figSoftViolet; ctx.fill(); ctx.strokeStyle = T.figViolet; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '10px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('+' + target, mcx, mcy + 3.5);
      var tx = r.x + r.w * 0.56;
      ctx.textAlign = 'left'; ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figViolet;
      ctx.fillText(NAME[target] + ' ' + SYM[target], tx, mcy - 26);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('18족: ' + cfgT, tx, mcy - 8);
      ctx.fillText('지금: ' + cfgNow, tx, mcy + 10);
      ctx.fillStyle = same ? T.figGreen : T.figMuted; ctx.font = (same ? '600 ' : '') + '12px ' + T.fontBody;
      ctx.fillText(same ? (rule.kind === 'stable' ? '이미 안정!' : '같아졌다!') : '아직 다르다', tx, mcy + 30);
    }

    cv.canvas.addEventListener('click', function (ev) {
      var b = cv.canvas.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
      cells.forEach(function (c) { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) slider.set(c.z); });
    });
    cv.canvas.style.cursor = 'pointer';

    api.onResize(draw);
    readouts(); draw();
  },
});
