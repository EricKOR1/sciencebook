/* 화학 반응의 세계 1 산·염기 평형: 강산·약산을 강염기(NaOH)로 적정할 때의 pH 곡선, 당량점·반당량점·완충 영역·지시약 선택 */
Sims.register('titration-curve', {
  title: '적정 곡선 그리기 — 산의 세기가 바꾸는 것과 바꾸지 않는 것',
  caption: '산을 바꾸어 가며 곡선을 비교해 보자. 당량점까지 필요한 NaOH의 부피는 산의 세기와 관계없이 같지만, 처음 pH·반당량점 pH(= pKₐ)·당량점 pH·수직 구간의 길이는 크게 달라진다. 지시약은 변색 범위가 수직 구간(당량점 앞뒤 0.1 mL, 약 두 방울 사이) 안에 들어가야 알맞다. 산과 NaOH는 모두 0.100 M, 25 ℃(K_w = 1.0×10⁻¹⁴)로 정했고, pH는 근사 없이 전하 균형(물의 이온화 포함)으로 계산했다. 점은 원고 데이터 1·2의 값이며, 곡선과 소수 둘째 자리의 반올림 범위에서 일치한다.',
  init: function (api) {
    var C = 0.100, KW = 1.0e-14;
    var ACIDS = [
      { key: 'hcl', name: 'HCl', label: '염산 HCl (강산)', Ka: Infinity },
      { key: 'hf', name: 'HF', label: 'HF', Ka: 6.8e-4 },
      { key: 'hcooh', name: 'HCOOH', label: '폼산 HCOOH', Ka: 1.8e-4 },
      { key: 'ac', name: 'CH₃COOH', label: '아세트산 CH₃COOH', Ka: 1.8e-5 },
      { key: 'hcn', name: 'HCN', label: 'HCN', Ka: 5e-10 },
    ];
    // 원고 데이터 1·2 (0.100 M 산 25.0 mL)
    var DATA = {
      hcl: [[0, 1.00], [10, 1.37], [20, 1.95], [24, 2.69], [24.9, 3.70], [25, 7.00], [25.1, 10.30], [26, 11.29], [30, 11.96], [40, 12.36]],
      ac: [[0, 2.87], [5, 4.14], [10, 4.57], [12.5, 4.74], [20, 5.35], [24, 6.12], [25, 8.72], [26, 11.29], [30, 11.96], [40, 12.36]],
    };
    var INDS = [
      { key: 'mo', name: '메틸 오렌지', lo: 3.1, hi: 4.4, ca: '#e8412f', cb: '#f5c400', na: '빨간색', nb: '노란색' },
      { key: 'mr', name: '메틸 레드', lo: 4.4, hi: 6.2, ca: '#d6336c', cb: '#f2c200', na: '빨간색', nb: '노란색' },
      { key: 'btb', name: 'BTB', lo: 6.0, hi: 7.6, ca: '#e6c200', cb: '#1c6fd6', na: '노란색', nb: '파란색' },
      { key: 'pp', name: '페놀프탈레인', lo: 8.2, hi: 10.0, ca: null, cb: '#e0368c', na: '무색', nb: '붉은색' },
    ];
    var state = { acid: ACIDS[3], Va: 25.0, vb: 12.5, show: { mo: true, mr: false, btb: false, pp: true } };
    var cache = {};

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.12 : 0.58; }, label: '넣은 NaOH 부피에 따른 pH 적정 곡선' });
    var ctx = cv.ctx;

    var rV = api.readout('넣은 NaOH');
    var rPH = api.readout('pH');
    var rS = api.readout('용액 속 상태');
    var rI = api.readout('알맞은 지시약');

    var gA = api.group();
    var aBtns = ACIDS.map(function (a) {
      return api.button(a.label, function () { setAcid(a); }, { toggle: true, pressed: a === state.acid, parent: gA });
    });
    var gI = api.group();
    var iBtns = INDS.map(function (ind) {
      return api.button(ind.name, function (b) {
        state.show[ind.key] = !state.show[ind.key];
        b.setAttribute('aria-pressed', state.show[ind.key] ? 'true' : 'false'); update();
      }, { toggle: true, pressed: state.show[ind.key], parent: gI });
    });
    var slider = api.slider({ id: 'titration-curve-vb', label: '넣은 0.100 M NaOH', min: 0, max: 50, step: 0.1, value: state.vb,
      format: function (v) { return v.toFixed(1) + ' mL'; },
      onInput: function (v) { state.vb = v; update(); } });
    var gV = api.group();
    var vBtns = [20.0, 25.0].map(function (va) {
      return api.button('산 ' + va.toFixed(1) + ' mL', function () { setVa(va); }, { toggle: true, pressed: va === state.Va, parent: gV });
    });

    function setAcid(a) {
      state.acid = a;
      aBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', ACIDS[i] === a ? 'true' : 'false'); });
      update();
    }
    function setVa(va) {
      var ratio = state.vb / (2 * state.Va);
      state.Va = va;
      vBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', [20.0, 25.0][i] === va ? 'true' : 'false'); });
      slider.input.max = 2 * va;
      slider.set(Math.round(ratio * 2 * va * 10) / 10);
    }

    // 전하 균형: [H⁺] + [Na⁺] = [OH⁻] + [A⁻],  [A⁻] = C_HA·Kₐ/(Kₐ + [H⁺])  → pH를 이분법으로 푼다
    function pH(Ka, Va, vb) {
      var Vt = Va + vb, ca = C * Va / Vt, na = C * vb / Vt, lo = -2, hi = 16;
      for (var i = 0; i < 64; i++) {
        var m = (lo + hi) / 2, h = Math.pow(10, -m);
        var a = Ka === Infinity ? ca : ca * Ka / (Ka + h);
        if (h + na - KW / h - a > 0) lo = m; else hi = m;
      }
      return (lo + hi) / 2;
    }
    function pKa(a) { return -Math.log10(a.Ka); }
    function curve(a, Va) {
      var k = a.key + Va;
      if (cache[k]) return cache[k];
      var pts = [], Ve = Va, v;
      for (v = 0; v <= 2 * Va + 1e-9; v += (Math.abs(v - Ve) < 1 ? 0.01 : 0.1)) pts.push([v, pH(a.Ka, Va, v)]);
      cache[k] = pts; return pts;
    }
    function steep(a, Va) { return [pH(a.Ka, Va, Va - 0.1), pH(a.Ka, Va, Va + 0.1)]; }
    function suitable(a, Va) {
      var s = steep(a, Va);
      return INDS.filter(function (ind) { return ind.lo >= s[0] && ind.hi <= s[1]; });
    }
    function indState(ind, p) {
      if (p < ind.lo) return ind.na;
      if (p > ind.hi) return ind.nb;
      return '변색 중';
    }

    function readouts() {
      var a = state.acid, Va = state.Va, v = state.vb, Ve = Va, p = pH(a.Ka, Va, v), weak = a.Ka !== Infinity;
      rV.set(v.toFixed(1) + ' mL (당량점 ' + Ve.toFixed(1) + ' mL)');
      var cols = INDS.filter(function (ind) { return state.show[ind.key]; }).map(function (ind) { return ind.name + ' ' + indState(ind, p); });
      rPH.set(p.toFixed(2) + (cols.length ? ' · ' + cols.join(', ') : ''));
      var s;
      if (Math.abs(v - Ve) < 0.05) s = weak ? '당량점: ' + shortA(a) + '⁻만 남음 → 가수 분해로 염기성' : '당량점: Na⁺, Cl⁻만 남음 → 중성';
      else if (v > Ve) s = 'OH⁻가 남음 (NaOH 과량)';
      else if (!weak) s = v === 0 ? 'H⁺(H₃O⁺)만 많음' : '중화되고 남은 H⁺가 pH를 정함';
      else if (v === 0) s = '대부분 ' + a.name + ' 분자 (일부만 이온화)';
      else if (Math.abs(v - Ve / 2) < 0.05) s = '반당량점: [' + a.name + '] = [' + shortA(a) + '⁻] → pH = pKₐ';
      else if (v >= Ve / 11 && v <= Ve * 10 / 11) s = '완충 영역: ' + a.name + '와 ' + shortA(a) + '⁻가 함께';
      else if (v < Ve / 11) s = a.name + ' 많고 ' + shortA(a) + '⁻ 조금';
      else s = shortA(a) + '⁻ 많고 ' + a.name + ' 조금';
      rS.set(s);
      var su = suitable(a, Va);
      rI.set(su.length ? su.map(function (x) { return x.name; }).join(', ') : '없음 (수직 구간이 거의 없다)');
    }
    function shortA(a) { return { hf: 'F', hcooh: 'HCOO', ac: 'CH₃COO', hcn: 'CN', hcl: 'Cl' }[a.key]; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      var a = state.acid, Va = state.Va, Ve = Va, weak = a.Ka !== Infinity, VMAX = 2 * Va;
      ctx.clearRect(0, 0, w, h);
      var L = narrow ? 40 : 52, R = w - (narrow ? 10 : 18), Tp = 12, B = h - (narrow ? 44 : 42);
      var sx = function (v) { return L + v / VMAX * (R - L); };
      var sy = function (p) { return B - p / 14 * (B - Tp); };
      var fs = narrow ? 11 : 12;

      // 지시약 변색 범위(실제 색)
      INDS.forEach(function (ind) {
        if (!state.show[ind.key]) return;
        var y1 = sy(ind.hi), y2 = sy(ind.lo), gr = ctx.createLinearGradient(0, y2, 0, y1);
        gr.addColorStop(0, ind.ca || T.figPanel); gr.addColorStop(1, ind.cb);
        ctx.globalAlpha = T.dark ? 0.32 : 0.26; ctx.fillStyle = gr; ctx.fillRect(L, y1, R - L, y2 - y1); ctx.globalAlpha = 1;
        ctx.strokeStyle = ind.cb; ctx.globalAlpha = 0.7; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, y1); ctx.lineTo(R, y1); ctx.moveTo(L, y2); ctx.lineTo(R, y2); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(ind.name + ' ' + ind.lo.toFixed(1) + '–' + ind.hi.toFixed(1), R - 6, (y1 + y2) / 2);
      });
      // 완충 영역
      if (weak) {
        var bx1 = sx(Ve / 11), bx2 = sx(Ve * 10 / 11);
        ctx.fillStyle = T.figSoftGreen; ctx.globalAlpha = 0.6; ctx.fillRect(bx1, Tp, bx2 - bx1, B - Tp); ctx.globalAlpha = 1;
        ctx.fillStyle = T.figGreen; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('완충 영역', (bx1 + bx2) / 2, sy(12.4));
        ctx.font = fs + 'px ' + T.fontBody;
        ctx.fillText(a.name + ' + ' + shortA(a) + '⁻', (bx1 + bx2) / 2, sy(12.4) + fs + 3);
      }
      // 축과 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      for (var p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(R, sy(p)); ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText(p, L - 6, sy(p)); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      var stepV = narrow ? 10 : 5;
      for (var v = 0; v <= VMAX + 1e-9; v += stepV) ctx.fillText(v, sx(v), B + 5);
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('넣은 0.100 M NaOH 부피 (mL) — 산 ' + Va.toFixed(1) + ' mL', (L + R) / 2, B + 22);
      ctx.save(); ctx.translate(12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText('pH', 0, 0); ctx.restore();

      // 비교용 HCl 곡선
      if (weak) line(curve(ACIDS[0], Va), T.figMuted, 1.5, [5, 4]);
      // 당량점 세로선
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(Ve), Tp); ctx.lineTo(sx(Ve), B); ctx.stroke(); ctx.setLineDash([]);
      // 선택한 산의 곡선
      line(curve(a, Va), T.figAccent, 2.6, []);
      // 수직 구간 괄호
      var st = steep(a, Va), qx = sx(Ve) + 9;
      if (st[1] - st[0] > 0.5) {
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(qx + 5, sy(st[0])); ctx.lineTo(qx, sy(st[0])); ctx.lineTo(qx, sy(st[1])); ctx.lineTo(qx + 5, sy(st[1])); ctx.stroke();
        ctx.fillStyle = T.figRed; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('수직 구간', qx + 8, sy((st[0] + st[1]) / 2) - 8);
        ctx.font = fs + 'px ' + T.fontBody;
        ctx.fillText('pH ' + st[0].toFixed(1) + '–' + st[1].toFixed(1), qx + 8, sy((st[0] + st[1]) / 2) + 8);
      }
      // 원고 데이터 점
      var dk = Va === 25 ? (a.key === 'hcl' ? 'hcl' : a.key === 'ac' ? 'ac' : null) : null;
      if (dk) DATA[dk].forEach(function (d) {
        ctx.beginPath(); ctx.arc(sx(d[0]), sy(d[1]), 3.6, 0, Math.PI * 2);
        ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // 당량점 표시 (왼쪽 위 빈 곳에 글자)
      var pe = pH(a.Ka, Va, Ve);
      dot(sx(Ve), sy(pe), T.figViolet, 5);
      ctx.fillStyle = T.figViolet; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      var ey = Math.max(sy(pe) - 14, Tp + 30);
      ctx.fillText('당량점', sx(Ve) - 8, ey - fs - 2);
      ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText(Ve.toFixed(1) + ' mL, pH ' + pe.toFixed(2), sx(Ve) - 8, ey);
      // 반당량점
      var ph2 = pH(a.Ka, Va, Ve / 2);
      dot(sx(Ve / 2), sy(ph2), T.figGreen, 5);
      ctx.fillStyle = weak ? T.figGreen : T.figMuted; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      var hx = sx(Ve / 2) + 6, hy = sy(ph2) + 8;
      ctx.fillText('반당량점', hx, hy);
      ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText(weak ? 'pH ≈ pKₐ = ' + pKa(a).toFixed(2) : 'pH ' + ph2.toFixed(2), hx, hy + fs + 3);
      // 현재 위치
      var pc = pH(a.Ka, Va, state.vb), cx = sx(state.vb), cy = sy(pc);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(cx, B); ctx.lineTo(cx, cy); ctx.lineTo(L, cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = T.figInk; ctx.stroke();
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, Math.PI * 2); ctx.fill();

      // 범례 (맨 위 왼쪽, 곡선이 지나가지 않는 곳)
      var items = [{ t: a.name, c: T.figAccent, d: [] }];
      if (weak) items.push({ t: 'HCl(비교)', c: T.figMuted, d: [5, 4] });
      if (dk) items.push({ t: '원고 데이터', c: T.figInk, dot: true });
      var lx = L + 10, ly = Tp + 10;
      ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var boxW = 0; items.forEach(function (it) { boxW += 30 + ctx.measureText(it.t).width + 12; });
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85; ctx.fillRect(lx - 6, ly - 10, boxW, 20); ctx.globalAlpha = 1;
      items.forEach(function (it) {
        if (it.dot) { ctx.beginPath(); ctx.arc(lx + 11, ly, 3.6, 0, Math.PI * 2); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = it.c; ctx.lineWidth = 1.5; ctx.stroke(); }
        else { ctx.strokeStyle = it.c; ctx.lineWidth = 2.4; ctx.setLineDash(it.d); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 22, ly); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = T.figInk; ctx.fillText(it.t, lx + 28, ly);
        lx += 30 + ctx.measureText(it.t).width + 12;
      });

      function line(pts, color, lw, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.lineJoin = 'round';
        ctx.beginPath(); pts.forEach(function (q, i) { var X = sx(q[0]), Y = sy(Math.max(0, Math.min(14, q[1]))); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.stroke(); ctx.setLineDash([]);
      }
      function dot(x, y, c, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    function update() { readouts(); draw(); }
    api.onResize(draw);
    update();
  },
});
