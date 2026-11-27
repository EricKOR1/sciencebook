/* 유기화학 2: 뷰테인 회전 탐색기 — 뉴먼 투영식, 공-막대 모형, 회전 퍼텐셜, 볼츠만 분포 */
Sims.register('mj-butane-rotation', {
  title: '뷰테인 회전 탐색기 — 이면각에 따른 에너지와 형태의 집단',
  caption: '이면각 슬라이더를 움직이거나 왼쪽 그림을 끌어 뒤 탄소 C3를 돌려 보자. 뉴먼 투영식(앞 C2 = 점, 뒤 C3 = 원), 공-막대 모형, 퍼텐셜 곡선의 점이 함께 움직인다. ' +
    '곡선은 V(φ) = 9.77 + 2.27 cos φ − 0.27 cos 2φ + 7.23 cos 3φ kJ/mol이고, 아래 막대는 안티(0 kJ/mol, 1개)와 고시(3.8 kJ/mol, 60°·300°의 2개)만 있다고 보고 볼츠만 분포로 계산한 비율이다(가림 형태는 무시). ' +
    '온도를 올리면 고시가 늘어 2/3에 다가간다. ‘에테인으로 바꾸기’를 누르면 V = 6(1 + cos 3φ)가 되어 세 엇갈린 형태의 에너지가 같아지므로 온도와 관계없이 1 : 1 : 1이 된다.',
  init: function (api) {
    var R = 8.314e-3;
    var st = { phi: 180, T: 298, ethane: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.62; }, label: '뷰테인 C2–C3 결합의 뉴먼 투영식, 공-막대 모형, 퍼텐셜 에너지 곡선과 형태 비율 막대' });
    var ctx = cv.ctx;
    var rPhi = api.readout('이면각 φ '), rV = api.readout('V(φ) '), rName = api.readout('형태 '), rPop = api.readout('현재 온도의 비율 ');
    var sPhi = api.slider({ id: 'mj-butane-rotation-phi', label: '이면각 φ (두 메틸)', min: 0, max: 360, step: 1, value: st.phi,
      format: function (v) { return v.toFixed(0) + '°'; }, onInput: function (v) { st.phi = v; draw(); } });
    api.slider({ id: 'mj-butane-rotation-t', label: '온도 T', min: 100, max: 600, step: 1, value: st.T,
      format: function (v) { return v.toFixed(0) + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    var g = api.group();
    var bEth = api.button('에테인으로 바꾸기', function () {
      st.ethane = !st.ethane; bEth.setAttribute('aria-pressed', String(st.ethane)); bEth.textContent = st.ethane ? '뷰테인으로 되돌리기' : '에테인으로 바꾸기'; draw();
    }, { toggle: true, parent: g });
    var playing = false;
    var bPlay = api.button('천천히 돌리기', function () { playing = !playing; bPlay.setAttribute('aria-pressed', String(playing)); if (playing) loop.play(); else loop.pause(); }, { toggle: true, parent: g });
    var loop = api.loop(function (dt) { if (!playing) return; st.phi = (st.phi + dt * 40) % 360; sPhi.input.value = Math.round(st.phi); draw(); });
    loop.pause();

    function V(p) {
      var r = p * Math.PI / 180;
      if (st.ethane) return 6 * (1 + Math.cos(3 * r));
      return 9.77 + 2.27 * Math.cos(r) - 0.27 * Math.cos(2 * r) + 7.23 * Math.cos(3 * r);
    }
    function name(p) {
      var q = ((p % 360) + 360) % 360, d = function (a) { return Math.abs(((q - a + 540) % 360) - 180); };
      if (st.ethane) { if (d(60) < 8 || d(180) < 8 || d(300) < 8) return '엇갈린 형태'; if (d(0) < 8 || d(120) < 8 || d(240) < 8) return '가린 형태'; return '그 사이'; }
      if (d(180) < 8) return '안티'; if (d(60) < 8 || d(300) < 8) return '고시';
      if (d(0) < 8) return '완전 가림'; if (d(120) < 8 || d(240) < 8) return '가림'; return '그 사이';
    }
    function pops() {
      var RT = R * st.T, eg = st.ethane ? 0 : 3.8, w = Math.exp(-eg / RT), Z = 1 + 2 * w;
      return { anti: 1 / Z, g1: w / Z, g2: w / Z };
    }
    // 끌어서 돌리기: 뉴먼 칸에서 각도 계산
    var nm = null, dragging = false;
    function pick(e) {
      if (!nm) return;
      var rc = cv.canvas.getBoundingClientRect(), x = e.clientX - rc.left - nm.x, y = e.clientY - rc.top - nm.y;
      if (Math.hypot(x, y) < 8) return;
      var a = Math.atan2(-y, x) * 180 / Math.PI;   // 수학 각도
      var phi = ((90 - a) % 360 + 360) % 360;        // 12시에서 시계 방향
      sPhi.set(Math.round(phi));
    }
    cv.canvas.addEventListener('pointerdown', function (e) {
      if (!nm) return;
      var rc = cv.canvas.getBoundingClientRect(), x = e.clientX - rc.left - nm.x, y = e.clientY - rc.top - nm.y;
      if (Math.hypot(x, y) < nm.r * 2.6) { dragging = true; try { cv.canvas.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } pick(e); }
    });
    cv.canvas.addEventListener('pointermove', function (e) { if (dragging) pick(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.canvas.addEventListener(ev, function () { dragging = false; }); });

    function txt(s, x, y, o) {
      o = o || {};
      ctx.fillStyle = o.color || T.figInk; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
      ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + T.fontBody; ctx.fillText(s, x, y);
    }
    var T;
    function newman(cx, cy, r) {
      nm = { x: cx, y: cy, r: r };
      var L = r * 1.15, sub = st.ethane ? ['H', 'H', 'H'] : ['CH₃', 'H', 'H'];
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      // 뒤 탄소(C3): 원 둘레에서
      for (var k = 0; k < 3; k++) {
        var a = (90 - st.phi - 120 * k) * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a);
        ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(cx + ux * r, cy + uy * r); ctx.lineTo(cx + ux * (r + L), cy + uy * (r + L)); ctx.stroke();
        txt(sub[k], cx + ux * (r + L + 13), cy + uy * (r + L + 11), { color: k === 0 ? T.figViolet : T.figInk, bold: k === 0 && !st.ethane, size: 13 });
      }
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (k = 0; k < 3; k++) {
        a = (90 - 120 * k) * Math.PI / 180; ux = Math.cos(a); uy = -Math.sin(a);
        var LL = (r + L) * 0.82;
        ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ux * LL, cy + uy * LL); ctx.stroke();
        txt(sub[k], cx + ux * (LL + 12), cy + uy * (LL + 10), { bold: k === 0 && !st.ethane, size: 13 });
      }
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(cx, cy, 2.8, 0, Math.PI * 2); ctx.fill();
      txt('앞 C2 = 점, 뒤 C3 = 원 (끌어서 돌리기)', cx, cy + r + L + 34, { color: T.figMuted, size: 11 });
    }
    function model(cx, cy, s) {
      // 3차원 좌표(Å): C2 원점, C3 (1.54, 0, 0). 치환기는 사면체 방향.
      var p = st.phi * Math.PI / 180, ca = -1 / 3, sa = Math.sqrt(8) / 3, atoms = [], bonds = [];
      function add(x, y, z, kind) { atoms.push({ p: [x, y, z], k: kind }); return atoms.length - 1; }
      var c2 = add(0, 0, 0, 'C'), c3 = add(1.54, 0, 0, 'C');
      bonds.push([c2, c3]);
      function subs(base, dirx, rot, kinds, L0) {
        for (var k = 0; k < 3; k++) {
          var t = rot + 2 * Math.PI * k / 3, L = kinds[k] === 'C' ? 1.54 : 1.09;
          var d = [dirx * (-ca), sa * Math.sin(t), sa * Math.cos(t)];
          var id = add(atoms[base].p[0] + d[0] * L, d[1] * L, d[2] * L, kinds[k]);
          bonds.push([base, id]);
        }
      }
      var kinds = st.ethane ? ['H', 'H', 'H'] : ['C', 'H', 'H'];
      subs(c2, -1, 0, kinds);              // 앞 C2: 메틸이 위(z+)
      subs(c3, 1, -p, kinds);              // 뒤 C3: φ만큼 돌림(뉴먼과 같은 방향)
      // 끝 메틸의 H 는 생략(모형 단순화)
      var yaw = -0.55, pitch = 0.32;
      function pr(q) {
        var x = q[0] - 0.77, y = q[1], z = q[2];
        var x1 = x * Math.cos(yaw) - y * Math.sin(yaw), y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
        var up = z * Math.cos(pitch) + y1 * Math.sin(pitch), dep = -y1 * Math.cos(pitch) + z * Math.sin(pitch);
        return { x: cx + x1 * s, y: cy - up * s, d: dep };
      }
      var P = atoms.map(function (a) { return pr(a.p); });
      var items = [];
      bonds.forEach(function (b) { items.push({ t: 'b', d: (P[b[0]].d + P[b[1]].d) / 2 - 0.05, b: b }); });
      atoms.forEach(function (a, i) { items.push({ t: 'a', d: P[i].d, i: i }); });
      items.sort(function (u, v) { return u.d - v.d; });
      items.forEach(function (it) {
        if (it.t === 'b') {
          ctx.strokeStyle = T.figMuted; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(P[it.b[0]].x, P[it.b[0]].y); ctx.lineTo(P[it.b[1]].x, P[it.b[1]].y); ctx.stroke();
        } else {
          var a = atoms[it.i], q = P[it.i], big = a.k === 'C', isMe = big && it.i > 1;
          var rr = big ? s * 0.26 : s * 0.15;
          ctx.fillStyle = isMe ? (it.i > 4 ? T.figViolet : T.figInk) : big ? T.figMuted : T.figPanel;
          ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      });
      txt('공-막대 모형 (회색 C2–C3, 보라 = 뒤 메틸)', cx, cy + s * 2.2, { color: T.figMuted, size: 11 });
    }
    function curve(x0, y0, w, h) {
      var ymax = st.ethane ? 14 : 20;
      var X = function (p) { return x0 + p / 360 * w; }, Y = function (v) { return y0 + h - v / ymax * h; };
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 0.7; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      for (var v = 0; v <= ymax; v += st.ethane ? 2 : 4) { ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x0 + w, Y(v)); ctx.stroke(); txt(String(v), x0 - 6, Y(v), { align: 'right', color: T.figMuted, size: 11 }); }
      for (var p = 0; p <= 360; p += 60) txt(p + '°', X(p), y0 + h + 12, { color: T.figMuted, size: 11 });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.4; ctx.beginPath();
      for (p = 0; p <= 360; p += 2) { if (p) ctx.lineTo(X(p), Y(V(p))); else ctx.moveTo(X(p), Y(V(p))); }
      ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(X(st.phi), Y(V(st.phi)), 6, 0, Math.PI * 2); ctx.fill();
      txt('V (kJ/mol)', x0 - 4, y0 - 10, { align: 'right', color: T.figMuted, size: 11 });
      txt('이면각 φ', x0 + w, y0 + h + 28, { align: 'right', color: T.figMuted, size: 11 });
      txt(st.ethane ? 'V = 6(1 + cos 3φ)' : 'V = 9.77 + 2.27cosφ − 0.27cos2φ + 7.23cos3φ', x0 + w / 2, y0 - 26, { size: 11, color: T.figInk });
    }
    function bars(x0, y0, w, h) {
      var P = pops(), items = st.ethane ? [['엇갈림 60°', P.g1], ['엇갈림 180°', P.anti], ['엇갈림 300°', P.g2]] : [['고시 60°', P.g1], ['안티 180°', P.anti], ['고시 300°', P.g2]];
      var lab = 92, bw = w - lab - 60;
      txt(st.ethane ? '에테인: 세 엇갈린 형태의 비율 (T = ' + st.T.toFixed(0) + ' K)' : '볼츠만 분포: 안티 ' + (P.anti * 100).toFixed(0) + ' %, 고시(합) ' + ((P.g1 + P.g2) * 100).toFixed(0) + ' %  (T = ' + st.T.toFixed(0) + ' K)', x0, y0, { align: 'left', bold: true, size: 13 });
      var rowh = Math.min(24, (h - 18) / 3);
      items.forEach(function (it, i) {
        var y = y0 + 16 + i * rowh;
        txt(it[0], x0 + lab - 8, y + rowh / 2 - 2, { align: 'right', size: 12 });
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.fillRect(x0 + lab, y, bw, rowh - 6); ctx.strokeRect(x0 + lab, y, bw, rowh - 6);
        ctx.fillStyle = (it[0].indexOf('안티') >= 0) ? T.figBlue : (st.ethane ? T.figTeal : T.figAmber);
        ctx.fillRect(x0 + lab, y, bw * it[1], rowh - 6);
        txt((it[1] * 100).toFixed(1) + ' %', x0 + lab + bw + 8, y + rowh / 2 - 2, { align: 'left', size: 12 });
      });
    }
    function draw() {
      T = api.tokens();
      var w = cv.w, h = cv.h, small = w < 560;
      ctx.clearRect(0, 0, w, h);
      if (!small) {
        var top = h * 0.66;
        newman(w * 0.15, top * 0.45, Math.min(w, top) * 0.075);
        model(w * 0.42, top * 0.45, Math.min(w * 0.07, top * 0.15));
        curve(w * 0.64, 48, w * 0.34, top - 90);
        bars(16, top + 6, w - 32, h - top - 12);
      } else {
        newman(w * 0.26, h * 0.13, w * 0.06);
        model(w * 0.72, h * 0.13, w * 0.1);
        curve(46, h * 0.33, w - 64, h * 0.28);
        bars(10, h * 0.73, w - 20, h * 0.26);
      }
      var P = pops();
      rPhi.set(st.phi.toFixed(0) + '°'); rV.set(V(st.phi).toFixed(1) + ' kJ/mol'); rName.set(name(st.phi));
      rPop.set(st.ethane ? '세 형태 각각 33.3 %' : '안티 ' + (P.anti * 100).toFixed(0) + ' % · 고시 ' + ((P.g1 + P.g2) * 100).toFixed(0) + ' %');
    }
    api.onResize(draw);
    draw();
  },
});
