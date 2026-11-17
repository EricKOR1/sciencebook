/* 일반생명과학 6 DNA 복제: 복제 분기점에서 선도 가닥(연속)과 지연 가닥(오카자키 절편)이 만들어지는 과정, 효소들의 차례 */
Sims.register('u-replication-fork', {
  title: '복제 분기점 — 선도 가닥과 지연 가닥은 어떻게 만들어지나',
  caption: '재생하거나 "한 단계"를 눌러 분기점을 오른쪽으로 열어 보자. 헬리케이스가 이중 나선을 풀고, 위상 이성질화 효소가 앞쪽 꼬임을 풀며, 단일 가닥 결합 단백질이 풀린 가닥을 잡아 둔다. 새 가닥은 5′→3′으로만 자라므로 위쪽 새 가닥(선도 가닥)은 프라이머 하나로 분기점을 따라 연속 합성되고, 아래쪽(지연 가닥)은 주형이 충분히 드러날 때마다 프라이메이스가 새 RNA 프라이머를 놓고 중합 효소 Ⅲ이 분기점 반대쪽으로 짧은 절편을 만든다. 절편이 앞 절편에 닿으면 중합 효소 Ⅰ이 앞 절편의 프라이머를 DNA로 바꾸고, 연결 효소가 남은 틈(닉)을 잇는다. 길이와 속도는 모식적이며(실제 절편은 세균 1000~2000 nt, 진핵 100~200 nt), 레플리솜에서 지연 가닥 주형이 고리를 이루는 모습은 펴서 그렸다.',
  init: function (api) {
    var LT = 100, VF = 6, VP = 9, PR = 5;            // 복제할 길이, 분기점 속도, 지연 가닥 중합 속도(단위/s), 프라이머 길이
    var s, fragLen = 18;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.0 : 0.46; }, label: '복제 분기점의 주형 가닥, 선도 가닥, 오카자키 절편과 효소들' });
    var ctx = cv.ctx;
    var rLead = api.readout('선도 가닥');
    var rFrag = api.readout('오카자키 절편');
    var rPr = api.readout('남은 RNA 프라이머');
    var rNick = api.readout('이어지지 않은 틈');

    var g = api.group();
    var bPlay = api.button(api.reduced ? '재생' : '멈춤', function () { if (loop.playing || loop.wanted) { loop.pause(); bPlay.textContent = '재생'; } else { if (s.F >= LT) reset(); loop.play(); bPlay.textContent = '멈춤'; } }, { primary: true, parent: g });
    api.button('한 단계', function () { loop.pause(); bPlay.textContent = '재생'; advance(1.2); draw(); }, { parent: g });
    api.button('처음으로', function () { reset(); }, { parent: g });
    api.slider({ id: 'u-replication-fork-len', label: '오카자키 절편 길이(모식)', min: 12, max: 30, step: 1, value: fragLen,
      format: function (v) { return v < 18 ? '짧게' : v > 24 ? '길게' : '보통'; }, onInput: function (v) { fragLen = v; reset(); } });

    function reset() { s = { F: 8, lead: PR, frags: [], lastS: 0, t: 0, primeT: -9, msg: '헬리케이스가 복제 원점에서 이중 나선을 열기 시작' }; draw(); }
    function advance(sec) {
      var n = Math.ceil(sec / 0.02);
      for (var k = 0; k < n; k++) step(0.02);
    }
    function step(dt) {
      s.t += dt;
      if (s.F < LT) s.F = Math.min(LT, s.F + VF * dt);
      s.lead = Math.max(s.lead, Math.min(s.F - 2.5, s.lead + VF * 1.4 * dt));
      // 새 프라이머
      if (s.F - s.lastS >= fragLen && s.F < LT) {
        var sp = s.F - 1.5;
        s.frags.push({ s: sp, e: sp - PR, st: 'grow', prev: s.frags.length ? s.frags[s.frags.length - 1] : null, primerDNA: false, timer: 0 });
        s.lastS = sp; s.primeT = s.t; s.msg = '프라이메이스가 지연 가닥 주형에 새 RNA 프라이머를 놓음';
      }
      s.frags.forEach(function (f) {
        var stop = f.prev ? f.prev.s : 0;
        if (f.st === 'grow') {
          f.e = Math.max(stop, f.e - VP * dt);
          if (f.e <= stop) { f.st = f.prev ? 'polI' : 'done'; f.timer = 0; if (f.prev) s.msg = '중합 효소 Ⅰ이 앞 절편의 RNA 프라이머를 DNA로 바꿈'; }
        } else if (f.st === 'polI') {
          f.timer += dt;
          if (f.timer > 1.1) { f.prev.primerDNA = true; f.st = 'nick'; f.timer = 0; s.msg = '연결 효소가 두 절편 사이의 틈을 이음'; }
        } else if (f.st === 'nick') {
          f.timer += dt;
          if (f.timer > 0.9) { f.st = 'done'; f.sealed = true; }
        }
      });
      if (s.F >= LT && s.frags.every(function (f) { return f.st === 'done'; })) { s.msg = '끝: 마지막 절편의 프라이머는 다음 분기점 쪽에서 처리된다'; loop.pause(); bPlay.textContent = '재생'; }
    }
    var loop = api.loop(function (dt) { advance(dt); draw(); });

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var L = 28, R = w - 16, TOT = LT + 22;
      var X = function (u) { return L + u / TOT * (R - L); };
      var yc = narrow ? h * 0.42 : h * 0.44, gap = narrow ? 64 : 70;
      var yT = yc - gap, yB = yc + gap, dy = 5;
      var xF = X(s.F), xF2 = X(s.F + 7);
      // 주형 가닥
      ctx.lineWidth = 3; ctx.strokeStyle = T.figInk;
      ctx.beginPath(); ctx.moveTo(X(0), yT); ctx.lineTo(xF, yT); ctx.lineTo(xF2, yc - dy); ctx.lineTo(X(TOT), yc - dy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(0), yB); ctx.lineTo(xF, yB); ctx.lineTo(xF2, yc + dy); ctx.lineTo(X(TOT), yc + dy); ctx.stroke();
      // 이중 나선의 염기쌍 표시
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      for (var u = s.F + 9; u < TOT; u += 2.2) { ctx.beginPath(); ctx.moveTo(X(u), yc - dy); ctx.lineTo(X(u), yc + dy); ctx.stroke(); }
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      ctx.fillText('3′', X(0) - 12, yT + 4); ctx.fillText('5′', X(0) - 12, yB + 4);
      ctx.fillText('5′', R + 8 > w ? R : R + 4, yc - dy - 6); ctx.fillText('3′', R + 8 > w ? R : R + 4, yc + dy + 16);
      // 선도 가닥
      var yl = yT + 12, yg = yB - 12;
      seg(X(0), X(PR), yl, T.figRed, 6);
      seg(X(PR), X(s.lead), yl, T.figBlue, 6);
      head(X(s.lead), yl, 1, T.figBlue);
      ctx.fillStyle = T.figBlue; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText(narrow ? '선도 가닥(연속 →)' : '선도 가닥 5′→3′ (연속)', X(PR) + 4, yl + 20);
      // 지연 가닥 절편
      var colA = [T.figGreen, T.figTeal];
      s.frags.forEach(function (f, i) {
        var c = colA[i % 2];
        var pL = f.s - PR;
        if (f.e < pL) seg(X(f.e), X(pL), yg, c, 6);
        seg(X(pL), X(f.s), yg, f.primerDNA ? c : T.figRed, 6);
        if (f.st === 'grow') head(X(f.e), yg, -1, c);
        // 틈(닉)
        if (f.prev && f.prev.primerDNA && !f.sealed) {
          var xn = X(f.prev.s - PR); ctx.strokeStyle = T.figPaper; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xn, yg - 5); ctx.lineTo(xn, yg + 5); ctx.stroke();
        }
      });
      if (s.frags.length) { ctx.fillStyle = T.figGreen; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(narrow ? '지연 가닥(절편, ←)' : '지연 가닥: 오카자키 절편 (각각 5′→3′, ← 방향)', X(0), yg - 14); }
      // 단일 가닥 결합 단백질
      ctx.fillStyle = T.figAmber;
      for (u = s.lastS + 2; u < s.F - 2; u += 3.4) { ctx.beginPath(); ctx.arc(X(u), yB + 7, 3.6, 0, Math.PI * 2); ctx.fill(); }
      for (u = s.lead + 3; u < s.F - 1; u += 3.4) { ctx.beginPath(); ctx.arc(X(u), yT - 7, 3.6, 0, Math.PI * 2); ctx.fill(); }
      // 효소
      var lab = !narrow;
      // 헬리케이스
      hex(xF2 - 10, yc, narrow ? 12 : 15, T.figViolet, T.figSoftViolet);
      tag('헬리케이스', xF2 - 10, yc + 32, T.figViolet, narrow);
      // 위상 이성질화 효소
      if (s.F + 18 < TOT) { ring(X(s.F + 18), yc, 10, T.figTeal, T.figSoftTeal); tag('위상 이성질화 효소', X(s.F + 18), yc - 20, T.figTeal, false, narrow); }
      // 중합 효소 Ⅲ(선도)
      blob(X(s.lead) + 2, yl + 1, T.figBlue, T.figSoftBlue, 'Ⅲ');
      // 지연 가닥 효소들
      s.frags.forEach(function (f) {
        if (f.st === 'grow') blob(X(f.e) - 2, yg - 1, T.figGreen, T.figSoftGreen, 'Ⅲ');
        if (f.st === 'polI') blob(X(f.prev.s - PR / 2), yg - 1, T.figRed, T.figSoftRed, 'Ⅰ');
        if (f.st === 'nick') blob(X(f.prev.s - PR), yg - 1, T.figAccent, T.figPanel, '연');
      });
      if (s.t - s.primeT < 0.7 && s.frags.length) { var lf = s.frags[s.frags.length - 1]; ring(X(lf.s - PR / 2), yg + 16, 9, T.figRed, T.figSoftRed); }
      // 범례
      var ly = h - (narrow ? 64 : 30), items = [
        [T.figViolet, '헬리케이스'], [T.figTeal, '위상 이성질화 효소'], [T.figAmber, '단일 가닥 결합 단백질'],
        [T.figRed, 'RNA 프라이머·프라이메이스'], [T.figBlue, '중합 효소 Ⅲ'], [T.figRed, 'Ⅰ: 중합 효소 Ⅰ'], [T.figAccent, '연: 연결 효소']];
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = 8, row = 0;
      items.forEach(function (it) {
        var tw = ctx.measureText(it[1]).width + 24;
        if (lx + tw > w - 4) { lx = 8; row++; }
        ctx.fillStyle = it[0]; ctx.fillRect(lx, ly + row * 18 - 8, 10, 10);
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], lx + 14, ly + row * 18 + 1);
        lx += tw;
      });
      // 상태 문장
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(s.msg, 8, 18);
      // 읽기
      var primers = 0, nicks = 0, done = 0;
      s.frags.forEach(function (f) { if (!f.primerDNA) primers++; if (f.prev && f.prev.primerDNA && !f.sealed) nicks++; if (f.st === 'done') done++; });
      rLead.set((s.lead - PR).toFixed(0) + ' (끊김 없음)');
      rFrag.set(done + '개 완성 / ' + s.frags.length + '개');
      rPr.set((primers + 1) + '개');
      rNick.set(nicks + '곳');
    }
    function seg(x1, x2, y, c, lw) { if (x2 <= x1) return; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }
    function head(x, y, dir, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + dir * 9, y); ctx.lineTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.closePath(); ctx.fill(); }
    function hex(x, y, r, c, f) { ctx.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); } ctx.closePath(); ctx.fillStyle = f; ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); }
    function ring(x, y, r, c, f) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = f; ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); }
    function blob(x, y, c, f, t) {
      var T = api.tokens();
      ctx.beginPath(); ctx.ellipse(x, y, 13, 11, 0, 0, Math.PI * 2); ctx.fillStyle = f; ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(t, x, y + 4);
    }
    function tag(t, x, y, c, hide, hide2) {
      if (hide || hide2) return;
      ctx.fillStyle = c; ctx.font = '12px ' + api.tokens().fontBody; ctx.textAlign = 'center'; ctx.fillText(t, x, y);
    }

    api.onResize(draw);
    reset();
    if (api.reduced) advance(0);
  },
});
