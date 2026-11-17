/* 일반화학 5 화학 결합: 2주기 동핵 이원자 분자의 분자 오비탈 준위도 — 전자 채우기, 결합 차수, 자기성, s–p 혼합 */
Sims.register('u-mo-diagram', {
  title: '분자 오비탈 준위도 — 2주기 이원자 분자에 전자 채우기',
  caption: '분자를 고르고 전하를 바꿔 보자. 원자가 전자가 낮은 분자 오비탈부터 파울리 원리와 훈트 규칙에 따라 채워지고, 결합 차수와 홀전자 수(자기성)가 바로 계산된다. O₂는 π* 두 개에 전자가 하나씩 들어가 상자기성이 된다. ‘순서 바꿔 보기’를 누르면 그 분자에 맞지 않는 준위 순서로 채워 보는데, B₂와 C₂에서는 실험(B₂ 상자기성, C₂ 반자기성)과 어긋나는 결과가 나온다. 준위의 높이는 순서만 맞춘 모식이고, 1s 전자는 결합에 기여하지 않아 생략했다.',
  init: function (api) {
    var MOL = [{ s: 'B', Z: 5 }, { s: 'C', Z: 6 }, { s: 'N', Z: 7 }, { s: 'O', Z: 8 }, { s: 'F', Z: 9 }, { s: 'Ne', Z: 10 }];
    var CHG = [1, 0, -1, -2];
    var DATA = {   // [결합 길이 pm, 결합 에너지 kJ/mol] (원고의 표)
      'B0': [159, 290], 'C0': [124, 600], 'N0': [110, 945], 'O0': [121, 498], 'F0': [143, 159],
      'O1': [112, null], 'O-1': [133, null], 'O-2': [149, null],
    };
    var NOTE = { 'O-1': '초과산화 이온', 'O-2': '과산화 이온', 'Ne0': '존재하지 않음' };
    var state = { m: 3, c: 0, swap: false };

    // 분자 오비탈: 이름, 겹침 수, 결합(+1)/반결합(−1), 만든 원자 오비탈
    function levels(mixed) {
      var sg = { id: 'σ2p', deg: 1, b: 1, ao: 'p' }, pi = { id: 'π2p', deg: 2, b: 1, ao: 'p' };
      return [{ id: 'σ2s', deg: 1, b: 1, ao: 's' }, { id: 'σ*2s', deg: 1, b: -1, ao: 's' }]
        .concat(mixed ? [pi, sg] : [sg, pi])
        .concat([{ id: 'π*2p', deg: 2, b: -1, ao: 'p' }, { id: 'σ*2p', deg: 1, b: -1, ao: 'p' }]);
    }
    function natural(Z) { return Z <= 7; }          // B, C, N: s–p 혼합 순서
    function mixedNow() { var n = natural(MOL[state.m].Z); return state.swap ? !n : n; }
    function nElec() { return 2 * (MOL[state.m].Z - 2) - state.c; }
    function fill(L, n) {
      var left = n;
      return L.map(function (o) {
        var k = Math.min(2 * o.deg, left); left -= k;
        var boxes = []; for (var i = 0; i < o.deg; i++) boxes.push([false, false]);
        for (var j = 0; j < k; j++) { if (j < o.deg) boxes[j][0] = true; else boxes[j - o.deg][1] = true; }
        return { o: o, k: k, boxes: boxes };
      });
    }
    var SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUBD = '₀₁₂₃₄₅₆₇₈₉';
    function formula(m, c) {
      var s = MOL[m].s + '₂';
      if (c === 0) return s;
      var a = Math.abs(c);
      return s + (a > 1 ? SUPD[a] : '') + (c > 0 ? '⁺' : '⁻');
    }
    function analyse() {
      var L = levels(mixedNow()), F = fill(L, nElec()), b = 0, a = 0, un = 0;
      F.forEach(function (f) {
        if (f.o.b > 0) b += f.k; else a += f.k;
        f.boxes.forEach(function (x) { if (x[0] !== x[1]) un++; });
      });
      return { F: F, bo: (b - a) / 2, un: un, b: b, a: a };
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.6 : 0.62; }, label: '분자 오비탈 에너지 준위도와 결합 차수 비교 그래프' });
    var ctx = cv.ctx;
    var rSp = api.readout('화학종');
    var rCfg = api.readout('원자가 전자 배치');
    var rBo = api.readout('결합 차수');
    var rMag = api.readout('홀전자 · 자기성');
    var rDat = api.readout('실측 결합 길이 · 에너지');

    var g1 = api.group();
    var mb = MOL.map(function (m, i) { return api.button(m.s + '₂', function () { state.m = i; fix(); }, { toggle: true, pressed: i === state.m, parent: g1 }); });
    var g2 = api.group();
    var cb = CHG.map(function (c) { return api.button(c === 0 ? '중성' : (c > 0 ? '+1 (전자 −1)' : c + ' (전자 +' + (-c) + ')'), function () { state.c = c; fix(); }, { toggle: true, pressed: c === 0, parent: g2 }); });
    var sb = api.button('준위 순서 바꿔 보기', function () { state.swap = !state.swap; fix(); }, { toggle: true });

    function fix() {
      if (nElec() > 16) state.c = 0;
      mb.forEach(function (b, i) { b.setAttribute('aria-pressed', i === state.m ? 'true' : 'false'); });
      cb.forEach(function (b, i) { b.setAttribute('aria-pressed', CHG[i] === state.c ? 'true' : 'false'); b.disabled = 2 * (MOL[state.m].Z - 2) - CHG[i] > 16; });
      sb.setAttribute('aria-pressed', state.swap ? 'true' : 'false');
      readouts(); draw();
    }
    function readouts() {
      var A = analyse(), key = MOL[state.m].s + state.c, d = DATA[key];
      rSp.set(formula(state.m, state.c) + (NOTE[key] ? ' (' + NOTE[key] + ')' : '') + ' · 전자 ' + nElec() + '개');
      rCfg.set(A.F.filter(function (f) { return f.k; }).map(function (f) { return '(' + f.o.id + ')' + SUPD[f.k]; }).join(''));
      rBo.set('(' + A.b + ' − ' + A.a + ') ÷ 2 = ' + fmt(A.bo));
      rMag.set(A.un + '개 · ' + (A.un ? '상자기성' : '반자기성'));
      rDat.set(d ? d[0] + ' pm' + (d[1] ? ' · ' + d[1] + ' kJ/mol' : '') : (key === 'Ne0' ? '분자를 만들지 않음' : '—'));
    }
    function fmt(x) { return (Math.round(x * 10) / 10).toString(); }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      if (narrow) { diagram(T, { x: 0, y: 0, w: w, h: h * 0.7 }); chart(T, { x: 0, y: h * 0.73, w: w, h: h * 0.27 }); }
      else { diagram(T, { x: 0, y: 0, w: w * 0.63, h: h }); chart(T, { x: w * 0.66, y: 24, w: w * 0.34 - 6, h: h * 0.72 }); }
    }
    function diagram(T, r) {
      var Z = MOL[state.m].Z, mixed = mixedNow(), A = analyse();
      var gap = 2.4 + 0.4 * (Z - 5);            // 2s–2p 간격(모식): 원자 번호가 클수록 커진다
      var Es = 0, Ep = gap;
      var E = { 'σ2s': -0.55, 'σ*2s': 0.55, 'π2p': gap - 0.5, 'σ2p': mixed ? gap - 0.05 : gap - 1.1, 'π*2p': gap + 0.6, 'σ*2p': gap + 1.3 };
      var lo = -0.8, hi = gap + 1.55;
      var top = r.y + 44, bot = r.y + r.h - 28;
      var Y = function (e) { return bot - (e - lo) / (hi - lo) * (bot - top); };
      var xA = r.x + r.w * 0.17, xM = r.x + r.w * 0.52, xB = r.x + r.w * 0.87, seg = Math.min(30, r.w * 0.07);
      // 머리글
      ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
      ctx.fillText(MOL[state.m].s + ' 원자', xA, r.y + 14); ctx.fillText(MOL[state.m].s + ' 원자', xB, r.y + 14);
      ctx.fillText(formula(state.m, state.c) + ' 분자 오비탈', xM, r.y + 14);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('(중성 원자)', xA, r.y + 29); ctx.fillText('(중성 원자)', xB, r.y + 29);
      if (r.w >= 400) { ctx.save(); ctx.translate(r.x + 9, (top + bot) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('에너지(모식) →', 0, 0); ctx.restore(); }
      if (state.swap) { ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.font = '600 12px ' + T.fontBody; ctx.fillText('실제와 다른 순서로 채운 가정', xM, bot + 18); }
      else { ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody; ctx.fillText(mixed ? 's–p 혼합: π2p가 σ2p보다 낮다' : 's–p 혼합 작음: σ2p가 π2p보다 낮다', xM, bot + 18); }
      // 원자 오비탈 위치(가로)
      function aoX(x0, kind, i) { return kind === 's' ? x0 : x0 + (i - 1) * (seg + 6); }
      var aoSeg = Math.min(seg, r.w * 0.05);
      // 연결선
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      A.F.forEach(function (f) {
        var ey = Y(E[f.o.id]), ea = Y(f.o.ao === 's' ? Es : Ep), wM = f.o.deg === 2 ? seg + 4 + seg / 2 : seg / 2;
        var wA = f.o.ao === 's' ? aoSeg / 2 : aoSeg * 1.5 + 6;
        ctx.beginPath(); ctx.moveTo(xA + wA, ea); ctx.lineTo(xM - wM - 2, ey); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xB - wA, ea); ctx.lineTo(xM + wM + 2, ey); ctx.stroke();
      });
      ctx.setLineDash([]);
      // 원자 오비탈과 원자의 전자(중성 원자)
      var ne = Z - 2;   // 원자가 전자
      [xA, xB].forEach(function (x0) {
        level(T, x0, Y(Es), aoSeg, [[ne >= 1, ne >= 2]], false);
        var np = Math.max(0, ne - 2), bx = [];
        for (var i = 0; i < 3; i++) bx.push([np > i, np > i + 3]);
        level(T, x0 - (aoSeg + 6), Y(Ep), aoSeg, [bx[0]], false); level(T, x0, Y(Ep), aoSeg, [bx[1]], false); level(T, x0 + aoSeg + 6, Y(Ep), aoSeg, [bx[2]], false);
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = x0 === xA ? 'right' : 'left';
        var lx = x0 === xA ? x0 - aoSeg * 1.5 - 12 : x0 + aoSeg * 1.5 + 12;
        ctx.fillText('2p', lx, Y(Ep) + 4);
        ctx.fillText('2s', x0 === xA ? x0 - aoSeg / 2 - 8 : x0 + aoSeg / 2 + 8, Y(Es) + 4);
      });
      // 분자 오비탈
      A.F.forEach(function (f) {
        var y = Y(E[f.o.id]);
        if (f.o.deg === 1) level(T, xM, y, seg, f.boxes, true, f.o.b < 0);
        else { level(T, xM - (seg / 2 + 2), y, seg, [f.boxes[0]], true, f.o.b < 0); level(T, xM + (seg / 2 + 2), y, seg, [f.boxes[1]], true, f.o.b < 0); }
        var half = f.o.deg === 2 ? seg + 2 : seg / 2;
        ctx.fillStyle = f.o.b < 0 ? T.figRed : T.figBlue; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(f.o.id, xM + half + 6, y + 4);
      });
    }
    function level(T, x, y, len, boxes, mo, anti) {
      ctx.strokeStyle = mo ? (anti ? T.figRed : T.figBlue) : T.figInk; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x - len / 2, y); ctx.lineTo(x + len / 2, y); ctx.stroke();
      var b = boxes[0];
      if (b[0]) arrow(T, x - (b[1] ? 5 : 0), y, true);
      if (b[1]) arrow(T, x + 5, y, false);
    }
    function arrow(T, x, y, up) {
      var t = y - 15, bt = y + 3, d = up ? 1 : -1;
      ctx.strokeStyle = T.figInk; ctx.fillStyle = T.figInk; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, up ? bt : t); ctx.lineTo(x, up ? t + 4 : bt - 4); ctx.stroke();
      var tip = up ? t : bt;
      ctx.beginPath(); ctx.moveTo(x, tip); ctx.lineTo(x - 3.5, tip + d * 6); ctx.lineTo(x + 3.5, tip + d * 6); ctx.closePath(); ctx.fill();
    }
    function chart(T, r) {
      var BO = [1, 2, 3, 2, 1, 0], BE = [290, 600, 945, 498, 159, 0], PARA = [true, false, false, true, false, false];
      var L = r.x + 40, R = r.x + r.w - 6, top = r.y + 30, B = r.y + r.h - 34;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('중성 분자 비교: 결합 에너지와 결합 차수', r.x + 4, r.y + 8);
      var sy = function (v) { return B - v / 1000 * (B - top); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 500, 1000].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v, L - 4, sy(v) + 4); });
      ctx.save(); ctx.translate(r.x + 8, (top + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody; ctx.fillText('kJ/mol', 0, 0); ctx.restore();
      var bw = (R - L) / 6;
      MOL.forEach(function (m, i) {
        var x = L + i * bw + bw * 0.18, cur = i === state.m;
        ctx.fillStyle = cur ? T.figAccent : T.figSoftBlue; ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1;
        if (BE[i]) { ctx.fillRect(x, sy(BE[i]), bw * 0.64, B - sy(BE[i])); ctx.strokeRect(x + 0.5, sy(BE[i]) + 0.5, bw * 0.64 - 1, B - sy(BE[i]) - 1); }
        ctx.fillStyle = T.figInk; ctx.font = (cur ? '600 ' : '') + '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(m.s + '₂', x + bw * 0.32, B + 14);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('차수 ' + BO[i], x + bw * 0.32, sy(BE[i]) - 5);
        if (PARA[i]) { ctx.fillStyle = T.figRed; ctx.fillText('상자기', x + bw * 0.32, B + 28); }
      });
    }

    api.onResize(draw);
    fix();
  },
});
