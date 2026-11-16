/* 지구시스템과학 1 지진파와 지구 내부: P파·S파의 경로와 그림자대 (2D) */
Sims.register('seismic-waves', {
  title: '지구 속을 지나는 지진파 — P파와 S파의 그림자대',
  caption: '진원 위치를 옮기고 P파·S파를 골라 \'지진 발생\'을 눌러 보자. 깊이에 따라 속력이 빨라지므로 지진파는 아래로 볼록하게 휘어 지표로 돌아오고, 액체인 외핵에서 S파는 사라지며 P파는 크게 꺾여 들어가 각거리 약 103°~142°에 P파 그림자대가, 약 103° 이상에 S파 그림자대가 생긴다. 지각을 생략하고 맨틀·외핵·내핵 안에서 속력이 깊이에 따라 고르게 변한다고 단순화한 층 모형으로 경로를 계산했으며, 반사파와 경계에서 바뀌어 생기는 파는 그리지 않았다.',
  init: function (api) {
    var R = 6371, RC = 3480, RI = 1220;
    // [깊이(km), 속력(km/s)] — 단순화한 층 모형
    var PM = [[0, 8.0], [660, 10.7], [2400, 13.6], [2891, 13.6]], PC = [[2891, 8.0], [5151, 10.6]], PI = [[5151, 11.0], [6371, 11.3]];
    var K = 1.82;  // S파 속력 = P파 속력 / 1.82 (맨틀)
    function interp(T, d) {
      for (var k = 0; k < T.length - 1; k++) if (d <= T[k + 1][0]) return T[k][1] + (T[k + 1][1] - T[k][1]) * (d - T[k][0]) / (T[k + 1][0] - T[k][0]);
      return T[T.length - 1][1];
    }
    function vP(r) { var d = R - r; return r > RC ? interp(PM, d) : r > RI ? interp(PC, d) : interp(PI, d); }
    function vS(r) { return r > RC ? interp(PM, R - r) / K : 0; }
    var LAYERS = [[RC, R], [RI, RC], [0, RI]];

    // 광선 매개변수 p = r·sin i / v 가 보존된다. 각 층에서 r = a + u² 로 치환해 적분.
    function trace(p, v, sOnly) {
      var pts = [{ r: R, th: 0, t: 0 }], th = 0, t = 0, stopped = false, turned = false;
      for (var L = 0; L < LAYERS.length; L++) {
        var lo = LAYERS[L][0], hi = LAYERS[L][1];
        if (sOnly && hi <= RC) { stopped = true; break; }
        var eta = function (r) { return r / v(r); };
        var a = lo, turns = false;
        var etaLo = lo > 0 ? lo / v(lo + 1e-6) : 0;
        if (etaLo < p) {
          var x = lo + 1e-6, y = hi - 1e-6;
          for (var i = 0; i < 50; i++) { var m = (x + y) / 2; if (eta(m) < p) x = m; else y = m; }
          a = y; turns = true;
        }
        var U = Math.sqrt(hi - a), N = 70;
        for (var j = N - 1; j >= 0; j--) {
          var u = (j + 0.5) * U / N, r = a + u * u, e = eta(r), dd = e * e - p * p;
          if (dd > 0) { var w = 2 * u * U / N / (r * Math.sqrt(dd)); th += p * w; t += e * e * w; }
          pts.push({ r: a + (j * U / N) * (j * U / N), th: th, t: t });
        }
        if (turns) { turned = true; break; }
      }
      if (stopped) return { pts: pts, end: 'stop', delta: null };
      var n = pts.length, TH = th, TT = t;
      for (var q = n - 2; q >= 0; q--) pts.push({ r: pts[q].r, th: 2 * TH - pts[q].th, t: 2 * TT - pts[q].t });
      return { pts: pts, end: 'surface', delta: 2 * TH * 180 / Math.PI };
    }
    var etaC_P = RC / vP(RC + 1e-6), etaI_P = RI / vP(RI + 1e-6), eta0_P = R / vP(R), eta0_S = R / vS(R), etaC_S = RC / vS(RC + 1e-6);
    // 그림자대 경계 계산
    var pStart = trace(etaC_P * 1.0001, vP).delta, pEnd = 999;
    for (var k = 1; k < 90; k++) { var dk = trace(etaI_P + (etaC_P - etaI_P) * k / 90, vP).delta; if (dk < pEnd) pEnd = dk; }
    var sStart = trace(etaC_S * 1.0001, vS).delta;

    var mantleI = [20, 22, 24.5, 27.5, 31, 36, 42, 50, 60, 72];
    var raysP = [], raysS = [];
    mantleI.forEach(function (i0) { raysP.push({ ray: trace(eta0_P * Math.sin(i0 * Math.PI / 180), vP), kind: 'm' }); });
    [9.6, 11, 12.5, 14, 15.5, 17, 18.3].forEach(function (i0) { raysP.push({ ray: trace(eta0_P * Math.sin(i0 * Math.PI / 180), vP), kind: 'c' }); });
    [2.5, 5, 7.3].forEach(function (i0) { raysP.push({ ray: trace(eta0_P * Math.sin(i0 * Math.PI / 180), vP), kind: 'i' }); });
    [21, 23.2, 26, 29.2, 33.5, 39, 46, 55, 66].forEach(function (i0) { raysS.push({ ray: trace(eta0_S * Math.sin(i0 * Math.PI / 180), vS), kind: 'm' }); });
    [8, 12, 16].forEach(function (i0) { raysS.push({ ray: trace(eta0_S * Math.sin(i0 * Math.PI / 180), vS, true), kind: 's' }); });
    var TMAX = 0;
    raysP.concat(raysS).forEach(function (o) { var pp = o.ray.pts; TMAX = Math.max(TMAX, pp[pp.length - 1].t); });

    var state = { show: 'both', src: 0, t: TMAX, playing: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.2 : 0.64; }, label: '지구 단면에서 진원으로부터 퍼지는 P파와 S파의 경로, 그림자대' });
    var ctx = cv.ctx;
    var rT = api.readout('진원에서 출발한 뒤');
    var rP = api.readout('P파 그림자대');
    var rS = api.readout('S파 그림자대');
    rP.set('각거리 약 ' + Math.round(pStart) + '°~' + Math.round(pEnd) + '°');
    rS.set('각거리 약 ' + Math.round(sStart) + '° 이상');

    var g = api.group();
    var modes = [['both', '둘 다'], ['P', 'P파만'], ['S', 'S파만']];
    var mb = modes.map(function (m, i) {
      return api.button(m[1], function () { state.show = m[0]; mb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    api.slider({ id: 'seismic-waves-src', label: '진원 위치', min: -180, max: 180, step: 5, value: 0,
      format: function (v) { return v === 0 ? '북쪽 꼭대기' : (v > 0 ? '시계 방향 ' : '반시계 방향 ') + Math.abs(v) + '°'; },
      onInput: function (v) { state.src = v; draw(); } });
    api.button('지진 발생', function () {
      if (api.reduced) { state.t = TMAX; draw(); return; }
      state.t = 0; loop.play();
    }, { primary: true });

    var loop = api.loop(function (dt) {
      state.t += dt * TMAX / 9;
      if (state.t >= TMAX) { state.t = TMAX; loop.pause(); }
      draw();
    });
    loop.pause();

    function geom() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      if (narrow) { var rr = Math.min(w / 2 - 40, h * 0.36); return { cx: w / 2, cy: rr + 38, R: rr, narrow: true, lx: 12, ly: 2 * rr + 82 }; }
      var R2 = Math.min(h / 2 - 40, w * 0.33);
      return { cx: R2 + 52, cy: h / 2, R: R2, narrow: false, lx: 2 * R2 + 120, ly: 40 };
    }
    function XY(G, r, thDeg) { var a = thDeg * Math.PI / 180, s = G.R * r / R; return [G.cx + s * Math.sin(a), G.cy - s * Math.cos(a)]; }

    function draw() {
      var T = api.tokens(), G = geom(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      // 층
      [[R, T.figSoftAmber], [RC, T.figSoftTeal], [RI, T.figSoftViolet]].forEach(function (L) {
        ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R * L[0] / R, 0, Math.PI * 2); ctx.fillStyle = L[1]; ctx.fill();
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke();
      });
      // 층 이름 (진원 반대쪽 아래에)
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      var lab = function (r, txt) { var p = XY(G, r, state.src + 180); ctx.fillText(txt, p[0], p[1] + 4); };
      lab((R + RC) / 2, '맨틀(고체)'); lab((RC + RI) / 2, '외핵(액체)'); lab(RI * 0.25, '내핵');
      // 그림자대 띠
      var sideArc = function (rad, d0, d1, col, width) {
        [1, -1].forEach(function (sg) {
          ctx.beginPath();
          for (var d = d0; d <= d1 + 0.01; d += 1) { var a = (state.src + sg * d - 90) * Math.PI / 180, x = G.cx + rad * Math.cos(a), y = G.cy + rad * Math.sin(a); if (d === d0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
          ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = 'butt'; ctx.stroke();
        });
      };
      var showP = state.show !== 'S', showS = state.show !== 'P';
      if (showS) sideArc(G.R + 14, sStart, 180, T.figRed, 6);
      if (showP) sideArc(G.R + 6, pStart, pEnd, T.figBlue, 6);
      // 각거리 눈금
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var d = 0; d <= 180; d += 30) {
        [1, -1].forEach(function (sg) {
          if (sg < 0 && (d === 0 || d === 180)) return;
          if (G.narrow && sg < 0 && d % 60 !== 0) return;
          var p1 = XY(G, R, state.src + sg * d), p2 = XY(G, R * 1.03, state.src + sg * d), p3 = XY(G, R * (G.narrow ? 1.17 : 1.15), state.src + sg * d);
          ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
          ctx.fillText(d + '°', p3[0], p3[1] + 4);
        });
      }
      // 광선
      function drawRays(list, col) {
        list.forEach(function (o) {
          var pts = o.ray.pts, faint = o.kind === 'i';
          [1, -1].forEach(function (sg) {
            ctx.beginPath(); var last = null, first = true;
            for (var i = 0; i < pts.length; i++) {
              var pt = pts[i];
              if (pt.t > state.t) {
                if (i > 0) { var pr = pts[i - 1], f = (state.t - pr.t) / (pt.t - pr.t); pt = { r: pr.r + (pt.r - pr.r) * f, th: pr.th + (pt.th - pr.th) * f }; }
                else break;
                var q = XY(G, pt.r, state.src + sg * pt.th * 180 / Math.PI); ctx.lineTo(q[0], q[1]); last = q; break;
              }
              var p = XY(G, pt.r, state.src + sg * pt.th * 180 / Math.PI);
              if (first) { ctx.moveTo(p[0], p[1]); first = false; } else ctx.lineTo(p[0], p[1]);
              last = p;
            }
            ctx.strokeStyle = col; ctx.globalAlpha = faint ? 0.55 : 0.9; ctx.lineWidth = faint ? 1.2 : 1.6;
            ctx.setLineDash(faint ? [4, 4] : []); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
            var done = state.t >= pts[pts.length - 1].t;
            if (last && !done) { ctx.beginPath(); ctx.arc(last[0], last[1], 2.6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
            if (done && o.ray.end === 'stop' && last) {
              ctx.strokeStyle = col; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(last[0] - 4, last[1] - 4); ctx.lineTo(last[0] + 4, last[1] + 4); ctx.moveTo(last[0] + 4, last[1] - 4); ctx.lineTo(last[0] - 4, last[1] + 4); ctx.stroke();
            }
          });
        });
      }
      if (showS) drawRays(raysS, T.figRed);
      if (showP) drawRays(raysP, T.figBlue);
      // 진원
      var s0 = XY(G, R, state.src);
      ctx.beginPath(); ctx.arc(s0[0], s0[1], 6, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
      var sl = XY(G, R * 1.3, state.src);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('진원', sl[0], sl[1] + 4);
      // 범례
      var lx = G.lx, ly = G.ly, rows = [];
      if (showP) rows.push([T.figBlue, 'line', 'P파 경로']);
      if (showP) rows.push([T.figBlue, 'dash', '내핵을 지난 약한 P파']);
      if (showS) rows.push([T.figRed, 'line', 'S파 경로 (× 외핵에서 사라짐)']);
      if (showP) rows.push([T.figBlue, 'band', 'P파 그림자대 ' + Math.round(pStart) + '°~' + Math.round(pEnd) + '°']);
      if (showS) rows.push([T.figRed, 'band', 'S파 그림자대 ' + Math.round(sStart) + '° 이상']);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var colW = G.narrow ? (w - 24) / 2 : 0;
      rows.forEach(function (rw, i) {
        var x = lx + (G.narrow ? (i % 2) * colW : 0), y = ly + (G.narrow ? Math.floor(i / 2) * 20 : i * 22);
        ctx.strokeStyle = rw[0]; ctx.setLineDash(rw[1] === 'dash' ? [4, 4] : []);
        ctx.lineWidth = rw[1] === 'band' ? 6 : 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 22, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(rw[2], x + 28, y + 4);
      });
      if (!G.narrow) {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
        var notes = ['깊어질수록 빨라져 경로가 휜다', '외핵에서 P파가 느려져 꺾인다', '눈금: 진원에서 잰 각거리'];
        notes.forEach(function (s, i) { ctx.fillText(s, lx, ly + rows.length * 22 + 14 + i * 18); });
      }
      var mins = Math.floor(state.t / 60), secs = Math.round(state.t % 60);
      rT.set(state.t >= TMAX ? '모든 경로 표시' : mins + '분 ' + secs + '초');
    }
    api.onResize(draw);
    draw();
  },
});
