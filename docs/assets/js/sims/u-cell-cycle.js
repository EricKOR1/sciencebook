/* 일반생명과학 4 세포 주기 조절: 사이클린–Cdk 활성이 문턱을 넘어야 다음 시기로 — 성장 인자, DNA 손상, 검문 지점 고장 */
Sims.register('u-cell-cycle', {
  title: '세포 주기 조절 — 사이클린–Cdk 활성과 검문 지점',
  caption: '그래프는 G₁/S 사이클린–Cdk(파랑)와 M 사이클린–Cdk(MPF, 빨강)의 활성을 시간에 따라 그린 것이다. 활성이 문턱(점선)을 넘고 검문 지점이 허락해야 다음 시기로 넘어간다. 성장 인자를 끄면 G₁/S 사이클린이 만들어지지 않아 세포가 G₀기에 머물고, DNA 손상을 켜면 p53–p21이 Cdk를 억눌러 주기가 멈춘다. 이때 검문 지점 고장(Rb·p53 상실)을 켜면 성장 인자가 없어도, DNA가 손상되어도 분열을 계속한다 — 암세포의 특징이다. 시기 길이(G₁ 약 10시간, S 8시간, G₂ 약 4시간, M 1시간)와 활성 곡선은 모식적이며, 딸세포도 모두 같은 주기를 거친다고 단순화했다.',
  init: function (api) {
    var SPEED = 6, WIN = 96;             // 화면 1초 = 6시간, 그래프 창 96시간
    var s, hist;
    var cfg = { gf: true, dmg: false, broken: false };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.56; }, label: '사이클린–Cdk 활성의 시간 변화와 세포 수' });
    var ctx = cv.ctx;

    var rPh = api.readout('현재 시기');
    var rT = api.readout('지난 시간');
    var rDiv = api.readout('분열 횟수');
    var rN = api.readout('세포 수');

    var g = api.group();
    var bGF = api.button('성장 인자', function () { cfg.gf = !cfg.gf; sync(); }, { toggle: true, pressed: true, parent: g });
    var bDmg = api.button('DNA 손상', function () { cfg.dmg = !cfg.dmg; sync(); }, { toggle: true, pressed: false, parent: g });
    var bBrk = api.button('검문 지점 고장(Rb·p53 상실)', function () { cfg.broken = !cfg.broken; sync(); }, { toggle: true, pressed: false, parent: g });
    var g2 = api.group();
    if (api.reduced) api.button('12시간 진행', function () { advance(12); draw(); }, { primary: true, parent: g2 });
    api.button('처음부터', function () { reset(); }, { parent: g2 });

    function sync() {
      bGF.setAttribute('aria-pressed', cfg.gf ? 'true' : 'false');
      bDmg.setAttribute('aria-pressed', cfg.dmg ? 'true' : 'false');
      bBrk.setAttribute('aria-pressed', cfg.broken ? 'true' : 'false');
      draw();
    }
    function reset() {
      s = { t: 0, ph: 'G1', tp: 0, E: 0, B: 0, div: 0, badDiv: 0 };
      hist = [{ t: 0, e: 0, b: 0, ph: 'G1' }];
      draw();
    }
    function act() {
      var block = cfg.dmg && !cfg.broken;              // p53 → p21 이 Cdk 를 억누름
      return { e: block ? s.E * 0.45 : s.E, b: block ? s.B * 0.45 : s.B };
    }
    function step(dt) {
      var drive = cfg.gf || cfg.broken;                // Rb 를 잃으면 성장 인자 없이도 E2F 가 풀림
      s.t += dt; s.tp += dt;
      if (s.ph === 'G1') {
        if (drive) s.E = Math.min(1.25, s.E + 0.1 * dt); else s.E = Math.max(0, s.E - 0.25 * s.E * dt);
        s.B = s.B * Math.exp(-4 * dt);
        if (act().e >= 1) go('S');
      } else if (s.ph === 'S') {
        s.E = s.E * Math.exp(-0.5 * dt);
        s.B = Math.min(1.25, s.B + dt / 12);
        if (s.tp >= 8) go('G2');
      } else if (s.ph === 'G2') {
        s.E = s.E * Math.exp(-0.5 * dt);
        s.B = Math.min(1.25, s.B + dt / 12);
        if (act().b >= 1) go('M');
      } else if (s.ph === 'M') {
        s.E = s.E * Math.exp(-0.5 * dt);
        if (s.tp > 0.5) s.B = s.B * Math.exp(-6 * dt);   // APC/C 가 사이클린 B 를 분해
        if (s.tp >= 1) { s.div++; if (cfg.dmg) s.badDiv++; s.E = 0; go('G1'); }
      }
    }
    function go(ph) { s.ph = ph; s.tp = 0; }
    function shownPhase() {
      if (s.ph === 'G1' && !(cfg.gf || cfg.broken) && s.tp > 6) return 'G0';
      return s.ph;
    }
    function advance(hours) {
      var n = Math.round(hours / 0.02);
      for (var i = 0; i < n; i++) {
        step(0.02);
        var last = hist[hist.length - 1];
        if (s.t - last.t >= 0.1 - 1e-9) { var a = act(); hist.push({ t: s.t, e: a.e, b: a.b, ph: shownPhase() }); }
      }
      while (hist.length && hist[0].t < s.t - WIN - 1) hist.shift();
    }

    var loop = api.loop(function (dt) { advance(dt * SPEED); draw(); });

    var PH = {
      G1: { name: 'G₁기', c: 'figSoftBlue', k: 'figBlue' }, S: { name: 'S기', c: 'figSoftGreen', k: 'figGreen' },
      G2: { name: 'G₂기', c: 'figSoftAmber', k: 'figAmber' }, M: { name: 'M기', c: 'figSoftRed', k: 'figRed' },
      G0: { name: 'G₀기', c: 'figPaper', k: 'figMuted' },
    };
    function status() {
      var ph = shownPhase(), a = act();
      if (ph === 'G0') return '성장 인자가 없어 G₁/S 사이클린이 만들어지지 않음 → G₀기에 머묾';
      if (cfg.dmg && !cfg.broken && s.ph === 'G1' && s.E >= 1) return 'G₁ 검문 지점에서 정지: DNA 손상 → p53 → p21이 Cdk 억제(수선을 기다림)';
      if (cfg.dmg && !cfg.broken && s.ph === 'G2' && s.B >= 1) return 'G₂ 검문 지점에서 정지: 손상된 DNA로는 M기로 넘어가지 않음';
      if (cfg.broken && cfg.dmg) return '검문 지점 고장: 손상된 DNA를 가진 채 분열 — 돌연변이가 쌓인다';
      if (cfg.broken && !cfg.gf) return '검문 지점 고장: 성장 인자 없이도 분열을 계속한다';
      if (s.ph === 'M') return 'M기: 염색체가 모두 붙으면 APC/C가 사이클린을 분해 → 분열 완료';
      if (s.ph === 'S') return 'S기: DNA 복제(8시간), M 사이클린이 쌓이기 시작';
      if (s.ph === 'G2') return 'G₂기: MPF 활성이 문턱을 넘으면 M기로';
      return 'G₁기: 성장 인자 신호로 G₁/S 사이클린이 쌓임';
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var G = narrow ? { x: 0, y: 0, w: w, h: h * 0.6 } : { x: 0, y: 0, w: w * 0.64, h: h };
      var P = narrow ? { x: 0, y: h * 0.62, w: w, h: h * 0.38 } : { x: w * 0.67, y: 0, w: w * 0.33, h: h };
      drawGraph(T, G); drawCells(T, P);
      var ph = shownPhase();
      rPh.set(PH[ph].name); rT.set(s.t.toFixed(0) + '시간');
      rDiv.set(s.div + '번' + (s.badDiv ? ' (손상 지닌 채 ' + s.badDiv + '번)' : ''));
      rN.set(s.div > 40 ? '2^' + s.div : fmtN(Math.pow(2, s.div)) + '개');
    }
    function fmtN(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + '백만' : n.toLocaleString('ko-KR'); }
    function drawGraph(T, r) {
      var narrow = cv.w < 560;
      var L = r.x + 40, R = r.x + r.w - 20, top = r.y + 26, bandH = 20, B = r.y + r.h - 46;
      var t1 = Math.max(WIN, s.t), t0 = t1 - WIN;
      var sx = function (t) { return L + (t - t0) / WIN * (R - L); };
      var sy = function (v) { return B - v / 1.3 * (B - top); };
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      legend(L, r.y + 12, T.figBlue, 'G₁/S 사이클린–Cdk');
      legend(L + (narrow ? 132 : 150), r.y + 12, T.figRed, 'M 사이클린–Cdk(MPF)');
      // 축
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, top, R - L, B - top);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, sy(1)); ctx.lineTo(R, sy(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.textAlign = 'right'; ctx.fillText('문턱', L - 4, sy(1) + 4);
      ctx.fillStyle = T.figMuted; ctx.fillText('0', L - 4, B + 4);
      ctx.save(); ctx.translate(r.x + 10, (top + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('활성(상대값)', 0, 0); ctx.restore();
      // 곡선
      ['e', 'b'].forEach(function (key) {
        ctx.strokeStyle = key === 'e' ? T.figBlue : T.figRed; ctx.lineWidth = 2.4; ctx.beginPath();
        var first = true;
        hist.forEach(function (p) { if (p.t < t0) return; var X = sx(p.t), Y = sy(p[key]); if (first) { ctx.moveTo(X, Y); first = false; } else ctx.lineTo(X, Y); });
        ctx.stroke();
      });
      // 시기 띠
      var by = B + 6;
      for (var i = 1; i < hist.length; i++) {
        var p = hist[i], q = hist[i - 1]; if (p.t < t0) continue;
        ctx.fillStyle = T[PH[p.ph].c]; ctx.fillRect(sx(Math.max(q.t, t0)), by, sx(p.t) - sx(Math.max(q.t, t0)) + 0.6, bandH);
      }
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, by, R - L, bandH);
      // 시기 이름(띠 위)
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      var segS = 0;
      for (i = 1; i <= hist.length; i++) {
        if (i === hist.length || hist[i].ph !== hist[segS].ph) {
          var xa = sx(Math.max(hist[segS].t, t0)), xb = sx(hist[i - 1].t), k = PH[hist[segS].ph];
          if (xb - xa > 26) { ctx.fillStyle = T[k.k]; ctx.fillText(k.name, (xa + xb) / 2, by + 14); }
          segS = i;
        }
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      for (var t = Math.ceil(t0 / 24) * 24; t <= t1; t += 24) ctx.fillText(t + ' h', sx(t), by + bandH + 14);
    }
    function legend(x, y, c, label) {
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 18, y - 4); ctx.stroke();
      ctx.fillStyle = api.tokens().figInk; ctx.fillText(label, x + 24, y);
    }
    function drawCells(T, r) {
      var ph = shownPhase();
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('세포 수 = 2^(분열 횟수)', r.x + r.w / 2, r.y + 16);
      var narrowP = r.w > 300, cols = narrowP ? 16 : 8, rowsN = 64 / cols;
      var n = Math.min(Math.pow(2, s.div), 64), cell = Math.min((r.w - 20) / cols, 26), rad = cell * 0.38;
      var gx = r.x + (r.w - cols * cell) / 2, gy = r.y + 28;
      for (var i = 0; i < n; i++) {
        var X = gx + (i % cols) * cell + cell / 2, Y = gy + Math.floor(i / cols) * cell + cell / 2;
        ctx.beginPath();
        if (ph === 'M') { ctx.ellipse(X, Y, rad * 1.15, rad * 0.8, 0, 0, Math.PI * 2); }
        else ctx.arc(X, Y, rad, 0, Math.PI * 2);
        ctx.fillStyle = T[PH[ph].c]; ctx.fill(); ctx.strokeStyle = cfg.broken && cfg.dmg ? T.figRed : T[PH[ph].k]; ctx.lineWidth = 1.5; ctx.stroke();
      }
      var yText = gy + rowsN * cell + 18;
      if (Math.pow(2, s.div) > 64) { ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.fillText('… 64개까지만 그림', r.x + r.w / 2, gy + rowsN * cell + 4); }
      // 상태 문장(줄바꿈)
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = (cfg.broken && (cfg.dmg || !cfg.gf)) ? T.figRed : T.figInk;
      wrap(status(), r.x + r.w / 2, Math.min(yText + 6, r.y + r.h - 34), r.w - 16, 16);
    }
    function wrap(text, cx, y, maxW, lh) {
      var words = text.split(' '), line = '', lines = [];
      words.forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; });
      if (line) lines.push(line);
      lines.forEach(function (l, i) { ctx.fillText(l, cx, y + i * lh); });
    }

    api.onResize(draw);
    reset();
    if (api.reduced) { advance(48); draw(); }
  },
});
