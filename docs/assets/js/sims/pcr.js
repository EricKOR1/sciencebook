/* 6-1 PCR: 분리–결합–합성 한 사이클 모식도 + 사이클 반복에 따른 목표 DNA 수와 실시간 PCR 형광 곡선(Ct) */
Sims.register('pcr', {
  title: 'PCR — 한 사이클마다 목표 DNA가 2배로',
  caption: '단계 버튼으로 분리→결합→합성 한 사이클을 따라가 보고(모식도는 첫 사이클의 모습), 사이클 슬라이더를 움직여 목표 DNA가 늘어나는 모습을 보자. 처음 핵산 양을 바꾸면 형광이 기준선을 넘는 사이클 수(Ct)가 달라진다: 많을수록 Ct가 작다. 실제 증폭은 매번 정확히 2배가 아니며, 재료가 줄어드는 후반에는 증가가 멈춘다(포화). 실선은 이를 단순하게 반영한 값이고 점선은 매번 2배라고 가정한 값이다. 수치는 설명을 위해 단순화했다.',
  init: function (api) {
    var NMAX = 1e11, NTH = 1e10, CMAX = 35, F0 = 0.03;
    var STAGES = [
      { name: '시작', title: '시작 — 목표 구간을 가진 DNA', desc: '검체에서 뽑은 핵산(RNA 바이러스는 DNA로 바꾼 것). 가운데 칸이 찾고 싶은 병원체의 염기 서열이다.', temp: null },
      { name: '① 분리', title: '① 분리(변성) — 약 95 °C', desc: '높은 온도에서 두 가닥 사이의 염기 짝이 떨어져 한 가닥씩 된다.', temp: 95 },
      { name: '② 결합', title: '② 결합 — 약 55~65 °C', desc: '온도를 낮추면 프라이머가 목표 구간 양 끝의 짝이 맞는 자리에 붙는다.', temp: 60 },
      { name: '③ 합성', title: '③ 합성(신장) — 약 72 °C', desc: 'DNA 중합 효소가 프라이머에서 시작해 짝이 맞는 염기를 이어 붙인다.', temp: 72 },
    ];
    var state = { stage: 0, p: 1, cycle: 30, n0exp: 2, log: true, ghosts: [] };

    var cv = api.canvas({
      aspect: function (w) { return w < 560 ? 714 / w : 0.66; },
      label: 'PCR 한 사이클의 DNA 모식도와, 사이클에 따른 목표 DNA 수 그래프, 실시간 PCR 형광 곡선',
    });
    var ctx = cv.ctx;

    var rN = api.readout('목표 DNA 수');
    var rIdeal = api.readout('매번 2배라면');
    var rCt = api.readout('Ct 값');
    var rJudge = api.readout('판정');

    var g = api.group();
    var stageBtns = [1, 2, 3].map(function (k) {
      return api.button(STAGES[k].name + ' ' + (k === 1 ? '95 °C' : k === 2 ? '약 60 °C' : '72 °C'), function () { goStage(k); }, { toggle: true, pressed: false, parent: g });
    });
    api.slider({ id: 'pcr-cycle', label: '사이클 반복', min: 0, max: CMAX, step: 1, value: state.cycle,
      format: function (v) { return v + '회'; },
      onInput: function (v) { state.cycle = v; update(); } });
    api.slider({ id: 'pcr-n0', label: '처음 바이러스 핵산 양(목표 DNA)', min: -1, max: 6, step: 1, value: state.n0exp,
      format: function (v) { return v < 0 ? '없음(0개)' : fmtCount(Math.pow(10, v)); },
      onInput: function (v) {
        if (v !== state.n0exp) {
          var prev = state.n0exp;
          state.ghosts = state.ghosts.filter(function (x) { return x !== prev && x !== v; });
          if (prev >= 0) state.ghosts.push(prev);
          if (state.ghosts.length > 3) state.ghosts.shift();
        }
        state.n0exp = v; update();
      } });
    var logBtn = api.button('로그 눈금', function () { state.log = !state.log; logBtn.setAttribute('aria-pressed', state.log ? 'true' : 'false'); draw(); }, { toggle: true, pressed: true });

    /* ── 증폭 계산: 처음엔 거의 2배, 재료가 줄면 증가가 멈춘다(단순 모형) ── */
    function series(n0) {
      var a = [n0];
      for (var k = 1; k <= CMAX; k++) { var n = a[k - 1]; a.push(n + n * Math.max(0, 1 - n / NMAX)); }
      return a;
    }
    function ctOf(a) {
      for (var k = 1; k < a.length; k++) {
        if (a[k] >= NTH && a[k - 1] > 0) {
          if (a[k - 1] >= NTH) return 0;
          return (k - 1) + (Math.log(NTH) - Math.log(a[k - 1])) / (Math.log(a[k]) - Math.log(a[k - 1]));
        }
      }
      return null;
    }
    function fluo(n, k) { return F0 + 0.004 * Math.sin(k * 1.9) + (1 - F0) * n / NMAX; }
    var FTH = F0 + (1 - F0) * NTH / NMAX;
    function n0() { return state.n0exp < 0 ? 0 : Math.pow(10, state.n0exp); }

    function fmtCount(n) {
      if (n === 0) return '0개';
      if (n < 1e4) return Math.round(n).toLocaleString('ko-KR') + '개';
      var u = n < 1e8 ? [1e4, '만'] : n < 1e12 ? [1e8, '억'] : n < 1e16 ? [1e12, '조'] : [1e16, '경'];
      var v = n / u[0], s = v >= 100 ? Math.round(v).toLocaleString('ko-KR') : v >= 10 ? v.toFixed(1) : v.toFixed(2);
      s = s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
      return (Math.abs(v - Math.round(v)) < 1e-9 ? '' : '약 ') + s + u[1] + ' 개';
    }

    function update() {
      var a = series(n0()), c = state.cycle, ct = ctOf(a);
      rN.set(fmtCount(a[c]));
      rIdeal.set(fmtCount(n0() * Math.pow(2, c)));
      rCt.set(ct === null ? '기준선 못 넘음' : '약 ' + ct.toFixed(1));
      if (ct !== null && ct <= c) rJudge.set('양성(기준선 넘음)');
      else if (c >= CMAX) rJudge.set('음성(35회까지 못 넘음)');
      else rJudge.set('아직 기준선 아래');
      draw();
    }

    /* ── 단계 애니메이션 ── */
    function goStage(k) {
      state.stage = k;
      stageBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i + 1 === k ? 'true' : 'false'); });
      if (api.reduced) { state.p = 1; draw(); return; }
      state.p = 0; loop.play();
    }
    var loop = api.loop(function (dt) {
      state.p += dt / 1.6;
      if (state.p >= 1) { state.p = 1; loop.pause(); }
      draw();
    });
    loop.pause();

    function ease(p) { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        return { dia: { x: 0, y: 0, w: w, h: 300 }, g1: { x: 0, y: 312, w: w, h: 195 }, g2: { x: 0, y: 517, w: w, h: 195 } };
      }
      var dw = Math.round(w * 0.47);
      return { dia: { x: 0, y: 0, w: dw, h: h }, g1: { x: dw + 14, y: 0, w: w - dw - 14, h: h / 2 - 4 }, g2: { x: dw + 14, y: h / 2 + 4, w: w - dw - 14, h: h / 2 - 4 } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawDiagram(T, P.dia);
      drawCount(T, P.g1);
      drawFluo(T, P.g2);
    }

    function wrap(text, maxW) {
      var words = text.split(' '), lines = [], cur = '';
      words.forEach(function (wd) {
        var t = cur ? cur + ' ' + wd : wd;
        if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
      });
      if (cur) lines.push(cur);
      return lines;
    }

    function drawDiagram(T, r) {
      var S = STAGES[state.stage], p = state.p;
      // 제목·설명
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontBody;
      ctx.fillText(S.title, r.x + 6, r.y + 18);
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      var lines = wrap(S.desc, r.w - 12), maxLines = 1;
      STAGES.forEach(function (st) { maxLines = Math.max(maxLines, wrap(st.desc, r.w - 12).length); });
      lines.forEach(function (ln, i) { ctx.fillText(ln, r.x + 6, r.y + 38 + i * 16); });
      var descEnd = r.y + 38 + (maxLines - 1) * 16 + 6, legendY = r.y + r.h - 50;

      // DNA 영역
      var x0 = r.x + 12, x1 = r.x + r.w - 12, L = x1 - x0;
      var tL = x0 + 0.3 * L, tR = x0 + 0.7 * L, pl = Math.max(22, 0.1 * L);
      var avail = legendY - 58 - (descEnd + 43), D = Math.max(22, Math.min(60, avail / 2));
      var cy = descEnd + 43 + D + Math.max(0, avail - 2 * D) / 2;
      var sep = state.stage === 0 ? 0 : state.stage === 1 ? ease(p) : 1;
      var yA = cy - 7 - sep * D, yB = cy + 7 + sep * D;
      var bind = state.stage < 2 ? 0 : state.stage === 2 ? ease(p) : 1;
      var ext = state.stage < 3 ? 0 : ease(p);
      var floatIn = state.stage === 0 ? 0 : state.stage === 1 ? ease((p - 0.5) * 2) : 1;

      // 목표 구간 띠
      ctx.fillStyle = T.figSoftViolet;
      ctx.fillRect(tL, cy - D - 22, tR - tL, 2 * D + 44);
      ctx.fillStyle = T.figViolet; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('목표 구간', (tL + tR) / 2, cy - D - 27);

      // 원래 두 가닥 + 염기 짝
      var step = 9;
      ctx.lineWidth = 1.4; ctx.strokeStyle = T.figLine;
      for (var x = x0 + 4; x < x1; x += step) {
        ctx.beginPath();
        if (sep < 0.02) { ctx.moveTo(x, yA); ctx.lineTo(x, yB); }
        else { ctx.moveTo(x, yA); ctx.lineTo(x, yA + 5); ctx.moveTo(x, yB); ctx.lineTo(x, yB - 5); }
        ctx.stroke();
      }
      strand(x0, x1, yA, T.figBlue, 4);
      strand(x0, x1, yB, T.figBlue, 4);

      // 새 가닥(합성)과 염기 짝
      var revEnd = tR - pl - ext * (tR - pl - x0);   // 위 가닥에 붙은 프라이머 → 왼쪽으로 합성
      var fwdEnd = tL + pl + ext * (x1 - tL - pl);   // 아래 가닥에 붙은 프라이머 → 오른쪽으로 합성
      if (ext > 0) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.4;
        for (var xx = x0 + 4; xx < x1; xx += step) {
          if (xx >= revEnd && xx <= tR) { ctx.beginPath(); ctx.moveTo(xx, yA + 5); ctx.lineTo(xx, yA + 14); ctx.stroke(); }
          if (xx >= tL && xx <= fwdEnd) { ctx.beginPath(); ctx.moveTo(xx, yB - 5); ctx.lineTo(xx, yB - 14); ctx.stroke(); }
        }
        strand(revEnd, tR - pl, yA + 14, T.figAmber, 4);
        strand(tL + pl, fwdEnd, yB - 14, T.figAmber, 4);
      } else if (bind >= 1) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.4;
        for (var x2 = x0 + 4; x2 < x1; x2 += step) {
          if (x2 >= tR - pl && x2 <= tR) { ctx.beginPath(); ctx.moveTo(x2, yA + 5); ctx.lineTo(x2, yA + 14); ctx.stroke(); }
          if (x2 >= tL && x2 <= tL + pl) { ctx.beginPath(); ctx.moveTo(x2, yB - 5); ctx.lineTo(x2, yB - 14); ctx.stroke(); }
        }
      }

      // 프라이머: 떠 있다가 → 짝이 맞는 자리로
      if (floatIn > 0) {
        ctx.globalAlpha = floatIn;
        var fRevX = tR - pl + 18, fRevY = cy - 10, fFwdX = tL - 18, fFwdY = cy + 10;
        var rx = fRevX + (tR - pl - fRevX) * bind, ry = fRevY + (yA + 14 - fRevY) * bind;
        var fx = fFwdX + (tL - fFwdX) * bind, fy = fFwdY + (yB - 14 - fFwdY) * bind;
        strand(rx, rx + pl, ry, T.figRed, 5);
        strand(fx, fx + pl, fy, T.figRed, 5);
        if (state.stage === 2 && p >= 1 || state.stage === 3) {
          // 합성 방향 화살표
          arrowHead(rx - 2, ry, -1, T.figRed); arrowHead(fx + pl + 2, fy, 1, T.figRed);
        }
        // 중합 효소: 떠 있다가 → 프라이머 끝에서 가닥을 따라 이동
        var go = state.stage === 3 ? Math.min(1, p * 4) : 0;
        var pRevX = (tR + x1) / 2 + 6, pFwdX = (x0 + tL) / 2 - 6, pY = cy;
        var eRevX = revEnd - 8, eFwdX = fwdEnd + 8;
        var aX = pRevX + (eRevX - pRevX) * ease(go), aY = pY + (yA + 9 - pY) * ease(go);
        var bX = pFwdX + (eFwdX - pFwdX) * ease(go), bY = pY + (yB - 9 - pY) * ease(go);
        if (!(state.stage === 3 && p >= 1)) { enzyme(aX, aY, T); enzyme(bX, bY, T); }
        ctx.globalAlpha = 1;
      }

      // 결과 문구
      ctx.textAlign = 'center'; ctx.font = '600 12px ' + T.fontBody;
      var by = cy + D + 40;
      if (state.stage === 3 && p >= 1) { ctx.fillStyle = T.figGreen; ctx.fillText('한 사이클 끝: 목표 구간 DNA 1개 → 2개', (x0 + x1) / 2, by); }
      else if (state.stage === 0) { ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.fillText('아래 단계 버튼 ①→②→③을 차례로 눌러 보자', (x0 + x1) / 2, by); }

      // 범례
      var ly = legendY;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var items = [[T.figBlue, '원래 가닥'], [T.figRed, '프라이머'], [T.figAmber, '새 가닥'], [T.figGreen, '중합 효소']];
      var lx = r.x + 8, gap = (r.w - 16) / 4;
      items.forEach(function (it, i) {
        var xx = lx + i * gap;
        if (i === 3) { ctx.fillStyle = T.figSoftGreen; ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(xx + 7, ly - 4, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        else { ctx.fillStyle = it[0]; ctx.fillRect(xx, ly - 6, 14, 4); }
        ctx.fillStyle = T.figMuted; ctx.fillText(it[1], xx + 18, ly);
      });

      // 온도 변화(한 사이클)
      drawTemp(T, { x: r.x + 8, y: r.y + r.h - 34, w: r.w - 16, h: 30 });
    }
    function strand(xa, xb, y, color, lw) {
      if (xb < xa) { var t = xa; xa = xb; xb = t; }
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke(); ctx.lineCap = 'butt';
    }
    function arrowHead(x, y, dir, color) {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(x + dir * 7, y); ctx.lineTo(x, y - 4.5); ctx.lineTo(x, y + 4.5); ctx.closePath(); ctx.fill();
    }
    function enzyme(x, y, T) {
      ctx.fillStyle = T.figSoftGreen; ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, 12, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    function drawTemp(T, r) {
      var temps = [95, 60, 72], names = ['분리', '결합', '합성'], sw = r.w / 3;
      var yOf = function (t) { return r.y + r.h - 4 - (t - 50) / 50 * (r.h - 10); };
      ctx.lineWidth = 1; ctx.strokeStyle = T.rule;
      ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke();
      for (var i = 0; i < 3; i++) {
        var on = state.stage === i + 1;
        var xa = r.x + i * sw + 3, xb = r.x + (i + 1) * sw - 3, y = yOf(temps[i]);
        ctx.strokeStyle = on ? T.figRed : T.figLine; ctx.lineWidth = on ? 4 : 2;
        ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke();
        ctx.fillStyle = on ? T.figInk : T.figMuted; ctx.font = (on ? '600 ' : '') + '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(names[i] + ' ' + (i === 1 ? '55~65' : temps[i]) + ' °C', (xa + xb) / 2, y - 5);
      }
    }

    /* ── 그래프 공통 ── */
    function frame(T, r, title) {
      var L = r.x + 50, R = r.x + r.w - 10, Tp = r.y + 24, B = r.y + r.h - 30;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(title, r.x + 4, r.y + 13);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var sx = function (c) { return L + c / CMAX * (R - L); };
      [0, 5, 10, 15, 20, 25, 30, 35].forEach(function (c) { ctx.fillText(c, sx(c), B + 13); });
      ctx.font = '11px ' + T.fontBody; ctx.fillText('사이클 수', (L + R) / 2, B + 26);
      // 현재 사이클 표시
      ctx.strokeStyle = T.figAccent; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sx(state.cycle), Tp); ctx.lineTo(sx(state.cycle), B); ctx.stroke(); ctx.setLineDash([]);
      return { L: L, R: R, Tp: Tp, B: B, sx: sx };
    }
    function hgrid(T, f, y, label) {
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.L, y); ctx.lineTo(f.R, y); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(label, f.L - 4, y + 4);
    }

    function drawCount(T, r) {
      var f = frame(T, r, '목표 DNA 수' + (state.log ? ' (로그 눈금: 한 칸 = 100배)' : ' (보통 눈금)'));
      var a = series(n0()), c = state.cycle, sy;
      if (state.log) {
        var YMAX = 12;
        sy = function (n) { return f.B - Math.log10(Math.max(n, 1)) / YMAX * (f.B - f.Tp); };
        [[0, '1'], [2, '100'], [4, '1만'], [6, '100만'], [8, '1억'], [10, '100억'], [12, '1조']].forEach(function (t) { hgrid(T, f, f.B - t[0] / YMAX * (f.B - f.Tp), t[1]); });
      } else {
        var YM = 1.2e11;
        sy = function (n) { return f.B - n / YM * (f.B - f.Tp); };
        [[0, '0'], [3e10, '300억'], [6e10, '600억'], [9e10, '900억'], [1.2e11, '1200억']].forEach(function (t) { hgrid(T, f, sy(t[0]), t[1]); });
      }
      if (n0() === 0) {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('목표 DNA가 없으면 증폭되지 않는다', (f.L + f.R) / 2, (f.Tp + f.B) / 2);
        return;
      }
      ctx.save(); ctx.beginPath(); ctx.rect(f.L, f.Tp - 2, f.R - f.L + 2, f.B - f.Tp + 4); ctx.clip();
      // 매번 2배라면(점선)
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath();
      for (var k = 0; k <= c; k++) { var yi = sy(n0() * Math.pow(2, k)); if (k === 0) ctx.moveTo(f.sx(k), yi); else ctx.lineTo(f.sx(k), yi); }
      ctx.stroke(); ctx.setLineDash([]);
      // 실제(포화 반영)
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var j = 0; j <= c; j++) { if (j === 0) ctx.moveTo(f.sx(j), sy(a[j])); else ctx.lineTo(f.sx(j), sy(a[j])); }
      ctx.stroke();
      ctx.fillStyle = T.figAccent;
      for (var m = 0; m <= c; m++) { ctx.beginPath(); ctx.arc(f.sx(m), sy(a[m]), 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      // 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = f.L + 8, ly = f.Tp + 10;
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx + 16, ly - 4); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.fillText('실제(후반 포화)', lx + 20, ly);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(lx, ly + 11); ctx.lineTo(lx + 16, ly + 11); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.fillText('매번 2배라면', lx + 20, ly + 15);
    }

    function drawFluo(T, r) {
      var f = frame(T, r, '실시간 PCR 형광 신호');
      var sy = function (v) { return f.B - v / 1.05 * (f.B - f.Tp); };
      [[0, '0'], [0.5, '중간'], [1, '최대']].forEach(function (t) { hgrid(T, f, sy(t[0]), t[1]); });
      // 기준선
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(f.L, sy(FTH)); ctx.lineTo(f.R, sy(FTH)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('기준선', f.R, sy(FTH) - 5);
      var c = state.cycle;
      function curve(exp, color, lw) {
        var a = series(exp < 0 ? 0 : Math.pow(10, exp));
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (var k = 0; k <= c; k++) { var y = sy(fluo(a[k], k)); if (k === 0) ctx.moveTo(f.sx(k), y); else ctx.lineTo(f.sx(k), y); }
        ctx.stroke();
        return ctOf(a);
      }
      // 이전 값(흐린 곡선)과 그 Ct
      var marks = [];
      state.ghosts.forEach(function (gx) {
        var ct = curve(gx, T.figLine, 1.4);
        if (ct !== null && ct <= c) marks.push({ ct: ct, exp: gx, cur: false });
      });
      var ctNow = curve(state.n0exp, T.figGreen, 2.6);
      if (ctNow !== null && ctNow <= c) marks.push({ ct: ctNow, exp: state.n0exp, cur: true });
      marks.sort(function (m1, m2) { return m1.ct - m2.ct; });
      marks.forEach(function (m, i) {
        var x = f.sx(m.ct), y = sy(FTH);
        ctx.fillStyle = m.cur ? T.figGreen : T.figMuted;
        ctx.beginPath(); ctx.arc(x, y, m.cur ? 4.5 : 3, 0, Math.PI * 2); ctx.fill();
        ctx.font = (m.cur ? '600 ' : '') + '11px ' + T.fontBody; ctx.textAlign = 'right';
        var ty = (marks.length - 1 - i) % 2 === 0 ? y - 6 : y - 19;
        ctx.fillText((m.cur ? 'Ct ' : '') + m.ct.toFixed(1), x - 4, ty);
      });
      if (state.ghosts.length) {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('회색: 앞서 고른 핵산 양', f.L + 6, f.Tp + 8);
      }
    }

    api.onResize(draw);
    update();
  },
});
