/* 일반지구과학 5 지질 시대와 지구의 역사: 지질 단면의 사건 순서 맞히기(지층 누중·관입·단층·부정합) */
Sims.register('u-relative-dating', {
  title: '단면 속 사건의 순서 맞히기 — 상대 연령 퍼즐',
  caption: '가장 먼저 일어난 일부터 차례로 그림 속 지층·암석·선을 누르거나 아래 버튼을 눌러 보자. 순서가 맞으면 번호가 붙고 근거가 된 원리가 나오며, 틀리면 무엇보다 나중인지 알려 준다. 지층 누중, 수평 퇴적, 관입·절단의 원리를 함께 써야 풀린다. 이 단면만으로는 지층의 기울어짐과 화강암 관입 중 어느 것이 먼저인지 정할 수 없으므로 두 순서를 모두 정답으로 받는다. 퇴적 구조로 확인한 결과 지층은 뒤집히지 않았다고 가정한다.',
  init: function (api) {
    var EV = [
      { id: 'A', btn: '지층 A 퇴적', pre: [], ok: 'A는 맨 아래 지층이다(지층 누중의 법칙).' },
      { id: 'B', btn: '지층 B 퇴적', pre: ['A'], ok: 'B는 A 위에 쌓였다(지층 누중의 법칙).' },
      { id: 'C', btn: '지층 C 퇴적', pre: ['B'], ok: 'C는 B 위에 쌓였다.' },
      { id: 'T', btn: 'A~C가 기울어짐', pre: ['C'], ok: '지층은 처음에 거의 수평으로 쌓이므로(수평 퇴적의 원리), 기울어진 것은 A~C가 모두 쌓인 뒤이다.' },
      { id: 'G', btn: '화강암 G 관입', pre: ['C'], ok: 'G는 A·B·C를 모두 자르므로 그보다 나중이다(관입·절단의 원리).' },
      { id: 'U', btn: '융기·침식 (면 U)', pre: ['T', 'G'], ok: '기울어진 A~C와 G의 윗부분이 평평하게 깎인 면이 U이다. 그 사이의 기록은 사라졌다.' },
      { id: 'D', btn: '지층 D 퇴적', pre: ['U'], ok: 'D는 침식면 U 위에 다시 쌓였다(침강 후 퇴적). 기울어진 지층 위의 수평층이므로 U는 경사 부정합이다.' },
      { id: 'E', btn: '지층 E 퇴적', pre: ['D'], ok: 'E는 D 위에 쌓였다.' },
      { id: 'F', btn: '단층 F', pre: ['E'], ok: 'F는 E까지 모든 지층을 어긋나게 했으므로 E보다 나중이다.' },
      { id: 'P', btn: '암맥 P 관입', pre: ['F'], ok: 'P는 단층 F를 가로지르지만 끊기지 않았으므로 F보다 나중이다. 이것이 마지막 사건이다.' },
    ];
    var WHY = {
      B: { A: 'B는 A 위에 있다. 아래 지층이 먼저 쌓였다.' }, C: { B: 'C는 B 위에 있다. 아래 지층이 먼저 쌓였다.' },
      T: { C: '기울어진 지층에는 C까지 포함된다. 기울어짐은 C가 쌓인 뒤의 일이다.' },
      G: { C: 'G는 C까지 자르고 있다. 자르는 쪽이 잘리는 쪽보다 나중이다.' },
      U: { T: 'U 아래의 지층은 기울어 있다. 기울어진 뒤에 깎여야 이런 모습이 된다.', G: 'G의 윗부분도 U에서 잘려 있다. G가 굳은 뒤에 깎였다.' },
      D: { U: 'D는 침식면 U 위에 놓여 있다. 깎인 뒤에 쌓였다.' }, E: { D: 'E는 D 위에 있다.' },
      F: { E: 'F는 맨 위의 E까지 어긋나게 했다. E가 쌓인 뒤에 끊어졌다.' },
      P: { F: 'P는 F를 가로지르면서도 끊기지 않았다. 단층보다 나중이다.' },
    };
    var byId = {}; EV.forEach(function (e) { byId[e.id] = e; });
    var done = [], last = null, flash = null;

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '기울어진 지층, 화강암, 부정합, 수평 지층, 단층, 암맥이 있는 지질 단면' });
    var ctx = cv.ctx, c = cv.canvas;
    c.style.cursor = 'pointer';
    var rP = api.readout('찾은 순서');
    var rM = api.readout('도움말');

    var g1 = api.group();
    var btns = {};
    EV.forEach(function (e) { btns[e.id] = api.button(e.btn, function () { pick(e.id); }, { parent: g1 }); });
    var g2 = api.group();
    api.button('처음부터', function () { done = []; last = null; flash = null; msg('가장 먼저 일어난 일부터 그림이나 버튼을 눌러 보자.'); refresh(); }, { parent: g2 });
    api.button('정답 보기', function () { done = ['A', 'B', 'C', 'T', 'G', 'U', 'D', 'E', 'F', 'P']; last = null; msg('정답: A → B → C → 기울어짐 → G → 침식(U) → D → E → F → P (기울어짐과 G는 바뀌어도 된다).'); refresh(); }, { parent: g2 });

    function msg(t) { rM.set(t); }
    function pick(id) {
      if (done.indexOf(id) >= 0) { msg(byId[id].btn + '은(는) 이미 ' + (done.indexOf(id) + 1) + '번째로 정했다.'); return; }
      var miss = byId[id].pre.filter(function (p) { return done.indexOf(p) < 0; });
      if (miss.length) {
        var why = (WHY[id] && WHY[id][miss[0]]) || '';
        msg('아직 아니다. ' + why + ' 먼저 ‘' + byId[miss[0]].btn + '’이(가) 있어야 한다.');
        flash = { id: id, t: performance.now() }; draw(); return;
      }
      done.push(id); last = id;
      var extra = (id === 'G' && done.indexOf('T') < 0) || (id === 'T' && done.indexOf('G') < 0) ? ' (기울어짐과 G의 앞뒤는 이 단면으로 정할 수 없다.)' : '';
      msg('맞다. ' + byId[id].ok + extra + (done.length === EV.length ? ' 완성! 이 단면에는 경사 부정합 U가 있다.' : ''));
      refresh();
    }
    function refresh() {
      EV.forEach(function (e) { var i = done.indexOf(e.id); btns[e.id].textContent = (i >= 0 ? (i + 1) + '. ' : '') + e.btn; btns[e.id].setAttribute('aria-pressed', i >= 0 ? 'true' : 'false'); });
      rP.set(done.length ? done.map(function (d) { return d === 'T' ? '기울어짐' : d === 'U' ? '침식(U)' : d; }).join(' → ') : '아직 없음');
      draw();
    }

    // ── 기하 ──
    function geo() {
      var W = cv.w - 20, top = 10, H = cv.h - 20, x0 = 10;
      var k = Math.tan(22 * Math.PI / 180);
      var gY = top + 0.06 * H, deY = top + 0.27 * H;
      var uY = function (x) { return top + H * (0.42 + 0.018 * Math.sin((x - x0) / W * 18)); };
      var sMin = uY(x0) - k * W - x0 * k, sMax = top + H;
      // s = y - k x
      var s1 = sMin + (sMax - sMin) * 0.4, s2 = sMin + (sMax - sMin) * 0.7;
      var Gc = { x: x0 + 0.3 * W, y: top + 0.95 * H, rx: 0.1 * W, ry: 0.55 * H };
      var fA = { x: x0 + 0.64 * W, y: top }, fB = { x: x0 + 0.78 * W, y: top + H };
      var off = 0.09 * H, odx = off * (fB.x - fA.x) / (fB.y - fA.y);
      var pX = x0 + 0.71 * W, pW = Math.max(9, 0.02 * W);
      return { W: W, top: top, H: H, x0: x0, k: k, gY: gY, deY: deY, uY: uY, s1: s1, s2: s2, G: Gc, fA: fA, fB: fB, off: off, odx: odx, pX: pX, pW: pW };
    }
    function faultX(gm, y) { return gm.fA.x + (gm.fB.x - gm.fA.x) * (y - gm.fA.y) / (gm.fB.y - gm.fA.y); }
    function uPath(gm) {
      ctx.moveTo(gm.x0 - 40, gm.uY(gm.x0));
      for (var x = gm.x0 - 40; x <= gm.x0 + gm.W + 40; x += 6) ctx.lineTo(x, gm.uY(x));
    }
    function drawPre(T, gm) {
      var L = gm.x0 - 60, R = gm.x0 + gm.W + 60, B = gm.top + gm.H + 80;
      // 아래(기울어진 지층·화강암)
      ctx.save(); ctx.beginPath(); uPath(gm); ctx.lineTo(R, B); ctx.lineTo(L, B); ctx.closePath(); ctx.clip();
      var band = function (sa, sb, col) {
        ctx.beginPath(); ctx.moveTo(L, sa + gm.k * L); ctx.lineTo(R, sa + gm.k * R); ctx.lineTo(R, sb + gm.k * R); ctx.lineTo(L, sb + gm.k * L); ctx.closePath();
        ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke();
      };
      band(-2000, gm.s1, T.figSoftTeal); band(gm.s1, gm.s2, T.figSoftBlue); band(gm.s2, 3000, T.figSoftAmber);
      // 석회암 무늬, 사암 점
      ctx.fillStyle = T.figAmber;
      for (var i = 0; i < 90; i++) { var px = L + ((i * 53) % 1000) / 1000 * (R - L), py = gm.top + ((i * 97) % 1000) / 1000 * (gm.H + 60); if (py - gm.k * px > gm.s2) { ctx.beginPath(); ctx.arc(px, py, 1.4, 0, 6.3); ctx.fill(); } }
      ctx.beginPath(); ctx.ellipse(gm.G.x, gm.G.y, gm.G.rx, gm.G.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = T.figSoftRed; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = T.figRed;
      for (var j = 0; j < 30; j++) { var a = j * 2.4, rr = 0.25 + 0.7 * ((j * 37) % 10) / 10; var qx = gm.G.x + Math.cos(a) * gm.G.rx * rr, qy = gm.G.y + Math.sin(a) * gm.G.ry * rr; ctx.fillText('+', qx - 3, qy + 3); }
      ctx.restore();
      // 위(D, E)
      ctx.save(); ctx.beginPath(); uPath(gm); ctx.lineTo(R, gm.deY); ctx.lineTo(L, gm.deY); ctx.closePath(); ctx.fillStyle = T.figSoftViolet; ctx.fill(); ctx.clip();
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1;
      for (var m = 0; m < 40; m++) { var cx = L + ((m * 71) % 1000) / 1000 * (R - L), cy = gm.deY + 6 + ((m * 43) % 1000) / 1000 * (gm.uY(cx) - gm.deY - 8); ctx.beginPath(); ctx.ellipse(cx, cy, 4, 3, 0, 0, 6.3); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(L, gm.gY, R - L, gm.deY - gm.gY);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, gm.deY); ctx.lineTo(R, gm.deY); ctx.stroke();
      // 부정합면
      ctx.beginPath(); uPath(gm); ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.6; ctx.stroke();
      // 지표
      ctx.beginPath(); ctx.moveTo(L, gm.gY); ctx.lineTo(R, gm.gY); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke();
    }
    // 라벨 위치(최종 좌표)
    function labelPts(gm) {
      var right = function (p) { return { x: p.x + gm.odx, y: p.y + gm.off }; };
      var bandMid = function (s, x) { return { x: x, y: s + gm.k * x }; };
      return {
        A: bandMid((gm.s2 + gm.top + gm.H) / 2 + 0.0 * gm.H, gm.x0 + 0.08 * gm.W),
        B: bandMid((gm.s1 + gm.s2) / 2, gm.x0 + 0.5 * gm.W),
        C: bandMid(gm.s1 - 0.08 * gm.H, gm.x0 + 0.5 * gm.W),
        G: { x: gm.G.x, y: gm.top + gm.H * 0.7 },
        U: { x: gm.x0 + 0.06 * gm.W, y: gm.uY(gm.x0 + 0.06 * gm.W) },
        D: { x: gm.x0 + 0.5 * gm.W, y: (gm.deY + gm.uY(gm.x0 + 0.5 * gm.W)) / 2 },
        E: { x: gm.x0 + 0.3 * gm.W, y: (gm.gY + gm.deY) / 2 },
        F: { x: faultX(gm, gm.top + gm.H * 0.62), y: gm.top + gm.H * 0.62 },
        P: { x: gm.pX + gm.pW / 2, y: gm.top + gm.H * 0.84 },
        T: right({ x: gm.x0 + 0.9 * gm.W, y: gm.top + gm.H * 0.62 }),
      };
    }
    function draw() {
      var T = api.tokens(), gm = geo();
      ctx.clearRect(0, 0, cv.w, cv.h);
      ctx.save(); ctx.beginPath(); ctx.rect(gm.x0, gm.top, gm.W, gm.H); ctx.clip();
      ctx.fillStyle = T.figPaper; ctx.fillRect(gm.x0, gm.top, gm.W, gm.H);
      // 왼쪽 블록
      ctx.save(); ctx.beginPath(); ctx.moveTo(gm.x0 - 50, gm.top - 50); ctx.lineTo(gm.fA.x - 50 * (gm.fB.x - gm.fA.x) / gm.H, gm.top - 50); ctx.lineTo(gm.fB.x + 80 * (gm.fB.x - gm.fA.x) / gm.H, gm.top + gm.H + 80); ctx.lineTo(gm.x0 - 50, gm.top + gm.H + 80); ctx.closePath(); ctx.clip();
      ctx.beginPath(); ctx.rect(gm.x0 - 60, gm.gY, gm.W + 120, gm.H + 100); ctx.clip();
      drawPre(T, gm); ctx.restore();
      // 오른쪽 블록(아래로 어긋남)
      ctx.save(); ctx.beginPath(); ctx.moveTo(gm.fA.x - 50 * (gm.fB.x - gm.fA.x) / gm.H, gm.top - 50); ctx.lineTo(gm.x0 + gm.W + 60, gm.top - 50); ctx.lineTo(gm.x0 + gm.W + 60, gm.top + gm.H + 80); ctx.lineTo(gm.fB.x + 80 * (gm.fB.x - gm.fA.x) / gm.H, gm.top + gm.H + 80); ctx.closePath(); ctx.clip();
      ctx.translate(gm.odx, gm.off);
      ctx.beginPath(); ctx.rect(gm.x0 - 60, gm.gY, gm.W + 120, gm.H + 100); ctx.clip();
      drawPre(T, gm); ctx.restore();
      // 단층
      ctx.beginPath(); ctx.moveTo(gm.fA.x, gm.gY - 2); ctx.lineTo(gm.fB.x, gm.fB.y); ctx.strokeStyle = T.figInk; ctx.lineWidth = 3; ctx.stroke();
      // 암맥
      var pTop = gm.gY + gm.off;
      ctx.beginPath(); ctx.moveTo(gm.pX, gm.top + gm.H + 5);
      for (var y = gm.top + gm.H; y >= pTop; y -= 8) ctx.lineTo(gm.pX + Math.sin(y * 0.09) * 2, y);
      ctx.lineTo(gm.pX + gm.pW, pTop);
      for (var y2 = pTop; y2 <= gm.top + gm.H + 5; y2 += 8) ctx.lineTo(gm.pX + gm.pW + Math.sin(y2 * 0.07) * 2, y2);
      ctx.closePath(); ctx.fillStyle = T.figMuted; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(gm.x0, gm.top, gm.W, gm.H);
      // 라벨
      var LP = labelPts(gm), now = performance.now();
      Object.keys(LP).forEach(function (id) {
        var p = LP[id], i = done.indexOf(id);
        var txt = id === 'T' ? '기울어짐' : id;
        ctx.font = '600 13px ' + T.fontBody; var tw = Math.max(20, ctx.measureText(txt).width + 12);
        var bad = flash && flash.id === id && now - flash.t < 900;
        ctx.beginPath(); roundRect(p.x - tw / 2, p.y - 10, tw, 20, 10);
        ctx.fillStyle = bad ? T.figRed : (id === last ? T.figAccent : T.figPanel); ctx.fill();
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = bad || id === last ? T.figPanel : T.figInk; ctx.textAlign = 'center'; ctx.fillText(txt, p.x, p.y + 4.5);
        if (i >= 0) {
          ctx.beginPath(); ctx.arc(p.x + tw / 2 + 8, p.y - 9, 9, 0, Math.PI * 2); ctx.fillStyle = T.figGreen; ctx.fill();
          ctx.fillStyle = T.figPanel; ctx.font = '600 11px ' + T.fontBody; ctx.fillText(String(i + 1), p.x + tw / 2 + 8, p.y - 5);
        }
      });
      if (flash && now - flash.t < 900) requestAnimationFrame(draw);
    }
    function roundRect(x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    // 누른 곳 판정
    function unitAt(px, py) {
      var gm = geo(), LP = labelPts(gm), best = null, bd = 18;
      Object.keys(LP).forEach(function (id) { var d = Math.hypot(LP[id].x - px, LP[id].y - py); if (d < bd) { bd = d; best = id; } });
      if (best) return best;
      if (py < gm.gY) return null;
      if (px >= gm.pX - 3 && px <= gm.pX + gm.pW + 3 && py >= gm.gY + gm.off) return 'P';
      if (Math.abs(px - faultX(gm, py)) < 6) return 'F';
      var rightSide = px > faultX(gm, py);
      var x = px, y = py;
      if (rightSide) { x -= gm.odx; y -= gm.off; if (y < gm.gY) return null; }
      if (Math.abs(y - gm.uY(x)) < 5) return 'U';
      if (y < gm.deY) return 'E';
      if (y < gm.uY(x)) return 'D';
      if (Math.pow((x - gm.G.x) / gm.G.rx, 2) + Math.pow((y - gm.G.y) / gm.G.ry, 2) <= 1) return 'G';
      var s = y - gm.k * x;
      return s < gm.s1 ? 'C' : s < gm.s2 ? 'B' : 'A';
    }
    c.addEventListener('click', function (e) {
      var r = c.getBoundingClientRect(), id = unitAt(e.clientX - r.left, e.clientY - r.top);
      if (id) pick(id);
    });
    api.onResize(draw);
    msg('가장 먼저 일어난 일부터 그림이나 버튼을 눌러 보자.');
    refresh();
  },
});
