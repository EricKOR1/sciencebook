/* 중2-7 전기와 자기: 전압·저항과 전류(옴의 법칙), 전구 2개의 직렬·병렬 연결 비교 */
Sims.register('ohm-circuit', {
  title: '전압과 저항을 바꾸면 전류는? — 옴의 법칙과 직렬·병렬',
  caption: '‘옴의 법칙’에서 전압을 높이거나 저항을 바꾸면서 전류계 값과 전자가 흐르는 빠르기를 비교해 보자. 저항이 같으면 전류는 전압에 비례하고, 전압이 같으면 저항이 클수록 전류가 작다. ‘직렬·병렬’에서는 똑같은 전구 2개를 같은 전지에 연결해 밝기와 전류를 비교하고, 전구 하나를 빼 보자. 전구의 저항은 10 Ω으로 일정하다고 가정했고, 전구의 밝기와 전자의 빠르기는 실제 비율이 아니라 크고 작음만 나타냈다(실제 도선 속 전자는 훨씬 느리게 움직인다).',
  init: function (api) {
    var state = { mode: 'ohm', V: 3, R: 10, removed: false, t: 0 };
    var RB = 10;   // 전구 하나의 저항(가정)
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.22 : 0.56; }, label: '전지, 저항, 전류계, 전압계로 이루어진 회로와 전류-전압 그래프' });
    var ctx = cv.ctx;

    var rV = api.readout('전압계');
    var rR = api.readout('저항');
    var rI = api.readout('전류계');
    var rS = api.readout('직렬: 전구 하나의 전류');
    var rP = api.readout('병렬: 전구 하나의 전류');
    var rPT = api.readout('병렬: 전체 전류');
    var spans = api.readouts.children;

    var gm = api.group();
    var modeBtns = [['ohm', '옴의 법칙'], ['sp', '직렬·병렬 비교']].map(function (m, i) {
      return api.button(m[1], function () { setMode(m[0]); }, { toggle: true, pressed: i === 0, parent: gm });
    });
    var sV = api.slider({ id: 'ohm-circuit-v', label: '전지의 전압', min: 0, max: 6, step: 0.5, value: 3,
      format: function (v) { return v.toFixed(1) + ' V'; }, onInput: function (v) { state.V = v; update(); } });
    var sR = api.slider({ id: 'ohm-circuit-r', label: '저항', min: 5, max: 30, step: 5, value: 10,
      format: function (v) { return v + ' Ω'; }, onInput: function (v) { state.R = v; update(); } });
    var rmBtn = api.button('전구 하나 빼기', function () { state.removed = !state.removed; rmBtn.textContent = state.removed ? '전구 다시 끼우기' : '전구 하나 빼기'; rmBtn.setAttribute('aria-pressed', state.removed ? 'true' : 'false'); update(); }, { toggle: true });

    function setMode(m) {
      state.mode = m;
      modeBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 0) === (m === 'ohm') ? 'true' : 'false'); });
      sR.input.parentNode.style.display = m === 'ohm' ? '' : 'none';
      rmBtn.style.display = m === 'ohm' ? 'none' : '';
      [0, 1, 2].forEach(function (k) { spans[k].style.display = m === 'ohm' ? '' : 'none'; });
      [3, 4, 5].forEach(function (k) { spans[k].style.display = m === 'ohm' ? 'none' : ''; });
      update();
    }
    function cur() {
      var I = state.V / state.R;
      var Is = state.removed ? 0 : state.V / (2 * RB);
      var Ip = state.V / RB;
      return { I: I, Is: Is, Ip: Ip, Ipt: state.removed ? Ip : 2 * Ip };
    }
    function fA(x) { return x.toFixed(2) + ' A'; }
    function update() {
      var c = cur();
      rV.set(state.V.toFixed(1) + ' V'); rR.set(state.R + ' Ω'); rI.set(fA(c.I));
      rS.set(state.removed ? '0 A (꺼짐)' : fA(c.Is));
      rP.set(fA(c.Ip)); rPT.set(fA(c.Ipt));
      if (state.V > 0 && !api.reduced) loop.play(); else loop.pause();
      draw();
    }

    /* ── 경로 도우미: 꼭짓점 목록 → 길이 매개변수 ── */
    function mkPath(pts) {
      var segs = [], tot = 0;
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        segs.push({ a: a, b: b, s0: tot, l: l }); tot += l;
      }
      return { segs: segs, len: tot, at: function (s) {
        s = ((s % tot) + tot) % tot;
        for (var k = 0; k < segs.length; k++) if (s <= segs[k].s0 + segs[k].l) { var f = (s - segs[k].s0) / segs[k].l; return [segs[k].a[0] + (segs[k].b[0] - segs[k].a[0]) * f, segs[k].a[1] + (segs[k].b[1] - segs[k].a[1]) * f]; }
        return segs[0].a;
      } };
    }
    // 전자: 전지 (−)극에서 나와 (+)극으로. 회로 경로는 '전류 방향'으로 만들고 전자는 거꾸로 움직인다.
    function electrons(T, P, I, spacing, offset) {
      if (!P) return;
      var n = Math.floor(P.len / spacing);
      var shift = state.t * I * 260;   // 빠르기 ∝ 전류
      for (var k = 0; k < n; k++) {
        var p = P.at(k * P.len / n + (offset || 0) * P.len / n - shift);
        ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fillStyle = T.figBlue; ctx.fill();
        ctx.fillStyle = T.figPanel; ctx.fillRect(p[0] - 2.2, p[1] - 0.7, 4.4, 1.4);
      }
    }

    /* ── 부품 그리기 ── */
    function wire(T, pts) { ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.strokeStyle = T.figLine; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(); }
    function battery(T, x, y, vertical, label) {
      // (+)극: 긴 선, (−)극: 짧은 선. vertical이면 위가 (+)
      ctx.fillStyle = T.figPaper;
      ctx.fillRect(x - 16, y - 12, 32, 24);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 15, y - 5); ctx.lineTo(x + 15, y - 5); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 8, y + 5); ctx.lineTo(x + 8, y + 5); ctx.stroke();
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('+', x + 19, y - 7); ctx.fillStyle = T.figBlue; ctx.fillText('−', x + 19, y + 7);
      if (label) { ctx.fillStyle = T.figInk; ctx.textAlign = 'right'; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(label, x - 20, y); }
    }
    function resistor(T, x1, x2, y) {
      ctx.fillStyle = T.figPaper; ctx.fillRect(x1, y - 10, x2 - x1, 20);
      ctx.beginPath(); ctx.moveTo(x1, y);
      var n = 8, dx = (x2 - x1) / n;
      for (var i = 0; i < n; i++) ctx.lineTo(x1 + dx * (i + 0.5), y + (i % 2 ? 9 : -9));
      ctx.lineTo(x2, y); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 3; ctx.stroke();
    }
    function meter(T, x, y, letter, value) {
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fillStyle = T.figPanel; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = T.figInk; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '700 14px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, x, y + 1);
      if (value != null) {
        ctx.font = '600 13px ' + T.fontMono; var tw = ctx.measureText(value).width + 12;
        var bx = x + 21, by = y - 11;
        ctx.fillStyle = T.figSoftBlue; ctx.fillRect(bx, by, tw, 22); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1; ctx.strokeRect(bx, by, tw, 22);
        ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.fillText(value, bx + 6, y + 1);
      }
    }
    function bulb(T, x, y, power, out) {
      var glow = out ? 0 : Math.min(1, power / 1.2);
      if (glow > 0.005) {
        var r = 14 + 32 * Math.sqrt(glow);
        var gr = ctx.createRadialGradient(x, y, 4, x, y, r);
        gr.addColorStop(0, T.figAmber); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.2 + 0.8 * glow; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fillStyle = glow > 0.005 ? T.figSoftAmber : T.figPanel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = T.figInk; ctx.stroke();
      ctx.beginPath(); var d = 9 / Math.SQRT2; ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
    }
    function emptySocket(T, x, y) {
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figPaper; ctx.fillRect(x - 15, y - 2, 30, 4);
    }
    function arrow(T, x1, y1, x2, y2, color, text, below) {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      var a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 9 * Math.cos(a - 0.45), y2 - 9 * Math.sin(a - 0.45)); ctx.lineTo(x2 - 9 * Math.cos(a + 0.45), y2 - 9 * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
      if (text) { ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, (x1 + x2) / 2, (y1 + y2) / 2 + (below ? 12 : -11)); }
    }

    /* ── 옴의 법칙 화면 ── */
    function drawOhm(T) {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var box = narrow ? { x: 0, y: 0, w: w, h: h * 0.55 } : { x: 0, y: 0, w: w * 0.56, h: h };
      var gbox = narrow ? { x: 0, y: h * 0.57, w: w, h: h * 0.43 } : { x: w * 0.6, y: 0, w: w * 0.4, h: h };
      var L = box.x + 58, R = box.x + box.w - (narrow ? 90 : 96), Tp = box.y + box.h * 0.36, B = box.y + box.h * 0.84;
      var c = cur();
      var rx1 = L + (R - L) * 0.3, rx2 = L + (R - L) * 0.7, by = (Tp + B) / 2;
      // 전류 방향 경로: (+)극(왼쪽 위) → 위 도선(저항) → 오른쪽(전류계) → 아래 도선 → (−)극
      var P = mkPath([[L, by - 12], [L, Tp], [R, Tp], [R, B], [L, B], [L, by + 12]]);
      wire(T, [[L, by - 12], [L, Tp], [R, Tp], [R, B], [L, B], [L, by + 12]]);
      // 전압계(저항에 병렬)
      var vy = Tp - box.h * 0.2;
      wire(T, [[rx1, Tp], [rx1, vy], [(rx1 + rx2) / 2 - 15, vy]]); wire(T, [[rx2, Tp], [rx2, vy], [(rx1 + rx2) / 2 + 15, vy]]);
      ctx.fillStyle = T.figInk;
      [[rx1, Tp], [rx2, Tp]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, Math.PI * 2); ctx.fill(); });
      electrons(T, P, c.I, 26, 0);
      resistor(T, rx1 + 8, rx2 - 8, Tp);
      battery(T, L, by, true, '전지');
      meter(T, (rx1 + rx2) / 2, vy, 'V', state.V.toFixed(1) + ' V');
      meter(T, R, by, 'A', c.I.toFixed(2) + ' A');
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figAmber; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('저항 ' + state.R + ' Ω', (rx1 + rx2) / 2, Tp + 22);
      // 방향 표시
      var ay = B + Math.min(26, box.h * 0.1);
      if (c.I > 0) {
        arrow(T, L + 30, ay, R - 30, ay, T.figBlue, '전자의 이동: (−)극 → (+)극', true);
        arrow(T, L + 22, Tp - 14, rx1 - 22, Tp - 14, T.figRed, '전류');
      }
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('전류계는 직렬, 전압계는 저항에 병렬로 연결', box.x + 8, box.y + 12);
      drawGraph(T, gbox, c);
    }
    function drawGraph(T, r, c) {
      var L = r.x + 46, R = r.x + r.w - 14, Tp = r.y + 22, B = r.y + r.h - 36;
      var IMAX = 1.2, VMAX = 6;
      var sx = function (v) { return L + v / VMAX * (R - L); }, sy = function (i) { return B - i / IMAX * (B - Tp); };
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      [0, 0.4, 0.8, 1.2].forEach(function (i) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(L, sy(i)); ctx.lineTo(R, sy(i)); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText(i.toFixed(1), L - 5, sy(i)); });
      ctx.textAlign = 'center';
      [0, 1.5, 3, 4.5, 6].forEach(function (v) { ctx.fillText(v, sx(v), B + 12); });
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('전압 (V)', (L + R) / 2, B + 27);
      ctx.save(); ctx.translate(r.x + 10, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('전류 (A)', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      // 다른 저항의 직선(옅게), 지금 저항의 직선
      [5, 10, 15, 30].forEach(function (Rv) {
        if (Rv === state.R) return;
        var vEnd = Math.min(VMAX, IMAX * Rv);
        ctx.globalAlpha = 0.35; ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(vEnd), sy(vEnd / Rv)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText(Rv + ' Ω', Math.min(sx(vEnd) + 3, R - 30), sy(vEnd / Rv) - (vEnd < VMAX ? 8 : 0));
      });
      var vE = Math.min(VMAX, IMAX * state.R);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(vE), sy(vE / state.R)); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx(state.V), sy(c.I), 6, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
      ctx.fillStyle = T.figAccent; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('저항 ' + state.R + ' Ω', L + 6, Tp - 10);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('기울기가 클수록 저항이 작다', L + 6, Tp + 8);
    }

    /* ── 직렬·병렬 화면 ── */
    function drawSP(T) {
      var w = cv.w, h = cv.h, narrow = w < 560, c = cur();
      var A = narrow ? { x: 0, y: 0, w: w, h: h / 2 } : { x: 0, y: 0, w: w / 2, h: h };
      var Bx = narrow ? { x: 0, y: h / 2, w: w, h: h / 2 } : { x: w / 2, y: 0, w: w / 2, h: h };
      // 직렬
      (function (r) {
        var L = r.x + 54, R = r.x + r.w - 26, Tp = r.y + r.h * (narrow ? 0.3 : 0.22), B = r.y + r.h * 0.8, by = (Tp + B) / 2;
        var x1 = L + (R - L) * 0.38, x2 = L + (R - L) * 0.76;
        title(T, r, '직렬연결', state.removed ? '길이 끊겨 모두 꺼진다' : '길이 하나 · 전구 하나에 ' + (state.V / 2).toFixed(2) + ' V');
        var pts = [[L, by - 12], [L, Tp], [R, Tp], [R, B], [L, B], [L, by + 12]];
        wire(T, pts);
        if (!state.removed) electrons(T, mkPath(pts), c.Is, 24, 0);
        bulb(T, x1, Tp, c.Is * c.Is * RB, state.removed);
        if (state.removed) emptySocket(T, x2, Tp); else bulb(T, x2, Tp, c.Is * c.Is * RB, false);
        battery(T, L, by, true, '');
        meter(T, (L + R) / 2 + 10, B, 'A', fA(c.Is));
      })(A);
      // 병렬
      (function (r) {
        var L = r.x + 54, R = r.x + r.w - 26, Tp = r.y + r.h * (narrow ? 0.3 : 0.22), M = r.y + r.h * 0.56, B = r.y + r.h * 0.84, by = (M + B) / 2;
        var xb = L + (R - L) * 0.55, xj = L + (R - L) * 0.25;
        title(T, r, '병렬연결', '길이 둘 · 전구마다 ' + state.V.toFixed(1) + ' V');
        // 두 갈래 경로(전류 방향): 갈래 1은 위, 갈래 2는 가운데
        var p1 = [[L, by - 12], [L, M], [xj, M], [xj, Tp], [R, Tp], [R, B], [L, B], [L, by + 12]];
        var p2 = [[L, by - 12], [L, M], [R, M], [R, B], [L, B], [L, by + 12]];
        wire(T, p1); wire(T, [[xj, M], [R, M]]);
        if (!state.removed) electrons(T, mkPath(p1), c.Ip, 30, 0);
        electrons(T, mkPath(p2), c.Ip, 30, 0.5);
        ctx.fillStyle = T.figInk; [[xj, M], [R, M]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, Math.PI * 2); ctx.fill(); });
        if (state.removed) emptySocket(T, xb, Tp); else bulb(T, xb, Tp, c.Ip * c.Ip * RB, false);
        bulb(T, xb, M, c.Ip * c.Ip * RB, false);
        battery(T, L, by, true, '');
        meter(T, (L + R) / 2 + 10, B, 'A', fA(c.Ipt));
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = T.figMuted;
        ctx.fillText(state.removed ? '0 A' : fA(c.Ip), xb + 18, Tp - 14);
        ctx.fillText(fA(c.Ip), xb + 18, M - 14);
      })(Bx);
    }
    function title(T, r, a, b) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '700 14px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.fillText(a, r.x + 10, r.y + 16);
      var tw = ctx.measureText(a).width;
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText(b, r.x + 18 + tw, r.y + 17);
    }

    function draw() {
      var T = api.tokens();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (state.mode === 'ohm') drawOhm(T); else drawSP(T);
    }
    var loop = api.loop(function (dt) { if (!(dt > 0)) return; state.t += dt; draw(); });
    loop.pause();
    api.onResize(draw);
    setMode('ohm');
  },
});
