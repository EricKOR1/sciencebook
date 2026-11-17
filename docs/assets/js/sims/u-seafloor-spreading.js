/* 일반지구과학 2 해저 확장과 자기 줄무늬: 확장 속도와 역전 연대표가 줄무늬 폭과 나이–거리 관계를 정한다 */
Sims.register('u-seafloor-spreading', {
  title: '해령은 녹음 헤드 — 확장 속도가 정하는 자기 줄무늬의 폭',
  caption: '‘확장 재생’을 누르면 500만 년 전부터 해령 축에서 굳은 현무암이 그때의 자기장 방향(파랑: 정자극기, 흰색: 역자극기)을 기록하며 양쪽으로 멀어진다. 반확장 속도를 바꿔 보면 줄무늬의 순서는 그대로이고 폭만 속도에 비례해 바뀌며, 아래 그래프에서 해저의 나이는 거리/반확장 속도로 거리에 비례한다. 역전 시기는 지자기 연대표(브뤼느–마투야마 경계 78만 년 전 등)를 따랐고, 짧은 사건은 일부 생략했다. 확장은 양쪽 대칭·일정 속도로 가정했고, 자기 이상 곡선은 자화 방향을 부드럽게 한 모식적인 모양이다.',
  init: function (api) {
    var NORMAL = [[0, 0.781], [0.988, 1.072], [1.778, 1.945], [2.581, 3.032], [3.116, 3.207], [3.330, 3.596], [4.187, 4.300], [4.493, 4.631], [4.799, 4.896], [4.997, 5.235]];
    var TMAX = 5, RANGE = 150;   // 백만 년, 보이는 거리(km, 한쪽)
    var state = { v: 2.5, el: TMAX, play: false };   // v: 반확장 속도(cm/년), el: 500만 년 전부터 흐른 시간
    function pol(t) { for (var i = 0; i < NORMAL.length; i++) if (t >= NORMAL[i][0] && t < NORMAL[i][1]) return 1; return -1; }
    function vkm() { return state.v * 10; }   // km / 백만 년
    function now() { return TMAX - state.el; }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.68; }, label: '해령 양쪽의 자기 줄무늬, 자기 이상, 나이와 거리 그래프' });
    var ctx = cv.ctx;
    var rV = api.readout('반확장 속도');
    var rFull = api.readout('전확장 속도');
    var rB = api.readout('브뤼느 띠 바깥 경계');
    var rNow = api.readout('시각');
    var rPol = api.readout('해령 축에서 기록 중');

    api.slider({ id: 'u-seafloor-spreading-v', label: '반확장 속도', min: 1, max: 8, step: 0.5, value: 2.5,
      format: function (v) { return v.toFixed(1) + ' cm/년'; }, onInput: function (v) { state.v = v; draw(); } });
    var ts = api.slider({ id: 'u-seafloor-spreading-t', label: '시각', min: 0, max: TMAX, step: 0.01, value: TMAX,
      format: function (v) { return fmtNow(TMAX - v); }, onInput: function (v) { state.el = v; draw(); } });
    var pb = api.button('확장 재생 ▶', function () { togglePlay(); }, { primary: true });
    api.button('현재 모습', function () { stop(); ts.set(TMAX); });

    function fmtNow(n) { return n < 0.005 ? '현재' : Math.round(n * 100) + '만 년 전'; }
    function togglePlay() {
      if (state.play) { stop(); return; }
      if (api.reduced) { ts.set(Math.min(TMAX, (state.el >= TMAX - 0.01 ? 0 : state.el) + 1)); return; }
      if (state.el >= TMAX - 0.01) ts.set(0);
      state.play = true; pb.textContent = '멈추기 ❚❚'; loop.play();
    }
    function stop() { state.play = false; pb.textContent = '확장 재생 ▶'; loop.pause(); }
    var loop = api.loop(function (dt) {
      if (!state.play) return;
      ts.set(Math.min(TMAX, state.el + dt * 0.45));
      if (state.el >= TMAX - 1e-6) stop();
    });
    loop.pause();

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, mob = w < 560;
      ctx.clearRect(0, 0, w, h);
      var n = now(), v = vkm(), formed = v * (TMAX - n);   // 지금까지 만들어진 해양 지각의 폭(한쪽, km)
      var L = 16, R = w - 16, cx = (L + R) / 2, sx = function (d) { return cx + d / RANGE * (R - cx); };
      var yA = mob ? 36 : 34, hA = mob ? 74 : 70;           // 자기 이상
      var yS = yA + hA + 14, hS = mob ? 54 : 58;           // 줄무늬
      var yG = yS + hS + 64, hG = h - yG - 44;             // 그래프

      // 제목 줄과 현재 기록 극성
      var p = pol(n);
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figRed;
      ctx.fillText('해령 축', cx, 16);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('자기 이상(모식)', L, yA + 10);
      // 자기 이상: 자화(+1/−1)를 가우스 함수로 부드럽게 한 곡선
      var step = 1, sig = 4, ker = [], k;
      for (k = -12; k <= 12; k++) ker.push(Math.exp(-k * k / (2 * sig * sig)));
      var ks = ker.reduce(function (a, b) { return a + b; }, 0);
      var mag = function (d) { var a = Math.abs(d); if (a > formed) return 0; return pol(n + a / v); };
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, yA + hA / 2); ctx.lineTo(R, yA + hA / 2); ctx.stroke();
      ctx.beginPath();
      var started = false;
      for (var d = -Math.min(RANGE, formed); d <= Math.min(RANGE, formed) + 1e-9; d += step) {
        var s = 0; for (k = -12; k <= 12; k++) s += ker[k + 12] * mag(d + k);
        s /= ks;
        var yy = yA + hA / 2 - s * hA * 0.42;
        if (!started) { ctx.moveTo(sx(d), yy); started = true; } else ctx.lineTo(sx(d), yy);
      }
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('+', L + 2, yA + hA * 0.2); ctx.fillText('−', L + 2, yA + hA * 0.86);

      // 줄무늬(위에서 본 해저)
      for (var px = Math.floor(L); px < R; px++) {
        var dd = (px + 0.5 - cx) / (R - cx) * RANGE, age = Math.abs(dd) / v;
        if (Math.abs(dd) > formed) { ctx.fillStyle = T.figPanel; }
        else ctx.fillStyle = pol(n + age) > 0 ? T.figBlue : T.figPaper;
        ctx.fillRect(px, yS, 1.2, hS);
      }
      // 아직 그리지 않은 오래된 지각 표시
      if (formed < RANGE) {
        ctx.save(); ctx.beginPath(); ctx.rect(L, yS, sx(-formed) - L, hS); ctx.rect(sx(formed), yS, R - sx(formed), hS); ctx.clip();
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        for (var hx = L - hS; hx < R; hx += 9) { ctx.beginPath(); ctx.moveTo(hx, yS + hS); ctx.lineTo(hx + hS, yS); ctx.stroke(); }
        ctx.restore();
        if (sx(formed) < R - 120) {
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
          ctx.fillText('500만 년 전보다 오래된 지각', sx(formed) + 6, yS + hS + 13);
        }
      }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, yS, R - L, hS);
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, 22); ctx.lineTo(cx, yS + hS + 4); ctx.stroke();
      // 이동 화살표
      ctx.fillStyle = T.figInk; ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      [-1, 1].forEach(function (sg) {
        var x0 = cx + sg * 10, x1 = cx + sg * Math.min(70, (R - cx) * 0.4), yy = yS - 8;
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1 + sg * 6, yy); ctx.lineTo(x1 - sg * 2, yy - 4); ctx.lineTo(x1 - sg * 2, yy + 4); ctx.closePath(); ctx.fill();
      });
      // 거리 눈금
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var tick = mob ? 50 : 25;
      for (var tk = -RANGE; tk <= RANGE; tk += tick) {
        ctx.fillRect(sx(tk) - 0.5, yS + hS, 1, 5);
        ctx.fillText(Math.abs(tk), sx(tk), yS + hS + 28);
      }
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('해령 축에서의 거리 (km)', cx, yS + hS + 46);
      // 지금 기록 중인 극성 표지
      var badge = p > 0 ? '정자극기 기록 중' : '역자극기 기록 중';
      ctx.font = '600 12px ' + T.fontBody; var bw = ctx.measureText(badge).width + 16;
      ctx.fillStyle = p > 0 ? T.figBlue : T.figPanel; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5;
      rr(cx + 8, 4, bw, 20, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p > 0 ? T.figPanel : T.figBlue; ctx.textAlign = 'left'; ctx.fillText(badge, cx + 16, 18);

      // 나이–거리 그래프
      var gL = L + 44, gR = R - 8, gT = yG, gB = yG + hG;
      var gx = function (d) { return gL + d / RANGE * (gR - gL); }, gy = function (a) { return gB - a / TMAX * (gB - gT); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var a = 0; a <= TMAX; a++) { ctx.beginPath(); ctx.moveTo(gL, gy(a)); ctx.lineTo(gR, gy(a)); ctx.stroke(); ctx.fillText(a, gL - 6, gy(a) + 4); }
      ctx.textAlign = 'center';
      for (tk = 0; tk <= RANGE; tk += tick) ctx.fillText(tk, gx(tk), gB + 15);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('해령 축에서의 거리 (km, 한쪽)', (gL + gR) / 2, gB + 32);
      ctx.save(); ctx.translate(L + 8, (gT + gB) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('해저의 나이 (백만 년)', 0, 0); ctx.restore();
      // 거리 축 위에 한쪽 줄무늬
      for (px = Math.floor(gL); px < gR; px++) {
        var d2 = (px - gL) / (gR - gL) * RANGE;
        if (d2 > formed) continue;
        ctx.fillStyle = pol(n + d2 / v) > 0 ? T.figBlue : T.figPaper; ctx.fillRect(px, gB - 7, 1.2, 7);
      }
      // 기준선(예제 3: 2.5 cm/년)과 현재 선
      function ageLine(vv, col, lw, dash, maxD) {
        var dEnd = Math.min(RANGE, vv * TMAX, maxD == null ? 1e9 : maxD);
        ctx.beginPath(); ctx.moveTo(gx(0), gy(0)); ctx.lineTo(gx(dEnd), gy(dEnd / vv));
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
      }
      ageLine(25, T.figLine, 1.4, [5, 4]);
      ageLine(v, T.figAccent, 2.6, null, formed);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      var lx = Math.min(RANGE, 25 * TMAX);
      ctx.fillText('2.5 cm/년(예제 3)', gx(lx * 0.62) + 8, gy(lx * 0.62 / 25) + 4);
      // 브뤼느–마투야마 경계 점
      var dB = 0.781 * v;
      if (dB <= RANGE && dB <= formed + 1e-9) {
        ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(gx(dB), gy(0.781), 4.5, 0, 7); ctx.fill();
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('78만 년 · ' + dB.toFixed(1) + ' km', gx(dB) + 8, gy(0.781) - 6);
      }
      // 읽음값
      rV.set(state.v.toFixed(1) + ' cm/년 (= ' + v.toFixed(0) + ' km/백만 년)');
      rFull.set((2 * state.v).toFixed(1) + ' cm/년');
      rB.set(n < 0.005 ? '축에서 ' + dB.toFixed(1) + ' km' : '아직 형성 중');
      rNow.set(fmtNow(n));
      rPol.set(p > 0 ? '정자극기' : '역자극기');
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    api.onResize(draw);
    draw();
  },
});
