/* 일반지구과학 7 대기의 구조와 에너지: 한 층 대기 모형 — 장파 흡수율 ε와 반사율 α에 따른 지표 온도 */
Sims.register('u-greenhouse-layer', {
  title: '한 층 대기 모형 — 장파 흡수율과 반사율이 정하는 지표 온도',
  caption: '대기의 장파 흡수율 ε와 행성 반사율 α를 바꿔 보자. 대기 꼭대기에서 우주로 나가는 장파는 언제나 흡수한 태양 복사 Q와 같지만, ε가 커지면 지표가 Q에 더해 대기 역복사 εσTa⁴를 받으므로 지표 온도 Ts = Te·(2/(2−ε))^¼ 가 올라간다. ε ≈ 0.77이면 지표 평균 약 288 K가 재현된다. 대기는 단파를 모두 통과시키는 한 겹의 층이고 대류·잠열 수송은 없다고 가정한 첫 근사이다(S = 1361 W/m²).',
  init: function (api) {
    var SIG = 5.67e-8, S0 = 1361;
    var st = { eps: 0.77, alb: 0.30 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.65 : 0.52; }, label: '한 층 대기 모형의 에너지 흐름 그림과 흡수율에 따른 지표 온도 그래프' });
    var ctx = cv.ctx;
    var rQ = api.readout('흡수한 태양 복사 Q ');
    var rTe = api.readout('복사 평형 온도 Te ');
    var rTa = api.readout('대기층 Ta ');
    var rTs = api.readout('지표 Ts ');
    var sE = api.slider({ id: 'u-greenhouse-layer-eps', label: '대기의 장파 흡수율 ε', min: 0, max: 1, step: 0.01, value: st.eps,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.eps = v; update(); } });
    var sA = api.slider({ id: 'u-greenhouse-layer-alb', label: '행성 반사율 α', min: 0.1, max: 0.6, step: 0.01, value: st.alb,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.alb = v; update(); } });
    var g = api.group();
    api.button('대기 없음 (ε = 0)', function () { sE.set(0); }, { parent: g });
    api.button('지금 지구 (ε = 0.77, α = 0.30)', function () { sA.set(0.30); sE.set(0.77); }, { parent: g });
    api.button('검은 대기 (ε = 1)', function () { sE.set(1); }, { parent: g });

    function calc(eps, alb) {
      var Q = S0 * (1 - alb) / 4;
      var Te = Math.pow(Q / SIG, 0.25);
      var Ts = Te * Math.pow(2 / (2 - eps), 0.25);
      var Ta = Ts / Math.pow(2, 0.25);
      return { Q: Q, Te: Te, Ts: Ts, Ta: Ta, up: SIG * Math.pow(Ts, 4), layer: eps * SIG * Math.pow(Ta, 4) };
    }
    function update() {
      var c = calc(st.eps, st.alb);
      rQ.set(c.Q.toFixed(0) + ' W/m²');
      rTe.set(c.Te.toFixed(0) + ' K');
      rTa.set(st.eps > 0 ? c.Ta.toFixed(0) + ' K' : '–');
      rTs.set(c.Ts.toFixed(0) + ' K (' + (c.Ts - 273.15).toFixed(0) + ' °C)');
      draw();
    }
    function arrow(x1, y1, x2, y2, col, w) {
      var a = Math.atan2(y2 - y1, x2 - x1), hd = Math.max(8, w * 2.2);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - hd * 0.8 * Math.cos(a), y2 - hd * 0.8 * Math.sin(a)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hd * Math.cos(a) + hd * 0.6 * Math.sin(a), y2 - hd * Math.sin(a) - hd * 0.6 * Math.cos(a));
      ctx.lineTo(x2 - hd * Math.cos(a) - hd * 0.6 * Math.sin(a), y2 - hd * Math.sin(a) + hd * 0.6 * Math.cos(a));
      ctx.closePath(); ctx.fill();
    }
    function label(t, x, y, col, align, bold, bg) {
      ctx.textAlign = align || 'center';
      ctx.font = (bold ? '600 ' : '') + '12px ' + api.tokens().fontBody;
      if (bg) {
        var tw = ctx.measureText(t).width, bx = align === 'left' ? x : align === 'right' ? x - tw : x - tw / 2;
        ctx.fillStyle = bg; ctx.fillRect(bx - 3, y - 12, tw + 6, 16);
      }
      ctx.fillStyle = col; ctx.fillText(t, x, y);
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = stacked ? { x: 0, y: 0, w: w, h: h * 0.56 } : { x: 0, y: 0, w: w * 0.55, h: h };
      var B = stacked ? { x: 0, y: h * 0.58, w: w, h: h * 0.42 } : { x: w * 0.58, y: 0, w: w * 0.42, h: h };
      drawFlux(T, A); drawGraph(T, B);
    }
    function drawFlux(T, r) {
      var c = calc(st.eps, st.alb);
      var top = r.y + 30, layerY = r.y + r.h * 0.44, layerH = 26, ground = r.y + r.h - 34;
      var x0 = r.x + 10, x1 = r.x + r.w - 10;
      // 우주
      label('우주', x0 + 4, top - 12, T.figMuted, 'left');
      ctx.strokeStyle = T.figLine; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, top); ctx.stroke(); ctx.setLineDash([]);
      // 대기층
      ctx.globalAlpha = 0.25 + 0.75 * st.eps;
      ctx.fillStyle = T.figSoftViolet; ctx.fillRect(x0, layerY, x1 - x0, layerH);
      ctx.globalAlpha = 1; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1; ctx.strokeRect(x0, layerY, x1 - x0, layerH);
      // 지표
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(x0, ground, x1 - x0, r.y + r.h - ground - 4);
      ctx.strokeStyle = T.figGreen; ctx.beginPath(); ctx.moveTo(x0, ground); ctx.lineTo(x1, ground); ctx.stroke();
      var W = function (v) { return Math.max(1.5, v / 40); };   // 선 굵기 ∝ 에너지
      var cols = r.w / 5;
      // 1) 태양 복사(입사 S/4)와 반사
      var inS = S0 / 4, refl = inS * st.alb;
      var xs = r.x + cols * 0.75;
      arrow(xs, top - 4, xs, ground - 2, T.figAmber, W(c.Q));
      label('태양 ' + c.Q.toFixed(0), xs + 6, ground - 30, T.figAmber, 'left', true);
      arrow(xs + 26, layerY - 8, xs + 26, top - 6, T.figMuted, W(refl));
      label('반사 ' + refl.toFixed(0), xs + 30, top + 26, T.figMuted, 'left');
      // 2) 지표 장파 방출
      var xg = r.x + cols * 2.25;
      arrow(xg, ground - 2, xg, layerY + layerH + 2, T.figRed, W(c.up));
      label('지표 방출 ' + c.up.toFixed(0), xg + 6, (ground + layerY + layerH) / 2 + 4, T.figRed, 'left', true);
      // 대기 통과분
      var through = (1 - st.eps) * c.up;
      if (through > 0.5) {
        arrow(xg, layerY - 2, xg, top - 4, T.figRed, W(through));
        label('통과 ' + through.toFixed(0), xg + 6, (top + layerY) / 2 + 4, T.figRed, 'left');
      }
      // 3) 대기층 방출(위·아래)
      var xa = r.x + cols * 3.75;
      if (c.layer > 0.5) {
        arrow(xa, layerY - 2, xa, top - 4, T.figViolet, W(c.layer));
        label('위로 ' + c.layer.toFixed(0), xa + 6, (top + layerY) / 2 + 4, T.figViolet, 'left');
        arrow(xa, layerY + layerH + 2, xa, ground - 2, T.figViolet, W(c.layer));
        label('역복사 ' + c.layer.toFixed(0), xa + 6, (ground + layerY + layerH) / 2 + 4, T.figViolet, 'left', true);
      }
      label('대기층  Ta = ' + (st.eps > 0 ? c.Ta.toFixed(0) + ' K' : '–') + ',  ε = ' + st.eps.toFixed(2), x0 + 6, layerY + 17, T.figViolet, 'left', true, T.figPanel);
      label('지표  Ts = ' + c.Ts.toFixed(0) + ' K', x0 + 6, ground + 18, T.figGreen, 'left', true, T.figPanel);
      // 꼭대기 수지
      var out = through + c.layer;
      label('우주로 나가는 장파 ' + out.toFixed(0) + ' = Q ' + c.Q.toFixed(0) + '  (W/m²)', r.x + r.w - 12, top - 12, T.figInk, 'right', true);
      label('지표가 받는 것: Q + 역복사 = ' + (c.Q + c.layer).toFixed(0), r.x + r.w - 12, r.y + r.h - 8, T.figInk, 'right');
    }
    function drawGraph(T, r) {
      var L = r.x + 50, R = r.x + r.w - 14, Tp = r.y + 26, Bt = r.y + r.h - 40;
      var tmin = 180, tmax = 340;
      var sx = function (e) { return L + e * (R - L); };
      var sy = function (t) { return Bt - (t - tmin) / (tmax - tmin) * (Bt - Tp); };
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.textAlign = 'right';
      for (var t = 180; t <= 340; t += 20) { ctx.beginPath(); ctx.moveTo(L, sy(t)); ctx.lineTo(R, sy(t)); ctx.stroke(); ctx.fillText(t, L - 6, sy(t) + 4); }
      ctx.textAlign = 'center';
      for (var e = 0; e <= 1.001; e += 0.25) ctx.fillText(e.toFixed(2), sx(e), Bt + 15);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('대기의 장파 흡수율 ε', (L + R) / 2, Bt + 32);
      ctx.save(); ctx.translate(r.x + 12, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('온도 (K)', 0, 0); ctx.restore();
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('ε에 따른 지표 온도 (α = ' + st.alb.toFixed(2) + ')', L, r.y + 14);
      // 실제 지표 평균 288 K
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figGreen; ctx.beginPath(); ctx.moveTo(L, sy(288)); ctx.lineTo(R, sy(288)); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = T.figGreen; ctx.font = '11px ' + T.fontBody; ctx.fillText('실제 지표 평균 288 K', L + 4, sy(288) - 5);
      // 곡선 Ts, Ta, Te
      var c0 = calc(0, st.alb);
      line(function (e) { return calc(e, st.alb).Ts; }, T.figRed, 2.4);
      line(function (e) { return calc(e, st.alb).Ta; }, T.figViolet, 1.6, [6, 3]);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, sy(c0.Te)); ctx.lineTo(R, sy(c0.Te)); ctx.stroke();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figRed; ctx.fillText('지표 Ts', R, sy(calc(1, st.alb).Ts) - 6);
      ctx.fillStyle = T.figViolet; ctx.fillText('대기층 Ta', R, sy(calc(1, st.alb).Ta) + 14);
      ctx.fillStyle = T.figAmber; ctx.textAlign = 'left'; ctx.fillText('Te = ' + c0.Te.toFixed(0) + ' K', sx(0.42), sy(c0.Te) + 14);
      var c = calc(st.eps, st.alb);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(st.eps), sy(c.Ts), 5, 0, Math.PI * 2); ctx.fill();
      function line(fn, col, lw, dash) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var i = 0; i <= 50; i++) { var e = i / 50, y = Math.max(Tp, Math.min(Bt, sy(fn(e)))); if (i) ctx.lineTo(sx(e), y); else ctx.moveTo(sx(e), y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    api.onResize(draw);
    update();
  },
});
