/* 물리화학 2: 열 교환에 온도 차가 있는 카르노 기관 — T–S 도표의 엔트로피 장부, 잃어버린 일, 효율과 출력 */
Sims.register('mj-carnot-entropy-production', {
  title: '온도 차를 두고 열을 주고받는 카르노 기관 — 엔트로피 생성과 잃어버린 일',
  caption: '두 열원의 온도와, 작동 기체가 열원과 주고받을 때의 온도 차 ΔT_h·ΔT_c를 바꿔 보자. 왼쪽 T–S 도표에서 기체의 순환(칠한 직사각형)은 열원보다 좁은 온도 범위에서 돌고, 고온 열원이 잃은 엔트로피 q_h/T_h보다 저온 열원이 얻은 엔트로피 |q_c|/T_c가 커서 그 차이가 엔트로피 생성 S_생성이 된다. 빗금 친 넓이 T_c·S_생성이 같은 열 q_h를 받은 가역 카르노 기관보다 덜 한 일(구이–스토돌라 정리)이다. 오른쪽 그래프는 같은 기관의 효율과 출력의 관계로, 온도 차가 0이면 효율은 카르노 한계이지만 출력이 0이고, 출력이 가장 큰 점의 효율은 1 − √(T_c/T_h)(쿠존–알본)이다. 가정: 기체 쪽 순환은 가역(엔도가역 모형), 한 순환의 기체 엔트로피 변화는 9.13 J/K(예제 2), 열 흐름 속도는 온도 차에 비례하고 양쪽 열전달 계수가 같으며 단열 단계의 시간은 무시한다. 출력은 최댓값에 대한 상대값이다.',
  init: function (api) {
    var DS = 8.314 * Math.log(3);   // 기체가 한 순환에 고온에서 받는 엔트로피 (J/K)
    var st = { Th: 800, Tc: 300, dh: 80, dc: 40 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.52; }, label: 'T–S 도표와 효율–출력 그래프' });
    var ctx = cv.ctx;
    var rEta = api.readout('효율 η (카르노 · 쿠존–알본)');
    var rGen = api.readout('S_생성 (한 순환)');
    var rLost = api.readout('잃어버린 일 T_c·S_생성');
    var rP = api.readout('출력 (최대 대비)');

    function clamp() {
      var maxGap = st.Th - st.Tc - 20;
      if (st.dh + st.dc > maxGap) { var k = maxGap / (st.dh + st.dc); st.dh = Math.floor(st.dh * k); st.dc = Math.floor(st.dc * k); }
    }
    var sTh = api.slider({ id: 'mj-carnot-entropy-production-th', label: '고온 열원 T_h', min: 500, max: 1200, step: 10, value: st.Th,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.Th = v; clamp(); sync(); } });
    var sTc = api.slider({ id: 'mj-carnot-entropy-production-tc', label: '저온 열원 T_c', min: 250, max: 400, step: 5, value: st.Tc,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.Tc = v; clamp(); sync(); } });
    var sDh = api.slider({ id: 'mj-carnot-entropy-production-dh', label: '고온 쪽 온도 차 ΔT_h', min: 0, max: 400, step: 5, value: st.dh,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.dh = v; clamp(); sync(); } });
    var sDc = api.slider({ id: 'mj-carnot-entropy-production-dc', label: '저온 쪽 온도 차 ΔT_c', min: 0, max: 300, step: 5, value: st.dc,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.dc = v; clamp(); sync(); } });
    var g = api.group();
    api.button('가역 극한(온도 차 0)', function () { st.dh = 0; st.dc = 0; sync(); }, { parent: g });
    api.button('출력 최대로 맞추기', function () { var o = bestPoint(); st.dh = Math.round(o.dh); st.dc = Math.round(o.dc); sync(); }, { parent: g, primary: true });
    var busy = false;
    function sync() {
      if (busy) return; busy = true;
      sDh.input.value = st.dh; sDc.input.value = st.dc;
      sDh.set(st.dh); sDc.set(st.dc);
      busy = false; draw();
    }

    /* 출력(열전달 계수 K = 1로 둔 상대값): P = W / (t_h + t_c), t_h = q_h/(K ΔT_h), t_c = |q_c|/(K ΔT_c) */
    function power(Th, Tc, dh, dc) {
      if (dh <= 0 || dc <= 0) return 0;
      var thw = Th - dh, tcw = Tc + dc; if (thw <= tcw) return 0;
      return (thw - tcw) * DS / (thw * DS / dh + tcw * DS / dc);
    }
    function bestPoint() {
      var best = { p: 0, dh: 0, dc: 0 }, span = st.Th - st.Tc;
      for (var i = 1; i < 200; i++) for (var j = 1; j < 200; j++) {
        var dh = span * i / 200, dc = span * j / 200; if (dh + dc >= span) break;
        var p = power(st.Th, st.Tc, dh, dc); if (p > best.p) best = { p: p, dh: dh, dc: dc };
      }
      return best;
    }
    /* 효율 η에서 낼 수 있는 최대 출력 곡선 */
    function curve() {
      var etaC = 1 - st.Tc / st.Th, pts = [];
      for (var k = 0; k <= 60; k++) {
        var eta = etaC * k / 60, best = 0;
        for (var i = 1; i < 300; i++) {
          var thw = st.Tc + (st.Th - st.Tc) * i / 300, tcw = thw * (1 - eta);
          if (tcw <= st.Tc || thw >= st.Th) continue;
          var p = power(st.Th, st.Tc, st.Th - thw, tcw - st.Tc); if (p > best) best = p;
        }
        pts.push([eta, best]);
      }
      return pts;
    }
    function sub(str, x, y, px, bold, color) {
      var T = api.tokens(), parts = String(str).split(/_(생성|전체|[A-Za-z0-9]+)/), f1 = (bold ? '600 ' : '') + px + 'px ' + T.fontBody, f2 = (bold ? '600 ' : '') + Math.round(px * 0.78) + 'px ' + T.fontBody;
      var al = ctx.textAlign, wsum = 0;
      parts.forEach(function (p, i) { ctx.font = i % 2 ? f2 : f1; wsum += ctx.measureText(p).width; });
      var x0 = al === 'center' ? x - wsum / 2 : al === 'right' ? x - wsum : x;
      ctx.textAlign = 'left'; if (color) ctx.fillStyle = color;
      parts.forEach(function (p, i) { ctx.font = i % 2 ? f2 : f1; ctx.fillText(p, x0, y + (i % 2 ? px * 0.3 : 0)); x0 += ctx.measureText(p).width; });
      ctx.textAlign = al;
    }
    function frame(T, r, xmax, ymax, xt, yt, xl, yl, xf, yf) {
      var L = r.x + 52, R = r.x + r.w - 20, Tp = r.y + 28, B = r.y + r.h - 40;
      var o = { L: L, R: R, T: Tp, B: B, X: function (v) { return L + v / xmax * (R - L); }, Y: function (v) { return B - v / ymax * (B - Tp); } };
      ctx.lineWidth = 1; ctx.strokeStyle = T.rule; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center'; xt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(o.X(v), Tp); ctx.lineTo(o.X(v), B); ctx.stroke(); ctx.fillText(xf(v), o.X(v), B + 14); });
      ctx.textAlign = 'right'; yt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, o.Y(v)); ctx.lineTo(R, o.Y(v)); ctx.stroke(); ctx.fillText(yf(v), L - 5, o.Y(v) + 4); });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; sub(xl, (L + R) / 2, B + 31, 12);
      ctx.textAlign = 'left'; sub(yl, r.x + 4, r.y + 14, 12);
      return o;
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var Th = st.Th, Tc = st.Tc, thw = Th - st.dh, tcw = Tc + st.dc;
      var qh = thw * DS, qc = tcw * DS, W = qh - qc, sH = qh / Th, sC = qc / Tc, Sgen = sC - sH;
      var Wc = qh * (1 - Tc / Th), etaC = 1 - Tc / Th, etaCA = 1 - Math.sqrt(Tc / Th), eta = W / qh;
      var narrow = w < 560;
      var A = narrow ? { x: 0, y: 0, w: w, h: h * 0.56 } : { x: 0, y: 0, w: w * 0.56, h: h };
      var Bx = narrow ? { x: 0, y: h * 0.58, w: w, h: h * 0.42 } : { x: w * 0.58, y: 0, w: w * 0.42, h: h };
      // ── T–S
      var Smax = Math.max(16, Math.ceil((1 + sC + 1) / 4) * 4), Tmax = 1300, sT = []; for (var q = 0; q <= Smax; q += 4) sT.push(q);
      var o = frame(T, A, Smax, Tmax, sT, [0, 300, 600, 900, 1200], '엔트로피 S (J/K, 상대값)', '온도 T (K)',
        function (v) { return v; }, function (v) { return v; });
      var s0 = 1.0;
      // 열원 온도선
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1.4;
      ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(o.L, o.Y(Th)); ctx.lineTo(o.R, o.Y(Th)); ctx.stroke();
      ctx.strokeStyle = T.figBlue; ctx.beginPath(); ctx.moveTo(o.L, o.Y(Tc)); ctx.lineTo(o.R, o.Y(Tc)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'right'; sub('고온 열원 T_h', o.R - 2, o.Y(Th) - 6, 11, false, T.figRed);
      sub('저온 열원 T_c', o.R - 2, o.Y(Tc) + 15, 11, false, T.figBlue);
      // 잃어버린 일: T_c × S_생성 (빗금)
      var xg0 = o.X(s0 + sH), xg1 = o.X(s0 + sC);
      ctx.save(); ctx.beginPath(); ctx.rect(xg0, o.Y(Tc), xg1 - xg0, o.Y(0) - o.Y(Tc)); ctx.clip();
      ctx.fillStyle = T.figSoftViolet; ctx.fillRect(xg0, o.Y(Tc), xg1 - xg0, o.Y(0) - o.Y(Tc));
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1;
      for (var k = -40; k < 60; k++) { ctx.beginPath(); ctx.moveTo(xg0 + k * 8, o.Y(0)); ctx.lineTo(xg0 + k * 8 + 200, o.Y(0) - 200); ctx.stroke(); }
      ctx.restore();
      // 기체 순환
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(o.X(s0), o.Y(thw), o.X(s0 + DS) - o.X(s0), o.Y(tcw) - o.Y(thw));
      ctx.lineWidth = 2.6;
      [[s0, thw, s0 + DS, thw, T.figRed], [s0 + DS, thw, s0 + DS, tcw, T.figInk], [s0 + DS, tcw, s0, tcw, T.figBlue], [s0, tcw, s0, thw, T.figInk]].forEach(function (e) {
        ctx.strokeStyle = e[4]; ctx.beginPath(); ctx.moveTo(o.X(e[0]), o.Y(e[1])); ctx.lineTo(o.X(e[2]), o.Y(e[3])); ctx.stroke();
        var mx = (o.X(e[0]) + o.X(e[2])) / 2, my = (o.Y(e[1]) + o.Y(e[3])) / 2, an = Math.atan2(o.Y(e[3]) - o.Y(e[1]), o.X(e[2]) - o.X(e[0]));
        if (Math.abs(o.X(e[2]) - o.X(e[0])) + Math.abs(o.Y(e[3]) - o.Y(e[1])) > 14) {
          ctx.fillStyle = e[4]; ctx.beginPath(); ctx.moveTo(mx + 6 * Math.cos(an), my + 6 * Math.sin(an));
          ctx.lineTo(mx - 5 * Math.cos(an) - 4 * Math.sin(an), my - 5 * Math.sin(an) + 4 * Math.cos(an));
          ctx.lineTo(mx - 5 * Math.cos(an) + 4 * Math.sin(an), my - 5 * Math.sin(an) - 4 * Math.cos(an)); ctx.fill();
        }
      });
      // 열원의 엔트로피 변화 막대
      ctx.lineWidth = 5; ctx.lineCap = 'butt';
      ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(o.X(s0), o.Y(Th) - 12); ctx.lineTo(o.X(s0 + sH), o.Y(Th) - 12); ctx.stroke();
      ctx.strokeStyle = T.figBlue; ctx.beginPath(); ctx.moveTo(o.X(s0), o.Y(Tc) + 22); ctx.lineTo(o.X(s0 + sC), o.Y(Tc) + 22); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      sub('q_h/T_h (고온 열원이 잃음)', o.X(s0), o.Y(Th) - 20, 11);
      sub('|q_c|/T_c (저온 열원이 얻음)', o.X(s0), o.Y(Tc) + 40, 11);
      ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
      if (o.Y(tcw) - o.Y(thw) > 26) sub('기체가 한 일 W', (o.X(s0) + o.X(s0 + DS)) / 2, (o.Y(thw) + o.Y(tcw)) / 2 + 4, 12, true);
      if (xg1 - xg0 > 14) { ctx.textAlign = 'left'; sub('T_c·S_생성', xg1 + 4, o.Y(Tc / 2), 11, true, T.figViolet); }
      // ── 효율–출력
      var pts = curve(), pmax = 0; pts.forEach(function (p) { if (p[1] > pmax) pmax = p[1]; });
      var etaMax = Math.ceil(etaC * 10 + 0.5) / 10;
      var b = frame(T, Bx, etaMax, 1.1, [0, etaMax / 2, etaMax].map(function (v) { return +v.toFixed(2); }), [0, 0.5, 1],
        '효율 η', '출력 / 최대 출력', function (v) { return v.toFixed(2); }, function (v) { return v.toFixed(1); });
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2.4; ctx.beginPath();
      pts.forEach(function (p, i) { var x = b.X(p[0]), y = b.Y(pmax ? p[1] / pmax : 0); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
      ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(b.X(etaC), b.T); ctx.lineTo(b.X(etaC), b.B); ctx.stroke();
      ctx.strokeStyle = T.figTeal; ctx.beginPath(); ctx.moveTo(b.X(etaCA), b.T); ctx.lineTo(b.X(etaCA), b.B); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figRed; ctx.fillText('카르노', b.X(etaC) - 3, b.T + 24);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figTeal; ctx.fillText('쿠존–알본', b.X(etaCA) + 3, b.T + 10);
      var pNow = power(Th, Tc, st.dh, st.dc) / (pmax || 1);
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(b.X(Math.max(eta, 0)), b.Y(pNow), 6, 0, 7); ctx.fill();
      ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('● 지금 기관', b.L + 8, b.B - 8);
      // 값
      rEta.set(eta.toFixed(3) + '  (' + etaC.toFixed(3) + ' · ' + etaCA.toFixed(3) + ')');
      rGen.set(Sgen.toFixed(2) + ' J/K');
      rLost.set((Tc * Sgen / 1000).toFixed(2) + ' kJ = ' + (Wc / 1000).toFixed(2) + ' − ' + (W / 1000).toFixed(2) + ' kJ');
      rP.set(Math.round(pNow * 100) + ' %');
    }
    function subify(root) {
      var wk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
      while (wk.nextNode()) list.push(wk.currentNode);
      list.forEach(function (t) {
        if (!/_[^\s]/.test(t.nodeValue)) return;
        var fr = document.createDocumentFragment();
        t.nodeValue.split(/_(생성|전체|[A-Za-z0-9]+)/).forEach(function (p, i) {
          if (i % 2) { var s = document.createElement('sub'); s.textContent = p; fr.appendChild(s); } else if (p) fr.appendChild(document.createTextNode(p));
        });
        t.parentNode.replaceChild(fr, t);
      });
    }
    api.onResize(draw);
    draw();
    subify(api.readouts);
    Array.prototype.forEach.call(api.controls.querySelectorAll('label > span'), function (s) { subify(s); });
    var cap = api.root.querySelector('.sim-caption'); if (cap) subify(cap);
  },
});
