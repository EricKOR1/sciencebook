/* 일반생명과학 12 근육: 근육 원섬유 마디의 길이에 따른 필라멘트 겹침과 길이–장력 곡선 */
Sims.register('u-sarcomere', {
  title: '근절 길이와 장력 — 겹침이 힘을 정한다',
  caption: '근절 길이 슬라이더를 움직이거나 "늘였다 줄이기"를 눌러 보자. 2.2 μm보다 길면 액틴과 겹치는 마이오신 머리(진한 빨강)가 줄어 힘이 직선으로 줄고, 3.6 μm에서는 겹침이 없어 힘이 0이다. 2.0~2.2 μm에서는 모든 머리가 겹쳐 힘이 최대이다. A대는 언제나 1.6 μm이고 I대와 H대만 변한다. 본문의 단순 모형(마이오신 1.6 μm, 가운데 맨 부분 0.2 μm, 액틴 1.0 μm)으로 그렸으며, 2.0 μm보다 짧은 쪽(액틴끼리 겹침, 마이오신이 Z선에 닿음)의 곡선은 실험 결과를 단순화한 근사이다.',
  init: function (api) {
    var THICK = 1.6, BARE = 0.2, THIN = 1.0, HEAD = (THICK - BARE) / 2;   // μm
    var LMIN = 1.3, LMAX = 3.8;
    var s = { L: 2.5, trail: [] };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.56; }, label: '근절 모식도와 길이-장력 곡선' });
    var ctx = cv.ctx;

    var rL = api.readout('근절 길이');
    var rA = api.readout('A대');
    var rI = api.readout('I대');
    var rH = api.readout('H대');
    var rF = api.readout('최대 힘에 대한 비');

    var sl = api.slider({ id: 'u-sarcomere-length', label: '근절 길이', min: LMIN, max: LMAX, step: 0.01, value: s.L,
      format: function (v) { return v.toFixed(2) + ' μm'; }, onInput: function (v) { s.L = v; update(); } });
    var playBtn = api.button('늘였다 줄이기', function () { sweep(); }, { primary: true });

    // 머리와 액틴이 겹치는 길이(반쪽)
    function headOverlap(L) {
      var tip = L / 2 - THIN;                      // M선에서 액틴 끝까지(음수면 M선을 넘어감)
      var lo = Math.max(BARE / 2, tip), hi = THICK / 2;
      return Math.max(0, Math.min(HEAD, hi - lo));
    }
    function force(L) {
      if (L >= 2.0) return headOverlap(L) / HEAD;          // 본문 모형: (1.8 − L/2)/0.7
      if (L >= 1.6) return 1 - (2.0 - L) / 0.4 * 0.2;      // 액틴끼리 겹침: 완만한 감소(근사)
      return Math.max(0, 0.8 * (L - 1.25) / 0.35);         // 마이오신이 Z선에 닿음: 급감(근사)
    }
    function update() {
      var L = s.L;
      rL.set(L.toFixed(2) + ' μm'); rA.set(THICK.toFixed(1) + ' μm');
      rI.set(Math.max(0, L - THICK).toFixed(2) + ' μm'); rH.set(Math.max(0, L - 2 * THIN).toFixed(2) + ' μm');
      rF.set(force(L).toFixed(2));
      draw();
    }

    var anim = null;
    var loop = api.loop(function (dt) {
      if (!(dt > 0) || !anim) return;
      anim.t += dt;
      var u = anim.t / anim.dur;
      if (u >= 1) { anim = null; loop.pause(); sl.set(2.1); return; }
      // 3.8 → 1.3 → 2.1
      var L = u < 0.6 ? LMAX - (LMAX - LMIN) * (u / 0.6) : LMIN + (2.1 - LMIN) * ((u - 0.6) / 0.4);
      s.trail.push(L); if (s.trail.length > 400) s.trail.shift();
      sl.set(L);
    });
    loop.pause();
    function sweep() {
      s.trail = [];
      if (api.reduced) { s.trail = []; for (var L = LMAX; L >= LMIN; L -= 0.02) s.trail.push(L); sl.set(2.1); return; }
      anim = { t: 0, dur: 6 }; loop.play();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = stacked ? { x: 0, y: 0, w: w, h: h * 0.42 } : { x: 0, y: 0, w: w, h: h * 0.42 };
      var B = { x: 0, y: h * 0.45, w: w, h: h * 0.55 };
      drawSarc(T, A); drawGraph(T, B);
    }

    function drawSarc(T, r) {
      var L = s.L;
      var px = (r.w - 24) / LMAX, cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 8;
      var zl = cx - L / 2 * px, zr = cx + L / 2 * px;
      var thickLen = Math.min(THICK, L);                  // Z선에 닿으면 눌린 것으로 표시
      var compressed = L < THICK;
      var rows = [-30, 0, 30];                            // 굵은 필라멘트 줄
      var thinRows = [-15, 15];
      // 액틴(양쪽 Z선에서 1.0 μm). 짧을 때 서로 겹치면 위아래로 살짝 엇갈려 그림
      ctx.lineWidth = 3.5; ctx.strokeStyle = T.figBlue;
      var off = L < 2 * THIN ? 3 : 0;
      thinRows.concat([-45, 45]).forEach(function (dy) {
        ctx.beginPath(); ctx.moveTo(zl, cy + dy - off); ctx.lineTo(zl + THIN * px, cy + dy - off); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(zr, cy + dy + off); ctx.lineTo(zr - THIN * px, cy + dy + off); ctx.stroke();
      });
      // 마이오신
      var tl = cx - thickLen / 2 * px, tr = cx + thickLen / 2 * px;
      rows.forEach(function (dy) {
        ctx.strokeStyle = compressed ? T.figAmber : T.figRed; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tl, cy + dy); ctx.lineTo(tr, cy + dy); ctx.stroke(); ctx.lineCap = 'butt';
        // 머리: 0.07 μm 간격, 액틴과 겹치면 진하게
        var tip = L / 2 - THIN;
        for (var side = -1; side <= 1; side += 2) {
          for (var d = BARE / 2 + 0.03; d <= THICK / 2 - 0.02; d += 0.07) {
            var dd = d * thickLen / THICK;
            var on = d >= tip;           // 그 자리까지 같은 쪽 액틴이 들어와 있음
            var hx = cx + side * dd * px;
            ctx.strokeStyle = on ? T.figRed : T.figLine; ctx.lineWidth = on ? 2 : 1.3;
            [-1, 1].forEach(function (u) {
              ctx.beginPath(); ctx.moveTo(hx, cy + dy + u * 4); ctx.lineTo(hx + side * 4, cy + dy + u * 10); ctx.stroke();
            });
          }
        }
      });
      // Z선, M선
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3;
      [zl, zr].forEach(function (zx) { ctx.beginPath(); ctx.moveTo(zx, cy - 56); ctx.lineTo(zx, cy + 56); ctx.stroke(); });
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, cy - 56); ctx.lineTo(cx, cy + 56); ctx.stroke(); ctx.setLineDash([]);
      // 띠 표시
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      function bracket(a, b, y, txt, col) {
        if (b - a < 2) return;
        ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(a, y + 5); ctx.lineTo(a, y); ctx.lineTo(b, y); ctx.lineTo(b, y + 5); ctx.stroke();
        ctx.fillStyle = col; ctx.fillText(txt, (a + b) / 2, y - 4);
      }
      var top = cy - 64;
      bracket(tl, tr, top, 'A대 1.60 μm', T.figRed);
      if (L > THICK + 0.05) { bracket(zl, tl, top + 2, 'I대', T.figBlue); bracket(tr, zr, top + 2, 'I대', T.figBlue); }
      ctx.fillStyle = T.figMuted;
      ctx.fillText('Z선', zl, cy + 72); ctx.fillText('Z선', zr, cy + 72);
      if (L > 2 * THIN + 0.03) {
        var hl = zl + THIN * px, hr = zr - THIN * px;
        ctx.fillStyle = T.figAmber; ctx.fillText('H대 ' + (L - 2).toFixed(2), cx, cy + 72);
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hl, cy + 58); ctx.lineTo(hr, cy + 58); ctx.stroke();
      } else { ctx.fillText('M선', cx, cy + 72); }
      if (compressed) {
        ctx.fillStyle = T.figAmber; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('마이오신이 Z선에 눌림', r.x + 8, r.y + 14);
      } else if (L < 2 * THIN) {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('양쪽 액틴이 M선을 넘어 서로 겹침', r.x + 8, r.y + 14);
      }
    }

    function drawGraph(T, r) {
      var L0 = r.x + 52, R0 = r.x + r.w - 16, Tp = r.y + 16, B0 = r.y + r.h - 36;
      var sx = function (L) { return L0 + (L - LMIN) / (LMAX - LMIN) * (R0 - L0); };
      var sy = function (f) { return B0 - f * (B0 - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'right';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) { ctx.beginPath(); ctx.moveTo(L0, sy(f)); ctx.lineTo(R0, sy(f)); ctx.stroke(); ctx.fillText(f.toFixed(2), L0 - 6, sy(f) + 4); });
      ctx.textAlign = 'center';
      var step = r.w < 420 ? 0.5 : 0.25;
      for (var L = 1.5; L <= LMAX + 1e-9; L += step) ctx.fillText(L.toFixed(step < 0.5 ? 2 : 1), sx(L), B0 + 15);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('근절 길이 (μm)', (L0 + R0) / 2, B0 + 31);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B0) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('장력 (최대 = 1)', 0, 0); ctx.restore();
      // 최대 구간 강조
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(sx(2.0), Tp, sx(2.2) - sx(2.0), B0 - Tp);
      // 근사 구간(점선)과 모형 구간(실선)
      function seg(a, b, dash) {
        ctx.setLineDash(dash ? [5, 4] : []); ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
        for (var i = 0; i <= 80; i++) { var L = a + (b - a) * i / 80; var X = sx(L), Y = sy(force(L)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      seg(LMIN, 2.0, true); seg(2.0, LMAX, false);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('점선: 실험 근사', sx(1.32), sy(0.08));
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'center';
      ctx.fillText('최대', sx(2.1), Tp + 12);
      // 지나온 자취
      if (s.trail.length > 1) {
        ctx.fillStyle = T.figViolet; ctx.globalAlpha = 0.35;
        s.trail.forEach(function (L) { ctx.beginPath(); ctx.arc(sx(L), sy(force(L)), 2, 0, Math.PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
      }
      // 현재 점
      var X = sx(s.L), Y = sy(force(s.L));
      ctx.strokeStyle = T.figViolet; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X, B0); ctx.lineTo(X, Y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(X, Y, 6, 0, Math.PI * 2); ctx.fill();
    }

    api.onResize(draw);
    update();
  },
});
