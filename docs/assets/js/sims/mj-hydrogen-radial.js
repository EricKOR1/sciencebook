/* 물리화학 8 수소꼴 원자: 실수 오비탈의 xz 단면(부호와 마디)과 지름 분포 함수 P(r) = r²R², 누적 확률
   R_nl ∝ ρ^l e^(−ρ/2) L_(n−l−1)^(2l+1)(ρ), ρ = 2Zr/(n a₀)  (원점에서 양수: 원고 ⑨의 표와 같은 부호)
   실수 각 부분(xz 평면, c = z/r, s = x/r): 원고 ⑨의 p_x ∝ x/r 등 cos 꼴 조합 */
Sims.register('mj-hydrogen-radial', {
  title: '수소꼴 원자 오비탈 — 단면의 마디와 지름 분포 함수',
  caption: 'n, l, 실수 오비탈, 핵전하 Z를 고르고 반지름 r₀ 슬라이더를 움직여 보자. 왼쪽은 xz 평면에서 본 오비탈로, 빨강은 ψ > 0, 파랑은 ψ < 0, 색의 진하기는 |ψ|(밀도 |ψ|²의 제곱근, 바깥쪽도 보이게)이며 회색 점선 원은 지름 마디, 회색 점선 직선은 각 마디이다. 오른쪽은 지름 분포 함수 P(r) = r²R²로, 흰 점이 지름 마디(n − l − 1개), 칠한 넓이가 반지름 r₀ 안에서 발견될 확률이다. l ≤ n − 1이므로 n을 줄이면 l이 함께 내려간다. sin 꼴 실수 오비탈(p_y, d_xy, d_yz 등)은 xz 평면에서 0이라 목록에서 뺐다(cos 꼴을 z축 둘레로 돌린 모양이다). 입체 모양은 일반화학 단원의 점구름 3D 보기에서 볼 수 있다.',
  init: function (api) {
    var ORB = [
      [{ n: 's', A: function () { return 1; } }],
      [{ n: 'p_z', A: function (s, c) { return c; } }, { n: 'p_x', A: function (s) { return s; } }],
      [{ n: 'd_z²', A: function (s, c) { return 3 * c * c - 1; } }, { n: 'd_xz', A: function (s, c) { return s * c; } }, { n: 'd_x²−y²', A: function (s) { return s * s; } }],
      [{ n: 'f_z³', A: function (s, c) { return c * (5 * c * c - 3); } }, { n: 'f_xz²', A: function (s, c) { return s * (5 * c * c - 1); } }, { n: 'f_z(x²−y²)', A: function (s, c) { return c * s * s; } }, { n: 'f_x(x²−3y²)', A: function (s) { return s * s * s; } }],
    ];
    var LN = 'spdf';
    var st = { n: 3, l: 1, m: 0, Z: 1, r0: 6, note: '' };
    var cache = null;

    function lag(k, a, x) { if (k === 0) return 1; var p0 = 1, p1 = 1 + a - x; for (var j = 1; j < k; j++) { var p2 = ((2 * j + 1 + a - x) * p1 - (j + a) * p0) / (j + 1); p0 = p1; p1 = p2; } return p1; }
    function Rraw(r) { var rho = 2 * st.Z * r / st.n; return Math.pow(rho, st.l) * Math.exp(-rho / 2) * lag(st.n - st.l - 1, 2 * st.l + 1, rho); }
    function prepare() {
      // 반지름 범위: 누적 99.5 %까지, 규격화
      var rmax = (3 * st.n * st.n + 30 * st.n) / st.Z, N = 3000, dr = rmax / N, cum = [0], s = 0, P = [0], i;
      for (i = 1; i <= N; i++) { var r = i * dr, R = Rraw(r), p = r * r * R * R; P.push(p); s += (p + P[i - 1]) / 2 * dr; cum.push(s); }
      for (i = 0; i <= N; i++) { P[i] /= s; cum[i] /= s; }
      var rEnd = rmax; for (i = 0; i <= N; i++) if (cum[i] > 0.995) { rEnd = i * dr; break; }
      var pk = 0, rmp = 0; for (i = 0; i <= N; i++) if (P[i] > pk) { pk = P[i]; rmp = i * dr; }
      var nodes = []; for (i = 2; i <= N; i++) { var a = Rraw((i - 1) * dr), b = Rraw(i * dr); if (a * b < 0) nodes.push((i - 1 + a / (a - b)) * dr); }
      cache = { dr: dr, N: N, P: P, cum: cum, rEnd: rEnd * 1.05, rmp: rmp, pk: pk, nodes: nodes, mean: (3 * st.n * st.n - st.l * (st.l + 1)) / (2 * st.Z) };
      rSl.input.max = (cache.rEnd).toFixed(1);
      if (st.r0 > cache.rEnd) rSl.set(+(cache.rEnd * 0.5).toFixed(1));
      img = null;
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.65 : 0.5; }, label: '실수 오비탈의 xz 단면과 지름 분포 함수' });
    var ctx = cv.ctx;
    var rO = api.readout('오비탈'), rNd = api.readout('마디'), rMp = api.readout('가장 그럴듯한 r'), rMean = api.readout('⟨r⟩'), rCum = api.readout('P(r < r₀)');

    var sN = api.slider({ id: 'mj-hydrogen-radial-n', label: '주 양자수 n', min: 1, max: 4, step: 1, value: st.n, format: String, onInput: function (v) { st.n = v; if (st.l > v - 1) { st.note = 'l ≤ n − 1이므로 l을 ' + (v - 1) + '로 낮췄다'; sL.set(v - 1); return; } update(); } });
    var sL = api.slider({ id: 'mj-hydrogen-radial-l', label: '각운동량 양자수 l', min: 0, max: 3, step: 1, value: st.l, format: function (v) { return v + ' (' + LN[v] + ')'; }, onInput: function (v) {
      if (v > st.n - 1) { st.note = 'n = ' + st.n + '이면 l은 ' + (st.n - 1) + '까지만 된다(l ≤ n − 1)'; sL.input.value = st.n - 1; sL.input.dispatchEvent(new Event('input')); return; }
      st.l = v; st.m = Math.min(st.m, v); buildOrb(); update(); } });
    var sZ = api.slider({ id: 'mj-hydrogen-radial-z', label: '핵전하 Z', min: 1, max: 3, step: 1, value: st.Z, format: function (v) { return v + ['', ' (H)', ' (He⁺)', ' (Li²⁺)'][v]; }, onInput: function (v) { var k = v / st.Z; st.Z = v; prepare(); rSl.set(+(st.r0 / k).toFixed(1)); update(); } });
    var rSl = api.slider({ id: 'mj-hydrogen-radial-r0', label: '반지름 r₀', min: 0.1, max: 40, step: 0.1, value: st.r0, format: function (v) { return v.toFixed(1) + ' a₀'; }, onInput: function (v) { st.r0 = v; draw(); } });
    var og = api.group(), obtns = [];
    function buildOrb() {
      og.innerHTML = ''; obtns = [];
      ORB[st.l].forEach(function (o, i) {
        var label = st.n + o.n.replace('_', '');
        obtns.push(api.button(label, function () { st.m = i; obtns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); img = null; draw(); }, { toggle: true, pressed: i === st.m, parent: og }));
      });
    }
    function update() { buildOrb(); prepare(); draw(); }

    var img = null;
    function parse(c) {
      var m; c = (c || '').trim();
      if ((m = /^#([0-9a-f]{6})/i.exec(c))) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
      if ((m = /^#([0-9a-f]{3})$/i.exec(c))) return [17 * parseInt(m[1][0], 16), 17 * parseInt(m[1][1], 16), 17 * parseInt(m[1][2], 16)];
      if ((m = /^rgba?\(([^)]+)\)/i.exec(c))) { var p = m[1].split(/[\s,\/]+/).map(parseFloat); return [p[0], p[1], p[2]]; }
      return [128, 128, 128];
    }
    function density(T, L) {
      var M = 180, oc = document.createElement('canvas'); oc.width = M; oc.height = M;
      var o = oc.getContext('2d'), id = o.createImageData(M, M), A = ORB[st.l][st.m].A;
      var bg = parse(T.figPaper), cr = parse(T.figRed), cb = parse(T.figBlue), vals = new Float32Array(M * M), mx = 0, i, j;
      for (j = 0; j < M; j++) for (i = 0; i < M; i++) {
        var x = (i + 0.5) / M * 2 * L - L, z = L - (j + 0.5) / M * 2 * L, r = Math.hypot(x, z) || 1e-9;
        var v = Rraw(r) * A(x / r, z / r); vals[j * M + i] = v; if (Math.abs(v) > mx) mx = Math.abs(v);
      }
      for (i = 0; i < M * M; i++) {
        var t = Math.sqrt(Math.abs(vals[i]) / mx), c = vals[i] >= 0 ? cr : cb, k = i * 4;
        t = Math.min(1, t * 1.15);
        id.data[k] = bg[0] + (c[0] - bg[0]) * t; id.data[k + 1] = bg[1] + (c[1] - bg[1]) * t; id.data[k + 2] = bg[2] + (c[2] - bg[2]) * t; id.data[k + 3] = 255;
      }
      o.putImageData(id, 0, 0); return oc;
    }

    function draw() {
      if (!cache) return;
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, C = cache;
      ctx.clearRect(0, 0, w, h);
      var L = C.rEnd * 0.8;   // 단면 반 폭(a₀)
      var S = narrow ? Math.min(w - 60, h * 0.5) : Math.min(h - 50, w * 0.42);
      var Q = { x: narrow ? (w - S) / 2 + 10 : 44, y: 12, s: S };
      if (!img || img.L !== L || img.dark !== T.dark) { img = density(T, L); img.L = L; img.dark = T.dark; }
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, Q.x, Q.y, Q.s, Q.s);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.strokeRect(Q.x, Q.y, Q.s, Q.s);
      var cx = Q.x + Q.s / 2, cy = Q.y + Q.s / 2, k = Q.s / (2 * L);
      ctx.save(); ctx.beginPath(); ctx.rect(Q.x, Q.y, Q.s, Q.s); ctx.clip();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figInk; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.4;
      C.nodes.forEach(function (rn) { ctx.beginPath(); ctx.arc(cx, cy, rn * k, 0, 2 * Math.PI); ctx.stroke(); });
      // 각 마디: A(s, c) = 0 인 방향(부호 바뀜 또는 0에 닿음)
      var A = ORB[st.l][st.m].A, NA = 720, prev = null, th, a;
      for (var q = 0; q <= NA; q++) {
        th = q / NA * 2 * Math.PI; a = A(Math.sin(th), Math.cos(th));
        var zero = Math.abs(a) < 1e-9 || (prev !== null && prev * a < 0);
        if (zero) { var t2 = Math.abs(a) < 1e-9 ? th : th - Math.PI / NA; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(t2) * Q.s, cy - Math.cos(t2) * Q.s); ctx.stroke(); }
        if (Math.abs(a) >= 1e-9) prev = a;
      }
      ctx.globalAlpha = 1; ctx.setLineDash([2, 3]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, st.r0 * k, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('x', Q.x + Q.s - 8, cy - 6); ctx.fillText('z', cx + 9, Q.y + 14);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.fillText('한 변 ' + (2 * L).toFixed(L < 10 ? 1 : 0) + ' a₀', Q.x + Q.s / 2, Q.y + Q.s + 14);
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figRed; ctx.fillText('ψ > 0', Q.x + 6, Q.y + 16);
      ctx.fillStyle = T.figBlue; ctx.fillText('ψ < 0', Q.x + 6, Q.y + 32);

      // P(r) 그래프
      var G = narrow ? { x: 54, y: Q.y + Q.s + 40, w: w - 70, h: h - Q.s - 100 } : { x: Q.x + Q.s + 66, y: 14, w: w - Q.x - Q.s - 66 - 14, h: h - 56 };
      var pmax = C.pk * 1.15, R = C.rEnd;
      var gx = function (r) { return G.x + r / R * G.w; }, gy = function (p) { return G.y + G.h - p / pmax * G.h; };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      var xs = nice(R / 5);
      for (var r = 0; r <= R + 1e-9; r += xs) { ctx.beginPath(); ctx.moveTo(gx(r), G.y); ctx.lineTo(gx(r), G.y + G.h); ctx.stroke(); ctx.fillText(+r.toFixed(1) + '', gx(r), G.y + G.h + 14); }
      var ys = nice(pmax / 4); ctx.textAlign = 'right';
      for (var p = 0; p <= pmax + 1e-9; p += ys) { ctx.beginPath(); ctx.moveTo(G.x, gy(p)); ctx.lineTo(G.x + G.w, gy(p)); ctx.stroke(); ctx.fillText(+p.toFixed(3) + '', G.x - 5, gy(p) + 4); }
      ctx.strokeStyle = T.figMuted; ctx.strokeRect(G.x, G.y, G.w, G.h);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('r / a₀', G.x + G.w / 2, G.y + G.h + 30);
      ctx.save(); ctx.translate(G.x - 42, G.y + G.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('P(r) · a₀', 0, 0); ctx.restore();
      // 누적 넓이
      var i0 = Math.min(C.N, Math.round(st.r0 / C.dr)), i, last = Math.round(R / C.dr);
      ctx.fillStyle = T.figSoftAmber; ctx.beginPath(); ctx.moveTo(gx(0), gy(0));
      for (i = 0; i <= i0; i++) ctx.lineTo(gx(i * C.dr), gy(C.P[i]));
      ctx.lineTo(gx(i0 * C.dr), gy(0)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.4; ctx.beginPath();
      for (i = 0; i <= Math.min(last, C.N); i++) { if (i) ctx.lineTo(gx(i * C.dr), gy(C.P[i])); else ctx.moveTo(gx(0), gy(0)); }
      ctx.stroke();
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(gx(st.r0), G.y); ctx.lineTo(gx(st.r0), G.y + G.h); ctx.stroke();
      // 가장 그럴듯한 r, ⟨r⟩
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(gx(C.rmp), gy(C.pk)); ctx.lineTo(gx(C.rmp), G.y + G.h); ctx.stroke();
      ctx.strokeStyle = T.figGreen; ctx.beginPath(); ctx.moveTo(gx(C.mean), G.y + 18); ctx.lineTo(gx(C.mean), G.y + G.h); ctx.stroke(); ctx.setLineDash([]);
      C.nodes.forEach(function (rn) { ctx.beginPath(); ctx.arc(gx(rn), gy(0), 4.5, 0, 2 * Math.PI); ctx.fillStyle = T.figPaper; ctx.fill(); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.stroke(); });
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figRed; ctx.fillText('점선: 가장 그럴듯한 r', G.x + G.w - 6, G.y + 16);
      ctx.fillStyle = T.figGreen; ctx.fillText('점선: ⟨r⟩', G.x + G.w - 6, G.y + 32);
      ctx.fillStyle = T.figAmber; ctx.fillText('칠한 넓이: P(r < r₀)', G.x + G.w - 6, G.y + 48);
      if (st.note) { ctx.fillStyle = T.figViolet; ctx.textAlign = 'left'; ctx.fillText(st.note, G.x + 6, G.y + G.h - 8); }

      var o = ORB[st.l][st.m];
      rO.set(st.n + o.n.replace('_', '') + '  (n = ' + st.n + ', l = ' + st.l + ', Z = ' + st.Z + ')');
      rNd.set('지름 ' + (st.n - st.l - 1) + '개' + (C.nodes.length ? ' (' + C.nodes.map(function (x) { return x.toFixed(2); }).join(', ') + ' a₀)' : '') + ', 각 ' + st.l + '개');
      rMp.set(C.rmp.toFixed(2) + ' a₀');
      rMean.set(C.mean.toFixed(2) + ' a₀');
      rCum.set(C.cum[i0].toFixed(3));
      st.note = '';
    }
    function nice(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
    buildOrb(); prepare();
    api.onResize(draw);
    draw();
  },
});
