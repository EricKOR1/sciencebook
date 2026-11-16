/* 일반지구과학 7 단열 변화와 안정도: 공기 덩어리의 건조·습윤 단열 경로와 주변 기온 감률 비교 */
Sims.register('u-parcel-lapse', {
  title: '공기 덩어리를 들어 올리면 — 단열 경로, 상승 응결 고도, 안정도',
  caption: '지표 기온·이슬점과 하층(지표~3 km) 주변 대기의 기온 감률 Γ를 바꿔 보자. 들어 올린 공기 덩어리는 상승 응결 고도(LCL)까지 건조 단열 감률 9.8 K/km로, 그 위에서는 응결 잠열 때문에 더 느린 습윤 단열 감률 Γs로 식는다. Γs는 따뜻할수록 작아서 경로가 위로 갈수록 건조 단열선에 가까워진다. 공기 덩어리가 주변보다 따뜻한 구간(빨강)에서는 위로 뜨는 힘을, 차가운 구간(파랑)에서는 되돌아가려는 힘을 받는다. 판정은 하층의 Γ를 건조 단열 감률, LCL에서의 Γs와 비교한 것이다. 3 km 위 주변 기온은 평균 감률 6.5 K/km로 두었고, 이슬점 감률은 1.8 K/km, Γs는 원고의 식(물에 대한 포화)으로 계산했고 혼합·강수 낙하는 무시했다.',
  init: function (api) {
    var G = 9.8, CP = 1004, RD = 287, LV = 2.5e6, EPS = 0.622, GD = G / CP * 1000;   // K/km
    var ZTOP = 12, ZL = 3;   // 하층 ZL km까지는 감률 Γ, 그 위는 평균 6.5 K/km
    var st = { T0: 30, Td0: 22, gam: 7.5 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.58; }, label: '높이에 따른 주변 기온, 공기 덩어리 기온, 이슬점 그래프' });
    var ctx = cv.ctx;
    var rL = api.readout('상승 응결 고도 ');
    var rS = api.readout('Γs (LCL에서) ');
    var rF = api.readout('자유 대류 고도 ');
    var rJ = api.readout('판정 ');
    var sT = api.slider({ id: 'u-parcel-lapse-t', label: '지표 기온', min: 0, max: 35, step: 0.5, value: st.T0,
      format: function (v) { return v.toFixed(1) + ' °C'; }, onInput: function (v) { st.T0 = v; if (st.Td0 > v) sD.set(v); else update(); } });
    var sD = api.slider({ id: 'u-parcel-lapse-td', label: '지표 이슬점', min: -10, max: 35, step: 0.5, value: st.Td0,
      format: function (v) { return v.toFixed(1) + ' °C'; }, onInput: function (v) { if (v > st.T0) { sD.set(st.T0); return; } st.Td0 = v; update(); } });
    var sG = api.slider({ id: 'u-parcel-lapse-g', label: '하층(0~3 km) 기온 감률 Γ', min: -4, max: 12, step: 0.1, value: st.gam,
      format: function (v) { return v.toFixed(1) + ' K/km'; }, onInput: function (v) { st.gam = v; update(); } });
    var g = api.group();
    api.button('여름 오후', function () { preset(30, 22, 7.5); }, { parent: g });
    api.button('맑은 겨울 새벽(역전)', function () { preset(0, -3, -3); }, { parent: g });
    api.button('뜨겁고 건조한 한낮', function () { preset(34, 6, 10.5); }, { parent: g });
    api.button('고기압권 하강 기류', function () { preset(20, 8, 3); }, { parent: g });
    function preset(t, d, gm) { st.T0 = t; st.Td0 = d; st.gam = gm; sT.input.value = t; sD.input.value = d; sG.input.value = gm; sT.set(t); sD.set(d); sG.set(gm); }

    function es(tc) { return 6.112 * Math.exp(17.67 * tc / (tc + 243.5)); }   // hPa
    function gammaS(tk, p) {   // K/km
      var e = es(tk - 273.15), ws = EPS * e / (p - e);
      return G * (1 + LV * ws / (RD * tk)) / (CP + EPS * LV * LV * ws / (RD * tk * tk)) * 1000;
    }
    function compute() {
      var dz = 0.025, n = Math.round(ZTOP / dz), out = [];
      var p = 1000, Tp = st.T0 + 273.15, zl = (st.T0 - st.Td0) / (GD - 1.8);
      var lfc = null, el = null, gsl = null, sat = false;
      for (var i = 0; i <= n; i++) {
        var z = i * dz, Te = st.T0 + 273.15 - st.gam * Math.min(z, ZL) - 6.5 * Math.max(0, z - ZL);
        var Td = z <= zl ? st.Td0 - 1.8 * z : null;
        out.push({ z: z, te: Te - 273.15, tp: Tp - 273.15, td: Td, p: p });
        if (i > 0) {
          var prev = out[i - 1];
          if (prev.tp <= prev.te && Tp - 273.15 > Te - 273.15 && lfc === null) lfc = z;
          if (lfc !== null && el === null && prev.tp > prev.te && Tp - 273.15 <= Te - 273.15) el = z;
        }
        // 다음 높이로
        var lap = (z + dz <= zl) ? GD : gammaS(Tp, p);
        if (z >= zl && gsl === null) gsl = gammaS(Tp, p);
        Tp -= lap * dz;
        p *= Math.exp(-G * dz * 1000 / (RD * Math.max(150, Te)));
      }
      if (gsl === null) gsl = NaN;
      return { pts: out, zl: zl, lfc: lfc, el: el, gsl: gsl };
    }
    function judge(gsl) {
      if (st.gam < 0) return '기온 역전 — 매우 안정';
      if (st.gam > GD) return '절대 불안정 (Γ > Γd)';
      if (st.gam > gsl) return '조건부 불안정 (Γs < Γ < Γd)';
      return '절대 안정 (Γ < Γs)';
    }
    var res;
    function update() {
      res = compute();
      rL.set(res.zl <= ZTOP ? Math.round(res.zl * 1000) + ' m' : ZTOP + ' km 위');
      rS.set(isFinite(res.gsl) ? res.gsl.toFixed(1) + ' K/km' : '–');
      rF.set(res.lfc !== null ? (res.lfc < 0.03 ? '지표부터' : res.lfc.toFixed(1) + ' km') : '없음');
      rJ.set(judge(isFinite(res.gsl) ? res.gsl : gammaS(st.T0 + 273.15, 1000)));
      draw();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var L = 52, R = w - (narrow ? 14 : 150), Tp = 16, B = h - 40;
      var tmin = Infinity, tmax = -Infinity;
      res.pts.forEach(function (q) { tmin = Math.min(tmin, q.te, q.tp, q.td === null ? Infinity : q.td); tmax = Math.max(tmax, q.te, q.tp); });
      tmin = Math.floor((tmin - 4) / 10) * 10; tmax = Math.ceil((tmax + 4) / 10) * 10;
      var sx = function (t) { return L + (t - tmin) / (tmax - tmin) * (R - L); };
      var sy = function (z) { return B - z / ZTOP * (B - Tp); };
      ctx.lineWidth = 1; ctx.strokeStyle = T.rule; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      for (var z = 0; z <= ZTOP; z += 2) { ctx.beginPath(); ctx.moveTo(L, sy(z)); ctx.lineTo(R, sy(z)); ctx.stroke(); ctx.fillText(z, L - 6, sy(z) + 4); }
      ctx.textAlign = 'center';
      var step = (tmax - tmin) > 80 ? 20 : 10;
      for (var t = tmin; t <= tmax; t += step) { ctx.beginPath(); ctx.moveTo(sx(t), B); ctx.lineTo(sx(t), Tp); ctx.stroke(); ctx.fillText(t, sx(t), B + 15); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('기온 (°C)', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('높이 (km)', 0, 0); ctx.restore();
      // 부력 구간 채우기
      var P = res.pts;
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      for (var i = 1; i < P.length; i++) {
        var a = P[i - 1], b = P[i], d = (a.tp - a.te + b.tp - b.te) / 2;
        if (Math.abs(d) < 0.05) continue;
        ctx.fillStyle = d > 0 ? T.figSoftRed : T.figSoftBlue;
        ctx.beginPath(); ctx.moveTo(sx(a.te), sy(a.z)); ctx.lineTo(sx(a.tp), sy(a.z)); ctx.lineTo(sx(b.tp), sy(b.z)); ctx.lineTo(sx(b.te), sy(b.z)); ctx.closePath(); ctx.fill();
      }
      // 참고선: 건조 단열선(지표 기온에서)
      ctx.setLineDash([2, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(st.T0), sy(0)); ctx.lineTo(sx(st.T0 - GD * ZTOP), sy(ZTOP)); ctx.stroke(); ctx.setLineDash([]);
      // 하층 경계
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('↑ 3 km 위 주변 감률 6.5 K/km', R - 4, sy(ZL) - 4);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R - 40, sy(ZL)); ctx.lineTo(R, sy(ZL)); ctx.stroke();
      // LCL
      if (res.zl <= ZTOP) {
        ctx.strokeStyle = T.figTeal; ctx.lineWidth = 1.2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(L, sy(res.zl)); ctx.lineTo(R, sy(res.zl)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figTeal; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('LCL(구름 밑면) ' + Math.round(res.zl * 1000) + ' m', L + 4, sy(res.zl) - 5);
      }
      [['lfc', '자유 대류 고도'], ['el', '평형 고도']].forEach(function (k) {
        var zz = res[k[0]]; if (zz === null || zz < 0.03) return;
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(L, sy(zz)); ctx.lineTo(R, sy(zz)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        var crowded = res.zl <= ZTOP && Math.abs(sy(zz) - sy(res.zl)) < 16;   // LCL 글자와 겹치면 한 줄 위로
        ctx.fillText(k[1] + ' ' + zz.toFixed(1) + ' km', L + 4, sy(Math.max(zz, res.zl)) - 5 - (crowded ? 14 : 0));
      });
      // 곡선
      function curve(key, col, lw, dash) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath();
        var started = false;
        P.forEach(function (q) { var v = q[key]; if (v === null) return; if (!started) { ctx.moveTo(sx(v), sy(q.z)); started = true; } else ctx.lineTo(sx(v), sy(q.z)); });
        ctx.stroke(); ctx.setLineDash([]);
      }
      curve('td', T.figGreen, 2, [5, 3]);
      curve('te', T.figInk, 2.4);
      curve('tp', T.figAccent, 2.8);
      ctx.restore();
      // 범례
      var lx = narrow ? L + 8 : R + 12, ly = narrow ? Tp + 14 : Tp + 20;
      var items = [[T.figInk, '주변 기온', []], [T.figAccent, '공기 덩어리 기온', []], [T.figGreen, '이슬점(LCL까지)', [5, 3]], [T.figMuted, '건조 단열선 9.8 K/km', [2, 4]]];
      if (narrow) {
        ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85; ctx.fillRect(lx - 4, ly - 12, 168, items.length * 17 + 6); ctx.globalAlpha = 1;
      }
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      items.forEach(function (it, k) {
        var y = ly + k * 17;
        ctx.strokeStyle = it[0]; ctx.lineWidth = 2.2; ctx.setLineDash(it[2]);
        ctx.beginPath(); ctx.moveTo(lx, y - 4); ctx.lineTo(lx + 20, y - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], lx + 26, y);
      });
      if (!narrow) {
        var y2 = ly + items.length * 17 + 12;
        ctx.fillStyle = T.figSoftRed; ctx.fillRect(lx, y2 - 10, 20, 10); ctx.fillStyle = T.figInk; ctx.fillText('덩어리가 더 따뜻함', lx + 26, y2);
        ctx.fillStyle = T.figSoftBlue; ctx.fillRect(lx, y2 + 7, 20, 10); ctx.fillStyle = T.figInk; ctx.fillText('덩어리가 더 차가움', lx + 26, y2 + 17);
      }
    }
    api.onResize(draw);
    update();
  },
});
