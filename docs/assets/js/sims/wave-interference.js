/* 물리학 3 빛과 물질: 이중 슬릿 간섭 — 두 슬릿에서 나온 파동의 보강·상쇄와 무늬 간격 Δx = Lλ/d */
Sims.register('wave-interference', {
  title: '이중 슬릿 간섭 — 파장, 슬릿 간격, 스크린 거리와 무늬 간격',
  caption: '파장 λ, 슬릿 간격 d, 스크린까지의 거리 L을 바꾸어 보자. 위 그림은 두 슬릿에서 나온 파동이 겹치는 모습을 위에서 본 모식도로, 밝은 곳은 마루, 어두운 곳은 골이다. 마루와 마루가 만나는 보강 간섭 방향에는 밝은 무늬가, 마루와 골이 만나는 상쇄 간섭 방향에는 어두운 무늬가 생긴다. 아래 띠는 실제 크기 눈금(mm)으로 계산한 스크린 무늬이며 무늬 간격은 Δx = Lλ/d를 따른다. 모식도는 파장과 슬릿 간격을 크게 과장했고, 슬릿 폭에 의한 밝기 변화는 무시했다.',
  init: function (api) {
    var st = { lam: 650, d: 0.25, L: 2.0, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.62; }, label: '이중 슬릿에서 나온 파동의 간섭 모식도와 스크린 무늬' });
    var ctx = cv.ctx;
    var off = document.createElement('canvas'), octx = off.getContext('2d'), img = null, geo = null;

    var rDx = api.readout('무늬 간격 Δx = Lλ/d');
    var rCol = api.readout('빛의 색');
    api.slider({ id: 'wave-interference-lam', label: '파장 λ', min: 400, max: 700, step: 10, value: st.lam, format: function (v) { return v + ' nm'; }, onInput: function (v) { st.lam = v; changed(); } });
    api.slider({ id: 'wave-interference-d', label: '슬릿 간격 d', min: 0.1, max: 0.5, step: 0.05, value: st.d, format: function (v) { return v.toFixed(2) + ' mm'; }, onInput: function (v) { st.d = v; changed(); } });
    api.slider({ id: 'wave-interference-l', label: '스크린 거리 L', min: 1, max: 3, step: 0.1, value: st.L, format: function (v) { return v.toFixed(1) + ' m'; }, onInput: function (v) { st.L = v; changed(); } });

    function rgbOf(nm) {
      var r = 0, g = 0, b = 0;
      if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
      else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else { r = 1; }
      var f = nm < 420 ? 0.4 + 0.6 * (nm - 400) / 20 : nm > 680 ? 0.4 + 0.6 * (700 - nm) / 20 : 1;
      f = Math.max(f, 0.45);
      return [Math.round(255 * Math.pow(r * f, 0.8)), Math.round(255 * Math.pow(g * f, 0.8)), Math.round(255 * Math.pow(b * f, 0.8))];
    }
    function colName(nm) { return nm < 450 ? '보라' : nm < 490 ? '파랑' : nm < 560 ? '초록' : nm < 590 ? '노랑' : nm < 620 ? '주황' : '빨강'; }
    function dxmm() { return st.L * st.lam * 1e-9 / (st.d * 1e-3) * 1e3; }
    function changed() { geo = null; readouts(); if (api.reduced || !loop.playing) draw(); }
    function readouts() { rDx.set(dxmm().toFixed(1) + ' mm'); rCol.set(colName(st.lam) + ' (' + st.lam + ' nm)'); }

    function layout() {
      var w = cv.w, h = cv.h;
      return { wave: { x: 0, y: 0, w: w, h: h * (w < 560 ? 0.6 : 0.64) }, strip: { x: 0, y: h * (w < 560 ? 0.63 : 0.67), w: w, h: h * (w < 560 ? 0.37 : 0.33) } };
    }
    // 모식도의 기하(픽셀 단위). 과장 배율은 λ/d 비율이 실제와 같은 방향으로 변하도록 잡는다
    function geometry(r) {
      var res = 2;   // 화면 2픽셀당 계산 1점
      var gw = Math.max(40, Math.floor(r.w / res)), gh = Math.max(30, Math.floor(r.h / res));
      var lamP = st.lam / 650 * 7, dP = st.d / 0.25 * 18;   // 계산 격자 단위
      var bx = Math.round(gw * 0.12), scrX = Math.round(bx + (gw - bx - 8) * (0.45 + 0.55 * (st.L - 1) / 2));
      var cy = gh / 2, s1 = cy - dP / 2, s2 = cy + dP / 2, k = 2 * Math.PI / lamP;
      var ph1 = new Float32Array(gw * gh), ph2 = new Float32Array(gw * gh), am1 = new Float32Array(gw * gh), am2 = new Float32Array(gw * gh);
      for (var j = 0; j < gh; j++) for (var i = 0; i < gw; i++) {
        var n = j * gw + i;
        if (i <= bx) { ph1[n] = k * (i - bx); am1[n] = 1; am2[n] = 0; continue; }
        if (i > scrX) { am1[n] = am2[n] = 0; continue; }
        var r1 = Math.hypot(i - bx, j - s1), r2 = Math.hypot(i - bx, j - s2);
        ph1[n] = k * r1; ph2[n] = k * r2; am1[n] = 0.75 / Math.sqrt(Math.max(r1, 4) / 6); am2[n] = 0.75 / Math.sqrt(Math.max(r2, 4) / 6);
      }
      off.width = gw; off.height = gh; img = octx.createImageData(gw, gh);
      return { gw: gw, gh: gh, res: r.w / gw, resY: r.h / gh, bx: bx, scrX: scrX, cy: cy, s1: s1, s2: s2, lamP: lamP, dP: dP, ph1: ph1, ph2: ph2, am1: am1, am2: am2, w: r.w, h: r.h };
    }

    var loop = api.loop(function (dt) { st.t += dt; draw(); });

    function draw() {
      var T = api.tokens(), Lo = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawWave(T, Lo.wave); drawStrip(T, Lo.strip);
    }
    function drawWave(T, r) {
      if (!geo || geo.w !== r.w || geo.h !== r.h) geo = geometry(r);
      var G = geo, data = img.data, col = rgbOf(st.lam), bg = T.dark ? [18, 24, 34] : [26, 32, 46];
      var wt = st.t * 2 * Math.PI * 0.9;
      for (var n = 0; n < G.gw * G.gh; n++) {
        var v = 0, i = n % G.gw;
        if (i <= G.bx) v = Math.cos(G.ph1[n] - wt) * 0.8;
        else if (G.am1[n] > 0) v = G.am1[n] * Math.cos(G.ph1[n] - wt) + G.am2[n] * Math.cos(G.ph2[n] - wt);
        else { v = -9; }
        var o = n * 4;
        if (v === -9) { data[o] = bg[0]; data[o + 1] = bg[1]; data[o + 2] = bg[2]; data[o + 3] = 255; continue; }
        var q = Math.max(0, Math.min(1, 0.5 + v * 0.32));
        data[o] = bg[0] + (col[0] - bg[0]) * q; data[o + 1] = bg[1] + (col[1] - bg[1]) * q; data[o + 2] = bg[2] + (col[2] - bg[2]) * q; data[o + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, r.x, r.y, r.w, r.h);
      var X = function (i) { return r.x + i * G.res; }, Y = function (j) { return r.y + j * G.resY; };
      // 슬릿 가림판
      ctx.fillStyle = T.figLine;
      var gap = 2.2;
      ctx.fillRect(X(G.bx) - 3, r.y, 6, Y(G.s1 - gap) - r.y);
      ctx.fillRect(X(G.bx) - 3, Y(G.s1 + gap), 6, Y(G.s2 - gap) - Y(G.s1 + gap));
      ctx.fillRect(X(G.bx) - 3, Y(G.s2 + gap), 6, r.y + r.h - Y(G.s2 + gap));
      // 스크린과 그 위의 밝기(시간 평균)
      var sx = X(G.scrX);
      for (var j = 0; j < G.gh; j++) {
        var r1 = Math.hypot(G.scrX - G.bx, j - G.s1), r2 = Math.hypot(G.scrX - G.bx, j - G.s2);
        var I = Math.pow(Math.cos(Math.PI * (r1 - r2) / G.lamP), 2), c = rgbOf(st.lam);
        ctx.fillStyle = 'rgb(' + Math.round(c[0] * I) + ',' + Math.round(c[1] * I) + ',' + Math.round(c[2] * I) + ')';
        ctx.fillRect(sx, Y(j), 10, G.resY + 0.5);
      }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.strokeRect(sx, r.y, 10, r.h);
      // 보강·상쇄 방향 표시
      var mx = X(G.bx), my = Y(G.cy), maxM = 3;
      ctx.lineWidth = 1.2; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
      for (var m = 0; m <= maxM; m++) {
        [[m, '#ffffff', '보강'], [m + 0.5, '#9aa6b8', '상쇄']].forEach(function (e) {
          var s = e[0] * G.lamP / G.dP; if (s >= 0.95) return;
          var th = Math.asin(s);
          [1, -1].forEach(function (sg) {
            if (e[0] === 0 && sg < 0) return;
            var ex = sx - 4, ey = my + sg * Math.tan(th) * (ex - mx);
            if (ey < r.y + 4 || ey > r.y + r.h - 4) return;
            ctx.strokeStyle = e[1]; ctx.globalAlpha = 0.85; ctx.setLineDash(e[2] === '보강' ? [6, 4] : [2, 4]);
            ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
            if (m <= 1) {
              ctx.fillStyle = e[1]; ctx.textAlign = 'right';
              ctx.fillText(e[2], sx - 8, ey + (sg > 0 ? 13 : -5));
            }
          });
        });
      }
      ctx.restore();
      ctx.fillStyle = '#ffffff'; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('위에서 본 모식도 (파장·슬릿 간격 과장)', r.x + 8, r.y + 15);
      ctx.fillText('빛 →', r.x + 8, r.y + r.h - 8);
      ctx.textAlign = 'right'; ctx.fillText('스크린', sx - 4, r.y + 15);
    }
    function drawStrip(T, r) {
      var range = 15, L = r.x + 20, R = r.x + r.w - 20, sxm = function (mm) { return (L + R) / 2 + mm / range * (R - L) / 2; };
      var top = r.y + 26, bh = Math.min(40, r.h * 0.3), c = rgbOf(st.lam), dx = dxmm();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('스크린에 생긴 무늬 (실제 크기 눈금)', L, r.y + 14);
      for (var px = L; px <= R; px++) {
        var mm = (px - (L + R) / 2) / ((R - L) / 2) * range, I = Math.pow(Math.cos(Math.PI * mm / dx), 2);
        ctx.fillStyle = 'rgb(' + Math.round(c[0] * I) + ',' + Math.round(c[1] * I) + ',' + Math.round(c[2] * I) + ')';
        ctx.fillRect(px, top, 1.2, bh);
      }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, top, R - L, bh);
      // 밝기 곡선
      var gT = top + bh + 6, gB = r.y + r.h - 22;
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.6; ctx.beginPath();
      for (var p2 = L; p2 <= R; p2 += 1) { var m2 = (p2 - (L + R) / 2) / ((R - L) / 2) * range, I2 = Math.pow(Math.cos(Math.PI * m2 / dx), 2); var y = gB - I2 * (gB - gT); if (p2 === L) ctx.moveTo(p2, y); else ctx.lineTo(p2, y); }
      ctx.stroke();
      ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, gB); ctx.lineTo(R, gB); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var stepT = (R - L) < 400 ? 10 : 5;
      for (var t = -range; t <= range; t += stepT) { ctx.fillRect(sxm(t) - 0.5, gB, 1, 4); ctx.fillText(t, sxm(t), gB + 15); }
      ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontBody; ctx.fillText('mm', R, gB + 15);
      // Δx 표시: 가운데 밝은 무늬와 다음 밝은 무늬 사이
      if (dx < range) {
        var a = sxm(0), b = sxm(dx), yy = top - 6;
        ctx.strokeStyle = T.figInk; ctx.fillStyle = T.figInk; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(a, yy); ctx.lineTo(b, yy); ctx.stroke();
        [a, b].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, yy - 4); ctx.lineTo(x, yy + 4); ctx.stroke(); });
        ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('Δx = ' + dx.toFixed(1) + ' mm', b + 6, yy + 4);
      }
    }

    api.onResize(function () { geo = null; draw(); });
    readouts(); draw();
  },
});
