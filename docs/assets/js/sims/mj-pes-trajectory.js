/* 물리화학 12 반응 동역학: 일직선 A + BC → AB + C의 LEPS 퍼텐셜 에너지 표면 위 고전 궤적 — 이른 장벽·늦은 장벽과 폴라니 규칙 */
Sims.register('mj-pes-trajectory', {
  title: '병진이냐 진동이냐 — 퍼텐셜 에너지 표면 위의 궤적과 폴라니 규칙',
  caption: '장벽 위치를 고르고 병진 에너지와 BC의 진동 양자수 v를 바꾼 뒤 "궤적 보기"를 눌러 보자. 왼쪽은 R_AB–R_BC 등고선 위를 움직이는 계의 점이고(오른쪽 아래 골짜기 = A + BC, 왼쪽 위 = AB + C, ‡ = 안장점), 오른쪽은 시간에 따른 두 거리이다. ' +
    '"반응 확률"은 BC 진동의 위상을 12가지로 바꾸어 돌린 궤적 가운데 반응한 몫이다. 이른 장벽(발열)에서는 v = 0에 작은 병진 에너지만으로도 반응하고 진동을 더해도 도움이 거의 없지만, ' +
    '늦은 장벽(흡열)에서는 v = 0이면 병진 에너지를 200 kJ/mol까지 올려도 되튀고 v = 2~3이면 작은 병진 에너지로도 반응한다. ' +
    '표면은 H₂와 같은 모스 곡선(De = 458 kJ/mol)으로 만든 LEPS 모형 식에서 AB의 결합 세기만 바꾸어 반응열을 정한 모식적 표면이고, 세 원자의 질량은 모두 1 u, 진동 에너지에는 영점 에너지를 넣었으며 궤적은 고전 역학으로 계산했다(터널링 없음).',
  init: function (api) {
    var BETA = 1.942, RE = 0.742, DBC = 458, KS = 0.135, MU = 0.5;
    var SURF = [
      { dH: -100, name: '이른 장벽 (ΔH = −100)', sd: [1.246, 0.792], Eb: 14.8 },
      { dH: -50, name: '조금 이른 (−50)', sd: [1.082, 0.836], Eb: 23.5 },
      { dH: 0, name: '대칭 (0)', sd: [0.931, 0.931], Eb: 40.5 },
      { dH: 50, name: '조금 늦은 (+50)', sd: [0.829, 1.102], Eb: 69.7 },
      { dH: 100, name: '늦은 장벽 (ΔH = +100)', sd: [0.779, 1.333], Eb: 109.3 },
    ];
    var st = { s: 0, Et: 20, v: 0, phase: 0 };
    var we = BETA * Math.sqrt(2 * DBC / MU);              // rad / (0.1 ps)
    var hb = 1.0546e-34 * 6.022e23 / 1000 / 1e-13;          // kJ/mol · 0.1 ps
    var hw = hb * we;
    function Ev(v) { return hw * (v + 0.5) - hw * hw / (4 * DBC) * (v + 0.5) * (v + 0.5); }

    function QJ(r, D) {
      var e1 = Math.exp(-BETA * (r - RE)), e2 = e1 * e1;
      return [D / 4 * ((3 + KS) * e2 - (2 + 6 * KS) * e1), D / 4 * ((1 + 3 * KS) * e2 - (6 + 2 * KS) * e1)];
    }
    function makeV(dH) {
      var DAB = DBC - dH, DAC = (DAB + DBC) / 2;
      return function (r1, r2) {
        var a = QJ(r1, DAB), b = QJ(r2, DBC), c = QJ(r1 + r2, DAC);
        var s = a[1] * a[1] + b[1] * b[1] + c[1] * c[1] - a[1] * b[1] - b[1] * c[1] - a[1] * c[1];
        return (a[0] + b[0] + c[0] - Math.sqrt(Math.max(s, 0))) / (1 + KS) + DBC;
      };
    }

    function run(V, Et, v, phase, keep) {
      var E = Ev(v), sq = Math.sqrt(E / DBC), rin = RE - Math.log(1 + sq) / BETA;
      var T = 2 * Math.PI / (we * (1 - 2 * hw / (4 * DBC) * (v + 0.5)));
      var vrel = Math.sqrt(2 * Et / (2 / 3)), R0 = 3.5 + vrel * phase * T;
      var x = [-R0, 0, rin], u = [vrel * 2 / 3, -vrel / 3, -vrel / 3], dt = 0.002, h = 1e-5;
      function force() {
        var r1 = x[1] - x[0], r2 = x[2] - x[1];
        var d1 = (V(r1 + h, r2) - V(r1 - h, r2)) / (2 * h), d2 = (V(r1, r2 + h) - V(r1, r2 - h)) / (2 * h);
        return [d1, -d1 + d2, -d2];
      }
      var f = force(), path = [], t = 0, near = false, r1 = R0, r2 = rin;
      for (var n = 0; n < 30000; n++) {
        for (var k = 0; k < 3; k++) { u[k] += 0.5 * dt * f[k]; x[k] += dt * u[k]; }
        f = force();
        for (k = 0; k < 3; k++) u[k] += 0.5 * dt * f[k];
        t += dt; r1 = x[1] - x[0]; r2 = x[2] - x[1];
        if (r1 < 2.5) near = true;
        if (keep && n % 4 === 0) path.push([t, r1, r2]);
        if (r2 > 4 || (near && r1 > 4) || r1 > R0 + 1) break;
      }
      if (keep) path.push([t, r1, r2]);
      var out = r2 > 3.5 && r1 < 2.5 ? 2 : (r1 > 3 && r2 < 2.5 ? 1 : 0);
      return { out: out, path: path };
    }

    var cv = api.canvas({ aspect: function (w) { return w < 640 ? 1.75 : 0.52; }, label: '퍼텐셜 에너지 표면 등고선 위의 궤적과 시간에 따른 두 원자 사이 거리' });
    var ctx = cv.ctx;
    var rB = api.readout('장벽'), rEn = api.readout('에너지(병진 + 진동)'), rO = api.readout('이 궤적'), rP = api.readout('반응 확률(위상 12개)');

    var gS = api.group();
    var sBtns = SURF.map(function (s, k) {
      return api.button(s.name, function () { st.s = k; sync(); recompute(); }, { toggle: true, pressed: k === st.s, parent: gS });
    });
    api.slider({ id: 'mj-pes-trajectory-et', label: '병진 에너지', min: 2, max: 200, step: 1, value: st.Et,
      format: function (v) { return v + ' kJ/mol'; }, onInput: function (v) { st.Et = v; recompute(); } });
    var gV = api.group();
    var vBtns = [0, 1, 2, 3].map(function (v) {
      return api.button('v = ' + v, function () { st.v = v; sync(); recompute(); }, { toggle: true, pressed: v === st.v, parent: gV });
    });
    var gP = api.group();
    api.button('궤적 보기', function () { play(); }, { primary: true, parent: gP });
    api.button('다른 위상으로', function () { st.phase = (st.phase + 5) % 12; recompute(); }, { parent: gP });
    function sync() {
      sBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === st.s ? 'true' : 'false'); });
      vBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === st.v ? 'true' : 'false'); });
    }

    var Vcur, grid = null, gridFor = -1, traj = null, idx = 0, prob = 0;
    var RMIN = 0.5, RMAX = 3.5, NG = 90;
    function buildGrid() {
      grid = [];
      for (var j = 0; j <= NG; j++) {
        var row = [];
        for (var i = 0; i <= NG; i++) row.push(Vcur(RMIN + (RMAX - RMIN) * i / NG, RMIN + (RMAX - RMIN) * j / NG));
        grid.push(row);
      }
      gridFor = st.s;
    }
    var timer = null;
    function recompute() {
      Vcur = makeV(SURF[st.s].dH);
      if (gridFor !== st.s) buildGrid();
      traj = run(Vcur, st.Et, st.v, st.phase / 12, true);
      var n = 0;
      for (var p = 0; p < 12; p++) if (run(Vcur, st.Et, st.v, p / 12, false).out === 2) n++;
      prob = n / 12;
      idx = traj.path.length - 1;
      anim.pause();
      draw();
    }
    var anim = api.loop(function (dt) {
      if (!traj) return;
      idx = Math.min(traj.path.length - 1, idx + Math.max(1, Math.round(dt * 160)));
      draw();
      if (idx >= traj.path.length - 1) anim.pause();
    });
    function play() {
      if (api.reduced) { idx = traj.path.length - 1; draw(); return; }
      idx = 0; anim.play();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stk = w < 640;
      ctx.clearRect(0, 0, w, h);
      var r1 = stk ? { x: 0, y: 0, w: w, h: h * 0.6 } : { x: 0, y: 0, w: w * 0.52, h: h };
      var r2 = stk ? { x: 0, y: h * 0.6, w: w, h: h * 0.4 } : { x: w * 0.52, y: 0, w: w * 0.48, h: h };
      // 등고선 지도(정사각형)
      var side = Math.min(r1.w - 70, r1.h - 60), L = r1.x + 56, Tp = r1.y + 22, R = L + side, B = Tp + side;
      var sx = function (x) { return L + (x - RMIN) / (RMAX - RMIN) * side; }, sy = function (y) { return B - (y - RMIN) / (RMAX - RMIN) * side; };
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, side, side);
      var levels = [[20, T.figTeal], [50, T.figTeal], [100, T.figGreen], [150, T.figGreen], [200, T.figAmber], [300, T.figAmber], [400, T.figRed], [SURF[st.s].Eb, T.figMuted]];
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, side, side); ctx.clip();
      levels.forEach(function (lv, li) {
        ctx.strokeStyle = lv[1]; ctx.lineWidth = li === levels.length - 1 ? 1.2 : 1; ctx.setLineDash(li === levels.length - 1 ? [3, 3] : []);
        ctx.beginPath();
        var cell = side / NG;
        for (var j = 0; j < NG; j++) for (var i = 0; i < NG; i++) {
          var c = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]], P = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], pts = [];
          for (var a = 0; a < 4; a++) {
            var b = (a + 1) % 4;
            if ((c[a] - lv[0]) * (c[b] - lv[0]) < 0) { var t = (lv[0] - c[a]) / (c[b] - c[a]); pts.push([P[a][0] + t * (P[b][0] - P[a][0]), P[a][1] + t * (P[b][1] - P[a][1])]); }
          }
          for (var q = 0; q + 1 < pts.length; q += 2) { ctx.moveTo(L + pts[q][0] * cell, B - pts[q][1] * cell); ctx.lineTo(L + pts[q + 1][0] * cell, B - pts[q + 1][1] * cell); }
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // 궤적
      if (traj) {
        ctx.beginPath();
        for (var k = 0; k <= idx; k++) { var p = traj.path[k]; if (k) ctx.lineTo(sx(p[1]), sy(p[2])); else ctx.moveTo(sx(p[1]), sy(p[2])); }
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6; ctx.stroke();
        var pc = traj.path[idx];
        ctx.beginPath(); ctx.arc(sx(Math.min(pc[1], RMAX)), sy(Math.min(pc[2], RMAX)), 5.5, 0, 7); ctx.fillStyle = T.figAccent; ctx.fill(); ctx.strokeStyle = T.figPaper; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
      var sd = SURF[st.s].sd;
      ctx.beginPath(); ctx.arc(sx(sd[0]), sy(sd[1]), 8, 0, 7); ctx.fillStyle = T.figPaper; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('‡', sx(sd[0]), sy(sd[1]) + 5);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, side, side);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [50, 100, 150, 200, 250, 300, 350].forEach(function (v) { ctx.textAlign = 'center'; ctx.fillText(String(v), sx(v / 100), B + 14); ctx.textAlign = 'right'; ctx.fillText(String(v), L - 5, sy(v / 100) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('R_AB (pm)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(L - 40, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('R_BC (pm)', 0, 0); ctx.restore();
      function lab(s, x, y, al) {
        ctx.font = '600 12px ' + T.fontBody; var tw = ctx.measureText(s).width, x0 = al === 'right' ? x - tw : x;
        ctx.fillStyle = T.figPanel; ctx.fillRect(x0 - 3, y - 12, tw + 6, 16); ctx.fillStyle = T.figBlue; ctx.textAlign = 'left'; ctx.fillText(s, x0, y);
      }
      lab('A + BC', R - 6, sy(1.35), 'right');
      lab('AB + C', sx(1.15), sy(3.25), 'left');
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText('점선: 안장점 높이, ‡: 안장점', R, Tp - 6);
      // 거리–시간
      var L2 = r2.x + 50, R2 = r2.x + r2.w - 10, T2 = r2.y + 26, B2 = r2.y + r2.h - 40;
      ctx.fillStyle = T.figPanel; ctx.fillRect(L2, T2, R2 - L2, B2 - T2); ctx.strokeStyle = T.figLine; ctx.strokeRect(L2, T2, R2 - L2, B2 - T2);
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.fillText('시간에 따른 원자 사이 거리', L2, r2.y + 15);
      if (traj) {
        var tE = traj.path[traj.path.length - 1][0], yM = 5;
        var tx = function (t) { return L2 + t / tE * (R2 - L2); }, ty = function (r) { return B2 - Math.min(r, yM) / yM * (B2 - T2); };
        ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
        [0, 100, 200, 300, 400, 500].forEach(function (v) { ctx.fillText(String(v), L2 - 5, ty(v / 100) + 4); });
        var step = tE * 100 > 400 ? 200 : tE * 100 > 150 ? 50 : 20;
        ctx.textAlign = 'center';
        for (var s = 0; s <= tE * 100; s += step) ctx.fillText(String(s), tx(s / 100), B2 + 14);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('t (fs)', (L2 + R2) / 2, B2 + 30);
        ctx.save(); ctx.translate(r2.x + 12, (T2 + B2) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('거리 (pm)', 0, 0); ctx.restore();
        [[1, T.figBlue, 'R_AB'], [2, T.figRed, 'R_BC']].forEach(function (c, ci) {
          ctx.beginPath();
          for (var k = 0; k <= idx; k++) { var p = traj.path[k]; if (k) ctx.lineTo(tx(p[0]), ty(p[c[0]])); else ctx.moveTo(tx(p[0]), ty(p[c[0]])); }
          ctx.strokeStyle = c[1]; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = c[1]; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText(c[2], R2 - 6 - ci * 50, T2 + 14);
        });
        if (idx >= traj.path.length - 1) {
          var msg = traj.out === 2 ? '반응 성공: AB + C' : traj.out === 1 ? '반응 실패: 되튐' : '해리 또는 기타';
          ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = traj.out === 2 ? T.figGreen : T.figRed; ctx.textAlign = 'left';
          ctx.fillText(msg, L2 + 6, T2 + 14);
        }
      }
      var S = SURF[st.s], ev = Ev(st.v);
      rB.set('ΔH = ' + String(S.dH).replace('-', '−') + ', E‡ = ' + S.Eb.toFixed(0) + ' kJ/mol');
      rEn.set(st.Et + ' + ' + ev.toFixed(0) + ' = ' + (st.Et + ev).toFixed(0) + ' kJ/mol');
      rO.set(!traj ? '–' : idx < traj.path.length - 1 ? '진행 중' : traj.out === 2 ? '반응' : traj.out === 1 ? '되튐' : '해리·기타');
      rP.set(Math.round(prob * 12) + '/12 = ' + Math.round(prob * 100) + ' %');
    }
    api.onResize(draw);
    api.onTheme(draw);
    recompute();
  },
});
