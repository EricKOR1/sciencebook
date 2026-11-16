/* 세포와 물질대사 3: 전자 전달계와 화학 삼투 — 미토콘드리아 내막 / 엽록체 틸라코이드 막, 저해 실험 */
Sims.register('chemiosmosis', {
  title: '전자가 흐르면 H⁺이 쌓이고, H⁺이 돌아오며 ATP가 생긴다',
  caption: '전자가 전자 전달계를 지나며 내놓은 에너지로 H⁺이 막 한쪽으로 퍼 올려지고, 쌓인 H⁺이 농도 기울기를 따라 ATP 합성 효소를 지나 돌아올 때 ATP가 만들어진다. 버튼을 눌러 무엇이 멈추는지 추론해 보자: 산소가 없으면(엽록체는 빛이 없으면) 전자 흐름이 멈추고, 짝풀림 물질은 H⁺이 막을 그냥 새어 들게 하여 전자 전달은 오히려 빨라지지만 ATP는 생기지 않는다(에너지는 열로). ATP 합성 효소를 막으면 H⁺이 돌아오지 못해 기울기가 너무 커지고, 그 결과 전자 전달(산소 소비)도 거의 멈춘다. 전자 전달 효소 복합체의 수와 입자 수는 단순화했고, 수치는 상대값이다.',
  init: function (api) {
    var st = { org: 'mito', cond: 'normal', G: 0.49, e: 0.51, s: 0.51, u: 0, atpCount: 0, hs: [], els: [], atps: [], hAcc: 0, sAcc: 0, uAcc: 0, rot: 0, hSince: 0 };
    var E0 = 1, KS = 1.5, GTH = 0.15, KU = 8, LEAK = 0.05;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.58; }, label: '막에 박힌 전자 전달계와 ATP 합성 효소, H⁺의 이동' });
    var ctx = cv.ctx;
    var rE = api.readout('전자 전달 속도');
    var rG = api.readout('H⁺ 농도 차');
    var rA = api.readout('ATP 합성');
    var rH = api.readout('상태');

    var g1 = api.group();
    var orgB = [['mito', '미토콘드리아 내막'], ['chloro', '엽록체 틸라코이드 막']].map(function (o, i) {
      return api.button(o[1], function () { st.org = o[0]; orgB.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); relabel(); reset(); }, { toggle: true, pressed: i === 0, parent: g1 });
    });
    var g2 = api.group();
    var CONDS = [['normal', '정상'], ['noE', '산소 없음'], ['unc', '짝풀림 물질'], ['inh', 'ATP 합성 효소 저해']];
    var cb = CONDS.map(function (c, i) {
      return api.button(c[1], function () { st.cond = c[0]; cb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); if (api.reduced) settle(); update(); }, { toggle: true, pressed: i === 0, parent: g2 });
    });
    function relabel() { cb[1].textContent = st.org === 'mito' ? '산소 없음' : '빛 끄기'; rE.set('–'); }
    var REF = { e: 0.51, s: 0.51, G: 0.49 };

    function rates(G) {
      var e = st.cond === 'noE' ? 0 : E0 * Math.max(0, 1 - G);
      var s = st.cond === 'inh' ? 0 : KS * Math.max(0, G - GTH);
      var u = (st.cond === 'unc' ? KU : LEAK) * G;
      return { e: e, s: s, u: u };
    }
    function step(dt) {
      var r = rates(st.G);
      st.G += (r.e - r.s - r.u) * dt / 1.6;
      st.G = Math.max(0, Math.min(1, st.G));
      st.e = r.e; st.s = r.s; st.u = r.u;
    }
    function settle() { for (var i = 0; i < 4000; i++) step(0.01); }
    function reset() { st.cond = 'normal'; cb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === 0 ? 'true' : 'false'); }); st.G = 0.49; settle(); st.hs = []; st.els = []; st.atps = []; update(); }

    function geo() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var mT = h * 0.47, mB = mT + 34;
      var xs = narrow ? [0.13, 0.36, 0.59, 0.85] : [0.14, 0.34, 0.54, 0.82];
      return { w: w, h: h, mT: mT, mB: mB, p: xs.map(function (f) { return w * f; }), narrow: narrow };
    }
    function pumpsIdx() { return st.org === 'mito' ? [0, 1, 2] : [1]; }

    var loop = api.loop(function (dt) {
      step(dt);
      var Gm = geo();
      st.hAcc += st.e * dt * 4; st.sAcc += st.s * dt * 4; st.uAcc += st.u * dt * 4;
      var P = pumpsIdx();
      while (st.hAcc >= 1) { st.hAcc -= 1; var k = P[Math.floor(Math.random() * P.length)]; st.hs.push({ x: Gm.p[k], dir: -1, t: 0 }); }
      while (st.sAcc >= 1) { st.sAcc -= 1; st.hs.push({ x: Gm.p[3], dir: 1, t: 0, syn: true }); st.hSince++; if (st.hSince >= 3) { st.hSince = 0; st.atps.push({ t: 0 }); } }
      while (st.uAcc >= 1) { st.uAcc -= 1; st.hs.push({ x: Gm.w * (0.2 + Math.random() * 0.5), dir: 1, t: 0, leak: true }); }
      st.hs = st.hs.filter(function (h) { h.t += dt / 0.9; return h.t < 1; });
      st.atps = st.atps.filter(function (a) { a.t += dt / 1.4; return a.t < 1; });
      st.rot += st.s * dt * 6;
      if (st.e > 0.01) { st.els.forEach(function (el) { el.t += st.e * dt * 0.5; }); if (Math.random() < st.e * dt * 3) st.els.push({ t: 0 }); }
      st.els = st.els.filter(function (el) { return el.t < 1; });
      draw(); update(true);
    });

    function draw() {
      var T = api.tokens(), G = geo(), w = G.w, h = G.h, mito = st.org === 'mito';
      ctx.clearRect(0, 0, w, h);
      // 구획
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(0, 0, w, G.mT);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(0, G.mB, w, h - G.mB);
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText(mito ? '막 사이 공간' : '틸라코이드 내부', 10, 20);
      ctx.fillText(mito ? '기질' : '스트로마', 10, h - 10);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('H⁺ 농도 높음(pH 낮음)', 10, 36);
      ctx.fillText(mito ? 'ATP가 만들어지는 쪽 · TCA 회로' : 'ATP가 만들어지는 쪽 · 캘빈 회로', 10, h - 26);
      // H⁺ 입자(위쪽 수 ∝ 농도 차)
      var nTop = Math.round(3 + st.G * 34), nBot = 6;
      ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figRed; ctx.textAlign = 'center';
      for (var i = 0; i < nTop; i++) { var hx = hash(i * 7.1) * (w - 40) + 20, hy = 48 + hash(i * 3.3 + 1) * (G.mT - 62); ctx.fillText('H⁺', hx, hy); }
      for (var j = 0; j < nBot; j++) { var bx = hash(j * 5.7 + 9) * (w * 0.6) + w * 0.3, by = G.mB + 22 + hash(j * 2.1 + 4) * (h - G.mB - 70); ctx.fillText('H⁺', bx, by); }
      // 막
      ctx.fillStyle = mito ? T.figSoftRed : T.figSoftGreen; ctx.globalAlpha = 0.6; ctx.fillRect(0, G.mT, w, G.mB - G.mT); ctx.globalAlpha = 1;
      ctx.strokeStyle = mito ? T.figRed : T.figGreen; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, G.mT); ctx.lineTo(w, G.mT); ctx.moveTo(0, G.mB); ctx.lineTo(w, G.mB); ctx.stroke();
      // 전자 경로
      var path = [];
      var y0 = G.mB + 22, yE = (G.mT + G.mB) / 2;
      path.push([Math.max(8, G.p[0] - 50), y0]);
      for (var k = 0; k < 3; k++) path.push([G.p[k], yE]);
      path.push([G.p[2] + 40, y0 + 6]);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); path.forEach(function (q, n) { if (n) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); ctx.setLineDash([]);
      // 단백질
      var names = mito ? ['복합체 Ⅰ', '복합체 Ⅲ', '복합체 Ⅳ'] : ['광계Ⅱ', '시토크롬 복합체', '광계Ⅰ'];
      for (var q = 0; q < 3; q++) {
        var pump = pumpsIdx().indexOf(q) >= 0;
        ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2;
        rr(G.p[q] - 20, G.mT - 14, 40, G.mB - G.mT + 28, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = (G.narrow ? '11px ' : '12px ') + T.fontBody; ctx.textAlign = 'center';
        var nm = names[q];
        if (G.narrow && nm.length > 5) { ctx.fillText('시토크롬', G.p[q], G.mT - 32); ctx.fillText('복합체', G.p[q], G.mT - 19); }
        else ctx.fillText(nm, G.p[q], G.mT - 20);
        if (!mito && q !== 1) { // 빛
          var lit = st.cond !== 'noE';
          ctx.strokeStyle = lit ? T.figAmber : T.figLine; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(G.p[q] - 30, G.mT - 62); ctx.lineTo(G.p[q] - 14, G.mT - 40); ctx.stroke();
          ctx.fillStyle = lit ? T.figAmber : T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText(lit ? '빛' : '빛 없음', G.p[q] - 34, G.mT - 66);
        }
        if (!pump && mito === false && q === 0) {}
      }
      // 전자 공급·수용 이름표
      ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figInk;
      if (mito) {
        ctx.fillText('NADH → NAD⁺', Math.max(40, G.p[0] - 34), y0 + 18);
        ctx.fillStyle = st.cond === 'noE' ? T.figRed : T.figInk;
        ctx.fillText(st.cond === 'noE' ? 'O₂ 없음 ✕' : 'O₂ + H⁺ → H₂O', G.narrow ? G.p[2] : G.p[2] + 40, G.narrow ? y0 + 40 : y0 + 24);
      } else {
        ctx.fillText('H₂O → O₂ + H⁺', Math.max(44, G.p[0]), G.mT - 84);
        ctx.fillText('NADP⁺ → NADPH', G.narrow ? G.p[2] : G.p[2] + 40, G.narrow ? y0 + 40 : y0 + 24);
      }
      // ATP 합성 효소
      var sx = G.p[3];
      var blocked = st.cond === 'inh';
      ctx.fillStyle = T.figSoftTeal; ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2;
      rr(sx - 16, G.mT - 10, 32, G.mB - G.mT + 20, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, G.mB + 30, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2;
      for (var a = 0; a < 3; a++) { var an = st.rot + a * 2.094; ctx.beginPath(); ctx.moveTo(sx, G.mB + 30); ctx.lineTo(sx + 16 * Math.cos(an), G.mB + 30 + 16 * Math.sin(an)); ctx.stroke(); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('ATP 합성 효소', sx, G.mT - 20);
      if (blocked) { ctx.strokeStyle = T.figRed; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 18, G.mT - 12); ctx.lineTo(sx + 18, G.mB + 12); ctx.moveTo(sx + 18, G.mT - 12); ctx.lineTo(sx - 18, G.mB + 12); ctx.stroke(); }
      ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('ADP + Pᵢ → ATP', sx, G.mB + 70);
      st.atps.forEach(function (at) { ctx.globalAlpha = 1 - at.t; ctx.fillStyle = T.figGreen; ctx.font = '700 13px ' + T.fontBody; ctx.fillText('ATP', sx + 30 + at.t * 20, G.mB + 40 + at.t * 30); ctx.globalAlpha = 1; });
      // 짝풀림 물질
      if (st.cond === 'unc') {
        ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('짝풀림 물질: H⁺이 막을 그냥 통과 → 열', w * 0.42, G.mB + (G.narrow ? 92 : 62));
      }
      // 이동 중인 H⁺
      ctx.font = '700 12px ' + T.fontBody; ctx.textAlign = 'center';
      st.hs.forEach(function (hh) {
        var yA = hh.dir < 0 ? G.mB + 18 : G.mT - 18, yB = hh.dir < 0 ? G.mT - 18 : G.mB + 18;
        ctx.fillStyle = hh.leak ? T.figAmber : T.figRed;
        ctx.fillText('H⁺', hh.x + (hh.syn ? 0 : 0), yA + (yB - yA) * hh.t);
      });
      // 전자
      st.els.forEach(function (el) {
        var segs = path.length - 1, f = el.t * segs, n = Math.min(segs - 1, Math.floor(f)), u = f - n;
        var x = path[n][0] + (path[n + 1][0] - path[n][0]) * u, y = path[n][1] + (path[n + 1][1] - path[n][1]) * u;
        ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.font = '700 9px ' + T.fontBody; ctx.fillText('e⁻', x, y + 3);
      });
      // 방향 안내
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(mito ? 'H⁺: 기질 → 막 사이 공간(퍼 올림)' : 'H⁺: 스트로마 → 틸라코이드 내부(퍼 올림)', w - 8, 20);
      // 게이지
      gauge(T, w - 8, 30, 'H⁺ 농도 차', st.G, T.figRed);
    }
    function gauge(T, right, y, label, v, col) {
      var bw = Math.min(120, cv.w * 0.25), x = right - bw;
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; rr(x, y, bw, 10, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; rr(x, y, Math.max(4, bw * v), 10, 5); ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText(label, x - 6, y + 9);
    }
    function hash(n) { var s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function pct(v, ref) { return Math.round(v / ref * 100); }
    var lastTxt = '';
    function update(fromLoop) {
      var mito = st.org === 'mito';
      var eTxt = pct(st.e, REF.e) + '%', aTxt = st.s < 0.02 ? '멈춤' : pct(st.s, REF.s) + '%';
      var lbl = mito ? 'O₂ 소비' : 'O₂ 발생·NADPH 생성';
      var msg = {
        normal: '정상: 전자 전달과 ATP 합성이 함께 일어난다',
        noE: mito ? '산소 없음: 마지막 전자 수용체가 없어 전자 흐름이 멈춘다' : '빛 없음: 광계가 전자를 내보내지 못해 전자 흐름이 멈춘다',
        unc: 'H⁺ 기울기가 사라져 ATP는 못 만들고, 에너지는 열로',
        inh: 'H⁺이 돌아오지 못해 기울기가 커지고, 퍼 올리기 어려워 전자 전달도 느려진다',
      }[st.cond];
      var txt = eTxt + '|' + aTxt + '|' + Math.round(st.G * 100) + msg + st.org;
      if (fromLoop && txt === lastTxt) return;
      lastTxt = txt;
      rE.set(lbl + ' ' + eTxt);
      rG.set(Math.round(st.G * 100) + ' (정상 ' + Math.round(REF.G * 100) + ')');
      rA.set(aTxt);
      rH.set(msg);
      if (!fromLoop) draw();
    }
    api.onResize(draw);
    relabel(); settle(); REF = { e: st.e, s: st.s, G: st.G }; update();
    if (api.reduced) {
      loop.pause();
      // 움직임 줄이기: 각 조건의 최종 상태를 바로 그린다
    }
  },
});
