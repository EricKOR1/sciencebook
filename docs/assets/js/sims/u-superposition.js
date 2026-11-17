/* 일반물리학 6 중첩: 같은 방향 두 파동(위상차 → 합성 진폭)과 반대 방향 두 파동(정상파)의 합 */
Sims.register('u-superposition', {
  title: '두 파동을 더하면 — 간섭과 정상파',
  caption: '파란 파동은 늘 오른쪽으로 진행한다. \'반대 방향\'에서는 빨간 파동이 왼쪽으로 진행하고, 둘의 합(아래)은 더 이상 진행하지 않고 제자리에서 진동하는 정상파 2y_m sin kx cos ωt가 된다. 마디(N)는 늘 정지해 있고, 위상차를 바꾸면 마디의 자리만 옮겨 간다. 빨간 파동의 진폭을 줄이면 마디에서도 진폭 (1 − r)이 남는 부분 정상파가 된다. \'같은 방향\'에서는 합성파도 진행파이고, 그 진폭은 오른쪽 위상자 그림처럼 √(1 + r² + 2r cos φ)이다. 진폭은 파란 파동의 진폭 y_m을 1로 잡았다.',
  init: function (api) {
    var st = { opp: true, phi: 0, r: 1, t: 0 };
    var PER = 2.4;   // 화면에서 한 주기(초)
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.62; }, label: '두 파동과 그 합의 그래프' });
    var ctx = cv.ctx;
    var rA = api.readout('합성 진폭');
    var rB = api.readout('상태');

    var g1 = api.group();
    var bOpp = api.button('반대 방향(정상파)', function () { st.opp = true; sync(); }, { toggle: true, pressed: true, parent: g1 });
    var bSame = api.button('같은 방향(간섭)', function () { st.opp = false; sync(); }, { toggle: true, pressed: false, parent: g1 });
    api.slider({ id: 'u-superposition-phi', label: '위상차 φ', min: 0, max: 360, step: 5, value: 0,
      format: function (v) { return v + '°'; }, onInput: function (v) { st.phi = v * Math.PI / 180; update(); } });
    api.slider({ id: 'u-superposition-r', label: '빨간 파동 진폭 r', min: 0, max: 1, step: 0.05, value: 1,
      format: function (v) { return v.toFixed(2) + ' y_m'; }, onInput: function (v) { st.r = v; update(); } });
    var g2 = api.group();
    var bPlay = api.button(api.reduced ? '재생' : '멈춤', function () {
      if (loop.wanted) { loop.pause(); bPlay.textContent = '재생'; } else { loop.play(); bPlay.textContent = '멈춤'; }
    }, { parent: g2 });
    api.button('1/8 주기 앞으로', function () { st.t += PER / 8; update(); }, { parent: g2 });

    function sync() { bOpp.setAttribute('aria-pressed', st.opp ? 'true' : 'false'); bSame.setAttribute('aria-pressed', st.opp ? 'false' : 'true'); update(); }
    var loop = api.loop(function (dt) { st.t += dt; update(); });

    function update() {
      var r = st.r, phi = st.phi;
      if (st.opp) {
        rA.set('위치마다 다름: 최대 ' + (1 + r).toFixed(2) + ', 최소 ' + (1 - r).toFixed(2) + ' (y_m 단위)');
        // 레이블 바꾸기
        rB.set(r > 0.999 ? '마디 간격 λ/2, 마디는 늘 정지' : '마디에서도 진동이 남는다(부분 정상파)');
      } else {
        var A = Math.sqrt(1 + r * r + 2 * r * Math.cos(phi));
        rA.set(A.toFixed(2) + ' y_m');
        rB.set(Math.abs(A - (1 + r)) < 0.01 ? '완전 보강 간섭' : (A < 0.01 ? '완전 상쇄 간섭' : '진행파(합도 오른쪽으로 진행)'));
      }
      draw();
    }

    function draw() {
      var T = api.tokens(), W = cv.w, H = cv.h, narrow = W < 560;
      ctx.clearRect(0, 0, W, H);
      var w = 2 * Math.PI / PER, k = 2 * Math.PI, t = st.t, r = st.r, phi = st.phi;   // 파장 = 1(화면 x 단위)
      var showPh = !st.opp;
      var plotW = showPh && !narrow ? W * 0.74 : W;
      var phB = showPh ? (narrow ? { x: W - 120, y: H * 0.62, s: 110 } : { x: W * 0.76, y: H * 0.3, s: W * 0.22 }) : null;
      var L = 40, R = plotW - 12, X = function (x) { return L + x / 2 * (R - L); };
      var rows = [
        { y: H * 0.14, amp: 1, lab: '파동 1 →', col: T.figBlue, fn: function (x) { return Math.sin(k * x - w * t); } },
        { y: H * 0.38, amp: 1, lab: st.opp ? '← 파동 2' : '파동 2 →', col: T.figRed, fn: function (x) { return r * (st.opp ? Math.sin(k * x + w * t + phi) : Math.sin(k * x - w * t + phi)); } },
        { y: H * 0.74, amp: 2, lab: '합 y₁ + y₂', col: T.figViolet, fn: null },
      ];
      var unit = Math.min(H * 0.085, 34);
      rows.forEach(function (row, i) {
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, row.y); ctx.lineTo(R, row.y); ctx.stroke();
        ctx.fillStyle = row.col; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(row.lab, L, row.y - (i === 2 ? 2.25 : 1.2) * unit - 4);
      });
      // 합의 포락선
      var sumRow = rows[2];
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
      [1, -1].forEach(function (sg) {
        ctx.beginPath();
        for (var i = 0; i <= 200; i++) {
          var x = 2 * i / 200, A = st.opp ? Math.sqrt(Math.max(0, 1 + r * r - 2 * r * Math.cos(2 * k * x + phi))) : Math.sqrt(1 + r * r + 2 * r * Math.cos(phi));
          var yy = sumRow.y - sg * A * unit;
          if (i === 0) ctx.moveTo(X(x), yy); else ctx.lineTo(X(x), yy);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // 곡선
      function curve(fn, y0, col, lw) {
        ctx.beginPath();
        for (var i = 0; i <= 300; i++) { var x = 2 * i / 300, yy = y0 - fn(x) * unit; if (i === 0) ctx.moveTo(X(x), yy); else ctx.lineTo(X(x), yy); }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      }
      curve(rows[0].fn, rows[0].y, T.figBlue, 2.2);
      curve(rows[1].fn, rows[1].y, T.figRed, 2.2);
      curve(rows[0].fn, sumRow.y, T.figBlue, 1); curve(rows[1].fn, sumRow.y, T.figRed, 1);
      curve(function (x) { return rows[0].fn(x) + rows[1].fn(x); }, sumRow.y, T.figViolet, 3);
      // 마디·배 표시(반대 방향)
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      if (st.opp && r > 0.05) {
        for (var n = -2; n <= 6; n++) {
          var xn = (2 * Math.PI * n - phi) / (2 * k);          // 진폭 최소(마디)
          var xa = xn + 0.25;                                  // 진폭 최대(배)
          if (xn >= -1e-6 && xn <= 2 + 1e-6) {
            ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(X(xn), sumRow.y, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillText('N', X(xn), sumRow.y + 2 * unit + 18);
          }
          if (xa >= 0 && xa <= 2) { ctx.fillStyle = T.figMuted; ctx.fillText('A', X(xa), sumRow.y + 2 * unit + 18); }
        }
      }
      // 매질 한 점의 운동
      var xp = 0.6, yp = rows[0].fn(xp) + rows[1].fn(xp);
      ctx.beginPath(); ctx.arc(X(xp), sumRow.y - yp * unit, 5, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('점선: 각 위치의 진폭   ● 매질의 한 점', R, sumRow.y - 2.25 * unit - 4);
      ctx.textAlign = 'left'; ctx.fillText('λ', X(1) - 3, rows[0].y + unit + 16);
      ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(X(0), rows[0].y + unit + 6); ctx.lineTo(X(1), rows[0].y + unit + 6); ctx.stroke();
      // 위상자 그림(같은 방향)
      if (phB) {
        var cx = phB.x + phB.s * 0.25, cy = phB.y + phB.s * 0.55, sc = phB.s * 0.36;
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('위상자', phB.x, phB.y);
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 2.2 * sc, cy); ctx.stroke();
        var p1 = [cx + sc, cy], p2 = [p1[0] + r * sc * Math.cos(phi), p1[1] - r * sc * Math.sin(phi)];
        arrow(cx, cy, p1[0], p1[1], T.figBlue); arrow(p1[0], p1[1], p2[0], p2[1], T.figRed); arrow(cx, cy, p2[0], p2[1], T.figViolet);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('φ', p1[0] + 10, p1[1] - 4);
      }
    }
    function arrow(x1, y1, x2, y2, col) {
      var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy); if (l < 3) return;
      var ux = dx / l, uy = dy / l, hd = Math.min(8, l * 0.5);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hd, y2 - uy * hd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hd - uy * hd * 0.5, y2 - uy * hd + ux * hd * 0.5);
      ctx.lineTo(x2 - ux * hd + uy * hd * 0.5, y2 - uy * hd - ux * hd * 0.5); ctx.closePath(); ctx.fill();
    }
    api.onResize(update);
    update();
  },
});
