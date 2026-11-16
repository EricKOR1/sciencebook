/* 중2-6 동물과 에너지: 심장(2심방 2심실)과 온몸 순환·폐순환을 따라 흐르는 혈액 */
Sims.register('blood-circulation', {
  title: '혈액은 어떤 길로 도는가 — 온몸 순환과 폐순환',
  caption: '빨간 알갱이는 산소가 많은 혈액(동맥혈), 파란 알갱이는 산소가 적은 혈액(정맥혈)이다. 번호가 붙은 지점을 누르거나 ‘다음 지점’ 단추로 좌심실부터 한 바퀴를 따라가며 각 부분의 이름과 하는 일을 확인해 보자. 혈액은 온몸의 모세혈관에서 산소를 내주고, 폐의 모세혈관에서 산소를 받아 색이 바뀌며, 폐동맥에는 정맥혈이, 폐정맥에는 동맥혈이 흐른다. 심장을 마주 본 모식도이므로 그림의 왼쪽이 몸의 오른쪽이며, 혈관의 위치와 길이, 흐르는 빠르기는 실제와 다르게 단순화했다.',
  init: function (api) {
    var STOPS = [
      { id: 'LV', name: '좌심실', o: 1, loop: '온몸 순환의 출발', job: '심장에서 벽이 가장 두꺼운 방이다. 강하게 수축해 산소가 많은 혈액을 대동맥으로 내보낸다.' },
      { id: 'AO', name: '대동맥', o: 1, loop: '온몸 순환', job: '좌심실에서 나온 가장 굵은 동맥이다. 산소가 많은 혈액을 온몸으로 보낸다. 벽이 두껍고 탄력이 크다.' },
      { id: 'BODY', name: '온몸의 모세혈관', o: -1, loop: '온몸 순환', job: '조직세포에 산소와 영양소를 주고, 이산화 탄소와 노폐물을 받는다. 혈액이 가장 느리게 흘러 물질 교환을 충분히 한다.' },
      { id: 'VC', name: '대정맥', o: 0, loop: '온몸 순환', job: '온몸을 돌고 온, 산소가 적은 혈액을 우심방으로 보낸다. 정맥에는 혈액이 거꾸로 흐르지 않게 하는 판막이 있다.' },
      { id: 'RA', name: '우심방', o: 0, loop: '온몸 순환의 끝', job: '대정맥을 통해 온몸을 돌고 온 혈액을 받아 우심실로 보낸다.' },
      { id: 'RV', name: '우심실', o: 0, loop: '폐순환의 출발', job: '혈액을 폐동맥으로 내보내 폐로 보낸다.' },
      { id: 'PA', name: '폐동맥', o: 0, loop: '폐순환', job: '우심실에서 폐로 가는 동맥이다. 이름은 동맥이지만 산소가 적은 혈액(정맥혈)이 흐른다.' },
      { id: 'LUNG', name: '폐의 모세혈관', o: 2, loop: '폐순환', job: '폐포를 둘러싼 모세혈관이다. 확산으로 이산화 탄소를 폐포로 내보내고 산소를 받는다.' },
      { id: 'PV', name: '폐정맥', o: 1, loop: '폐순환', job: '폐에서 심장으로 오는 정맥이다. 이름은 정맥이지만 산소가 많은 혈액(동맥혈)이 흐른다.' },
      { id: 'LA', name: '좌심방', o: 1, loop: '폐순환의 끝', job: '폐정맥을 통해 폐를 거쳐 온 혈액을 받아 좌심실로 보낸다.' },
    ];
    var BODYLOOP = { LV: 1, AO: 1, BODY: 1, VC: 1, RA: 1 }, LUNGLOOP = { RV: 1, PA: 1, LUNG: 1, PV: 1, LA: 1 };
    var SPEED = { AO: 1.35, PA: 1.35, BODY: 0.35, LUNG: 0.35, VC: 0.9, PV: 0.9 };
    var state = { sel: 0, show: 'all', flowing: !api.reduced, parts: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.42 : 0.62; }, label: '심장과 온몸 순환, 폐순환의 경로 모식도' });
    var ctx = cv.ctx;
    var info = api.el('p', 'sim-hint');
    info.style.fontSize = '0.9rem'; info.style.lineHeight = '1.55'; info.style.paddingTop = '0.5rem';
    info.setAttribute('aria-live', 'polite');
    api.stage.appendChild(info);

    var rName = api.readout('고른 지점');
    var rBlood = api.readout('흐르는 혈액');
    var rLoop = api.readout('경로');

    var g1 = api.group();
    api.button('◀ 이전 지점', function () { select((state.sel + 9) % 10); }, { parent: g1 });
    api.button('다음 지점 ▶', function () { select((state.sel + 1) % 10); }, { primary: true, parent: g1 });
    var g2 = api.group();
    var showBtns = [['all', '전체'], ['body', '온몸 순환만'], ['lung', '폐순환만']].map(function (s, i) {
      return api.button(s[1], function () { state.show = s[0]; showBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }, { toggle: true, pressed: i === 0, parent: g2 });
    });
    var playBtn = api.button(state.flowing ? '흐름 멈추기' : '혈액 흐르게 하기', function () {
      state.flowing = !state.flowing;
      playBtn.textContent = state.flowing ? '흐름 멈추기' : '혈액 흐르게 하기';
      if (state.flowing) loop.play(); else { loop.pause(); draw(); }
    });

    /* ── 배치와 경로 ── */
    var L, path, total;
    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560, cx = w / 2;
      var cw = narrow ? w * 0.2 : Math.min(w * 0.17, 104), ch = h * (narrow ? 0.1 : 0.12), g = Math.max(16, cw * 0.2);
      var hy = h * (narrow ? 0.45 : 0.49);
      var lane = Math.max(26, cw * 0.36);
      var o = {
        narrow: narrow, cx: cx, cw: cw, ch: ch, g: g, hy: hy,
        lungT: h * (narrow ? 0.03 : 0.04), lungB: h * (narrow ? 0.2 : 0.23),
        bodyT: h * (narrow ? 0.69 : 0.74), bodyB: h * (narrow ? 0.89 : 0.96),
        L1: cx - g / 2 - cw - lane, R1: cx + g / 2 + cw + lane,
      };
      o.BW = o.R1 - cx + 24;
      o.LW = narrow ? o.BW : Math.max(o.BW, Math.min(w * 0.3, 200));
      o.RA = { x: cx - g / 2 - cw, y: hy - ch, w: cw, h: ch };
      o.RV = { x: cx - g / 2 - cw, y: hy, w: cw, h: ch };
      o.LA = { x: cx + g / 2, y: hy - ch, w: cw, h: ch };
      o.LV = { x: cx + g / 2, y: hy, w: cw, h: ch };
      o.lungW = o.lungT + (o.lungB - o.lungT) * 0.72;   // 폐 모세혈관(물결) 높이
      o.bodyW = o.bodyT + (o.bodyB - o.bodyT) * 0.3;
      o.inX = cx - cw * 0.75; o.outX = cx + g / 2 + cw / 2;
      o.bend = o.lungB + (hy - ch - o.lungB) * 0.45;
      return o;
    }
    function build() {
      L = layout();
      var pts = [];
      function go(region, x, y) { pts.push({ x: x, y: y, r: region }); }
      var ccx = function (r) { return r.x + r.w / 2; };
      var upY = function (r) { return r.y + r.h * 0.68; }, loY = function (r) { return r.y + r.h * 0.32; };
      var lungA = (L.lungB - L.lungT) * 0.13, bodyA = (L.bodyB - L.bodyT) * 0.12;
      go('LV', ccx(L.LV), loY(L.LV));
      go('LV', L.LV.x + L.cw, loY(L.LV));
      go('AO', L.R1, loY(L.LV)); go('AO', L.R1, L.bodyT);
      go('BODY', L.R1, L.bodyW);
      var n = 10, i;
      for (i = 1; i <= n; i++) go('BODY', L.R1 + (L.L1 - L.R1) * i / n, L.bodyW + (i < n ? (i % 2 ? -1 : 1) * bodyA : 0));
      go('BODY', L.L1, L.bodyT);
      go('VC', L.L1, upY(L.RA)); go('VC', L.RA.x, upY(L.RA));
      go('RA', ccx(L.RA), upY(L.RA));
      go('RA', ccx(L.RV), L.hy);
      go('RV', ccx(L.RV), loY(L.RV));
      go('RV', L.cx - L.g / 2, loY(L.RV) - 2);
      go('PA', L.cx, L.hy - 2); go('PA', L.cx, L.bend); go('PA', L.inX, L.bend); go('PA', L.inX, L.lungB);
      go('LUNG', L.inX, L.lungW);
      for (i = 1; i <= n; i++) go('LUNG', L.inX + (L.outX - L.inX) * i / n, L.lungW + (i < n ? (i % 2 ? 1 : -1) * lungA : 0));
      go('LUNG', L.outX, L.lungB);
      go('PV', L.outX, L.LA.y);
      go('LA', ccx(L.LA), upY(L.LA));
      go('LA', ccx(L.LV), L.hy);
      go('LV', ccx(L.LV), loY(L.LV));
      path = []; total = 0;
      for (i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len < 0.01) continue;
        path.push({ a: a, b: b, r: b.r, s0: total, len: len }); total += len;
      }
      var span = {};
      path.forEach(function (sg) { var sp = span[sg.r] || (span[sg.r] = { s0: sg.s0, s1: sg.s0 }); sp.s1 = sg.s0 + sg.len; });
      L.span = span;
      if (!state.parts.length) for (i = 0; i < 64; i++) state.parts.push(i / 64);
    }
    function at(u) {
      var s = ((u % 1) + 1) % 1 * total;
      for (var i = 0; i < path.length; i++) {
        var sg = path[i];
        if (s <= sg.s0 + sg.len || i === path.length - 1) {
          var f = Math.max(0, Math.min(1, (s - sg.s0) / sg.len));
          return { x: sg.a.x + (sg.b.x - sg.a.x) * f, y: sg.a.y + (sg.b.y - sg.a.y) * f, r: sg.r, s: s };
        }
      }
    }
    var OXY = { LV: 1, AO: 1, PV: 1, LA: 1, VC: 0, RA: 0, RV: 0, PA: 0 };
    function oxy(p) {
      var sp = L.span[p.r];
      if (p.r === 'BODY') return 1 - (p.s - sp.s0) / (sp.s1 - sp.s0);
      if (p.r === 'LUNG') return (p.s - sp.s0) / (sp.s1 - sp.s0);
      return OXY[p.r];
    }

    /* ── 색 ── */
    function rgb(c) {
      var m = /^#([0-9a-f]{6})/i.exec((c || '').trim());
      if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
      m = /rgba?\(([^)]+)\)/.exec(c || ''); if (m) return m[1].split(/[\s,]+/).map(parseFloat);
      return [128, 128, 128];
    }
    function mix(a, b, t) { var A = rgb(a), B = rgb(b); return 'rgb(' + [0, 1, 2].map(function (k) { return Math.round(A[k] + (B[k] - A[k]) * t); }).join(',') + ')'; }

    function visibleRegion(r) {
      if (state.show === 'body') return !!BODYLOOP[r];
      if (state.show === 'lung') return !!LUNGLOOP[r];
      return true;
    }
    var CHAMBER = { RA: 1, RV: 1, LA: 1, LV: 1 };

    /* ── 그리기 ── */
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var selId = STOPS[state.sel].id;
      var lx = L.cx - L.LW, bx = L.cx - L.BW;
      ctx.globalAlpha = visibleRegion('LUNG') ? 1 : 0.3;
      rr(lx, L.lungT, L.LW * 2, L.lungB - L.lungT, 18); ctx.fillStyle = T.figSoftTeal; ctx.fill();
      ctx.lineWidth = selId === 'LUNG' ? 3.5 : 1.4; ctx.strokeStyle = selId === 'LUNG' ? T.figAmber : T.figTeal; ctx.stroke();
      ctx.globalAlpha = visibleRegion('BODY') ? 1 : 0.3;
      rr(bx, L.bodyT, L.BW * 2, L.bodyB - L.bodyT, 14); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      ctx.lineWidth = selId === 'BODY' ? 3.5 : 1.4; ctx.strokeStyle = T.figAmber; ctx.stroke();
      ctx.globalAlpha = 1;
      var pad = 9;
      rr(L.RA.x - pad, L.RA.y - pad, L.cw * 2 + L.g + pad * 2, L.ch * 2 + pad * 2, 22);
      ctx.fillStyle = T.figPaper; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = T.figLine; ctx.stroke();
      ['RA', 'RV', 'LA', 'LV'].forEach(function (id) {
        var r = L[id], art = id === 'LA' || id === 'LV';
        ctx.globalAlpha = visibleRegion(id) ? 1 : 0.3;
        rr(r.x, r.y, r.w, r.h, 8); ctx.fillStyle = art ? T.figSoftRed : T.figSoftBlue; ctx.fill();
        ctx.lineWidth = id === 'LV' ? 5 : 2; ctx.strokeStyle = art ? T.figRed : T.figBlue; ctx.stroke();
        if (selId === id) { rr(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 11); ctx.lineWidth = 3; ctx.strokeStyle = T.figAmber; ctx.stroke(); }
      });
      ctx.globalAlpha = 1;
      // 혈관(관): 잘게 나누어 산소 양에 따라 색을 바꾼다
      var step = 3, s, p1, p2;
      ctx.lineCap = 'round';
      for (s = 0; s < total; s += step) {
        p1 = at(s / total); p2 = at(Math.min(total, s + step + 0.6) / total);
        if (p1.r !== selId || CHAMBER[p1.r]) continue;
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      for (s = 0; s < total; s += step) {
        p1 = at(s / total); p2 = at(Math.min(total, s + step + 0.6) / total);
        var cap = p1.r === 'BODY' || p1.r === 'LUNG';
        ctx.globalAlpha = visibleRegion(p1.r) ? 0.42 : 0.1;
        ctx.strokeStyle = mix(T.figBlue, T.figRed, oxy(p1));
        ctx.lineWidth = cap ? 5 : CHAMBER[p1.r] ? 6 : (p1.r === 'AO' || p1.r === 'PA' ? 11 : 9);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 판막(거꾸로 흐르지 않게): 흐름 방향을 가리키는 작은 쐐기 한 쌍
      var loY = function (r) { return r.y + r.h * 0.32; };
      [[L.LV.x + L.cw, loY(L.LV), 0], [L.cx, L.hy - 6, -Math.PI / 2], [L.RA.x + L.cw / 2, L.hy, Math.PI / 2], [L.LA.x + L.cw / 2, L.hy, Math.PI / 2]].forEach(function (v) {
        valve(T, v[0], v[1], v[2]);
      });
      // 혈액 알갱이
      state.parts.forEach(function (u) {
        var p = at(u); if (!visibleRegion(p.r)) return;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = mix(T.figBlue, T.figRed, oxy(p)); ctx.fill();
      });
      labels(T);
    }
    function valve(T, x, y, ang) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(4, -2); ctx.lineTo(-5, -2); ctx.closePath();
      ctx.moveTo(-5, 8); ctx.lineTo(4, 2); ctx.lineTo(-5, 2); ctx.closePath();
      ctx.fillStyle = T.figInk; ctx.fill(); ctx.restore();
    }
    // 번호 표지의 위치
    function anchor(id) {
      switch (id) {
        case 'RA': case 'LA': return [L[id].x + 13, L[id].y + 13];
        case 'RV': case 'LV': return [L[id].x + 13, L[id].y + L.ch - 13];
        case 'AO': return [L.R1, (L.LV.y + L.ch * 0.32 + L.bodyT) / 2];
        case 'VC': return [L.L1, (L.RA.y + L.ch * 0.68 + L.bodyT) / 2];
        case 'BODY': return [L.cx - L.BW + 34, L.bodyT + (L.bodyB - L.bodyT) * 0.62];
        case 'LUNG': return [L.cx - L.LW + 20, L.lungT + 14];
        case 'PA': return [L.inX, (L.bend + L.lungB) / 2];
        case 'PV': return [L.outX, (L.lungB + L.LA.y) / 2];
      }
    }
    function marker(T, x, y, n, sel) {
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = sel ? T.figAmber : T.figPanel; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = sel ? T.figAmber : T.figInk; ctx.stroke();
      ctx.fillStyle = sel ? T.figPanel : T.figInk; ctx.font = '700 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(n), x, y + 0.5);
    }
    function labels(T) {
      var fs = L.narrow ? 12 : 13, sm = L.narrow ? 11 : 12;
      ctx.textBaseline = 'middle';
      STOPS.forEach(function (st, i) {
        var a = anchor(st.id), sel = i === state.sel;
        ctx.globalAlpha = visibleRegion(st.id) ? 1 : 0.35;
        marker(T, a[0], a[1], i + 1, sel);
        ctx.font = (sel ? '700 ' : '600 ') + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textBaseline = 'middle';
        var right = st.id === 'VC' || st.id === 'PA';
        ctx.textAlign = right ? 'right' : 'left';
        var name = st.id === 'LUNG' ? '폐' : st.id === 'BODY' ? '온몸의 조직세포' : st.name;
        ctx.fillText(name, a[0] + (right ? -14 : 14), a[1] + 0.5);
      });
      ctx.globalAlpha = 1;
      // 기체·물질 교환 설명
      ctx.font = sm + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.globalAlpha = visibleRegion('LUNG') ? 1 : 0.35;
      ctx.fillText(L.narrow ? '이산화 탄소 내보내고 산소 받기' : '폐포를 둘러싼 모세혈관: 이산화 탄소 내보내고 산소 받기', L.cx + (L.narrow ? 12 : 16), L.lungT + (L.narrow ? 32 : 14));
      ctx.globalAlpha = visibleRegion('BODY') ? 1 : 0.35;
      ctx.fillText('산소·영양소 주고, 이산화 탄소·노폐물 받기', L.cx, L.bodyT + (L.bodyB - L.bodyT) * 0.84);
      ctx.globalAlpha = 1;
      // 범례
      ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      var rows = [[T.figRed, '산소가 많은 혈액'], [T.figBlue, '산소가 적은 혈액'], ['v', '판막(거꾸로 흐름 막기)'], ['', '그림 왼쪽 = 몸의 오른쪽']];
      rows.forEach(function (it, k) {
        var x, y;
        if (L.narrow) { x = 10 + (k % 2) * (cv.w / 2); y = cv.h - 30 + Math.floor(k / 2) * 18; }
        else { x = 10; y = L.lungB + 16 + k * 20; }
        if (it[0] === 'v') valve(T, x + 5, y, 0);
        else if (it[0]) { ctx.beginPath(); ctx.arc(x + 5, y, 5, 0, Math.PI * 2); ctx.fillStyle = it[0]; ctx.fill(); }
        ctx.fillStyle = it[0] ? T.figInk : T.figMuted; ctx.textAlign = 'left';
        ctx.fillText(it[1], x + (it[0] ? 15 : 0), y + 0.5);
      });
    }

    /* ── 고르기 ── */
    function select(i) {
      state.sel = i; var st = STOPS[i];
      rName.set((i + 1) + '. ' + st.name);
      rBlood.set(st.o === -1 ? '산소 많음 → 적음' : st.o === 2 ? '산소 적음 → 많음' : st.o ? '산소가 많은 혈액(동맥혈)' : '산소가 적은 혈액(정맥혈)');
      rLoop.set(st.loop);
      info.textContent = st.name + ': ' + st.job;
      draw();
    }
    cv.canvas.addEventListener('click', function (e) {
      var rect = cv.canvas.getBoundingClientRect(), x = (e.clientX - rect.left) * cv.w / rect.width, y = (e.clientY - rect.top) * cv.h / rect.height;
      var best = -1, bd = 1e9;
      STOPS.forEach(function (st, i) {
        var d;
        if (L[st.id] && L[st.id].w) { var r = L[st.id]; d = (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ? 0 : 1e9; }
        else if (st.id === 'LUNG') d = (y >= L.lungT && y <= L.lungB && Math.abs(x - L.cx) <= L.LW) ? 4 : 1e9;
        else if (st.id === 'BODY') d = (y >= L.bodyT && y <= L.bodyB && Math.abs(x - L.cx) <= L.BW) ? 4 : 1e9;
        else {
          d = 1e9;
          path.forEach(function (sg) {
            if (sg.r !== st.id) return;
            var dx = sg.b.x - sg.a.x, dy = sg.b.y - sg.a.y, t = Math.max(0, Math.min(1, ((x - sg.a.x) * dx + (y - sg.a.y) * dy) / (dx * dx + dy * dy)));
            d = Math.min(d, Math.hypot(x - sg.a.x - dx * t, y - sg.a.y - dy * t));
          });
          var a = anchor(st.id); d = Math.min(d, Math.hypot(x - a[0], y - a[1]));
          if (d > 22) d = 1e9;
        }
        if (d < bd) { bd = d; best = i; }
      });
      if (best >= 0) select(best);
    });

    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var base = (L.narrow ? 70 : 95) / total;
      state.parts = state.parts.map(function (u) { var p = at(u); return (u + dt * base * (SPEED[p.r] || 1)) % 1; });
      draw();
    });
    if (!state.flowing) loop.pause();

    api.onResize(function () { build(); draw(); });
    build(); select(0);
  },
});
