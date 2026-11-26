/* 유기화학 13: 아민의 pH–분율·추출 탐색기 — f_B, D = P·f_B, n번 추출 뒤 물층에 남는 분율 [1/(1 + D·r)]^n, 세 성분(아민·카복실산·중성) 비교 */
Sims.register('mj-amine-extraction', {
  title: '아민의 pH–분율·추출 탐색기',
  caption: 'pH, pKaH, log P, 부피비, 추출 횟수를 바꿔 보자. 위 그래프는 자유 아민의 분율 f_B = 1/(1 + 10^(pKaH − pH))와 암모늄 이온의 분율 1 − f_B이고, 아래 분액 깔때기는 n번 추출해 모은 유기층(위)과 남은 물층(아래)의 분자를 계산된 비율대로 보여 준다(점 하나가 같은 양). 분배비 D = P·f_B, 부피비 r = V유기/V물일 때 물층에 남는 분율은 [1/(1 + D·r)]^n이고, 오른쪽 막대는 같은 용매를 n번에 나누어 쓸 때와 한 번에 모두(부피비 n·r) 쓸 때의 추출률 E를 비교한다. 이온(BH⁺, RCOO⁻)은 유기층에 들어가지 않고, 세 성분의 중성 형태는 같은 P를 가지며 서로 영향을 주지 않는다고 가정했다(카복실산 pKa 4.2, 25 ℃, 묽은 용액).',
  init: function (api) {
    var PRE = [
      { n: '아닐린', v: 4.6 }, { n: '피리딘', v: 5.2 }, { n: '이미다졸', v: 7.0 },
      { n: '벤질아민', v: 9.34 }, { n: '트라이에틸아민', v: 10.75 }, { n: '피페리딘', v: 11.1 }
    ];
    var ACID_PKA = 4.2;
    var st = { pH: 7.0, pk: 9.34, logP: 1.3, r: 1.0, n: 1, three: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.62 : 0.78; }, label: 'pH에 따른 아민의 분율 곡선과 분액 깔때기 속 분자 분포, 추출률 막대' });
    var ctx = cv.ctx;
    var rA = api.readout('아민  '), rE = api.readout('추출  '), rC = api.readout('세 성분  ');
    api.slider({ id: 'mj-amine-extraction-ph', label: '수용액 pH', min: 0, max: 14, step: 0.1, value: st.pH,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.pH = v; draw(); } });
    var skPk = api.slider({ id: 'mj-amine-extraction-pk', label: '아민의 pKaH', min: 0, max: 12, step: 0.01, value: st.pk,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.pk = v; syncPre(); draw(); } });
    var gp = api.group();
    var lab = document.createElement('span'); lab.textContent = '미리 설정: '; lab.style.fontSize = '0.9em'; gp.appendChild(lab);
    var pb = PRE.map(function (p) {
      return api.button(p.n + ' ' + p.v, function () { st.pk = p.v; setSlider(skPk, p.v); syncPre(); draw(); }, { toggle: true, pressed: p.v === st.pk, parent: gp });
    });
    api.slider({ id: 'mj-amine-extraction-logp', label: '분배 계수 log P', min: -1, max: 4, step: 0.1, value: st.logP,
      format: function (v) { return v.toFixed(1) + ' (P = ' + fmtP(Math.pow(10, v)) + ')'; }, onInput: function (v) { st.logP = v; draw(); } });
    api.slider({ id: 'mj-amine-extraction-r', label: '부피비 V유기/V물', min: 0.2, max: 5, step: 0.1, value: st.r,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.r = v; draw(); } });
    api.slider({ id: 'mj-amine-extraction-n', label: '추출 횟수 n', min: 1, max: 4, step: 1, value: st.n,
      format: function (v) { return String(Math.round(v)); }, onInput: function (v) { st.n = Math.round(v); draw(); } });
    var gm = api.group();
    var bm1 = api.button('아민만', function () { st.three = false; syncMode(); draw(); }, { toggle: true, pressed: true, parent: gm });
    var bm2 = api.button('세 성분 비교(아민 · 카복실산 · 중성)', function () { st.three = true; syncMode(); draw(); }, { toggle: true, pressed: false, parent: gm });

    function setSlider(s, v) {
      var inp = (s && s.input) || (s && s.querySelector && s.querySelector('input')) || document.getElementById('mj-amine-extraction-pk');
      if (inp) { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    function syncPre() { pb.forEach(function (b, k) { b.setAttribute('aria-pressed', String(Math.abs(PRE[k].v - st.pk) < 0.001)); }); }
    function syncMode() { bm1.setAttribute('aria-pressed', String(!st.three)); bm2.setAttribute('aria-pressed', String(st.three)); }
    function fmtP(P) { return P >= 100 ? P.toFixed(0) : P >= 10 ? P.toFixed(1) : P >= 1 ? P.toFixed(2) : P.toFixed(3); }
    function pct(v) { v *= 100; return v >= 99.95 ? '> 99.9 %' : v < 0.05 ? '< 0.1 %' : (v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' %'; }
    function sci(v) { if (v === 0) return '0'; if (v >= 0.01 && v < 1000) return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); var e = Math.floor(Math.log10(v)); return (v / Math.pow(10, e)).toFixed(1) + '×10^' + e; }

    // 계산
    function fB(pk, pH) { return 1 / (1 + Math.pow(10, pk - pH)); }          // 염기: 중성 형태 분율
    function fHA(pk, pH) { return 1 / (1 + Math.pow(10, pH - pk)); }         // 산: 중성 형태 분율
    function remain(D, r, n) { return Math.pow(1 / (1 + D * r), n); }
    function comp(kind) {
      var P = Math.pow(10, st.logP), f = kind === 'amine' ? fB(st.pk, st.pH) : kind === 'acid' ? fHA(ACID_PKA, st.pH) : 1;
      var D = P * f, rem = remain(D, st.r, st.n), rem1 = remain(D, st.r * st.n, 1);
      return { f: f, D: D, rem: rem, E: 1 - rem, E1: 1 - rem1 };
    }

    // 점 위치(고정 난수)
    function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var A = comp('amine'), Ac = comp('acid'), Ne = comp('neutral');
      // ── 위: 분율 그래프
      var gL = narrow ? 40 : 54, gR = w - (narrow ? 12 : 20), gT = 26, gB = narrow ? h * 0.36 : h * 0.43;
      var X = function (p) { return gL + p / 14 * (gR - gL); }, Y = function (f) { return gB - f * (gB - gT); };
      ctx.lineWidth = 1; ctx.strokeStyle = T.rule; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var p = 0; p <= 14; p += (narrow ? 2 : 1)) {
        ctx.beginPath(); ctx.moveTo(X(p), gT); ctx.lineTo(X(p), gB); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(String(p), X(p), gB + 13);
      }
      [0, 0.5, 1].forEach(function (f) {
        ctx.beginPath(); ctx.moveTo(gL, Y(f)); ctx.lineTo(gR, Y(f)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(String(f), gL - 5, Y(f) + 4);
      });
      ctx.strokeStyle = T.figLine; ctx.strokeRect(gL, gT, gR - gL, gB - gT);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('수용액 pH', (gL + gR) / 2, gB + 27);
      ctx.save(); ctx.translate(11, (gT + gB) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('분율', 0, 0); ctx.restore();
      function curve(fn, color, width, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var i = 0; i <= 280; i++) { var pp = 14 * i / 280, yy = Y(fn(pp)); if (i) ctx.lineTo(X(pp), yy); else ctx.moveTo(X(pp), yy); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      curve(function (pp) { return fB(st.pk, pp); }, T.figBlue, 3);
      curve(function (pp) { return 1 - fB(st.pk, pp); }, T.figRed, 3);
      if (st.three) curve(function (pp) { return fHA(ACID_PKA, pp); }, T.figGreen, 2, [6, 4]);
      // pKaH 표시
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(X(st.pk), gT); ctx.lineTo(X(st.pk), gB); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(X(st.pk), Y(0.5), 4, 0, 7); ctx.fill();
      ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      var lr = X(st.pk) < (gL + gR) / 2; ctx.textAlign = lr ? 'left' : 'right';
      ctx.fillText('pKaH ' + st.pk.toFixed(2) + ' (분율 0.5)', X(st.pk) + (lr ? 7 : -7), Y(0.5) - 7);
      // 현재 pH
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(st.pH), gT); ctx.lineTo(X(st.pH), gB); ctx.stroke();
      [[A.f, T.figBlue], [1 - A.f, T.figRed]].concat(st.three ? [[Ac.f, T.figGreen]] : []).forEach(function (q) {
        ctx.fillStyle = q[1]; ctx.beginPath(); ctx.arc(X(st.pH), Y(q[0]), 5.5, 0, 7); ctx.fill();
        ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // 범례
      var leg = [['f_B 자유 아민 B', T.figBlue, []], ['1 − f_B 암모늄 이온 BH⁺', T.figRed, []]];
      if (st.three) leg.push(['카복실산 중성 형태 RCOOH (pKa 4.2)', T.figGreen, [6, 4]]);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      leg.forEach(function (it, k) {
        var tx = it[0], tw = ctx.measureText(tx).width;
        var xx = narrow ? gL + 6 : gR - tw - 30, yy = gT + 15 + k * 16;
        ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85; ctx.fillRect(xx - 4, yy - 11, tw + 28, 15); ctx.globalAlpha = 1;
        ctx.strokeStyle = it[1]; ctx.lineWidth = 3; ctx.setLineDash(it[2]); ctx.beginPath(); ctx.moveTo(xx, yy - 4); ctx.lineTo(xx + 16, yy - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(tx, xx + 21, yy);
      });

      // ── 아래: 분액 깔때기
      var top = gB + 44;
      if (narrow) {
        ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText('E = 유기층으로 옮겨 간 분율', 14, top);
        ctx.font = '600 18px ' + T.fontBody; ctx.fillStyle = T.figBlue; ctx.fillText('아민 ' + pct(A.E), 14, top + 22);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText('같은 총 부피(' + (st.n * st.r).toFixed(1) + '배)로 한 번: ' + pct(A.E1), 14, top + 39);
        if (st.three) {
          ctx.font = '600 12px ' + T.fontBody;
          ctx.fillStyle = T.figGreen; ctx.fillText('카복실산 ' + pct(Ac.E), 14, top + 56);
          ctx.fillStyle = T.figViolet; ctx.fillText('중성 ' + pct(Ne.E), w / 2, top + 56);
        }
        top += 66;
      }
      var fx, fw, fy = top + 4, fh;
      if (narrow) { fx = 18; fw = w * 0.52; fh = h - fy - 12; } else { fx = 40; fw = w * 0.36; fh = h - fy - 16; }
      var cx = fx + fw / 2;
      // 층 높이: 유기층 부피(n·r) : 물층(1)
      var vo = st.n * st.r, frac = Math.max(0.2, Math.min(0.8, vo / (vo + 1)));
      var bodyT = fy + 18, bodyB = fy + fh * 0.84, mid = bodyT + (bodyB - bodyT) * frac;
      var halfW = fw / 2;
      function wAt(y) { var t = (y - bodyT) / (bodyB - bodyT); return halfW * (t < 0.55 ? 1 - 0.12 * t : 0.934 * (1 - (t - 0.55) / 0.45 * 0.9)); }
      function shape(y0, y1) {
        ctx.beginPath(); var k, yy;
        for (k = 0; k <= 30; k++) { yy = y0 + (y1 - y0) * k / 30; if (k) ctx.lineTo(cx - wAt(yy), yy); else ctx.moveTo(cx - wAt(yy), yy); }
        for (k = 30; k >= 0; k--) { yy = y0 + (y1 - y0) * k / 30; ctx.lineTo(cx + wAt(yy), yy); }
        ctx.closePath();
      }
      shape(bodyT, mid); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      shape(mid, bodyB); ctx.fillStyle = T.figSoftBlue; ctx.fill();
      shape(bodyT, bodyB); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - wAt(mid), mid); ctx.lineTo(cx + wAt(mid), mid); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.stroke();
      // 목·마개·꼭지
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6;
      ctx.strokeRect(cx - 7, fy, 14, bodyT - fy);
      ctx.beginPath(); ctx.moveTo(cx, bodyB); ctx.lineTo(cx, fy + fh); ctx.stroke();
      ctx.fillStyle = T.figPanel; ctx.fillRect(cx - 9, fy + fh * 0.9 - 4, 18, 8); ctx.strokeRect(cx - 9, fy + fh * 0.9 - 4, 18, 8);
      // 층 이름
      ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      var lx = cx + halfW + 6;
      ctx.fillText(narrow ? '유기층' : '유기층(에터)', lx, bodyT + 12);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText(st.n > 1 ? st.n + '번 모음' : '한 번', lx, bodyT + 26);
      ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('물층', lx, mid + 16);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText('pH ' + st.pH.toFixed(1), lx, mid + 30);
      // 점
      function scatter(y0, y1, list, seed) {
        var R = rng(seed), out = [];
        list.forEach(function (it) {
          for (var k = 0; k < it.count; k++) {
            var yy = y0 + 7 + R() * Math.max(1, (y1 - y0 - 14)), ww = wAt(yy) - 8, xx = cx + (R() * 2 - 1) * Math.max(2, ww);
            out.push([xx, yy, it]);
          }
        });
        out.forEach(function (o) { mark(o[0], o[1], o[2]); });
      }
      function mark(x, y, it) {
        ctx.fillStyle = it.color;
        ctx.beginPath();
        if (it.shape === 'tri') { ctx.moveTo(x, y - 4.5); ctx.lineTo(x + 4.2, y + 3); ctx.lineTo(x - 4.2, y + 3); ctx.closePath(); }
        else if (it.shape === 'sq') { ctx.rect(x - 3.4, y - 3.4, 6.8, 6.8); }
        else ctx.arc(x, y, 3.6, 0, 7);
        ctx.fill();
        if (it.ring) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 0.8; ctx.stroke(); }
      }
      var N = st.three ? 30 : 60;
      function split(c, Nn) {
        var org = Math.round(Nn * c.E), aq = Nn - org, aqN = Math.round(aq * c.f);
        return { org: org, aqN: aqN, aqI: aq - aqN };
      }
      var sa = split(A, N);
      var orgL = [{ count: sa.org, color: T.figBlue, shape: 'c' }], aqL = [{ count: sa.aqN, color: T.figBlue, shape: 'c' }, { count: sa.aqI, color: T.figRed, shape: 'c', ring: true }];
      if (st.three) {
        var sc = split(Ac, N), sn = split(Ne, N);
        orgL.push({ count: sc.org, color: T.figGreen, shape: 'tri' }, { count: sn.org, color: T.figViolet, shape: 'sq' });
        aqL.push({ count: sc.aqN, color: T.figGreen, shape: 'tri' }, { count: sc.aqI, color: T.figAmber, shape: 'tri', ring: true }, { count: sn.aqN + sn.aqI, color: T.figViolet, shape: 'sq' });
      }
      scatter(bodyT, mid, orgL, 7);
      scatter(mid, bodyB, aqL, 19);
      // 점 범례
      var lg = [['B (자유 아민)', T.figBlue, 'c'], ['BH⁺ (암모늄)', T.figRed, 'c', 1]];
      if (st.three) lg.push(['RCOOH', T.figGreen, 'tri'], ['RCOO⁻', T.figAmber, 'tri', 1], ['중성 화합물', T.figViolet, 'sq']);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var ly0 = mid + 48;
      if (narrow) {
        var need = 13 * lg.length, upSpace = mid - (bodyT + 40), dnSpace = h - (mid + 40), y0n = (dnSpace >= need || dnSpace >= upSpace) ? mid + 46 : bodyT + 46;
        lg.forEach(function (it, k) { var yy = y0n + k * 13; mark(lx + 4, yy - 4, { color: it[1], shape: it[2], ring: it[3] }); ctx.fillStyle = T.figInk; ctx.fillText(it[0], lx + 12, yy); });
      } else {
        lg.forEach(function (it, k) { var yy = ly0 + k * 15; mark(lx + 4, yy - 4, { color: it[1], shape: it[2], ring: it[3] }); ctx.fillStyle = T.figInk; ctx.fillText(it[0], lx + 12, yy); });
      }

      // ── 추출률 막대
      var bx0, bx1, by0, by1;
      if (narrow) { bx0 = fx + fw + 70; bx1 = w - 10; by0 = top + 2; by1 = mid - 6; }
      else { bx0 = fx + fw + 140; bx1 = w - 16; by0 = top + 6; by1 = h - 30; }
      if (!narrow) {
        ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText('E = 유기층으로 옮겨 간 분율', bx0, by0 + 6);
        var list = [['아민', A, T.figBlue]];
        if (st.three) list.push(['카복실산', Ac, T.figGreen], ['중성', Ne, T.figViolet]);
        var ax0 = bx0 + 58, ax1 = bx1 - 50, rowH = st.three ? 44 : 64, y = by0 + 26;
        ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
        [0, 0.5, 1].forEach(function (t) { ctx.fillText(String(t), ax0 + t * (ax1 - ax0), by1 + 14); });
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
        [0, 0.25, 0.5, 0.75, 1].forEach(function (t) { ctx.beginPath(); ctx.moveTo(ax0 + t * (ax1 - ax0), by0 + 16); ctx.lineTo(ax0 + t * (ax1 - ax0), by1); ctx.stroke(); });
        list.forEach(function (it) {
          var c = it[1];
          ctx.textAlign = 'right'; ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody;
          ctx.fillText(it[0], ax0 - 6, y + 12);
          ctx.fillStyle = it[2]; ctx.fillRect(ax0, y + 2, (ax1 - ax0) * c.E, 13);
          ctx.globalAlpha = 0.45; ctx.fillRect(ax0, y + 19, (ax1 - ax0) * c.E1, 9); ctx.globalAlpha = 1;
          ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figInk;
          ctx.fillText(pct(c.E), ax0 + (ax1 - ax0) * c.E + 4, y + 13);
          ctx.fillStyle = T.figMuted; ctx.fillText(pct(c.E1), ax0 + (ax1 - ax0) * c.E1 + 4, y + 28);
          y += rowH;
        });
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        var ky = Math.min(by1 - 22, y + 2);
        ctx.fillStyle = T.figInk; ctx.fillText('진한 막대: 부피비 ' + st.r.toFixed(1) + '로 ' + st.n + '번', ax0, ky);
        ctx.fillStyle = T.figMuted; ctx.fillText('옅은 막대: 같은 총 부피(' + (st.n * st.r).toFixed(1) + '배)로 한 번', ax0, ky + 15);
      }

      // 수치
      rA.set('f_B = ' + pct(A.f) + ' · D = P·f_B = ' + sci(A.D) + ' · BH⁺ ' + pct(1 - A.f));
      rE.set(st.n + '번 뒤 물층에 남는 분율 [1/(1 + D·r)]^n = ' + pct(A.rem) + ' → E = ' + pct(A.E) + ' (한 번에 ' + (st.n * st.r).toFixed(1) + '배 부피: E = ' + pct(A.E1) + ')');
      rC.set(st.three ? '카복실산 D = ' + sci(Ac.D) + ', E = ' + pct(Ac.E) + ' · 중성 D = ' + sci(Ne.D) + ', E = ' + pct(Ne.E) : '‘세 성분 비교’를 누르면 카복실산(pKa 4.2)과 중성 화합물을 함께 넣는다');
    }
    api.onResize(draw);
    draw();
  },
});
