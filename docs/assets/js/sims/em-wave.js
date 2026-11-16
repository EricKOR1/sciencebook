/* 전자기와 양자 2 전자기파: 서로 수직으로 진동하는 E와 B, 진행 방향 = E × B, 파장에 따른 영역 이름, 편광판 (3D) */
Sims.register('em-wave', {
  title: '전자기파 — 서로 수직인 전기장과 자기장이 함께 나아간다',
  caption: '끌어서 돌려 보며 전기장(빨강)과 자기장(파랑)이 서로 수직으로, 그리고 둘 다 진행 방향에 수직으로 진동하는 것을 확인하자(전기장에서 자기장 쪽으로 오른손 네 손가락을 감아쥐면 엄지가 진행 방향). 파장을 바꾸면 전파·적외선·가시광선·자외선·X선으로 이름이 바뀌지만 모두 같은 빛의 속력으로 나아가는 같은 종류의 파동이다. ‘편광판’을 켜면 여러 방향으로 진동하던 빛 가운데 투과축(세로) 방향의 진동만 지나간다. 화면의 파장 길이는 길고 짧음만 나타낼 뿐 실제 비율이 아니며, 편광판 앞쪽에는 전기장만 그렸다. 영역의 경계는 대략적인 값이다.',
  init: function (api) {
    var C = 3.0e8;
    var st = { lg: -6.3, pol: false, t: 0, playing: !api.reduced };   // lg = log10(파장/m)
    var X0 = -3.6, X1 = 3.6, XP = -0.6, AMP = 1.3;

    var rL = api.readout('파장');
    var rF = api.readout('진동수 f = c/λ');
    var rN = api.readout('영역');

    function region(l) {
      if (l >= 1e-3) return '전파';
      if (l >= 700e-9) return '적외선';
      if (l >= 400e-9) return '가시광선(' + visName(l) + ')';
      if (l >= 10e-9) return '자외선';
      if (l >= 1e-11) return 'X선';
      return '감마선';
    }
    function visName(l) {
      var n = l * 1e9;
      return n < 450 ? '보라' : n < 490 ? '파랑' : n < 570 ? '초록' : n < 590 ? '노랑' : n < 620 ? '주황' : '빨강';
    }
    function visColor(n) {   // 파장(nm) → 대략의 실제 색
      var r = 0, g = 0, b = 0;
      if (n < 440) { r = (440 - n) / 40; b = 1; } else if (n < 490) { g = (n - 440) / 50; b = 1; }
      else if (n < 510) { g = 1; b = (510 - n) / 20; } else if (n < 580) { r = (n - 510) / 70; g = 1; }
      else if (n < 645) { r = 1; g = (645 - n) / 65; } else r = 1;
      return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
    }
    function fmtLen(l) {
      if (l >= 1) return (l >= 10 ? l.toFixed(0) : l.toFixed(1)) + ' m';
      if (l >= 1e-3) return (l * 1e3).toFixed(l >= 1e-2 ? 0 : 1) + ' mm';
      if (l >= 1e-6) return (l * 1e6).toFixed(l >= 1e-5 ? 0 : 1) + ' μm';
      if (l >= 1e-9) return (l * 1e9).toFixed(l >= 1e-8 ? 0 : 1) + ' nm';
      return (l * 1e12).toFixed(1) + ' pm';
    }
    function sci(n) {
      var e = Math.floor(Math.log10(n)), m = n / Math.pow(10, e);
      if (m >= 9.95) { m /= 10; e++; }
      var sup = String(e).split('').map(function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || '⁻'; }).join('');
      return m.toFixed(1) + ' × 10' + sup + ' Hz';
    }
    // 화면 파장: log 파장 −11.5 ~ 2 를 1.1 ~ 3.6 으로 (길고 짧음만)
    function lamS() { return 1.1 + (st.lg + 11.5) / 13.5 * 2.5; }
    function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

    var S = api.scene3d({
      yaw: 0.62, pitch: 0.3, dist: 16, scale: 0.12, label: '전기장과 자기장이 수직으로 진동하며 나아가는 전자기파',
      aspect: function (w) { return w < 560 ? 1.0 : 0.6; },
      draw: function (g, T) {
        var L = lamS(), k = 2 * Math.PI / L, ph = st.t * 2 * Math.PI * 0.45;
        g.arrow([X0 - 0.2, 0, 0], [X1 + 0.6, 0, 0], T.figInk, { width: 1.6 });
        g.text([X1 + 0.9, 0.35, 0], '진행 방향', { size: 12, bold: true });
        var n = 72, ePts = [], bPts = [];
        var start = st.pol ? XP : X0;
        if (st.pol) {
          // 편광판 앞: 여러 방향으로 진동하는 전기장(비편광)
          for (var i = 0; i <= 26; i++) {
            var x = X0 + (XP - X0) * i / 26, u = k * x - ph;
            var chunk = Math.floor((x - ph / k) / (L / 2)), al = hash(chunk) * Math.PI;
            var a = AMP * Math.sin(u);
            g.line([x, 0, 0], [x, a * Math.cos(al), a * Math.sin(al)], T.figRed, { width: 1.6, alpha: 0.8 });
          }
          // 편광판
          var hw = 1.9;
          g.poly([[XP, -hw, -hw], [XP, hw, -hw], [XP, hw, hw], [XP, -hw, hw]], T.figSoftTeal, { alpha: 0.55, stroke: T.figTeal, strokeWidth: 1.5 });
          for (var s = -3; s <= 3; s++) g.line([XP, -hw, s * 0.5], [XP, hw, s * 0.5], T.figTeal, { width: 1, alpha: 0.7 });
          g.text([XP, hw + 0.4, 0], '편광판 (투과축: 세로)', { color: T.figTeal, size: 12, bold: true });
        }
        var amp = st.pol ? AMP * 0.71 : AMP;
        for (var j = 0; j <= n; j++) {
          var xx = start + (X1 - start) * j / n, v = amp * Math.sin(k * xx - ph);
          ePts.push([xx, v, 0]); bPts.push([xx, 0, v]);
          if (j % 3 === 0) {
            g.line([xx, 0, 0], [xx, v, 0], T.figRed, { width: 1.3, alpha: 0.75 });
            g.line([xx, 0, 0], [xx, 0, v], T.figBlue, { width: 1.3, alpha: 0.75 });
          }
        }
        g.path(ePts, T.figRed, { width: 2.6 });
        g.path(bPts, T.figBlue, { width: 2.6 });
        // 기준 화살표: E(위), B(앞) — 오른손 규칙 E × B = 진행 방향
        var xe = X1 - 0.6, vE = amp * Math.sin(k * xe - ph);
        g.text([X1 - 0.3, amp + 0.45, 0], '전기장 E', { color: T.figRed, size: 13, bold: true });
        g.text([X1 - 0.3, -0.35, amp + 0.4], '자기장 B', { color: T.figBlue, size: 13, bold: true });
        void vE;
      },
      overlay: function (ctx, T, S2) {
        // 아래쪽 스펙트럼 띠(로그 눈금)
        var w = S2.w, h = S2.h, x0 = 12, x1 = w - 12, y = h - 30, bh = 12;
        var lo = -11.5, hi = 2, X = function (lg) { return x1 - (lg - lo) / (hi - lo) * (x1 - x0); };   // 왼쪽이 긴 파장
        var bands = [[-3, 2, '전파', T.figSoftAmber], [Math.log10(700e-9), -3, '적외선', T.figSoftRed], [Math.log10(10e-9), Math.log10(400e-9), '자외선', T.figSoftViolet], [-11, -8, 'X선', T.figSoftBlue], [lo, -11, '감마', T.figSoftTeal]];
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        bands.forEach(function (b) {
          var a = X(b[1]), c = X(b[0]);
          ctx.fillStyle = b[3]; ctx.fillRect(a, y, c - a, bh);
          ctx.fillStyle = T.figMuted; if (c - a > 26) ctx.fillText(b[2], (a + c) / 2, y + bh + 13);
        });
        var va = X(Math.log10(700e-9)), vb = X(Math.log10(400e-9));
        var gr = ctx.createLinearGradient(va, 0, vb, 0);
        [700, 620, 580, 530, 480, 440, 400].forEach(function (nm) { gr.addColorStop((700 - nm) / 300, visColor(nm)); });
        ctx.fillStyle = gr; ctx.fillRect(va, y, Math.max(2, vb - va), bh);
        ctx.fillStyle = T.figMuted; ctx.fillText('가시광선', (va + vb) / 2, y - 4);
        var mx = X(st.lg);
        ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.moveTo(mx, y - 1); ctx.lineTo(mx - 6, y - 10); ctx.lineTo(mx + 6, y - 10); ctx.closePath(); ctx.fill();
        ctx.textAlign = 'left'; ctx.fillText('← 파장이 길다', x0, y - 14); ctx.textAlign = 'right'; ctx.fillText('파장이 짧다 →', x1, y - 14);
      },
    });

    function readouts() {
      var l = Math.pow(10, st.lg);
      rL.set(fmtLen(l)); rF.set(sci(C / l)); rN.set(region(l));
    }
    S.onFrame(function (dt) { if (st.playing && dt > 0) st.t += dt; });
    if (!st.playing) { S.loop.pause(); st.t = 0.35; }

    api.slider({ id: 'em-wave-lambda', label: '파장 (로그 눈금)', min: -11.5, max: 2, step: 0.05, value: st.lg,
      format: function (v) { return fmtLen(Math.pow(10, v)); }, onInput: function (v) { st.lg = v; readouts(); S.redraw(); } });
    var g1 = api.group();
    var bPol = api.button('편광판', function () {
      st.pol = !st.pol; bPol.setAttribute('aria-pressed', st.pol ? 'true' : 'false'); S.redraw();
    }, { toggle: true, parent: g1 });
    var bPlay = api.button(st.playing ? '멈춤' : '움직이기', function () {
      st.playing = !st.playing; bPlay.textContent = st.playing ? '멈춤' : '움직이기';
      if (st.playing) S.loop.play(); else { if (!S.auto) S.loop.pause(); S.redraw(); }
    }, { primary: true, parent: g1 });
    readouts();
    S.redraw();
  },
});
