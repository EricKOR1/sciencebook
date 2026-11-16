/* 중2-3 빛과 파동: 입사각을 바꾸며 반사(입사각 = 반사각)와 굴절(꺾이는 방향)을 비교한다 */
Sims.register('reflect-refract', {
  title: '경계면에서 빛은 어디로 갈까? — 반사와 굴절',
  caption: '입사각 슬라이더를 움직여 보고, 빛이 공기에서 물로 갈 때와 물에서 공기로 갈 때를 바꿔 보자. 반사각은 언제나 입사각과 같고, 굴절 광선은 공기 → 물에서는 법선 쪽으로, 물 → 공기에서는 법선에서 멀어지게 꺾인다. 각은 모두 법선을 기준으로 잰다. 경계면에서는 실제로 빛의 일부만 반사되지만 잘 보이도록 반사 광선도 함께 그렸고, 꺾이는 정도는 물의 실제 성질에 맞춰 계산했다.',
  init: function (api) {
    var N_WATER = 1.33;
    var state = { i: 40, mode: 'aw' };   // aw: 공기 → 물, wa: 물 → 공기
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.0 : 0.6; }, label: '공기와 물의 경계면에서 빛의 반사와 굴절' });
    var ctx = cv.ctx;

    var rI = api.readout('입사각');
    var rR = api.readout('반사각');
    var rT = api.readout('굴절각');
    var rDir = api.readout('굴절 광선이 꺾이는 방향');

    var g = api.group();
    var bAW = api.button('공기 → 물', function () { setMode('aw'); }, { toggle: true, pressed: true, parent: g });
    var bWA = api.button('물 → 공기', function () { setMode('wa'); }, { toggle: true, parent: g });
    api.slider({ id: 'reflect-refract-angle', label: '입사각', min: 0, max: 80, step: 1, value: state.i,
      format: function (v) { return v + '°'; }, onInput: function (v) { state.i = v; draw(); } });

    function setMode(m) {
      state.mode = m;
      bAW.setAttribute('aria-pressed', m === 'aw' ? 'true' : 'false');
      bWA.setAttribute('aria-pressed', m === 'wa' ? 'true' : 'false');
      draw();
    }
    function rad(d) { return d * Math.PI / 180; }
    function deg(r) { return r * 180 / Math.PI; }
    // 굴절각(도). 물 → 공기에서 나갈 수 없으면 null
    function refrAngle() {
      var s = state.mode === 'aw' ? Math.sin(rad(state.i)) / N_WATER : Math.sin(rad(state.i)) * N_WATER;
      return s > 1 ? null : deg(Math.asin(s));
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      var ox = w / 2, oy = h * 0.5;
      var L = Math.min(w * 0.42, h * 0.36);
      var fs = narrow ? 12 : 13;
      ctx.clearRect(0, 0, w, h);
      // 물(아래쪽)과 공기(위쪽)
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(0, oy, w, h - oy);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + (fs + 1) + 'px ' + T.fontBody;
      ctx.fillText('공기', 12, 22); ctx.fillText('물', 12, oy + 22);
      ctx.fillStyle = T.figMuted; ctx.font = fs - 1 + 'px ' + T.fontBody;
      ctx.fillText('빛이 더 빠르다', 12, 40); ctx.fillText('빛이 더 느리다', 12, oy + 40);
      ctx.textAlign = 'right'; ctx.fillText('경계면', w - 10, oy - 6);
      // 법선
      ctx.setLineDash([6, 5]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(ox, oy - L - 8); ctx.lineTo(ox, oy + L + 8); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = fs - 1 + 'px ' + T.fontBody;
      ctx.fillText('법선', ox + 6, Math.max(14, oy - L - 2));

      var i = rad(state.i), up = state.mode === 'aw' ? -1 : 1;   // up: 입사 광선이 있는 쪽(-1 위, +1 아래)
      var r = refrAngle();
      var src = [ox - L * Math.sin(i), oy + up * L * Math.cos(i)];
      var refl = [ox + L * Math.sin(i), oy + up * L * Math.cos(i)];
      var straight = [ox + L * Math.sin(i), oy - up * L * Math.cos(i)];
      var cIn = T.figRed, cRefl = T.figViolet, cRefr = T.figGreen;

      // 꺾이지 않았다면 (입사 광선의 연장)
      if (state.i > 0 && r !== null) {
        ctx.setLineDash([3, 5]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(straight[0], straight[1]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figMuted; ctx.font = fs - 1 + 'px ' + T.fontBody; ctx.textAlign = 'center';
        var sl = [ox + (L + 4) * Math.sin(i), oy - up * (L + 4) * Math.cos(i)];
        ctx.fillText('꺾이지 않았다면', Math.min(w - 50, Math.max(50, sl[0])), sl[1] + (up < 0 ? 16 : -8));
      }
      // 광원
      ctx.fillStyle = cIn; ctx.beginPath(); ctx.arc(src[0], src[1], 6, 0, Math.PI * 2); ctx.fill();
      ray(src, [ox, oy], cIn, 3, 1);
      ray([ox, oy], refl, cRefl, r === null ? 3 : 2.4, r === null ? 1 : 0.75);
      var refr = null;
      if (r !== null) {
        var rr = rad(r);
        refr = [ox + L * Math.sin(rr), oy - up * L * Math.cos(rr)];
        ray([ox, oy], refr, cRefr, 3, 1);
      }
      // 각 표시
      var R0 = Math.min(56, L * 0.36);
      var nIn = up < 0 ? -Math.PI / 2 : Math.PI / 2, nOut = -nIn;
      if (state.i > 0) {
        arc(nIn, Math.atan2(src[1] - oy, src[0] - ox), R0, cIn, '입사각 ' + state.i + '°', fs, T);
        arc(nIn, Math.atan2(refl[1] - oy, refl[0] - ox), R0 + 16, cRefl, '반사각 ' + state.i + '°', fs, T);
        if (refr && r > 0.5) arc(nOut, Math.atan2(refr[1] - oy, refr[0] - ox), R0, cRefr, '굴절각 ' + Math.round(r) + '°', fs, T);
      }
      // 광선 이름
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
      label('입사 광선', src, cIn, up);
      label('반사 광선', refl, cRefl, up);
      if (refr) label('굴절 광선', refr, cRefr, -up);
      // 아래 설명
      var msg;
      if (r === null) msg = '물 → 공기: 입사각이 약 49°보다 크면 빛이 공기로 나가지 못하고 모두 반사된다';
      else if (state.i === 0) msg = '경계면에 수직으로 들어오면 꺾이지 않고 곧게 지난다';
      else if (state.mode === 'aw') msg = '공기 → 물: 법선 쪽으로 꺾인다 (입사각 > 굴절각)';
      else msg = '물 → 공기: 법선에서 멀어지게 꺾인다 (입사각 < 굴절각)';
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
      wrap(msg, w / 2, h - 8, w - 24, fs + 4);

      rI.set(state.i + '°'); rR.set(state.i + '° (입사각과 같다)');
      if (r === null) { rT.set('굴절 광선 없음'); rDir.set('모두 반사된다'); }
      else if (state.i === 0) { rT.set('0°'); rDir.set('꺾이지 않는다'); }
      else { rT.set('약 ' + Math.round(r) + '°'); rDir.set(state.mode === 'aw' ? '법선 쪽으로' : '법선에서 멀어지게'); }

      function ray(a, b, color, lw, alpha) {
        ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        // 가운데 화살촉
        var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hs = 11;
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(mx + hs * 0.6 * Math.cos(ang), my + hs * 0.6 * Math.sin(ang));
        ctx.lineTo(mx - hs * Math.cos(ang - 0.45), my - hs * Math.sin(ang - 0.45));
        ctx.lineTo(mx - hs * Math.cos(ang + 0.45), my - hs * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
      function label(text, p, color, side) {
        ctx.fillStyle = color;
        var x = Math.min(w - 40, Math.max(40, p[0])), y = p[1] + (side < 0 ? -10 : 18);
        if (Math.abs(p[1] - oy) < 24) y = p[1] + (side < 0 ? -14 : 22);
        ctx.fillText(text, x, y);
      }
    }
    function arc(a1, a2, R, color, text, fs, T) {
      var d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.arc(cv.w / 2, cv.h * 0.5, R, d > 0 ? a1 : a1 + d, d > 0 ? a1 + d : a1); ctx.stroke();
      var mid = a1 + d / 2, lx = cv.w / 2 + (R + 10) * Math.cos(mid), ly = cv.h * 0.5 + (R + 10) * Math.sin(mid);
      ctx.font = fs - 1 + 'px ' + T.fontBody; ctx.fillStyle = color; ctx.textBaseline = 'middle';
      ctx.textAlign = Math.cos(mid) < -0.05 ? 'right' : Math.cos(mid) > 0.05 ? 'left' : 'center';
      ctx.fillText(text, lx, ly); ctx.textBaseline = 'alphabetic';
    }
    function wrap(text, x, y, maxW, lh) {
      if (ctx.measureText(text).width <= maxW) { ctx.fillText(text, x, y); return; }
      var cut = text.indexOf(':') + 1 || Math.floor(text.length / 2);
      ctx.fillText(text.slice(0, cut).trim(), x, y - lh);
      ctx.fillText(text.slice(cut).trim(), x, y);
    }
    api.onResize(draw);
    draw();
  },
});
