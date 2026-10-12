/* 3-5 막을 통한 물질 이동: 입자는 무작위로 움직이지만 알짜 이동이 생긴다 (확산·삼투·적혈구) */
Sims.register('osmosis', {
  title: '막을 사이에 둔 입자들 — 확산과 삼투',
  caption: '입자 하나하나는 방향 없이 무작위로 움직이며 막을 양쪽으로 오간다. 그래도 한쪽으로 가는 수가 더 많아 알짜 이동이 생긴다. 확산에서는 용질이 농도가 높은 쪽 → 낮은 쪽으로, 삼투에서는 물이 용질 농도가 낮은 쪽 → 높은 쪽으로 이동한다(적혈구 실험도 눌러 보자). 입자 수·속도·수위는 설명을 위해 단순화한 모형이며, 실제 삼투에서는 높아진 수위의 압력 때문에 수위 차이가 어느 정도에서 멈춘다.',
  init: function (api) {
    var NSIDE = 90;          // 한쪽 칸의 처음 입자 수(물 + 용질): 두 칸의 처음 부피를 같게
    var H0 = 0.45;           // 처음 수위(통 높이에 대한 비율)
    var K = 2.6;             // 용질이 많은 쪽 물이 막을 덜 통과하는 정도(단순화 모형)
    var P0 = 0.55;           // 막에 닿은 입자가 통과할 확률
    var SPEED = { w: 0.55, s: 0.16, d: 0.6 };
    var st = { mode: 'osmo', nL: 2, nR: 12, rbc: 'hypo', parts: [], cnt: null, lv: [H0, H0], cross: null, rbcP: 0, drops: [] };
    var dnL = 20, dnR = 0, onL = 2, onR = 12;   // 모드별로 기억해 두는 슬라이더 값

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.56; }, label: '반투과성 막으로 나뉜 두 칸에서 물 분자와 용질 입자가 움직이는 모습' });
    var ctx = cv.ctx;

    function ro(label) { var r = api.readout(label); r.span = api.readouts.lastChild; return r; }
    var R = {
      wLR: ro('물 통과 왼쪽 → 오른쪽'), wRL: ro('물 통과 오른쪽 → 왼쪽'), lvl: ro('수위 왼쪽 : 오른쪽'),
      sCnt: ro('용질 수 왼쪽 : 오른쪽'), sLR: ro('용질 통과 왼쪽 → 오른쪽'), sRL: ro('용질 통과 오른쪽 → 왼쪽'),
      out: ro('바깥 용액'), net: ro('물의 알짜 이동'), cell: ro('적혈구의 변화'),
    };

    var gMode = api.group();
    var modeBtns = {
      diff: api.button('확산', function () { setMode('diff'); }, { toggle: true, parent: gMode }),
      osmo: api.button('삼투', function () { setMode('osmo'); }, { toggle: true, pressed: true, parent: gMode }),
      rbc: api.button('적혈구 실험', function () { setMode('rbc'); }, { toggle: true, parent: gMode }),
    };
    var sL = api.slider({ id: 'osmosis-left', label: '왼쪽 용질 입자 수', min: 0, max: 20, step: 1, value: st.nL,
      format: function (v) { return v + '개'; }, onInput: function (v) { st.nL = v; remember(); restart(); } });
    var sR = api.slider({ id: 'osmosis-right', label: '오른쪽 용질 입자 수', min: 0, max: 20, step: 1, value: st.nR,
      format: function (v) { return v + '개'; }, onInput: function (v) { st.nR = v; remember(); restart(); } });
    var gRbc = api.group();
    var rbcBtns = {
      hypo: api.button('저장액(증류수)', function () { setRbc('hypo'); }, { toggle: true, pressed: true, parent: gRbc }),
      iso: api.button('등장액(생리 식염수)', function () { setRbc('iso'); }, { toggle: true, parent: gRbc }),
      hyper: api.button('고장액(진한 소금물)', function () { setRbc('hyper'); }, { toggle: true, parent: gRbc }),
    };
    var playBtn = api.button(api.reduced ? '10초 진행' : '멈춤', function () { togglePlay(); }, { primary: true });
    var resetBtn = api.button('처음으로', function () { restart(); });

    function remember() { if (st.mode === 'diff') { dnL = st.nL; dnR = st.nR; } else { onL = st.nL; onR = st.nR; } }
    function setMode(m) {
      st.mode = m;
      Object.keys(modeBtns).forEach(function (k) { modeBtns[k].setAttribute('aria-pressed', k === m ? 'true' : 'false'); });
      var tank = m !== 'rbc';
      sL.input.parentNode.style.display = tank ? '' : 'none';
      sR.input.parentNode.style.display = tank ? '' : 'none';
      gRbc.style.display = tank ? 'none' : '';
      if (m === 'diff') { sL.input.value = dnL; sR.input.value = dnR; st.nL = dnL; st.nR = dnR; }
      if (m === 'osmo') { sL.input.value = onL; sR.input.value = onR; st.nL = onL; st.nR = onR; }
      sL.input.dispatchEvent(new Event('input')); sR.input.dispatchEvent(new Event('input'));
      ['wLR', 'wRL', 'lvl'].forEach(function (k) { R[k].span.style.display = m === 'osmo' ? '' : 'none'; });
      ['sCnt', 'sLR', 'sRL'].forEach(function (k) { R[k].span.style.display = m === 'diff' ? '' : 'none'; });
      ['out', 'net', 'cell'].forEach(function (k) { R[k].span.style.display = m === 'rbc' ? '' : 'none'; });
      restart();
    }
    function setRbc(k) {
      st.rbc = k;
      Object.keys(rbcBtns).forEach(function (n) { rbcBtns[n].setAttribute('aria-pressed', n === k ? 'true' : 'false'); });
      restart();
    }

    /* ───── 입자 모형 (세계 좌표: 가로 0~2, 막은 x = 1, 세로 0(바닥)~1(통 위)) ───── */
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(2 * Math.PI * Math.random()); }
    function addPart(kind, side) {
      var s = SPEED[kind], a = Math.random() * Math.PI * 2;
      st.parts.push({ kind: kind, side: side, x: side ? rnd(1.03, 1.97) : rnd(0.03, 0.97), y: rnd(0.03, H0 - 0.03),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s });
    }
    function restart() {
      st.parts = []; st.cross = { wLR: 0, wRL: 0, sLR: 0, sRL: 0 }; st.lv = [H0, H0]; st.rbcP = 0; st.drops = [];
      var skind = st.mode === 'diff' ? 'd' : 's';
      [st.nL, st.nR].forEach(function (ns, side) {
        for (var i = 0; i < NSIDE - ns; i++) addPart('w', side);
        for (var j = 0; j < ns; j++) addPart(skind, side);
      });
      recount();
      if (api.reduced) { setPlayLabel(); draw(); readouts(); return; }
      loop.play(); setPlayLabel(); draw(); readouts();
    }
    function recount() {
      var c = { w: [0, 0], s: [0, 0] };
      st.parts.forEach(function (p) { if (p.kind === 'w') c.w[p.side]++; else c.s[p.side]++; });
      st.cnt = c;
    }
    function targetLevel(side) {
      if (st.mode !== 'osmo') return H0;
      return Math.min(0.94, H0 * (st.cnt.w[side] + st.cnt.s[side]) / NSIDE);
    }
    function passProb(p) {
      if (p.kind === 's') return 0;
      if (p.kind === 'd') return 0.9;
      if (st.mode === 'diff') return P0;
      var w = st.cnt.w[p.side], s = st.cnt.s[p.side];
      return P0 * Math.max(0.08, 1 - K * s / Math.max(1, w + s));
    }
    var RW = { w: 0.012, s: 0.032, d: 0.02 };
    function step(dt) {
      for (var side = 0; side < 2; side++) st.lv[side] += (targetLevel(side) - st.lv[side]) * Math.min(1, dt * 2.5);
      var g = 4;
      st.parts.forEach(function (p) {
        var s = SPEED[p.kind], r = RW[p.kind], k = Math.sqrt(2 * g * dt) * s;
        p.vx += -g * p.vx * dt + k * gauss(); p.vy += -g * p.vy * dt + k * gauss();
        p.x += p.vx * dt; p.y += p.vy * dt;
        var lo = p.side ? 1 : 0, hi = lo + 1, top = st.lv[p.side] - r;
        if (p.y < r) { p.y = 2 * r - p.y; p.vy = Math.abs(p.vy); }
        if (p.y > top) { p.y = Math.max(r, top - (p.y - top)); p.vy = -Math.abs(p.vy); }
        var outer = p.side ? hi - r : lo + r;
        if (!p.side && p.x < outer) { p.x = 2 * outer - p.x; p.vx = Math.abs(p.vx); }
        if (p.side && p.x > outer) { p.x = 2 * outer - p.x; p.vx = -Math.abs(p.vx); }
        // 막(x = 1)에 닿았을 때
        var hit = p.side ? p.x < 1 + r * 0.5 : p.x > 1 - r * 0.5;
        if (hit) {
          var other = 1 - p.side;
          if (Math.random() < passProb(p) && p.y < st.lv[other] - r) {
            var key = (p.kind === 'w' ? 'w' : 's') + (p.side ? 'RL' : 'LR');
            st.cross[key]++;
            if (p.kind === 'w') { st.cnt.w[p.side]--; st.cnt.w[other]++; } else { st.cnt.s[p.side]--; st.cnt.s[other]++; }
            p.side = other; p.x = other ? 1 + r : 1 - r;
          } else {
            p.x = p.side ? 1 + r : 1 - r; p.vx = p.side ? Math.abs(p.vx) : -Math.abs(p.vx);
          }
        }
      });
    }
    /* ───── 적혈구 실험 ───── */
    var RBC = {
      hypo: { name: '저장액(증류수)', outC: 0, net: '바깥 → 세포 안', res: '부풀다가 터진다(용혈)', plant: '식물 세포라면: 부풀지만 세포벽 때문에 터지지 않고 팽팽해진다(팽압 증가)', inR: 3, outR: 1 },
      iso: { name: '등장액(생리 식염수)', outC: 1, net: '없음(들어오는 양 = 나가는 양)', res: '모양 유지', plant: '식물 세포라면: 모양 유지', inR: 1, outR: 1 },
      hyper: { name: '고장액(진한 소금물)', outC: 2.6, net: '세포 안 → 바깥', res: '쭈그러든다', plant: '식물 세포라면: 세포막이 세포벽에서 떨어진다(원형질 분리)', inR: 1, outR: 3 },
    };
    function rbcStep(dt) {
      st.rbcP = Math.min(1, st.rbcP + dt / 4);
      var c = RBC[st.rbc], burst = st.rbc === 'hypo' && st.rbcP > 0.85;
      if (!burst) {
        var bias = st.rbcP < 1 ? 1 : 0;
        var rin = (bias ? c.inR : 1) * 3, rout = (bias ? c.outR : 1) * 3;
        if (Math.random() < rin * dt) st.drops.push({ dir: -1, t: 0, a: Math.random() * Math.PI * 2 });
        if (Math.random() < rout * dt) st.drops.push({ dir: 1, t: 0, a: Math.random() * Math.PI * 2 });
      }
      st.drops.forEach(function (d) { d.t += dt / 1.6; });
      st.drops = st.drops.filter(function (d) { return d.t < 1; });
    }

    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;   // 첫 프레임의 dt가 0 이하일 수 있음
      if (st.mode === 'rbc') rbcStep(dt);
      else { var n = 3; for (var i = 0; i < n; i++) step(dt / n); }
      draw(); readouts();
    });
    function togglePlay() {
      if (api.reduced) {
        if (st.mode === 'rbc') { st.rbcP = 1; st.drops = []; }
        else for (var i = 0; i < 600; i++) step(1 / 60);
        draw(); readouts(); return;
      }
      if (loop.wanted) loop.pause(); else loop.play();
      setPlayLabel();
    }
    function setPlayLabel() { if (!api.reduced) playBtn.textContent = loop.wanted ? '멈춤' : '재생'; }

    function readouts() {
      var c = st.cross;
      R.wLR.set(c.wLR + '개'); R.wRL.set(c.wRL + '개');
      R.lvl.set(Math.round(st.lv[0] / H0 * 100) + ' : ' + Math.round(st.lv[1] / H0 * 100));
      R.sCnt.set(st.cnt.s[0] + ' : ' + st.cnt.s[1]); R.sLR.set(c.sLR + '개'); R.sRL.set(c.sRL + '개');
      var rb = RBC[st.rbc];
      R.out.set(rb.name); R.net.set(rb.net);
      R.cell.set(st.rbcP >= 1 || api.reduced ? rb.res : '변하는 중…');
    }

    /* ───── 그리기 ───── */
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      if (st.mode === 'rbc') drawRbc(T, w, h); else drawTank(T, w, h);
    }
    function dot(x, y, r, fill, stroke) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    function arrow(x1, y1, x2, y2, color, lw) {
      var a = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * 6, y2 - Math.sin(a) * 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.45) * 11, y2 - Math.sin(a - 0.45) * 11);
      ctx.lineTo(x2 - Math.cos(a + 0.45) * 11, y2 - Math.sin(a + 0.45) * 11); ctx.closePath(); ctx.fill();
    }
    function drawTank(T, w, h) {
      var narrow = w < 560, diff = st.mode === 'diff';
      var topH = narrow ? 62 : 44;
      var x0 = 14, x1 = w - 14, yTop = topH + 14, yBot = h - (narrow ? 40 : 30);
      var TW = x1 - x0, TH = yBot - yTop;
      var X = function (x) { return x0 + x / 2 * TW; }, Y = function (y) { return yBot - y * TH; };
      var solColor = diff ? T.figViolet : T.figAmber, solSoft = diff ? T.figSoftViolet : T.figSoftAmber;
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var ly = 12;
      dot(x0 + 5, ly, 3, T.figBlue); ctx.fillStyle = T.figInk; ctx.fillText('물 분자', x0 + 13, ly);
      var lx2 = x0 + 70;
      dot(lx2 + 6, ly, diff ? 4.5 : 6.5, solColor, T.figInk);
      ctx.fillStyle = T.figInk;
      ctx.fillText(diff ? '작은 용질(막 통과 가능)' : '용질(막 통과 못 함)', lx2 + 16, ly);
      // 알짜 이동 예상 화살표
      var ny = narrow ? 34 : 12, nx = narrow ? x0 : w * 0.56;
      var msg, dir = 0;
      if (diff) {
        var cl = st.cnt.s[0], cr = st.cnt.s[1];
        dir = cl > cr + 1 ? 1 : cr > cl + 1 ? -1 : 0;
        msg = dir ? '용질의 알짜 이동: 농도가 높은 쪽 → 낮은 쪽' : '양쪽 용질 농도가 거의 같다: 알짜 이동 없음';
      } else {
        var c0 = st.cnt.s[0] / Math.max(1, st.cnt.w[0] + st.cnt.s[0]), c1 = st.cnt.s[1] / Math.max(1, st.cnt.w[1] + st.cnt.s[1]);
        var start0 = st.nL, start1 = st.nR;
        dir = start1 > start0 ? 1 : start0 > start1 ? -1 : 0;
        msg = dir ? '물의 알짜 이동: 용질 농도가 높은 쪽으로' : '양쪽 용질 농도가 같다: 물의 알짜 이동 없음';
        void c0; void c1;
      }
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = diff ? T.figViolet : T.figBlue;
      ctx.fillText(msg, nx, ny);
      if (dir) {
        var ax = X(1), aw = Math.min(70, TW * 0.14), ay = yTop - 9;
        arrow(ax - dir * aw, ay, ax + dir * aw, ay, diff ? T.figViolet : T.figBlue, 3);
      }
      // 통과 물(액체)
      ctx.fillStyle = T.figSoftBlue;
      ctx.fillRect(X(0), Y(st.lv[0]), X(1) - X(0), Y(0) - Y(st.lv[0]));
      ctx.fillRect(X(1), Y(st.lv[1]), X(2) - X(1), Y(0) - Y(st.lv[1]));
      // 처음 수위
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(0), Y(H0)); ctx.lineTo(X(2), Y(H0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('처음 수위', X(0) + 4, Y(H0) - 2);
      // 수면
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      [0, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(X(s), Y(st.lv[s])); ctx.lineTo(X(s + 1), Y(st.lv[s])); ctx.stroke(); });
      // 입자
      st.parts.forEach(function (p) {
        if (p.kind === 'w') dot(X(p.x), Y(p.y), 2.6, T.figBlue);
      });
      st.parts.forEach(function (p) {
        if (p.kind !== 'w') dot(X(p.x), Y(p.y), p.kind === 's' ? 6.5 : 4.5, p.kind === 's' ? T.figAmber : T.figViolet, T.figInk);
      });
      // 통
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x0, yTop); ctx.lineTo(x0, yBot); ctx.lineTo(x1, yBot); ctx.lineTo(x1, yTop); ctx.stroke();
      // 막(구멍 난 막)
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 4; ctx.setLineDash(diff ? [9, 6] : [10, 3]);
      ctx.beginPath(); ctx.moveTo(X(1), yTop); ctx.lineTo(X(1), yBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figTeal; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      var mLabel = diff ? '막: 물·작은 용질 통과' : '반투과성 막: 물만 통과';
      var mw = ctx.measureText(mLabel).width + 10, my = yTop + 16;
      ctx.fillStyle = T.figPanel; ctx.fillRect(X(1) - mw / 2, my - 13, mw, 18);
      ctx.fillStyle = T.figTeal; ctx.fillText(mLabel, X(1), my);
      // 아래 표시
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textBaseline = 'top';
      var lab = function (s) { return (s ? '오른쪽' : '왼쪽') + ' · 용질 ' + st.cnt.s[s] + '개' + (narrow ? '' : ' / 물 ' + st.cnt.w[s] + '개'); };
      ctx.fillText(lab(0), X(0.5), yBot + 6); ctx.fillText(lab(1), X(1.5), yBot + 6);
      if (narrow) {
        ctx.fillStyle = T.figMuted;
        ctx.fillText('물 ' + st.cnt.w[0] + '개', X(0.5), yBot + 22); ctx.fillText('물 ' + st.cnt.w[1] + '개', X(1.5), yBot + 22);
      }
      ctx.textBaseline = 'alphabetic';
    }
    function drawRbc(T, w, h) {
      var narrow = w < 560, c = RBC[st.rbc], p = st.rbcP;
      var bottomH = narrow ? 80 : 60, pTop = 30, pBot = h - bottomH;
      var cx = w / 2, cy = (pTop + pBot) / 2, R0 = Math.min(w, pBot - pTop) * (narrow ? 0.17 : 0.2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      // 바깥 용액
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(10, pTop, w - 20, pBot - pTop);
      ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('바깥 용액: ' + c.name, cx, 20);
      // 바깥 용질 입자(농도 표시)
      var nOut = Math.round(c.outC * (narrow ? 14 : 26));
      var seed = 7;
      function rr() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      for (var i = 0; i < nOut * 2 && nOut > 0; i++) {
        var px = 22 + rr() * (w - 44), py = pTop + 10 + rr() * (pBot - pTop - 20);
        if (Math.hypot(px - cx, py - cy) < R0 * 1.75 || (py < pTop + 26 && px < 130)) continue;
        if (--nOut < 0) break;
        dot(px, py, 4.5, T.figAmber, T.figInk);
      }
      // 세포 모양
      var scale = 1, cren = 0, burst = false, e = p * p * (3 - 2 * p);
      if (st.rbc === 'hypo') { scale = 1 + 0.26 * Math.min(1, e / 0.85); burst = p > 0.85; }
      if (st.rbc === 'hyper') { scale = 1 - 0.24 * e; cren = e; }
      var Rc = R0 * scale;
      function outline(r, amp) {
        ctx.beginPath();
        for (var k = 0; k <= 120; k++) {
          var a = k / 120 * Math.PI * 2, rad = r * (1 + amp * 0.07 * Math.sin(a * 14));
          var x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
      if (!burst) {
        outline(Rc, cren); ctx.fillStyle = T.figSoftRed; ctx.fill();
        if (st.rbc !== 'hypo') { // 가운데가 오목한 원반 모양
          ctx.beginPath(); ctx.arc(cx, cy, Rc * 0.45, 0, Math.PI * 2); ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
        }
        outline(Rc, cren); ctx.strokeStyle = T.figRed; ctx.lineWidth = 3; ctx.stroke();
      } else {
        ctx.fillStyle = T.figSoftRed; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(cx, cy, Rc * 1.15, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 3;
        for (var s = 0; s < 7; s++) {
          var a0 = s / 7 * Math.PI * 2 + 0.2, off = 6;
          ctx.beginPath(); ctx.arc(cx + Math.cos(a0 + 0.3) * off, cy + Math.sin(a0 + 0.3) * off, Rc, a0, a0 + 0.55); ctx.stroke();
        }
      }
      // 세포 안 용질
      for (var j = 0; j < 9; j++) {
        var aj = j / 9 * Math.PI * 2 + 0.4, rj = (j % 3 === 0 ? 0.25 : 0.62) * Rc;
        if (burst) rj *= 1.2;
        dot(cx + Math.cos(aj) * rj, cy + Math.sin(aj) * rj, 4.5, T.figAmber, T.figInk);
      }
      // 물 분자의 출입
      st.drops.forEach(function (d) {
        var rin = Rc * 0.55, rout = Rc * 1.55;
        var r = d.dir < 0 ? rout + (rin - rout) * d.t : rin + (rout - rin) * d.t;
        dot(cx + Math.cos(d.a) * r, cy + Math.sin(d.a) * r, 3, T.figBlue);
      });
      // 알짜 이동 화살표
      if (!burst && st.rbc !== 'iso') {
        var into = st.rbc === 'hypo';
        [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75].forEach(function (a) {
          var r1 = Rc * 1.18, r2 = Rc * 1.55;
          var ra = into ? r2 : r1, rb = into ? r1 : r2;
          arrow(cx + Math.cos(a) * ra, cy + Math.sin(a) * ra, cx + Math.cos(a) * rb, cy + Math.sin(a) * rb, T.figBlue, 2.5);
        });
      }
      // 상태 글
      var y0 = pBot + 18, lines = [];
      ctx.font = '600 13px ' + T.fontBody;
      lines.push(['물의 알짜 이동: ' + c.net, T.figInk, '600 13px ']);
      lines.push(['결과: ' + (p >= 1 ? c.res : '변하는 중…'), burst ? T.figRed : T.figInk, '600 13px ']);
      ctx.font = '12px ' + T.fontBody;
      if (ctx.measureText(c.plant).width > w - 20) {
        var cut = c.plant.indexOf(':') + 1;
        lines.push([c.plant.slice(0, cut), T.figMuted, '12px ']); lines.push([c.plant.slice(cut).trim(), T.figMuted, '12px ']);
      } else lines.push([c.plant, T.figMuted, '12px ']);
      if (!narrow) { lines[0][0] += '  →  결과: ' + (p >= 1 ? c.res : '변하는 중…'); lines[0][1] = burst ? T.figRed : T.figInk; lines.splice(1, 1); }
      lines.forEach(function (ln, i) { ctx.font = ln[2] + T.fontBody; ctx.fillStyle = ln[1]; ctx.fillText(ln[0], cx, y0 + i * 17); });
      // 범례
      ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      dot(20, pTop + 12, 3, T.figBlue); ctx.fillStyle = T.figInk; ctx.fillText('물 분자', 27, pTop + 16);
      dot(80, pTop + 12, 4.5, T.figAmber, T.figInk); ctx.fillText('용질', 88, pTop + 16);
    }

    api.onResize(draw);
    setMode('osmo');
  },
});
