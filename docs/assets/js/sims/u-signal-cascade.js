/* 일반생명과학 4 세포 신호 전달: 신호 증폭 연쇄 — 단계 수·단계별 증폭 배수·종료 속도가 반응의 크기와 시간을 정한다 */
Sims.register('u-signal-cascade', {
  title: '신호 증폭 연쇄 — 몇 단계, 몇 배, 얼마나 빨리 꺼지나',
  caption: '수용체 하나가 정해진 시간 동안 켜졌다가 꺼질 때, 각 단계의 활성 분자 수가 어떻게 변하는지 로그 눈금으로 보여 준다. 단계 수와 단계별 증폭 배수를 바꾸면 전체 증폭률이 곱(로그로는 합)으로 달라지고, 반감기를 바꾸면 증폭률은 같아도 반응이 오르내리는 속도가 달라진다. 반감기가 길면 짧은 자극으로는 최대 증폭에 이르지 못하고, 자극이 끝난 뒤에도 신호가 오래 남는다. 단계마다 "한 분자가 꺼지기 전까지 다음 분자를 평균 몇 개 켜는가"를 증폭 배수로, 모든 단계의 반감기를 같다고 단순화했으며, 기질 고갈과 되먹임은 무시했다.',
  init: function (api) {
    var TMAX = 60, LMIN = -1, LMAX = 12;
    var s = { n: 4, a: 10, th: 2, D: 5 };
    var res = null;

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.62; }, label: '연쇄 반응의 단계별 활성 분자 수를 시간에 따라 로그 눈금으로 나타낸 그래프' });
    var ctx = cv.ctx;

    var rAmp = api.readout('전체 증폭률(오래 켜 둘 때)');
    var rPeak = api.readout('마지막 단계 최댓값');
    var rRise = api.readout('최댓값의 절반까지');
    var rFall = api.readout('자극 뒤 1/10로 줄기까지');

    api.slider({ id: 'u-signal-cascade-n', label: '단계 수', min: 1, max: 6, step: 1, value: s.n,
      format: function (v) { return v + '단계'; }, onInput: function (v) { s.n = v; update(); } });
    api.slider({ id: 'u-signal-cascade-a', label: '단계별 증폭 배수', min: 0, max: 2, step: 0.01, value: 1,
      format: function (v) { return '×' + fmtSmall(Math.pow(10, v)); }, onInput: function (v) { s.a = Math.pow(10, v); update(); } });
    api.slider({ id: 'u-signal-cascade-th', label: '활성 분자의 반감기(종료 속도)', min: Math.log10(0.2), max: Math.log10(20), step: 0.01, value: Math.log10(2),
      format: function (v) { return fmtSmall(Math.pow(10, v)) + ' s'; }, onInput: function (v) { s.th = Math.pow(10, v); update(); } });
    api.slider({ id: 'u-signal-cascade-d', label: '수용체가 켜져 있는 시간', min: 1, max: 40, step: 1, value: s.D,
      format: function (v) { return v + ' s'; }, onInput: function (v) { s.D = v; update(); } });

    function fmtSmall(v) { return v < 10 ? v.toFixed(1) : v.toFixed(0); }
    var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    function sup(k) { return String(k).split('').map(function (c) { return c === '-' ? '⁻' : SUP[+c]; }).join(''); }
    function fmtBig(x) {
      if (x < 1000) return x < 10 ? x.toFixed(1) : x.toFixed(0);
      var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
      return m.toFixed(1) + '×10' + sup(e);
    }

    // 각 단계: dx_i/dt = k·a·x_(i-1) − k·x_i,  k = ln2 / 반감기  → 오래 켜 두면 x_i = a^i
    function simulate() {
      var k = Math.LN2 / s.th, dt = Math.min(0.01, 0.1 / k), x = [], out = [], t = 0, nextS = 0, i;
      for (i = 0; i <= s.n; i++) x.push(0);
      var steps = Math.ceil(TMAX / dt);
      for (var st = 0; st <= steps; st++) {
        t = st * dt;
        if (t >= nextS - 1e-9) { out.push({ t: t, x: x.slice() }); nextS += 0.1; }
        x[0] = t < s.D ? 1 : 0;
        // 반 단계 정확 적분(지수 감쇠)으로 안정하게
        var e = Math.exp(-k * dt);
        for (i = s.n; i >= 1; i--) x[i] = x[i] * e + s.a * x[i - 1] * (1 - e);
      }
      var fin = out.map(function (p) { return p.x[s.n]; });
      var peak = 0, tp = 0;
      fin.forEach(function (v, j) { if (v > peak) { peak = v; tp = out[j].t; } });
      var tHalf = null, tTen = null;
      for (var j = 0; j < out.length; j++) { if (fin[j] >= peak / 2) { tHalf = out[j].t; break; } }
      for (j = 0; j < out.length; j++) { if (out[j].t > tp && fin[j] <= peak / 10) { tTen = out[j].t - s.D; break; } }
      var peaks = [];
      for (i = 0; i <= s.n; i++) peaks.push(Math.max.apply(null, out.map(function (p) { return p.x[i]; })));
      return { out: out, peak: peak, tHalf: tHalf, tTen: tTen, peaks: peaks };
    }

    function update() {
      res = simulate();
      var amp = Math.pow(s.a, s.n);
      rAmp.set(fmtBig(amp) + '배');
      rPeak.set(fmtBig(res.peak) + ' (' + (100 * res.peak / amp).toFixed(0) + '%)');
      rRise.set(res.tHalf == null ? '–' : res.tHalf.toFixed(1) + ' s');
      rFall.set(res.tTen == null ? TMAX - s.D + ' s 넘음' : res.tTen.toFixed(1) + ' s');
      draw();
    }

    function colors(T) { return [T.figMuted, T.figBlue, T.figTeal, T.figGreen, T.figAmber, T.figViolet, T.figRed]; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var COL = colors(T);
      // ── 위: 연쇄 사슬
      var chainH = narrow ? 112 : 70, nBox = s.n + 1;
      var perRow = narrow ? Math.min(nBox, 4) : nBox, rows = Math.ceil(nBox / perRow);
      var bw = Math.min(118, (w - 16 - (perRow - 1) * 20) / perRow), bh = 42;
      for (var i = 0; i < nBox; i++) {
        var r = Math.floor(i / perRow), c = i % perRow;
        var x = 8 + c * (bw + 20), y = 6 + r * (bh + 14);
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = COL[i]; ctx.lineWidth = i === s.n ? 3 : 2;
        rr(x, y, bw, bh, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText(i === 0 ? '수용체' : (i === s.n ? i + '단계(반응)' : i + '단계'), x + bw / 2, y + 17);
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
        ctx.fillText('최대 ' + fmtBig(res.peaks[i]), x + bw / 2, y + 34);
        if (c < perRow - 1 && i < nBox - 1) arrow(x + bw + 3, y + bh / 2, x + bw + 17, y + bh / 2, T.figInk);
      }
      // ── 아래: 그래프
      var top = chainH + 22, L = 50, R = w - 14, B = h - 40;
      var sx = function (t) { return L + t / TMAX * (R - L); };
      var sy = function (v) { var lv = v <= 0 ? LMIN : Math.max(LMIN, Math.log10(v)); return B - (lv - LMIN) / (LMAX - LMIN) * (B - top); };
      // 자극 구간
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(sx(0), top, sx(s.D) - sx(0), B - top);
      ctx.fillStyle = T.figAmber; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('수용체 켜짐', sx(0) + 4, top + 14);
      // 격자
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var e = 0; e <= LMAX; e += (narrow ? 4 : 2)) {
        ctx.beginPath(); ctx.moveTo(L, sy(Math.pow(10, e))); ctx.lineTo(R, sy(Math.pow(10, e))); ctx.stroke();
        ctx.fillText('10' + sup(e), L - 6, sy(Math.pow(10, e)) + 4);
      }
      ctx.textAlign = 'center';
      for (var t = 0; t <= TMAX; t += 10) ctx.fillText(t, sx(t), B + 15);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('시간 (s)', (L + R) / 2, B + 31);
      ctx.save(); ctx.translate(13, (top + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('활성 분자 수(로그 눈금)', 0, 0); ctx.restore();
      // 정상 상태 증폭률 점선
      var amp = Math.pow(s.a, s.n);
      if (Math.log10(amp) <= LMAX) {
        ctx.setLineDash([5, 4]); ctx.strokeStyle = COL[s.n]; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(L, sy(amp)); ctx.lineTo(R, sy(amp)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COL[s.n]; ctx.textAlign = 'right'; ctx.font = '12px ' + T.fontBody;
        ctx.fillText('aⁿ = ' + fmtBig(amp) + ' (오래 켜 둘 때)', R - 4, sy(amp) - 5);
      }
      // 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(L, top, R - L, B - top); ctx.clip();
      for (i = 0; i <= s.n; i++) {
        ctx.strokeStyle = COL[i]; ctx.lineWidth = i === s.n ? 3 : 1.6;
        ctx.beginPath();
        res.out.forEach(function (p, j) { var X = sx(p.t), Y = sy(p.x[i]); if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, top, R - L, B - top);
    }
    function arrow(x1, y1, x2, y2, c) {
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - 5, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 7, y2 - 4); ctx.lineTo(x2 - 7, y2 + 4); ctx.closePath(); ctx.fill();
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw);
    update();
  },
});
