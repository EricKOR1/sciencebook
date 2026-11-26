/* 유기화학 7 구조 결정: 동위 원소 무늬 계산기 — 분자식에서 M, M+1, M+2 … 의 상대 세기 */
Sims.register('mj-isotope-pattern', {
  title: '동위 원소 무늬 계산기 — 분자식에서 M, M+1, M+2 …',
  caption: '원소마다 원자 수를 바꾸면 분자 이온 영역의 봉우리 세기를 다항(이항) 분포로 계산해 막대와 표로 보여 준다. ' +
    'Cl·Br 개수를 바꾸면 3 : 1, 1 : 1 무늬가 이항 계수를 따라 넓어지는 것을, C 를 늘리면 M+1 이 1.1 % × 탄소 수 꼴로 자라다가 탄소 93개부터 단일 동위 원소 봉우리 M 보다 커지는 것을 볼 수 있다. ' +
    '존재비: ¹³C 1.07 %, ²H 0.015 %, ¹⁵N 0.37 %, ¹⁷O 0.038 %, ¹⁸O 0.20 %, ³³S 0.75 %, ³⁴S 4.25 %, ³⁷Cl 24.2 %, ⁸¹Br 49.3 %. 정수 질량 차이로만 묶었고(고분해능에서 갈라지는 미세 구조는 무시), 세기는 가장 큰 봉우리 = 100 이다.',
  init: function (api) {
    var ISO = {
      C: [[0, 0.9893], [1, 0.0107]],
      H: [[0, 0.99985], [1, 0.00015]],
      N: [[0, 0.9963], [1, 0.0037]],
      O: [[0, 0.99762], [1, 0.00038], [2, 0.0020]],
      S: [[0, 0.9500], [1, 0.0075], [2, 0.0425]],
      Cl: [[0, 0.758], [2, 0.242]],
      Br: [[0, 0.507], [2, 0.493]],
    };
    var MASS = { C: 12, H: 1, N: 14, O: 16, S: 32, Cl: 35, Br: 79 };
    var st = { C: 6, H: 5, N: 0, O: 0, S: 0, Cl: 0, Br: 1 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '동위 원소 무늬 막대그래프' });
    var ctx = cv.ctx;
    var tbl = api.el('div'); tbl.style.overflowX = 'auto'; tbl.style.fontSize = '13px'; tbl.style.marginTop = '6px';
    api.stage.appendChild(tbl);
    var rF = api.readout('분자식 '), rM = api.readout('정수 질량 M '), rC = api.readout('M+1 / M '), rB = api.readout('가장 큰 봉우리 ');
    var sl = {};
    function mk(el, lab, max) {
      sl[el] = api.slider({ id: 'mj-isotope-pattern-' + el, label: lab, min: 0, max: max, step: 1, value: st[el],
        format: function (v) { return v.toFixed(0); }, onInput: function (v) { st[el] = v; draw(); } });
    }
    mk('C', 'C 탄소', 120); mk('H', 'H 수소', 200); mk('N', 'N 질소', 6); mk('O', 'O 산소', 10);
    mk('S', 'S 황', 3); mk('Cl', 'Cl 염소', 6); mk('Br', 'Br 브로민', 4);
    var g = api.group();
    function preset(lab, f) {
      api.button(lab, function () { Object.keys(st).forEach(function (k) { sl[k].set(f[k] || 0); }); }, { parent: g });
    }
    preset('C₆H₅Br', { C: 6, H: 5, Br: 1 });
    preset('CH₂Cl₂', { C: 1, H: 2, Cl: 2 });
    preset('C₄H₁₀S', { C: 4, H: 10, S: 1 });
    preset('C₁₂H₄Cl₄O₂', { C: 12, H: 4, Cl: 4, O: 2 });
    preset('C₆₀', { C: 60 });
    preset('C₉₃', { C: 93 });

    function conv(a, b) {
      var out = new Array(a.length + 3).fill(0);
      for (var i = 0; i < a.length; i++) if (a[i]) for (var j = 0; j < b.length; j++) out[i + b[j][0]] += a[i] * b[j][1];
      return out;
    }
    function pattern() {
      var d = [1];
      Object.keys(st).forEach(function (el) { for (var k = 0; k < st[el]; k++) d = conv(d, ISO[el]); });
      while (d.length > 1 && d[d.length - 1] < 1e-12) d.pop();
      return d;
    }
    function sub(n) { return String(n).replace(/[0-9]/g, function (c) { return '₀₁₂₃₄₅₆₇₈₉'[+c]; }); }
    function formula() {
      var s = '';
      ['C', 'H', 'N', 'O', 'S', 'Cl', 'Br'].forEach(function (el) { if (st[el]) s += el + (st[el] > 1 ? sub(st[el]) : ''); });
      return s || '—';
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var d = pattern(), mx = Math.max.apply(null, d);
      var last = 0; d.forEach(function (v, i) { if (v / mx > 0.0005) last = i; });
      var n = Math.max(last + 1, 5); n = Math.min(n, 25);
      var x0 = 44, x1 = w - 12, y0 = 26, y1 = h - 40;
      var bw = (x1 - x0) / n;
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      [0, 50, 100].forEach(function (v) {
        var y = y1 - (y1 - y0) * v / 100;
        ctx.fillText(String(v), x0 - 6, y + 4);
        if (v) { ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]); }
      });
      var M = 0; Object.keys(st).forEach(function (el) { M += st[el] * MASS[el]; });
      var hasHal = st.Cl + st.Br > 0;
      for (var i = 0; i < n; i++) {
        var v = (d[i] || 0) / mx * 100, xc = x0 + bw * (i + 0.5);
        var bh = (y1 - y0) * v / 100;
        ctx.fillStyle = i === 0 ? T.figAccent : (i % 2 === 0 && hasHal ? T.figGreen : T.figBlue);
        ctx.fillRect(xc - Math.min(bw * 0.32, 10), y1 - bh, Math.min(bw * 0.64, 20), Math.max(bh, v > 0 ? 1 : 0));
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontMono;
        var step = n > 13 ? 2 : 1;
        if (i % step === 0) ctx.fillText(i === 0 ? 'M' : '+' + i, xc, y1 + 14);
        if (v >= 0.5 && bw > 18) ctx.fillText(v >= 9.95 ? v.toFixed(0) : v.toFixed(1), xc, y1 - bh - 4);
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('M + k (정수 질량 차이)', (x0 + x1) / 2, y1 + 32);
      ctx.textAlign = 'left'; ctx.fillText('상대 세기 (가장 큰 봉우리 = 100)', x0 + 4, 14);
      var r1 = (d[1] || 0) / d[0] * 100;
      rF.set(formula());
      rM.set(M + ' (m/z ' + M + ')');
      rC.set(r1.toFixed(1) + ' %  (1.1 % × C = ' + (1.1 * st.C).toFixed(1) + ' %)');
      var bi = 0; d.forEach(function (v, i) { if (v > d[bi]) bi = i; });
      rB.set(bi === 0 ? 'M' : 'M+' + bi + (bi === 1 && st.C >= 93 && !hasHal ? ' (M+1 > M!)' : ''));
      var html = '<table style="border-collapse:collapse;width:100%"><tr><th style="text-align:left;padding:2px 6px">봉우리</th>';
      var rows1 = '', rows2 = '';
      for (var k = 0; k < Math.min(n, 13); k++) {
        html += '<th style="padding:2px 6px">' + (k === 0 ? 'M' : 'M+' + k) + '</th>';
        rows1 += '<td style="padding:2px 6px;text-align:center">' + ((d[k] || 0) / mx * 100).toFixed(1) + '</td>';
        rows2 += '<td style="padding:2px 6px;text-align:center">' + ((d[k] || 0) / d[0] * 100).toFixed(1) + '</td>';
      }
      html += '</tr><tr><td style="padding:2px 6px">최대 = 100</td>' + rows1 + '</tr><tr><td style="padding:2px 6px">M = 100</td>' + rows2 + '</tr></table>' +
        '<p style="margin:6px 0 0">해 보기: 다른 원소를 모두 0으로 두고 C 를 92 → 93 으로 올려 M+1 이 M 을 넘는 순간을 찾아보자(조건 n·q/p &gt; 1, n &gt; 92.5).</p>';
      tbl.innerHTML = html;
    }
    api.onResize(draw);
    draw();
  },
});
