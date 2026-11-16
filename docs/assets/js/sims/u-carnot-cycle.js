/* 일반물리학 7 열과 열역학: 카르노 순환 — 이상 기체 1 mol의 P–V 그림과 T–S 그림, 열·일·효율·엔트로피 장부 */
Sims.register('u-carnot-cycle', {
  title: '카르노 순환 — P–V 그림과 T–S 그림으로 보는 열·일·효율',
  caption: '두 열원의 온도, 등온 팽창의 부피비, 작동 기체를 바꾸고 「재생」 또는 「다음 단계」로 순환을 따라가 보자. P–V 그림에서 닫힌 곡선이 둘러싼 넓이가 한 순환의 알짜 일 W이고, T–S 그림에서는 같은 W가 직사각형 넓이로, Q_H와 Q_C는 각 등온선 아래 넓이로 보인다. 부피비나 기체를 바꾸면 Q_H와 W는 달라지지만 효율은 언제나 1 − T_C/T_H이고, 두 열원의 엔트로피 변화의 합은 0이다(가역). 이상 기체 1 mol, 처음 부피 V₁ = 10 L로 계산했고 엔트로피는 상태 1을 0으로 잡았다.',
  init: function (api) {
    var R = 8.314, n = 1, V1 = 0.010;
    var st = { TH: 500, TC: 300, r: 2, mono: false, k: 0, s: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.5 : 0.5; }, label: '카르노 순환의 P–V 그림과 T–S 그림' });
    var ctx = cv.ctx;

    var rStage = api.readout('지금 단계');
    var rQH = api.readout('Q_H (흡수)');
    var rQC = api.readout('Q_C (방출)');
    var rW = api.readout('알짜 일 W');
    var rE = api.readout('효율 W/Q_H');
    var rS = api.readout('열원의 엔트로피 변화');

    var sTH = api.slider({ id: 'u-carnot-cycle-th', label: '고열원 T_H', min: 350, max: 800, step: 10, value: st.TH,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.TH = v; if (st.TC > v - 50) sTC.set(v - 50); draw(); } });
    var sTC = api.slider({ id: 'u-carnot-cycle-tc', label: '저열원 T_C', min: 200, max: 750, step: 10, value: st.TC,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.TC = Math.min(v, st.TH - 50); if (st.TC !== v) sTC.input.value = st.TC; draw(); } });
    api.slider({ id: 'u-carnot-cycle-r', label: '등온 팽창 부피비 V₂/V₁', min: 1.2, max: 4, step: 0.1, value: st.r,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.r = v; draw(); } });
    var g = api.group();
    var bMono = api.button('단원자 기체', function () { st.mono = true; syncGas(); }, { toggle: true, pressed: false, parent: g });
    var bDi = api.button('이원자 기체', function () { st.mono = false; syncGas(); }, { toggle: true, pressed: true, parent: g });
    var bPlay = api.button(api.reduced ? '재생' : '멈춤', function () { if (loop.wanted) { loop.pause(); bPlay.textContent = '재생'; } else { loop.play(); bPlay.textContent = '멈춤'; } }, { primary: true });
    api.button('다음 단계', function () { loop.pause(); bPlay.textContent = '재생'; st.k = (st.k + 1) % 4; st.s = 0; draw(); });
    function syncGas() { bMono.setAttribute('aria-pressed', st.mono ? 'true' : 'false'); bDi.setAttribute('aria-pressed', st.mono ? 'false' : 'true'); draw(); }

    /* 'Q_H'처럼 쓴 아래첨자를 화면에서 바르게 보이게 한다 */
    function subify(root) {
      var wk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
      while (wk.nextNode()) list.push(wk.currentNode);
      list.forEach(function (t) {
        if (!/_[A-Za-z0-9]/.test(t.nodeValue)) return;
        var fr = document.createDocumentFragment();
        t.nodeValue.split(/_([A-Za-z0-9]+)/).forEach(function (p, i) {
          if (i % 2) { var s = document.createElement('sub'); s.textContent = p; fr.appendChild(s); } else if (p) fr.appendChild(document.createTextNode(p));
        });
        t.parentNode.replaceChild(fr, t);
      });
    }
    function fillSub(str, x, y, px, bold) {
      var parts = str.split(/_([A-Za-z0-9]+)/), f1 = (bold ? '600 ' : '') + px + 'px ' + api.tokens().fontBody, f2 = (bold ? '600 ' : '') + Math.round(px * 0.78) + 'px ' + api.tokens().fontBody;
      var al = ctx.textAlign, wsum = 0;
      parts.forEach(function (p, i) { ctx.font = i % 2 ? f2 : f1; wsum += ctx.measureText(p).width; });
      var x0 = al === 'center' ? x - wsum / 2 : al === 'right' ? x - wsum : x;
      ctx.textAlign = 'left';
      parts.forEach(function (p, i) { ctx.font = i % 2 ? f2 : f1; ctx.fillText(p, x0, y + (i % 2 ? px * 0.3 : 0)); x0 += ctx.measureText(p).width; });
      ctx.textAlign = al;
    }

    var loop = api.loop(function (dt) {
      st.s += dt / 2.2;
      if (st.s >= 1) { st.s = 0; st.k = (st.k + 1) % 4; }
      draw();
    });

    function model() {
      var gam = st.mono ? 5 / 3 : 7 / 5, Cv = R / (gam - 1), ex = 1 / (gam - 1);
      var TH = st.TH, TC = Math.min(st.TC, TH - 50), V2 = V1 * st.r, k = Math.pow(TH / TC, ex);
      var V3 = V2 * k, V4 = V1 * k;
      return { gam: gam, Cv: Cv, ex: ex, TH: TH, TC: TC, V: [V1, V2, V3, V4],
        QH: n * R * TH * Math.log(st.r), QC: n * R * TC * Math.log(st.r) };
    }
    // 과정 k의 진행 s(0~1)에서의 상태 (V, T)
    function stateAt(m, k, s) {
      var V, T;
      if (k === 0) { T = m.TH; V = m.V[0] * Math.pow(m.V[1] / m.V[0], s); }
      else if (k === 1) { T = m.TH + (m.TC - m.TH) * s; V = m.V[1] * Math.pow(m.TH / T, m.ex); }
      else if (k === 2) { T = m.TC; V = m.V[2] * Math.pow(m.V[3] / m.V[2], s); }
      else { T = m.TC + (m.TH - m.TC) * s; V = m.V[3] * Math.pow(m.TC / T, m.ex); }
      return { V: V, T: T, P: n * R * T / V, S: n * m.Cv * Math.log(T / m.TH) + n * R * Math.log(V / m.V[0]) };
    }
    var stageText = ['1→2 고온 등온 팽창(열 흡수)', '2→3 단열 팽창(온도 하강)', '3→4 저온 등온 압축(열 방출)', '4→1 단열 압축(온도 상승)'];

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { pv: { x: 0, y: 0, w: w, h: h * 0.53 }, ts: { x: 0, y: h * 0.55, w: w, h: h * 0.45 } };
      return { pv: { x: 0, y: 0, w: w * 0.56, h: h }, ts: { x: w * 0.58, y: 0, w: w * 0.42, h: h } };
    }
    function axes(T, r, xlab, ylab, xmax, ymax, xt, yt) {
      var L = r.x + 54, Rr = r.x + r.w - 12, Tp = r.y + 26, B = r.y + r.h - 40;
      var o = { L: L, R: Rr, T: Tp, B: B, sx: function (v) { return L + v / xmax * (Rr - L); }, sy: function (v) { return B - v / ymax * (B - Tp); } };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      xt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(o.sx(v), Tp); ctx.lineTo(o.sx(v), B); ctx.stroke(); ctx.fillText(fmt(v), o.sx(v), B + 14); });
      ctx.textAlign = 'right';
      yt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, o.sy(v)); ctx.lineTo(Rr, o.sy(v)); ctx.stroke(); ctx.fillText(fmt(v), L - 5, o.sy(v) + 4); });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(xlab, (L + Rr) / 2, B + 30);
      ctx.textAlign = 'left'; ctx.fillText(ylab, r.x + 6, r.y + 14);
      return o;
    }
    function fmt(v) { return Math.abs(v) >= 100 ? Math.round(v) : Math.abs(v) >= 10 ? v.toFixed(0) : (+v.toFixed(1)).toString(); }
    function ticks(max, cnt) {
      var raw = max / cnt, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p, st2 = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p, out = [];
      for (var v = 0; v <= max * 1.0001; v += st2) out.push(+v.toFixed(6));
      return out;
    }
    var COLS = function (T) { return [T.figRed, T.figAmber, T.figBlue, T.figViolet]; };

    function draw() {
      var T = api.tokens(), m = model(), Lo = layout(), cols = COLS(T);
      ctx.clearRect(0, 0, cv.w, cv.h);
      // ── P–V
      var Vmax = m.V[2] * 1e3 * 1.06, Pmax = n * R * m.TH / m.V[0] / 1e3 * 1.12;
      var a = axes(T, Lo.pv, '부피 V (L)', '압력 P (kPa)', Vmax, Pmax, ticks(Vmax, cv.w < 560 ? 5 : 6), ticks(Pmax, 5));
      var paths = [0, 1, 2, 3].map(function (k) { var pts = []; for (var i = 0; i <= 60; i++) pts.push(stateAt(m, k, i / 60)); return pts; });
      ctx.beginPath();
      paths.forEach(function (pts) { pts.forEach(function (p, i) { var x = a.sx(p.V * 1e3), y = a.sy(p.P / 1e3); if (i === 0 && pts === paths[0]) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); });
      ctx.closePath(); ctx.fillStyle = T.figSoftBlue; ctx.fill();
      paths.forEach(function (pts, k) {
        ctx.beginPath(); pts.forEach(function (p, i) { var x = a.sx(p.V * 1e3), y = a.sy(p.P / 1e3); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.strokeStyle = cols[k]; ctx.lineWidth = k === st.k ? 4 : 2.2; ctx.stroke();
      });
      [0, 1, 2, 3].forEach(function (k) {
        var p = stateAt(m, k, 0), x = a.sx(p.V * 1e3), y = a.sy(p.P / 1e3);
        ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = k === 0 || k === 3 ? 'right' : 'left';
        ctx.fillText(String(k + 1), x + (k === 0 || k === 3 ? -6 : 6), y + (k === 0 ? -4 : k === 2 ? 14 : -6));
      });
      var mid = stateAt(m, 1, 0.5);
      ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      var cx = a.sx((m.V[0] + m.V[2]) / 2 * 1e3 * 0.62), cy = a.sy(mid.P / 1e3 * 0.95);
      ctx.fillText('넓이 = W', Math.max(a.L + 40, Math.min(cx, a.sx(mid.V * 1e3) - 40)), cy);
      // ── T–S
      var S2 = n * R * Math.log(st.r), Smax = S2 * 1.25, Tmax = m.TH * 1.18;
      var b = axes(T, Lo.ts, '엔트로피 S (J/K)', '온도 T (K)', Smax, Tmax, ticks(Smax, 4), ticks(Tmax, 4));
      ctx.fillStyle = T.figSoftRed; ctx.globalAlpha = 0.9; ctx.fillRect(b.sx(0), b.sy(m.TH), b.sx(S2) - b.sx(0), b.sy(m.TC) - b.sy(m.TH));
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(b.sx(0), b.sy(m.TC), b.sx(S2) - b.sx(0), b.sy(0) - b.sy(m.TC)); ctx.globalAlpha = 1;
      var corners = [[0, m.TH], [S2, m.TH], [S2, m.TC], [0, m.TC]];
      for (var k2 = 0; k2 < 4; k2++) {
        var c1 = corners[k2], c2 = corners[(k2 + 1) % 4];
        ctx.beginPath(); ctx.moveTo(b.sx(c1[0]), b.sy(c1[1])); ctx.lineTo(b.sx(c2[0]), b.sy(c2[1]));
        ctx.strokeStyle = cols[k2]; ctx.lineWidth = k2 === st.k ? 4 : 2.2; ctx.stroke();
      }
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figInk; ctx.fillText('W', (b.sx(0) + b.sx(S2)) / 2, (b.sy(m.TH) + b.sy(m.TC)) / 2 + 4);
      ctx.fillStyle = T.figBlue; fillSub('Q_C', (b.sx(0) + b.sx(S2)) / 2, (b.sy(m.TC) + b.sy(0)) / 2 + 4, 12, true);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; fillSub('Q_H = 색칠한 전체 넓이', b.L + 4, b.sy(m.TH) - 7, 12, true);
      // 지금 위치
      var p = stateAt(m, st.k, st.s);
      dot(a.sx(p.V * 1e3), a.sy(p.P / 1e3)); dot(b.sx(p.S), b.sy(p.T));
      function dot(x, y) { ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = cols[st.k]; ctx.stroke(); }

      var W = m.QH - m.QC;
      rStage.set(stageText[st.k]);
      rQH.set((m.QH / 1e3).toFixed(2) + ' kJ'); rQC.set((m.QC / 1e3).toFixed(2) + ' kJ'); rW.set((W / 1e3).toFixed(2) + ' kJ');
      rE.set((W / m.QH * 100).toFixed(1) + ' % (카르노 효율 ' + ((1 - m.TC / m.TH) * 100).toFixed(1) + ' %)');
      rS.set('−' + (m.QH / m.TH).toFixed(2) + ' + ' + (m.QC / m.TC).toFixed(2) + ' = 0 J/K');
    }
    subify(api.root);
    api.onResize(draw);
    draw();
    if (api.reduced) { loop.pause(); }
  },
});
