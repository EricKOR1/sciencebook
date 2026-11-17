/* 일반화학 12 결정장 이론: Δo와 d 전자 수 → 고스핀·저스핀, 홀전자 수, 자기 모멘트, CFSE, 흡수하는 빛과 보이는 색 */
Sims.register('u-crystal-field', {
  title: '결정장 갈라짐 — 전자 배치, 자기성, 그리고 착물의 색',
  caption: '착물을 고르거나 d 전자 수, 갈라짐 에너지 Δo, 짝지음 에너지 P를 바꿔 보자. d⁴~d⁷에서는 Δo < P이면 전자가 eg로 올라가는 고스핀, Δo > P이면 t2g에서 짝을 짓는 저스핀이 되어 홀전자 수와 자기 모멘트 μ = √(n(n+2)) μB가 달라진다. 아래 띠는 Δo = 1.196×10⁵/λ(nm)로 정한 흡수 파장과, 그 보색으로 어림한 보이는 색이다. 흡수 띠를 Δo 한 곳으로만 본 것은 d¹에서만 정확한 단순화이며(전자가 여럿이면 흡수 띠가 여러 개), d⁰·d¹⁰은 d–d 전이가 없고 d⁵ 고스핀은 스핀 금지로 색이 매우 옅다. 착물의 Δo·P 값은 문헌값을 어림한 것이다.',
  init: function (api) {
    var cx = [
      { name: '[Ti(H₂O)₆]³⁺', d: 1, D: 239, P: 250 },
      { name: '[Cr(H₂O)₆]³⁺', d: 3, D: 208, P: 280 },
      { name: '[Fe(H₂O)₆]²⁺', d: 6, D: 124, P: 210 },
      { name: '[Fe(CN)₆]⁴⁻', d: 6, D: 395, P: 210 },
      { name: '[Co(NH₃)₆]³⁺', d: 6, D: 274, P: 251 },
      { name: '[CoF₆]³⁻', d: 6, D: 157, P: 251 },
    ];
    var st = { d: 1, D: 239, P: 250 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.2 : 0.56; }, label: 'd 오비탈 에너지 준위와 전자 배치, 흡수 스펙트럼' });
    var ctx = cv.ctx;
    var rS = api.readout('배치'), rN = api.readout('홀전자 / μ'), rE = api.readout('CFSE'), rL = api.readout('흡수 λ → 보이는 색');

    var g = api.group();
    var cb = cx.map(function (c, i) { return api.button(c.name, function () { pick(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    var lock = false;
    var sd = api.slider({ id: 'u-crystal-field-d', label: 'd 전자 수', min: 0, max: 10, step: 1, value: st.d,
      format: function (v) { return 'd' + sup(v); }, onInput: function (v) { st.d = v; un(); draw(); } });
    var sD = api.slider({ id: 'u-crystal-field-delta', label: 'Δo', min: 100, max: 420, step: 1, value: st.D,
      format: function (v) { return v + ' kJ/mol'; }, onInput: function (v) { st.D = v; un(); draw(); } });
    var sP = api.slider({ id: 'u-crystal-field-p', label: '짝지음 에너지 P', min: 150, max: 330, step: 1, value: st.P,
      format: function (v) { return v + ' kJ/mol'; }, onInput: function (v) { st.P = v; un(); draw(); } });

    function sup(n) { var m = '⁰¹²³⁴⁵⁶⁷⁸⁹'; return String(n).split('').map(function (c) { return m[+c]; }).join(''); }
    function un() { if (!lock) cb.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); }
    function pick(i) {
      var c = cx[i]; lock = true; sd.set(c.d); sD.set(c.D); sP.set(c.P); lock = false;
      cb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    }
    // 전자 배치: t2g 3칸, eg 2칸. 각 칸 [위, 아래]
    function config() {
      var d = st.d, low = st.D > st.P, t = [0, 0, 0], e = [0, 0], i;
      var order = [];
      if (low) { order = ['t', 't', 't', 'tp', 'tp', 'tp', 'e', 'e', 'ep', 'ep']; }
      else { order = ['t', 't', 't', 'e', 'e', 'tp', 'tp', 'tp', 'ep', 'ep']; }
      var ti = 0, tpi = 0, ei = 0, epi = 0;
      for (i = 0; i < d; i++) {
        var o = order[i];
        if (o === 't') t[ti++] = 1; else if (o === 'tp') t[tpi++] = 2; else if (o === 'e') e[ei++] = 1; else e[epi++] = 2;
      }
      var nt = t.reduce(function (a, b) { return a + b; }, 0), ne = e.reduce(function (a, b) { return a + b; }, 0);
      var unp = t.concat(e).filter(function (x) { return x === 1; }).length;
      var pairs = t.concat(e).filter(function (x) { return x === 2; }).length;
      var spinCase = d >= 4 && d <= 7;
      return { t: t, e: e, nt: nt, ne: ne, unp: unp, pairs: pairs, low: low && spinCase, high: !low && spinCase, cfse: -0.4 * nt + 0.6 * ne };
    }
    function wl2rgb(l) {
      var r = 0, g = 0, b = 0;
      if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; }
      else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else { r = 1; }
      var f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 700 ? 0.3 + 0.7 * (780 - l) / 80 : 1;
      return 'rgb(' + [r, g, b].map(function (x) { return Math.round(255 * Math.max(0, x) * f); }).join(',') + ')';
    }
    function seen(l) {   // 원고의 표: 흡수 → 보이는 색
      if (l < 400) return null; if (l < 430) return ['노랑', '#e8d33a']; if (l < 490) return ['주황', '#f08a2c'];
      if (l < 560) return ['빨강–자주', '#b8337a']; if (l < 590) return ['보라', '#7b3fb8']; if (l < 650) return ['파랑', '#2f62d8'];
      if (l <= 750) return ['청록', '#1aa6a0']; return null;
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, c = config();
      ctx.clearRect(0, 0, w, h);
      var ex = narrow ? { x: 0, y: 0, w: w, h: h * 0.62 } : { x: 0, y: 0, w: w * 0.55, h: h };
      var sp = narrow ? { x: 0, y: h * 0.64, w: w, h: h * 0.36 } : { x: w * 0.57, y: 0, w: w * 0.43, h: h };
      // 준위 그림
      var Dmax = 420, top = ex.y + 30, bot = ex.y + ex.h - 30, bar = top + (bot - top) * 0.55;
      var scale = (bot - top) * 0.8 / Dmax;
      var yE = bar - 0.6 * st.D * scale, yT = bar + 0.4 * st.D * scale;
      var mid = ex.x + ex.w * 0.56, bw = 34, gap = 14;
      ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ex.x + 40, bar); ctx.lineTo(ex.x + ex.w - 10, bar); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('평균', ex.x + ex.w - 10, bar - 4);
      function box(x, y, n, col) {
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + bw, y); ctx.stroke();
        ctx.strokeStyle = T.figInk; ctx.fillStyle = T.figInk; ctx.lineWidth = 2;
        function arrow(ax, upDir) {
          var y1 = y - 4, y2 = y - 26; if (!upDir) { var tmp = y1; y1 = y2; y2 = tmp; }
          ctx.beginPath(); ctx.moveTo(ax, y1); ctx.lineTo(ax, y2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ax, y2); ctx.lineTo(ax - 4, y2 + (upDir ? 6 : -6)); ctx.lineTo(ax + 4, y2 + (upDir ? 6 : -6)); ctx.closePath(); ctx.fill();
        }
        if (n >= 1) arrow(x + (n === 2 ? 11 : 17), true);
        if (n === 2) arrow(x + 23, false);
      }
      var xsT = mid - (3 * bw + 2 * gap) / 2, xsE = mid - (2 * bw + gap) / 2;
      c.t.forEach(function (n, i) { box(xsT + i * (bw + gap), yT, n, T.figBlue); });
      c.e.forEach(function (n, i) { box(xsE + i * (bw + gap), yE, n, T.figRed); });
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      function subl(main, sb, x, y, col) { ctx.fillStyle = col; ctx.font = '600 14px ' + T.fontBody; ctx.fillText(main, x, y); var mw = ctx.measureText(main).width; ctx.font = '600 11px ' + T.fontBody; ctx.fillText(sb, x + mw, y + 4); }
      subl('e', 'g', xsE + 2 * bw + gap + 10, yE + 4, T.figRed);
      subl('t', '2g', xsT + 3 * bw + 2 * gap + 10, yT + 4, T.figBlue);
      // Δo 괄호
      var bx = xsT - 22;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(bx - 4, yE); ctx.lineTo(bx + 4, yE); ctx.moveTo(bx, yE); ctx.lineTo(bx, yT); ctx.moveTo(bx - 4, yT); ctx.lineTo(bx + 4, yT); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'right'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('Δo = ' + st.D, bx - 7, (yE + yT) / 2 + 4);
      // P 표시 막대
      ctx.textAlign = 'left'; ctx.font = '600 13px ' + T.fontBody;
      var tag = c.low ? '저스핀 (Δo > P)' : c.high ? '고스핀 (Δo < P)' : '고스핀·저스핀 구별 없음';
      ctx.fillStyle = c.low ? T.figBlue : c.high ? T.figRed : T.figMuted; ctx.fillText(tag, ex.x + 12, ex.y + 18);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('d' + sup(st.d) + ' · 팔면체', ex.x + ex.w - 8, ex.y + 18);
      // 스펙트럼
      var lam = 1.196e5 / st.D;
      var L = sp.x + 16, R = sp.x + sp.w - 16, sy = sp.y + (narrow ? 26 : sp.h * 0.22), sh = 26;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('흡수하는 빛 (가시광선 380~750 nm)', L, sy - 10);
      var lx = function (l) { return L + (l - 380) / 370 * (R - L); };
      for (var l = 380; l < 750; l += 2) { ctx.fillStyle = wl2rgb(l); ctx.fillRect(lx(l), sy, lx(l + 2) - lx(l) + 0.5, sh); }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, sy, R - L, sh);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [400, 500, 600, 700].forEach(function (v) { ctx.fillText(v, lx(v), sy + sh + 13); });
      var noDD = st.d === 0 || st.d === 10, spinF = st.d === 5 && !c.low;
      var vis = lam >= 380 && lam <= 750;
      var msg, col = null;
      if (noDD) msg = 'd–d 전이 없음 → 무색';
      else if (!vis) msg = (lam < 380 ? '자외선' : '적외선') + ' 흡수 (λ ≈ ' + Math.round(lam) + ' nm) → 가시광선 대부분 통과';
      else {
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(lx(lam), sy - 4); ctx.lineTo(lx(lam), sy + sh + 4); ctx.stroke();
        var s2 = seen(lam); msg = 'λ ≈ ' + Math.round(lam) + ' nm 흡수 → ' + (s2 ? s2[0] : '') + '으로 보임'; col = s2 && s2[1];
        if (spinF) msg += ' (스핀 금지: 아주 옅음)';
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(msg, L, sy + sh + 32);
      // 색 견본
      var swy = sy + sh + 44, sw = Math.min(90, (R - L) * 0.4);
      if (swy + 40 < sp.y + sp.h) {
        ctx.fillStyle = T.figMuted; ctx.fillText('보이는 색(어림):', L, swy + 24);
        ctx.globalAlpha = col ? (spinF ? 0.18 : 0.9) : 1;
        ctx.fillStyle = col || T.figPanel; ctx.fillRect(L + 110, swy + 4, sw, 30); ctx.globalAlpha = 1;
        ctx.strokeStyle = T.figLine; ctx.strokeRect(L + 110, swy + 4, sw, 30);
        if (!col) { ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('무색에 가까움', L + 110 + sw / 2, swy + 24); }
      }
      // 읽기
      rS.set('t2g' + sup(c.nt) + ' eg' + sup(c.ne));
      rN.set(c.unp + '개 / ' + Math.sqrt(c.unp * (c.unp + 2)).toFixed(2) + ' μB' + (c.unp ? ' (상자기성)' : ' (반자기성)'));
      var cf = Math.round(c.cfse * 10) / 10;
      rE.set((cf === 0 ? '0' : (cf < 0 ? '−' : '+') + Math.abs(cf).toFixed(1) + 'Δo') + ' = ' + Math.round(cf * st.D) + ' kJ/mol');
      rL.set(noDD ? '무색' : vis ? Math.round(lam) + ' nm → ' + (seen(lam) ? seen(lam)[0] : '') : (lam < 380 ? '자외선' : '적외선') + ' 영역');
    }
    api.onResize(draw);
    draw();
  },
});
