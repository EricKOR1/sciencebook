/* 물리화학 6: 디바이–휘켈 이온 분위기(가려 막는 반대 전하의 분포)와 평균 활동도 계수 */
Sims.register('mj-debye-huckel', {
  title: '디바이–휘켈 이온 분위기와 평균 활동도 계수',
  caption: '이온 세기 I, 전하형 |z₊z₋|, 이온 크기 매개변수 a를 바꾸어 보자. 왼쪽 그래프는 중심 이온에서 거리 r 안에 들어 있는 이온 분위기의 반대 전하(중심 이온 전하에 대한 비)로, 그 전하가 디바이 길이 1/κ = 0.304 nm/√I 근처에 몰려 있다. I를 키우면 1/κ가 줄어 분위기가 중심 쪽으로 조여들고, 오른쪽 log γ±–√I 그래프에서 γ±가 작아진다. 점선은 점전하의 극한 법칙 log γ± = −0.509|z₊z₋|√I, 실선은 반지름 a 안에 다른 이온이 들어오지 못한다고 본 확장 식 log γ± = −0.509|z₊z₋|√I/(1 + Ba√I)(B = 3.28 nm⁻¹)이다. 25 ℃ 물, 선형화한 푸아송–볼츠만 식을 썼으므로 I가 크거나 전하가 큰 이온에서는 실제와 어긋난다.',
  init: function (api) {
    var A = 0.509, Bc = 3.28;     // 25 ℃ 물, B 는 nm⁻¹
    var st = { lgI: -2, z: 1, a: 0.3 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.55; }, label: '이온 분위기 전하의 누적 분포와 log 감마–루트 I 그래프' });
    var ctx = cv.ctx;
    var rI = api.readout('이온 세기 I'), rL = api.readout('디바이 길이 1/κ'), rKa = api.readout('κa'),
      rG0 = api.readout('γ± (극한 법칙)'), rG1 = api.readout('γ± (확장 식)');
    api.slider({ id: 'mj-debye-huckel-i', label: '이온 세기 I (로그)', min: -4, max: Math.log10(0.5), step: 0.01, value: st.lgI,
      format: function (v) { return Ifmt(Math.pow(10, v)); }, onInput: function (v) { st.lgI = v; draw(); } });
    var g = api.group();
    var zb = [1, 2, 4].map(function (z) {
      var lab = z === 1 ? '|z₊z₋| = 1 (NaCl)' : z === 2 ? '2 (CaCl₂)' : '4 (ZnSO₄)';
      return api.button(lab, function () { st.z = z; zb.forEach(function (b, k) { b.setAttribute('aria-pressed', String([1, 2, 4][k] === z)); }); draw(); }, { toggle: true, pressed: z === 1, parent: g });
    });
    api.slider({ id: 'mj-debye-huckel-a', label: '이온 크기 a', min: 0, max: 0.6, step: 0.01, value: st.a,
      format: function (v) { return v.toFixed(2) + ' nm'; }, onInput: function (v) { st.a = v; draw(); } });

    function Ifmt(I) {
      if (I >= 0.01) return I.toFixed(I >= 0.1 ? 2 : 3);
      var e = Math.floor(Math.log10(I) + 1e-9), m = I / Math.pow(10, e);
      return m.toFixed(1) + '×10' + ({ '-4': '⁻⁴', '-3': '⁻³', '-2': '⁻²' })[e];
    }
    function mfmt(v, d) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); }
    function logGlim(sI) { return -A * st.z * sI; }
    function logGext(sI) { return -A * st.z * sI / (1 + Bc * st.a * sI); }
    // r 안의 반대 전하 비율(선형화 해, 반지름 a 안은 비어 있음)
    function tag(T, text, x, y, color) {
      var tw = ctx.measureText(text).width;
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85; ctx.fillRect(x - 3, y - 11, tw + 6, 15); ctx.globalAlpha = 1;
      ctx.fillStyle = color; ctx.fillText(text, x, y);
    }
    function Q(r, kap, a) { if (r <= a) return 0; return 1 - (1 + kap * r) * Math.exp(-kap * (r - a)) / (1 + kap * a); }

    function panelQ(T, x0, y0, w, h) {
      var L = x0 + 46, Rr = x0 + w - 12, Tp = y0 + 30, B = y0 + h - 40;
      var I = Math.pow(10, st.lgI), kap = Math.sqrt(I) / 0.304, Ld = 1 / kap, a = st.a;
      var lx = function (r) { return L + (Math.log10(r) + 1) / 3 * (Rr - L); };   // 0.1 ~ 100 nm
      var ly = function (q) { return B - q * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('r 안에 든 이온 분위기의 반대 전하', x0 + 8, y0 + 18);
      // 격자
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [0.1, 1, 10, 100].forEach(function (r) {
        ctx.beginPath(); ctx.moveTo(lx(r), Tp); ctx.lineTo(lx(r), B); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(String(r), lx(r), B + 15);
      });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (q) {
        ctx.beginPath(); ctx.moveTo(L, ly(q)); ctx.lineTo(Rr, ly(q)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(q.toFixed(2).replace(/0$/, ''), L - 5, ly(q) + 4);
      });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('r / nm (로그 눈금)', (L + Rr) / 2, B + 32);
      ctx.save(); ctx.translate(x0 + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('중심 전하에 대한 비', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      // 이온이 못 들어오는 영역
      if (a > 0.1) { ctx.fillStyle = T.figSoftAmber; ctx.fillRect(L, Tp, lx(a) - L, B - Tp); }
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      function curve(aa, color, width, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
        for (var k = 0; k <= 240; k++) { var r = Math.pow(10, -1 + 3 * k / 240), yy = ly(Q(r, kap, aa)); if (k) ctx.lineTo(lx(r), yy); else ctx.moveTo(lx(r), yy); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      curve(0, T.figMuted, 2, [6, 4]);
      curve(a, T.figViolet, 3, []);
      // 디바이 길이
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(lx(Ld), Tp); ctx.lineTo(lx(Ld), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody;
      var tx = lx(Ld), right = tx < (L + Rr) / 2;
      ctx.textAlign = right ? 'left' : 'right';
      ctx.fillText('1/κ = ' + (Ld >= 10 ? Ld.toFixed(0) : Ld.toFixed(Ld >= 1 ? 1 : 2)) + ' nm', tx + (right ? 5 : -5), Tp + 16);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      tag(T, '실선: 이온 크기 a 고려', L + 6, B - 26, T.figViolet);
      tag(T, '점선: 점전하(a = 0)', L + 6, B - 10, T.figMuted);
      if (a > 0.1) { ctx.fillStyle = T.figAmber; ctx.textAlign = 'left'; ctx.fillText('r < a', L + 3, Tp + 32); }
      return { Ld: Ld, ka: kap * a };
    }

    function panelG(T, x0, y0, w, h) {
      var L = x0 + 52, Rr = x0 + w - 12, Tp = y0 + 30, B = y0 + h - 40;
      var smax = 0.75, lo = -A * st.z * smax * 1.05, hi = 0;
      var sx = function (s) { return L + s / smax * (Rr - L); };
      var sy = function (v) { return B - (v - lo) / (hi - lo) * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('log γ± – √I', x0 + 8, y0 + 18);
      var step = st.z === 1 ? 0.1 : st.z === 2 ? 0.2 : 0.4;
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var v = 0; v >= lo - 1e-9; v -= step) {
        ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(mfmt(v, 1), L - 5, sy(v) + 4);
      }
      for (var s = 0; s <= smax + 1e-9; s += 0.25) {
        ctx.beginPath(); ctx.moveTo(sx(s), Tp); ctx.lineTo(sx(s), B); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(s.toFixed(2), sx(s), B + 15);
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('√I', (L + Rr) / 2, B + 32);
      ctx.save(); ctx.translate(x0 + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('log γ±', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(smax), sy(logGlim(smax))); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 3; ctx.beginPath();
      for (var k = 0; k <= 120; k++) { var ss = smax * k / 120, yy = sy(logGext(ss)); if (k) ctx.lineTo(sx(ss), yy); else ctx.moveTo(sx(ss), yy); }
      ctx.stroke();
      var sI = Math.sqrt(Math.pow(10, st.lgI));
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(sx(sI), Tp); ctx.lineTo(sx(sI), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.beginPath(); ctx.arc(sx(sI), sy(logGlim(sI)), 5, 0, 7); ctx.fill();
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(sx(sI), sy(logGext(sI)), 6, 0, 7); ctx.fill();
      ctx.restore();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      tag(T, '실선: 확장 식 (a = ' + st.a.toFixed(2) + ' nm)', L + 6, B - 26, T.figAccent);
      tag(T, '점선: 극한 법칙 (기울기 ' + mfmt(-A * st.z, 3) + ')', L + 6, B - 10, T.figMuted);
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var res;
      if (w < 560) { res = panelQ(T, 0, 0, w, h / 2); panelG(T, 0, h / 2, w, h / 2); }
      else { res = panelQ(T, 0, 0, w / 2, h); panelG(T, w / 2, 0, w / 2, h); }
      var I = Math.pow(10, st.lgI), sI = Math.sqrt(I);
      rI.set(Ifmt(I) + '  (√I = ' + sI.toFixed(3) + ')');
      rL.set((res.Ld >= 10 ? res.Ld.toFixed(1) : res.Ld.toFixed(2)) + ' nm');
      rKa.set(res.ka.toFixed(2));
      rG0.set(Math.pow(10, logGlim(sI)).toFixed(3));
      rG1.set(Math.pow(10, logGext(sI)).toFixed(3));
    }
    api.onResize(draw);
    draw();
  },
});
