/* 일반지구과학 10 계절: 자전축 경사·위도·날짜에 따른 태양의 남중 고도, 낮의 길이, 하루 일사량 */
Sims.register('u-seasons', {
  title: '경사가 만드는 계절 — 남중 고도, 낮의 길이, 하루 일사량',
  caption: '위도와 날짜를 바꿔 보자. 왼쪽(위)은 정오에 같은 폭의 햇빛 다발이 지면에 닿는 모습으로, 남중 고도 h가 낮을수록 같은 에너지가 1/sin h배 넓은 땅에 퍼진다. 오른쪽(아래)은 1년 동안의 낮 길이와 대기 밖 하루 평균 일사량이다. 자전축 경사를 0°로 줄이면 계절이 거의 사라지고, 남은 작은 변화(약 ±3 %)는 근일점·원일점 거리 차이 때문이다. 태양 적위는 원 궤도 근사 sin δ = sin ε sin λ로, 낮의 길이는 태양 중심이 지평선을 지나는 때로 계산했으며 대기의 굴절·감쇠는 무시했다(근일점 1월 3일, 이심률 0.0167, 태양 상수 1361 W/m²).',
  init: function (api) {
    var S0 = 1361, ECC = 0.0167, DEG = Math.PI / 180;
    var st = { lat: 37.5, day: 171, tilt: 23.4 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.52; }, label: '정오의 햇빛 다발과 1년 동안의 낮 길이·일사량 그래프' });
    var ctx = cv.ctx;
    var MONTH0 = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

    var rDec = api.readout('태양 적위 δ');
    var rAlt = api.readout('남중 고도 h');
    var rLen = api.readout('낮의 길이');
    var rNoon = api.readout('정오 일사량(수평면, 대기 밖)');
    var rDaily = api.readout('하루 평균 일사량');

    var sLat = api.slider({ id: 'u-seasons-lat', label: '위도', min: -90, max: 90, step: 0.5, value: st.lat,
      format: function (v) { return v === 0 ? '0°' : Math.abs(v).toFixed(1) + '°' + (v > 0 ? 'N' : 'S'); },
      onInput: function (v) { st.lat = v; update(); } });
    var sDay = api.slider({ id: 'u-seasons-day', label: '날짜', min: 0, max: 364, step: 1, value: st.day,
      format: function (v) { return dateStr(v); }, onInput: function (v) { st.day = v; syncBtns(); update(); } });
    api.slider({ id: 'u-seasons-tilt', label: '자전축 경사 ε', min: 0, max: 45, step: 0.1, value: st.tilt,
      format: function (v) { return v.toFixed(1) + '°'; }, onInput: function (v) { st.tilt = v; update(); } });
    var g = api.group();
    var marks = [{ n: '춘분', d: 79 }, { n: '하지', d: 171 }, { n: '추분', d: 265 }, { n: '동지', d: 355 }];
    var btns = marks.map(function (m) {
      return api.button(m.n, function () { sDay.set(m.d); }, { toggle: true, pressed: m.d === st.day, parent: g });
    });
    var playBtn = api.button('1년 재생', function () {
      if (loop.playing) { loop.pause(); playBtn.textContent = '1년 재생'; }
      else { loop.play(); playBtn.textContent = '멈춤'; }
    }, { primary: true });
    if (api.reduced) playBtn.style.display = 'none';
    var acc = 0;
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      acc += dt * 40;            // 화면 1초 = 40일
      if (acc >= 1) { var n = Math.floor(acc); acc -= n; sDay.set((st.day + n) % 365); }
    });
    loop.pause();

    function syncBtns() { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', marks[i].d === st.day ? 'true' : 'false'); }); }
    function dateStr(d) {
      var m = 11; while (m > 0 && MONTH0[m] > d) m--;
      return (m + 1) + '월 ' + (d - MONTH0[m] + 1) + '일';
    }
    // 태양 황경(춘분 = 0), 적위, 거리 인자
    function decl(d, tilt) { var lam = 2 * Math.PI * (d - 79) / 365.24; return Math.asin(Math.sin(tilt * DEG) * Math.sin(lam)); }
    function distFac(d) { var M = 2 * Math.PI * (d - 2) / 365.24; var r = 1 - ECC * Math.cos(M); return 1 / (r * r); }
    function sunsetH(lat, dec) {           // 일몰 시각각(라디안), 0 = 극야, π = 백야
      var x = -Math.tan(lat * DEG) * Math.tan(dec);
      if (x >= 1) return 0; if (x <= -1) return Math.PI; return Math.acos(x);
    }
    function dayLen(lat, dec) { return 24 * sunsetH(lat, dec) / Math.PI; }
    function daily(lat, dec, d) {
      var H = sunsetH(lat, dec), p = lat * DEG;
      return S0 / Math.PI * distFac(d) * (H * Math.sin(p) * Math.sin(dec) + Math.cos(p) * Math.cos(dec) * Math.sin(H));
    }
    function noonAlt(lat, dec) { return 90 - Math.abs(lat - dec / DEG); }

    function update() {
      var dec = decl(st.day, st.tilt), h = noonAlt(st.lat, dec);
      rDec.set((dec / DEG >= 0 ? '+' : '') + (dec / DEG).toFixed(1) + '°');
      var dir = st.lat - dec / DEG > 0.05 ? '남쪽' : st.lat - dec / DEG < -0.05 ? '북쪽' : '천정';
      rAlt.set(h > 0 ? h.toFixed(1) + '° (' + dir + ')' : '지평선 아래 (극야)');
      var L = dayLen(st.lat, dec);
      rLen.set(L >= 24 ? '24시간 (백야)' : L <= 0 ? '0시간 (극야)' : Math.floor(L) + '시간 ' + Math.round((L % 1) * 60) + '분');
      rNoon.set(h > 0 ? Math.round(S0 * distFac(st.day) * Math.sin(h * DEG)) + ' W/m²' : '0 W/m²');
      rDaily.set(Math.round(Math.max(0, daily(st.lat, dec, st.day))) + ' W/m²');
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { a: { x: 0, y: 0, w: w, h: h * 0.44 }, b: { x: 0, y: h * 0.46, w: w, h: h * 0.54 } }
        : { a: { x: 0, y: 0, w: w * 0.4, h: h }, b: { x: w * 0.42, y: 0, w: w * 0.58, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawBeam(T, P.a); drawYear(T, P.b);
    }
    function drawBeam(T, r) {
      var dec = decl(st.day, st.tilt), h = noonAlt(st.lat, dec);
      var gy = r.y + r.h - 46, cx = r.x + r.w / 2;
      var south = st.lat - dec / DEG >= 0;           // 태양이 남쪽(오른쪽에 그림)
      ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('정오의 햇빛 다발', r.x + 10, r.y + 18);
      // 땅
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(r.x + 8, gy, r.w - 16, 14);
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x + 8, gy); ctx.lineTo(r.x + r.w - 8, gy); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(south ? '북' : '남', r.x + 10, gy + 30); ctx.textAlign = 'right'; ctx.fillText(south ? '남' : '북', r.x + r.w - 10, gy + 30);
      if (h <= 0) {
        ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted; ctx.font = '13px ' + T.fontBody;
        ctx.fillText('정오에도 태양이 지평선 아래 (극야)', cx, r.y + r.h * 0.45);
        return;
      }
      var a = h * DEG, W = Math.min(56, r.w * 0.16);         // 다발 폭(빛에 수직)
      var foot = W / Math.sin(a);                             // 지면에 닿는 길이
      var maxFoot = r.w - 40, s = foot > maxFoot ? maxFoot / foot : 1;
      var fd = foot * s;
      var x0 = cx - fd / 2, x1 = cx + fd / 2;
      var ux = Math.cos(a), uy = -Math.sin(a);                // 지면에서 태양 쪽 방향(오른쪽 위)
      var L = Math.max(r.h, r.w) * 1.2;
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y + 26, r.w, gy - r.y - 26); ctx.clip();
      ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.lineTo(x1 + ux * L, gy + uy * L); ctx.lineTo(x0 + ux * L, gy + uy * L); ctx.closePath();
      ctx.globalAlpha = 0.55; ctx.fillStyle = T.figSoftAmber; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.2;
      for (var i = 0; i <= 4; i++) {
        var xx = x0 + (x1 - x0) * i / 4;
        ctx.beginPath(); ctx.moveTo(xx + ux * L, gy + uy * L); ctx.lineTo(xx, gy); ctx.stroke();
      }
      ctx.restore();
      // 지면에 닿는 넓이
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('비추는 넓이 ∝ 1/sin h = ' + (1 / Math.sin(a)).toFixed(2) + '배', cx, gy + 30);
      // 고도각 호
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.arc(x0, gy, 30, -a, 0); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('h = ' + h.toFixed(1) + '°', Math.min(x0 + 36, r.x + r.w - 70), gy - 8);
      // 태양
      var sx = cx + ux * Math.min(r.w, r.h) * 0.42, sy = gy + uy * Math.min(r.w, r.h) * 0.42;
      sx = Math.max(r.x + 20, Math.min(r.x + r.w - 20, sx)); sy = Math.max(r.y + 40, sy);
      ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      if (!south) { ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('(태양이 천정의 북쪽)', cx, r.y + 36); }
    }
    function drawYear(T, r) {
      var L = r.x + 44, R = r.x + r.w - 48, Tp = r.y + 30, B = r.y + r.h - 40;
      var sx = function (d) { return L + d / 365 * (R - L); };
      var maxQ = 600;
      var syL = function (hh) { return B - hh / 24 * (B - Tp); };
      var syQ = function (q) { return B - q / maxQ * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono;
      [0, 6, 12, 18, 24].forEach(function (hh) {
        ctx.beginPath(); ctx.moveTo(L, syL(hh)); ctx.lineTo(R, syL(hh)); ctx.stroke();
        ctx.fillStyle = T.figBlue; ctx.textAlign = 'right'; ctx.fillText(hh, L - 6, syL(hh) + 4);
        ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.fillText(Math.round(hh / 24 * maxQ), R + 6, syL(hh) + 4);
      });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      var narrow = r.w < 370;
      MONTH0.forEach(function (d, i) { if (!narrow || i % 2 === 0) ctx.fillText((i + 1) + '월', sx(d + 15), B + 15); });
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText(narrow ? '— 낮 길이(시간)' : '— 낮의 길이 (시간)', L - 30, Tp - 14);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'right'; ctx.fillText(narrow ? '일사량(W/m²) —' : '하루 평균 일사량 (W/m²) —', R + 34, Tp - 14);
      // 곡선
      function curve(fn, sy, col, dash) {
        ctx.beginPath();
        for (var d = 0; d <= 365; d += 1) { var y = sy(fn(d)); if (d === 0) ctx.moveTo(sx(d), y); else ctx.lineTo(sx(d), y); }
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
      }
      curve(function (d) { return dayLen(st.lat, decl(d, st.tilt)); }, syL, T.figBlue);
      curve(function (d) { return Math.max(0, daily(st.lat, decl(d, st.tilt), d)); }, syQ, T.figRed);
      // 현재 날짜
      var x = sx(st.day);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x, Tp); ctx.lineTo(x, B); ctx.stroke(); ctx.setLineDash([]);
      var dec = decl(st.day, st.tilt);
      dot(x, syL(dayLen(st.lat, dec)), T.figBlue, T);
      dot(x, syQ(Math.max(0, daily(st.lat, dec, st.day))), T.figRed, T);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = x > (L + R) / 2 ? 'right' : 'left';
      ctx.fillText(dateStr(st.day), x + (x > (L + R) / 2 ? -6 : 6), Tp + 12);
    }
    function dot(x, y, c, T) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke(); }

    api.onResize(draw);
    update();
  },
});
