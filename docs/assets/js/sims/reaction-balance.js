/* 중3-1 화학 반응의 규칙성: 계수 맞추기(원자의 종류와 수)와 반응물 개수에 따른 생성물·남는 물질, 질량 보존 */
Sims.register('reaction-balance', {
  title: '원자 구슬로 맞춰 보는 화학 반응식',
  caption: '반응을 고르고 ‘① 계수 맞추기’에서 각 물질의 계수를 바꿔 반응 전후 원자의 종류와 개수가 모두 같아지게 해 보자. 원자 수가 같아지면 질량 합도 같아진다. ‘② 개수 바꿔 반응시키기’에서는 반응물 분자 수를 바꾸면 계수비대로 반응하고 남는 물질이 생기지만, 남은 물질까지 더한 질량 합은 반응 전과 언제나 같다. 질량은 원자 1개의 상대적 질량(H 1, C 12, N 14, O 16)으로 나타냈고, 구슬 색은 본문의 모형(H 흰색, O 빨간색, C 검은색, N 파란색)을 따랐으며 분자의 모양과 크기는 단순화했다.',
  init: function (api) {
    var MASS = { H: 1, C: 12, N: 14, O: 16 };
    var COL = { H: ['#f1f3f5', '#212529'], O: ['#e03131', '#ffffff'], N: ['#3b5bdb', '#ffffff'], C: ['#343a40', '#ffffff'] };
    var RAD = { H: 0.55, C: 0.8, N: 0.78, O: 0.75 };
    var MOL = {
      H2: { name: '수소', f: 'H₂', atoms: [['H', -0.45, 0], ['H', 0.45, 0]] },
      O2: { name: '산소', f: 'O₂', atoms: [['O', -0.6, 0], ['O', 0.6, 0]] },
      N2: { name: '질소', f: 'N₂', atoms: [['N', -0.62, 0], ['N', 0.62, 0]] },
      H2O: { name: '물', f: 'H₂O', atoms: [['H', -0.72, 0.45], ['H', 0.72, 0.45], ['O', 0, -0.12]] },
      NH3: { name: '암모니아', f: 'NH₃', atoms: [['H', -0.82, 0.32], ['H', 0.82, 0.32], ['H', 0, 0.85], ['N', 0, -0.1]] },
      CH4: { name: '메테인', f: 'CH₄', atoms: [['H', -0.92, 0], ['H', 0.92, 0], ['H', 0, -0.92], ['H', 0, 0.92], ['C', 0, 0]] },
      CO2: { name: '이산화 탄소', f: 'CO₂', atoms: [['O', -1.08, 0], ['O', 1.08, 0], ['C', 0, 0]] },
    };
    var RX = [
      { key: 'water', label: '수소 + 산소 → 물', re: ['H2', 'O2'], pr: ['H2O'], co: [2, 1, 2], max: [10, 6], start: [4, 3] },
      { key: 'nh3', label: '질소 + 수소 → 암모니아', re: ['N2', 'H2'], pr: ['NH3'], co: [1, 3, 2], max: [5, 10], start: [2, 3] },
      { key: 'ch4', label: '메테인의 연소', re: ['CH4', 'O2'], pr: ['CO2', 'H2O'], co: [1, 2, 1, 2], max: [5, 8], start: [2, 3] },
    ];
    var st = { rx: 0, mode: 1, coef: [1, 1, 1], cnt: [4, 3] };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 2.0 : 0.68; }, label: '반응 전과 반응 후의 원자 구슬 모형, 원자 수 비교표, 질량 저울' });
    var ctx = cv.ctx;
    var r1 = api.readout('원자 수 (전 → 후)');
    var r2 = api.readout('질량 합 (전 → 후)');
    var r3 = api.readout('판정');

    var gRx = api.group();
    var rxBtns = RX.map(function (r, i) { return api.button(r.label, function () { setRx(i); }, { toggle: true, pressed: i === 0, parent: gRx }); });
    var gMode = api.group();
    var mBtns = [api.button('① 계수 맞추기', function () { setMode(1); }, { toggle: true, pressed: true, parent: gMode }),
      api.button('② 개수 바꿔 반응시키기', function () { setMode(2); }, { toggle: true, pressed: false, parent: gMode })];
    var gS = api.el('div', 'sim-group'); gS.style.flex = '1 1 100%'; api.controls.appendChild(gS);

    function species() { var r = RX[st.rx]; return r.re.concat(r.pr); }
    function setRx(i) {
      st.rx = i; rxBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      st.coef = species().map(function () { return 1; }); st.cnt = RX[i].start.slice(); build();
    }
    function setMode(m) { st.mode = m; mBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === m - 1 ? 'true' : 'false'); }); build(); }
    function build() {
      gS.innerHTML = '';
      var r = RX[st.rx];
      if (st.mode === 1) {
        species().forEach(function (s, k) {
          api.slider({ id: 'reaction-balance-c' + k, label: (k < r.re.length ? '반응물 ' : '생성물 ') + MOL[s].f + ' 계수', min: 1, max: 4, step: 1, value: st.coef[k], parent: gS,
            onInput: function (v) { st.coef[k] = v; update(); } });
        });
      } else {
        r.re.forEach(function (s, k) {
          api.slider({ id: 'reaction-balance-n' + k, label: MOL[s].name + '(' + MOL[s].f + ') 분자 수', min: 0, max: r.max[k], step: 1, value: st.cnt[k], parent: gS,
            format: function (v) { return v + '개'; }, onInput: function (v) { st.cnt[k] = v; update(); } });
        });
      }
      update();
    }
    function atomsOf(s) { var o = {}; MOL[s].atoms.forEach(function (a) { o[a[0]] = (o[a[0]] || 0) + 1; }); return o; }
    function massOf(s) { return MOL[s].atoms.reduce(function (m, a) { return m + MASS[a[0]]; }, 0); }
    function elements() {
      var seen = [];
      species().forEach(function (s) { MOL[s].atoms.forEach(function (a) { if (seen.indexOf(a[0]) < 0) seen.push(a[0]); }); });
      return ['C', 'N', 'H', 'O'].filter(function (e) { return seen.indexOf(e) >= 0; });
    }
    function gcd(a, b) { return b ? gcd(b, a % b) : a; }
    // 반응 전/후에 놓인 분자 목록 [{s, left}] 계산
    function scene() {
      var r = RX[st.rx], nR = r.re.length, before = [], after = [], info = {};
      if (st.mode === 1) {
        r.re.forEach(function (s, k) { for (var i = 0; i < st.coef[k]; i++) before.push({ s: s }); });
        r.pr.forEach(function (s, k) { for (var i = 0; i < st.coef[nR + k]; i++) after.push({ s: s }); });
      } else {
        var n = Infinity;
        r.re.forEach(function (s, k) { n = Math.min(n, Math.floor(st.cnt[k] / r.co[k])); });
        info.n = n; info.prod = []; info.left = [];
        r.re.forEach(function (s, k) { for (var i = 0; i < st.cnt[k]; i++) before.push({ s: s }); });
        r.pr.forEach(function (s, k) { var c = n * r.co[nR + k]; info.prod.push([s, c]); for (var i = 0; i < c; i++) after.push({ s: s }); });
        r.re.forEach(function (s, k) { var c = st.cnt[k] - n * r.co[k]; if (c > 0) info.left.push([s, c]); for (var i = 0; i < c; i++) after.push({ s: s, left: true }); });
      }
      function count(list) { var o = {}; list.forEach(function (m) { var a = atomsOf(m.s); for (var e in a) o[e] = (o[e] || 0) + a[e]; }); return o; }
      function mass(list) { return list.reduce(function (t, m) { return t + massOf(m.s); }, 0); }
      return { before: before, after: after, cb: count(before), ca: count(after), mb: mass(before), ma: mass(after), info: info };
    }
    function eqText(sc) {
      var r = RX[st.rx], sp = species(), nR = r.re.length;
      var c = st.mode === 1 ? st.coef : r.co;
      function term(k) { return (c[k] > 1 ? c[k] : '') + MOL[sp[k]].f; }
      var L = r.re.map(function (s, k) { return term(k); }).join(' + ');
      var R = r.pr.map(function (s, k) { return term(nR + k); }).join(' + ');
      return L + '  →  ' + R;
    }
    function verdict(sc) {
      var els = elements(), ok = els.every(function (e) { return (sc.cb[e] || 0) === (sc.ca[e] || 0); });
      if (st.mode === 2) return { ok: true, text: sc.before.length === 0 ? '반응물을 넣어 보자' : '질량 보존: 반응 전 = 반응 후' };
      if (!ok) return { ok: false, text: '원자 수가 다르다 — 계수를 더 바꿔 보자' };
      var g = st.coef.reduce(function (a, b) { return gcd(a, b); });
      if (g > 1) return { ok: true, text: '원자 수는 같다. 가장 간단한 정수비로 줄이면?' };
      return { ok: true, text: '완성! 원자의 종류와 개수가 같다' };
    }
    function update() {
      var sc = scene(), els = elements(), v = verdict(sc);
      r1.set(els.map(function (e) { return e + ' ' + (sc.cb[e] || 0) + '→' + (sc.ca[e] || 0); }).join(' · '));
      r2.set(sc.mb + ' → ' + sc.ma + (sc.mb === sc.ma ? ' (같음)' : ' (다름)'));
      if (st.mode === 2) {
        var p = sc.info.prod.filter(function (x) { return x[1] > 0; }).map(function (x) { return MOL[x[0]].f + ' ' + x[1] + '개'; }).join(', ') || '없음';
        var l = sc.info.left.map(function (x) { return MOL[x[0]].f + ' ' + x[1] + '개'; }).join(', ') || '없음';
        r3.set('생성물 ' + p + ' / 남은 물질 ' + l);
      } else r3.set(v.text);
      draw(sc, v);
    }

    function bead(e, x, y, r) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = COL[e][0]; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = T.figInk; ctx.stroke();
      if (r >= 7.5) { ctx.fillStyle = COL[e][1]; ctx.font = '700 ' + Math.max(11, Math.round(r * 1.05)) + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y + 0.5); ctx.textBaseline = 'alphabetic'; }
    }
    function molecule(s, x, y, u, left) {
      if (left) { ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, u * 1.75, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      MOL[s].atoms.forEach(function (a) { bead(a[0], x + a[1] * u, y + a[2] * u, RAD[a[0]] * u); });
    }
    function box(list, bx, by, bw, bh, title, tone) {
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = tone; ctx.lineWidth = 1.5; rr(bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(title, bx + 10, by + 19);
      var n = list.length; if (!n) { ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('(없음)', bx + bw / 2, by + bh / 2 + 8); return; }
      var ix = bx + 8, iy = by + 28, iw = bw - 16, ih = bh - 34, best = null;
      for (var cols = 1; cols <= n; cols++) {
        var rows = Math.ceil(n / cols), u = Math.min(iw / cols / 3.3, ih / rows / 3.0);
        if (!best || u > best.u) best = { cols: cols, rows: rows, u: u };
      }
      var u = Math.min(best.u, 22), cw = iw / best.cols, ch = ih / best.rows;
      list.forEach(function (m, i) {
        var c = i % best.cols, r = Math.floor(i / best.cols);
        molecule(m.s, ix + cw * (c + 0.5), iy + ch * (r + 0.5), u, m.left);
      });
    }
    var T;
    function draw(sc, v) {
      T = api.tokens(); var w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = T.figInk; ctx.font = '600 17px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(eqText(sc), w / 2, 24);
      var bTone = T.figBlue, aTone = st.mode === 1 && !v.ok ? T.figRed : T.figGreen;
      var B, A, bottomY;
      if (!narrow) {
        var bw = w * 0.43, bh = h * 0.5;
        B = [0, 38, bw, bh]; A = [w - bw, 38, bw, bh]; bottomY = 38 + bh + 12;
        arrow(bw + 10, 38 + bh / 2, w - bw - 10, 38 + bh / 2);
      } else {
        var bh2 = h * 0.24;
        B = [0, 38, w, bh2]; A = [0, 38 + bh2 + 30, w, bh2]; bottomY = 38 + bh2 * 2 + 42;
        arrowV(w / 2, 38 + bh2 + 4, 38 + bh2 + 26);
      }
      box(sc.before, B[0], B[1], B[2], B[3], '반응 전', bTone);
      box(sc.after, A[0], A[1], A[2], A[3], st.mode === 2 ? '반응 후 (점선 = 남은 물질)' : '반응 후', aTone);
      // 원자 수 표
      var els = elements(), tw = narrow ? w : w * 0.5, tx = 0, rowH = 24, ty = bottomY;
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      var cx1 = tx + tw * 0.42, cx2 = tx + tw * 0.64, cx3 = tx + tw * 0.86;
      ctx.fillText('반응 전', cx1, ty + 12); ctx.fillText('반응 후', cx2, ty + 12); ctx.fillText('같은가?', cx3, ty + 12);
      els.forEach(function (e, i) {
        var y = ty + 22 + rowH * i + rowH / 2;
        bead(e, tx + 16, y, 9);
        ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '13px ' + T.fontBody;
        ctx.fillText({ H: '수소 원자', O: '산소 원자', N: '질소 원자', C: '탄소 원자' }[e], tx + 32, y + 4);
        var a = sc.cb[e] || 0, b = sc.ca[e] || 0;
        ctx.font = '600 14px ' + T.fontMono; ctx.textAlign = 'center';
        ctx.fillText(a, cx1, y + 5); ctx.fillText(b, cx2, y + 5);
        ctx.fillStyle = a === b ? T.figGreen : T.figRed; ctx.font = '700 14px ' + T.fontBody;
        ctx.fillText(a === b ? '○ 같음' : '× 다름', cx3, y + 5);
      });
      // 저울
      var sx = narrow ? 0 : w * 0.53, sy = narrow ? ty + 22 + rowH * els.length + 10 : ty, sw = narrow ? w : w * 0.47, sh = h - sy - 4;
      scale(sx, sy, sw, sh, sc.mb, sc.ma);
      if (st.mode === 1) {
        ctx.fillStyle = v.ok ? T.figGreen : T.figRed; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(v.text, A[0] + A[2] / 2, A[1] + A[3] - 8);
      }
    }
    function scale(x, y, w, h, mb, ma) {
      var cx = x + w / 2, top = y + 42, base = y + h - 8;
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('질량 합 (원자 1개의 상대적 질량: H 1, C 12, N 14, O 16)', cx, y + 12);
      var diff = ma - mb, ang = Math.max(-0.22, Math.min(0.22, diff * 0.02)), L = Math.min(w * 0.36, 150);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, base); ctx.lineTo(cx, top + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 30, base); ctx.lineTo(cx + 30, base); ctx.stroke();
      var lx = cx - L * Math.cos(ang), ly = top + 6 - L * Math.sin(ang), rx = cx + L * Math.cos(ang), ry = top + 6 + L * Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
      [[lx, ly, '반응 전', mb, T.figBlue], [rx, ry, '반응 후', ma, mb === ma ? T.figGreen : T.figRed]].forEach(function (p) {
        var py = p[1] + Math.min(26, (base - p[1]) * 0.45);
        ctx.lineWidth = 1.2; ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], py); ctx.stroke();
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = p[4]; ctx.lineWidth = 2; rr(p[0] - 42, py, 84, 34, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = p[4]; ctx.font = '700 15px ' + T.fontMono; ctx.textAlign = 'center'; ctx.fillText(p[3], p[0], py + 16);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText(p[2], p[0], py + 29);
      });
    }
    function arrow(x1, y, x2) {
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - 8, y); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 12, y - 7); ctx.lineTo(x2 - 12, y + 7); ctx.closePath(); ctx.fill();
    }
    function arrowV(x, y1, y2) {
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2 - 8); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 7, y2 - 12); ctx.lineTo(x + 7, y2 - 12); ctx.closePath(); ctx.fill();
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(update);
    build();
  },
});
