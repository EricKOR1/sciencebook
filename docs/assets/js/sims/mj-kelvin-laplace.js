/* 물리화학 4 순물질의 상평형: 표면 효과 계산기 — 라플라스 압력 2γ/r, 켈빈 식 p/p* = exp(±2γV_m/rRT), 임계 반지름 r* = 2γV_m/(RT ln S) */
Sims.register('mj-kelvin-laplace', {
  title: '라플라스·켈빈 계산기 — 작은 물방울은 왜 증발하는가',
  caption: '액체와 온도를 고르고 물방울 반지름 r과 주위 증기의 과포화도 S = p/p*를 바꿔 보자. 반지름이 작을수록 라플라스 압력 2γ/r이 커지고, 그만큼 액체의 화학 퍼텐셜이 올라가 볼록한 면의 증기 압력이 p* exp(2γV_m/rRT)로 커진다. 물방울의 증기 압력이 주위의 S보다 크면(r < r*) 증발하고, 작으면(r > r*) 자란다. "시간 흐르게"를 누르면 r* 근처에서 갈림길이 생기는 것을 볼 수 있다. γ와 몰 부피는 온도에 따른 근사식이고, 1 nm 안팎에서는 켈빈 식이 정량적으로 맞지 않는다(γ가 크기에 무관하다고 가정).',
  init: function (api) {
    var R = 8.314;
    var LIQ = [
      { name: '물', M: 18.015, g: function (t) { return 75.6 - 0.167 * t; }, rho: function (t) { return 999.9 + 0.0505 * t - 0.00737 * t * t + 0.0000337 * t * t * t; }, mp: 0, bp: 100 },
      { name: '에탄올', M: 46.07, g: function (t) { return 24.05 - 0.0832 * t; }, rho: function (t) { return 806.4 - 0.85 * t; }, mp: -114, bp: 78.4 },
      { name: '벤젠', M: 78.11, g: function (t) { return 31.5 - 0.13 * t; }, rho: function (t) { return 900.0 - 1.07 * t; }, mp: 5.5, bp: 80.1 },
    ];
    var st = { k: 0, lr: 1, t: 25, ls: Math.log10(0.01), run: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.5; }, label: '물방울의 크기와 증기 압력 비 p/p* 대 반지름 그래프' });
    var ctx = cv.ctx;
    var rG = api.readout('γ, V_m');
    var rL = api.readout('라플라스 압력 2γ/r');
    var rK = api.readout('p/p* 볼록 / 오목');
    var rS = api.readout('임계 반지름 r*');
    var rD = api.readout('이 물방울은');

    var g = api.group();
    var bs = LIQ.map(function (L, i) { return api.button(L.name, function () { pick(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    var sR = api.slider({ id: 'mj-kelvin-laplace-r', label: '반지름 r', min: Math.log10(0.5), max: 4, step: 0.01, value: st.lr,
      format: function (v) { return fmtR(Math.pow(10, v)); }, onInput: function (v) { st.lr = v; draw(); } });
    api.slider({ id: 'mj-kelvin-laplace-t', label: '온도', min: 0, max: 100, step: 1, value: st.t,
      format: function (v) { return v + ' °C'; }, onInput: function (v) { st.t = v; draw(); } });
    api.slider({ id: 'mj-kelvin-laplace-s', label: '과포화도 S = p/p*', min: -3, max: Math.log10(3), step: 0.01, value: st.ls,
      format: function (v) { return (1 + Math.pow(10, v)).toFixed(v < -2 ? 4 : 3); }, onInput: function (v) { st.ls = v; draw(); } });
    var runBtn = api.button('시간 흐르게', function () { if (st.run) stop(); else start(); }, { primary: true });

    function pick(i) { st.k = i; bs.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }
    function fmtR(r) { return r >= 1000 ? (r / 1000).toPrecision(3) + ' μm' : r >= 10 ? r.toFixed(0) + ' nm' : r.toFixed(2) + ' nm'; }
    function props() {
      var L = LIQ[st.k], gam = L.g(st.t) / 1000, Vm = L.M / 1000 / L.rho(st.t), T = st.t + 273.15;
      return { gam: gam, Vm: Vm, T: T, len: 2 * gam * Vm / (R * T) * 1e9 };   // len: nm
    }
    function S() { return 1 + Math.pow(10, st.ls); }

    var loop = api.loop(function (dt) {
      var p = props(), r = Math.pow(10, st.lr), K = Math.exp(p.len / r), s = S();
      // 성장 속도 dr/dt ∝ (S − K)/r : 로그 반지름으로 보기 좋게 바꾼 속도(화면용)
      var v = (s - K) / Math.max(s - 1, 1e-3);
      v = Math.max(-1, Math.min(1, v));
      st.lr += v * 0.5 * dt;
      if (st.lr <= Math.log10(0.5)) { st.lr = Math.log10(0.5); stop(); }
      if (st.lr >= 4) { st.lr = 4; stop(); }
      sR.input.value = st.lr; sR.input.dispatchEvent(new Event('input'));
    });
    loop.pause();
    function start() { if (api.reduced) { jump(); return; } st.run = true; runBtn.textContent = '멈춤'; loop.play(); }
    function stop() { st.run = false; runBtn.textContent = '시간 흐르게'; loop.pause(); }
    function jump() {   // 움직임 줄이기: 끝 상태로 바로
      var p = props(), r = Math.pow(10, st.lr);
      st.lr = Math.exp(p.len / r) > S() ? Math.log10(0.5) : 4; sR.set(st.lr);
    }

    function draw() {
      var Tk = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      var p = props(), r = Math.pow(10, st.lr), s = S(), rstar = p.len / Math.log(s);
      var Kv = Math.exp(p.len / r), Kc = Math.exp(-p.len / r);
      ctx.clearRect(0, 0, w, h);
      var A = narrow ? { x: 0, y: 0, w: w, h: h * 0.4 } : { x: 0, y: 0, w: w * 0.36, h: h };
      var G = narrow ? { x: 0, y: h * 0.42, w: w, h: h * 0.58 } : { x: w * 0.39, y: 0, w: w * 0.61, h: h };
      // 물방울 그림 (반지름은 로그로 바꾼 크기)
      var cx = A.x + A.w / 2, cy = A.y + A.h / 2 + 6;
      var maxR = Math.min(A.w, A.h) * 0.34;
      var f = (st.lr - Math.log10(0.5)) / (4 - Math.log10(0.5));
      var pr = 6 + f * (maxR - 6);
      ctx.fillStyle = Tk.figSoftBlue; ctx.strokeStyle = Tk.figBlue; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, pr, 0, 7); ctx.fill(); ctx.stroke();
      var grow = Kv < s;
      ctx.strokeStyle = grow ? Tk.figGreen : Tk.figRed; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
      for (var k = 0; k < 8; k++) {
        var a = k * Math.PI / 4, r1 = pr + 6, r2 = pr + 26;
        var x1 = cx + Math.cos(a) * (grow ? r2 : r1), y1 = cy + Math.sin(a) * (grow ? r2 : r1);
        var x2 = cx + Math.cos(a) * (grow ? r1 : r2), y2 = cy + Math.sin(a) * (grow ? r1 : r2);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        var ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 7 * Math.cos(ang - 0.45), y2 - 7 * Math.sin(ang - 0.45)); ctx.lineTo(x2 - 7 * Math.cos(ang + 0.45), y2 - 7 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
      }
      ctx.font = '600 13px ' + Tk.fontBody; ctx.textAlign = 'center';
      ctx.fillText(grow ? '증기가 응축 → 자란다' : '증발 → 줄어든다', cx, A.y + 18);
      ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontBody;
      ctx.fillText('r = ' + fmtR(r) + ' (그림 크기는 로그로 바꿈)', cx, A.y + A.h - 6);
      // 그래프
      var L = G.x + 48, Rr = G.x + G.w - 12, Tp = G.y + 16, B = G.y + G.h - 34;
      var lx0 = Math.log10(0.5), lx1 = 4, Y1 = 3.2;
      var sx = function (lr) { return L + (lr - lx0) / (lx1 - lx0) * (Rr - L); };
      var sy = function (v) { return B - v / Y1 * (B - Tp); };
      ctx.strokeStyle = Tk.rule; ctx.lineWidth = 1; ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontMono;
      ctx.textAlign = 'center';
      [[0, '1 nm'], [1, '10'], [2, '100'], [3, '1 μm'], [4, '10 μm']].forEach(function (q) { ctx.beginPath(); ctx.moveTo(sx(q[0]), Tp); ctx.lineTo(sx(q[0]), B); ctx.stroke(); ctx.fillText(q[1], sx(q[0]), B + 14); });
      ctx.textAlign = 'right';
      [0, 0.5, 1, 1.5, 2, 2.5, 3].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke(); ctx.fillText(v.toFixed(1), L - 5, sy(v) + 4); });
      ctx.strokeStyle = Tk.figLine; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.fillStyle = Tk.figInk; ctx.font = '12px ' + Tk.fontBody; ctx.textAlign = 'center';
      ctx.fillText('반지름 r (로그 눈금)', (L + Rr) / 2, B + 29);
      ctx.save(); ctx.translate(G.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('p/p*', 0, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      function curve(sign, col) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
        for (var n = 0; n <= 200; n++) { var lr = lx0 + (lx1 - lx0) * n / 200, v = Math.exp(sign * p.len / Math.pow(10, lr)); if (n) ctx.lineTo(sx(lr), sy(v)); else ctx.moveTo(sx(lr), sy(v)); }
        ctx.stroke();
      }
      curve(1, Tk.figRed); curve(-1, Tk.figBlue);
      ctx.setLineDash([6, 4]); ctx.strokeStyle = Tk.figMuted; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(L, sy(1)); ctx.lineTo(Rr, sy(1)); ctx.stroke();
      ctx.strokeStyle = Tk.figGreen; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(L, sy(s)); ctx.lineTo(Rr, sy(s)); ctx.stroke(); ctx.setLineDash([]);
      // r*
      if (rstar > 0.5 && rstar < 1e4) {
        var xs = sx(Math.log10(rstar));
        ctx.fillStyle = Tk.figGreen; ctx.beginPath(); ctx.arc(xs, sy(s), 5, 0, 7); ctx.fill();
        ctx.font = '600 11px ' + Tk.fontBody; ctx.textAlign = 'left';
        ctx.fillText('r* = ' + fmtR(rstar), Math.min(xs + 8, Rr - 80), sy(s) - 8);
      }
      // 현재 r
      var xr = sx(st.lr);
      ctx.strokeStyle = Tk.figInk; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(xr, Tp); ctx.lineTo(xr, B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = Tk.figRed; ctx.beginPath(); ctx.arc(xr, sy(Math.min(Kv, Y1)), 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = Tk.figBlue; ctx.beginPath(); ctx.arc(xr, sy(Kc), 4.5, 0, 7); ctx.fill();
      ctx.restore();
      ctx.font = '600 11px ' + Tk.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = Tk.figRed; ctx.fillText('볼록(물방울)', Rr - 4, sy(1) - 22);
      ctx.fillStyle = Tk.figBlue; ctx.fillText('오목(메니스커스)', Rr - 4, sy(1) + 18);
      ctx.fillStyle = Tk.figGreen; ctx.fillText('주위 증기 S', Rr - 4, sy(s) - (s - 1 < 0.15 ? -16 : 6) - (s - 1 < 0.15 ? 26 : 0));
      // 읽은 값
      var L0 = LIQ[st.k];
      rG.set((p.gam * 1000).toFixed(1) + ' mN/m, ' + (p.Vm * 1e6).toFixed(2) + ' cm³/mol' + (st.t < L0.mp || st.t > L0.bp ? ' (1 atm에서 액체 범위 밖)' : ''));
      var dp = 2 * p.gam / (r * 1e-9) / 1e5;
      rL.set(dp >= 1 ? dp.toPrecision(3) + ' bar' : (dp * 1e5).toPrecision(3) + ' Pa');
      rK.set(Kv.toPrecision(4) + ' / ' + Kc.toPrecision(4));
      rS.set(fmtR(rstar) + ' (2γV_m/RT = ' + p.len.toFixed(2) + ' nm)');
      rD.set(grow ? '자란다 (r > r*)' : '증발한다 (r < r*)');
    }
    api.onResize(draw);
    draw();
  },
});
