/* 중2-2 지권의 변화: 과정을 하나씩 골라 암석의 순환 경로를 따라가 본다 */
Sims.register('rock-cycle', {
  title: '암석의 순환 — 돌 하나의 긴 여행 따라가기',
  caption: '지금 상태에서 일어날 수 있는 과정 버튼을 눌러 암석이 어떻게 바뀌는지 따라가 보자. 굵은 화살표는 지금 고를 수 있는 길이고, 지나온 길은 번호로 남는다. 화성암·퇴적암·변성암은 정해진 한 방향으로만 바뀌는 것이 아니라 환경에 따라 여러 길로 서로 바뀐다. 실제로는 한 단계에 수백만 년 이상이 걸리며, 그림의 위치는 일어나는 곳(지표 부근·땅속 깊은 곳)을 단순하게 나타낸 것이다.',
  init: function (api) {
    var NODES = {
      magma: { name: '마그마', desc: '땅속에서 암석이 녹은 것', ex: '', x: 0.78, y: 0.82, where: '땅속 깊은 곳' },
      igneous: { name: '화성암', desc: '마그마가 식어 굳은 암석', ex: '현무암·화강암 등', x: 0.8, y: 0.4, where: '지표 근처(빨리 식음) 또는 지하 깊은 곳(천천히 식음)' },
      sediment: { name: '퇴적물', desc: '자갈·모래·진흙', ex: '', x: 0.42, y: 0.15, where: '지표 (강·바다 밑 등)' },
      sedimentary: { name: '퇴적암', desc: '퇴적물이 다져지고 굳은 암석', ex: '역암·사암·이암·석회암', x: 0.15, y: 0.45, where: '퇴적물이 두껍게 쌓인 아래쪽' },
      metamorphic: { name: '변성암', desc: '열·압력으로 성질이 바뀐 암석', ex: '편암·편마암·대리암·규암', x: 0.38, y: 0.82, where: '땅속 깊은 곳 (녹지는 않음)' },
    };
    var PROCS = [
      { key: 'erode', label: '풍화·침식·운반·퇴적', why: '지표에 드러나 부서지고 물·바람에 운반되어 쌓인다' },
      { key: 'lithify', label: '다져짐·굳어짐', why: '위에 쌓인 퇴적물의 무게로 다져지고 알갱이 사이가 메워져 굳는다' },
      { key: 'meta', label: '열·압력', why: '땅속 깊은 곳에서 높은 열과 압력을 받아, 녹지 않은 채 광물 배열과 성질이 바뀐다' },
      { key: 'melt', label: '녹음', why: '더 높은 온도에서 녹아 마그마가 된다' },
      { key: 'cool', label: '식어 굳음', why: '마그마가 식어 굳는다' },
    ];
    var EDGES = [
      ['magma', 'igneous', 'cool'], ['igneous', 'sediment', 'erode'], ['sedimentary', 'sediment', 'erode'], ['metamorphic', 'sediment', 'erode'],
      ['sediment', 'sedimentary', 'lithify'], ['igneous', 'metamorphic', 'meta'], ['sedimentary', 'metamorphic', 'meta'],
      ['igneous', 'magma', 'melt'], ['sedimentary', 'magma', 'melt'], ['metamorphic', 'magma', 'melt'],
    ];
    var START = 'igneous';
    var state = { at: START, path: [], anim: 1, msg: '' };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.6; }, label: '암석의 순환 경로 그림' });
    var ctx = cv.ctx;
    var rAt = api.readout('지금 상태'), rWhere = api.readout('일어나는 곳'), rMsg = api.readout('방금 일어난 일');

    var g = api.group();
    var btns = PROCS.map(function (p) { return api.button(p.label, function () { apply(p.key); }, { parent: g }); });
    api.button('처음부터 (화성암)', function () { state.at = START; state.path = []; state.msg = ''; state.anim = 1; sync(); draw(); });

    function edge(from, proc) { for (var i = 0; i < EDGES.length; i++) if (EDGES[i][0] === from && EDGES[i][2] === proc) return EDGES[i]; return null; }
    function procOf(k) { return PROCS.filter(function (p) { return p.key === k; })[0]; }
    function apply(k) {
      var e = edge(state.at, k), p = procOf(k);
      if (!e) {
        var hint = { erode: '풍화·침식은 지표에 드러난 단단한 암석에서 일어난다', lithify: '다져지고 굳는 것은 쌓인 퇴적물이다', meta: '열·압력으로 변성되는 것은 이미 굳은 암석이다', melt: state.at === 'magma' ? '이미 녹은 상태이다' : '퇴적물은 먼저 다져지고 굳어 암석이 되어야 한다', cool: '식어 굳으려면 먼저 녹아서 마그마가 되어야 한다' }[k];
        state.msg = NODES[state.at].name + '에서는 ‘' + p.label + '’이(가) 바로 일어나지 않는다 — ' + hint;
        sync(); draw(); return;
      }
      state.path.push(e); if (state.path.length > 12) state.path.shift();
      state.at = e[1]; state.msg = NODES[e[0]].name + ' → ' + NODES[e[1]].name + ': ' + p.why;
      state.anim = api.reduced ? 1 : 0; if (!api.reduced) loop.play();
      sync(); draw();
    }
    function sync() {
      var n = NODES[state.at];
      rAt.set(n.name + (n.ex ? ' (예: ' + n.ex + ')' : ' — ' + n.desc));
      rWhere.set(n.where);
      rMsg.set(state.msg || '아래 버튼에서 과정을 골라 보자');
      btns.forEach(function (b, i) { var ok = !!edge(state.at, PROCS[i].key); b.classList.toggle('primary', ok); b.setAttribute('aria-label', PROCS[i].label + (ok ? ' (지금 가능)' : ' (지금은 불가)')); });
    }
    var loop = api.loop(function (dt) { if (!(dt > 0)) return; state.anim = Math.min(1, state.anim + dt * 1.2); draw(); if (state.anim >= 1) loop.pause(); });
    loop.pause();

    function pos(k) { var n = NODES[k]; return { x: 40 + n.x * (cv.w - 80), y: 30 + n.y * (cv.h - 60) }; }
    function curve(e) {   // 진행 방향의 왼쪽으로 휜 곡선 → 반대 방향 화살표와 겹치지 않음
      var a = pos(e[0]), b = pos(e[1]), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      var k = 0.16 * L; return { a: a, b: b, c: { x: mx + dy / L * k, y: my - dx / L * k } };
    }
    function qp(c, t) { var u = 1 - t; return { x: u * u * c.a.x + 2 * u * t * c.c.x + t * t * c.b.x, y: u * u * c.a.y + 2 * u * t * c.c.y + t * t * c.b.y }; }
    function nodeR() { return cv.w < 560 ? 30 : 40; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, R = nodeR();
      ctx.clearRect(0, 0, w, h);
      // 지표 부근 / 땅속 깊은 곳 배경
      var sy = 30 + 0.62 * (h - 60);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(0, 0, w, sy);
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(0, sy, w, h - sy);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('지표 부근', 8, 6); ctx.textBaseline = 'bottom'; ctx.fillText('땅속 깊은 곳 (온도·압력 높음)', 8, h - 6);
      var avail = EDGES.filter(function (e) { return e[0] === state.at; });
      var last = state.path[state.path.length - 1];
      // 모든 화살표(흐리게) → 지나온 길 → 고를 수 있는 길
      EDGES.forEach(function (e) {
        var on = avail.indexOf(e) >= 0, done = state.path.indexOf(e) >= 0;
        arrowCurve(T, e, on ? T.figAccent : done ? T.figViolet : T.figLine, on ? 3 : done ? 2.4 : 1.4, on || done ? 1 : 0.7, R);
      });
      // 지나온 길 번호
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      state.path.forEach(function (e, i) {
        var c = curve(e), m = qp(c, 0.3);
        ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = T.figPanel; ctx.font = '600 11px ' + T.fontMono; ctx.fillText(i + 1, m.x, m.y + 0.5);
      });
      // 마디
      Object.keys(NODES).forEach(function (k) {
        var p = pos(k), n = NODES[k], cur = k === state.at;
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
        ctx.fillStyle = cur ? T.figSoftBlue : T.figPanel; ctx.fill();
        ctx.lineWidth = cur ? 3.5 : 1.5; ctx.strokeStyle = cur ? T.figAccent : T.figLine; ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '600 ' + (narrow ? 13 : 15) + 'px ' + T.fontBody; ctx.fillText(n.name, p.x, p.y);
        if (!narrow) { ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText(n.ex || n.desc, p.x, p.y + R + 12); }
      });
      // 이름표: 고를 수 있는 길
      ctx.font = '600 ' + (narrow ? 11 : 12) + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (!narrow) avail.forEach(function (e) { var c = curve(e), m = qp(c, 0.5); tag(T, procOf(e[2]).label, m.x, m.y, T.figAccent); });
      if (!narrow && last && avail.indexOf(last) < 0) { var c0 = curve(last), m0 = qp(c0, 0.5); tag(T, procOf(last[2]).label, m0.x, m0.y, T.figViolet); }
      // 움직이는 돌
      if (last && state.anim < 1) {
        var c1 = curve(last), q = qp(c1, 0.15 + 0.7 * state.anim);
        ctx.fillStyle = T.figAmber; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    function arrowCurve(T, e, color, lw, alpha, R) {
      var c = curve(e), t0 = 0, t1 = 1, i;
      for (i = 0; i <= 50; i++) { var p = qp(c, i / 50); if (Math.hypot(p.x - c.a.x, p.y - c.a.y) > R + 2) { t0 = i / 50; break; } }
      for (i = 50; i >= 0; i--) { var q = qp(c, i / 50); if (Math.hypot(q.x - c.b.x, q.y - c.b.y) > R + 4) { t1 = i / 50; break; } }
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
      ctx.beginPath();
      for (i = 0; i <= 30; i++) { var r = qp(c, t0 + (t1 - t0) * i / 30); if (i) ctx.lineTo(r.x, r.y); else ctx.moveTo(r.x, r.y); }
      ctx.stroke();
      var e1 = qp(c, t1), e0 = qp(c, t1 - 0.04), ang = Math.atan2(e1.y - e0.y, e1.x - e0.x), hs = 6 + lw * 2;
      ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e1.x - hs * Math.cos(ang - 0.42), e1.y - hs * Math.sin(ang - 0.42));
      ctx.lineTo(e1.x - hs * Math.cos(ang + 0.42), e1.y - hs * Math.sin(ang + 0.42)); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function tag(T, t, x, y, color) {
      var w = ctx.measureText(t).width + 12;
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(x - w / 2, y - 10, w, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.fillText(t, x, y + 0.5);
    }

    api.onResize(draw);
    sync(); draw();
  },
});
