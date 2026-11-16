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
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.28 : 0.62; }, label: '심장과 온몸 순환, 폐순환의 경로 모식도' });
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
      var cw = Math.min(w * 0.17, 104), ch = h * (narrow ? 0.105 : 0.12), g = Math.max(16, cw * 0.2);
      var hy = h * (narrow ? 0.47 : 0.5);
      var lane = Math.max(26, cw * 0.36);
      var o = {
        narrow: narrow, cx: cx, cw: cw, ch: ch, g: g, hy: hy,
        lungT: h * 0.05, lungB: h * (narrow ? 0.2 : 0.23),
        bodyT: h * (narrow ? 0.73 : 0.77), bodyB: h * (narrow ? 0.88 : 0.95),
        L1: cx - g / 2 - cw - lane, R1: cx + g / 2 + cw + lane,
      };
      o.LW = Math.max(o.R1 - cx + 22, Math.min(w * 0.36, 230));
      o.BW = o.R1 - cx + 22;
      o.RA = { x: cx - g / 2 - cw, y: hy - ch, w: cw, h: ch };
      o.RV = { x: cx - g / 2 - cw, y: hy, w: cw, h: ch };
      o.LA = { x: cx + g / 2, y: hy - ch, w: cw, h: ch };
      o.LV = { x: cx + g / 2, y: hy, w: cw, h: ch };
      return o;
    }
    function build() {
      L = layout();
      var pts = [], c = function (r) { return [r.x + r.w / 2, r.y + r.h / 2]; };
      function go(region, x, y) { pts.push({ x: x, y: y, r: region }); }
      var lv = c(L.LV), ra = c(L.RA), rv = c(L.RV), la = c(L.LA);
      var lungM = (L.lungT + L.lungB) / 2, bodyM = (L.bodyT + L.bodyB) / 2;
      var inX = L.cx - L.cw * 0.75, outX = la[0], bend = L.lungB + (L.RA.y - L.lungB) * 0.4;
      go('LV', lv[0], lv[1]);
      go('LV', L.LV.x + L.cw, lv[1]);
      go('AO', L.R1, lv[1]); go('AO', L.R1, L.bodyT);
      go('BODY', L.R1, bodyM);
      var n = 10, i;
      for (i = 1; i <= n; i++) go('BODY', L.R1 + (L.L1 - L.R1) * i / n, bodyM + (i % 2 ? -1 : 1) * (L.bodyB - L.bodyT) * 0.16 * (i < n ? 1 : 0));
      go('BODY', L.L1, L.bodyT);
      go('VC', L.L1, ra[1]); go('VC', L.RA.x, ra[1]);
      go('RA', ra[0], ra[1]);
      go('RA', rv[0], L.hy);
      go('RV', rv[0], rv[1]);
      go('RV', L.cx - L.g / 2 - 4, L.hy + L.ch * 0.25);
      go('PA', L.cx, L.hy - 2); go('PA', L.cx, bend); go('PA', inX, bend); go('PA', inX, L.lungB);
      go('LUNG', inX, lungM);
      for (i = 1; i <= n; i++) go('LUNG', inX + (outX - inX) * i / n, lungM + (i % 2 ? 1 : -1) * (L.lungB - L.lungT) * 0.16 * (i < n ? 1 : 0));
      go('LUNG', outX, L.lungB);
      go('PV', outX, L.LA.y);
      go('LA', la[0], la[1]);
      go('LA', lv[0], L.hy);
      go('LV', lv[0], lv[1]);
      // 길이 누적
      path = []; total = 0;
      for (i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len < 0.01) continue;
        path.push({ a: a, b: b, r: b.r, s0: total, len: len }); total += len;
      }
      // 영역별 시작·끝(모세혈관에서 산소 양이 서서히 바뀌게)
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
    function oxy(p) {
      var sp = L.span[p.r];
      if (p.r === 'BODY') return 1 - (p.s - sp.s0) / (sp.s1 - sp.s0);
      if (p.r === 'LUNG') return (p.s - sp.s0) / (sp.s1 - sp.s0);
      return BODYLOOP[p.r] && p.r !== 'VC' && p.r !== 'RA' ? 1 : (p.r === 'PV' || p.r === 'LA') ? 1 : 0;
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

    /* ── 그리기 ── */
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var selId = STOPS[state.sel].id;
      // 폐, 온몸의 조직
      var lx = L.cx - L.LW, bx = L.cx - L.BW;
      ctx.globalAlpha = visibleRegion('LUNG') ? 1 : 0.3;
      rr(lx, L.lungT, L.LW * 2, L.lungB - L.lungT, 18); ctx.fillStyle = T.figSoftTeal; ctx.fill();
      ctx.lineWidth = selId === 'LUNG' ? 3 : 1.4; ctx.strokeStyle = selId === 'LUNG' ? T.figAmber : T.figTeal; ctx.stroke();
      ctx.globalAlpha = visibleRegion('BODY') ? 1 : 0.3;
      rr(bx, L.bodyT, L.BW * 2, L.bodyB - L.bodyT, 14); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      ctx.lineWidth = selId === 'BODY' ? 3 : 1.4; ctx.strokeStyle = T.figAmber; ctx.stroke();
      ctx.globalAlpha = 1;
      // 심장
      var pad = 10;
      rr(L.RA.x - pad, L.RA.y - pad, L.cw * 2 + L.g + pad * 2, L.ch * 2 + pad * 2, 22);
      ctx.fillStyle = T.figPaper; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = T.figLine; ctx.stroke();
      ['RA', 'RV', 'LA', 'LV'].forEach(function (id) {
        var r = L[id], art = id === 'LA' || id === 'LV';
        ctx.globalAlpha = visibleRegion(id) ? 1 : 0.3;
        rr(r.x, r.y, r.w, r.h, 8); ctx.fillStyle = art ? T.figSoftRed : T.figSoftBlue; ctx.fill();
        ctx.lineWidth = id === 'LV' ? 5 : 2; ctx.strokeStyle = art ? T.figRed : T.figBlue; ctx.stroke();
        if (selId === id) { rr(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10); ctx.lineWidth = 3; ctx.strokeStyle = T.figAmber; ctx.stroke(); }
      });
      ctx.globalAlpha = 1;
      // 혈관(관)
      var step = 3;
      for (var s = 0; s < total; s += step) {
        var p1 = at(s / total), p2 = at(Math.min(total, s + step + 0.6) / total);
        if (p1.r === 'RA' || p1.r === 'RV' || p1.r === 'LA' || p1.r === 'LV') continue;
        var vis = visibleRegion(p1.r), o = oxy(p1);
        var cap = p1.r === 'BODY' || p1.r === 'LUNG';
        ctx.globalAlpha = vis ? 1 : 0.18;
        if (p1.r === selId) { ctx.strokeStyle = T.figAmber; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
        ctx.strokeStyle = mix(T.figBlue, T.figRed, o);
        ctx.lineWidth = cap ? 4 : (p1.r === 'AO' || p1.r === 'PA' ? 10 : 8); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 판막(거꾸로 흐르지 않게): 흐름 방향을 가리키는 작은 쐐기
      [[L.LV.x + L.cw, L.LV.y + L.ch / 2, 0], [L.cx, L.hy - 4, -Math.PI / 2], [L.RA.x + L.cw / 2, L.hy, Math.PI / 2], [L.LA.x + L.cw / 2, L.hy, Math.PI / 2]].forEach(function (v) {
        ctx.save(); ctx.translate(v[0], v[1]); ctx.rotate(v[2]);
        ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(4, -2); ctx.lineTo(-5, -2); ctx.closePath();
        ctx.moveTo(-5, 8); ctx.lineTo(4, 2); ctx.lineTo(-5, 2); ctx.closePath();
        ctx.fillStyle = T.figInk; ctx.fill(); ctx.restore();
      });
      // 혈액 알갱이
      state.parts.forEach(function (u) {
        var p = at(u); if (!visibleRegion(p.r)) return;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = mix(T.figBlue, T.figRed, oxy(p)); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = T.figPanel; ctx.stroke();
      });
      labels(T);
    }
    function anchor(id) {
      var c = function (r) { return [r.x + r.w / 2, r.y + r.h / 2]; };
      var bodyM = (L.bodyT + L.bodyB) / 2, lungM = (L.lungT + L.lungB) / 2;
      switch (id) {
        case 'LV': case 'RA': case 'RV': case 'LA': var q = c(L[id]); return [q[0], q[1] + 9];
        case 'AO': return [L.R1, (L.LV.y + L.ch / 2 + L.bodyT) / 2];
        case 'VC': return [L.L1, (L.RA.y + L.ch / 2 + L.bodyT) / 2];
        case 'BODY': return [L.cx, L.bodyB - 14];
        case 'LUNG': return [L.cx, L.lungT + 14];
        case 'PA': return [L.cx - L.cw * 0.4, L.lungB + (L.RA.y - L.lungB) * 0.4];
        case 'PV': return [L.LA.x + L.cw / 2, (L.lungB + L.LA.y) / 2];
      }
    }
    function labels(T) {
      var fs = L.narrow ? 11 : 13;
      ctx.textBaseline = 'middle';
      STOPS.forEach(function (st, i) {
        var a = anchor(st.id), sel = i === state.sel, vis = visibleRegion(st.id);
        ctx.globalAlpha = vis ? 1 : 0.35;
        var chamber = st.id.length === 2 && 'LVRARVLA'.indexOf(st.id) >= 0 && ['LV', 'RA', 'RV', 'LA'].indexOf(st.id) >= 0;
        var nx = a[0], ny = a[1], tx, align;
        if (chamber) { ny = a[1] - 9 - L.ch * 0.18; }
        // 번호 표지
        var nxp = chamber ? nx - L.cw / 2 + 12 : nx, nyp = chamber ? L[st.id].y + 12 : ny;
        ctx.beginPath(); ctx.arc(nxp, nyp, 10, 0, Math.PI * 2);
        ctx.fillStyle = sel ? T.figAmber : T.figPanel; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = sel ? T.figAmber : T.figInk; ctx.stroke();
        ctx.fillStyle = sel ? T.figPanel : T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), nxp, nyp + 0.5);
        // 이름
        ctx.font = (sel ? '700 ' : '600 ') + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk;
        if (chamber) { tx = a[0] + 6; align = 'center'; ctx.textAlign = align; ctx.fillText(st.name, tx, a[1] + 2); }
        else if (st.id === 'AO') { ctx.textAlign = 'left'; ctx.fillText(st.name, a[0] + 15, a[1]); }
        else if (st.id === 'VC') { ctx.textAlign = 'right'; ctx.fillText(st.name, a[0] - 15, a[1]); }
        else if (st.id === 'PA') { ctx.textAlign = 'right'; ctx.fillText(st.name, a[0] - 14, a[1] + (L.narrow ? 18 : 0)); }
        else if (st.id === 'PV') { ctx.textAlign = 'left'; ctx.fillText(st.name, a[0] + 15, a[1]); }
        else if (st.id === 'LUNG') { ctx.textAlign = 'left'; ctx.fillText('폐', a[0] + 16, a[1]); }
        else if (st.id === 'BODY') { ctx.textAlign = 'left'; ctx.fillText('온몸의 조직세포', a[0] + 16, a[1]); }
      });
      ctx.globalAlpha = 1;
      // 기체 교환 설명
      ctx.font = fs - 1 + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      var lungX = L.cx + L.LW - 12, bodyX = L.cx + L.BW - 10;
      ctx.fillText('산소 받기 · 이산화 탄소 내보내기', lungX, L.lungT + 14);
      ctx.textAlign = 'left';
      ctx.fillText('산소·영양소 주기', L.cx - L.BW + 10, L.bodyT + 13);
      ctx.textAlign = 'right';
      ctx.fillText('이산화 탄소·노폐물 받기', bodyX, L.bodyT + 13);
      // 범례
      var lgY = L.narrow ? cv.h - 14 : 16, lgX = L.narrow ? 12 : 12;
      ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      var items = [[T.figRed, '산소가 많은 혈액'], [T.figBlue, '산소가 적은 혈액']];
      var x = lgX;
      items.forEach(function (it) {
        ctx.beginPath(); ctx.arc(x + 5, lgY, 5, 0, Math.PI * 2); ctx.fillStyle = it[0]; ctx.fill();
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], x + 14, lgY);
        x += ctx.measureText(it[1]).width + 30;
      });
      ctx.fillStyle = T.figMuted;
      if (L.narrow) { ctx.textAlign = 'right'; ctx.fillText('왼쪽 = 몸의 오른쪽', cv.w - 8, L.hy - L.ch - 22); }
      else { ctx.fillText('심장을 마주 본 모습(그림의 왼쪽 = 몸의 오른쪽)', lgX, lgY + 18); ctx.fillText('◀▶ 판막: 혈액이 거꾸로 흐르지 않게 한다', lgX, lgY + 36); }
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
