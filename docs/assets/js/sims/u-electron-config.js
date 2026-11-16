/* 일반화학 4 원자의 전자 구조: 원자 번호를 올리며 오비탈 상자를 채우는 전자 배치(쌓음 원리·파울리 원리·훈트 규칙) */
Sims.register('u-electron-config', {
  title: '전자 배치 쌓기 — 오비탈 상자에 전자를 하나씩',
  caption: '‘전자 더하기’를 눌러 원자 번호를 하나씩 올리거나, 주기율표 칸을 눌러 원소를 골라 보자. 새로 들어간 전자(빨간 화살표)가 어느 규칙을 따랐는지 아래에 나온다. 4s가 3d보다 먼저 차고, 같은 에너지의 p·d 상자에는 먼저 하나씩 같은 스핀으로 들어간 뒤 짝을 짓는다. 상자의 높이는 중성 원자의 채워지는 순서를 나타낸 모식이며, Cr과 Cu는 실제 바닥상태(예외)를 따랐다.',
  init: function (api) {
    var SYM = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
    var NAME = ['', '수소', '헬륨', '리튬', '베릴륨', '붕소', '탄소', '질소', '산소', '플루오린', '네온', '나트륨', '마그네슘', '알루미늄', '규소', '인', '황', '염소', '아르곤', '칼륨', '칼슘', '스칸듐', '타이타늄', '바나듐', '크로뮴', '망가니즈', '철', '코발트', '니켈', '구리', '아연', '갈륨', '저마늄', '비소', '셀레늄', '브로민', '크립톤'];
    // 채워지는 순서(쌓음 원리)와 모식적인 에너지 높이
    var SUB = [
      { id: '1s', n: 1, l: 0, e: 0 }, { id: '2s', n: 2, l: 0, e: 1.5 }, { id: '2p', n: 2, l: 1, e: 2.1 },
      { id: '3s', n: 3, l: 0, e: 3.1 }, { id: '3p', n: 3, l: 1, e: 3.65 }, { id: '4s', n: 4, l: 0, e: 4.35 },
      { id: '3d', n: 3, l: 2, e: 4.75 }, { id: '4p', n: 4, l: 1, e: 5.35 },
    ];
    var EMAX = 5.35, ZMAX = 36;
    SUB.forEach(function (s) { s.m = 2 * s.l + 1; s.cap = 2 * s.m; });
    var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    function sup(k) { return String(k).split('').map(function (d) { return SUP[+d]; }).join(''); }

    function config(Z) {
      var c = {}, left = Z;
      SUB.forEach(function (s) { var k = Math.min(s.cap, left); c[s.id] = k; left -= k; });
      if (Z === 24) { c['4s'] = 1; c['3d'] = 5; }
      if (Z === 29) { c['4s'] = 1; c['3d'] = 10; }
      return c;
    }
    function boxes(s, k) {   // 상자마다 [위, 아래] 스핀: 훈트 규칙
      var b = []; for (var i = 0; i < s.m; i++) b.push([false, false]);
      for (var j = 0; j < k; j++) { if (j < s.m) b[j][0] = true; else b[j - s.m][1] = true; }
      return b;
    }
    function nOrder() { return SUB.slice().sort(function (a, b) { return a.n - b.n || a.l - b.l; }); }
    function text(c, from) {
      return nOrder().filter(function (s) { return c[s.id] > 0 && (!from || from.indexOf(s.id) < 0); })
        .map(function (s) { return s.id + sup(c[s.id]); }).join(' ');
    }
    function unpaired(c) { var u = 0; SUB.forEach(function (s) { var k = c[s.id]; u += k <= s.m ? k : s.cap - k; }); return u; }

    var state = { Z: 8 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.6 : 0.6; }, label: '오비탈 상자 그림과 주기율표' });
    var ctx = cv.ctx;
    var rEl = api.readout('원소');
    var rCfg = api.readout('전자 배치');
    var rShort = api.readout('줄여 쓰기');
    var rUn = api.readout('홀전자 · 자기성');

    var slider = api.slider({ id: 'u-electron-config-z', label: '원자 번호 Z', min: 1, max: ZMAX, step: 1, value: state.Z,
      format: function (v) { return v + ' (' + SYM[v] + ')'; }, onInput: function (v) { state.Z = v; update(); } });
    api.button('◀ 전자 빼기', function () { if (state.Z > 1) slider.set(state.Z - 1); });
    api.button('전자 더하기 ▶', function () { if (state.Z < ZMAX) slider.set(state.Z + 1); }, { primary: true });

    function newest(Z) {   // 새로 들어간 전자의 자리와 따른 규칙
      var c = config(Z), p = Z > 1 ? config(Z - 1) : {}, up = [], down = [];
      SUB.forEach(function (s) { var d = c[s.id] - (p[s.id] || 0); if (d > 0) up.push([s, d]); if (d < 0) down.push(s); });
      if (Z === 24 || Z === 29) return { rule: '예외 — ' + SYM[Z] + '은(는) 3d' + sup(Z === 24 ? 4 : 9) + ' 4s² 대신 3d' + sup(Z === 24 ? 5 : 10) + ' 4s¹이다. 3d와 4s의 에너지가 매우 가까워 3d가 ' + (Z === 24 ? '반쯤 찬(d⁵)' : '꽉 찬(d¹⁰)') + ' 배치가 전체 에너지를 조금 더 낮춘다.' };
      if (up.length !== 1 || down.length) return { rule: '' };
      var s = up[0][0], k = c[s.id], idx = k - 1, box = idx < s.m ? idx : idx - s.m, spin = idx < s.m ? 0 : 1, r;
      if (Z === 25 || Z === 30) r = '4s 상자의 빈자리에 반대 스핀으로 짝을 짓는다(파울리 배타 원리). 3d는 ' + (Z === 25 ? '반쯤 찬 d⁵' : '꽉 찬 d¹⁰') + ' 그대로이다.';
      else if (k === 1 && s.id === '4s') r = '쌓음 원리 — 3p 다음은 3d가 아니라 4s이다. 4s(n + l = 4)가 3d(n + l = 5)보다 에너지가 낮아 먼저 찬다.';
      else if (k === 1 && s.id === '3d') r = '쌓음 원리 — 4s가 다 찼으므로 다음으로 낮은 3d에 들어간다. 전이 원소가 시작된다.';
      else if (k === 1 && Z === 1) r = '쌓음 원리 — 가장 에너지가 낮은 1s 오비탈에 들어간다.';
      else if (k === 1) r = '쌓음 원리 — 아래 부껍질이 모두 찼으므로 다음으로 에너지가 낮은 ' + s.id + '에 들어간다.';
      else if (spin === 1) r = '파울리 배타 원리 — ' + (s.m > 1 ? s.id + ' 상자가 모두 하나씩 찬 뒤에야 ' : '') + '이미 전자가 있는 오비탈에 반대 스핀(↓)으로 짝을 짓는다. 한 오비탈에는 최대 2개.';
      else r = '훈트 규칙 — 짝을 짓지 않고 비어 있는 ' + s.id + ' 오비탈에 같은 스핀(↑)으로 따로 들어가 홀전자 수가 최대가 된다.';
      return { sub: s.id, box: box, spin: spin, rule: r };
    }

    function update() { readouts(); draw(); }
    function readouts() {
      var Z = state.Z, c = config(Z), core = Z > 18 ? 18 : Z > 10 ? 10 : Z > 2 ? 2 : 0;
      rEl.set(SYM[Z] + ' ' + NAME[Z] + ' (Z = ' + Z + ')');
      rCfg.set(text(c));
      rShort.set(core ? '[' + SYM[core] + '] ' + text(c, Object.keys(config(core)).filter(function (k) { return config(core)[k] > 0; })) : text(c));
      var u = unpaired(c);
      rUn.set(u + '개 · ' + (u ? '상자기성' : '반자기성'));
    }

    var layout = {};
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var dg, tb, tx;
      if (narrow) { dg = { x: 0, y: 0, w: w, h: h * 0.54 }; tb = { x: 6, y: h * 0.56, w: w - 12 }; tx = { x: 8, y: 0, w: w - 16 }; }
      else { dg = { x: 0, y: 0, w: w * 0.5, h: h }; tb = { x: w * 0.53, y: 18, w: w * 0.47 - 8 }; tx = { x: w * 0.53, y: 0, w: w * 0.47 - 8 }; }
      drawDiagram(T, dg);
      var tBottom = drawTable(T, tb);
      tx.y = tBottom + 28;
      drawRule(T, tx);
    }
    function drawDiagram(T, r) {
      var c = config(state.Z), nw = newest(state.Z);
      var b = Math.max(16, Math.min(26, (r.w - 48 - 3 * 26 - 16) / 9)), lab = 26, gap = 8;
      var colW = [lab + b, lab + 3 * b, lab + 5 * b], x0 = r.x + 40;
      var colX = [x0, x0 + colW[0] + gap, x0 + colW[0] + colW[1] + 2 * gap];
      var top = r.y + 22, bot = r.y + r.h - 18 - b;
      var ey = function (e) { return bot - (e / EMAX) * (bot - top); };
      // 에너지 축
      ctx.strokeStyle = T.figMuted; ctx.fillStyle = T.figMuted; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(r.x + 16, bot + b); ctx.lineTo(r.x + 16, top - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r.x + 16, top - 12); ctx.lineTo(r.x + 12, top - 4); ctx.lineTo(r.x + 20, top - 4); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(r.x + 9, (top + bot) / 2); ctx.rotate(-Math.PI / 2); ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('에너지(모식)', 0, 0); ctx.restore();
      var soft = [T.figSoftBlue, T.figSoftGreen, T.figSoftAmber];
      SUB.forEach(function (s) {
        var k = c[s.id], y = ey(s.e), bx = boxes(s, k), xL = colX[s.l] + lab;
        ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(s.id, xL - 5, y + b / 2);
        for (var i = 0; i < s.m; i++) {
          var x = xL + i * b;
          ctx.fillStyle = k > 0 ? soft[s.l] : T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
          ctx.fillRect(x, y, b, b); ctx.strokeRect(x + 0.5, y + 0.5, b - 1, b - 1);
          [0, 1].forEach(function (sp) {
            if (!bx[i][sp]) return;
            var hot = nw.sub === s.id && nw.box === i && nw.spin === sp;
            arrow(T, x + b * (sp ? 0.66 : 0.34), y + b / 2, b * 0.36, sp === 0, hot ? T.figRed : T.figInk, hot);
          });
        }
      });
      ctx.textBaseline = 'alphabetic';
    }
    function arrow(T, x, y, len, up, col, bold) {
      var d = up ? -1 : 1;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = bold ? 2.4 : 1.6;
      ctx.beginPath(); ctx.moveTo(x, y - d * len); ctx.lineTo(x, y + d * len * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + d * len); ctx.lineTo(x - 4, y + d * len * 0.45); ctx.lineTo(x + 4, y + d * len * 0.45); ctx.closePath(); ctx.fill();
    }
    // 주기율표(1~4주기): [주기, 족]
    function pos(Z) {
      if (Z === 1) return [0, 0]; if (Z === 2) return [0, 17];
      if (Z <= 10) return [1, Z <= 4 ? Z - 3 : Z + 7];
      if (Z <= 18) return [2, Z <= 12 ? Z - 11 : Z - 1];
      return [3, Z - 19];
    }
    function block(Z) { var g = pos(Z)[1]; if (Z === 2 || g <= 1) return 0; if (g >= 12) return 1; return 2; }
    function drawTable(T, r) {
      var cell = Math.min(26, r.w / 18), x0 = r.x + (r.w - cell * 18) / 2, y0 = r.y + 16;
      layout.table = { x0: x0, y0: y0, cell: cell };
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('주기율표 1~4주기 (눌러서 고르기)', x0, y0 - 5);
      var soft = [T.figSoftBlue, T.figSoftGreen, T.figSoftAmber];
      for (var Z = 1; Z <= ZMAX; Z++) {
        var p = pos(Z), x = x0 + p[1] * cell, y = y0 + p[0] * cell, cur = Z === state.Z;
        ctx.fillStyle = Z <= state.Z ? soft[block(Z)] : T.figPanel; ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        ctx.fillStyle = Z <= state.Z ? T.figInk : T.figMuted; ctx.font = (cur ? '600 ' : '') + (cell < 20 ? 10.5 : 11) + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(SYM[Z], x + cell / 2, y + cell / 2 + 0.5);
        if (cur) { ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.4; ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2); }
      }
      ctx.textBaseline = 'alphabetic';
      // 블록 범례
      var ly = y0 + 4 * cell + 16, lx = x0;
      [['s 블록', 0], ['p 블록', 1], ['d 블록', 2]].forEach(function (it) {
        ctx.fillStyle = soft[it[1]]; ctx.fillRect(lx, ly - 9, 12, 12); ctx.strokeStyle = T.figLine; ctx.strokeRect(lx + 0.5, ly - 8.5, 11, 11);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(it[0], lx + 16, ly + 1);
        lx += 64;
      });
      return ly;
    }
    function drawRule(T, r) {
      var nw = newest(state.Z);
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(state.Z + '번째 전자', r.x, r.y);
      ctx.font = '12.5px ' + T.fontBody; ctx.fillStyle = nw.rule.indexOf('예외') === 0 ? T.figAmber : T.figInk;
      wrap(nw.rule, r.x, r.y + 20, r.w, 18);
    }
    function wrap(s, x, y, maxW, lh) {
      var words = s.split(' '), line = '';
      words.forEach(function (wd) {
        var t = line ? line + ' ' + wd : wd;
        if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = t;
      });
      if (line) ctx.fillText(line, x, y);
    }
    cv.canvas.addEventListener('click', function (e) {
      var L = layout.table; if (!L) return;
      var rc = cv.canvas.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
      for (var Z = 1; Z <= ZMAX; Z++) {
        var p = pos(Z), cx = L.x0 + p[1] * L.cell, cy = L.y0 + p[0] * L.cell;
        if (x >= cx && x < cx + L.cell && y >= cy && y < cy + L.cell) { slider.set(Z); return; }
      }
    });
    api.onResize(draw);
    update();
  },
});
