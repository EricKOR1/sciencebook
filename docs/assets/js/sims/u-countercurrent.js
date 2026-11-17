/* 일반생명과학 11 역류 증폭: 헨레 고리의 '염 퍼내기'와 '흘려보내기'를 되풀이하면 수질의 삼투 기울기가 쌓인다 */
Sims.register('u-countercurrent', {
  title: '역류 증폭 — 작은 농도 차가 쌓여 1200 mOsm/L이 되기까지',
  caption: '‘다음 단계’를 눌러 ① 상행 지가 염을 퍼내는 단계와 ② 여과액이 한 칸씩 흘러가는 단계를 번갈아 해 보자. 한 높이에서 펌프가 만드는 농도 차는 작지만, U자 고리를 따라 되풀이되면 깊은 수질로 갈수록 간질액이 진해진다. 고리가 길수록 더 진해지고, ADH가 있으면 집합관의 물이 빠져 오줌이 간질액만큼 진해진다. 단순화: 하행 지는 간질액과 바로 평형을 이루고(물만 빠짐), 각 칸의 부피 변화·요소·곧은 혈관은 무시했으며 맨 윗칸(겉질)은 혈액이 300 mOsm/L로 유지한다고 놓았다.',
  init: function (api) {
    var st = { N: 6, G: 180, D: [], A: [], I: [], exit: 300, cycles: 0, next: 'pump', adh: true, last: '' };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.62; }, label: '헨레 고리 하행 지·상행 지·집합관의 칸별 삼투 농도' });
    var ctx = cv.ctx;
    var rC = api.readout('반복');
    var rBot = api.readout('가장 깊은 수질');
    var rExit = api.readout('원위 세뇨관으로');
    var rU = api.readout('오줌');

    api.slider({ id: 'u-countercurrent-n', label: '고리 길이', min: 3, max: 8, step: 1, value: st.N,
      format: function (v) { return v + '칸'; }, onInput: function (v) { st.N = v; reset(); } });
    api.slider({ id: 'u-countercurrent-g', label: '한 높이의 펌프 농도 차', min: 50, max: 200, step: 10, value: st.G,
      format: function (v) { return v + ' mOsm/L'; }, onInput: function (v) { st.G = v; reset(); } });
    var g = api.group();
    var stepBtn = api.button('다음 단계: ① 염 퍼내기', function () { step(); draw(); }, { primary: true, parent: g });
    api.button('10번 반복', function () { for (var i = 0; i < 20; i++) step(); draw(); }, { parent: g });
    var autoBtn = api.button('자동', function () {
      var on = autoBtn.getAttribute('aria-pressed') !== 'true';
      autoBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) loop.play(); else loop.pause();
    }, { toggle: true, parent: g });
    api.button('처음으로', function () { reset(); }, { parent: g });
    var adhBtn = api.button('ADH 분비', function () {
      st.adh = !st.adh; adhBtn.setAttribute('aria-pressed', st.adh ? 'true' : 'false'); draw();
    }, { toggle: true, pressed: true });

    var acc = 0;
    var loop = api.loop(function (dt) {
      acc += dt;
      if (acc > 0.12) { acc = 0; step(); draw(); }
    });
    loop.pause();

    function reset() {
      st.D = []; st.A = []; st.I = [];
      for (var i = 0; i < st.N; i++) { st.D.push(300); st.A.push(300); st.I.push(300); }
      st.exit = 300; st.cycles = 0; st.next = 'pump'; st.last = '';
      draw();
    }
    function step() {
      var D = st.D, A = st.A, G = st.G, n = st.N;
      if (st.next === 'pump') {
        // ① 상행 지가 염을 퍼낸다. 하행 지는 간질액과 평형(물이 빠짐). 맨 윗칸(겉질)은 300으로 유지
        D[0] = 300; if (A[0] > 300 - G) A[0] = 300 - G;
        for (var i = 1; i < n; i++) {
          if (D[i] - A[i] < G) { var t = D[i] + A[i]; D[i] = (t + G) / 2; A[i] = (t - G) / 2; }
        }
        st.exit = A[0];
        st.I = D.slice();
        st.next = 'shift'; st.last = 'pump';
      } else {
        // ② 여과액이 한 칸씩 흘러간다: 새 여과액(300)이 들어오고, 바닥에서 꺾여 상행 지로
        var bottom = D[n - 1];
        for (var j = n - 1; j > 0; j--) D[j] = D[j - 1];
        D[0] = 300;
        for (var k = 0; k < n - 1; k++) A[k] = A[k + 1];
        A[n - 1] = bottom;
        st.next = 'pump'; st.last = 'shift'; st.cycles++;
      }
      stepBtn.textContent = st.next === 'pump' ? '다음 단계: ① 염 퍼내기' : '다음 단계: ② 흘려보내기';
    }
    function cd() {
      // 집합관: ADH가 있으면 각 높이의 간질액과 같아지고, 없으면 원위 세뇨관에서 온 묽은 여과액 그대로
      return st.I.map(function (d) { return st.adh ? d : st.exit; });
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function arrow(x1, y1, x2, y2, col, lw) {
      var a = Math.atan2(y2 - y1, x2 - x1), hl = 7;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hl * 0.7, y2 - Math.sin(a) * hl * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - hl * Math.cos(a - 0.5), y2 - hl * Math.sin(a - 0.5)); ctx.lineTo(x2 - hl * Math.cos(a + 0.5), y2 - hl * Math.sin(a + 0.5)); ctx.closePath(); ctx.fill();
    }
    function shade(T, c) { return Math.max(0, Math.min(1, (c - 100) / 1500)); }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, n = st.N;
      ctx.clearRect(0, 0, w, h);
      var fs = narrow ? 11 : 13;
      var Tp = narrow ? 80 : 74, B = h - (narrow ? 40 : 40);
      var bh = (B - Tp) / n;
      var colW = narrow ? Math.min(62, w * 0.17) : 72;
      var x0 = narrow ? 52 : 84;
      var xD = x0, xI = xD + colW + (narrow ? 4 : 8), iW = narrow ? Math.min(64, w * 0.18) : 80, xA = xI + iW + (narrow ? 4 : 8), xC = xA + colW + (narrow ? 22 : 30);
      var CDv = cd();
      // 간질액 배경(칸마다 진하기)
      for (var i = 0; i < n; i++) {
        var y = Tp + i * bh, cI = st.I[i];
        ctx.fillStyle = T.figSoftAmber; ctx.fillRect(xD - 10, y, xC + colW + 10 - (xD - 10), bh);
        ctx.globalAlpha = shade(T, cI) * 0.9; ctx.fillStyle = T.figAmber; ctx.fillRect(xD - 10, y, xC + colW + 10 - (xD - 10), bh); ctx.globalAlpha = 1;
      }
      // 겉질/수질 경계
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(xD - 10, Tp + bh); ctx.lineTo(xC + colW + 10, Tp + bh); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('겉질', xD - 14, Tp + bh / 2 + 4);
      ctx.fillText('수질', xD - 14, Tp + bh * 1.5 + 4);
      ctx.save(); ctx.translate(xD - 24, (Tp + bh + B) / 2 + 20); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('← 깊을수록', 0, narrow ? -8 : 0); ctx.restore();

      // 세 관의 칸
      function column(x, vals, stroke, title, sub) {
        for (var i = 0; i < n; i++) {
          var y = Tp + i * bh + 3;
          rr(x, y, colW, bh - 6, 6); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = T.figInk; ctx.font = '600 ' + (fs + (narrow ? 0 : 1)) + 'px ' + T.fontMono; ctx.textAlign = 'center';
          ctx.fillText(Math.round(vals[i]), x + colW / 2, y + (bh - 6) / 2 + 5);
        }
        ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(title, x + colW / 2, Tp - (narrow ? 26 : 24));
        ctx.fillStyle = T.figMuted; ctx.font = fs + 'px ' + T.fontBody;
        ctx.fillText(sub, x + colW / 2, Tp - (narrow ? 12 : 8));
      }
      column(xD, st.D, T.figBlue, '하행 지', narrow ? '물만 통과' : '물만 통과');
      column(xA, st.A, T.figRed, '상행 지', narrow ? '염만 퍼냄' : '염만 퍼냄');
      column(xC, CDv, T.figViolet, '집합관', st.adh ? 'ADH 있음' : 'ADH 없음');
      // 간질액 값
      ctx.font = fs + 'px ' + T.fontMono; ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
      for (var k = 0; k < n; k++) ctx.fillText(Math.round(st.I[k]), xI + iW / 2, Tp + k * bh + bh / 2 + 5);
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillText('간질액', xI + iW / 2, Tp - (narrow ? 26 : 24));
      // 고리 바닥 U자
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xD + colW / 2, B - 3); ctx.quadraticCurveTo(xD + colW / 2, B + 22, (xD + xA + colW) / 2, B + 22); ctx.quadraticCurveTo(xA + colW / 2, B + 22, xA + colW / 2, B - 3); ctx.stroke();
      // 흐름 화살표(위)
      // 집합관 아래로 오줌
      arrow(xC + colW / 2, B - 2, xC + colW / 2, B + 22, T.figViolet, 2.5);
      ctx.fillStyle = T.figViolet; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = narrow ? 'right' : 'left';
      ctx.fillText('오줌 ' + Math.round(CDv[n - 1]), xC + colW / 2 + (narrow ? -8 : 8), B + 20);
      // 이번 단계 표시
      if (st.last === 'pump') {
        for (var m = 0; m < n; m++) {
          var yy = Tp + m * bh + bh / 2;
          arrow(xA - 2, yy + 8, xI + iW - 6, yy + 8, T.figAmber, 2);
          if (m > 0) arrow(xD + colW + 2, yy - 10, xI + 10, yy - 10, T.figBlue, 1.5);
        }
      }
      // 상단 설명
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
      var msg = st.last === 'pump' ? '방금: ① 상행 지가 염을 퍼냄(주황), 하행 지에서 물이 빠짐(파랑)' : st.last === 'shift' ? '방금: ② 여과액이 한 칸씩 흘러감(위에서 300이 새로 들어옴)' : '처음: 모든 칸이 300 mOsm/L';
      if (narrow) {
        var parts = msg.split(', ');
        ctx.fillText(parts[0], 8, 16); if (parts[1]) ctx.fillText(parts[1], 8, 16 + fs + 4);
      } else ctx.fillText(msg, 8, 18);
      // 오른쪽 설명(넓은 화면)
      if (!narrow) {
        var rx = xC + colW + 24, ry = Tp + 12;
        ctx.font = '12px ' + T.fontBody;
        var lines = ['숫자: 삼투 농도(mOsm/L)', '배경이 진할수록 진한 간질액', '', '충분히 되풀이하면', '가장 깊은 곳 ≈', '300 + (칸 수 − 1) × 펌프 차', '= ' + (300 + (n - 1) * st.G) + ' mOsm/L'];
        lines.forEach(function (t, i) { ctx.fillStyle = i >= 3 ? T.figInk : T.figMuted; ctx.fillText(t, rx, ry + i * 19); });
      }
      rC.set(st.cycles + '회');
      rBot.set(Math.round(st.D[n - 1]) + ' mOsm/L');
      rExit.set(Math.round(st.exit) + ' mOsm/L');
      rU.set(Math.round(CDv[n - 1]) + ' mOsm/L');
    }
    api.onResize(draw);
    reset();
  },
});
