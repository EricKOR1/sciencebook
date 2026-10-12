/* 2-1 스펙트럼: 원소마다 고유한 선 스펙트럼, 방출선과 흡수선의 위치가 같음, 별빛 흡수 스펙트럼에서 원소 찾기 */
Sims.register('spectrum', {
  title: '원소의 지문 — 방출 스펙트럼, 흡수 스펙트럼, 그리고 별빛 분석',
  caption: '원소를 고르고 \'방출\'과 \'흡수\'를 바꿔 보자. 같은 원소라면 뜨거운 기체가 내는 밝은 선과, 차가운 기체가 연속 스펙트럼에서 빼 가는 검은 선의 위치(파장)가 똑같다. \'별빛 분석\'에서는 미지의 별빛 흡수 스펙트럼에 실험실 방출선을 겹쳐, 그 원소의 선이 모두 겹치는지 확인해 별의 성분을 찾는다. 선의 파장(nm)은 실제 값이고, 파장을 색으로 바꾼 것과 선의 밝기는 화면 표현을 위한 근사이며, 별빛은 수소·헬륨 선만 남겨 단순화했다.',
  init: function (api) {
    var LMIN = 380, LMAX = 700, ZMIN = 585, ZMAX = 593, TOL = 0.3;
    // 파장(nm)과 화면용 상대 밝기(근사)
    var EL = {
      H: { name: '수소', lines: [[410.2, 0.35], [434.0, 0.5], [486.1, 0.7], [656.3, 1]] },
      He: { name: '헬륨', lines: [[447.1, 0.5], [471.3, 0.3], [492.2, 0.3], [501.6, 0.45], [587.6, 1], [667.8, 0.5]] },
      Na: { name: '나트륨', lines: [[589.0, 1], [589.6, 0.85]] },
      Hg: { name: '수은', lines: [[404.7, 0.6], [435.8, 1], [546.1, 1], [577.0, 0.6], [579.1, 0.6]] },
    };
    var STAR = EL.H.lines.concat(EL.He.lines);   // 미지의 별: 수소 + 헬륨
    var state = { el: 'H', mode: 'em', fade: 1 };

    var cv = api.canvas({ aspect: function (w) { return Math.max(0.56, 385 / w); }, label: '가시광선 스펙트럼 띠와 원소의 선' });
    var ctx = cv.ctx;

    var rMode = api.readout('보는 것');
    var rEl = api.readout('원소');
    var rN = api.readout('가시광선 영역의 선');
    var rMatch = api.readout('별빛과 겹치는 선');

    var gEl = api.group();
    var elBtns = {};
    ['H', 'He', 'Na', 'Hg'].forEach(function (k) {
      elBtns[k] = api.button(EL[k].name, function () { state.el = k; sync(); }, { toggle: true, pressed: k === state.el, parent: gEl });
    });
    var gMode = api.group();
    var modeBtns = {
      em: api.button('방출 (뜨거운 기체)', function () { state.mode = 'em'; sync(); }, { toggle: true, pressed: true, parent: gMode }),
      ab: api.button('흡수 (차가운 기체)', function () { state.mode = 'ab'; sync(); }, { toggle: true, parent: gMode }),
      st: api.button('별빛 분석', function () { state.mode = 'st'; sync(); }, { toggle: true, parent: gMode }),
    };

    var loop = api.loop(function (dt) {
      state.fade = Math.min(1, state.fade + dt / 0.6);
      draw();
      if (state.fade >= 1) loop.pause();
    });
    loop.pause();

    function sync() {
      Object.keys(elBtns).forEach(function (k) { elBtns[k].setAttribute('aria-pressed', k === state.el ? 'true' : 'false'); });
      Object.keys(modeBtns).forEach(function (k) { modeBtns[k].setAttribute('aria-pressed', k === state.mode ? 'true' : 'false'); });
      readouts();
      if (api.reduced) { state.fade = 1; draw(); } else { state.fade = 0; draw(); loop.play(); }
    }
    function matches(l) { return STAR.some(function (s) { return Math.abs(s[0] - l) < TOL; }); }
    function readouts() {
      var e = EL[state.el];
      rMode.set(state.mode === 'em' ? '방출 스펙트럼' : state.mode === 'ab' ? '흡수 스펙트럼' : '미지의 별빛 + 실험실 방출선');
      rEl.set(e.name);
      rN.set(e.lines.length + '개');
      if (state.mode === 'st') {
        var m = e.lines.filter(function (l) { return matches(l[0]); }).length;
        rMatch.set(m + ' / ' + e.lines.length + (m === e.lines.length ? ' → 모두 겹침: 별에 있다' : m === 0 ? ' → 하나도 안 겹침' : ' → 일부만 겹침'));
      } else rMatch.set('별빛 분석에서 확인');
    }

    // 파장 → 화면색(근사). 380~440 보라, 490 청록, 510 초록, 580 노랑, 645 이상 빨강
    function wlRGB(l, a) {
      var r = 0, g = 0, b = 0;
      if (l < 440) { r = (440 - l) / 60; b = 1; }
      else if (l < 490) { g = (l - 440) / 50; b = 1; }
      else if (l < 510) { g = 1; b = (510 - l) / 20; }
      else if (l < 580) { r = (l - 510) / 70; g = 1; }
      else if (l < 645) { r = 1; g = (645 - l) / 65; }
      else { r = 1; }
      var f = l < 420 ? 0.35 + 0.65 * (l - 380) / 40 : l > 680 ? 0.35 + 0.65 * (720 - l) / 40 : 1;
      function c(v) { return Math.round(255 * Math.pow(v * f, 0.8)); }
      return 'rgba(' + c(r) + ',' + c(g) + ',' + c(b) + ',' + (a == null ? 1 : a) + ')';
    }
    function night(T) { return T.dark ? T.figPaper : T.figInk; }   // 두 테마 모두 어두운 바탕

    function layout() {
      var w = cv.w, narrow = w < 560, col = narrow ? 50 : 70;
      return { narrow: narrow, L: col + 6, R: w - 10, col: col,
        sch: { y: 0, h: 66 }, lab: [92, 106, 120], A: { y: 128, h: 46 }, B: { y: 196, h: 40 },
        axis: 236, zoomT: 290, Z: { y: 300, h: 56 }, zAxis: 356 };
    }
    function xOf(P, l) { return P.L + (l - LMIN) / (LMAX - LMIN) * (P.R - P.L); }

    function draw() {
      var T = api.tokens(), P = layout(), w = cv.w;
      ctx.clearRect(0, 0, w, cv.h);
      drawSchematic(T, P);
      var e = EL[state.el], a = state.fade;
      var topSpec, botSpec;
      if (state.mode === 'em') { topSpec = { kind: 'em', lines: e.lines, a: a }; botSpec = { kind: 'cont' }; }
      else if (state.mode === 'ab') { topSpec = { kind: 'ab', lines: e.lines, a: a }; botSpec = { kind: 'cont' }; }
      else { topSpec = { kind: 'ab', lines: STAR, a: 1 }; botSpec = { kind: 'em', lines: e.lines, a: a }; }

      // 띠 이름(왼쪽 칸)
      var topName = state.mode === 'st' ? ['미지의 별빛', '(흡수)'] : [e.name, state.mode === 'em' ? '(방출)' : '(흡수)'];
      var botName = state.mode === 'st' ? ['실험실', e.name + ' 방출'] : ['비교:', '연속(전구)'];
      bandName(T, P, P.A, topName, true); bandName(T, P, P.B, botName, false);

      band(T, P, P.A, topSpec, LMIN, LMAX, P.L, P.R);
      band(T, P, P.B, botSpec, LMIN, LMAX, P.L, P.R);

      // 선 위치 표시(위쪽 숫자) + 안내선
      labels(T, P, e.lines, a);
      e.lines.forEach(function (ln) {
        var x = xOf(P, ln[0]);
        ctx.save(); ctx.globalAlpha = a; ctx.lineWidth = 1;
        if (state.mode === 'st') {
          var ok = matches(ln[0]);
          ctx.strokeStyle = ok ? T.figGreen : T.figRed; ctx.setLineDash(ok ? [] : [3, 3]);
          ctx.beginPath(); ctx.moveTo(x, P.A.y - 6); ctx.lineTo(x, P.A.y); ctx.moveTo(x, P.A.y + P.A.h); ctx.lineTo(x, P.B.y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = ok ? T.figGreen : T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
          ctx.fillText(ok ? '○' : '×', x, P.A.y + P.A.h + 15);
        } else {
          ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(x, P.A.y - 6); ctx.lineTo(x, P.A.y); ctx.stroke();
        }
        ctx.restore();
      });

      // 파장 눈금
      axis(T, P.L, P.R, P.axis, LMIN, LMAX, [400, 450, 500, 550, 600, 650, 700], true);

      // 확대 창(585~593 nm): 나트륨 두 줄과 헬륨 587.6 nm 구별
      var zl = P.L, zr = P.R;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('노란 부분 확대 585~593 nm', 10, P.zoomT);
      if (state.mode === 'st') {
        var hz = P.Z.h / 2 - 2;
        band(T, P, { y: P.Z.y, h: hz }, topSpec, ZMIN, ZMAX, zl, zr);
        band(T, P, { y: P.Z.y + hz + 4, h: hz }, botSpec, ZMIN, ZMAX, zl, zr);
        bandName(T, P, { y: P.Z.y, h: hz }, ['별빛'], true);
        bandName(T, P, { y: P.Z.y + hz + 4, h: hz }, [e.name], false);
      } else {
        band(T, P, P.Z, topSpec, ZMIN, ZMAX, zl, zr);
        bandName(T, P, P.Z, ['확대'], true);
      }
      axis(T, zl, zr, P.zAxis, ZMIN, ZMAX, [586, 588, 590, 592], false);
      // 확대 창 안의 선 값
      var inZoom = e.lines.filter(function (l) { return l[0] > ZMIN && l[0] < ZMAX; });
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      if (!inZoom.length) { ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontBody; ctx.fillText('(이 구간에 ' + e.name + ' 선 없음)', zr, P.zoomT); }
    }

    function bandName(T, P, r, lines, top) {
      ctx.fillStyle = top ? T.figInk : T.figMuted; ctx.textAlign = 'right';
      ctx.font = (top ? '600 ' : '') + (P.narrow ? '11px ' : '12px ') + T.fontBody;
      var cy = r.y + r.h / 2 - (lines.length - 1) * 7 + 4;
      lines.forEach(function (s, i) { ctx.fillText(s, P.L - 6, cy + i * 14); });
    }
    // 스펙트럼 띠 하나 그리기
    function band(T, P, r, spec, lo, hi, x0, x1) {
      var W = x1 - x0;
      function X(l) { return x0 + (l - lo) / (hi - lo) * W; }
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, r.y, W, r.h); ctx.clip();
      if (spec.kind === 'em') {
        ctx.fillStyle = night(T); ctx.fillRect(x0, r.y, W, r.h);
      } else {
        for (var px = 0; px < W; px++) { ctx.fillStyle = wlRGB(lo + (px + 0.5) / W * (hi - lo)); ctx.fillRect(x0 + px, r.y, 1.5, r.h); }
      }
      if (spec.lines) {
        var lw = Math.max(2, Math.min(5, W / (hi - lo) * 0.05));   // 확대 창에서는 선이 조금 굵게
        spec.lines.forEach(function (ln) {
          var x = X(ln[0]); if (x < x0 - 4 || x > x1 + 4) return;
          if (spec.kind === 'em') {
            ctx.fillStyle = wlRGB(ln[0], 0.35 * ln[1] * spec.a); ctx.fillRect(x - lw * 1.5, r.y, lw * 3, r.h);
            ctx.fillStyle = wlRGB(ln[0], (0.45 + 0.55 * ln[1]) * spec.a); ctx.fillRect(x - lw / 2, r.y, lw, r.h);
          } else {
            ctx.globalAlpha = (0.55 + 0.45 * ln[1]) * spec.a;
            ctx.fillStyle = night(T); ctx.fillRect(x - lw / 2, r.y, lw, r.h);
            ctx.globalAlpha = 1;
          }
        });
      }
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, r.y + 0.5, W - 1, r.h - 1);
    }
    function axis(T, x0, x1, y, lo, hi, ticks, unit) {
      ctx.strokeStyle = T.figLine; ctx.fillStyle = T.figMuted; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      ticks.forEach(function (t) {
        var x = x0 + (t - lo) / (hi - lo) * (x1 - x0);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 5); ctx.stroke();
        ctx.fillText(t, x, y + 17);
      });
      if (unit) { ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody; ctx.fillText('파장 (nm)', (x0 + x1) / 2, y + 31); }
    }
    // 선의 파장 숫자: 겹치지 않게 여러 줄에 나눠 쓴다
    function labels(T, P, lines, a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var rowsEnd = [-1e9, -1e9, -1e9];
      var sorted = lines.slice().sort(function (p, q) { return p[0] - q[0]; });
      sorted.forEach(function (ln) {
        var x = xOf(P, ln[0]), txt = ln[0].toFixed(1), tw = ctx.measureText(txt).width + 4;
        var cx = Math.min(Math.max(x, P.L + tw / 2), P.R - tw / 2);
        var row = 2;
        for (var i = 2; i >= 0; i--) { if (cx - tw / 2 > rowsEnd[i]) { row = i; break; } }
        // 아래 줄(띠에 가까운 줄)부터 채운다
        rowsEnd[row] = cx + tw / 2;
        ctx.fillStyle = T.figInk; ctx.fillText(txt, cx, P.lab[row]);
      });
      ctx.restore();
    }

    // 맨 위: 빛이 지나가는 길(모식)
    function drawSchematic(T, P) {
      var w = cv.w, y = 22, items;
      if (state.mode === 'em') items = [['tube', '뜨거운 기체', '(방전관)'], ['spec', '분광기', ''], ['out', '밝은 선만', '보인다']];
      else if (state.mode === 'ab') items = [['bulb', '뜨거운 광원', '(전구)'], ['cloud', '차가운 기체', ''], ['spec', '분광기', '']];
      else items = [['star', '별의 표면', '(연속)'], ['cloud', '별의 대기', '(차가운 기체)'], ['spec', '망원경+분광기', '']];
      var n = items.length, step = (w - 40) / n;
      items.forEach(function (it, i) {
        var cx = 20 + step * (i + 0.5);
        if (i < n - 1) {
          ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(cx + 26, y); ctx.lineTo(cx + step - 30, y); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(cx + step - 26, y); ctx.lineTo(cx + step - 34, y - 4); ctx.lineTo(cx + step - 34, y + 4); ctx.closePath(); ctx.fill();
        }
        icon(T, it[0], cx, y);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(it[1], cx, y + 29);
        if (it[2]) { ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText(it[2], cx, y + 42); }
      });
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, P.sch.h + 9); ctx.lineTo(w, P.sch.h + 9); ctx.stroke();
    }
    function icon(T, kind, x, y) {
      ctx.lineWidth = 1.5;
      if (kind === 'tube') {
        ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet;
        rr(x - 22, y - 7, 44, 14, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figLine; ctx.fillRect(x - 26, y - 3, 4, 6); ctx.fillRect(x + 22, y - 3, 4, 6);
      } else if (kind === 'bulb') {
        ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber;
        ctx.beginPath(); ctx.arc(x, y - 2, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figLine; ctx.fillRect(x - 5, y + 9, 10, 6);
      } else if (kind === 'cloud') {
        ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue;
        ctx.beginPath(); ctx.ellipse(x, y, 22, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (kind === 'star') {
        ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.beginPath();
        for (var k = 0; k < 10; k++) { var ang = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? 6 : 14; ctx.lineTo(x + rad * Math.cos(ang), y + rad * Math.sin(ang)); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (kind === 'spec') {
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk;
        ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 13, y + 10); ctx.lineTo(x - 13, y + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (kind === 'out') {
        var e = EL[state.el];
        ctx.fillStyle = night(T); ctx.fillRect(x - 24, y - 9, 48, 18);
        e.lines.forEach(function (ln) { ctx.fillStyle = wlRGB(ln[0]); ctx.fillRect(x - 24 + (ln[0] - LMIN) / (LMAX - LMIN) * 48 - 1, y - 9, 2, 18); });
      }
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw);
    readouts(); draw();
  },
});
