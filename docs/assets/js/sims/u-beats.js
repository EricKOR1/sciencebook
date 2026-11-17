/* 일반물리학 6 맥놀이: 440 Hz와 조금 다른 진동수의 합 — 포락선과 맥놀이 진동수 |f1 − f2| */
Sims.register('u-beats', {
  title: '맥놀이 — 진동수 차이만큼 커졌다 작아지는 소리',
  caption: '440 Hz 소리굽쇠와 조율 중인 현의 소리가 한 점(귀)에서 겹친다. 현의 진동수 f₂를 바꾸어 보자. 위 그래프는 1초 동안의 합성 파형으로, 진폭이 2s_m|cos(π(f₁ − f₂)t)|를 따라 커졌다 작아진다. 1초에 커지는 횟수가 맥놀이 진동수 |f₁ − f₂|이다. 아래는 세로 막대가 있는 순간 부근 10 ms를 확대한 것으로, 소리가 클 때는 두 파동의 위상이 맞고 작을 때는 반대이다. \'소리로 듣기\'로 실제 소리도 들을 수 있다(두 소리의 진폭은 같다고 가정).',
  init: function (api) {
    var F1 = 440, WIN = 1.0, ZOOM = 0.010;
    var st = { f2: 443, tc: 0.0, playing: !api.reduced };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.56; }, label: '1초 동안의 합성 파형과 확대한 파형' });
    var ctx = cv.ctx;
    var rB = api.readout('맥놀이 진동수 |f₁ − f₂|');
    var rP = api.readout('맥놀이 주기');
    var rM = api.readout('들리는 음의 진동수 (f₁ + f₂)/2');

    api.slider({ id: 'u-beats-f2', label: '현의 진동수 f₂', min: 430, max: 450, step: 0.5, value: st.f2,
      format: function (v) { return v.toFixed(1) + ' Hz'; }, onInput: function (v) { st.f2 = v; update(); if (audio) audio.o2.frequency.value = v; } });
    var g = api.group();
    var bPlay = api.button(api.reduced ? '재생' : '멈춤', function () {
      if (loop.wanted) { loop.pause(); bPlay.textContent = '재생'; } else { loop.play(); bPlay.textContent = '멈춤'; }
    }, { parent: g });
    var bSnd = api.button('소리로 듣기', function () { toggleSound(); }, { toggle: true, pressed: false, parent: g });
    api.button('440 Hz에 맞추기', function () { var s = api.controls.querySelector('#u-beats-f2'); s.value = 440; s.dispatchEvent(new Event('input')); }, { parent: g });

    var audio = null;
    function toggleSound() {
      if (audio) { try { audio.o1.stop(); audio.o2.stop(); audio.ac.close(); } catch (e) { /* 이미 멈춤 */ } audio = null; bSnd.setAttribute('aria-pressed', 'false'); return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var ac = new AC(), gain = ac.createGain(); gain.gain.value = 0.08; gain.connect(ac.destination);
      var o1 = ac.createOscillator(), o2 = ac.createOscillator();
      o1.frequency.value = F1; o2.frequency.value = st.f2; o1.connect(gain); o2.connect(gain); o1.start(); o2.start();
      audio = { ac: ac, o1: o1, o2: o2 }; bSnd.setAttribute('aria-pressed', 'true');
    }

    var loop = api.loop(function (dt) { st.tc += dt; if (st.tc > WIN) st.tc -= WIN; draw(); });
    if (api.reduced) st.tc = 0.17;

    function s(t) { return Math.cos(2 * Math.PI * F1 * t) + Math.cos(2 * Math.PI * st.f2 * t); }
    function update() {
      var d = Math.abs(F1 - st.f2);
      rB.set(d.toFixed(1) + ' Hz');
      rP.set(d > 0 ? (1 / d).toFixed(2) + ' s' : '맥놀이 없음');
      rM.set(((F1 + st.f2) / 2).toFixed(2) + ' Hz');
      draw();
    }
    function draw() {
      var T = api.tokens(), W = cv.w, H = cv.h, narrow = W < 560;
      ctx.clearRect(0, 0, W, H);
      var L = 44, R = W - 12;
      // 위: 1초 전체
      var top = { y: 22, h: H * 0.42 }, mid = top.y + top.h / 2, amp = top.h / 2 * 0.9 / 2;
      var X = function (t) { return L + t / WIN * (R - L); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, mid); ctx.lineTo(R, mid); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('합성 파형 s₁ + s₂ (1초 동안)', L, 14);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      ctx.fillText('+2', L - 6, mid - 2 * amp + 4); ctx.fillText('0', L - 6, mid + 4); ctx.fillText('−2', L - 6, mid + 2 * amp + 4);
      ctx.textAlign = 'center';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) { ctx.fillText(t + ' s', X(t), top.y + top.h + 14); });
      // 픽셀 열마다 최솟값·최댓값(빽빽한 440 Hz 파형)
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var px = L; px < R; px++) {
        var ta = (px - L) / (R - L) * WIN, tb = (px + 1 - L) / (R - L) * WIN, mn = 9, mx = -9;
        for (var j = 0; j <= 14; j++) { var v = s(ta + (tb - ta) * j / 14); if (v < mn) mn = v; if (v > mx) mx = v; }
        ctx.moveTo(px + 0.5, mid - mx * amp); ctx.lineTo(px + 0.5, mid - mn * amp);
      }
      ctx.stroke();
      // 포락선
      var d = F1 - st.f2;
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      [1, -1].forEach(function (sg) {
        ctx.beginPath();
        for (var i = 0; i <= 400; i++) { var t = WIN * i / 400, e = 2 * Math.abs(Math.cos(Math.PI * d * t)); var yy = mid - sg * e * amp; if (i === 0) ctx.moveTo(X(t), yy); else ctx.lineTo(X(t), yy); }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = T.figAmber; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(narrow ? '점선: 포락선' : '포락선 ±2|cos(π(f₁ − f₂)t)|', R, 14);
      // 커서
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(st.tc), top.y); ctx.lineTo(X(st.tc), top.y + top.h); ctx.stroke();
      // 아래: 확대
      var zt = top.y + top.h + 46, zh = H - zt - 34, zm = zt + zh / 2, za = zh / 2 * 0.9 / 2;
      var t0 = st.tc - ZOOM / 2, Z = function (t) { return L + (t - t0) / ZOOM * (R - L); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, zm); ctx.lineTo(R, zm); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('막대 위치 부근 10 ms 확대 (t = ' + st.tc.toFixed(3) + ' s)', L, zt - 8);
      function zc(fn, col, lw) {
        ctx.beginPath();
        for (var i = 0; i <= 400; i++) { var t = t0 + ZOOM * i / 400, yy = zm - fn(t) * za; if (i === 0) ctx.moveTo(Z(t), yy); else ctx.lineTo(Z(t), yy); }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      }
      zc(function (t) { return Math.cos(2 * Math.PI * F1 * t); }, T.figBlue, 1.4);
      zc(function (t) { return Math.cos(2 * Math.PI * st.f2 * t); }, T.figRed, 1.4);
      zc(s, T.figViolet, 2.8);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = L, ly = H - 10;
      [['s₁ (440 Hz)', T.figBlue], ['s₂ (' + st.f2.toFixed(1) + ' Hz)', T.figRed], ['합', T.figViolet]].forEach(function (it) {
        ctx.fillStyle = it[1]; ctx.fillRect(lx, ly - 9, 14, 4); ctx.fillText(it[0], lx + 18, ly - 3); lx += ctx.measureText(it[0]).width + 34;
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      ctx.fillText('+2', L - 6, zm - 2 * za + 4); ctx.fillText('−2', L - 6, zm + 2 * za + 4);
    }
    api.onResize(update);
    update();
  },
});
