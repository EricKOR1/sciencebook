/* 일반생명과학 9 식물의 세대 교번: 선태식물·양치식물·속씨식물의 생활사 고리 — 배우체(n)와 포자체(2n)의 우세가 바뀌는 모습, 단계별 핵상·염색체 수 */
Sims.register('u-plant-life-cycle', {
  title: '세대 교번 — 배우체와 포자체, 누가 주인공인가',
  caption: '무리를 고른 뒤 ‘다음 단계’를 누르거나 고리의 동그라미를 눌러 생활사를 한 바퀴 돌아 보자. 위쪽(파랑)은 핵상이 n인 배우체 세대, 아래쪽(주황)은 2n인 포자체 세대이며, 감수 분열이 포자를, 배우체의 체세포 분열이 생식 세포를 만든다. 동그라미 크기는 각 세대의 몸집을 나타낸다: 선태식물은 배우체가 크고 독립적이며 포자체가 그 위에 붙어 살고, 양치식물은 포자체가 크고 배우체(전엽체)는 작지만 따로 살며, 속씨식물의 배우체는 꽃 속에서 포자체에 기대 사는 몇 개의 세포로 줄어든다. 염색체 수는 예제 6(고사리 2n = 60)과 예제 7(옥수수 2n = 20)을 따랐고, 선태식물은 핵상만 표시했다.',
  init: function (api) {
    var G = {
      moss: { name: '선태식물(솔이끼)', n: null, gSize: 1, sSize: 0.45, gNote: '크고 오래 삶 · 독립 생활', sNote: '작음 · 배우체 위에 붙어 영양을 받음',
        st: [
          ['포자', 'n', '포자 모세포의 감수 분열로 생겨 바람에 퍼진다'],
          ['배우체(초록 이끼)', 'n', '포자가 체세포 분열로 자란 것. 우리가 보는 초록색 이끼'],
          ['정자 · 난세포', 'n', '장정기·장란기에서 체세포 분열로 생긴다. 정자는 물속을 헤엄쳐 간다'],
          ['수정란', '2n', '정자와 난세포의 수정. 배우체의 장란기 안에 머문다'],
          ['포자체(자루와 포자낭)', '2n', '수정란이 배우체 위에서 자란 것. 스스로 살지 못하고 배우체에 붙어 있다'],
          ['포자 모세포', '2n', '포자낭 속에서 감수 분열을 하여 포자를 만든다'],
        ],
        tr: ['체세포 분열', '체세포 분열', '수정(물 필요)', '체세포 분열', '포자낭 형성', '감수 분열'] },
      fern: { name: '양치식물(고사리)', n: 30, gSize: 0.42, sSize: 1, gNote: '작음(전엽체) · 그래도 독립 생활', sNote: '크고 오래 삶 · 관다발',
        st: [
          ['포자', 'n', '잎 뒷면 포자낭군에서 감수 분열로 생긴다'],
          ['전엽체(배우체)', 'n', '포자가 체세포 분열로 자란 작은 하트 모양 배우체. 따로 산다'],
          ['정자 · 난세포', 'n', '전엽체의 장정기·장란기에서 체세포 분열로 생긴다. 정자는 물속을 헤엄친다'],
          ['수정란', '2n', '수정으로 생긴다. 전엽체 위에서 어린 포자체로 자란다'],
          ['포자체(고사리)', '2n', '우리가 아는 고사리. 뿌리·줄기·잎과 관다발을 가진다'],
          ['포자 모세포', '2n', '포자낭 속에서 감수 분열을 하여 포자를 만든다'],
        ],
        tr: ['체세포 분열', '체세포 분열', '수정(물 필요)', '체세포 분열', '포자낭 형성', '감수 분열'] },
      angio: { name: '속씨식물(옥수수)', n: 10, gSize: 0.2, sSize: 1, gNote: '세포 몇 개뿐 · 포자체 속에서 삶', sNote: '크고 오래 삶 · 꽃·열매·종자',
        st: [
          ['작은 포자 · 큰 포자', 'n', '꽃밥과 밑씨 속에서 감수 분열로 생긴다'],
          ['꽃가루 · 배낭(배우체)', 'n', '꽃가루는 수배우체, 배낭은 밑씨 속 암배우체. 체세포 분열로 만들어진다'],
          ['정핵 2개 · 난세포 · 극핵 2개', 'n', '꽃가루관이 정핵 2개를 배낭으로 보낸다 — 헤엄치는 물이 필요 없다'],
          ['배(2n) + 배젖(3n)', '2n', '중복 수정: 정핵 + 난세포 → 배, 정핵 + 극핵 2개 → 배젖(3n). 종자가 된다'],
          ['포자체(옥수수 식물)', '2n', '종자에서 싹튼 식물. 꽃을 피운다'],
          ['꽃밥·밑씨의 포자 모세포', '2n', '감수 분열을 하여 작은 포자와 큰 포자를 만든다'],
        ],
        tr: ['체세포 분열', '체세포 분열', '중복 수정', '발아 · 생장', '꽃 형성', '감수 분열'] },
    };
    var st = { g: 'moss', i: 1 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.52; }, label: '식물 생활사 고리와 배우체·포자체 크기 비교' });
    var ctx = cv.ctx;
    cv.canvas.style.cursor = 'pointer';

    var rStage = api.readout('단계');
    var rPh = api.readout('핵상 · 염색체 수');
    var rNext = api.readout('다음 단계로 가는 과정');

    var grp = api.group();
    var gBtns = ['moss', 'fern', 'angio'].map(function (k) {
      return api.button(G[k].name, function () { st.g = k; sync(); draw(); }, { toggle: true, pressed: k === st.g, parent: grp });
    });
    api.button('다음 단계', function () { st.i = (st.i + 1) % 6; draw(); }, { primary: true });
    function sync() { gBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', ['moss', 'fern', 'angio'][j] === st.g ? 'true' : 'false'); }); }

    var pos = [];
    cv.canvas.addEventListener('click', function (e) {
      var b = cv.canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      pos.forEach(function (p, k) { if (Math.hypot(p.x - x, p.y - y) < p.r + 6) { st.i = k; draw(); } });
    });

    function count(g, ph, k) {
      if (!g.n) return null;
      if (st.g === 'angio' && k === 3) return '배 ' + 2 * g.n + ' · 배젖 ' + 3 * g.n;
      return (ph === 'n' ? g.n : 2 * g.n) + '';
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { ring: { x: 0, y: 0, w: w, h: h * 0.64 }, side: { x: 0, y: h * 0.64, w: w, h: h * 0.36 } };
      return { ring: { x: 0, y: 0, w: w * 0.6, h: h }, side: { x: w * 0.6, y: 0, w: w * 0.4, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout(), g = G[st.g];
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawRing(T, P.ring, g); drawSide(T, P.side, g);
      var s = g.st[st.i], c = count(g, s[1], st.i);
      rStage.set((st.i + 1) + '. ' + s[0]);
      rPh.set((st.g === 'angio' && st.i === 3 ? '2n · 3n' : s[1]) + (c ? ' · ' + c + '개' : ''));
      rNext.set(g.tr[st.i]);
    }
    function drawRing(T, r, g) {
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 4, R = Math.min(r.w * 0.36, r.h * 0.36);
      // 위(n)·아래(2n) 반원
      ctx.lineWidth = 14; ctx.lineCap = 'butt';
      ctx.strokeStyle = T.figSoftBlue; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = T.figSoftAmber; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI); ctx.stroke();
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figBlue; ctx.fillText('배우체 세대 (n)', cx, cy - 8);
      ctx.fillStyle = T.figAmber; ctx.fillText('포자체 세대 (2n)', cx, cy + 18);
      // 단계 위치: 위쪽 1,2,3 / 아래쪽 4,5,6 (시계 방향)
      var angs = [-Math.PI * 0.95, -Math.PI * 0.5, -Math.PI * 0.05, Math.PI * 0.05, Math.PI * 0.5, Math.PI * 0.95];
      pos = angs.map(function (a, k) {
        var big = k === 1 ? g.gSize : k === 4 ? g.sSize : 0.3;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), r: 9 + 17 * big, a: a };
      });
      // 전이 화살표 표시(감수 분열, 수정)
      for (var k = 0; k < 6; k++) {
        var a1 = angs[k], a2 = angs[(k + 1) % 6]; if (k === 5) a2 += 2 * Math.PI;
        var mid = (a1 + a2) / 2, tr = g.tr[k], key = /감수|수정/.test(tr);
        var mx = cx + (R + 0) * Math.cos(mid), my = cy + R * Math.sin(mid);
        var dir = mid + Math.PI / 2;
        ctx.fillStyle = key ? T.figRed : T.figMuted;
        ctx.beginPath(); ctx.moveTo(mx + 8 * Math.cos(dir), my + 8 * Math.sin(dir));
        ctx.lineTo(mx - 6 * Math.cos(dir) + 6 * Math.cos(mid), my - 6 * Math.sin(dir) + 6 * Math.sin(mid));
        ctx.lineTo(mx - 6 * Math.cos(dir) - 6 * Math.cos(mid), my - 6 * Math.sin(dir) - 6 * Math.sin(mid)); ctx.closePath(); ctx.fill();
        if (key) {
          var lx = cx + (R + 26) * Math.cos(mid), ly = cy + (R + 26) * Math.sin(mid);
          ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = Math.cos(mid) > 0.2 ? 'left' : Math.cos(mid) < -0.2 ? 'right' : 'center';
          ctx.fillText(tr, lx, ly + 4);
        }
      }
      pos.forEach(function (p, k) {
        var ph = g.st[k][1], sel = k === st.i;
        ctx.fillStyle = ph === 'n' ? T.figSoftBlue : T.figSoftAmber;
        ctx.strokeStyle = sel ? T.figRed : (ph === 'n' ? T.figBlue : T.figAmber); ctx.lineWidth = sel ? 3 : 1.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(k + 1, p.x, p.y + 4);
        // 이름표
        var name = g.st[k][0], up = Math.sin(p.a) < 0;
        ctx.font = (sel ? '600 ' : '') + '12px ' + T.fontBody; ctx.fillStyle = sel ? T.figRed : T.figInk;
        var lx = p.x, ly = up ? p.y - p.r - 8 : p.y + p.r + 16;
        if (k === 0 || k === 5) { ctx.textAlign = 'right'; lx = p.x - p.r - 4; ly = p.y + (up ? -10 : 14); }
        if (k === 2 || k === 3) { ctx.textAlign = 'left'; lx = p.x + p.r + 4; ly = p.y + (up ? -10 : 14); }
        ctx.lineWidth = 4; ctx.strokeStyle = T.figPanel; ctx.lineJoin = 'round';
        var maxw = k === 1 || k === 4 ? r.w * 0.6 : (ctx.textAlign === 'right' ? lx - r.x - 2 : r.x + r.w - lx - 2);
        var txt = name; while (ctx.measureText(txt).width > maxw && txt.length > 3) txt = txt.slice(0, -2) + '…';
        ctx.strokeText(txt, lx, ly); ctx.fillText(txt, lx, ly);
      });
    }
    function drawSide(T, r, g) {
      var x = r.x + 12, w = r.w - 24, y = r.y + 22;
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody;
      ctx.fillText('세대의 몸집 비교', x, y);
      var bars = [['배우체 (n)', g.gSize, T.figBlue, T.figSoftBlue, g.gNote], ['포자체 (2n)', g.sSize, T.figAmber, T.figSoftAmber, g.sNote]];
      var bw = w - 84;
      bars.forEach(function (b, k) {
        var yy = y + 18 + k * 44;
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText(b[0], x, yy + 13);
        ctx.fillStyle = b[3]; ctx.fillRect(x + 80, yy, bw * b[1], 18);
        ctx.strokeStyle = b[2]; ctx.lineWidth = 1.5; ctx.strokeRect(x + 80, yy, bw * b[1], 18);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText(b[4], x + 80, yy + 32);
      });
      // 선택한 단계 설명(줄바꿈)
      var s = g.st[st.i], yy2 = y + 118;
      if (yy2 > r.y + r.h - 20) return;
      ctx.fillStyle = T.figRed; ctx.font = '600 13px ' + T.fontBody; ctx.fillText((st.i + 1) + '. ' + s[0], x, yy2);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      var words = s[2].split(' '), line = '', ly = yy2 + 19;
      words.forEach(function (wd) {
        var test = line ? line + ' ' + wd : wd;
        if (ctx.measureText(test).width > w && line) { ctx.fillText(line, x, ly); line = wd; ly += 17; } else line = test;
      });
      if (line && ly < r.y + r.h - 2) ctx.fillText(line, x, ly);
    }
    api.onResize(draw);
    draw();
  },
});
