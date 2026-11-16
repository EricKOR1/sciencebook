/* 행성우주과학 1: 외계 행성 찾기 — 통과법(밝기 곡선)과 시선속도법(별의 흔들림) */
Sims.register('exoplanet-transit', {
  title: '별빛으로 외계 행성 찾기 — 통과법과 시선속도법',
  caption: '통과법에서는 행성 반지름을 키우면 밝기 감소의 깊이 (R행성/R별)²가, 궤도 반지름을 키우면 공전 주기가 길어져 감소가 되풀이되는 간격이 커진다. 시선속도법으로 바꾸면 행성이 무겁고 별에 가까울수록 별이 크게 흔들려 스펙트럼선의 청색·적색 이동이 커진다. 중심별은 태양과 같은 별(질량·반지름이 태양과 같음)이고, 궤도는 원이며 우리 시선이 궤도면과 나란하다고 가정했다. 별의 가장자리 어두워짐은 무시했고, 화면에서는 행성이 별 앞을 지나는 동안 시간을 느리게 흘려 보여 준다. 스펙트럼선의 이동량과 위에서 본 별의 흔들림은 크게 과장해 그렸다.',
  init: function (api) {
    var RSUN = 696000, REARTH = 6371, AU_RS = 215.03, WIN = 30;
    var st = { mode: 'transit', rp: 11.2, mp: 1.0, a: 0.05, t: 0, playing: !api.reduced };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.62; }, label: '별 앞을 지나는 행성과 밝기 곡선, 별의 시선 속도 곡선' });
    var ctx = cv.ctx;

    var rP = api.readout('공전 주기');
    var rD = api.readout('밝기 감소 깊이 (R행성/R별)²');
    var rDur = api.readout('한 번 통과하는 시간');
    var rK = api.readout('별이 흔들리는 속력');
    var rL = api.readout('Hα선(656.3 nm) 최대 이동');

    var gm = api.group();
    var bT = api.button('통과법', function () { setMode('transit'); }, { toggle: true, pressed: true, parent: gm });
    var bV = api.button('시선속도법', function () { setMode('rv'); }, { toggle: true, parent: gm });
    var sR = api.slider({ id: 'exoplanet-transit-rp', label: '행성 반지름', min: 1, max: 16, step: 0.1, value: st.rp,
      format: function (v) { return '지구의 ' + v.toFixed(1) + '배'; }, onInput: function (v) { st.rp = v; upd(); } });
    var sM = api.slider({ id: 'exoplanet-transit-mp', label: '행성 질량', min: 0.1, max: 10, step: 0.1, value: st.mp,
      format: function (v) { return '목성의 ' + v.toFixed(1) + '배'; }, onInput: function (v) { st.mp = v; upd(); } });
    api.slider({ id: 'exoplanet-transit-a', label: '궤도 반지름', min: 0.02, max: 0.2, step: 0.001, value: st.a,
      format: function (v) { return v.toFixed(3) + ' AU'; }, onInput: function (v) { st.a = v; upd(); } });
    var playBtn = api.button(st.playing ? '멈춤' : '움직이기', function () { st.playing = !st.playing; playBtn.textContent = st.playing ? '멈춤' : '움직이기'; if (st.playing) loop.play(); else loop.pause(); }, { primary: true });
    sM.input.parentNode.style.display = 'none';

    function setMode(m) {
      st.mode = m; bT.setAttribute('aria-pressed', m === 'transit' ? 'true' : 'false'); bV.setAttribute('aria-pressed', m === 'rv' ? 'true' : 'false');
      sR.input.parentNode.style.display = m === 'transit' ? '' : 'none';
      sM.input.parentNode.style.display = m === 'rv' ? '' : 'none';
      draw();
    }
    function P() { return 365.25 * Math.pow(st.a, 1.5); }               // 일
    function k() { return st.rp * REARTH / RSUN; }
    function aR() { return st.a * AU_RS; }                               // 별 반지름 단위
    function dur() { return P() / Math.PI * Math.asin(Math.min(1, (1 + k()) / aR())); }   // 일
    function Kms() { return 28.43 * st.mp / Math.sqrt(st.a); }           // m/s (원 궤도, 시선이 궤도면에 나란함)
    var T0 = 2.2;                                                        // 첫 통과 시각(일)
    function phase(t) { return 2 * Math.PI * (t - T0) / P() - Math.PI / 2; }   // -90°에서 관측자 쪽(통과)
    function overlap(d, r) {                                             // 반지름 1인 별과 반지름 r인 원의 겹친 넓이
      if (d >= 1 + r) return 0;
      if (d <= 1 - r) return Math.PI * r * r;
      var a1 = Math.acos((d * d + 1 - r * r) / (2 * d)), a2 = Math.acos((d * d + r * r - 1) / (2 * d * r));
      return a1 + r * r * a2 - 0.5 * Math.sqrt(Math.max(0, (-d + 1 + r) * (d + 1 - r) * (d - 1 + r) * (d + 1 + r)));
    }
    function flux(t) {
      var ph = phase(t), x = aR() * Math.cos(ph);
      if (Math.sin(ph) > 0) return 1;
      return 1 - overlap(Math.abs(x), k()) / Math.PI;
    }
    function vsign(t) { return -Math.cos(phase(t)); }  // 멀어지면 +: 행성이 오른쪽(φ=0)에 있을 때 별은 왼쪽에서 관측자 쪽으로 다가온다
    function upd() {
      rP.set(P() < 10 ? P().toFixed(2) + '일' : P().toFixed(1) + '일');
      var dp = k() * k() * 100;
      rD.set((dp < 0.1 ? dp.toFixed(4) : dp.toFixed(2)) + ' %');
      rDur.set((dur() * 24).toFixed(1) + '시간');
      rK.set(Kms().toFixed(1) + ' m/s');
      var dl = 656.3 * Kms() / 3e8, ex = Math.floor(Math.log10(dl)), sup = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
      rL.set((dl / Math.pow(10, ex)).toFixed(1) + '×10' + String(ex).split('').map(function (c) { return sup[c]; }).join('') + ' nm');
      draw();
    }

    var loop = api.loop(function (dt) {
      if (!st.playing || !(dt > 0)) return;
      var rate = Math.max(0.5, Math.min(4, P() / 3));                    // 일/초
      var ph = phase(st.t), x = aR() * Math.cos(ph);
      if (Math.sin(ph) < 0 && Math.abs(x) < 1 + k() + 0.6) rate = Math.min(rate, dur() * 1.4 / 2.5);
      st.t += rate * dt; if (st.t > WIN) st.t -= WIN;
      draw();
    });
    if (!st.playing) loop.pause();

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { scene: { x: 0, y: 0, w: w, h: h * 0.4 }, g1: { x: 0, y: h * 0.42, w: w, h: h * 0.29 }, g2: { x: 0, y: h * 0.71, w: w, h: h * 0.29 } };
      return { scene: { x: 0, y: 0, w: w * 0.4, h: h }, g1: { x: w * 0.42, y: 0, w: w * 0.58, h: h * 0.5 }, g2: { x: w * 0.42, y: h * 0.5, w: w * 0.58, h: h * 0.5 } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (st.mode === 'transit') { sceneTransit(T, L.scene); graphLC(T, L.g1); graphZoom(T, L.g2); }
      else { sceneRV(T, L.scene); spectrum(T, L.g1); graphRV(T, L.g2); }
    }
    function txt(T, s, x, y, o) {
      o = o || {}; ctx.fillStyle = o.color || T.figInk; ctx.textAlign = o.align || 'left';
      ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + (o.mono ? T.fontMono : T.fontBody); ctx.fillText(s, x, y);
    }
    function topView(T, cx, cy, R, starWobble) {
      // 위에서 본 궤도(관측자는 아래쪽)
      ctx.strokeStyle = T.figLine; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      var ph = phase(st.t), px = cx + R * Math.cos(ph), py = cy - R * Math.sin(ph);
      var sr = Math.max(2.5, R / aR());
      var wob = starWobble ? starWobble : 0;
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(cx - wob * Math.cos(ph), cy + wob * Math.sin(ph), sr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
      // 관측자
      ctx.strokeStyle = T.figMuted; ctx.fillStyle = T.figMuted; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy + R + 8); ctx.lineTo(cx, cy + R + 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + R + 32); ctx.lineTo(cx - 5, cy + R + 23); ctx.lineTo(cx + 5, cy + R + 23); ctx.fill();
      txt(T, '지구(관측자) 쪽', cx + 8, cy + R + 28, { size: 11, color: T.figMuted });
    }
    function sceneTransit(T, r) {
      txt(T, '지구에서 본 별과 행성', r.x + 10, r.y + 18, { bold: true });
      var stacked = cv.w < 560;
      var Rs = Math.min(r.w * (stacked ? 0.2 : 0.24), r.h * (stacked ? 0.22 : 0.16)), cx = stacked ? r.x + r.w * 0.27 : r.x + r.w / 2, cy = r.y + (stacked ? r.h * 0.55 : r.h * 0.28);
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(cx, cy, Rs, 0, Math.PI * 2); ctx.fill();
      var ph = phase(st.t), x = aR() * Math.cos(ph);
      if (Math.sin(ph) < 0 && Math.abs(x) < 1 + k() + 2) {
        ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(cx + x * Rs, cy, Math.max(1.5, k() * Rs), 0, Math.PI * 2); ctx.fill();
      }
      txt(T, '크기 비율은 실제와 같다', cx, cy + Rs + 18, { size: 11, color: T.figMuted, align: 'center' });
      // 위에서 본 궤도(모식도)
      var tx = stacked ? r.x + r.w * 0.74 : r.x + r.w / 2, ty = stacked ? r.y + r.h * 0.45 : r.y + r.h * 0.7, R = Math.min(r.w * (stacked ? 0.17 : 0.3), r.h * (stacked ? 0.26 : 0.15));
      txt(T, '위에서 본 궤도', tx, ty - R - 8, { size: 11, color: T.figMuted, align: 'center' });
      topView(T, tx, ty, R, 0);
    }
    function axes(T, r, xlab, ylab, yt, yfmt, xmin, xmax, ymin, ymax, xt) {
      var Lx = r.x + 52, Rx = r.x + r.w - 14, Ty = r.y + 26, By = r.y + r.h - 34;
      var sx = function (v) { return Lx + (v - xmin) / (xmax - xmin) * (Rx - Lx); };
      var sy = function (v) { return By - (v - ymin) / (ymax - ymin) * (By - Ty); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      yt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(Lx, sy(v)); ctx.lineTo(Rx, sy(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(yfmt(v), Lx - 5, sy(v) + 4); });
      xt.forEach(function (v) { ctx.textAlign = 'center'; ctx.fillText(v, sx(v), By + 14); });
      txt(T, xlab, (Lx + Rx) / 2, By + 28, { size: 11, align: 'center' });
      txt(T, ylab, r.x + 6, r.y + 14, { size: 12, bold: true });
      return { sx: sx, sy: sy, Lx: Lx, Rx: Rx, Ty: Ty, By: By };
    }
    function graphLC(T, r) {
      var A = axes(T, r, '시간 (일)', '밝기 곡선 (30일 동안)', [1, 0.99, 0.98], function (v) { return (v * 100).toFixed(0) + '%'; }, 0, WIN, 0.975, 1.002, [0, 5, 10, 15, 20, 25, 30]);
      var pts = [], Pd = P(), D = dur();
      for (var i = 0; i <= 300; i++) pts.push(WIN * i / 300);
      for (var n = 0; T0 + n * Pd < WIN + D; n++) { var tc = T0 + n * Pd; for (var j = -40; j <= 40; j++) pts.push(tc + D * 0.6 * j / 40); }
      pts = pts.filter(function (t) { return t >= 0 && t <= WIN; }).sort(function (a, b) { return a - b; });
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.8; ctx.beginPath();
      pts.forEach(function (t, i) { var y = A.sy(Math.max(0.975, flux(t))); if (i) ctx.lineTo(A.sx(t), y); else ctx.moveTo(A.sx(t), y); }); ctx.stroke();
      if (T0 + Pd < WIN) {
        var y0 = A.sy(0.9855); ctx.strokeStyle = T.figRed; ctx.fillStyle = T.figRed; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(A.sx(T0), y0); ctx.lineTo(A.sx(T0 + Pd), y0); ctx.stroke();
        txt(T, '간격 = 공전 주기', Math.min(A.sx(T0 + Pd) + 4, A.Rx - 90), y0 + 4, { size: 11, color: T.figRed });
      }
      cursor(T, A, st.t);
    }
    function cursor(T, A, t) {
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(A.sx(t), A.Ty); ctx.lineTo(A.sx(t), A.By); ctx.stroke(); ctx.setLineDash([]);
    }
    function graphZoom(T, r) {
      var D = dur() * 24, half = Math.max(D * 0.9, 1), dp = k() * k(), top = Math.max(dp * 1.5, 0.0001);
      var step = niceStep(top / 3);
      var yt = []; for (var v = 0; v <= top + 1e-12; v += step) yt.push(1 - v);
      var xs = niceStep(half / 2), xt = []; for (var x = -Math.floor(half / xs) * xs; x <= half + 1e-9; x += xs) xt.push(+x.toFixed(2));
      var A = axes(T, r, '통과 한가운데로부터의 시간 (시간)', '한 번의 통과를 확대 (세로축 자동 확대)', yt, function (v) { var d = (1 - v) * 100; return d === 0 ? '100%' : '−' + (d < 0.1 ? d.toFixed(3) : d.toFixed(2)) + '%'; }, -half, half, 1 - top, 1 + top * 0.08, xt);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath();
      for (var i = 0; i <= 300; i++) { var hh = -half + 2 * half * i / 300, f = flux(T0 + hh / 24); var px = A.sx(hh), py = A.sy(f); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
      ctx.strokeStyle = T.figRed; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(A.Lx, A.sy(1 - dp)); ctx.lineTo(A.Rx, A.sy(1 - dp)); ctx.stroke(); ctx.setLineDash([]);
      txt(T, '깊이 ≈ (R행성/R별)²', A.Rx - 4, A.sy(1 - dp) - 5, { size: 11, color: T.figRed, align: 'right' });
      // 현재 시각(통과에 가까울 때만)
      var ph = (st.t - T0) / P(), dd = (ph - Math.round(ph)) * P() * 24;
      if (Math.abs(dd) < half) cursor(T, A, dd);
    }
    function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
    function sceneRV(T, r) {
      txt(T, '위에서 본 별과 행성', r.x + 10, r.y + 18, { bold: true });
      var R = Math.min(r.w * 0.34, r.h * 0.3), cx = r.x + r.w / 2, cy = r.y + r.h * 0.46;
      var wob = Math.min(R * 0.25, 4 + Kms() / 300 * R * 0.25);   // 과장
      ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(cx, cy, wob, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      topView(T, cx, cy, R, wob);
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('+', cx, cy + 4);
      txt(T, '+ 공통 질량 중심 (별의 흔들림은 과장)', cx, r.y + r.h - 4, { size: 11, color: T.figMuted, align: 'center' });
    }
    function spectrum(T, r) {
      txt(T, '별빛의 스펙트럼과 흡수선 (이동량 크게 과장)', r.x + 6, r.y + 16, { size: 12, bold: true });
      var x0 = r.x + 20, x1 = r.x + r.w - 20, y0 = r.y + 34, hh = Math.min(46, r.h - 80);
      var gr = ctx.createLinearGradient(x0, 0, x1, 0);
      ['#5b3fd6', '#2f6fd6', '#1fa08a', '#8cc63f', '#f2c12e', '#f08a24', '#d6453d'].forEach(function (c, i) { gr.addColorStop(i / 6, c); });   // 실제 색이 내용인 스펙트럼
      ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, hh);
      var v = Kms() * vsign(st.t), shift = v / 300 * (x1 - x0) * 0.18, mid = (x0 + x1) / 2;
      ctx.strokeStyle = T.figLine; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(mid, y0 - 4); ctx.lineTo(mid, y0 + hh + 4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#111'; ctx.fillRect(mid + shift - 2, y0, 4, hh);
      var word = Math.abs(v) < Kms() * 0.15 ? '거의 이동 없음' : v < 0 ? '← 청색 이동 (별이 다가옴)' : '적색 이동 (별이 멀어짐) →';
      txt(T, word, mid, y0 + hh + 20, { size: 12, align: 'center', color: Math.abs(v) < Kms() * 0.15 ? T.figMuted : v < 0 ? T.figBlue : T.figRed, bold: true });
      txt(T, '점선: 원래 파장', mid, y0 + hh + 36, { size: 11, align: 'center', color: T.figMuted });
    }
    function graphRV(T, r) {
      var K = Kms(), top = niceStep(K * 1.3 / 2) * 2;
      var A = axes(T, r, '시간 (일)', '별의 시선 속도 (m/s, 멀어지면 +)', [-top, -top / 2, 0, top / 2, top], function (v) { return v.toFixed(Math.abs(top) < 10 ? 1 : 0); }, 0, WIN, -top * 1.05, top * 1.05, [0, 5, 10, 15, 20, 25, 30]);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2; ctx.beginPath();
      for (var i = 0; i <= 600; i++) { var t = WIN * i / 600, y = A.sy(K * vsign(t)); if (i) ctx.lineTo(A.sx(t), y); else ctx.moveTo(A.sx(t), y); }
      ctx.stroke();
      ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(A.sx(st.t), A.sy(K * vsign(st.t)), 4, 0, Math.PI * 2); ctx.fill();
      cursor(T, A, st.t);
    }
    api.onResize(draw);
    upd();
  },
});
