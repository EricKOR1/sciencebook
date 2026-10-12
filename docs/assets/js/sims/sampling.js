/* 1-4 정보와 신호: 표본화·양자화·부호화 — 촘촘하고 세밀할수록 원래 신호에 가깝지만 데이터 양이 늘어난다 */
Sims.register('sampling', {
  title: '하루 기온을 0과 1로 — 표본화 횟수와 비트 수 바꿔 보기',
  caption: '파란 곡선은 어느 날의 기온(아날로그 신호)이고, 빨간 계단은 표본화·양자화를 거쳐 다시 그린 디지털 신호이다. 처음 화면은 본문 예제 2와 같은 설정(4시간마다, 3비트)이며, 오후 2시 반 무렵 소나기로 기온이 잠깐 떨어진 것은 기록되지 않는다. 하루에 읽는 횟수와 비트 수를 늘리면 계단이 곡선에 가까워지지만, 데이터 양(표본 수 × 비트 수)도 함께 늘어난다. 기온 곡선은 설명을 위해 만든 값이고, 각 단계는 그 구간의 가운데 값으로 다시 그렸으며, 평균 오차는 하루 동안 계단과 곡선 사이 차이의 평균이다.',
  init: function (api) {
    var TMIN = 0, TMAX = 40;
    // 예제 2의 표본값(0, 4, 8, 12, 16, 20시)을 지나는 매끈한 곡선 + 오후 소나기
    var KNOTS = [12.4, 9.8, 14.1, 23.0, 26.7, 18.2];
    var RATES = [4, 6, 8, 12, 24, 48, 96];
    var state = { rate: 6, bits: 3, prog: 1 };

    function base(t) {
      var h = 4, n = KNOTS.length, x = ((t % 24) + 24) % 24, i = Math.floor(x / h), u = x / h - i;
      var p0 = KNOTS[(i - 1 + n) % n], p1 = KNOTS[i % n], p2 = KNOTS[(i + 1) % n], p3 = KNOTS[(i + 2) % n];
      return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
    }
    function temp(t) { return base(t) - 6 * Math.exp(-Math.pow((t - 14.5) / 0.5, 2)); }

    function levels() { return Math.pow(2, state.bits); }
    function stepW() { return (TMAX - TMIN) / levels(); }
    function levelOf(v) { var k = Math.floor((v - TMIN) / stepW()); return Math.max(0, Math.min(levels() - 1, k)); }
    function centerOf(k) { return TMIN + (k + 0.5) * stepW(); }
    function code(k) { var s = k.toString(2); while (s.length < state.bits) s = '0' + s; return s; }
    function samples() {
      var out = [], dt = 24 / state.rate;
      for (var i = 0; i < state.rate; i++) { var t = i * dt, v = temp(t), k = levelOf(v); out.push({ t: t, v: v, k: k, q: centerOf(k) }); }
      return out;
    }
    function heldAt(S, t) { var i = Math.max(0, Math.min(S.length - 1, Math.floor(t / (24 / state.rate) + 1e-9))); return S[i].q; }
    function meanErr(S) {
      var n = 960, sum = 0;
      for (var j = 0; j < n; j++) { var t = (j + 0.5) * 24 / n; sum += Math.abs(heldAt(S, t) - temp(t)); }
      return sum / n;
    }
    function fmtH(t) {
      var h = Math.floor(t + 1e-9), m = Math.round((t - h) * 60);
      return h + '시' + (m ? ' ' + m + '분' : '');
    }
    function fmtInterval(r) {
      var mins = 24 * 60 / r;
      return mins >= 60 ? (mins / 60) + '시간' : mins + '분';
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.32 : 0.6; }, label: '하루 기온 곡선과 표본화·양자화한 계단 모양 디지털 신호, 부호화된 비트열' });
    var ctx = cv.ctx;

    var rN = api.readout('하루 표본 수');
    var rL = api.readout('양자화 단계');
    var rBits = api.readout('데이터 양');
    var rErr = api.readout('평균 오차');

    var rateIdx = RATES.indexOf(state.rate);
    api.slider({ id: 'sampling-rate', label: '표본화: 하루에 읽는 횟수', min: 0, max: RATES.length - 1, step: 1, value: rateIdx,
      format: function (v) { var r = RATES[v]; return r + '번 (' + fmtInterval(r) + '마다)'; },
      onInput: function (v) { state.rate = RATES[v]; state.prog = 1; loop.pause(); update(); } });
    var bitsSlider = api.slider({ id: 'sampling-bits', label: '양자화: 비트 수', min: 1, max: 4, step: 1, value: state.bits,
      format: function (v) { return v + '비트 (' + Math.pow(2, v) + '단계)'; },
      onInput: function (v) { state.bits = v; state.prog = 1; loop.pause(); update(); } });
    var rateSlider = api.root.querySelector('#sampling-rate');
    var g = api.group();
    api.button('읽어 나가기', function () { sweep(); }, { primary: true, parent: g });
    api.button('예제 2 설정으로', function () {
      rateSlider.value = RATES.indexOf(6); rateSlider.dispatchEvent(new Event('input'));
      bitsSlider.set(3);
    }, { parent: g });

    var loop = api.loop(function (dt) {
      state.prog = Math.max(0, state.prog + Math.max(0, dt) / 4);
      if (state.prog >= 1) { state.prog = 1; loop.pause(); }
      draw();
    });
    loop.pause();
    function sweep() {
      if (api.reduced) { state.prog = 1; draw(); return; }
      state.prog = 0; loop.play();
    }

    function update() {
      var S = samples(), L = levels();
      rN.set(state.rate + '개');
      rL.set(L + '단계 (한 단계 ' + (40 / L).toFixed(L > 8 ? 2 : 1).replace(/\.?0+$/, '') + ' °C)');
      rBits.set(state.rate + ' × ' + state.bits + ' = ' + (state.rate * state.bits) + '비트');
      rErr.set(meanErr(S).toFixed(2) + ' °C');
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var codeH = narrow ? 104 : 72;
      return { narrow: narrow, L: narrow ? 40 : 52, R: w - (narrow ? 40 : 52), T: narrow ? 46 : 34, B: h - codeH - 30, codeY: h - codeH + 4, codeH: codeH };
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, P = layout();
      var S = samples(), L = levels(), tNow = state.prog * 24;
      var sx = function (t) { return P.L + (t / 24) * (P.R - P.L); };
      var sy = function (v) { return P.B - ((v - TMIN) / (TMAX - TMIN)) * (P.B - P.T); };
      ctx.clearRect(0, 0, w, h);

      // 양자화 단계 띠와 경계선
      var bandH = (P.B - P.T) / L;
      for (var k = 0; k < L; k++) {
        if (k % 2 === 0) { ctx.fillStyle = T.figPaper; ctx.fillRect(P.L, sy(TMIN + (k + 1) * stepW()), P.R - P.L, bandH); }
      }
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      for (var k2 = 0; k2 <= L; k2++) { var yy = Math.round(sy(TMIN + k2 * stepW())) + 0.5; ctx.beginPath(); ctx.moveTo(P.L, yy); ctx.lineTo(P.R, yy); ctx.stroke(); }
      // 오른쪽: 단계 번호의 부호
      if (bandH >= 11) {
        ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
        for (var k3 = 0; k3 < L; k3++) ctx.fillText(code(k3), P.R + 5, sy(centerOf(k3)) + 4);
      }
      // 왼쪽: 온도 눈금
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      [0, 10, 20, 30, 40].forEach(function (v) { ctx.fillText(v, P.L - 6, sy(v) + 4); });
      ctx.save(); ctx.translate(12, (P.T + P.B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.fillText('기온 (°C)', 0, 0); ctx.restore();
      // 시간 눈금
      ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var hh = 0; hh <= 24; hh += 4) ctx.fillText(hh + '시', sx(hh), P.B + 15);
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(P.L, P.B + 0.5); ctx.lineTo(P.R, P.B + 0.5); ctx.moveTo(P.L + 0.5, P.T); ctx.lineTo(P.L + 0.5, P.B); ctx.stroke();

      // 오차(계단과 곡선 사이) 칠하기
      var n = 480, i, t;
      ctx.beginPath();
      for (i = 0; i <= n; i++) { t = Math.min(tNow, 24 * i / n); var yq = sy(heldAt(S, t)); if (i === 0) ctx.moveTo(sx(t), yq); else ctx.lineTo(sx(t), yq); }
      for (i = n; i >= 0; i--) { t = Math.min(tNow, 24 * i / n); ctx.lineTo(sx(t), sy(temp(t))); }
      ctx.closePath(); ctx.fillStyle = T.figSoftRed; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;

      // 원래 아날로그 신호
      ctx.beginPath();
      for (i = 0; i <= n; i++) { t = 24 * i / n; if (i === 0) ctx.moveTo(sx(t), sy(temp(t))); else ctx.lineTo(sx(t), sy(temp(t))); }
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.2; ctx.stroke();

      // 디지털(계단) 신호
      ctx.beginPath();
      S.forEach(function (s, j) {
        if (s.t > tNow + 1e-9) return;
        var t2 = Math.min(tNow, j + 1 < S.length ? S[j + 1].t : 24);
        if (j === 0) ctx.moveTo(sx(s.t), sy(s.q)); else ctx.lineTo(sx(s.t), sy(s.q));
        ctx.lineTo(sx(t2), sy(s.q));
      });
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.6; ctx.lineJoin = 'miter'; ctx.stroke();

      // 표본점: 원래 값(빈 원) → 양자화 값(채운 점)
      var r = state.rate > 48 ? 2.2 : state.rate > 24 ? 3 : 4.5;
      S.forEach(function (s) {
        if (s.t > tNow + 1e-9) return;
        if (state.rate <= 24) {
          ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx(s.t), P.B); ctx.lineTo(sx(s.t), sy(s.v)); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.beginPath(); ctx.arc(sx(s.t), sy(s.v), r, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
        ctx.beginPath(); ctx.arc(sx(s.t), sy(s.q), r * 0.8, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
      });

      // 읽어 나가는 선
      if (state.prog < 1) {
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx(tNow), P.T - 4); ctx.lineTo(sx(tNow), P.B); ctx.stroke();
      }

      // 범례
      var items = [[T.figBlue, '원래 신호(아날로그)', 'line'], [T.figAmber, '표본(읽은 값)', 'dot'], [T.figRed, '디지털 신호', 'line'], [T.figSoftRed, '오차', 'box']];
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = P.L, ly = 14;
      items.forEach(function (it) {
        var tw = ctx.measureText(it[1]).width + 30;
        if (lx + tw > w - 4) { lx = P.L; ly += 17; }
        if (it[2] === 'line') { ctx.strokeStyle = it[0]; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx + 16, ly - 4); ctx.stroke(); }
        else if (it[2] === 'dot') { ctx.fillStyle = it[0]; ctx.beginPath(); ctx.arc(lx + 8, ly - 4, 4.5, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillStyle = it[0]; ctx.fillRect(lx, ly - 10, 16, 11); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1; ctx.strokeRect(lx + 0.5, ly - 9.5, 15, 10); }
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], lx + 21, ly);
        lx += tw;
      });

      // 소나기 표시(디지털 신호가 놓쳤는지)
      var missed = !S.some(function (s) { return Math.abs(s.t - 14.5) <= 0.75 && s.k < levelOf(base(s.t)); });
      if (state.prog >= 1) {
        var col = missed ? T.figRed : T.figGreen, dipY = sy(temp(14.5)), ly2 = sy(5);
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(sx(14.5), dipY + 5); ctx.lineTo(sx(14.5), ly2 - 12); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        var lab = missed ? '소나기 놓침' : '소나기 기록됨', lw = ctx.measureText(lab).width + 10;
        ctx.fillStyle = T.surface; ctx.fillRect(sx(14.5) - lw / 2, ly2 - 11, lw, 15);
        ctx.fillStyle = col; ctx.fillText(lab, sx(14.5), ly2);
      }

      drawCodes(T, P, S, tNow);
    }

    function drawCodes(T, P, S, tNow) {
      var x0 = P.L - (P.narrow ? 28 : 40), x1 = cv.w - 4, y = P.codeY;
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(x0 + 0.5, y + 0.5, x1 - x0 - 1, P.codeH - 8); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk;
      var shown = S.filter(function (s) { return s.t <= tNow + 1e-9; });
      var total = state.rate * state.bits;
      ctx.fillText('부호화 결과 (' + fmtH(0) + '부터, 총 ' + total + '비트)', x0 + 10, y + 18);
      ctx.font = '13px ' + T.fontMono; ctx.fillStyle = T.figRed;
      var maxLines = P.narrow ? 4 : 2, lineH = 17, cx = x0 + 10, cy = y + 38, line = 1, gap = ctx.measureText(' ').width;
      var limit = x1 - 14;
      for (var i = 0; i < shown.length; i++) {
        var word = code(shown[i].k), ww = ctx.measureText(word).width;
        if (cx + ww > limit) {
          if (line >= maxLines) { ctx.fillStyle = T.figMuted; ctx.fillText('…', cx - gap * 0.5, cy); break; }
          line++; cx = x0 + 10; cy += lineH;
        }
        ctx.fillText(word, cx, cy); cx += ww + gap * 1.4;
      }
    }

    api.onResize(draw);
    update();
  },
});
