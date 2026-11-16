/* 중2-3 빛과 파동: 진폭·진동수·파형을 바꾸며 소리의 크기·높낮이·맵시를 비교한다 */
Sims.register('sound-wave', {
  title: '소리를 그래프로 보기 — 진폭, 진동수, 파형',
  caption: '진폭 슬라이더로 위아래 출렁임을, 진동수 슬라이더로 같은 시간 동안의 물결 수를 바꿔 보자. 진폭이 클수록 큰 소리, 진동수가 클수록 높은 소리이다. 파형 버튼을 누르면 진폭과 진동수가 같아도 모양이 다른 파형이 나타나는데, 이 차이가 소리의 맵시(음색)이다. 악기의 파형은 대표적인 모양을 단순화해 만든 것이며, \'소리 들어 보기\'는 버튼을 누를 때만 작은 음량으로 1초 동안 재생된다.',
  init: function (api) {
    var WIN = 0.02;   // 화면에 보이는 시간: 0.02초
    var shapes = [
      { name: '소리굽쇠', h: [1] },
      { name: '리코더', h: [1, 0.28, 0.12] },
      { name: '클라리넷', h: [1, 0, 0.45, 0, 0.25, 0, 0.12] },
      { name: '바이올린', h: [1, 0.5, 0.33, 0.25, 0.2, 0.16, 0.13, 0.1] },
    ];
    shapes.forEach(function (s) {   // 한 주기에서 가장 큰 값으로 나눠, 같은 진폭이면 높이가 같게 맞춘다
      var m = 0; for (var k = 0; k < 2000; k++) m = Math.max(m, Math.abs(wave(s.h, k / 2000)));
      s.norm = m;
    });
    var state = { A: 3, f: 200, shape: 0, ghost: null };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '소리의 파형 그래프와 크기·높낮이 눈금' });
    var ctx = cv.ctx;

    var rA = api.readout('진폭');
    var rF = api.readout('진동수');
    var rN = api.readout('0.02초 동안 물결 수');
    var rS = api.readout('파형(맵시)');

    api.slider({ id: 'sound-wave-amp', label: '진폭', min: 1, max: 5, step: 0.5, value: state.A,
      format: function (v) { return v + '칸'; }, onInput: function (v) { state.A = v; draw(); } });
    api.slider({ id: 'sound-wave-freq', label: '진동수', min: 100, max: 800, step: 50, value: state.f,
      format: function (v) { return v + ' Hz'; }, onInput: function (v) { state.f = v; draw(); } });
    var g = api.group();
    var sb = shapes.map(function (s, i) {
      return api.button(s.name, function () { state.shape = i; sb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); },
        { toggle: true, pressed: i === 0, parent: g });
    });
    var g2 = api.group();
    var keepBtn = api.button('지금 파형 남겨 두고 비교', function () {
      state.ghost = state.ghost ? null : { A: state.A, f: state.f, shape: state.shape };
      keepBtn.textContent = state.ghost ? '남긴 파형 지우기' : '지금 파형 남겨 두고 비교';
      draw();
    }, { parent: g2 });
    api.button('소리 들어 보기 (작은 음량)', play, { parent: g2 });

    function wave(h, ph) { var y = 0; for (var k = 0; k < h.length; k++) y += h[k] * Math.sin(2 * Math.PI * (k + 1) * ph); return y; }
    function loud(A) { return A <= 2 ? '작은 소리' : A >= 4 ? '큰 소리' : '중간 크기의 소리'; }
    function pitch(f) { return f <= 250 ? '낮은 소리' : f >= 550 ? '높은 소리' : '중간 높이의 소리'; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, fs = narrow ? 12 : 13;
      ctx.clearRect(0, 0, w, h);
      // 위: 크기·높낮이 눈금
      var mh = narrow ? 84 : 46;
      if (narrow) {
        meter(12, 18, w - 24, '소리의 크기', '작다', '크다', (state.A - 1) / 4, T.figRed, loud(state.A), T, fs);
        meter(12, 60, w - 24, '소리의 높낮이', '낮다', '높다', (state.f - 100) / 700, T.figBlue, pitch(state.f), T, fs);
      } else {
        meter(16, 18, w / 2 - 32, '소리의 크기', '작다', '크다', (state.A - 1) / 4, T.figRed, loud(state.A), T, fs);
        meter(w / 2 + 16, 18, w / 2 - 32, '소리의 높낮이', '낮다', '높다', (state.f - 100) / 700, T.figBlue, pitch(state.f), T, fs);
      }
      // 아래: 파형 그래프
      var L = 40, R = w - 12, Tp = mh + 24, B = h - 30, mid = (Tp + B) / 2, unit = (B - Tp) / 2 / 5.5;
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, R - L, B - Tp);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      for (var k = -5; k <= 5; k++) { ctx.beginPath(); ctx.moveTo(L, mid - k * unit); ctx.lineTo(R, mid - k * unit); ctx.stroke(); }
      for (var m = 0; m <= 10; m++) { var x = L + (R - L) * m / 10; ctx.beginPath(); ctx.moveTo(x, Tp); ctx.lineTo(x, B); ctx.stroke(); }
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, mid); ctx.lineTo(R, mid); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      [5, 0, -5].forEach(function (v) { ctx.fillText(v, L - 6, mid - v * unit); });
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('0', L, B + 14); ctx.fillText('0.01초', (L + R) / 2, B + 14); ctx.fillText('0.02초', R - 16, B + 14);
      ctx.fillText('시간 →', (L + R) / 2, B + 27);
      ctx.save(); ctx.translate(12, mid); ctx.rotate(-Math.PI / 2); ctx.fillText('공기의 진동(칸)', 0, 0); ctx.restore();

      if (state.ghost) trace(state.ghost, T.figLine, 2, [5, 4]);
      trace(state, T.figAccent, 2.6, null);

      // 진폭 표시: 첫 마루까지
      var s = shapes[state.shape], per = 1 / state.f, best = 0, bx = 0;
      for (var q = 0; q < 400; q++) { var ph = q / 400, y = wave(s.h, ph) / s.norm; if (y > best) { best = y; bx = ph; } }
      var cx = L + (bx * per / WIN) * (R - L), cy = mid - state.A * unit;
      ctx.strokeStyle = T.figRed; ctx.fillStyle = T.figRed; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(cx, mid); ctx.lineTo(cx, cy + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 5, cy + 8); ctx.lineTo(cx + 5, cy + 8); ctx.closePath(); ctx.fill();
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('진폭', cx + 6, (mid + cy) / 2 + 4);
      // 한 번 진동(주기) 표시
      var x0 = L, x1 = L + (per / WIN) * (R - L), yb = mid + 5.2 * unit;
      ctx.strokeStyle = T.figBlue; ctx.fillStyle = T.figBlue; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x0, yb - 4); ctx.lineTo(x0, yb + 4); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.moveTo(x1, yb - 4); ctx.lineTo(x1, yb + 4); ctx.stroke();
      ctx.font = fs - 1 + 'px ' + T.fontBody; ctx.textAlign = x1 - x0 > 70 ? 'center' : 'left';
      ctx.fillText('물결 1개', x1 - x0 > 70 ? (x0 + x1) / 2 : x1 + 4, yb - 5);

      var n = Math.round(state.f * WIN * 10) / 10;
      rA.set(state.A + '칸 → ' + loud(state.A));
      rF.set(state.f + ' Hz → ' + pitch(state.f));
      rN.set(n + '개');
      rS.set(s.name + (state.ghost ? ' (점선: 남긴 ' + shapes[state.ghost.shape].name + ' ' + state.ghost.f + ' Hz, ' + state.ghost.A + '칸)' : ''));

      function trace(st, color, lw, dash) {
        var sh = shapes[st.shape], N = Math.max(900, Math.round((R - L) * 3));
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.beginPath();
        for (var j = 0; j <= N; j++) {
          var t = WIN * j / N, yy = mid - st.A * unit * wave(sh.h, (t * st.f) % 1) / sh.norm, xx = L + (R - L) * j / N;
          if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    function meter(x, y, wd, name, lo, hi, v, color, word, T, fs) {
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
      ctx.fillText(name, x, y);
      ctx.textAlign = 'right'; ctx.fillStyle = color; ctx.fillText(word, x + wd, y);
      var by = y + 14, bx0 = x + 30, bx1 = x + wd - 30;
      ctx.fillStyle = T.figMuted; ctx.font = fs - 1 + 'px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(lo, x, by + 4);
      ctx.textAlign = 'right'; ctx.fillText(hi, x + wd, by + 4);
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(bx0, by - 4, bx1 - bx0, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.fillRect(bx0, by - 4, (bx1 - bx0) * v, 8);
      ctx.beginPath(); ctx.arc(bx0 + (bx1 - bx0) * v, by, 7, 0, Math.PI * 2); ctx.fill();
    }

    var actx = null;
    function play() {
      try {
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        if (!actx) actx = new AC();
        if (actx.state === 'suspended') actx.resume();
        var s = shapes[state.shape], real = new Float32Array(s.h.length + 1), imag = new Float32Array(s.h.length + 1);
        for (var k = 0; k < s.h.length; k++) imag[k + 1] = s.h[k] / s.norm;
        var osc = actx.createOscillator(), gain = actx.createGain(), t0 = actx.currentTime;
        osc.setPeriodicWave(actx.createPeriodicWave(real, imag, { disableNormalization: true }));
        osc.frequency.value = state.f;
        var peak = 0.012 + 0.012 * (state.A - 1);   // 작은 음량(최대 약 0.06)
        gain.gain.setValueAtTime(0, t0); gain.gain.linearRampToValueAtTime(peak, t0 + 0.03);
        gain.gain.setValueAtTime(peak, t0 + 0.85); gain.gain.linearRampToValueAtTime(0, t0 + 1);
        osc.connect(gain); gain.connect(actx.destination); osc.start(t0); osc.stop(t0 + 1.05);
      } catch (e) { /* 소리를 낼 수 없는 환경이면 무시 */ }
    }

    api.onResize(draw);
    draw();
  },
});
