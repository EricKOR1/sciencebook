/* 유기화학 11 카복실산과 그 유도체: 친핵성 아실 치환의 에너지 도표 탐색기 — 유도체·친핵체를 고르고 산 촉매를 켜 본다 */
Sims.register('mj-acyl-substitution-energy', {
  title: '친핵성 아실 치환 에너지 도표 탐색기 — 이탈기와 공명이 정하는 두 언덕',
  caption: '유도체와 친핵체를 고르면 반응물 → TS1(첨가) → 사면체 중간체 → TS2(제거) → 생성물의 곡선이 그려진다. 높은 쪽 언덕(빨강)이 속도 결정 단계이고, ' +
    '생성물이 출발 물질보다 높으면 그 방향으로는 직접 바꿀 수 없다(사다리를 거슬러 오르는 반응). 산 촉매를 켜면 카보닐 산소가 양성자화되어 물·알코올 같은 약한 중성 친핵체의 첨가 장벽(TS1)이 낮아진다. ' +
    '높이는 이탈기 짝산의 pKa(Cl⁻ −7, RCOO⁻ 4.8, RO⁻ 16, R₂N⁻ 38)와 Y의 공명 주기 정도로 정한 설명용 상대값(kJ/mol)이며, 실제 값이 아니다.',
  init: function (api) {
    var DER = [
      { name: '산 염화물', y: 'Cl', pka: -7, res: 0.05, L: 0 },
      { name: '산 무수물', y: 'OCOR', pka: 4.8, res: 0.3, L: 1 },
      { name: '에스터', y: 'OR′', pka: 16, res: 0.5, L: 2 },
      { name: '아마이드', y: 'NR′₂', pka: 38, res: 0.85, L: 3 },
      { name: '카복실산 이온', y: 'O⁻', pka: 50, res: 1.0, L: 4, anion: true },
    ];
    var NUC = [
      { name: 'H₂O', n: 0.0, pka: -1.7, prod: '카복실산', L: 2, neutralWeak: true },
      { name: 'ROH', n: 0.1, pka: -2.0, prod: '에스터', L: 2, neutralWeak: true },
      { name: 'RNH₂', n: 0.6, pka: 10.6, prod: '아마이드', L: 3 },
      { name: 'OH⁻', n: 1.0, pka: 15.7, prod: '카복실산 이온', L: 4, anion: true },
    ];
    var st = { d: 0, u: 0, acid: false, cat: 0 };   // cat: 산 촉매 효과 0→1 (애니메이션)
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.52; }, label: '친핵성 아실 치환의 반응 에너지 도표' });
    var ctx = cv.ctx;
    var rRds = api.readout('속도 결정 단계');
    var rDG = api.readout('ΔG° (생성물 − 반응물)');
    var rProd = api.readout('생성물');
    var g1 = api.group();
    var dBtns = DER.map(function (d, i) { return api.button(d.name, function () { st.d = i; sync(); }, { toggle: true, pressed: i === 0, parent: g1 }); });
    var g2 = api.group();
    var uBtns = NUC.map(function (u, i) { return api.button(u.name, function () { st.u = i; sync(); }, { toggle: true, pressed: i === 0, parent: g2 }); });
    var acidBtn = api.button('산 촉매 켜기', function () { st.acid = !st.acid; acidBtn.setAttribute('aria-pressed', st.acid ? 'true' : 'false'); acidBtn.textContent = st.acid ? '산 촉매 끄기' : '산 촉매 켜기'; animate(); }, { toggle: true, primary: true });

    function catalysable() { return NUC[st.u].neutralWeak && !DER[st.d].anion; }
    function levels(cat) {
      var D = DER[st.d], U = NUC[st.u];
      var ts1 = 45 + 40 * D.res + 25 * (1 - U.n) + (D.anion ? 30 : 0);
      var drop = catalysable() ? 22 * cat : 0;
      ts1 -= drop;
      var I = ts1 - 20 + (catalysable() ? 0 : 0);
      var ts2 = I + 3 + Math.max(0, 0.9 * (D.pka - U.pka));
      var prodL = U.L;
      if (D.anion && U.anion) prodL = 4;
      var P = -18 * (prodL - D.L);
      if (D.L === 3 && st.u === 0) P -= 36 * cat;   // 산성 아마이드 가수 분해: 떨어진 아민이 암모늄 이온으로 잠겨 내리막(⑧)
      return { R: 0, TS1: ts1, I: I, TS2: ts2, P: P };
    }
    function animate() {
      if (api.reduced || !catalysable()) { st.cat = st.acid ? 1 : 0; draw(); report(); return; }
      loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var target = st.acid ? 1 : 0;
      var step = dt / 0.8;
      if (Math.abs(st.cat - target) <= step) { st.cat = target; loop.pause(); } else st.cat += st.cat < target ? step : -step;
      draw(); report();
    });
    loop.pause();
    function sync() {
      dBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.d ? 'true' : 'false'); });
      uBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.u ? 'true' : 'false'); });
      st.cat = st.acid ? 1 : 0;
      draw(); report();
    }
    function report() {
      var E = levels(st.cat), D = DER[st.d], U = NUC[st.u];
      rRds.set(E.TS2 > E.TS1 ? '제거(TS2) — 이탈기가 떨어지기 어렵다' : '첨가(TS1)');
      var dg = E.P;
      rDG.set((dg > 0 ? '+' : dg < 0 ? '−' : '') + Math.abs(dg).toFixed(0) + ' kJ/mol ' + (dg < 0 ? '(생성물이 더 안정)' : dg > 0 ? '(생성물이 덜 안정)' : '(평형)'));
      rProd.set(D.anion ? '— (떨어질 것이 O²⁻)' : U.prod + ' + ' + (D.y === 'OCOR' ? 'RCOO⁻' : D.y === 'Cl' ? 'Cl⁻' : D.y === 'OR′' ? 'R′OH' : (st.acid && st.u === 0 ? 'R′₂NH₂⁺ (암모늄 이온)' : 'R′₂NH')));
    }
    function hermite(E, sx, sy) {
      var v = [E.R, E.TS1, E.I, E.TS2, E.P], pts = [];
      for (var k = 0; k <= 200; k++) {
        var t = 4 * k / 200, i = Math.min(3, Math.floor(t)), s = t - i, h = 3 * s * s - 2 * s * s * s;
        pts.push([sx(t), sy(v[i] + (v[i + 1] - v[i]) * h)]);
      }
      return pts;
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var L = 58, R = w - 20, Tp = 34, B = h - 46;
      var gmin = -90, gmax = 150;
      var sx = function (t) { return L + 24 + t / 4 * (R - L - 48); };
      var sy = function (g) { return B - (g - gmin) / (gmax - gmin) * (B - Tp); };
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var g = -80; g <= 140; g += 40) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(L, sy(g)); ctx.lineTo(R, sy(g)); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText((g < 0 ? '−' : '') + Math.abs(g), L - 6, sy(g) + 4); }
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 6); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('반응 좌표', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(16, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('G (설명용 상대값, kJ/mol)', 0, 0); ctx.restore();
      var E = levels(st.cat), E0 = levels(0);
      if (st.acid && catalysable()) {         // 촉매 없을 때의 곡선(옅게)
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.6; ctx.beginPath();
        hermite(E0, sx, sy).forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.setLineDash([]);
      }
      var pts = hermite(E, sx, sy);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.6; ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      var rds = E.TS2 > E.TS1 ? 3 : 1;
      var names = ['반응물', 'TS1 첨가', '사면체 중간체', 'TS2 제거', '생성물'], vals = [E.R, E.TS1, E.I, E.TS2, E.P];
      ctx.font = '12px ' + T.fontBody;
      for (var k = 0; k < 5; k++) {
        var x = sx(k), y = sy(vals[k]), above = (k === 1 || k === 3);
        ctx.fillStyle = k === rds ? T.figRed : T.figInk;
        ctx.beginPath(); ctx.arc(x, y, k === rds ? 5 : 3.5, 0, 2 * Math.PI); ctx.fill();
        ctx.textAlign = 'center';
        var lab = names[k] + ' ' + (vals[k] < 0 ? '−' : vals[k] > 0 ? '+' : '') + Math.abs(vals[k]).toFixed(0);
        if (k === 0) ctx.textAlign = 'left';
        if (k === 4) ctx.textAlign = 'right';
        ctx.fillText(lab, x + (k === 0 ? -14 : k === 4 ? 14 : 0), above ? y - 12 : y + 20);
      }
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      var D = DER[st.d], U = NUC[st.u];
      ctx.fillStyle = T.figInk;
      ctx.fillText(D.name + ' (Y = ' + D.y + ') + ' + U.name, L + 8, 18);
      var msg = null, col = T.figRed;
      if (D.anion) msg = '카복실산 이온: 친핵체가 다가가기 어렵고 떨어질 것이 O²⁻ — 사실상 반응하지 않는다';
      else if (E.P > 0) msg = '이 방향으로는 직접 바꿀 수 없다 (사다리 거슬러 오르기)';
      else if (E.P === 0) { msg = '평형 — 과량 시약이나 생성물 제거로 민다'; col = T.figAmber; }
      if (st.acid && D.L === 3 && st.u === 0) { msg = '산성: 떨어진 아민이 암모늄 이온이 되어 되돌아오지 못한다 → 내리막'; col = T.figGreen; }
      if (st.acid && !catalysable() && !D.anion) {
        msg = U.anion ? '산성 조건에서는 OH⁻가 남아 있지 않다(산 촉매와 함께 쓸 수 없다)' : '산은 아민을 암모늄 이온으로 바꿔 친핵성을 없앤다(산 촉매 효과 없음)';
        col = T.figAmber;
      }
      if (msg) { ctx.fillStyle = col; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(msg, L + 8, 36 > Tp ? Tp + 6 : 36); }
      if (st.acid && catalysable()) { ctx.fillStyle = T.figGreen; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('점선: 촉매 없음 / 실선: 산 촉매(C=O 양성자화)', R, B - 8); }
    }
    api.onResize(draw); if (api.onTheme) api.onTheme(draw);
    sync();
  },
});
