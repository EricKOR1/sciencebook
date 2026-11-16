/* 일반화학 1 물질과 화학량론: 뷰렛 적정 가상 실험 — 종말점을 맞히고 "부피 × 농도 = 몰수"와 계수비로 계산한다 */
Sims.register('u-titration-lab', {
  title: '뷰렛 적정 가상 실험 — 한 방울 차이로 종말점 맞히기',
  caption: '실험을 고르고 뷰렛 단추로 적정액을 넣어 보자. 종말점에 가까워지면 떨어진 자리만 잠깐 색이 났다가 저으면 사라진다. 이때부터 한 방울(0.05 mL)씩 넣어, 연한 색이 사라지지 않는 순간 「종말점 기록」을 누르면 뷰렛 읽기(0.01 mL 자리까지)로 농도나 질량을 계산해 준다. 계수비(1 : 1, 1 : 2, 1 : 5)가 계산에 어떻게 들어가는지 비교하자. 지시약의 종말점은 당량점과 같다고 보았고, 참값은 예제 10·11과 개념 확인 문제 9의 값을 썼다.',
  init: function (api) {
    var MODES = [
      { key: 'khp', name: 'NaOH 표준화', ind: 'pink', veq: (0.5105 / 204.22 * 1000) / 0.1006,
        lines: ['플라스크: KHP 0.5105 g (2.500 mmol) + 물, 페놀프탈레인', '뷰렛: NaOH 수용액 (농도를 모름)', '반응: HC₈H₄O₄⁻ + OH⁻ → C₈H₄O₄²⁻ + H₂O  (1 : 1)'],
        titrant: 'NaOH', tColor: null,
        calc: function (v) { var c = (0.5105 / 204.22 * 1000) / v; return { text: 'c(NaOH) = 2.500 mmol ÷ ' + v.toFixed(2) + ' mL = ' + c.toFixed(4) + ' M', val: c, unit: ' M', truth: 0.1006, digits: 4 }; } },
      { key: 'h2so4', name: '황산의 농도', ind: 'pink', veq: 2 * 0.06804 * 25.00 / 0.1050,
        lines: ['플라스크: 황산 25.00 mL (농도를 모름), 페놀프탈레인', '뷰렛: NaOH 0.1050 M', '반응: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O  (1 : 2)'],
        titrant: 'NaOH 0.1050 M', tColor: null,
        calc: function (v) { var c = 0.1050 * v / 2 / 25.00; return { text: 'c(H₂SO₄) = 0.1050 M × ' + v.toFixed(2) + ' mL × ½ ÷ 25.00 mL = ' + c.toFixed(5) + ' M', val: c, unit: ' M', truth: 0.06804, digits: 5 }; } },
      { key: 'fe', name: '철분 보충제', ind: 'purple', veq: (103.0 / 55.85) / 5 / 0.02000,
        lines: ['플라스크: 보충제 한 알을 녹인 Fe²⁺ 용액(묽은 황산)', '뷰렛: KMnO₄ 0.02000 M (스스로 지시약)', '반응: MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O  (1 : 5)'],
        titrant: 'KMnO₄ 0.02000 M', tColor: 'purple',
        calc: function (v) { var m = 0.02000 * v * 5 * 55.85; return { text: 'm(Fe) = 0.02000 M × ' + v.toFixed(2) + ' mL × 5 × 55.85 = ' + m.toFixed(1) + ' mg', val: m, unit: ' mg', truth: 103.0, digits: 1 }; } },
    ];
    var PINK = 'rgba(226, 48, 140, ', PURPLE = 'rgba(118, 34, 150, ', FE3 = 'rgba(214, 178, 60, ';
    var st = { mode: 0, v: 0, flash: 0, drop: -1, rec: null };   // v: 0.01 mL 단위 정수

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? (640 / w) : 0.62; }, label: '뷰렛과 삼각 플라스크, 뷰렛 눈금 확대, 실험 정보' });
    var ctx = cv.ctx;
    var rV = api.readout('뷰렛 읽기');
    var rC = api.readout('플라스크');
    var rR = api.readout('계산 결과');
    var rE = api.readout('참값과 차이');

    var gm = api.group();
    var mbtn = MODES.map(function (m, i) {
      return api.button(m.name, function () { st.mode = i; mbtn.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); reset(); }, { toggle: true, pressed: i === 0, parent: gm });
    });
    var ga = api.group();
    [[500, '+5 mL'], [100, '+1 mL'], [10, '+0.1 mL'], [5, '한 방울 (0.05 mL)']].forEach(function (a) {
      api.button(a[1], function () { add(a[0]); }, { parent: ga });
    });
    var gr = api.group();
    api.button('종말점 기록', function () { record(); }, { primary: true, parent: gr });
    api.button('처음부터', function () { reset(); }, { parent: gr });

    function M() { return MODES[st.mode]; }
    function vml() { return st.v / 100; }
    function excess() { return vml() - M().veq; }          // mL, 양수면 당량점을 지남
    function reached() { return excess() > -1e-9; }
    function add(d) {
      if (st.v >= 5000) return;
      st.v = Math.min(5000, st.v + d); st.rec = null;
      var near = M().veq - vml();
      st.flash = (!reached() && near < 2.0) ? 1 : 0;
      st.drop = api.reduced ? -1 : 0;
      if (api.reduced) st.flash = 0;
      update();
      if (!api.reduced) loop.play();
    }
    function reset() { st.v = 0; st.flash = 0; st.drop = -1; st.rec = null; loop.pause(); update(); }
    function record() { st.rec = M().calc(Math.max(vml(), 0.01)); st.rec.ok = reached(); st.rec.over = excess() > 0.10 + 1e-9; update(); }

    function stateText() {
      var m = M(), ex = excess();
      if (!reached()) {
        if (st.flash > 0.05) return m.ind === 'pink' ? '떨어진 자리만 잠깐 분홍 → 저으면 사라짐' : '보라색이 잠깐 → 저으면 사라짐';
        return m.ind === 'pink' ? '무색' : (st.v === 0 ? '거의 무색' : '연한 노랑(Fe³⁺), 보라색은 곧 사라짐');
      }
      if (ex <= 0.10 + 1e-9) return m.ind === 'pink' ? '연한 분홍이 사라지지 않음 — 종말점!' : '연한 보라색이 사라지지 않음 — 종말점!';
      return m.ind === 'pink' ? '진한 분홍 — 종말점을 지났다' : '진한 보라 — 종말점을 지났다';
    }
    function update() {
      rV.set(vml().toFixed(2) + ' mL');
      rC.set(stateText());
      if (st.rec) {
        var r = st.rec, d = (r.val - r.truth) / r.truth * 100;
        rR.set(r.val.toFixed(r.digits) + r.unit);
        rE.set(r.ok ? ((d >= 0 ? '+' : '') + d.toFixed(1) + ' % (참값 ' + r.truth.toFixed(r.digits) + r.unit + ')') : '아직 종말점 전이다');
      } else { rR.set('–'); rE.set('–'); }
      draw();
    }

    var loop = api.loop(function (dt) {
      if (st.flash > 0) st.flash = Math.max(0, st.flash - dt * 0.9);
      if (st.drop >= 0) { st.drop += dt * 3; if (st.drop > 1) st.drop = -1; }
      if (st.flash <= 0 && st.drop < 0) loop.pause();
      rC.set(stateText());
      draw();
    });
    loop.pause();

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { bx: 70, top: 26, len: 210, zoom: { x: 130, y: 30, w: Math.min(150, w - 150), h: 170 }, info: { x: 12, y: 26 + 210 + 172, w: w - 24 } };
      var len = Math.max(180, h - 26 - 168);
      return { bx: 92, top: 26, len: len, zoom: { x: 158, y: 30, w: 130, h: len * 0.75 }, info: { x: 320, y: 30, w: w - 334 } };
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, L = layout(), m = M();
      ctx.clearRect(0, 0, w, h);
      var bx = L.bx, top = L.top, len = L.len, bw = 16;
      var y = function (v) { return top + 10 + (v / 50) * (len - 10); };
      // 스탠드
      ctx.fillStyle = T.figLine; ctx.fillRect(bx - 52, top - 6, 6, len + 150);
      ctx.fillRect(bx - 52, top + len * 0.35, 52 - bw / 2, 5);
      // 뷰렛 속 액체
      var lev = y(vml()), bot = top + len;
      ctx.fillStyle = m.tColor ? PURPLE + '0.75)' : (T.dark ? 'rgba(150,180,230,0.25)' : 'rgba(120,160,220,0.22)');
      ctx.fillRect(bx - bw / 2, lev, bw, bot - lev);
      // 뷰렛 관
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(bx - bw / 2, top); ctx.lineTo(bx - bw / 2, bot); ctx.lineTo(bx - 3, bot + 22); ctx.lineTo(bx - 1.5, bot + 40);
      ctx.moveTo(bx + bw / 2, top); ctx.lineTo(bx + bw / 2, bot); ctx.lineTo(bx + 3, bot + 22); ctx.lineTo(bx + 1.5, bot + 40); ctx.stroke();
      // 콕
      ctx.fillStyle = T.figAccent; ctx.fillRect(bx - 14, bot + 8, 28, 6);
      // 눈금(1 mL마다 짧게, 5 mL마다 길게)
      ctx.lineWidth = 1; ctx.strokeStyle = T.figMuted; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var v = 0; v <= 50; v++) {
        var yy = y(v), long = v % 5 === 0;
        ctx.beginPath(); ctx.moveTo(bx - bw / 2, yy); ctx.lineTo(bx - bw / 2 + (long ? 9 : 5), yy); ctx.stroke();
        if (v % 10 === 0) ctx.fillText(v, bx - bw / 2 - 4, yy + 4);
      }
      // 확대 칸 표시선
      var Z = L.zoom;
      ctx.strokeStyle = T.figAccent; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(bx + bw / 2, lev); ctx.lineTo(Z.x, Z.y + Z.h / 2); ctx.stroke(); ctx.setLineDash([]);
      drawZoom(T, Z);
      // 떨어지는 방울
      var tipY = bot + 40, fl = { cx: bx, top: tipY + 22 };
      if (st.drop >= 0) {
        ctx.fillStyle = m.tColor ? PURPLE + '0.9)' : T.figAccent;
        ctx.beginPath(); ctx.arc(bx, tipY + 4 + st.drop * 40, 3, 0, Math.PI * 2); ctx.fill();
      }
      drawFlask(T, fl);
      drawInfo(T, L.info);
    }
    function drawZoom(T, Z) {
      var m = M(), v = vml(), span = 2.0;   // 확대 칸에 보이는 부피 폭(mL)
      var v0 = v - span / 2;
      var sy = function (x) { return Z.y + ((x - v0) / span) * Z.h; };
      ctx.save();
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.fillRect(Z.x, Z.y, Z.w, Z.h); ctx.strokeRect(Z.x, Z.y, Z.w, Z.h);
      ctx.beginPath(); ctx.rect(Z.x, Z.y, Z.w, Z.h); ctx.clip();
      var tx = Z.x + 18, tw = Math.min(56, Z.w - 60);
      // 액체(메니스커스 아래)
      ctx.fillStyle = m.tColor ? PURPLE + '0.7)' : (T.dark ? 'rgba(150,180,230,0.3)' : 'rgba(120,160,220,0.28)');
      var my = sy(v);
      ctx.beginPath(); ctx.moveTo(tx, my - 7);
      ctx.quadraticCurveTo(tx + tw / 2, my + 7, tx + tw, my - 7);
      ctx.lineTo(tx + tw, Z.y + Z.h); ctx.lineTo(tx, Z.y + Z.h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(tx, my - 7); ctx.quadraticCurveTo(tx + tw / 2, my + 7, tx + tw, my - 7); ctx.stroke();
      // 관 벽
      ctx.beginPath(); ctx.moveTo(tx, Z.y); ctx.lineTo(tx, Z.y + Z.h); ctx.moveTo(tx + tw, Z.y); ctx.lineTo(tx + tw, Z.y + Z.h); ctx.stroke();
      // 0.1 mL 눈금
      ctx.strokeStyle = T.figInk; ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontMono; ctx.textAlign = 'left';
      var first = Math.ceil(v0 * 10 - 1e-6);
      for (var k = first; k <= (v0 + span) * 10 + 1e-6; k++) {
        if (k < 0 || k > 500) continue;
        var yy = sy(k / 10), whole = k % 10 === 0, half = k % 5 === 0;
        ctx.lineWidth = whole ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(tx + tw, yy); ctx.lineTo(tx + tw - (whole ? 22 : half ? 15 : 9), yy); ctx.stroke();
        if (whole) ctx.fillText(String(k / 10), tx + tw + 5, yy + 4);
      }
      // 읽는 선(메니스커스의 바닥)
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(Z.x, my); ctx.lineTo(Z.x + Z.w, my); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('확대: 메니스커스 바닥을 읽는다', Z.x, Z.y + Z.h + 15);
      ctx.fillStyle = T.figRed; ctx.font = '600 13px ' + T.fontMono;
      ctx.fillText(v.toFixed(2) + ' mL', Z.x, Z.y + Z.h + 32);
    }
    function drawFlask(T, f) {
      var m = M(), cx = f.cx, t = f.top, nh = 22, bh = 74, nw = 13, bwid = 58;
      var path = function () {
        ctx.beginPath(); ctx.moveTo(cx - nw, t); ctx.lineTo(cx - nw, t + nh); ctx.lineTo(cx - bwid, t + nh + bh); ctx.lineTo(cx + bwid, t + nh + bh); ctx.lineTo(cx + nw, t + nh); ctx.lineTo(cx + nw, t); };
      // 액체
      var ly = t + nh + bh * 0.38, frac = (ly - (t + nh)) / bh, lw = nw + (bwid - nw) * frac;
      ctx.save(); path(); ctx.clip();
      ctx.fillStyle = T.dark ? 'rgba(150,180,230,0.18)' : 'rgba(120,160,220,0.16)';
      ctx.fillRect(cx - bwid, ly, bwid * 2, bh);
      var ex = excess();
      if (m.ind === 'purple' && st.v > 0) { ctx.fillStyle = FE3 + (0.12 + 0.2 * Math.min(1, vml() / m.veq)) + ')'; ctx.fillRect(cx - bwid, ly, bwid * 2, bh); }
      if (reached()) {
        var a = Math.min(0.85, 0.16 + Math.max(0, ex) * 0.9);
        ctx.fillStyle = (m.ind === 'pink' ? PINK : PURPLE) + a + ')';
        ctx.fillRect(cx - bwid, ly, bwid * 2, bh);
      } else if (st.flash > 0) {
        var g = ctx.createRadialGradient(cx, ly + 8, 2, cx, ly + 8, 34);
        g.addColorStop(0, (m.ind === 'pink' ? PINK : PURPLE) + (0.75 * st.flash) + ')');
        g.addColorStop(1, (m.ind === 'pink' ? PINK : PURPLE) + '0)');
        ctx.fillStyle = g; ctx.fillRect(cx - bwid, ly, bwid * 2, bh);
      }
      ctx.restore();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - lw, ly); ctx.lineTo(cx + lw, ly); ctx.stroke();
      ctx.lineWidth = 1.8; path(); ctx.stroke();
    }
    function drawInfo(T, R) {
      var m = M(), yy = R.y + 4;
      ctx.textAlign = 'left';
      ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontBody;
      ctx.fillText(m.name, R.x, yy + 10); yy += 30;
      ctx.font = '12px ' + T.fontBody;
      m.lines.forEach(function (s) { yy = wrap(s, R.x, yy, R.w, 17, T.figInk) + 6; });
      yy += 6;
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      var ex = excess();
      var st2 = reached() ? (ex <= 0.10 + 1e-9 ? '지금이 종말점이다.' : '이미 지났다. 「처음부터」로 다시 해 보자.') :
        (M().veq - vml() < 2 ? '종말점이 가깝다. 한 방울씩!' : '아직 멀다. 크게 넣어도 된다.');
      yy = wrap('상태: ' + st2, R.x, yy, R.w, 17, reached() && ex > 0.10 + 1e-9 ? T.figRed : T.figMuted) + 8;
      if (st.rec) {
        ctx.font = '600 12px ' + T.fontBody;
        yy = wrap('계산: ' + st.rec.text, R.x, yy, R.w, 17, st.rec.ok ? T.figAccent : T.figRed) + 4;
        if (!st.rec.ok) { ctx.font = '12px ' + T.fontBody; wrap('색이 사라지지 않을 때까지 넣고 다시 기록하자.', R.x, yy, R.w, 17, T.figRed); }
        else if (st.rec.over) { ctx.font = '12px ' + T.fontBody; wrap('종말점을 지나 넣은 부피만큼 결과가 크게 나왔다.', R.x, yy, R.w, 17, T.figRed); }
      }
    }
    function wrap(text, x, y, maxW, lh, color) {
      ctx.fillStyle = color; var words = text.split(' '), line = '';
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y + 12); y += lh; line = words[i]; } else line = test;
      }
      if (line) { ctx.fillText(line, x, y + 12); y += lh; }
      return y;
    }

    api.onResize(draw);
    update();
  },
});
