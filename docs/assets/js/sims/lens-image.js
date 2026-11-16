/* 전자기와 양자 2 렌즈: 볼록·오목 렌즈의 대표 광선 세 개와 상의 위치·크기·종류 (렌즈 공식은 화면에 넣지 않음) */
Sims.register('lens-image', {
  title: '렌즈가 만드는 상 — 대표 광선 세 개로 찾기',
  caption: '물체(초록 화살표)를 끌어 옮기거나 슬라이더로 렌즈와의 거리를 바꾸어 보자. 축에 나란히 들어온 광선, 렌즈 중심을 지나는 광선, 초점을 지나거나(볼록) 초점을 향하는(오목) 광선이 실제로 만나는 곳에는 실상이, 거꾸로 연장한 선(점선)이 만나는 곳에는 허상이 생긴다. 볼록 렌즈는 물체가 초점 밖에 있으면 거꾸로 선 실상, 초점 안에 있으면 바로 선 확대된 허상을 만들고, 오목 렌즈는 언제나 바로 선 축소된 허상을 만든다. 렌즈는 두께를 무시한 얇은 렌즈로 보고, 빛이 렌즈 가운데 면에서 한 번 꺾인다고 단순화했다.',
  init: function (api) {
    var st = { a: 2.5, convex: true };       // a: 물체 거리(초점거리 단위)
    var H = 0.75;                            // 물체 높이(초점거리 단위)
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.85 : 0.48; }, label: '렌즈의 광선 추적과 상' });
    var ctx = cv.ctx;
    var rKind = api.readout('상의 종류');
    var rUp = api.readout('상의 방향');
    var rSize = api.readout('상의 크기');
    var rPos = api.readout('상의 위치');

    var g1 = api.group();
    var bCx = api.button('볼록 렌즈', function () { setLens(true); }, { toggle: true, pressed: true, parent: g1 });
    var bCc = api.button('오목 렌즈', function () { setLens(false); }, { toggle: true, parent: g1 });
    function setLens(c) { st.convex = c; bCx.setAttribute('aria-pressed', c ? 'true' : 'false'); bCc.setAttribute('aria-pressed', c ? 'false' : 'true'); draw(); }
    var sl = api.slider({ id: 'lens-image-a', label: '물체와 렌즈 사이 거리', min: 0.3, max: 4.5, step: 0.05, value: st.a,
      format: function (v) { return '초점거리의 ' + v.toFixed(2) + '배'; }, onInput: function (v) { st.a = v; draw(); } });

    function view() {
      var w = cv.w, h = cv.h, sc = Math.min(w / 10.4, h / 3.2);
      return { sc: sc, X: function (x) { return w / 2 + x * sc; }, Y: function (y) { return h / 2 - y * sc; } };
    }
    function image() {
      var f = st.convex ? 1 : -1, a = st.a;
      if (Math.abs(a - f) < 1e-3) return null;
      var b = a * f / (a - f), m = -b / a;
      return { b: b, m: m };
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, V = view(), sc = V.sc;
      ctx.clearRect(0, 0, w, h);
      // 광축과 초점
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, V.Y(0)); ctx.lineTo(w, V.Y(0)); ctx.stroke();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      [[-2, '2F'], [-1, 'F'], [1, 'F′'], [2, '2F′']].forEach(function (p) {
        var x = V.X(p[0]); ctx.beginPath(); ctx.arc(x, V.Y(0), 3, 0, Math.PI * 2); ctx.fill(); ctx.fillText(p[1], x, V.Y(0) + 17);
      });
      // 렌즈
      var lh = 1.45 * sc, x0 = V.X(0), y0 = V.Y(0);
      ctx.beginPath();
      if (st.convex) { ctx.moveTo(x0, y0 - lh); ctx.quadraticCurveTo(x0 + 22, y0, x0, y0 + lh); ctx.quadraticCurveTo(x0 - 22, y0, x0, y0 - lh); }
      else { ctx.moveTo(x0 - 11, y0 - lh); ctx.lineTo(x0 + 11, y0 - lh); ctx.quadraticCurveTo(x0 - 2, y0, x0 + 11, y0 + lh); ctx.lineTo(x0 - 11, y0 + lh); ctx.quadraticCurveTo(x0 + 2, y0, x0 - 11, y0 - lh); }
      ctx.fillStyle = T.figSoftBlue; ctx.fill(); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = T.figBlue; ctx.textAlign = 'center'; ctx.fillText(st.convex ? '볼록 렌즈' : '오목 렌즈', x0, y0 - lh - 8);

      var a = st.a, f = st.convex ? 1 : -1, top = [-a, H], im = image();
      var right = (w / 2) / sc, left = -right;
      var cols = [T.figRed, T.figAmber, T.figViolet];
      // 광선 세 개: 렌즈에서 꺾이는 높이와 꺾인 뒤 방향
      var rays = [];
      // ① 축에 나란히 → (볼록) F′을 지남 / (오목) F에서 나온 것처럼 퍼짐 :  꺾인 뒤 방향은 (1, −y/f)
      rays.push({ y: H, d: [1, -H / f] });
      // ② 렌즈 중심 → 그대로
      rays.push({ y: 0, d: [a, -H] });
      // ③ (볼록) F를 지나 들어옴 / (오목) F′을 향해 들어옴 → 꺾인 뒤 축에 나란히
      var y3 = H * f / (f - a);
      if (isFinite(y3) && Math.abs(y3) < 3.2) rays.push({ y: y3, d: [1, 0] });
      else rays.push(null);
      rays.forEach(function (r, i) {
        if (!r) return;
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 2;
        line(top[0], top[1], 0, r.y);                              // 렌즈까지
        var L = Math.hypot(r.d[0], r.d[1]), ux = r.d[0] / L, uy = r.d[1] / L, s = (right - 0) / Math.max(ux, 1e-6);
        line(0, r.y, ux * s, r.y + uy * s);                        // 꺾인 뒤
        if (i === 2) {                                             // 들어오는 쪽 보조선: 초점까지
          ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
          if (st.convex && a < 1) line(-1, 0, top[0], top[1]);
          if (!st.convex) line(0, r.y, 1, 0);
          ctx.setLineDash([]);
        }
        // 허상: 꺾인 광선을 거꾸로 연장
        if (im && im.b < 0) {
          ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; ctx.globalAlpha = 0.85;
          var sb = Math.max(left, im.b - 1) / ux;
          line(0, r.y, ux * sb, r.y + uy * sb);
          ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
      });
      // 물체
      arrowUp(-a, H, T.figGreen, false);
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'center'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('물체', V.X(-a), V.Y(0) + 32);
      // 상
      if (im) {
        var ih = im.m * H, onScreen = Math.abs(im.b) < right - 0.1 && Math.abs(ih) < 1.55;
        if (onScreen) {
          arrowUp(im.b, ih, im.b > 0 ? T.figRed : T.figViolet, im.b < 0);
          ctx.fillStyle = im.b > 0 ? T.figRed : T.figViolet; ctx.textAlign = 'center';
          ctx.fillText(im.b > 0 ? '실상' : '허상', V.X(im.b), ih > 0 ? V.Y(0) + 32 : V.Y(0) - 10);
        } else {
          ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.font = '12px ' + T.fontBody;
          ctx.fillText('상이 화면 밖에 생긴다', w - 10, 16);
        }
      }
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('물체를 끌어 옮겨 보자', 10, 16);
      // 읽은 값
      if (!im) { rKind.set('상이 생기지 않음'); rUp.set('나오는 빛이 나란함'); rSize.set('–'); rPos.set('–'); return; }
      rKind.set(im.b > 0 ? '실상 (빛이 실제로 모임)' : '허상 (연장선이 만남)');
      rUp.set(im.m > 0 ? '바로 선 상' : '거꾸로 선 상');
      var mm = Math.abs(im.m);
      rSize.set(Math.abs(mm - 1) < 0.03 ? '물체와 같음' : (mm > 1 ? '확대' : '축소') + ' (약 ' + (mm >= 10 ? mm.toFixed(0) : mm.toFixed(1)) + '배)');
      var ab = Math.abs(im.b);
      rPos.set('렌즈 ' + (im.b > 0 ? '오른쪽' : '왼쪽(물체 쪽)') + ', 초점거리의 ' + (ab >= 10 ? ab.toFixed(0) : ab.toFixed(1)) + '배');

      function line(xa, ya, xb, yb) { ctx.beginPath(); ctx.moveTo(V.X(xa), V.Y(ya)); ctx.lineTo(V.X(xb), V.Y(yb)); ctx.stroke(); }
      function arrowUp(x, hgt, col, dashed) {
        var px = V.X(x), yb = V.Y(0), yt = V.Y(hgt), dir = hgt > 0 ? 1 : -1;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.setLineDash(dashed ? [5, 4] : []);
        ctx.beginPath(); ctx.moveTo(px, yb); ctx.lineTo(px, yt + dir * 8); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(px, yt); ctx.lineTo(px - 7, yt + dir * 11); ctx.lineTo(px + 7, yt + dir * 11); ctx.closePath(); ctx.fill();
      }
    }
    // 물체 끌기
    var drag = false;
    function setA(e) {
      var r = cv.canvas.getBoundingClientRect(), V = view(), px = (e.clientX - r.left) * cv.w / r.width;
      var a = -(px - cv.w / 2) / V.sc; sl.set(Math.max(0.3, Math.min(4.5, Math.round(a * 20) / 20)));
    }
    cv.canvas.addEventListener('pointerdown', function (e) {
      var r = cv.canvas.getBoundingClientRect(), V = view(), px = (e.clientX - r.left) * cv.w / r.width;
      if (px > cv.w / 2) return;
      drag = true; try { cv.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } setA(e);
    });
    cv.canvas.addEventListener('pointermove', function (e) { if (drag) setA(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.canvas.addEventListener(ev, function () { drag = false; }); });
    cv.canvas.style.cursor = 'ew-resize';
    api.onResize(draw);
    draw();
  },
});
