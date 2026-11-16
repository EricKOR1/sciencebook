/* 중3-2 날씨와 기후변화: 공기 덩어리가 올라가며 단열 팽창 → 기온 하강 → 이슬점 도달 → 구름 */
Sims.register('cloud-formation', {
  title: '공기 덩어리가 올라가면 어디서 구름이 생길까?',
  caption: '지표 기온과 수증기량을 정하고 ‘올려 보내기’를 눌러 보자. 공기 덩어리는 올라갈수록 부피가 커지고(단열 팽창) 기온이 낮아지며, 기온이 이슬점까지 내려가 상대습도가 100 %가 되는 높이부터 수증기가 응결하여 구름이 생긴다. 지표 기온과 이슬점의 차이가 클수록(공기가 건조할수록) 구름 밑면이 높아진다. 포화 수증기량은 본문의 표(0~30 °C)와 같은 값을 쓰고, 공기 덩어리의 수증기량은 응결 전까지 그대로라고 단순화했다. 높이와 기온이 내려가는 정도는 수치 없이 나타냈다.',
  init: function (api) {
    var TABLE = [[0, 3.8], [5, 5.4], [10, 7.6], [15, 10.6], [20, 14.7], [25, 20.0], [30, 27.1]];
    var K = 37;          // 화면 높이 전체를 오르는 동안 낮아지는 기온(내부 계산용, 화면에 표시하지 않음)
    var st = { T0: 25, q: 10.6, p: 1, anim: false, ghosts: [] };

    function sat(T) {    // 포화 수증기량(g/kg): 본문의 표와 같은 값을 주는 식(1기압)
      var es = 6.112 * Math.exp(17.67 * T / (T + 243.5));
      return 622 * es / (1013.25 - es);
    }
    function dew(q) { var lo = -40, hi = 40; for (var i = 0; i < 50; i++) { var m = (lo + hi) / 2; if (sat(m) < q) lo = m; else hi = m; } return (lo + hi) / 2; }
    function model() {
      var ws0 = sat(st.T0), q = Math.min(st.q, ws0), Td = st.q >= ws0 ? st.T0 : dew(q);
      var pb = (st.T0 - Td) / K, pend = Math.min(0.97, pb + 0.3);
      return { ws0: ws0, q: q, Td: Td, pb: pb, pend: pend, fog: st.q >= ws0 - 1e-9 };
    }
    function parcel(M, p) {
      if (p <= M.pb) { var T = M.T0 - K * p; return { T: T, q: M.q, rh: M.q / sat(T), cloud: false }; }
      var T2 = M.Td - 0.5 * K * (p - M.pb);
      return { T: T2, q: sat(T2), rh: 1, cloud: true };
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.58; }, label: '올라가는 공기 덩어리와 구름, 포화 수증기량 곡선' });
    var ctx = cv.ctx;
    var rTd = api.readout('이슬점');
    var rRh = api.readout('지표 상대습도');
    var rT = api.readout('공기 덩어리 기온');
    var rS = api.readout('상태');

    api.slider({ id: 'cloud-formation-t', label: '지표 기온', min: 0, max: 30, step: 1, value: st.T0, format: function (v) { return v + ' °C'; },
      onInput: function (v) { st.T0 = v; st.p = model().pend; st.anim = false; loop.pause(); update(); } });
    api.slider({ id: 'cloud-formation-q', label: '수증기량 (공기 1 kg당)', min: 3.8, max: 27.1, step: 0.1, value: st.q, format: function (v) { return v.toFixed(1) + ' g'; },
      onInput: function (v) { st.q = v; st.p = model().pend; st.anim = false; loop.pause(); update(); } });
    api.button('올려 보내기', function () { launch(); }, { primary: true });

    var lastBase = null;
    function remember() { var M = model(); lastBase = M.pb; }
    function launch() {
      var M = model(); lastBase = M.pb;
      if (api.reduced) { st.p = M.pend; update(); return; }
      st.p = 0; st.anim = true; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!st.anim) { loop.pause(); return; }
      var M = model();
      st.p += dt * 0.22;
      if (st.p >= M.pend) { st.p = M.pend; st.anim = false; loop.pause(); }
      update();
    });
    loop.pause();

    function update() {
      var M = model(); M.T0 = st.T0;
      var P = parcel(M, st.p);
      rTd.set(M.Td.toFixed(1) + ' °C');
      rRh.set(Math.round(M.q / M.ws0 * 100) + ' %');
      rT.set(P.T.toFixed(1) + ' °C');
      rS.set(M.fog ? '지표에서 이미 포화 → 안개' : P.cloud ? '이슬점 도달 → 응결, 구름' : '상대습도 ' + Math.round(P.rh * 100) + ' % (아직 구름 없음)');
      draw(M, P);
    }

    function lerpHex(a, b, t) {
      function h(c) { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join(''); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
      var A = h(a), B = h(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(A[i] + (B[i] - A[i]) * t); }).join(',') + ')';
    }
    function draw(M, P) {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var S = narrow ? { x: 0, y: 0, w: w, h: h * 0.52 } : { x: 0, y: 0, w: w * 0.46, h: h };
      var G = narrow ? { x: 0, y: h * 0.55, w: w, h: h * 0.45 } : { x: w * 0.5, y: 0, w: w * 0.5, h: h };
      drawScene(T, S, M, P); drawGraph(T, G, M, P);
    }
    function drawScene(T, r, M, P) {
      var gy = r.y + r.h - 26, ty = r.y + 18, ax = r.x + 34;
      function Y(p) { return gy - p * (gy - ty); }
      // 하늘과 땅
      ctx.fillStyle = T.figPaper; ctx.fillRect(r.x, r.y, r.w, gy - r.y);
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(r.x, gy, r.w, r.y + r.h - gy);
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, gy); ctx.lineTo(r.x + r.w, gy); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('지표', r.x + 8, gy + 17);
      // 높이 축: 위로 갈수록 차가워지는 띠
      var grd = ctx.createLinearGradient(0, gy, 0, ty);
      grd.addColorStop(0, T.figRed); grd.addColorStop(1, T.figBlue);
      ctx.fillStyle = grd; ctx.fillRect(ax - 5, ty + 8, 10, gy - ty - 8);
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.moveTo(ax, ty - 4); ctx.lineTo(ax - 8, ty + 10); ctx.lineTo(ax + 8, ty + 10); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(ax - 16, (ty + gy) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.fillText('높이 ↑  올라갈수록 기압·기온이 낮아진다', 0, 0); ctx.restore();
      var cx = r.x + r.w * 0.58;
      // 이전 구름 밑면
      if (lastBase != null && Math.abs(lastBase - M.pb) > 0.01 && lastBase < 1) {
        var ly = Y(Math.max(0, lastBase));
        ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax + 14, ly); ctx.lineTo(r.x + r.w - 4, ly); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('이전 구름 밑면', r.x + r.w - 6, ly - 4);
      }
      // 구름 (밑면 위로)
      var showCloud = st.p >= M.pb;
      var by = Y(M.pb);
      if (showCloud) {
        var top = Y(st.p) - 14, cw = r.w * 0.5;
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
        var puffs = [];
        var hh = Math.max(10, by - top), n = Math.max(3, Math.round(hh / 18));
        for (var i = 0; i < n; i++) {
          var t = i / Math.max(1, n - 1), yy = by - 10 - t * (hh - 10), ww = cw * (0.5 + 0.5 * (1 - Math.abs(t - 0.4)));
          puffs.push([cx - ww * 0.3, yy, 14 + 4 * (i % 2)], [cx, yy - 4, 17], [cx + ww * 0.3, yy, 14 + 3 * ((i + 1) % 2)]);
        }
        puffs.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.stroke(); });
        puffs.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], p[2] - 1, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = T.figPanel; ctx.fillRect(cx - cw * 0.48, by - 12, cw * 0.96, 12);
      }
      // 구름 밑면 선
      ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ax + 14, by); ctx.lineTo(r.x + r.w - 4, by); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(M.fog ? '지표에서 포화 (안개)' : '구름 밑면: 이슬점에 이르는 높이', ax + 16, by > gy - 20 ? by - 6 : by + 15);
      // 공기 덩어리 자취와 현재 위치
      var steps = st.anim ? [] : [0, 0.25, 0.5, 0.75].map(function (f) { return f * Math.min(M.pb, st.p); });
      steps.forEach(function (p) { blob(T, cx - r.w * 0.27, Y(p), p, M, 0.35); });
      blob(T, st.anim ? cx : cx - r.w * 0.27, Y(st.p), st.p, M, 1);
      if (!st.anim) { ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('공기 덩어리', cx - r.w * 0.27, gy - 4 - 22); }
      function blob(T, x, y, p, M, alpha) {
        var rad = 12 * (1 + 0.7 * p), PP = parcel(M, p), t = Math.max(0, Math.min(1, (M.T0 - PP.T) / 30));
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(x, y - rad, rad, 0, Math.PI * 2);
        ctx.fillStyle = lerpHex(T.figSoftRed, T.figSoftBlue, t); ctx.fill();
        ctx.strokeStyle = lerpHex(T.figRed, T.figBlue, t); ctx.lineWidth = 2; ctx.stroke();
        if (PP.cloud && alpha === 1) { for (var k = 0; k < 6; k++) { var a = k * 1.05; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rad * 0.5, y - rad + Math.sin(a) * rad * 0.5, 2.2, 0, Math.PI * 2); ctx.fillStyle = T.figBlue; ctx.fill(); } }
        ctx.globalAlpha = 1;
        if (alpha === 1) {
          // 부풀어 오르는 화살표(팽창)
          ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
          [[-1, 0], [1, 0]].forEach(function (d) { var x0 = x + d[0] * (rad + 3), x1 = x + d[0] * (rad + 11); ctx.beginPath(); ctx.moveTo(x0, y - rad); ctx.lineTo(x1, y - rad); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x1, y - rad); ctx.lineTo(x1 - d[0] * 4, y - rad - 3); ctx.lineTo(x1 - d[0] * 4, y - rad + 3); ctx.closePath(); ctx.fillStyle = T.figMuted; ctx.fill(); });
        }
      }
    }
    function drawGraph(T, r, M, P) {
      var L = r.x + 52, R = r.x + r.w - 14, Tp = r.y + 26, B = r.y + r.h - 40;
      var X = function (t) { return L + (t + 10) / 42 * (R - L); }, Yq = function (q) { return B - q / 30 * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('포화 수증기량 곡선', L, r.y + 14);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'right';
      [0, 10, 20, 30].forEach(function (q) { ctx.beginPath(); ctx.moveTo(L, Yq(q)); ctx.lineTo(R, Yq(q)); ctx.stroke(); ctx.fillText(q, L - 6, Yq(q) + 4); });
      ctx.textAlign = 'center';
      [-10, 0, 10, 20, 30].forEach(function (t) { ctx.fillText(t, X(t), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('기온 (°C)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('수증기량 (g/kg)', 0, 0); ctx.restore();
      // 곡선
      ctx.beginPath(); for (var t = -10; t <= 31; t += 0.5) { var x = X(t), y = Yq(sat(t)); if (t === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2.2; ctx.stroke();
      TABLE.forEach(function (p) { ctx.beginPath(); ctx.arc(X(p[0]), Yq(p[1]), 3.5, 0, Math.PI * 2); ctx.fillStyle = T.figTeal; ctx.fill(); });
      ctx.fillStyle = T.figTeal; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('포화 (상대습도 100 %)', X(29), Yq(29.5));
      // 공기 덩어리의 경로
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(X(M.T0), Yq(M.q)); ctx.lineTo(X(M.Td), Yq(M.q)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(M.Td), Yq(M.q)); ctx.lineTo(X(M.Td), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figAccent; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('이슬점', X(M.Td), B - 6);
      // 지표 공기 점
      ctx.beginPath(); ctx.arc(X(M.T0), Yq(M.q), 5, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
      ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.fillText('지표 공기', Math.min(X(M.T0) + 7, R - 50), Yq(M.q) + 16);
      // 현재 점
      ctx.beginPath(); ctx.arc(X(P.T), Yq(P.q), 6, 0, Math.PI * 2); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.5; ctx.stroke();
      if (P.cloud) {
        ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(P.T) + 10, Yq(M.q)); ctx.lineTo(X(P.T) + 10, Yq(P.q)); ctx.stroke();
        ctx.fillStyle = T.figBlue; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody; ctx.fillText('응결한 양', X(P.T) + 14, (Yq(M.q) + Yq(P.q)) / 2 + 4);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('← 올라갈수록 기온이 낮아진다', L + 4, Tp + 12);
    }

    api.onResize(update);
    st.p = model().pend; lastBase = model().pb;
    update();
  },
});
