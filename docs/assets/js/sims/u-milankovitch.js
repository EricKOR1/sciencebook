/* 일반지구과학 9 밀란코비치 주기: 이심률·자전축 경사·근일점 시기 → 북위 65° 하루 평균 일사(대기 꼭대기) */
Sims.register('u-milankovitch', {
  title: '밀란코비치 주기 — 궤도가 바꾸는 북위 65°의 여름 햇빛',
  caption: '이심률, 자전축 경사, 근일점에 오는 계절(세차)을 바꿔 보자. 오른쪽(아래) 그래프는 대기 꼭대기에서 북위 65°가 받는 하루 평균 일사를 1년 동안(태양의 위치 기준) 그린 것이고, 회색 선은 현재 궤도이다. 경사가 크면 여름 일사가 늘고, 이심률이 클 때 근일점이 북반구 여름에 오면 여름 일사가 크게 늘지만, 지구 전체가 1년 동안 받는 에너지는 1/√(1−e²)배로 거의 변하지 않는다. 태양 상수 1361 W/m², 대기의 영향은 넣지 않았고, 왼쪽 궤도 그림은 이심률을 4배 과장했다.',
  init: function (api) {
    var S0 = 1361, LAT = 65, D2R = Math.PI / 180;
    var NOW = { e: 0.0167, eps: 23.44, w: 283 };
    var st = { e: NOW.e, eps: NOW.eps, w: NOW.w };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.4 : 0.52; }, label: '지구 궤도 그림과 북위 65도의 1년 일사량 그래프' });
    var ctx = cv.ctx;
    var rS = api.readout('65°N 하지 일사 ');
    var rD = api.readout('현재 궤도와 차이 ');
    var rP = api.readout('근일점/원일점 일사 비 ');
    var rA = api.readout('연간 전 지구 일사 ');
    var sE = api.slider({ id: 'u-milankovitch-e', label: '이심률 e', min: 0, max: 0.06, step: 0.001, value: st.e,
      format: function (v) { return v.toFixed(3); }, onInput: function (v) { st.e = v; update(); } });
    var sO = api.slider({ id: 'u-milankovitch-eps', label: '자전축 경사', min: 22.1, max: 24.5, step: 0.01, value: st.eps,
      format: function (v) { return v.toFixed(2) + '°'; }, onInput: function (v) { st.eps = v; update(); } });
    var sW = api.slider({ id: 'u-milankovitch-w', label: '근일점에 오는 때', min: 0, max: 359, step: 1, value: st.w,
      format: function (v) { return season(v); }, onInput: function (v) { st.w = v; update(); } });
    var g = api.group();
    api.button('현재', function () { setAll(NOW.e, NOW.eps, NOW.w); }, { parent: g });
    api.button('여름 일사 큰 조합', function () { setAll(0.058, 24.5, 90); }, { parent: g });
    api.button('여름 일사 작은 조합', function () { setAll(0.058, 22.1, 270); }, { parent: g });
    function setAll(e, o, w) { sE.set(e); sO.set(o); sW.set(w); }
    function season(v) {
      var n = ['춘분', '하지', '추분', '동지'], k = Math.round(v / 90) % 4, d = v - Math.round(v / 90) * 90;
      return '북반구 ' + n[k] + (Math.abs(d) < 3 ? '' : d > 0 ? ' 지난 뒤' : ' 앞') + ' (' + Math.round(v) + '°)';
    }
    function insol(lamDeg, p) {   // 북위 LAT의 하루 평균 일사(W/m²), lam: 태양 황경
      var lam = lamDeg * D2R, phi = LAT * D2R;
      var dec = Math.asin(Math.sin(p.eps * D2R) * Math.sin(lam));
      var x = -Math.tan(phi) * Math.tan(dec), h0 = x <= -1 ? Math.PI : x >= 1 ? 0 : Math.acos(x);
      var dist = Math.pow(1 + p.e * Math.cos(lam - p.w * D2R), 2) / Math.pow(1 - p.e * p.e, 2);
      return S0 / Math.PI * dist * (h0 * Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.sin(h0));
    }
    function update() {
      var q = insol(90, st), q0 = insol(90, NOW);
      rS.set(q.toFixed(0) + ' W/m²');
      rD.set((q - q0 >= 0 ? '+' : '−') + Math.abs(q - q0).toFixed(0) + ' W/m²');
      rP.set(Math.pow((1 + st.e) / (1 - st.e), 2).toFixed(3));
      rA.set('현재의 ' + (100 * Math.sqrt(1 - NOW.e * NOW.e) / Math.sqrt(1 - st.e * st.e)).toFixed(2) + ' %');
      draw();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = stacked ? { x: 0, y: 0, w: w, h: h * 0.45 } : { x: 0, y: 0, w: w * 0.4, h: h };
      var B = stacked ? { x: 0, y: h * 0.47, w: w, h: h * 0.53 } : { x: w * 0.42, y: 0, w: w * 0.58, h: h };
      drawOrbit(T, A); drawGraph(T, B);
    }
    function drawOrbit(T, r) {
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 6, a = Math.min(r.w, r.h) * 0.34, ex = Math.min(0.24, st.e * 4);
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('궤도 (북극 위에서 본 모습)', r.x + 8, r.y + 16);
      var thP = (st.w + 180) * D2R;   // 근일점에서 지구의 일심 황경
      function pos(th) { var rr = a * (1 - ex * ex) / (1 + ex * Math.cos(th - thP)); return [cx + rr * Math.cos(th), cy - rr * Math.sin(th)]; }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var i = 0; i <= 120; i++) { var p = pos(2 * Math.PI * i / 120); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
      // 근일점·원일점 축
      var pp = pos(thP), pa = pos(thP + Math.PI);
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(pp[0], pp[1]); ctx.lineTo(pa[0], pa[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figRed; ctx.fillText('근일점', pp[0] + (pp[0] - cx) * 0.18, pp[1] + (pp[1] - cy) * 0.18 + 4);
      ctx.fillStyle = T.figBlue; ctx.fillText('원일점', pa[0] + (pa[0] - cx) * 0.18, pa[1] + (pa[1] - cy) * 0.18 + 4);
      // 절기 위치(지구의 일심 황경 = 태양 황경 + 180°)
      [[0, '춘분'], [90, '하지'], [180, '추분'], [270, '동지']].forEach(function (k) {
        var th = (k[0] + 180) * D2R, p = pos(th);
        var summer = k[0] === 90;
        ctx.fillStyle = summer ? T.figRed : T.figAccent; ctx.beginPath(); ctx.arc(p[0], p[1], summer ? 6 : 4.5, 0, Math.PI * 2); ctx.fill();
        var lx = p[0] + Math.cos(th) * 22, ly = p[1] - Math.sin(th) * 18 + 4;
        ctx.fillStyle = T.figInk; ctx.font = (summer ? '600 ' : '') + '11px ' + T.fontBody; ctx.fillText(k[1], lx, ly);
      });
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('절기는 북반구 기준, 이심률 4배 과장', r.x + 8, r.y + r.h - 6);
    }
    function drawGraph(T, r) {
      var L = r.x + 48, R = r.x + r.w - 12, Tp = r.y + 28, Bt = r.y + r.h - 40, QM = 600;
      var sx = function (l) { return L + l / 360 * (R - L); }, sy = function (q) { return Bt - q / QM * (Bt - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var q = 0; q <= QM; q += 100) { ctx.beginPath(); ctx.moveTo(L, sy(q)); ctx.lineTo(R, sy(q)); ctx.stroke(); ctx.fillText(q, L - 6, sy(q) + 4); }
      ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody;
      [[0, '춘분'], [90, '하지'], [180, '추분'], [270, '동지'], [360, '춘분']].forEach(function (k) {
        ctx.beginPath(); ctx.moveTo(sx(k[0]), Tp); ctx.lineTo(sx(k[0]), Bt); ctx.stroke(); ctx.fillText(k[1], sx(k[0]), Bt + 15);
      });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('태양의 위치(계절, 북반구 기준)', (L + R) / 2, Bt + 32);
      ctx.save(); ctx.translate(r.x + 12, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('하루 평균 일사 (W/m²)', 0, 0); ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('북위 65°, 대기 꼭대기', L, r.y + 14);
      function curve(p, col, lw) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        for (var i = 0; i <= 180; i++) { var l = 2 * i, y = sy(insol(l, p)); if (i) ctx.lineTo(sx(l), y); else ctx.moveTo(sx(l), y); }
        ctx.stroke();
      }
      curve(NOW, T.figLine, 1.6);
      curve(st, T.figRed, 2.6);
      var q = insol(90, st), q0 = insol(90, NOW);
      ctx.fillStyle = T.figLine; ctx.beginPath(); ctx.arc(sx(90), sy(q0), 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(90), sy(q), 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(q.toFixed(0) + ' W/m²', sx(90) + 9, sy(q) - 6);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figRed; ctx.fillRect(R - 128, Tp + 6, 14, 3); ctx.fillStyle = T.figInk; ctx.fillText('바꾼 궤도', R - 4, Tp + 11);
      ctx.fillStyle = T.figLine; ctx.fillRect(R - 128, Tp + 21, 14, 3); ctx.fillStyle = T.figInk; ctx.fillText('현재 궤도', R - 4, Tp + 26);
    }
    api.onResize(draw);
    update();
  },
});
