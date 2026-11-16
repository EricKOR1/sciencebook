/* 일반생명과학 10 체관부 수송: 압류설 — 공급원·수용부의 설탕 농도와 이웃 물관의 Ψ가 정하는 체관의 팽압 차와 집단 흐름 */
Sims.register('u-pressure-flow', {
  title: '압류설 — 설탕 농도 차가 만드는 체관의 압력 차',
  caption: '공급원(잎)과 수용부(뿌리·열매)의 체관 설탕 농도, 이웃 물관의 수분 퍼텐셜을 바꿔 보자. 체관이 이웃 물관과 물에 대해 평형이라 보면 Ψp = Ψ물관 − Ψs이고, 두 끝의 팽압 차가 체관액 전체를 한꺼번에 민다(집단 흐름). 수용부의 설탕이 더 진해지면 흐름이 거꾸로 된다. 20 °C, 설탕만 용질로 보고(Ψs = −C·RT, RT = 2.436 L·MPa/mol), 흐름의 세기는 압력 차에 비례한다고만 나타냈다(실제 속도는 체관의 저항에 따라 다르다).',
  init: function (api) {
    var RT = 0.008314 * 293;
    var st = { cs: 0.6, ck: 0.2, xs: -0.6, xk: -0.3, phase: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.18 : 0.6; }, label: '공급원과 수용부 사이 체관과 물관, 설탕 농도와 팽압' });
    var ctx = cv.ctx;
    var rPs = api.readout('공급원 체관 Ψp');
    var rPk = api.readout('수용부 체관 Ψp');
    var rDP = api.readout('압력 차');
    var rDir = api.readout('체관액 흐름');

    var sCs = api.slider({ id: 'u-pressure-flow-cs', label: '공급원 설탕 농도', min: 0.05, max: 1.0, step: 0.01, value: st.cs,
      format: function (v) { return v.toFixed(2) + ' M'; }, onInput: function (v) { st.cs = v; update(); } });
    var sCk = api.slider({ id: 'u-pressure-flow-ck', label: '수용부 설탕 농도', min: 0.0, max: 1.0, step: 0.01, value: st.ck,
      format: function (v) { return v.toFixed(2) + ' M'; }, onInput: function (v) { st.ck = v; update(); } });
    var sXs = api.slider({ id: 'u-pressure-flow-xs', label: '공급원 쪽 물관 Ψ', min: -1.5, max: 0, step: 0.05, value: st.xs,
      format: function (v) { return v.toFixed(2) + ' MPa'; }, onInput: function (v) { st.xs = v; update(); } });
    var sXk = api.slider({ id: 'u-pressure-flow-xk', label: '수용부 쪽 물관 Ψ', min: -1.5, max: 0, step: 0.05, value: st.xk,
      format: function (v) { return v.toFixed(2) + ' MPa'; }, onInput: function (v) { st.xk = v; update(); } });
    api.button('예제 6 값으로', function () { sCs.set(0.6); sCk.set(0.2); sXs.set(-0.6); sXk.set(-0.3); });

    // 설탕 알갱이: 자리마다 문턱값을 두고, 그 자리의 농도가 문턱보다 크면 보이게 한다
    var parts = [];
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 0; i < 150; i++) parts.push({ u: rnd(), v: 0.15 + 0.7 * rnd(), th: rnd() });

    function calc() {
      var pss = -st.cs * RT, psk = -st.ck * RT;
      var pps = st.xs - pss, ppk = st.xk - psk;
      return { pss: pss, psk: psk, pps: pps, ppk: ppk, dp: pps - ppk };
    }
    function f2(v) { return (v < 0 ? '−' : v > 0 ? '+' : '') + Math.abs(v).toFixed(2); }
    function update() {
      var c = calc();
      rPs.set(f2(c.pps) + ' MPa'); rPk.set(f2(c.ppk) + ' MPa');
      rDP.set(Math.abs(c.dp).toFixed(2) + ' MPa');
      rDir.set(Math.abs(c.dp) < 0.005 ? '멈춤' : c.dp > 0 ? '공급원 → 수용부' : '수용부 → 공급원');
      if (!api.reduced) { if (Math.abs(c.dp) < 0.005) loop.pause(); else loop.play(); }
      draw();
    }
    var loop = api.loop(function (dt) {
      var c = calc();
      st.phase += dt * c.dp * 0.18;
      draw();
    });

    function arrow(x1, y1, x2, y2, col, lw) {
      var a = Math.atan2(y2 - y1, x2 - x1), hl = 6 + lw * 1.6;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hl * 0.8, y2 - Math.sin(a) * hl * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hl * Math.cos(a - 0.45), y2 - hl * Math.sin(a - 0.45));
      ctx.lineTo(x2 - hl * Math.cos(a + 0.45), y2 - hl * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      var c = calc();
      ctx.clearRect(0, 0, w, h);
      var fs = narrow ? 11 : 13;
      var top = narrow ? 0.05 * h : 0.06 * h, endW = narrow ? 64 : 120;
      var L = endW, R = w - endW;
      var pY = top + (narrow ? 0.12 : 0.17) * h, pH = (narrow ? 0.09 : 0.13) * h;
      var xY = pY + pH + (narrow ? 0.09 : 0.14) * h, xH = (narrow ? 0.06 : 0.08) * h;
      // 양 끝 기관
      ctx.font = '600 ' + (fs + 1) + 'px ' + T.fontBody; ctx.textAlign = 'center';
      rr(4, top, endW - 12, xY + xH - top + 6, 10); ctx.fillStyle = T.figSoftGreen; ctx.fill(); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.stroke();
      rr(R + 8, top, endW - 12, xY + xH - top + 6, 10); ctx.fillStyle = T.figSoftAmber; ctx.fill(); ctx.strokeStyle = T.figAmber; ctx.stroke();
      ctx.fillStyle = T.figInk;
      ctx.fillText('공급원', (4 + endW - 8) / 2, top + 18);
      ctx.fillText('수용부', (R + 8 + w - 4) / 2, top + 18);
      ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText(narrow ? '잎' : '다 자란 잎', (4 + endW - 8) / 2, top + 18 + fs + 4);
      ctx.fillText(narrow ? '뿌리' : '뿌리·열매', (R + 8 + w - 4) / 2, top + 18 + fs + 4);

      // 체관: 농도에 따라 색 진하기
      var cmax = 1.0;
      ctx.fillStyle = T.figSoftAmber; rr(L - 8, pY, R - L + 16, pH, 8); ctx.fill();
      ctx.save(); rr(L - 8, pY, R - L + 16, pH, 8); ctx.clip();
      // 알갱이
      ctx.fillStyle = T.figAmber;
      parts.forEach(function (p) {
        var u = ((p.u + st.phase) % 1 + 1) % 1;
        var conc = st.cs + (st.ck - st.cs) * u;
        if (conc / cmax > p.th) {
          ctx.beginPath(); ctx.arc(L + u * (R - L), pY + p.v * pH, narrow ? 2.2 : 3, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.restore();
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; rr(L - 8, pY, R - L + 16, pH, 8); ctx.stroke();
      // 물관
      rr(L - 8, xY, R - L + 16, xH, 6); ctx.fillStyle = T.figSoftBlue; ctx.fill(); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('체관(설탕 용액, 양압)', L + 4, pY - 6);
      ctx.fillText('물관(물, 음압·장력)', L + 4, xY + xH + fs + 6);
      // 물관 흐름(뿌리 → 잎)
      arrow(R - 10, xY + xH / 2, L + 10, xY + xH / 2, T.figBlue, 2);
      // 체관 흐름 큰 화살표
      var mid = (L + R) / 2, len = Math.min((R - L) * 0.32, 26 + Math.abs(c.dp) * 120);
      if (Math.abs(c.dp) >= 0.005) {
        var d = c.dp > 0 ? 1 : -1;
        arrow(mid - d * len / 2, pY - (narrow ? 22 : 28), mid + d * len / 2, pY - (narrow ? 22 : 28), T.figRed, 2 + Math.min(5, Math.abs(c.dp) * 5));
      }
      ctx.textAlign = 'right'; ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figRed;
      ctx.fillText(Math.abs(c.dp) < 0.005 ? '흐름 없음' : '집단 흐름', R, pY - (narrow ? 18 : 24));
      // 물 출입 화살표 (공급원: 물관 → 체관, 수용부: 체관 → 물관)
      var gapT = pY + pH + 3, gapB = xY - 3;
      arrow(L + 24, gapB, L + 24, gapT, T.figBlue, 2.5);
      arrow(R - 24, gapT, R - 24, gapB, T.figBlue, 2.5);
      ctx.fillStyle = T.figBlue; ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('물 들어옴', L + 32, (gapT + gapB) / 2 + 4);
      ctx.textAlign = 'right'; ctx.fillText('물 나감', R - 32, (gapT + gapB) / 2 + 4);
      // 설탕 적재·하역
      ctx.fillStyle = T.figAmber; ctx.textAlign = 'center'; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
      arrow(endW * 0.25 + 4, pY + pH / 2, L - 10, pY + pH / 2, T.figAmber, 2.5);
      arrow(R + 10, pY + pH / 2, R + (w - R) * 0.75 - 4, pY + pH / 2, T.figAmber, 2.5);
      ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
      if (narrow) {
        ctx.fillText('설탕', endW / 2 - 2, pY + pH / 2 + fs + 8); ctx.fillText('적재', endW / 2 - 2, pY + pH / 2 + 2 * fs + 10);
        ctx.fillText('설탕', R + endW / 2 + 2, pY + pH / 2 + fs + 8); ctx.fillText('하역', R + endW / 2 + 2, pY + pH / 2 + 2 * fs + 10);
      } else {
        ctx.fillText('설탕 적재', endW / 2, pY + pH / 2 + fs + 8);
        ctx.fillText('설탕 하역', R + endW / 2, pY + pH / 2 + fs + 8);
      }

      // 아래: 수분 퍼텐셜 표
      var tY = xY + xH + (narrow ? fs + 40 : 0.1 * h);
      var colX = narrow ? [w * 0.42, w * 0.7, w * 0.8] : [w * 0.33, w * 0.53, w * 0.73];
      var lab0 = narrow ? 8 : w * 0.06;
      var rows = [
        ['', '공급원', '수용부'],
        [narrow ? '설탕 C' : '설탕 농도 C', st.cs.toFixed(2) + ' M', st.ck.toFixed(2) + ' M'],
        [narrow ? 'Ψs' : 'Ψs = −C·RT', f2(c.pss), f2(c.psk)],
        [narrow ? '물관 Ψ' : '이웃 물관 Ψ', f2(st.xs), f2(st.xk)],
        [narrow ? 'Ψp' : 'Ψp = Ψ물관 − Ψs', f2(c.pps), f2(c.ppk)],
      ];
      var rh = narrow ? 22 : 24;
      ctx.font = fs + 'px ' + T.fontBody;
      rows.forEach(function (row, i) {
        var y = tY + i * rh;
        if (i > 0) { ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lab0, y - rh + 7); ctx.lineTo(w - lab0, y - rh + 7); ctx.stroke(); }
        ctx.textAlign = 'left'; ctx.fillStyle = i === 4 ? T.figInk : T.figMuted;
        ctx.font = (i === 0 || i === 4 ? '600 ' : '') + fs + 'px ' + T.fontBody;
        ctx.fillText(row[0], lab0, y);
        ctx.textAlign = 'center';
        ctx.fillStyle = T.figInk;
        ctx.fillText(row[1], colX[0], y);
        ctx.fillText(row[2], colX[1], y);
      });
      // 압력 차 박스
      var bx = narrow ? lab0 : colX[2] - 10, by = narrow ? tY + rows.length * rh + 4 : tY - rh + 8;
      var bw = narrow ? w - 2 * lab0 : w - lab0 - bx, bh = narrow ? 2 * rh + 8 : rows.length * rh - 4;
      rr(bx, by, bw, bh, 8); ctx.fillStyle = T.figSoftRed; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
      ctx.font = '600 ' + fs + 'px ' + T.fontBody;
      ctx.fillText('압력 차 ΔΨp', bx + bw / 2, by + (narrow ? 20 : 26));
      ctx.font = '600 ' + (fs + 5) + 'px ' + T.fontMono;
      ctx.fillText(f2(c.dp) + ' MPa', bx + bw / 2, by + (narrow ? 42 : 58));
      if (!narrow) {
        ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText(c.dp > 0.005 ? '공급원 → 수용부' : c.dp < -0.005 ? '수용부 → 공급원' : '흐름 없음', bx + bw / 2, by + 84);
      }
      // 경고: 팽압이 음이면 체관이 시든다
      if (c.pps < 0 || c.ppk < 0) {
        ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
        if (narrow) { ctx.fillText('팽압이 0보다 작은 쪽은 실제로는', lab0, h - 26); ctx.fillText('물을 잃고 시든다(모형의 범위 밖)', lab0, h - 8); }
        else ctx.fillText('팽압이 0보다 작은 쪽은 실제로는 물을 잃고 시든다(모형의 범위 밖)', lab0, h - 8);
      }
    }
    api.onResize(draw);
    update();
  },
});
