/* 일반생명과학 2 수분 퍼텐셜: Ψ = Ψs + Ψp, 물은 Ψ가 높은 곳 → 낮은 곳으로. 식물 세포(세포벽, 팽압)와 동물 세포(적혈구) 비교 */
Sims.register('u-water-potential', {
  title: '물은 수분 퍼텐셜을 따라 흐른다 — 식물 세포와 적혈구',
  caption: '세포를 고르고 바깥 설탕 용액의 농도와 세포 안 용질 퍼텐셜을 정한 뒤 ‘담그기’를 눌러 보자. 물은 Ψ가 높은 쪽에서 낮은 쪽으로 움직이고, 두 쪽의 Ψ가 같아지면 알짜 이동이 멈춘다. 식물 세포는 물이 들어올수록 세포벽이 되미는 팽압(Ψp)이 커져 세포가 바깥보다 진해도 평형에 이르지만, 세포벽이 없는 적혈구는 Ψp가 0이어서 부피가 바뀌는 수밖에 없고 저장액에서는 터진다. 바깥 용액은 대기압의 설탕 용액(Ψ = −CRT, i = 1)이며, 식물 세포는 20 °C·처음 팽압 +0.30 MPa(예제 4)·세포벽이 거의 늘어나지 않음(Ψs 일정)을, 적혈구는 37 °C·부피가 약 1.6배를 넘으면 터짐을 가정했다.',
  init: function (api) {
    var R = 0.00831;
    var s = { type: 'plant', C: 0.10, psis: -0.80, f: 1, run: null };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.55; }, label: '바깥 용액과 세포의 수분 퍼텐셜 막대 그래프, 세포 모습' });
    var ctx = cv.ctx;

    var rOut = api.readout('Ψ 바깥');
    var rCell = api.readout('Ψ 세포 = Ψs + Ψp');
    var rFlow = api.readout('물의 이동');
    var rState = api.readout('세포 상태');

    var g1 = api.group();
    var bPlant = api.button('식물 세포', function () { setType('plant'); }, { toggle: true, pressed: true, parent: g1 });
    var bAnimal = api.button('적혈구', function () { setType('animal'); }, { toggle: true, pressed: false, parent: g1 });
    var slC = api.slider({ id: 'u-water-potential-c', label: '바깥 설탕 농도', min: 0, max: 0.6, step: 0.01, value: s.C,
      format: function (v) { return v.toFixed(2) + ' M'; }, onInput: function (v) { s.C = v; stop(); } });
    var slS = api.slider({ id: 'u-water-potential-s', label: '세포 안 Ψs (처음)', min: -1.4, max: -0.3, step: 0.01, value: s.psis,
      format: function (v) { return v.toFixed(2) + ' MPa'; }, onInput: function (v) { s.psis = v; stop(); } });
    var g2 = api.group();
    api.button('담그기', function () { start(); }, { primary: true, parent: g2 });
    api.button('예제 4 (2) 0.10 M', function () { setType('plant'); slS.set(-0.80); slC.set(0.10); start(); }, { parent: g2 });
    api.button('예제 4 (4) 0.40 M', function () { setType('plant'); slS.set(-0.80); slC.set(0.40); start(); }, { parent: g2 });

    function temp() { return s.type === 'plant' ? 293 : 310; }
    function psiOut() { return -s.C * R * temp(); }
    function p0() { return s.type === 'plant' ? 0.30 : 0; }
    function setType(t) {
      if (s.type !== t) {
        s.type = t;
        bPlant.setAttribute('aria-pressed', t === 'plant' ? 'true' : 'false');
        bAnimal.setAttribute('aria-pressed', t === 'animal' ? 'true' : 'false');
        if (t === 'animal') { slS.set(-0.77); slC.set(0.30); } else { slS.set(-0.80); slC.set(0.10); }
      }
      stop();
    }
    // 평형 상태 계산: v는 처음(Ψp=0일 때) 부피에 대한 상대 부피
    function eq() {
      var po = psiOut(), ps = s.psis;
      if (s.type === 'plant') {
        if (po >= ps) return { v: 1, pp: po - ps, burst: false, plasmo: false };
        return { v: ps / po, pp: 0, burst: false, plasmo: true };
      }
      var v = po > -1e-6 ? Infinity : ps / po;
      return { v: Math.min(v, 1.6), pp: 0, burst: v > 1.6, plasmo: false };
    }
    // 시각 f(0→1)에서의 상태. 식물은 원형질 분리 때 팽압이 먼저 0이 된 뒤 원형질체가 줄어든다
    function at(f) {
      var E = eq(), P0 = p0();
      if (s.type === 'plant') {
        if (!E.plasmo) return { v: 1, pp: P0 + (E.pp - P0) * f };
        var f1 = P0 > 0 ? 0.35 : 0;
        if (f < f1) return { v: 1, pp: P0 * (1 - f / f1) };
        return { v: 1 + (E.v - 1) * (f1 < 1 ? (f - f1) / (1 - f1) : 1), pp: 0 };
      }
      return { v: 1 + (E.v - 1) * f, pp: 0 };
    }
    function ease(x) { return 1 - Math.pow(1 - x, 3); }
    function cur() { var st = at(ease(s.f)); st.ps = s.psis / st.v; st.psi = st.ps + st.pp; return st; }

    function start() {
      if (api.reduced) { s.f = 1; update(); return; }
      s.f = 0; s.run = true; loop.play(); update();
    }
    function stop() { s.f = 0; s.run = null; loop.pause(); update(); }
    var loop = api.loop(function (dt) {
      if (dt <= 0 || !s.run) return;
      s.f = Math.min(1, s.f + dt / 3.2);
      if (s.f >= 1) { s.run = null; loop.pause(); }
      update();
    });
    loop.pause();

    function fmt(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' MPa'; }
    function stateText(st) {
      var E = eq(), done = s.f >= 1;
      if (s.type === 'plant') {
        if (st.pp <= 1e-3 && st.v < 0.999) return '원형질 분리';
        if (st.pp <= 0.02) return '시듦 (팽압 거의 0)';
        return '팽팽함 (팽압 ' + st.pp.toFixed(2) + ' MPa)';
      }
      if (done && E.burst) return '터짐 (용혈)';
      if (st.v > 1.03) return '부풂 (부피 ×' + st.v.toFixed(2) + ')';
      if (st.v < 0.97) return '쭈그러듦 (부피 ×' + st.v.toFixed(2) + ')';
      return '정상 부피';
    }
    function update() {
      var st = cur(), po = psiOut(), d = po - st.psi;
      rOut.set(fmt(po));
      rCell.set(fmt(st.ps) + ' ' + (st.pp >= 0 ? '+ ' : '− ') + Math.abs(st.pp).toFixed(2) + ' = ' + fmt(st.psi));
      var E = eq(), ended = s.f >= 1 && !(s.type === 'animal' && E.burst);
      rFlow.set(Math.abs(d) < 0.005 || ended ? '알짜 이동 없음 (평형)' : d > 0 ? '바깥 → 세포 안' : '세포 안 → 바깥');
      rState.set(stateText(st));
      draw(st, po);
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { g: { x: 0, y: 0, w: w, h: h * 0.52 }, c: { x: 0, y: h * 0.54, w: w, h: h * 0.46 } }
        : { g: { x: 0, y: 0, w: w * 0.52, h: h }, c: { x: w * 0.54, y: 0, w: w * 0.46, h: h } };
    }
    function draw(st, po) {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      bars(T, L.g, st, po); cell(T, L.c, st, po);
    }
    function bars(T, r, st, po) {
      var Lx = r.x + 52, Rx = r.x + r.w - 10, Tp = r.y + 26, B = r.y + r.h - 30;
      var V1 = 0.8, V0 = -1.8;
      var sy = function (v) { return Tp + (V1 - v) / (V1 - V0) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var v = -1.6; v <= 0.81; v += 0.4) { var yy = sy(v); ctx.beginPath(); ctx.moveTo(Lx, yy); ctx.lineTo(Rx, yy); ctx.stroke(); ctx.fillText(Math.abs(v) < 1e-9 ? '0.0' : v.toFixed(1), Lx - 6, yy + 4); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Lx, sy(0)); ctx.lineTo(Rx, sy(0)); ctx.stroke();
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('수분 퍼텐셜 (MPa)', 0, 0); ctx.restore();
      var cw = (Rx - Lx), bw = Math.min(46, cw * 0.16);
      var xO = Lx + cw * 0.2, xC = Lx + cw * 0.62;
      // 바깥 용액
      bar(xO - bw / 2, 0, po, T.figSoftBlue, T.figBlue);
      mark(xO, po, T.figBlue);
      // 세포: Ψs(아래) + Ψp(위)
      bar(xC - bw - 2, 0, st.ps, T.figSoftRed, T.figRed);
      if (st.pp > 0.001) bar(xC + 2, 0, st.pp, T.figSoftGreen, T.figGreen);
      ctx.strokeStyle = T.figLine; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xC - bw - 6, sy(st.psi)); ctx.lineTo(xC + bw + 6, sy(st.psi)); ctx.stroke(); ctx.setLineDash([]);
      mark(xC, st.psi, T.figViolet);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figRed; ctx.fillText('Ψs', xC - bw / 2 - 2, Math.min(B + 14, sy(st.ps) + 14));
      if (st.pp > 0.001) { ctx.fillStyle = T.figGreen; ctx.fillText('Ψp', xC + bw / 2 + 2, sy(st.pp) - 5); }
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('바깥 용액', xO, r.y + 14); ctx.fillText('세포', xC, r.y + 14);
      ctx.fillStyle = T.figViolet; ctx.textAlign = 'left'; ctx.font = '600 11px ' + T.fontBody;
      ctx.fillText('Ψ ' + st.psi.toFixed(2), xC + bw + 8, sy(st.psi) + 4);
      ctx.fillStyle = T.figBlue; ctx.fillText('Ψ ' + po.toFixed(2), xO + bw / 2 + 6, sy(po) + 4);
      // 물의 이동 화살표 (높은 Ψ → 낮은 Ψ)
      var d = po - st.psi, E = eq(), ended = s.f >= 1 && !(s.type === 'animal' && E.burst);
      if (Math.abs(d) > 0.005 && !ended) {
        var yA = sy(Math.max(po, st.psi)) - 16, from = d > 0 ? xO : xC, to = d > 0 ? xC : xO;
        yA = Math.max(r.y + 28, Math.min(yA, sy(0.7)));
        ctx.strokeStyle = T.figAccent; ctx.fillStyle = T.figAccent; ctx.lineWidth = 3;
        var a0 = from + (to > from ? 18 : -18), a1 = to + (to > from ? -18 : 18);
        ctx.beginPath(); ctx.moveTo(a0, yA); ctx.lineTo(a1, yA); ctx.stroke();
        var dir = to > from ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(a1 + dir * 8, yA); ctx.lineTo(a1 - dir * 4, yA - 7); ctx.lineTo(a1 - dir * 4, yA + 7); ctx.closePath(); ctx.fill();
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('물', (a0 + a1) / 2, yA - 7);
      }
      function bar(x, a, b, fill, stroke) {
        var y0 = sy(Math.max(a, b)), y1 = sy(Math.min(a, b));
        ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1.5;
        ctx.fillRect(x, y0, bw, Math.max(1, y1 - y0)); ctx.strokeRect(x, y0, bw, Math.max(1, y1 - y0));
      }
      function mark(x, v, col) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, sy(v), 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    function cell(T, r, st, po) {
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 4;
      var conc = Math.min(1, s.C / 0.6);
      // 용액
      ctx.fillStyle = T.figSoftBlue; ctx.globalAlpha = 0.35 + 0.5 * conc;
      roundRect(r.x + 10, r.y + 24, r.w - 20, r.h - 34, 12); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('설탕 ' + s.C.toFixed(2) + ' M 용액', r.x + 18, r.y + 40);
      var E = eq();
      if (s.type === 'plant') {
        var W = Math.min(r.w * 0.62, 200), H = Math.min(r.h * 0.62, 150);
        // 세포벽 (고정)
        ctx.strokeStyle = T.figGreen; ctx.lineWidth = 6; roundRect(cx - W / 2, cy - H / 2, W, H, 10); ctx.stroke();
        // 원형질체 (부피 v에 따라 줄어듦)
        var k = Math.sqrt(st.v), pw = (W - 10) * k, ph = (H - 10) * k;
        var push = st.pp > 0.02;
        ctx.fillStyle = T.figSoftGreen; ctx.strokeStyle = T.figTeal; ctx.lineWidth = push ? 2.5 : 1.8;
        roundRect(cx - pw / 2, cy - ph / 2, pw, ph, st.v < 0.999 ? Math.min(pw, ph) * 0.35 : 8); ctx.fill(); ctx.stroke();
        // 액포
        ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85;
        roundRect(cx - pw * 0.36, cy - ph * 0.32, pw * 0.72, ph * 0.64, Math.min(pw, ph) * 0.25); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('액포', cx, cy + 4);
        ctx.fillStyle = T.figGreen; ctx.fillText('세포벽', cx, cy + H / 2 + 17);
        if (push) {
          // 팽압 화살표
          ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2;
          [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) {
            var x0 = cx + d[0] * (pw / 2 - 18), y0 = cy + d[1] * (ph / 2 - 14), x1 = cx + d[0] * (pw / 2 - 4), y1 = cy + d[1] * (ph / 2 - 3);
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          });
        }
      } else {
        var rad = Math.min(r.w, r.h) * 0.2 * Math.cbrt(Math.min(st.v, 1.6));
        var burst = s.f >= 1 && E.burst;
        ctx.fillStyle = burst ? T.figSoftRed : T.figSoftRed; ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.5;
        if (burst) {
          ctx.setLineDash([6, 7]); ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = T.figRed; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('터짐 (용혈)', cx, cy + 4);
        } else {
          var crenate = st.v < 0.9, n = 18;
          ctx.beginPath();
          for (var i = 0; i <= 72; i++) {
            var a = i / 72 * Math.PI * 2, rr = rad * (1 + (crenate ? 0.09 * Math.max(0, Math.cos(n * a)) : 0));
            var x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a) * (st.v > 1.2 ? 1 : 0.82);
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
          if (st.v <= 1.2) { ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(cx, cy, rad * 0.45, rad * 0.32, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
        }
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('세포벽 없음 → Ψp = 0', cx, r.y + r.h - 18);
      }
      function roundRect(x, y, w, h, rr) { ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); }
    }

    api.onResize(update);
    s.f = 0; update();
  },
});
