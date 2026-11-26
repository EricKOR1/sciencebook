/* 유기화학 10: 이민 생성의 pH–속도 탐색기 — 자유 아민 분율 f(pH)와 [H⁺]의 줄다리기, 겉보기 속도 v = 1/(1/(A·f) + 1/(B·[H⁺])) */
Sims.register('mj-imine-ph-rate', {
  title: '이민 생성의 pH–속도 탐색기',
  caption: 'pH 슬라이더를 움직이며 위 창의 두 직선(자유 아민 분율 f와 [H⁺], 로그 눈금)과 아래 창의 겉보기 속도를 비교해 보자. 첨가 속도 A·f는 pH가 낮을수록, 탈수 속도 B·[H⁺]는 pH가 높을수록 작아지므로 둘 가운데 느린 쪽이 속도 결정 단계가 되고, 두 속도가 같아지는 pH* = ½(pKaH + log(B/A))에서 겉보기 속도가 가장 크다. 아민의 pKaH나 log(B/A)를 바꾸면 꼭대기가 그 변화의 절반만큼 옮겨 간다. 두 단계 직렬 모형(1/v = 1/v첨가 + 1/v탈수), 묽은 수용액, 활동도 = 농도를 가정했고 일반 산 촉매·카비놀아민 평형은 무시했다. 용기 그림의 분자 40개는 분율을 나타내는 모식도이다.',
  init: function (api) {
    var st = { pH: 4.5, pKa: 9.0, lba: 0 };
    var PRE = [{ n: '예제 10 (9.0)', v: 9.0 }, { n: '하이드록실아민 (6.0)', v: 6.0 }, { n: '메틸아민 (10.6)', v: 10.6 }];
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.6; }, label: '이민 생성 속도의 pH 의존 그래프와 반응 용기 모식도' });
    var ctx = cv.ctx;
    var rA = api.readout('이 pH에서  '), rB = api.readout('꼭대기  ');
    var sp = api.slider({ id: 'mj-imine-ph-rate-ph', label: 'pH', min: 0, max: 12, step: 0.05, value: st.pH,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.pH = v; draw(); } });
    var sk = api.slider({ id: 'mj-imine-ph-rate-pka', label: '아민의 pKaH', min: 4, max: 11, step: 0.1, value: st.pKa,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.pKa = v; sync(); draw(); } });
    api.slider({ id: 'mj-imine-ph-rate-lba', label: 'log(B/A)', min: -3, max: 3, step: 0.1, value: st.lba,
      format: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1); }, onInput: function (v) { st.lba = v; draw(); } });
    var g = api.group();
    var bs = PRE.map(function (p) {
      return api.button(p.n, function () {
        sk.set(p.v);
      }, { toggle: true, pressed: p.v === st.pKa, parent: g });
    });
    function sync() { bs.forEach(function (b, k) { b.setAttribute('aria-pressed', String(Math.abs(PRE[k].v - st.pKa) < 1e-9)); }); }
    function f(pH) { return 1 / (1 + Math.pow(10, st.pKa - pH)); }
    function hh(pH) { return Math.pow(10, -pH); }
    function v(pH) { var a = f(pH), b = Math.pow(10, st.lba) * hh(pH); return 1 / (1 / a + 1 / b); }
    function lg(x) { return Math.log(x) / Math.LN10; }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var L = narrow ? 46 : 58, R = narrow ? w - 14 : w * 0.68, top1 = 26, gap = narrow ? 50 : 48;
      var plotH = narrow ? h * 0.30 : (h - top1 - gap - 40) / 2;
      var b1 = top1 + plotH, top2 = b1 + gap, b2 = top2 + plotH;
      var X = function (p) { return L + p / 12 * (R - L); };
      var Y1 = function (q) { return top1 + (0 - q) / 12 * plotH; };          // log 값 0 ~ −12
      var vmax = 0, pbest = 0;
      for (var i = 0; i <= 2400; i++) { var pp = 12 * i / 2400, vv = v(pp); if (vv > vmax) { vmax = vv; pbest = pp; } }
      var Y2 = function (q) { return top2 + (0.5 - q) / 6.5 * plotH; };      // +0.5 ~ −6
      function axes(top, bot, ticks, Yf, lab) {
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
        for (var p = 0; p <= 12; p += 2) { ctx.beginPath(); ctx.moveTo(X(p), top); ctx.lineTo(X(p), bot); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(p), X(p), bot + 13); }
        ticks.forEach(function (q) { ctx.beginPath(); ctx.moveTo(L, Yf(q)); ctx.lineTo(R, Yf(q)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(q > 0 ? '+' + q : String(q).replace('-', '−'), L - 4, Yf(q) + 4); });
        ctx.strokeStyle = T.figLine; ctx.strokeRect(L, top, R - L, bot - top);
        ctx.save(); ctx.translate(12, (top + bot) / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(lab, 0, 0); ctx.restore();
      }
      axes(top1, b1, [0, -3, -6, -9, -12], Y1, 'log 값');
      axes(top2, b2, [0, -2, -4, -6], Y2, 'log(v/v최대)');
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('pH', (L + R) / 2, b2 + 28);
      function curve(fn, Yf, top, bot, color, wdt, dash) {
        ctx.save(); ctx.beginPath(); ctx.rect(L, top, R - L, bot - top); ctx.clip();
        ctx.strokeStyle = color; ctx.lineWidth = wdt; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var i = 0; i <= 480; i++) { var pp = 12 * i / 480, yy = Yf(fn(pp)); if (i) ctx.lineTo(X(pp), yy); else ctx.moveTo(X(pp), yy); }
        ctx.stroke(); ctx.restore();
      }
      curve(function (p) { return lg(f(p)); }, Y1, top1, b1, T.figBlue, 2.5);
      curve(function (p) { return -p; }, Y1, top1, b1, T.figRed, 2.5);
      ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('자유 아민 분율 f', L + 6, b1 - 8);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'right'; ctx.fillText('[H⁺]', R - 6, b1 - 8);
      // 아래 창: 두 단계 속도(점선)와 겉보기 속도
      curve(function (p) { return lg(f(p) / vmax); }, Y2, top2, b2, T.figMuted, 1.4, [5, 4]);
      curve(function (p) { return lg(Math.pow(10, st.lba) * hh(p) / vmax); }, Y2, top2, b2, T.figMuted, 1.4, [5, 4]);
      curve(function (p) { return lg(v(p) / vmax); }, Y2, top2, b2, T.figAccent, 3);
      var pst = (st.pKa + st.lba) / 2;
      if (pst >= 0 && pst <= 12) {
        ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X(pst), top2); ctx.lineTo(X(pst), b2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figGreen; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = X(pst) > (L + R) / 2 ? 'right' : 'left';
        ctx.fillText('pH* = ' + pst.toFixed(2), X(pst) + (X(pst) > (L + R) / 2 ? -5 : 5), top2 + 14);
      }
      // 현재 pH
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      [[top1, b1], [top2, b2]].forEach(function (r) { ctx.beginPath(); ctx.moveTo(X(st.pH), r[0]); ctx.lineTo(X(st.pH), r[1]); ctx.stroke(); });
      ctx.setLineDash([]);
      function dot(x, y, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7); ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke(); }
      if (Y1(lg(f(st.pH))) <= b1) dot(X(st.pH), Y1(lg(f(st.pH))), T.figBlue);
      dot(X(st.pH), Y1(-st.pH), T.figRed);
      var lv = lg(v(st.pH) / vmax);
      if (Y2(lv) <= b2) dot(X(st.pH), Y2(lv), T.figAccent);
      // 속도 결정 단계 표시등과 반응 용기
      var addSlow = f(st.pH) < Math.pow(10, st.lba) * hh(st.pH);
      var bx, by, bw, bh;
      if (narrow) { bx = L; by = b2 + 42; bw = R - L; bh = h - by - 8; } else { bx = R + 26; by = top1; bw = w - bx - 10; bh = b2 - top1; }
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText('속도 결정 단계', bx, by + 12);
      var lamps = [['첨가(아민 부족)', addSlow], ['탈수(산 부족)', !addSlow]];
      lamps.forEach(function (lp, k) {
        var ly = by + 32 + k * 22;
        ctx.beginPath(); ctx.arc(bx + 8, ly - 4, 7, 0, 7);
        ctx.fillStyle = lp[1] ? T.figAmber : T.figPanel; ctx.fill(); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = lp[1] ? T.figInk : T.figMuted; ctx.font = (lp[1] ? '600 ' : '') + '12px ' + T.fontBody; ctx.fillText(lp[0], bx + 22, ly);
      });
      // 용기
      var vy = by + 82, vh = bh - 100, vw = Math.min(bw - 4, narrow ? 260 : bw - 4);
      if (vh > 60) {
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(bx, vy); ctx.lineTo(bx, vy + vh); ctx.lineTo(bx + vw, vy + vh); ctx.lineTo(bx + vw, vy); ctx.stroke();
        ctx.fillStyle = T.figSoftBlue; ctx.globalAlpha = 0.35; ctx.fillRect(bx + 1, vy + 14, vw - 2, vh - 15); ctx.globalAlpha = 1;
        var n = 40, nf = Math.round(n * f(st.pH)), cols = 8, rows = 5;
        for (var k = 0; k < n; k++) {
          var cx = bx + vw * (0.5 + (k % cols)) / cols, cy = vy + 24 + (vh - 34) * (0.5 + Math.floor(k / cols)) / rows;
          var free = k < nf;
          ctx.beginPath(); ctx.arc(cx, cy, Math.min(8, vw / cols / 2.6), 0, 7);
          ctx.fillStyle = free ? T.figBlue : T.figMuted; ctx.globalAlpha = free ? 1 : 0.45; ctx.fill(); ctx.globalAlpha = 1;
        }
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        ctx.fillText('파랑: RNH₂ (자유)  회색: RNH₃⁺', bx, vy + vh + 14);
      }
      function pct(x) { x *= 100; return x >= 99.95 ? '> 99.9 %' : x < 0.001 ? x.toExponential(1).replace('-', '−') + ' %' : (x >= 1 ? x.toFixed(1) : x.toPrecision(2)) + ' %'; }
      rA.set('자유 아민 ' + pct(f(st.pH)) + ' · [H⁺] = 10^' + (-st.pH).toFixed(2).replace('-', '−') + ' M · v/v최대 = ' + pct(v(st.pH) / vmax).replace(' %', '') + ' % · 속도 결정: ' + (addSlow ? '첨가' : '탈수'));
      rB.set('pH* = ½(pKaH + log(B/A)) = ' + pst.toFixed(2) + (pst < 0 || pst > 12 ? ' (그래프 범위 밖)' : '') + ' · 계산된 최대 pH ' + pbest.toFixed(2));
    }
    api.onResize(draw);
    draw();
  },
});
