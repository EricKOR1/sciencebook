/* 일반지구과학 5 지질 시대와 지구의 역사: 46억 년을 1년 달력으로 줄여 보기(점점 확대하는 네 개의 띠) */
Sims.register('u-earth-timeline', {
  title: '46억 년을 1년으로 — 지구 역사 달력',
  caption: '슬라이더로 "몇 년 전"을 고르거나 이전·다음 사건 버튼을 눌러 보자. 맨 위 띠는 1년 전체, 그 아래는 차례로 11월 중순~12월 31일, 12월 31일 하루, 그날 밤 11시 이후를 확대한 것이다. 고른 시기가 달력의 어느 날 몇 시인지와 가까운 사건이 함께 표시된다. 46억 년을 365일로 나누어 하루가 약 1260만 년이고, 사건의 연대는 본문에 실린 어림값이다.',
  init: function (api) {
    var AGE = 4600e6, DAY = AGE / 365;
    var EV = [
      [4600e6, '지구 형성'], [4400e6, '가장 오래된 광물(지르콘)'], [4000e6, '가장 오래된 암석 · 시생누대'], [3500e6, '스트로마톨라이트(생명의 흔적)'],
      [2500e6, '원생누대 시작'], [2400e6, '대산화 사건'], [1800e6, '진핵생물'], [720e6, '눈덩이 지구'], [575e6, '에디아카라 생물군'],
      [539e6, '캄브리아기 · 현생누대'], [445e6, '오르도비스기 말 대량 멸종'], [375e6, '사지동물이 육지로'], [300e6, '판게아 형성'],
      [252e6, '페름기 말 대량 멸종'], [230e6, '공룡 출현'], [150e6, '시조새'], [66e6, '백악기 말 대량 멸종'], [34e6, '남극 빙상 형성'],
      [7e6, '사람과 침팬지 계통 분기'], [2.58e6, '제4기 시작'], [0.3e6, '현생 인류'], [2e4, '최종 빙기 최성기'], [1.17e4, '홀로세(현재 간빙기)'],
    ];
    var MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var state = { ago: 2400e6, idx: 5 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.62; }, label: '지구 역사를 1년 달력으로 줄인 네 단계 확대 띠' });
    var ctx = cv.ctx;
    var rA = api.readout('실제 시기');
    var rC = api.readout('지구 달력');
    var rE = api.readout('가까운 사건');
    var sl = api.slider({ id: 'u-earth-timeline-t', label: '몇 년 전', min: 4, max: Math.log10(AGE), step: 0.005, value: Math.log10(state.ago),
      format: function (v) { return fmtAgo(Math.pow(10, v)); }, onInput: function (v) { state.ago = Math.pow(10, v); state.idx = nearest(); update(); } });
    var g = api.group();
    api.button('◀ 이전 사건', function () { go(-1); }, { parent: g });
    api.button('다음 사건 ▶', function () { go(1); }, { parent: g });
    function go(d) { var i = Math.max(0, Math.min(EV.length - 1, state.idx + d)); sl.set(Math.log10(EV[i][0])); state.idx = i; state.ago = EV[i][0]; update(); }
    function nearest() { var b = 0, bd = 1e9; EV.forEach(function (e, i) { var d = Math.abs(Math.log10(e[0]) - Math.log10(state.ago)); if (d < bd) { bd = d; b = i; } }); return b; }
    function fmtAgo(y) {
      if (y >= 1e8) return (+(y / 1e8).toPrecision(3)) + '억 년 전';
      if (y >= 1e4) return (+(y / 1e4).toPrecision(3)).toLocaleString('ko-KR') + '만 년 전';
      return Math.round(y).toLocaleString('ko-KR') + '년 전';
    }
    // 연초부터 지난 시간(일)
    function dayOf(ago) { return (AGE - ago) / DAY; }
    function fmtCal(ago) {
      var d = dayOf(ago), di = Math.floor(d), m = 0;
      while (m < 11 && di >= MD[m]) { di -= MD[m]; m++; }
      var frac = d - Math.floor(d), sec = Math.round(frac * 86400);
      if (sec >= 86400) sec = 86399;
      var h = Math.floor(sec / 3600), mi = Math.floor(sec % 3600 / 60), s = sec % 60;
      return (m + 1) + '월 ' + (di + 1) + '일 ' + h + '시 ' + pad(mi) + '분' + (ago < 2e6 ? ' ' + pad(s) + '초' : '');
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    // 네 띠: [시작일, 끝일, 제목, 눈금 함수]
    var BANDS = [
      { a: 0, b: 365, name: '1년 전체' },
      { a: 318, b: 365, name: '11월 15일 ~ 12월 31일' },
      { a: 364, b: 365, name: '12월 31일 하루' },
      { a: 364 + 23 / 24, b: 365, name: '12월 31일 밤 11시 이후' },
    ];
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, L = 14, R = w - 14;
      ctx.clearRect(0, 0, w, h);
      var bh = Math.min(26, h * 0.06), gap = (h - 20) / 4;
      var cur = dayOf(state.ago);
      BANDS.forEach(function (B, k) {
        var y = 26 + k * gap, sx = function (d) { return L + (d - B.a) / (B.b - B.a) * (R - L); };
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(B.name, L, y - 8);
        // 누대·대 색
        var spans = [[4600e6, 4000e6, T.figSoftViolet], [4000e6, 2500e6, T.figSoftRed], [2500e6, 539e6, T.figSoftAmber], [539e6, 252e6, T.figSoftBlue], [252e6, 66e6, T.figSoftTeal], [66e6, 0, T.figSoftGreen]];
        spans.forEach(function (s) {
          var d0 = Math.max(B.a, dayOf(s[0])), d1 = Math.min(B.b, dayOf(s[1]));
          if (d1 <= d0) return;
          ctx.fillStyle = s[2]; ctx.fillRect(sx(d0), y, sx(d1) - sx(d0), bh);
        });
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, y, R - L, bh);
        // 눈금
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        if (k === 0) { var acc = 0; for (var m = 0; m < 12; m++) { var x = sx(acc); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); if (w >= 560 || m % 2 === 0) ctx.fillText((m + 1) + '월', sx(acc + MD[m] / 2), y + bh + 13); acc += MD[m]; } }
        if (k === 1) { [[318, '11/15'], [334, '12/1'], [344, '12/11'], [354, '12/21'], [364, '12/31']].forEach(function (t) { var x = sx(t[0]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); ctx.fillText(t[1], x, y + bh + 13); }); }
        if (k === 2) { for (var hh = 0; hh <= 24; hh += (w < 560 ? 6 : 3)) { var x2 = sx(364 + hh / 24); ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2, y + bh); ctx.stroke(); ctx.fillText(hh + '시', Math.min(x2, R - 10), y + bh + 13); } }
        if (k === 3) { for (var mm = 0; mm <= 60; mm += (w < 560 ? 15 : 10)) { var x3 = sx(364 + 23 / 24 + mm / 1440); ctx.beginPath(); ctx.moveTo(x3, y); ctx.lineTo(x3, y + bh); ctx.stroke(); ctx.fillText(mm === 60 ? '자정' : '23:' + pad(mm), Math.min(x3, R - 12), y + bh + 13); } }
        // 사건 점
        EV.forEach(function (e, i) {
          var d = dayOf(e[0]); if (d < B.a || d > B.b) return;
          ctx.beginPath(); ctx.arc(sx(d), y + bh / 2, i === state.idx ? 5 : 3, 0, Math.PI * 2);
          ctx.fillStyle = /멸종/.test(e[1]) ? T.figRed : T.figInk; ctx.fill();
        });
        // 확대 연결선
        if (k < 3) {
          var nb = BANDS[k + 1], ny = 26 + (k + 1) * gap;
          ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figLine;
          ctx.beginPath(); ctx.moveTo(sx(nb.a), y + bh); ctx.lineTo(L, ny - 22); ctx.moveTo(sx(nb.b), y + bh); ctx.lineTo(R, ny - 22); ctx.stroke(); ctx.setLineDash([]);
        }
        // 커서
        if (cur >= B.a && cur <= B.b) {
          var cx = sx(cur);
          ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, y - 4); ctx.lineTo(cx, y + bh + 4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, y - 3); ctx.lineTo(cx - 5, y - 10); ctx.lineTo(cx + 5, y - 10); ctx.closePath(); ctx.fillStyle = T.figAccent; ctx.fill();
          var lab = EV[state.idx][1];
          ctx.font = '600 12px ' + T.fontBody; var tw = ctx.measureText(lab).width;
          ctx.textAlign = 'left'; ctx.fillStyle = T.figAccent;
          var lx = Math.max(L + ctx.measureText(B.name).width + 16, Math.min(R - tw, cx - tw / 2));
          if (Math.abs(Math.log10(EV[state.idx][0]) - Math.log10(state.ago)) < 0.05) ctx.fillText(lab, lx, y - 8);
        }
      });
    }
    function update() {
      rA.set(fmtAgo(state.ago));
      rC.set(fmtCal(state.ago));
      var e = EV[state.idx];
      rE.set(e[1] + ' (' + fmtAgo(e[0]) + ' → ' + fmtCal(e[0]) + ')');
      draw();
    }
    api.onResize(draw);
    update();
  },
});
