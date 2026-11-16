/* 생물의 유전 2 유전자의 발현: 대장균 젖당 오페론 — 젖당·포도당 유무에 따른 억제 단백질, CAP–cAMP, 전사량 */
Sims.register('operon', {
  title: '젖당 오페론 — 젖당과 포도당이 전사를 켜고 끄는 방법',
  caption: '젖당과 포도당의 유무를 바꿔 네 가지 경우를 비교해 보자. 젖당이 없으면 억제 단백질이 작동 부위에 붙어 전사가 거의 일어나지 않는다(음성 조절). 젖당이 있으면 젖당 유도체가 억제 단백질에 붙어 떼어 내고, 포도당이 없을 때 늘어난 cAMP와 결합한 CAP이 프로모터 근처에 붙어 RNA 중합 효소의 결합을 도우면 전사가 활발해진다(양성 조절). 분자의 크기·개수와 전사 속도는 비교를 위해 단순화했다.',
  init: function (api) {
    var state = { lac: false, glu: true, pols: [], timer: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.5; }, label: '젖당 오페론의 조절 유전자, 프로모터, 작동 부위, 구조 유전자와 조절 단백질' });
    var ctx = cv.ctx;
    var rRep = api.readout('억제 단백질');
    var rCap = api.readout('CAP–cAMP');
    var rTx = api.readout('구조 유전자 전사');

    var g1 = api.group();
    var lacBtns = [
      api.button('젖당 없음', function () { setLac(false); }, { toggle: true, pressed: true, parent: g1 }),
      api.button('젖당 있음', function () { setLac(true); }, { toggle: true, parent: g1 }),
    ];
    var g2 = api.group();
    var gluBtns = [
      api.button('포도당 있음', function () { setGlu(true); }, { toggle: true, pressed: true, parent: g2 }),
      api.button('포도당 없음', function () { setGlu(false); }, { toggle: true, parent: g2 }),
    ];
    function setLac(v) { state.lac = v; lacBtns[0].setAttribute('aria-pressed', v ? 'false' : 'true'); lacBtns[1].setAttribute('aria-pressed', v ? 'true' : 'false'); changed(); }
    function setGlu(v) { state.glu = v; gluBtns[0].setAttribute('aria-pressed', v ? 'true' : 'false'); gluBtns[1].setAttribute('aria-pressed', v ? 'false' : 'true'); changed(); }

    function level() { return !state.lac ? 0 : state.glu ? 1 : 2; }   // 0 안 됨, 1 약하게, 2 활발히
    function changed() {
      var lv = level();
      rRep.set(state.lac ? '젖당 유도체와 결합 → 작동 부위에서 떨어짐' : '작동 부위에 결합');
      rCap.set(state.glu ? 'cAMP 적음 → 거의 결합 안 함' : 'cAMP 많음 → 프로모터 근처에 결합');
      rTx.set(['안 됨(거의 없음)', '약하게', '활발히'][lv]);
      state.pols = [];
      if (api.reduced || lv === 0) { staticPols(lv); loop.pause(); draw(); }
      else { staticPols(lv); loop.play(); }
    }
    function staticPols(lv) {
      state.pols = lv === 2 ? [0.12, 0.42, 0.72] : lv === 1 ? [0.5] : [];
      state.timer = 0;
    }

    var loop = api.loop(function (dt) {
      var lv = level();
      if (lv === 0) { loop.pause(); return; }
      var speed = 0.12, every = lv === 2 ? 1.6 : 5.5;
      state.timer += dt;
      if (state.timer >= every) { state.timer = 0; state.pols.push(0); }
      state.pols = state.pols.map(function (p) { return p + dt * speed; }).filter(function (p) { return p < 0.96; });
      draw();
    });
    loop.pause();

    function L() {
      var w = cv.w, h = cv.h, narrow = w < 560, m = 12;
      var dnaY = narrow ? h * 0.7 : h * 0.66;
      var x0 = m, x1 = w - m, span = x1 - x0;
      var f = function (t) { return x0 + span * t; };
      if (narrow) return {
        narrow: true, dnaY: h * 0.7, lacY: h * 0.32, top: h * 0.05,
        lacI: [f(0.02), f(0.3)], cap: [f(0), f(0.07)], pro: [f(0.07), f(0.24)], op: [f(0.24), f(0.35)],
        z: [f(0.35), f(0.67)], y: [f(0.67), f(0.84)], a: [f(0.84), f(1)], f: f,
      };
      return {
        narrow: false, dnaY: dnaY, lacY: dnaY, top: h * 0.08,
        lacI: [f(0), f(0.12)], cap: [f(0.16), f(0.21)], pro: [f(0.21), f(0.33)], op: [f(0.33), f(0.41)],
        z: [f(0.41), f(0.69)], y: [f(0.69), f(0.86)], a: [f(0.86), f(1)], f: f,
      };
    }

    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function draw() {
      var T = api.tokens(), G = L(), w = cv.w, h = cv.h, Y = G.dnaY, lv = level();
      ctx.clearRect(0, 0, w, h);
      var fs = G.narrow ? 11 : 12;
      // 배경 상태: 세포 안 물질
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.font = '600 ' + (fs + 1) + 'px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('대장균 세포 안', 12, G.top);
      ctx.font = fs + 'px ' + T.fontBody;
      var infoY = G.top + 20;
      var items = [
        [state.lac ? '젖당 있음 → 젖당 유도체 생김' : '젖당 없음', state.lac ? T.figGreen : T.figMuted],
        [state.glu ? '포도당 있음 → cAMP 적음' : '포도당 없음 → cAMP 많음', state.glu ? T.figMuted : T.figViolet],
      ];
      items.forEach(function (it, i) { ctx.fillStyle = it[1]; ctx.fillText('• ' + it[0], 12, infoY + i * 18); });

      // DNA
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(G.narrow ? G.cap[0] : G.lacI[0], Y); ctx.lineTo(G.a[1], Y); ctx.stroke();
      if (G.narrow) { ctx.beginPath(); ctx.moveTo(G.lacI[0] - 6, G.lacY); ctx.lineTo(G.lacI[1] + 24, G.lacY); ctx.stroke(); }
      var seg = function (r, fill, stroke, label, sub, row, yy) {
        var Y0 = Y; if (yy != null) Y = yy;
        rr(r[0], Y - 11, r[1] - r[0], 22, 4); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
        var cx = (r[0] + r[1]) / 2, ly = Y + 26 + (row || 0) * 30;
        ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
        if (row) { ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, Y + 12); ctx.lineTo(cx, ly - 8); ctx.stroke(); }
        ctx.fillText(label, cx, ly);
        if (sub) { ctx.font = (fs - 0) + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText(sub, cx, ly + 15); }
        Y = Y0;
      };
      seg(G.lacI, T.figSoftViolet, T.figViolet, '조절 유전자', 'lacI', 0, G.lacY);
      seg(G.cap, T.figSoftBlue, T.figBlue, '', '', 0);
      seg(G.pro, T.figSoftBlue, T.figBlue, '프로모터', '', G.narrow ? 1 : 0);
      seg(G.op, T.figSoftRed, T.figRed, '작동 부위', '', G.narrow ? 0 : 1);
      seg(G.z, T.figSoftGreen, T.figGreen, 'lacZ', '', 0);
      seg(G.y, T.figSoftGreen, T.figGreen, 'lacY', '', 0);
      seg(G.a, T.figSoftGreen, T.figGreen, 'lacA', '', 0);
      ctx.fillStyle = T.figMuted; ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('구조 유전자', (G.z[0] + G.a[1]) / 2, Y + 44);
      // 오페론 범위 괄호
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      var by = Y + 64 + (G.narrow ? 20 : 14);
      ctx.beginPath(); ctx.moveTo(G.pro[0], by - 6); ctx.lineTo(G.pro[0], by); ctx.lineTo(G.a[1], by); ctx.lineTo(G.a[1], by - 6); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.fillText('젖당 오페론', (G.pro[0] + G.a[1]) / 2 + 30, by + 12);

      // 억제 단백질
      var lacIc = (G.lacI[0] + G.lacI[1]) / 2;
      var repX, repY;
      if (!state.lac) { repX = (G.op[0] + G.op[1]) / 2; repY = Y - 26; }
      else if (G.narrow) { repX = G.f(0.62); repY = G.lacY; } else { repX = lacIc + (G.op[0] - lacIc) * 0.45; repY = Y - 92; }
      var rw = Math.max(34, (G.op[1] - G.op[0]) * 1.25);
      ctx.fillStyle = T.figRed; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
      ctx.beginPath();
      if (!state.lac) { ctx.moveTo(repX - rw / 2, Y - 11); ctx.lineTo(repX - rw / 2, repY - 14); ctx.quadraticCurveTo(repX, repY - 34, repX + rw / 2, repY - 14); ctx.lineTo(repX + rw / 2, Y - 11); ctx.closePath(); }
      else { ctx.ellipse(repX, repY, rw / 2, 16, 0.25, 0, Math.PI * 2); }
      ctx.fill(); ctx.stroke();
      if (state.lac) {
        ctx.fillStyle = T.figGreen; ctx.beginPath();
        var lx = repX + rw / 2 - 2, ly = repY + 4;
        for (var k = 0; k < 6; k++) { var an = k * Math.PI / 3; ctx[k ? 'lineTo' : 'moveTo'](lx + 7 * Math.cos(an), ly + 7 * Math.sin(an)); }
        ctx.closePath(); ctx.fill();
        ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figGreen; ctx.textAlign = 'left';
        ctx.fillText('젖당 유도체', lx + 11, ly + 2);
      }
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figRed; ctx.textAlign = 'center';
      ctx.fillText('억제 단백질', repX, (state.lac ? (G.narrow ? repY + 28 : repY - 26) : repY - (G.narrow ? 56 : 42)));
      // 조절 유전자 → 억제 단백질 화살표
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
      ctx.beginPath(); if (G.narrow) { ctx.moveTo(G.lacI[1], G.lacY); ctx.quadraticCurveTo(repX, G.lacY, repX - (state.lac ? rw / 2 + 4 : 0), state.lac ? repY : repY - 22); } else ctx.moveTo(lacIc, G.lacY - 13); if (!G.narrow) ctx.quadraticCurveTo(lacIc, repY - 4, repX - rw / 2 - 4, state.lac ? repY : repY - 18); ctx.stroke(); ctx.setLineDash([]);

      // CAP–cAMP
      var capC = (G.cap[0] + G.cap[1]) / 2;
      if (!state.glu) {
        ctx.fillStyle = T.figViolet; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
        rr(capC - 15, Y - 38, 30, 27, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(capC, Y - 42, 5, 0, 7); ctx.fill();
        ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figViolet; ctx.textAlign = G.narrow ? 'left' : 'center';
        ctx.fillText('CAP–cAMP', G.narrow ? G.cap[0] : capC, Y - 58);
      }

      // RNA 중합 효소(프로모터 위), 전사 진행
      var proC = (G.pro[0] + G.pro[1]) / 2, polW = Math.max(36, G.pro[1] - G.pro[0]);
      if (lv === 0) {
        drawPol(T, proC, Y, polW, state.glu ? 0.35 : 0.9);
        ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figRed; ctx.textAlign = 'center';
        ctx.fillText('✕ 진행 못 함', (G.op[1] + G.z[0]) / 2 + 40, Y - 22);
      } else {
        drawPol(T, proC, Y, polW, lv === 2 ? 1 : 0.55);
      }
      var gs = G.op[1], ge = G.a[1];
      state.pols.forEach(function (p) {
        var x = gs + (ge - gs) * p;
        // mRNA 꼬리
        ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2.5; ctx.beginPath();
        var len = x - gs;
        ctx.moveTo(x, Y - 24);
        for (var t = 0; t <= len; t += 4) ctx.lineTo(x - t, Y - 30 - Math.min(t * 0.25, 60) + Math.sin(t / 7) * 3);
        ctx.stroke();
        drawPol(T, x, Y, 30, 1);
      });
      if (lv > 0) {
        ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figTeal; ctx.textAlign = 'right';
        ctx.fillText('mRNA', G.a[1], G.top + 4);
      }
      // 전사량 표시
      var meterY = G.narrow ? G.top + 64 : G.top + 2, mx = G.narrow ? 12 : w * 0.56;
      ctx.textAlign = 'left'; ctx.font = '600 ' + (fs + 1) + 'px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('전사량: ' + ['안 됨', '약하게', '활발히'][lv], mx, meterY);
      for (var b = 0; b < 3; b++) {
        rr(mx + 110 + b * 22, meterY - 7, 18, 14, 3);
        ctx.fillStyle = b < [0, 1, 3][lv] ? T.figGreen : T.figPanel; ctx.fill(); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    function drawPol(T, x, Y, wd, alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, Y - 4, wd / 2, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
      if (wd >= 36) { ctx.globalAlpha = Math.max(alpha, 0.6); ctx.fillText('RNA', x, Y - 10); ctx.fillText('중합 효소', x, Y + 3); ctx.globalAlpha = 1; }
    }

    api.onResize(draw);
    changed();
  },
});
