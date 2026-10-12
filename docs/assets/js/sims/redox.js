/* 4-3 산화와 환원: 아연판 + 황산 구리(II) 수용액을 입자 수준에서 본다 (전자의 이동, 반응성 차이) */
Sims.register('redox', {
  title: '아연판을 황산 구리(II) 수용액에 넣으면 — 전자가 어디로 갈까?',
  caption: '‘한 번 반응시키기’를 누르면 아연 원자 1개가 전자 2개를 잃고 Zn²⁺가 되어 녹아 나가고(산화), 그 전자 2개를 Cu²⁺ 1개가 얻어 구리 원자로 석출된다(환원). 몇 번을 반응시켜도 잃은 전자 수와 얻은 전자 수는 같고, 푸른색을 내는 Cu²⁺가 줄어 수용액의 색이 옅어진다. ‘구리판 + 황산 아연 수용액’으로 바꾸면 구리가 아연보다 전자를 내놓기 어려워 아무 변화가 없다. 설명을 위해 입자 수를 줄이고 물 분자는 생략했으며, 크기 비율은 실제와 다르다.',
  init: function (api) {
    var N = 6, ROWS = 6, DUR = 2.8, DUR_NO = 1.9;
    var ZR = [3, 1, 5, 0, 4, 2];      // 산화되는 표면 아연 원자의 줄
    var CR = [2, 0, 4, 1, 5, 3];      // 구리가 석출되는 자리의 줄
    var ORDER = [0, 13, 6, 19, 9, 3, 16, 2, 11, 5, 18, 8, 1, 14, 7, 17, 10, 4];   // 수용액 자리 배정
    var JIT = [[.08, -.1], [-.12, .14], [.1, .06], [-.06, -.12], [.14, .1], [-.1, -.04], [.04, .14], [-.14, .02], [.1, -.14], [-.02, .1],
      [.12, -.06], [-.08, .12], [.06, -.1], [-.12, -.08], [.02, .12], [.1, .04], [-.1, .08], [.14, -.12], [-.04, -.14], [.08, .1]];
    var state = { mode: 'zn', done: 0, tries: 0, anim: null, auto: false, last: -1 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.5 : 0.64; }, label: '비커 속 금속판과 수용액, 그리고 금속판 표면을 확대한 입자 모형' });
    var ctx = cv.ctx;

    var rOx = api.readout('산화(전자를 잃음)');
    var rRe = api.readout('환원(전자를 얻음)');
    var rEq = api.readout('잃은 전자 = 얻은 전자');
    var rCol = api.readout('수용액의 색');

    var g = api.group();
    var bZn = api.button('아연판 + 황산 구리(II) 수용액', function () { setMode('zn'); }, { toggle: true, pressed: true, parent: g });
    var bCu = api.button('구리판 + 황산 아연 수용액', function () { setMode('cu'); }, { toggle: true, pressed: false, parent: g });
    var bStep = api.button('한 번 반응시키기', function () { step(); }, { primary: true });
    var bAuto = api.button('끝까지 자동으로', function () { toggleAuto(); }, { toggle: true, pressed: false });
    api.button('처음으로', function () { reset(); });

    function setMode(m) {
      state.mode = m;
      bZn.setAttribute('aria-pressed', m === 'zn' ? 'true' : 'false');
      bCu.setAttribute('aria-pressed', m === 'cu' ? 'true' : 'false');
      reset();
    }
    function reset() {
      state.done = 0; state.tries = 0; state.anim = null; state.last = -1; setAuto(false);
      loop.pause(); readouts(); draw();
    }
    function setAuto(on) { state.auto = on; bAuto.setAttribute('aria-pressed', on ? 'true' : 'false'); bAuto.textContent = on ? '멈추기' : '끝까지 자동으로'; }
    function finished() { return state.mode === 'zn' ? state.done >= N : state.tries >= N; }
    function step() {
      if (state.anim || finished()) { if (finished()) { readouts(); draw(); } return; }
      var k = state.mode === 'zn' ? state.done : state.tries;
      if (api.reduced) { complete(k); draw(); return; }
      state.anim = { k: k, t: 0 }; loop.play();
    }
    function toggleAuto() {
      if (state.auto) { setAuto(false); return; }
      if (finished()) reset();
      if (api.reduced) {   // 움직임 줄이기: 마지막 상태를 바로 보여 준다
        while (!finished()) complete(state.mode === 'zn' ? state.done : state.tries);
        draw(); return;
      }
      setAuto(true); step();
    }
    function complete(k) {
      if (state.mode === 'zn') state.done = k + 1; else state.tries = k + 1;
      state.last = k; state.anim = null; readouts();
    }
    var loop = api.loop(function (dt) {
      if (state.anim) {
        state.anim.t += dt / (state.mode === 'zn' ? DUR : DUR_NO);
        if (state.anim.t >= 1) {
          complete(state.anim.k);
          if (state.auto && !finished()) { state.anim = { k: state.mode === 'zn' ? state.done : state.tries, t: 0 }; }
          else { setAuto(false); loop.pause(); }
        }
      } else loop.pause();
      draw();
    });
    loop.pause();

    function readouts() {
      if (state.mode === 'zn') {
        var d = state.done;
        rOx.set('Zn ' + d + '개, 전자 ' + 2 * d + '개 잃음');
        rRe.set('Cu²⁺ ' + d + '개, 전자 ' + 2 * d + '개 얻음');
        rEq.set(2 * d + ' = ' + 2 * d);
        var left = N - d;
        rCol.set(left === N ? '푸른색 (Cu²⁺ ' + left + '/' + N + ')' : left === 0 ? '무색에 가까움 (Cu²⁺ 0/' + N + ')' : '푸른색이 옅어짐 (Cu²⁺ ' + left + '/' + N + ')');
        bStep.disabled = d >= N;
      } else {
        rOx.set('없음 (전자 0개)'); rRe.set('없음 (전자 0개)'); rEq.set('이동한 전자 없음');
        rCol.set('무색 그대로');
        bStep.disabled = state.tries >= N;
      }
    }

    /* ───── 배치 ───── */
    function panel() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { stacked: true, scene: { x: 0, y: 0, w: w, h: h * 0.36 }, zoom: { x: 0, y: h * 0.38, w: w, h: h * 0.62 } }
        : { stacked: false, scene: { x: 0, y: 0, w: w * 0.33, h: h }, zoom: { x: w * 0.36, y: 0, w: w * 0.64, h: h } };
    }
    function geom(z) {
      var top = z.y + 28, bottom = z.y + z.h - 54;
      var ah = bottom - top, rowH = ah / ROWS;
      var r = Math.max(13, Math.min(17, rowH * 0.42));
      var surfX = z.x + 6 + 3.2 * r, innerX = surfX - 2.1 * r, depX = surfX + 2.05 * r;
      var sx0 = depX + 2.1 * r, sx1 = z.x + z.w - r - 6;
      return {
        r: r, top: top, bottom: bottom, surfX: surfX, innerX: innerX, depX: depX, plateR: surfX + r + 2,
        row: function (i) { return top + (i + 0.5) * rowH; },
        slot: function (i) {
          var c = i % 4, rr = Math.floor(i / 4), j = JIT[i];
          var u = (c + 0.5 + j[0] * 1.6) / 4, v = (rr + 0.5 + j[1] * 1.6) / 5;
          return { x: sx0 + u * (sx1 - sx0), y: top + r * 0.2 + v * (ah - r * 0.4) };
        },
      };
    }

    /* ───── 그리기 ───── */
    function draw() {
      var T = api.tokens(), P = panel();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var G = geom(P.zoom);
      drawScene(T, P, G);
      drawZoom(T, P.zoom, G);
    }
    function blueFrac() { return state.mode === 'zn' ? (N - state.done) / N : 0; }

    function drawScene(T, P, G) {
      var r = P.scene, zn = state.mode === 'zn';
      var bw = Math.min(r.w - 36, (r.h - 70) * 0.9), bh = Math.min(r.h - 70, bw * 1.1);
      var cx = r.x + r.w / 2, bx = cx - bw / 2, by = r.y + 34, bb = by + bh;
      var level = by + bh * 0.28;
      // 수용액
      ctx.save();
      ctx.fillStyle = T.figPanel; ctx.fillRect(bx, level, bw, bb - level);
      ctx.globalAlpha = 0.08 + 0.5 * blueFrac(); ctx.fillStyle = T.figBlue; ctx.fillRect(bx, level, bw, bb - level);
      ctx.restore();
      // 금속판
      var pw = Math.max(14, bw * 0.17), px = cx - bw * 0.12 - pw / 2, pt = r.y + 14, pb = bb - 14;
      ctx.fillStyle = zn ? T.figPanel : T.figSoftRed; ctx.strokeStyle = zn ? T.figMuted : T.figRed; ctx.lineWidth = 1.5;
      ctx.fillRect(px, pt, pw, pb - pt); ctx.strokeRect(px, pt, pw, pb - pt);
      if (zn && state.done > 0) {   // 표면에 붙은 붉은 구리
        ctx.save(); ctx.globalAlpha = Math.min(1, 0.25 + state.done / N * 0.75); ctx.fillStyle = T.figRed;
        for (var i = 0; i < 9; i++) {
          var yy = level + 8 + i * (pb - level - 14) / 9;
          ctx.beginPath(); ctx.arc(px + pw + 1, yy, 2.4 + (i % 3), 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px - 1, yy + 6, 2 + ((i + 1) % 3), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      // 비커
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx - 4, by); ctx.lineTo(bx, by + 4); ctx.lineTo(bx, bb); ctx.lineTo(bx + bw, bb); ctx.lineTo(bx + bw, by + 4); ctx.lineTo(bx + bw + 4, by); ctx.stroke();
      // 이름표
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(zn ? '아연판' : '구리판', px + pw + 8, pt + 12);
      ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText(zn ? '황산 구리(II) 수용액' : '황산 아연 수용액', cx, bb + 18);
      ctx.fillStyle = zn ? (state.done >= N ? T.figMuted : T.figBlue) : T.figMuted; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText(zn ? (state.done === 0 ? '푸른색' : state.done >= N ? '무색에 가까워짐' : '푸른색이 옅어짐') : '무색 (변화 없음)', cx, bb + 34);
      // 돋보기
      var mx = px + pw, my = level + (pb - level) * 0.45, mr = 15;
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.strokeStyle = T.figLine;
      var z = P.zoom;
      ctx.beginPath();
      if (P.stacked) { ctx.moveTo(mx - mr, my); ctx.lineTo(z.x + 2, z.y + 2); ctx.moveTo(mx + mr, my); ctx.lineTo(z.x + z.w - 2, z.y + 2); }
      else { ctx.moveTo(mx, my - mr); ctx.lineTo(z.x, z.y + 2); ctx.moveTo(mx, my + mr); ctx.lineTo(z.x, z.y + z.h - 2); }
      ctx.stroke(); ctx.setLineDash([]);
    }

    function ease(p) { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); }
    function lerp(a, b, p) { return a + (b - a) * p; }

    function ball(T, x, y, r, kind, alpha) {
      var st = {
        Zn: [T.figPanel, T.figMuted, 'Zn'], Zn2: [T.figPaper, T.figMuted, 'Zn²⁺'],
        Cu: [T.figSoftRed, T.figRed, 'Cu'], Cu2: [T.figSoftBlue, T.figBlue, 'Cu²⁺'],
        SO4: [T.figSoftViolet, T.figViolet, 'SO₄²⁻'],
      }[kind];
      ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
      var rr = kind === 'Zn2' ? r * 0.86 : r;
      ctx.beginPath();
      if (kind === 'SO4') { var w = r * 1.35; roundRect(x - w, y - r * 0.82, 2 * w, r * 1.64, r * 0.8); }
      else ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = st[0]; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = st[1];
      if (kind === 'Zn2') ctx.setLineDash([3, 2]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(st[2], x, y + 0.5);
      ctx.restore();
    }
    function electron(T, x, y) {
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = T.figPaper; ctx.stroke();
    }
    function eLabel(T, pts, r) {   // 전자 2개 이름표: 구리 자리 위쪽 빈 곳
      var x = pts[3][0] + r + 4, y = pts[3][1] - r - 2;
      ctx.font = '700 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var tw = ctx.measureText('전자 2개').width;
      ctx.fillStyle = T.figPaper; ctx.fillRect(x - 3, y - 9, tw + 6, 18);
      ctx.fillStyle = T.figAmber; ctx.fillText('전자 2개', x, y);
    }
    function ePath(G, k) {   // 아연 원자 → (금속 속) → 구리 이온 자리
      var zx = G.surfX, zy = G.row(ZR[k]), cy = G.row(CR[k]);
      return [[zx, zy], [zx + G.r * 0.95, zy], [zx + G.r * 0.95, cy], [G.depX, cy]];
    }
    function along(pts, p) {
      var segs = [], tot = 0, i;
      for (i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); tot += d; }
      var s = p * tot;
      for (i = 0; i < segs.length; i++) {
        if (s <= segs[i] || i === segs.length - 1) { var q = segs[i] ? Math.min(1, s / segs[i]) : 1; return [lerp(pts[i][0], pts[i + 1][0], q), lerp(pts[i][1], pts[i + 1][1], q)]; }
        s -= segs[i];
      }
      return pts[pts.length - 1];
    }

    function drawZoom(T, z, G) {
      var zn = state.mode === 'zn', r = G.r, A = state.anim;
      // 틀과 수용액
      ctx.save();
      ctx.beginPath(); roundRect(z.x, z.y, z.w, z.h, 10); ctx.fillStyle = T.figPaper; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.globalAlpha = 0.03 + 0.15 * blueFrac(); ctx.fillStyle = T.figBlue; ctx.fillRect(G.plateR, z.y, z.x + z.w - G.plateR, z.h - 50);
      ctx.globalAlpha = 1; ctx.fillStyle = zn ? T.figLine : T.figSoftRed; ctx.globalAlpha = zn ? 0.28 : 0.7;
      ctx.fillRect(z.x, z.y, G.plateR - z.x, z.h - 50);
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); roundRect(z.x, z.y, z.w, z.h, 10); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('확대한 입자 모형', z.x + 10, z.y + 18);
      ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('SO₄²⁻는 변하지 않음', z.x + z.w - 10, z.y + 18);

      // 황산 이온 (구경만 한다)
      for (var s = 0; s < N; s++) { var ps = G.slot(ORDER[N + s]); ball(T, ps.x, ps.y, r, 'SO4', 0.85); }

      var i, k;
      if (zn) {
        // 안쪽 아연 원자
        for (i = 0; i < ROWS; i++) ball(T, G.innerX, G.row(i), r, 'Zn');
        for (k = 0; k < N; k++) {
          var phase = k < state.done ? 1 : (A && A.k === k ? A.t : 0);
          var zy = G.row(ZR[k]), dest = G.slot(ORDER[2 * N + k]);
          // 아연
          if (phase < 0.6) {
            ball(T, G.surfX, zy, r, 'Zn');
            if (A && A.k === k) { ctx.beginPath(); ctx.arc(G.surfX, zy, r + 4 + 2 * Math.sin(A.t * 30), 0, Math.PI * 2); ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.stroke(); }
          } else {
            var q = ease((phase - 0.6) / 0.35);
            ball(T, lerp(G.surfX, dest.x, q), lerp(zy, dest.y, q), r, 'Zn2');
          }
          // 구리 이온 → 구리
          var src = G.slot(ORDER[k]), cy = G.row(CR[k]);
          if (phase <= 0) ball(T, src.x, src.y, r, 'Cu2');
          else if (phase < 0.6) { var q2 = ease(phase / 0.3); ball(T, lerp(src.x, G.depX, q2), lerp(src.y, cy, q2), r, 'Cu2'); }
          else ball(T, G.depX, cy, r, 'Cu');
        }
        // 전자
        if (A && A.t > 0.3 && A.t < 0.62) {
          var pts = ePath(G, A.k);
          ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.beginPath();
          pts.forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.setLineDash([]);
          [0.30, 0.38].forEach(function (t0) {
            var p = (A.t - t0) / 0.22; if (p > 0 && p < 1) { var e = along(pts, ease(p)); electron(T, e[0], e[1]); }
          });
          eLabel(T, pts, G.r);
        } else if (!A && state.last >= 0) {
          // 방금 일어난 반응의 전자 경로를 남겨 둔다
          var lp = ePath(G, state.last);
          ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.beginPath();
          lp.forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.moveTo(lp[3][0] - r - 1, lp[3][1]); ctx.lineTo(lp[3][0] - r - 8, lp[3][1] - 4); ctx.lineTo(lp[3][0] - r - 8, lp[3][1] + 4); ctx.fill();
          eLabel(T, lp, r);
        }
      } else {
        // 구리판 + 아연 이온
        for (i = 0; i < ROWS; i++) { ball(T, G.innerX, G.row(i), r, 'Cu'); ball(T, G.surfX, G.row(i), r, 'Cu'); }
        for (k = 0; k < N; k++) {
          var pz = G.slot(ORDER[k]), tx = G.depX + 0.4 * r, ty = G.row(CR[k]);
          var t = A && A.k === k ? A.t : -1, qq = 0;
          if (t >= 0) qq = t < 0.4 ? ease(t / 0.4) : t < 0.6 ? 1 : 1 - ease((t - 0.6) / 0.4);
          var x = lerp(pz.x, tx, qq), y = lerp(pz.y, ty, qq);
          ball(T, x, y, r, 'Zn2');
          if (t >= 0.3 && t < 0.8) {
            ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.5; var c = r * 0.5, mx = x + r * 1.1, my = y - r * 1.1;
            ctx.beginPath(); ctx.moveTo(mx - c, my - c); ctx.lineTo(mx + c, my + c); ctx.moveTo(mx + c, my - c); ctx.lineTo(mx - c, my + c); ctx.stroke();
          }
        }
      }

      // 아래 설명 띠
      var y1 = z.y + z.h - 32, y2 = z.y + z.h - 12, lx = z.x + 12;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (zn) {
        var hot1 = A && A.t > 0.25 && A.t < 0.75, hot2 = A && A.t > 0.5;
        ctx.font = (hot1 ? '700 ' : '') + '13px ' + T.fontBody; ctx.fillStyle = T.figRed;
        ctx.fillText('산화  Zn → Zn²⁺ + 2e⁻   (전자를 잃음)', lx, y1);
        ctx.font = (hot2 ? '700 ' : '') + '13px ' + T.fontBody; ctx.fillStyle = T.figBlue;
        ctx.fillText('환원  Cu²⁺ + 2e⁻ → Cu   (전자를 얻음)', lx, y2);
      } else {
        ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk;
        ctx.fillText('반응성 Zn > Cu: 구리는 전자를 내놓기 어렵다', lx, y1);
        ctx.font = '13px ' + T.fontBody; ctx.fillStyle = T.figRed;
        ctx.fillText('→ Zn²⁺가 전자를 받지 못해 아무 변화가 없다', lx, y2);
      }
    }
    function roundRect(x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw);
    readouts(); draw();
  },
});
