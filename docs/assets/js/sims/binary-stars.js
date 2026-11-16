/* 행성우주과학 2: 쌍성 — 공통 질량 중심 둘레의 공전과 시선 속도 곡선, M1 + M2 = a³/P² */
Sims.register('binary-stars', {
  title: '서로를 도는 두 별 — 쌍성으로 별의 질량 재기',
  caption: '질량비를 바꾸면 무거운 별일수록 질량 중심 가까이에서 작은 원을 느리게 돌고(M₁a₁ = M₂a₂), 시선 속도 곡선의 진폭도 질량에 반비례한다. 궤도 긴반지름과 질량 합을 바꾸면 공전 주기가 M₁ + M₂ = a³/P²(태양 질량·AU·년)에 따라 달라진다. 궤도는 원이고, 관측자는 궤도면과 나란한 방향(아래쪽)에서 본다고 가정했다. 화면에서는 한 바퀴를 약 6초로 줄였고, 별의 크기는 실제 비율이 아니다.',
  init: function (api) {
    var st = { q: 0.48, mt: 3.1, a: 19.8, ph: 0.3, playing: !api.reduced };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.56; }, label: '공통 질량 중심 둘레를 도는 두 별과 시선 속도 곡선' });
    var ctx = cv.ctx;
    var rP = api.readout('공전 주기 P');
    var rM = api.readout('질량 합 = a³/P²');
    var rEach = api.readout('별 1 · 별 2 질량');
    var rA = api.readout('질량 중심까지 a₁ : a₂');
    var rV = api.readout('공전 속력 v₁ · v₂');

    var gp = api.group();
    var pre = [
      api.button('시리우스 A·B', function () { set(1.0 / 2.1, 3.1, 19.8); mark(0); }, { toggle: true, pressed: true, parent: gp }),
      api.button('알파 센타우리 A·B', function () { set(0.9 / 1.1, 2.0, 23.5); mark(1); }, { toggle: true, parent: gp }),
    ];
    function mark(i) { pre.forEach(function (b, j) { b.setAttribute('aria-pressed', i === j ? 'true' : 'false'); }); }
    function set(q, mt, a) { sQ.set(q); sM.set(mt); sA.set(a); }
    var sQ = api.slider({ id: 'binary-stars-q', label: '질량비 M₂/M₁', min: 0.1, max: 1, step: 0.01, value: st.q,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.q = v; mark(-1); upd(); } });
    var sM = api.slider({ id: 'binary-stars-mt', label: '질량 합 M₁ + M₂', min: 0.5, max: 6, step: 0.1, value: st.mt,
      format: function (v) { return v.toFixed(1) + ' M☉'; }, onInput: function (v) { st.mt = v; mark(-1); upd(); } });
    var sA = api.slider({ id: 'binary-stars-a', label: '상대 궤도 긴반지름 a', min: 1, max: 30, step: 0.1, value: st.a,
      format: function (v) { return v.toFixed(1) + ' AU'; }, onInput: function (v) { st.a = v; mark(-1); upd(); } });
    var playBtn = api.button(st.playing ? '멈춤' : '움직이기', function () { st.playing = !st.playing; playBtn.textContent = st.playing ? '멈춤' : '움직이기'; if (st.playing) loop.play(); else loop.pause(); }, { primary: true });

    function q() {
      var M1 = st.mt / (1 + st.q), M2 = st.mt - M1, P = Math.sqrt(Math.pow(st.a, 3) / st.mt);
      var a1 = st.a * M2 / st.mt, a2 = st.a * M1 / st.mt;
      return { M1: M1, M2: M2, P: P, a1: a1, a2: a2, v1: 2 * Math.PI * a1 / P * 4.74, v2: 2 * Math.PI * a2 / P * 4.74 };
    }
    function upd() {
      var Q = q();
      rP.set(Q.P.toFixed(1) + '년');
      rM.set(Math.pow(st.a, 3).toFixed(0) + ' ÷ ' + (Q.P * Q.P).toFixed(0) + ' = ' + st.mt.toFixed(1) + ' M☉');
      rEach.set(Q.M1.toFixed(2) + ' M☉ · ' + Q.M2.toFixed(2) + ' M☉');
      rA.set(Q.a1.toFixed(1) + ' AU : ' + Q.a2.toFixed(1) + ' AU');
      rV.set(Q.v1.toFixed(1) + ' km/s · ' + Q.v2.toFixed(1) + ' km/s');
      draw();
    }
    var loop = api.loop(function (dt) {
      if (!st.playing || !(dt > 0)) return;
      st.ph = (st.ph + dt / 6) % 1; draw();
    });
    if (!st.playing) loop.pause();

    function txt(T, s, x, y, o) { o = o || {}; ctx.fillStyle = o.color || T.figInk; ctx.textAlign = o.align || 'left'; ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + T.fontBody; ctx.fillText(s, x, y); }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stack = w < 560, Q = q();
      ctx.clearRect(0, 0, w, h);
      var sc = stack ? { x: 0, y: 0, w: w, h: h * 0.52 } : { x: 0, y: 0, w: w * 0.44, h: h };
      var gr = stack ? { x: 0, y: h * 0.54, w: w, h: h * 0.46 } : { x: w * 0.46, y: 0, w: w * 0.54, h: h };
      // 궤도 (위에서 본 모습)
      txt(T, '궤도면을 위에서 본 모습', sc.x + 8, sc.y + 18, { bold: true });
      var cx = sc.x + sc.w / 2, cy = sc.y + sc.h * 0.5, R = Math.min(sc.w, sc.h) * 0.36, k = R / Math.max(Q.a1, Q.a2);
      var th = 2 * Math.PI * st.ph;
      ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.strokeStyle = T.figBlue; ctx.beginPath(); ctx.arc(cx, cy, Q.a1 * k, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = T.figAmber; ctx.beginPath(); ctx.arc(cx, cy, Q.a2 * k, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      var p1 = [cx + Q.a1 * k * Math.cos(th), cy - Q.a1 * k * Math.sin(th)], p2 = [cx - Q.a2 * k * Math.cos(th), cy + Q.a2 * k * Math.sin(th)];
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();
      var r1 = 7 + 5 * Math.pow(Q.M1 / 3, 0.6), r2 = 7 + 5 * Math.pow(Q.M2 / 3, 0.6);
      ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(p1[0], p1[1], r1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(p2[0], p2[1], r2, 0, Math.PI * 2); ctx.fill();
      txt(T, '1', p1[0], p1[1] + 4, { align: 'center', bold: true, color: T.figPaper });
      txt(T, '2', p2[0], p2[1] + 4, { align: 'center', bold: true, color: T.figPaper });
      txt(T, '+ 질량 중심', cx + 8, cy - 8, { size: 11, color: T.figMuted });
      // 관측자
      var oy = sc.y + sc.h - 22;
      ctx.fillStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(cx, cy + R + 10); ctx.lineTo(cx - 5, cy + R + 19); ctx.lineTo(cx + 5, cy + R + 19); ctx.fill();
      txt(T, '↓ 관측자 쪽 (궤도면과 나란히 봄)', cx, Math.max(oy, cy + R + 34), { size: 11, color: T.figMuted, align: 'center' });
      // 시선 속도 곡선
      var L = gr.x + 54, Rr = gr.x + gr.w - 14, Tp = gr.y + 48, B = gr.y + gr.h - 36;
      var vmax = Math.max(Q.v1, Q.v2), top = nice(vmax * 1.15);
      var sx = function (f) { return L + f / 2 * (Rr - L); }, sy = function (v) { return (Tp + B) / 2 - v / top * (B - Tp) / 2; };
      txt(T, '시선 속도 곡선 (멀어지면 +, km/s)', gr.x + 6, gr.y + 16, { bold: true });
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [-top, -top / 2, 0, top / 2, top].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(v.toFixed(top < 10 ? 1 : 0), L - 5, sy(v) + 4); });
      [0, 0.5, 1, 1.5, 2].forEach(function (f) { ctx.textAlign = 'center'; ctx.fillText(f === 0 ? '0' : f + 'P', sx(f), B + 14); });
      txt(T, '시간 (공전 주기 P = ' + Q.P.toFixed(1) + '년 단위)', (L + Rr) / 2, B + 29, { size: 11, align: 'center' });
      // 별 1: 위치 (cosθ, sinθ)·a1, 관측자는 -y쪽 → 멀어지는 속도 = +y 성분 = v1 cosθ
      function curve(sign, v, color) {
        ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath();
        for (var i = 0; i <= 240; i++) { var f = 2 * i / 240, y = sy(sign * v * Math.cos(2 * Math.PI * f)); if (i) ctx.lineTo(sx(f), y); else ctx.moveTo(sx(f), y); }
        ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx(st.ph), sy(sign * v * Math.cos(th)), 4.5, 0, Math.PI * 2); ctx.fill();
      }
      curve(1, Q.v1, T.figBlue); curve(-1, Q.v2, T.figAmber);
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sx(st.ph), Tp); ctx.lineTo(sx(st.ph), B); ctx.stroke(); ctx.setLineDash([]);
      txt(T, '별 1 (무거운 별)', L + 6, gr.y + 34, { size: 11, color: T.figBlue, bold: true });
      txt(T, '별 2', Rr - 4, gr.y + 34, { size: 11, color: T.figAmber, bold: true, align: 'right' });
    }
    function nice(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : m <= 6 ? 6 : m <= 8 ? 8 : 10) * p; }
    api.onResize(draw);
    upd();
  },
});
