/* 4-4 중화 반응: 묽은 염산에 수산화 나트륨 수용액을 조금씩 넣을 때 지시약 색과 온도 변화, H⁺ + OH⁻ → H₂O */
Sims.register('neutralization', {
  title: '묽은 염산에 수산화 나트륨 수용액을 조금씩 넣으면',
  caption: '‘2 mL 넣기’나 슬라이더로 수산화 나트륨 수용액을 넣어 보자. 지시약을 바꾸어 색 변화를 비교하고, 넣은 부피에 따라 혼합 용액의 온도가 어떻게 변하는지 그래프로 확인한다. H⁺와 OH⁻가 1 : 1로 만나 물이 되는 동안은 온도가 오르고, 중화점(20 mL)에서 가장 높으며, 그 뒤로는 반응할 H⁺가 없어 실온의 용액이 섞이며 온도가 조금씩 내려간다. 같은 농도의 묽은 염산 20 mL에 넣는 경우로 단순화했고, 처음 온도 20.0 °C, 열 손실 없음, 혼합 용액의 비열·밀도는 물과 같다고 가정했다(탐구 활동의 예시 값과 같은 조건). 입자 모형은 수용액 2 mL에 이온 1쌍으로 나타냈고, 용매인 물 분자는 생략했다.',
  init: function (api) {
    var VA = 20, VMAX = 40, STEP = 2, T0 = 20.0, K = 57.3 / 4.184;   // K: 같은 조건(탐구 예시 값)에서 쓴 계산 상수
    var NPAIR = VA / STEP;   // 염산 속 H⁺ 개수(모형)
    var state = { v: 0, ind: 'btb', anim: null };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 2.12 : 0.8; }, label: '뷰렛과 비커, 입자 모형, 넣은 부피에 따른 온도 그래프' });
    var ctx = cv.ctx;

    var rV = api.readout('넣은 NaOH 수용액');
    var rT = api.readout('혼합 용액의 온도');
    var rN = api.readout('용액의 성질');
    var rC = api.readout('지시약 색');

    var g = api.group();
    var bBtb = api.button('지시약: BTB', function () { setInd('btb'); }, { toggle: true, pressed: true, parent: g });
    var bPhp = api.button('지시약: 페놀프탈레인', function () { setInd('php'); }, { toggle: true, pressed: false, parent: g });
    var slider = api.slider({ id: 'neutralization-vol', label: '넣은 수산화 나트륨 수용액', min: 0, max: VMAX, step: STEP, value: 0,
      format: function (v) { return v + ' mL'; },
      onInput: function (v) { state.v = v; state.anim = null; loop.pause(); update(); } });
    var bAdd = api.button('2 mL 넣기', function () { add(); }, { primary: true });
    api.button('처음으로', function () { slider.set(0); });

    function setInd(k) {
      state.ind = k;
      bBtb.setAttribute('aria-pressed', k === 'btb' ? 'true' : 'false');
      bPhp.setAttribute('aria-pressed', k === 'php' ? 'true' : 'false');
      update();
    }
    function temp(v) { return T0 + K * Math.min(v, VA) / (VA + v); }
    function nature(v) { return v < VA ? 'acid' : v === VA ? 'neutral' : 'base'; }
    function indColor(T, v) {
      var n = nature(v);
      if (state.ind === 'btb') return n === 'acid' ? { c: T.figAmber, name: '노란색' } : n === 'neutral' ? { c: T.figGreen, name: '초록색' } : { c: T.figBlue, name: '파란색' };
      return n === 'base' ? { c: T.figRed, name: '붉은색' } : { c: null, name: '무색' };
    }
    function add() {
      if (state.anim || state.v >= VMAX) return;
      if (api.reduced) { slider.set(state.v + STEP); return; }
      state.anim = { from: state.v, t: 0 }; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (state.anim) {
        state.anim.t += dt / 1.5;
        if (state.anim.t >= 1) { var nv = state.anim.from + STEP; state.anim = null; loop.pause(); slider.set(nv); return; }
      } else loop.pause();
      draw();
    });
    loop.pause();

    function update() { readouts(); draw(); }
    function readouts() {
      var v = state.v, T = api.tokens(), n = nature(v);
      rV.set(v + ' mL');
      rT.set(temp(v).toFixed(1) + ' °C');
      rN.set(n === 'acid' ? '산성 (H⁺가 남음)' : n === 'neutral' ? '중성 (중화점)' : '염기성 (OH⁻가 남음)');
      rC.set(indColor(T, v).name);
      bAdd.disabled = v >= VMAX;
    }

    /* ───── 배치 ───── */
    function panel() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        var a = w * 0.56, b = w * 0.76;
        return { scene: { x: 0, y: 0, w: w, h: a }, parts: { x: 0, y: a + 10, w: w, h: b }, graph: { x: 0, y: a + b + 22, w: w, h: h - a - b - 22 } };
      }
      var top = h * 0.53;
      return { scene: { x: 0, y: 0, w: w * 0.34, h: top }, parts: { x: w * 0.37, y: 0, w: w * 0.63, h: top }, graph: { x: 0, y: top + 14, w: w, h: h - top - 14 } };
    }

    /* ───── 그리기 ───── */
    function draw() {
      var T = api.tokens(), P = panel();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, P.scene); drawParticles(T, P.parts); drawGraph(T, P.graph);
    }

    function drawScene(T, r) {
      var v = state.v, A = state.anim;
      var bw = Math.min(r.w * 0.6, r.h * 0.48), bh = bw * 0.82;
      var cx = r.x + r.w * 0.46, bx = cx - bw / 2, bb = r.y + r.h - 22, by = bb - bh;
      // 용액 높이: 20 mL → 60 mL
      var lvl = function (vol) { return bb - bh * (0.28 + 0.6 * vol / (VA + VMAX)); };
      var top = lvl(VA + v);
      var col = indColor(T, v);
      ctx.fillStyle = T.figPanel; ctx.fillRect(bx, top, bw, bb - top);
      ctx.save();
      if (col.c) { ctx.globalAlpha = T.dark ? 0.75 : 0.55; ctx.fillStyle = col.c; } else { ctx.globalAlpha = 0.1; ctx.fillStyle = T.figLine; }
      ctx.fillRect(bx, top, bw, bb - top);
      ctx.restore();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(bx - 4, by); ctx.lineTo(bx, by + 4); ctx.lineTo(bx, bb); ctx.lineTo(bx + bw, bb); ctx.lineTo(bx + bw, by + 4); ctx.lineTo(bx + bw + 4, by); ctx.stroke();
      // 온도계
      var tx = bx + bw * 0.78, tTop = by - bh * 0.35, tBot = bb - 10;
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
      roundRect(tx - 4, tTop, 8, tBot - tTop, 4); ctx.fill(); ctx.stroke();
      var frac = Math.max(0, Math.min(1, (temp(v) - 15) / 15));
      ctx.fillStyle = T.figRed; ctx.fillRect(tx - 2, tBot - 4 - frac * (tBot - tTop - 8), 4, frac * (tBot - tTop - 8));
      ctx.beginPath(); ctx.arc(tx, tBot, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontMono; ctx.textAlign = 'left';
      ctx.fillText(temp(v).toFixed(1) + ' °C', Math.min(tx + 9, r.x + r.w - 58), tTop + 4);
      // 뷰렛
      var ux = bx + bw * 0.32, uw = 12, uTop = r.y + 22, uBot = by - 16;
      var remain = (VMAX + 10 - v - (A ? STEP * Math.min(1, A.t / 0.35) : 0)) / (VMAX + 10);
      ctx.fillStyle = T.figPanel; ctx.fillRect(ux - uw / 2, uTop, uw, uBot - uTop);
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = T.figBlue; var lh = (uBot - uTop) * remain; ctx.fillRect(ux - uw / 2, uBot - lh, uw, lh); ctx.restore();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.strokeRect(ux - uw / 2, uTop, uw, uBot - uTop);
      ctx.beginPath(); ctx.moveTo(ux - uw / 2, uBot); ctx.lineTo(ux - 2, uBot + 10); ctx.lineTo(ux - 2, uBot + 14); ctx.moveTo(ux + uw / 2, uBot); ctx.lineTo(ux + 2, uBot + 10); ctx.lineTo(ux + 2, uBot + 14); ctx.stroke();
      // 방울
      if (A && A.t < 0.45) {
        var dy = uBot + 16 + (top - uBot - 16) * Math.min(1, A.t / 0.4);
        ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(ux, dy, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      // 이름표
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = ux + uw / 2 + 6;
      ctx.fillText('수산화 나트륨', lx, uTop + 12);
      ctx.fillText('수용액', lx, uTop + 27);
      ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      ctx.fillText('묽은 염산 20 mL + ' + (state.ind === 'btb' ? 'BTB' : '페놀프탈레인'), cx, bb + 16);
    }

    /* 입자 모형 */
    var slotCache = { key: '', pts: null };
    function slots(b, r) {
      var key = [Math.round(b.w), Math.round(b.h)].join('x');
      if (slotCache.key === key) return slotCache.pts;
      var aspect = b.w / b.h, cols = Math.max(6, Math.round(Math.sqrt(50 * aspect))), rows = Math.ceil(50 / cols);
      while (cols * rows < 50) rows++;
      var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      var cells = [];
      for (var i = 0; i < cols * rows; i++) cells.push(i);
      for (var j = cells.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)); var tmp = cells[j]; cells[j] = cells[k]; cells[k] = tmp; }
      var cw = b.w / cols, ch = b.h / rows;
      var pts = cells.slice(0, 50).map(function (c) {
        var cx = c % cols, cy = Math.floor(c / cols);
        var jx = (rnd() - 0.5) * Math.max(0, cw - 2 * r - 2), jy = (rnd() - 0.5) * Math.max(0, ch - 2 * r - 2);
        return { x: b.x + (cx + 0.5) * cw + jx, y: b.y + (cy + 0.5) * ch + jy };
      });
      slotCache = { key: key, pts: pts };
      return pts;
    }
    function ion(T, x, y, r, kind, alpha) {
      var st = { H: [T.figSoftRed, T.figRed, 'H⁺'], OH: [T.figSoftBlue, T.figBlue, 'OH⁻'], Na: [T.figSoftViolet, T.figViolet, 'Na⁺'], Cl: [T.figSoftGreen, T.figGreen, 'Cl⁻'], W: [T.figSoftTeal, T.figTeal, 'H₂O'] }[kind];
      ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
      if (kind === 'W') {   // 물 분자: 산소 원자 + 수소 원자 2개
        ctx.fillStyle = st[0]; ctx.strokeStyle = st[1]; ctx.lineWidth = 1.4;
        [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(x + s * r * 0.78, y - r * 0.62, r * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
        ctx.beginPath(); ctx.arc(x, y + r * 0.08, r * 0.92, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = st[0]; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = st[1]; ctx.stroke();
      }
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(st[2], x, y + (kind === 'W' ? r * 0.12 : 0.5));
      ctx.restore();
    }
    function ease(p) { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); }

    function drawParticles(T, b) {
      ctx.save();
      ctx.beginPath(); roundRect(b.x, b.y, b.w, b.h, 10); ctx.fillStyle = T.figPaper; ctx.fill();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('입자 모형', b.x + 10, b.y + 18);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('Na⁺, Cl⁻는 반응하지 않음', b.x + b.w - 10, b.y + 18);

      var inner = { x: b.x + 8, y: b.y + 28, w: b.w - 16, h: b.h - 28 - 34 };
      var cw0 = inner.w / Math.max(6, Math.round(Math.sqrt(50 * inner.w / inner.h)));
      var r = Math.max(11, Math.min(15, Math.min(cw0, inner.h / Math.ceil(50 / Math.max(6, Math.round(Math.sqrt(50 * inner.w / inner.h))))) * 0.36));
      var S = slots(inner, r);
      var A = state.anim, n = (A ? A.from : state.v) / STEP, i;
      for (i = 0; i < NPAIR; i++) ion(T, S[i].x, S[i].y, r, 'Cl');
      for (i = 0; i < NPAIR; i++) { var p = S[NPAIR + i]; ion(T, p.x, p.y, r, i < n ? 'W' : 'H'); }
      for (i = 0; i < n; i++) { var q = S[2 * NPAIR + i]; ion(T, q.x, q.y, r, 'Na'); }
      for (i = NPAIR; i < n; i++) { var o = S[4 * NPAIR + (i - NPAIR)]; ion(T, o.x, o.y, r, 'OH'); }
      if (A) {   // 새로 들어온 Na⁺와 OH⁻
        var k = n, sx = inner.x + inner.w * 0.5, sy = inner.y - 4;
        var pin = ease((A.t - 0.3) / 0.4);
        if (A.t > 0.3) {
          var na = S[2 * NPAIR + k];
          ion(T, sx - r + (na.x - sx + r) * pin, sy + (na.y - sy) * pin, r, 'Na');
          var tgt = k < NPAIR ? S[NPAIR + k] : S[4 * NPAIR + (k - NPAIR)];
          if (k < NPAIR && A.t > 0.7) {
            var m = ease((A.t - 0.7) / 0.15);
            ctx.beginPath(); ctx.arc(tgt.x, tgt.y, r + 4 + 6 * m, 0, Math.PI * 2); ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2; ctx.globalAlpha = 1 - m * 0.6; ctx.stroke(); ctx.globalAlpha = 1;
            ion(T, tgt.x, tgt.y, r, 'W');
          } else ion(T, sx + r + (tgt.x - sx - r) * pin, sy + (tgt.y - sy) * pin, r, 'OH');
        }
      }
      // 아래 개수 띠
      var cur = A ? A.from : state.v, nn = cur / STEP;
      var hLeft = Math.max(0, NPAIR - nn), ohLeft = Math.max(0, nn - NPAIR), wat = Math.min(nn, NPAIR);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = '600 12px ' + T.fontBody;
      var y = b.y + b.h - 12, x = b.x + 10;
      [['H⁺ ' + hLeft, T.figRed], ['OH⁻ ' + ohLeft, T.figBlue], ['새로 생긴 H₂O ' + wat, T.figTeal]].forEach(function (it) {
        ctx.fillStyle = it[1]; ctx.fillText(it[0], x, y); x += ctx.measureText(it[0]).width + 14;
      });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      if (x + 110 < b.x + b.w) ctx.fillText('H⁺ + OH⁻ → H₂O', x, y);
    }

    function drawGraph(T, r) {
      var L = r.x + 48, R = r.x + r.w - 14, Tp = r.y + 14, B = r.y + r.h - 50;
      var YMIN = 19, YMAX = 28;
      var sx = function (v) { return L + v / VMAX * (R - L); };
      var sy = function (t) { return B - (t - YMIN) / (YMAX - YMIN) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      [20, 22, 24, 26, 28].forEach(function (t) { ctx.beginPath(); ctx.moveTo(L, sy(t)); ctx.lineTo(R, sy(t)); ctx.stroke(); ctx.fillText(t, L - 6, sy(t) + 4); });
      ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.textAlign = 'center';
      [0, 10, 20, 30, 40].forEach(function (v) { ctx.fillStyle = T.figMuted; ctx.fillText(v, sx(v), B + 30); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('넣은 수산화 나트륨 수용액의 부피 (mL)', (L + R) / 2, B + 46);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('혼합 용액의 온도 (°C)', 0, 0); ctx.restore();
      // 미리 보기 곡선
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.beginPath();
      for (var v = 0; v <= VMAX; v += 0.5) { if (v) ctx.lineTo(sx(v), sy(temp(v))); else ctx.moveTo(sx(v), sy(temp(v))); }
      ctx.stroke(); ctx.setLineDash([]);
      // 지시약 색 띠 (넣은 만큼)
      var cur = state.v;
      for (var a = 0; a < cur; a += STEP) {
        var c = indColor(T, a + STEP);
        ctx.save(); if (c.c) { ctx.globalAlpha = 0.7; ctx.fillStyle = c.c; } else { ctx.globalAlpha = 0.15; ctx.fillStyle = T.figLine; }
        ctx.fillRect(sx(a), B + 6, sx(a + STEP) - sx(a) + 0.5, 9); ctx.restore();
      }
      // 측정한 곡선
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var u = 0; u <= cur; u += STEP) { if (u) ctx.lineTo(sx(u), sy(temp(u))); else ctx.moveTo(sx(u), sy(temp(u))); }
      ctx.stroke();
      ctx.fillStyle = T.figAccent;
      for (var w = 0; w <= cur; w += STEP) { ctx.beginPath(); ctx.arc(sx(w), sy(temp(w)), w === cur ? 5 : 3, 0, Math.PI * 2); ctx.fill(); }
      // 중화점 표시
      if (cur >= VA) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx(VA), sy(temp(VA))); ctx.lineTo(sx(VA), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('중화점: 온도 최고 (' + temp(VA).toFixed(1) + ' °C)', sx(VA), sy(temp(VA)) - 10);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('점선: 끝까지 넣을 때의 예상', R, B - 8);
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(function () { slotCache.key = ''; update(); });
    update();
  },
});
