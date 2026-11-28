/* 유기화학 9: 아레늄 이온 공명 탐색기 — 치환기와 공격 자리에 따른 공명 구조, 생성물 비, 부분 속도 인자 */
Sims.register('mj-arenium-explorer', {
  title: '아레늄 이온 공명 탐색기 — 치환기 Y와 공격 자리(오쏘·메타·파라)',
  caption: '치환기 Y와 공격 자리를 고르면 나이트로화(친전자체 NO₂⁺)의 아레늄 이온 공명 구조가 차례로 그려지고, 보라색 굽은 화살표가 다음 구조로 옮겨 가는 π 전자쌍(또는 Y의 전자쌍)을 보여 준다. ' +
    '⊕가 Y가 붙은 C1에 오는 구조는 Y에 따라 초록(3차 양이온, 옥텟 완성 구조로 안정화)이나 빨강(양전하를 띤 원자 옆, 불안정화)으로 칠했다. 오쏘·파라에서만 그런 구조가 생기고 메타에서는 생기지 않는다. ' +
    '아래 막대는 나이트로화의 생성물 비와 부분 속도 인자 f(로그 눈금, 점선 = 벤젠의 한 자리 = 1)이다. 값은 모두 대략값(톨루엔·클로로벤젠·나이트로벤젠은 본문 값)이며, 자료가 없는 치환기는 \'정성적\'으로 표시했다.',
  init: function (api) {
    // kind: alkyl / donor(O,N: 넷째 구조 큰 기여) / halo(넷째 구조 작은 기여) / acceptor / none
    var SUBS = [
      { n: 'H', lab: '', kind: 'none', k: 1, r: [40, 40, 20] },
      { n: 'CH₃', lab: 'CH₃', kind: 'alkyl', k: 25, r: [58.5, 4.4, 37.1] },
      { n: 'OCH₃', lab: 'OCH₃', iv: 'O⁺CH₃', kind: 'donor' },
      { n: 'NH₂', lab: 'NH₂', iv: 'N⁺H₂', kind: 'donor' },
      { n: 'NHCOCH₃', lab: 'NHCOCH₃', iv: 'N⁺HCOCH₃', kind: 'donor' },
      { n: 'Cl', lab: 'Cl', iv: 'Cl⁺', kind: 'halo', k: 0.033, r: [30, 1, 69] },
      { n: 'Br', lab: 'Br', iv: 'Br⁺', kind: 'halo', k: 0.030, r: [37, 1, 62] },
      { n: 'CHO', lab: 'CHO', kind: 'acc', r: [19, 72, 9] },
      { n: 'COCH₃', lab: 'COCH₃', kind: 'acc' },
      { n: 'CN', lab: 'CN', kind: 'acc', r: [17, 81, 2] },
      { n: 'NO₂', lab: 'N⁺O₂⁻', kind: 'acc', k: 6e-8, r: [6, 93, 1] },
      { n: 'CF₃', lab: 'CF₃', kind: 'acc', r: [6, 91, 3] },
      { n: 'N(CH₃)₃⁺', lab: 'N⁺(CH₃)₃', kind: 'acc' }
    ];
    var st = { y: 1, a: 2, step: 0, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.66; }, label: '아레늄 이온 공명 구조와 생성물 비, 부분 속도 인자 막대그래프' });
    var ctx = cv.ctx;
    var rDir = api.readout('지향'), rN = api.readout('공명 구조'), rK = api.readout('상대 속도(벤젠 = 1)');
    var sY = api.slider({ id: 'mj-arenium-explorer-y', label: '치환기 Y', min: 0, max: SUBS.length - 1, step: 1, value: st.y,
      format: function (v) { return SUBS[v].n; }, onInput: function (v) { st.y = v; restart(); } });
    var g = api.group();
    var names = { 2: '오쏘(C2)', 3: '메타(C3)', 4: '파라(C4)' };
    var bA = {};
    [2, 3, 4].forEach(function (a) {
      bA[a] = api.button(names[a], function () { st.a = a; [2, 3, 4].forEach(function (q) { bA[q].setAttribute('aria-pressed', String(q === a)); }); restart(); }, { toggle: true, pressed: a === st.a, parent: g });
    });
    var bNext = api.button('다음 화살표 ▶', function () { st.step = (st.step + 1) % (structs().length); st.t = 1; draw(); }, { primary: true });
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      st.t += dt / 1.6;
      if (st.t > 1.6) { st.t = 0; st.step = (st.step + 1) % structs().length; }
      draw();
    });
    function restart() { st.step = 0; st.t = api.reduced ? 1 : 0; draw(); }

    function mod6(x) { return ((x - 1) % 6 + 6) % 6 + 1; }
    // 공명 구조 목록: {plus: 고리 번호 또는 0(넷째 구조), dbl: [[p,q],..], next: 다음 구조로 가는 화살표}
    function structs() {
      var a = st.a, S = SUBS[st.y], out = [];
      var ch = function (i) { return mod6(a + i); };
      out.push({ plus: ch(1), dbl: [[ch(2), ch(3)], [ch(4), ch(5)]], arrow: { from: [ch(2), ch(3)], to: [ch(1), ch(2)] } });
      out.push({ plus: ch(3), dbl: [[ch(1), ch(2)], [ch(4), ch(5)]], arrow: { from: [ch(4), ch(5)], to: [ch(3), ch(4)] } });
      out.push({ plus: ch(5), dbl: [[ch(1), ch(2)], [ch(3), ch(4)]], arrow: null });
      if ((S.kind === 'donor' || S.kind === 'halo') && a !== 3) {
        var i1 = -1;
        out.forEach(function (s, k) { if (s.plus === 1) i1 = k; });
        var src = out[i1];
        out.push({ plus: 0, dbl: src.dbl, iv: true, arrow: null });
        // 넷째 구조로 가는 화살표: ⊕C1 구조에서 Y 전자쌍 → C1–Y. 넷째 구조를 그 구조 바로 뒤로 옮긴다.
        src.arrow2 = true;
        var iv = out.pop();
        out.splice(i1 + 1, 0, iv);
        // 원래 i1 의 π 화살표는 i1+2 로 가야 하므로, 순서가 바뀌면 그 화살표는 지운다(넷째 구조는 따로 화살표를 가진다)
        if (src.arrow) src.arrowSkip = true;
      }
      return out;
    }
    function judge(s) {
      var S = SUBS[st.y];
      if (s.iv) return S.kind === 'donor' ? { c: 'g', t: '옥텟 완성 · 큰 기여' } : { c: 'a', t: '할로늄형 · 기여 작음' };
      if (s.plus !== 1) return null;
      if (S.kind === 'alkyl') return { c: 'g', t: '3차 양이온 · 안정' };
      if (S.kind === 'donor' || S.kind === 'halo') return { c: 'g0', t: 'Y 전자쌍 이웃' };
      if (S.kind === 'acc') return { c: 'r', t: '양전하 이웃 · 불안정' };
      return null;
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = T.figPaper; ctx.fillRect(0, 0, w, h);
      var L = structs(), S = SUBS[st.y];
      var n = L.length;
      // 배치
      var panels = [], topH = narrow ? h * 0.5 : h * 0.56;
      var cols = narrow ? 2 : n, rows = narrow ? Math.ceil(n / 2) : 1;
      var pw = w / cols, ph = topH / rows;
      for (var k = 0; k < n; k++) panels.push({ x: (k % cols) * pw, y: Math.floor(k / cols) * ph, w: pw, h: ph });
      var R = Math.min(pw, ph) * 0.22; R = Math.max(15, Math.min(R, 36));
      L.forEach(function (s, k) { drawStruct(T, s, panels[k], R, k, S); });
      // ↔ 표시
      ctx.fillStyle = T.figInk; ctx.font = '18px ' + T.fontBody; ctx.textAlign = 'center';
      for (k = 0; k < n - 1; k++) {
        if (narrow && k % 2 === 1) continue;
        var p = panels[k]; ctx.fillText('↔', p.x + p.w, p.y + p.h * 0.48);
      }
      // 막대그래프
      var gy = topH + 8, gh = h - gy - 6;
      if (narrow) {
        bars(T, 6, gy, w - 12, gh * 0.48, S);
        logf(T, 6, gy + gh * 0.52, w - 12, gh * 0.48, S);
      } else {
        bars(T, 8, gy, w * 0.46, gh, S);
        logf(T, w * 0.52, gy, w * 0.46, gh, S);
      }
      // 읽음값
      var r = S.r;
      var dir = S.kind === 'acc' ? '메타 지향' : (S.kind === 'none' ? '—' : '오쏘·파라 지향');
      rDir.set(dir + (S.kind === 'halo' ? ' (비활성화)' : S.kind === 'acc' ? ' (비활성화)' : S.kind === 'none' ? '' : ' (활성화)'));
      rN.set(n + '개');
      rK.set(S.k ? (S.k >= 0.01 ? String(S.k) : S.k.toExponential(0).replace('e-', '×10⁻').replace(/(\d+)$/, function (m) { return sup(m); })) : '정성적');
    }
    function sup(s) { var m = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return s.split('').map(function (c) { return m[c]; }).join(''); }

    function V(cx, cy, R, k) { var an = (90 - 60 * (k - 1)) * Math.PI / 180; return [cx + R * Math.cos(an), cy - R * Math.sin(an)]; }
    function drawStruct(T, s, P, R, idx, S) {
      var cx = P.x + P.w / 2, cy = P.y + P.h * 0.5, j = judge(s);
      var cur = idx === st.step;
      // 테두리
      if (j && j.c !== 'g0') {
        ctx.strokeStyle = j.c === 'g' ? T.figGreen : j.c === 'r' ? T.figRed : T.figAmber;
        ctx.fillStyle = j.c === 'g' ? T.figSoftGreen : j.c === 'r' ? T.figSoftRed : T.figSoftAmber;
        ctx.lineWidth = 2; roundRect(P.x + 5, P.y + 4, P.w - 10, P.h - 8, 8); ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      }
      if (cur) { ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); roundRect(P.x + 2, P.y + 1, P.w - 4, P.h - 2, 9); ctx.stroke(); ctx.setLineDash([]); }
      ctx.lineWidth = 2; ctx.strokeStyle = T.figInk; ctx.lineCap = 'round';
      var dbl = {}; s.dbl.forEach(function (d) { dbl[Math.min(d[0], d[1]) + '-' + Math.max(d[0], d[1])] = 1; });
      for (var k = 1; k <= 6; k++) {
        var q = k % 6 + 1, A = V(cx, cy, R, k), B = V(cx, cy, R, q);
        line(A, B);
        var key = Math.min(k, q) + '-' + Math.max(k, q);
        if (dbl[key]) { var A2 = toward(A, [cx, cy], 0.2), B2 = toward(B, [cx, cy], 0.2); line(lerp(A2, B2, 0.15), lerp(A2, B2, 0.85)); }
      }
      var fs = Math.max(11, Math.round(R * 0.48));
      ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // Y
      var c1 = V(cx, cy, R, 1);
      if (S.lab) {
        var yl = [c1[0], c1[1] - R * 0.75];
        if (s.iv) { ctx.strokeStyle = T.figInk; line([c1[0] - 2.4, c1[1]], [c1[0] - 2.4, yl[1] + fs * 0.55]); line([c1[0] + 2.4, c1[1]], [c1[0] + 2.4, yl[1] + fs * 0.55]); }
        else line(c1, [c1[0], yl[1] + fs * 0.55]);
        ctx.fillStyle = (S.kind === 'acc') ? T.figRed : (S.kind === 'alkyl' ? T.figInk : T.figBlue);
        ctx.fillText(s.iv ? S.iv : S.lab, yl[0], yl[1]);
        if (s.arrow2 && !s.iv) arrowPath(T, [yl[0] - fs * 0.9, yl[1] + 2], [c1[0] - 4, (c1[1] + yl[1]) / 2 + 4], -0.9, cur);
      }
      // 공격 탄소 H, NO₂
      var ca = V(cx, cy, R, st.a), out = Math.atan2(ca[1] - cy, ca[0] - cx);
      [[-0.45, 'H'], [0.45, 'NO₂']].forEach(function (e) {
        var an = out + e[0], p2 = [ca[0] + Math.cos(an) * R * 0.62, ca[1] + Math.sin(an) * R * 0.62];
        ctx.strokeStyle = T.figInk; line(ca, p2);
        ctx.fillStyle = e[1] === 'H' ? T.figInk : T.figViolet;
        ctx.fillText(e[1], ca[0] + Math.cos(an) * R * (e[1] === 'H' ? 0.88 : 1.12), ca[1] + Math.sin(an) * R * 0.95);
      });
      // ⊕
      if (s.plus) { var pp = toward(V(cx, cy, R, s.plus), [cx, cy], 0.42); plus(T, pp, Math.max(6, R * 0.24)); }
      // 다음 구조로 가는 π 화살표(바깥쪽)
      if (s.arrow && !s.arrowSkip) {
        var m1 = lerp(V(cx, cy, R, s.arrow.from[0]), V(cx, cy, R, s.arrow.from[1]), 0.5), m2 = lerp(V(cx, cy, R, s.arrow.to[0]), V(cx, cy, R, s.arrow.to[1]), 0.5);
        m1 = toward(m1, [cx, cy], -0.18); m2 = toward(m2, [cx, cy], -0.18);
        arrowPath(T, m1, m2, null, cur, [cx, cy]);
      }
      // 이름표
      ctx.font = '11px ' + T.fontBody; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = j ? (j.c === 'g' || j.c === 'g0' ? T.figGreen : j.c === 'r' ? T.figRed : T.figAmber) : T.figMuted;
      ctx.fillText(s.iv ? (j ? j.t : '') : ('⊕ C' + s.plus + (j ? ' · ' + j.t : '')), cx, P.y + P.h - 8);
    }
    function arrowPath(T, a, b, bend, cur, center) {
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      var nx = dy / L, ny = -dx / L, k = 0.6 * L;
      if (center) { if (Math.hypot(mx + nx - center[0], my + ny - center[1]) < Math.hypot(mx - nx - center[0], my - ny - center[1])) { nx = -nx; ny = -ny; } }
      else if (bend) k = bend * L;
      var c = [mx + nx * k, my + ny * k];
      var tEnd = cur ? Math.min(1, Math.max(0.05, st.t)) : 1;
      if (!cur && !api.reduced) { ctx.globalAlpha = 0.55; }
      ctx.strokeStyle = T.figViolet; ctx.fillStyle = T.figViolet; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      var N = 24, last = a, prev = a;
      for (var i = 1; i <= N; i++) { var t = tEnd * i / N; var p = [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]; ctx.lineTo(p[0], p[1]); prev = last; last = p; }
      ctx.stroke();
      var ux = last[0] - prev[0], uy = last[1] - prev[1], ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
      ctx.beginPath(); ctx.moveTo(last[0] + ux * 3, last[1] + uy * 3); ctx.lineTo(last[0] - ux * 7 - uy * 3.6, last[1] - uy * 7 + ux * 3.6); ctx.lineTo(last[0] - ux * 7 + uy * 3.6, last[1] - uy * 7 - ux * 3.6); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.lineWidth = 2;
    }
    function bars(T, x, y, w, h, S) {
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = T.figInk;
      ctx.fillText('생성물 비(나이트로화, %)', x, y + 12);
      var top = y + 22, bot = y + h - 18, bw = w / 3;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; line([x, bot], [x + w, bot]);
      ['오쏘', '메타', '파라'].forEach(function (nm, k) {
        var cx = x + bw * (k + 0.5);
        ctx.fillStyle = (k + 2 === st.a) ? T.figViolet : T.figMuted; ctx.textAlign = 'center';
        ctx.fillText(nm, cx, bot + 14);
        if (S.r) {
          var v = S.r[k], hh = (bot - top - 14) * v / 100;
          ctx.fillStyle = (k + 2 === st.a) ? T.figSoftViolet : T.figSoftBlue; ctx.strokeStyle = (k + 2 === st.a) ? T.figViolet : T.figBlue;
          ctx.fillRect(cx - bw * 0.28, bot - hh, bw * 0.56, hh); ctx.strokeRect(cx - bw * 0.28, bot - hh, bw * 0.56, hh);
          ctx.fillStyle = T.figInk; ctx.fillText('약 ' + v + (S.n === 'H' ? '(통계)' : ''), cx, bot - hh - 4);
        }
      });
      if (!S.r) { ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('정성적: ' + (S.kind === 'acc' ? '메타 우세' : '오쏘·파라 우세'), x + w / 2, (top + bot) / 2); }
    }
    function logf(T, x, y, w, h, S) {
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.textBaseline = 'alphabetic';
      ctx.fillText('부분 속도 인자 f(로그 눈금)', x, y + 12);
      var top = y + 22, bot = y + h - 18, lx = x + 34, bw = (w - 34) / 3, lo = -9, hi = 3;
      function Y(lg) { return bot - (bot - top) * (lg - lo) / (hi - lo); }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var e = lo; e <= hi; e += 3) { line([lx - 3, Y(e)], [lx, Y(e)]); ctx.fillText('10' + (e < 0 ? '⁻' + sup(String(-e)) : sup(String(e))), lx - 5, Y(e) + 4); }
      line([lx, top], [lx, bot]);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figInk; line([lx, Y(0)], [x + w, Y(0)]); ctx.setLineDash([]);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.fillText('벤젠 = 1', lx + 4, Y(0) - 4);
      ['오쏘', '메타', '파라'].forEach(function (nm, k) {
        var cx = lx + bw * (k + 0.5);
        ctx.textAlign = 'center'; ctx.fillStyle = (k + 2 === st.a) ? T.figViolet : T.figMuted; ctx.fillText(nm, cx, bot + 14);
        if (S.k && S.r) {
          var f = (k === 2 ? 6 : 3) * S.k * S.r[k] / 100, lg = Math.max(lo, Math.log10(f));
          var y0 = Y(0), y1 = Y(lg);
          ctx.fillStyle = f >= 1 ? T.figSoftGreen : T.figSoftRed; ctx.strokeStyle = f >= 1 ? T.figGreen : T.figRed;
          ctx.fillRect(cx - bw * 0.26, Math.min(y0, y1), bw * 0.52, Math.abs(y1 - y0) || 1.5); ctx.strokeRect(cx - bw * 0.26, Math.min(y0, y1), bw * 0.52, Math.abs(y1 - y0) || 1.5);
          ctx.fillStyle = T.figInk; ctx.fillText(fmt(f), cx, f >= 1 ? y1 - 4 : y1 + 13);
        }
      });
      if (!(S.k && S.r)) { ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('정성적(상대 속도 자료 없음)', lx + (w - 34) / 2, top + 16); }
    }
    function fmt(f) { if (f >= 10) return f.toFixed(0); if (f >= 0.1) return f.toFixed(2); var e = Math.floor(Math.log10(f)); var m = f / Math.pow(10, e); return m.toFixed(1) + '×10⁻' + sup(String(-e)); }
    function line(a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    function toward(a, c, t) { return [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t]; }
    function plus(T, p, r) { ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); ctx.stroke(); line([p[0] - r * 0.55, p[1]], [p[0] + r * 0.55, p[1]]); line([p[0], p[1] - r * 0.55], [p[0], p[1] + r * 0.55]); ctx.lineWidth = 2; }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw); api.onTheme(draw);
    restart();
    if (!api.reduced) loop.play();
  }
});
