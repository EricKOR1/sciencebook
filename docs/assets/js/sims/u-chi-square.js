/* 일반생명과학 5 카이제곱 검정: 관찰 수와 기대 수, 표본 크기에 따른 우연 변동, 가설이 맞을 때와 틀릴 때의 기각 비율 */
Sims.register('u-chi-square', {
  title: '카이제곱 검정 — 이 정도 차이는 우연일까?',
  caption: '두 형질에 대해 이형 접합인 F₁끼리 교배한 자손을 세고, "9 : 3 : 3 : 1로 분리한다"는 귀무가설을 χ² 검정(자유도 3, 임곗값 7.81)으로 판정한다. 열성·열성 개체의 생존율이 1이면 가설이 실제로 맞는 경우인데도, 반복하면 약 5%는 우연히 기각된다(유의 수준 0.05의 뜻). 생존율을 낮추어 가설을 조금 틀리게 만든 뒤 자손 수를 바꿔 보면, 표본이 작을 때는 차이를 잡아내지 못하다가 표본이 커질수록 기각 비율이 높아진다. 자손은 실제 비율에 따라 무작위로 뽑았다.',
  init: function (api) {
    var HYP = [9, 3, 3, 1], CRIT = 7.81, NAMES = ['우성·우성', '우성·열성', '열성·우성', '열성·열성'];
    var s = { N: 400, v: 1, obs: null, chis: [] };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.52; }, label: '관찰 수와 기대 수 막대그래프, 반복한 χ² 값의 분포' });
    var ctx = cv.ctx;
    var rChi = api.readout('χ²');
    var rDec = api.readout('판정(유의 수준 0.05)');
    var rRej = api.readout('반복에서 기각된 비율');

    api.slider({ id: 'u-chi-square-n', label: '자손 수', min: Math.log10(20), max: Math.log10(2000), step: 0.01, value: Math.log10(400),
      format: function (v) { return Math.round(Math.pow(10, v)) + '개체'; }, onInput: function (v) { s.N = Math.round(Math.pow(10, v)); s.chis = []; one(); } });
    api.slider({ id: 'u-chi-square-v', label: '열성·열성 개체의 실제 생존율', min: 0.3, max: 1, step: 0.05, value: 1,
      format: function (v) { return v >= 0.999 ? '1(가설대로)' : v.toFixed(2); }, onInput: function (v) { s.v = v; s.chis = []; one(); } });
    var g = api.group();
    api.button('자손 다시 얻기', function () { one(); }, { primary: true, parent: g });
    api.button('1000번 반복', function () { for (var i = 0; i < 1000; i++) s.chis.push(chi(sample())); s.chis = s.chis.slice(-5000); draw(); }, { parent: g });

    function probs() { var t = [9, 3, 3, s.v], sum = t[0] + t[1] + t[2] + t[3]; return t.map(function (x) { return x / sum; }); }
    function sample() {
      var p = probs(), o = [0, 0, 0, 0];
      for (var i = 0; i < s.N; i++) { var u = Math.random(), k = 0; while (k < 3 && u > p[k]) { u -= p[k]; k++; } o[k]++; }
      return o;
    }
    function expected(n) { return HYP.map(function (h) { return n * h / 16; }); }
    function chi(o) { var n = o[0] + o[1] + o[2] + o[3], e = expected(n), c = 0; for (var i = 0; i < 4; i++) c += (o[i] - e[i]) * (o[i] - e[i]) / e[i]; return c; }
    function one() { s.obs = sample(); s.chis.push(chi(s.obs)); draw(); }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = narrow ? { x: 0, y: 0, w: w, h: h * 0.55 } : { x: 0, y: 0, w: w * 0.55, h: h };
      var H = narrow ? { x: 0, y: h * 0.58, w: w, h: h * 0.42 } : { x: w * 0.58, y: 0, w: w * 0.42, h: h };
      bars(T, A); hist(T, H);
      var c = chi(s.obs), n = s.obs.reduce(function (a, b) { return a + b; }, 0);
      rChi.set(c.toFixed(2) + (c > CRIT ? ' > ' : ' < ') + '7.81');
      rDec.set(c > CRIT ? '귀무가설 기각' : '기각하지 않음');
      var rej = s.chis.filter(function (x) { return x > CRIT; }).length;
      rRej.set(s.chis.length + '번 중 ' + (100 * rej / s.chis.length).toFixed(1) + '%');
    }
    function bars(T, r) {
      var o = s.obs, n = s.N, e = expected(n);
      var L = r.x + 44, R = r.x + r.w - 10, top = r.y + 30, B = r.y + r.h - 62;
      var maxV = Math.max.apply(null, o.concat(e)) * 1.15;
      var sy = function (v) { return B - v / maxV * (B - top); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('관찰 수(막대)와 기대 수(점선) — 자손 ' + n + '개체', r.x + 8, r.y + 16);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, top); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxV / 1.15), L - 4, sy(maxV / 1.15) + 4); ctx.fillText('0', L - 4, B + 4);
      var cw = (R - L) / 4, cols = [T.figBlue, T.figGreen, T.figAmber, T.figRed];
      for (var i = 0; i < 4; i++) {
        var cx = L + cw * (i + 0.5), bw = cw * 0.5;
        ctx.fillStyle = cols[i]; ctx.globalAlpha = 0.85; ctx.fillRect(cx - bw / 2, sy(o[i]), bw, B - sy(o[i])); ctx.globalAlpha = 1;
        ctx.setLineDash([5, 3]); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - bw * 0.75, sy(e[i])); ctx.lineTo(cx + bw * 0.75, sy(e[i])); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontMono; ctx.textAlign = 'center';
        ctx.fillText(o[i], cx, sy(Math.max(o[i], e[i])) - 6);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText(NAMES[i], cx, B + 14);
        ctx.font = '11px ' + T.fontMono;
        ctx.fillText('기대 ' + (e[i] < 10 ? e[i].toFixed(1) : e[i].toFixed(0)), cx, B + 28);
        ctx.fillStyle = T.figInk;
        ctx.fillText('+' + ((o[i] - e[i]) * (o[i] - e[i]) / e[i]).toFixed(2), cx, B + 42);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('(관찰−기대)²/기대 →', r.x + 2, B + 56);
      if (n / 16 < 5) { ctx.fillStyle = T.figRed; ctx.textAlign = 'right'; ctx.fillText('기대 수 5 미만인 범주가 있어 검정이 부정확', R, B + 56); }
    }
    function hist(T, r) {
      var L = r.x + 36, R = r.x + r.w - 10, top = r.y + 30, B = r.y + r.h - 34, XM = 20;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('반복한 χ² 값의 분포', r.x + 8, r.y + 16);
      var bins = new Array(XM).fill(0);
      s.chis.forEach(function (c) { bins[Math.min(XM - 1, Math.floor(c))]++; });
      var mx = Math.max(1, Math.max.apply(null, bins));
      var sx = function (x) { return L + x / XM * (R - L); };
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(sx(CRIT), top, R - sx(CRIT), B - top);
      for (var i = 0; i < XM; i++) {
        var bh = bins[i] / mx * (B - top);
        ctx.fillStyle = i + 1 > CRIT ? T.figRed : T.figBlue;
        ctx.fillRect(sx(i) + 1, B - bh, sx(i + 1) - sx(i) - 2, bh);
      }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, top); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(CRIT), top); ctx.lineTo(sx(CRIT), B); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('임곗값 7.81', sx(CRIT) + 4, top + 14);
      ctx.fillText('기각', sx(CRIT) + 4, top + 30);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [0, 5, 10, 15, 20].forEach(function (x) { ctx.fillText(x === 20 ? '20+' : x, sx(x), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('χ²', (L + R) / 2, B + 28);
      var c = chi(s.obs);
      ctx.fillStyle = T.figInk; ctx.beginPath(); var mxp = sx(Math.min(c, XM - 0.1));
      ctx.moveTo(mxp, B + 2); ctx.lineTo(mxp - 5, B + 10); ctx.lineTo(mxp + 5, B + 10); ctx.closePath(); ctx.fill();
    }

    api.onResize(draw);
    one();
  },
});
