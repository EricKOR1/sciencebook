/* 생물의 유전 1 유전자와 유전물질: 메셀슨–스탈 실험 — 세 가설의 예측(가닥 조성과 원심 분리 띠) 비교 */
Sims.register('dna-replication', {
  title: '메셀슨–스탈 실험 — 어떤 복제 방식이 실제 띠와 맞을까?',
  caption: '¹⁵N 배지에서 기른 대장균(0세대)을 ¹⁴N 배지로 옮겨 세대를 진행해 보자. 가설을 바꾸면 각 DNA 분자의 가닥 조성(파랑 = ¹⁵N 무거운 가닥, 노랑 = ¹⁴N 가벼운 가닥)과 원심 분리관에 생기는 띠의 위치·비율 예측이 달라진다. 1세대 결과(중간 띠만)가 보존적 가설을, 2세대 결과(중간 : 가벼움 = 1 : 1)가 분산적 가설을 배제하여 반보존적 복제만 남는다. 분산적 가설의 조각 배치는 한 예시이며, 띠의 굵기는 DNA 양에 비례하도록 단순화했다.',
  init: function (api) {
    var HYP = [
      { id: 'cons', name: '보존적' },
      { id: 'semi', name: '반보존적' },
      { id: 'disp', name: '분산적' },
    ];
    var SEG = 8;
    var state = { hyp: 'semi', gen: 2 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.56; }, label: '세대별 DNA 분자의 가닥 조성과 밀도 기울기 원심 분리 띠' });
    var ctx = cv.ctx;
    var rN = api.readout('DNA 분자 수');
    var rRatio = api.readout('무거움 : 중간 : 가벼움');
    var rMatch = api.readout('실제 실험 결과와');

    var g = api.group();
    var hb = HYP.map(function (h) {
      return api.button(h.name + ' 복제', function () { state.hyp = h.id; hb.forEach(function (b, i) { b.setAttribute('aria-pressed', HYP[i].id === h.id ? 'true' : 'false'); }); draw(); }, { toggle: true, pressed: h.id === state.hyp, parent: g });
    });
    var gs = api.slider({ id: 'dna-replication-gen', label: '¹⁴N 배지로 옮긴 뒤', min: 0, max: 3, step: 1, value: 2,
      format: function (v) { return v + '세대'; }, onInput: function (v) { state.gen = v; draw(); } });
    api.button('다음 세대', function () { gs.set(state.gen >= 3 ? 0 : state.gen + 1); }, { primary: true });

    // 각 세대의 분자 목록: 분자 = [가닥1, 가닥2], 가닥 = 길이 SEG 배열(1 = ¹⁵N 조각, 0 = ¹⁴N 조각)
    function full(v) { var a = []; for (var i = 0; i < SEG; i++) a.push(v); return a; }
    function molecules(hyp, n) {
      var mols = [[full(1), full(1)]];
      for (var k = 1; k <= n; k++) {
        var next = [];
        mols.forEach(function (m, mi) {
          if (hyp === 'semi') { next.push([m[0], full(0)]); next.push([full(0), m[1]]); }
          else if (hyp === 'cons') { next.push(m); next.push([full(0), full(0)]); }
          else {
            // 분산적: 옛 조각과 새 조각이 각 가닥에 고르게 섞인다(조각 위치는 예시)
            next.push([spread(m[0], m[1], 0, mi), spread(m[0], m[1], 1, mi)]);
            next.push([spread(m[0], m[1], 0, mi + 1), spread(m[0], m[1], 1, mi + 1)]);
          }
        });
        mols = next;
      }
      return mols;
    }
    // 분산적 가설: 부모 두 가닥의 ¹⁵N 조각 수를 네 딸 가닥에 똑같이 나눈다
    function spread(a, b, which, seed) {
      var heavy = 0; a.concat(b).forEach(function (v) { heavy += v; });
      var per = heavy / 4, out = full(0);
      for (var j = 0; j < per; j++) out[(j * Math.round(SEG / Math.max(per, 1)) + which * 2 + seed * 3) % SEG] = 1;
      return out;
    }
    function frac(m) { var s = 0; m[0].concat(m[1]).forEach(function (v) { s += v; }); return s / (2 * SEG); }
    function classify(mols) {
      var c = { heavy: 0, mid: 0, light: 0, other: {} };
      mols.forEach(function (m) {
        var f = frac(m);
        if (f === 1) c.heavy++; else if (f === 0) c.light++; else if (f === 0.5) c.mid++; else c.other[f] = (c.other[f] || 0) + 1;
      });
      return c;
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { tree: { x: 0, y: 0, w: w, h: h * 0.56 }, tubes: { x: 0, y: h * 0.6, w: w, h: h * 0.4 } }
        : { tree: { x: 0, y: 0, w: w * 0.6, h: h }, tubes: { x: w * 0.63, y: 0, w: w * 0.37, h: h } };
    }

    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawTree(T, L.tree);
      drawTubes(T, L.tubes);
      var mols = molecules(state.hyp, state.gen), c = classify(mols);
      rN.set(mols.length + '개');
      var oth = Object.keys(c.other);
      rRatio.set(oth.length ? '중간과 가벼움 사이 띠 하나(¹⁵N ' + (parseFloat(oth[0]) * 100).toString() + '%)' : ratio(c));
      var real = classify(molecules('semi', state.gen));
      var same = c.heavy === real.heavy && c.mid === real.mid && c.light === real.light && !oth.length;
      rMatch.set(same ? '일치' : '불일치 → 이 가설은 배제');
    }
    function gcd(a, b) { return b ? gcd(b, a % b) : a; }
    function ratio(c) {
      var arr = [c.heavy, c.mid, c.light], d = arr.reduce(function (a, b) { return gcd(a, b); });
      return arr.map(function (v) { return v / d; }).join(' : ');
    }

    function drawTree(T, r) {
      var n = state.gen, rows = n + 1, top = r.y + 26, rowH = (r.h - 40) / Math.max(rows, 4);
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(HYP.filter(function (h) { return h.id === state.hyp; })[0].name + ' 복제라면 — 세대별 DNA 분자', r.x + 4, r.y + 10);
      var labelW = 50, x0 = r.x + labelW, avail = r.w - labelW - 6;
      var prevPos = [];
      for (var k = 0; k <= n; k++) {
        var mols = molecules(state.hyp, k), cnt = mols.length;
        var slot = avail / 8, mw = Math.min(slot * 0.82, 70), y = top + k * rowH + rowH * 0.45;
        ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        ctx.fillText(k + '세대', r.x + 4, y);
        var pos = [];
        mols.forEach(function (m, i) {
          var cx = x0 + avail * (i + 0.5) / cnt;
          pos.push(cx);
          if (k > 0) {
            var pc = prevPos[Math.floor(i / 2)];
            ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pc, y - rowH + 9); ctx.lineTo(cx, y - 9); ctx.stroke();
          }
          drawMol(T, m, cx - mw / 2, y, mw);
        });
        prevPos = pos;
      }
      // 범례
      var ly = r.y + r.h - 10;
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillRect(r.x + 4, ly - 4, 16, 6); ctx.fillStyle = T.figInk; ctx.fillText('¹⁵N 가닥(옛)', r.x + 24, ly);
      ctx.fillStyle = T.figAmber; ctx.fillRect(r.x + 110, ly - 4, 16, 6); ctx.fillStyle = T.figInk; ctx.fillText('¹⁴N 가닥(새)', r.x + 130, ly);
    }
    function drawMol(T, m, x, y, w) {
      var sh = 7, gap = 3, sw = w / SEG;
      [0, 1].forEach(function (s) {
        var yy = s === 0 ? y - gap / 2 - sh : y + gap / 2;
        m[s].forEach(function (v, i) { ctx.fillStyle = v ? T.figBlue : T.figAmber; ctx.fillRect(x + i * sw, yy, sw + 0.3, sh); });
      });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 0.6; ctx.strokeRect(x, y - gap / 2 - sh, w, sh); ctx.strokeRect(x, y + gap / 2, w, sh);
    }

    function drawTubes(T, r) {
      var n = state.gen, count = 4, tw = Math.min(30, r.w / 7), labelW = 54;
      var top = r.y + 34, bot = r.y + r.h - 34, areaX = r.x + labelW;
      var span = r.w - labelW - 8;
      var yOf = function (f) { return top + 18 + (bot - top - 36) * (0.15 + 0.7 * f); };   // f: ¹⁵N 비율(무거울수록 아래)
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('원심 분리 결과(예측)', r.x + 4, r.y + 12);
      // 기준선
      [[0, '가벼움'], [0.5, '중간'], [1, '무거움']].forEach(function (b) {
        var y = yOf(b[0]);
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(areaX - 4, y); ctx.lineTo(r.x + r.w - 4, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText(b[1], areaX - 8, y);
      });
      for (var k = 0; k < count; k++) {
        var cx = areaX + span * (k + 0.5) / count;
        ctx.globalAlpha = k <= n ? 1 : 0.35;
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx - tw / 2, top); ctx.lineTo(cx - tw / 2, bot - tw / 2);
        ctx.arc(cx, bot - tw / 2, tw / 2, Math.PI, 0, true); ctx.lineTo(cx + tw / 2, top); ctx.fill(); ctx.stroke();
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
        ctx.fillText(k + '세대', cx, bot + 12);
        if (k <= n) {
          var mols = molecules(state.hyp, k), tot = mols.length, groups = {};
          mols.forEach(function (m) { var f = frac(m); groups[f] = (groups[f] || 0) + 1; });
          Object.keys(groups).forEach(function (f) {
            var share = groups[f] / tot, y = yOf(parseFloat(f)), th = 2 + 7 * share;
            ctx.fillStyle = T.figAccent; ctx.globalAlpha = 0.35 + 0.65 * share;
            ctx.fillRect(cx - tw / 2 + 2, y - th / 2, tw - 4, th);
            ctx.globalAlpha = 1;
          });
        }
        ctx.globalAlpha = 1;
      }
    }

    api.onResize(draw);
    draw();
  },
});
