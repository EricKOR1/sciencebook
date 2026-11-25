#!/usr/bin/env python3
"""ochemlib — 유기화학 단원 그림의 공통 그리기 모듈(구조식·굽은 화살표·전자쌍·전하·반응 화살표).

구조식은 tools/authoring/molsvg.py(SMILES → 골격 구조식 SVG 조각)를 불러 놓고, 그 원자 좌표에
굽은 화살표·고립 전자쌍·형식 전하·부분 전하·이름표를 덧그린다. 유기화학 1~14 단원이 모두 이 양식을 따른다.

사용 예
-------
    import sys; sys.path.insert(0, '/home/user/sciencebook/tools/authoring')
    from ochemlib import Fig, check_species, check_step
    F = Fig('ochem-4-sn2-arrows', 720, 260, '그림 유기화학 4-3 SN2 반응의 화살표', '설명 한두 문장', small=False)
    m = F.mol('C[O-]', key='m1', x=40, y=80)            # 왼쪽 위 (x, y) 에 놓는다. center=(cx, cy) 로 가운데 맞춤도 된다.
    m.lone_pairs(1, [90, 210, 330])                     # 원자 1(O)에 전자쌍 3개(각도: 0 = 오른쪽, 90 = 위, 시계 반대 방향)
    m.charge(1, '-', 30)                                # ⊖ 를 원자 1의 30° 방향에
    m.strip_charges()                                   # molsvg 가 그린 작은 +, − 글자를 지운다(원 안의 기호로 바꿀 때)
    s = m.lp_pos(1, 0)                                  # 0° 방향 전자쌍의 자리(화살표 꼬리)
    e = F.between(m2.p(0), m.p(1), 0.5)                 # 두 원자 사이(새 결합 자리)
    F.curved(s, e, bend=0.5)                            # 굽은 화살표(온 화살촉). half=True 면 낚싯바늘(반쪽 화살촉)
    F.curved(m2.bond_mid(0, 1), m2.p(1), bend=-0.6, end_gap=9)   # 결합 가운데 → 원자(글자와 9 px 띄움)
    F.rxn(300, 130, 360, above='H₂O')                   # → 반응 화살표.  F.eq(...) ⇌ 평형,  F.res(...) ↔ 공명
    F.text(100, 200, '(가) 친핵체', cls='b')
    F.save('/home/user/sciencebook/docs/assets/fig/ochem-4-sn2-arrows.svg')
    check_species('C[O-]')                              # 원자마다 원소·형식 전하·결합 차수 합·전자쌍 수·옥텟을 출력(RDKit)
    check_step(['C[O-]', 'CBr'], ['COC', '[Br-]'])      # 반응 전후 원자 수와 전하 합 보존 확인

그 밖의 도구
------------
    B = F.mol_like(smB, 'b', A, center)   # 공명 구조 B 를 A 와 같은 원자 배치로(같은 원자 순서의 SMILES)
    F.mol(smi, key, center=..., orient=(i, j, 각도))   # 원자 i→j 가 그 방향이 되게 돌린다
    m.hide_c_label(i) / m.recenter(i) / m.highlight([..]) / m.label(i, 'C')   # 전하 띤 탄소, 글자 정렬, 작용기 강조, 루이스 구조의 C
    F.curved_away(p0, p1, 고리중심, bend)  # 고리 바깥쪽으로 부푸는 굽은 화살표
    F.wedge / F.hash / check_rs_2d(...)    # 쐐기·점선을 직접 그릴 때와 R/S 재판정
    S = Scene3(F, cx, cy, view_matrix(yaw, pitch)); S.atom / S.bond / S.lobe / S.p_orbital / S.flush()   # 3차원 스케치(오비탈·평면)
    esp_map(F, key, 원소, xyz, 부분전하, cx, cy, px_per_Å, R, vmin, vmax); esp_bar(...)   # 점전하 모형 정전기 퍼텐셜 지도(같은 척도로 비교)
    단원별 그림 스크립트 예: scratchpad 의 v-ochem-1/f*.py (유기화학 1)

양식 규칙(뒤 단원도 지킨다)
--------------------------
- 골격 구조식: 결합 길이 BOND = 30 px(720 너비 그림), 선 굵기 2 px, 원자 글자 14 px(molsvg 기본). 작은 그림(fig-small)도 같은 크기로 그린다.
  탄소 뼈대는 --fig-ink, O 빨강, N 파랑, 할로젠 초록, S·P 호박색(molsvg 색). 방향족 고리는 케쿨레 구조.
- 굽은 화살표: --fig-violet, 굵기 1.7 px, 매끈한 곡선(2차 베지에). 온 화살촉(전자 2개)은 채운 삼각형(길이 9, 반폭 4),
  낚싯바늘(전자 1개)은 곡선 바깥쪽 한쪽 갈퀴만. 꼬리는 전자가 있는 곳(전자쌍 점 바로 옆, 결합의 가운데)에서 시작하고,
  머리는 전자가 가는 곳(원자: 글자에서 8~10 px 앞, 새 결합: 두 원자의 가운데)에서 끝난다. 양전하·H·빈 오비탈에서 시작하지 않는다.
- 고립 전자쌍: 점 두 개(반지름 1.7 px, 간격 5.4 px), 원자 중심에서 LP_R = 11 px, --fig-ink.
- 형식 전하: 원 안의 +, −(⊕, ⊖). 원 반지름 6 px, 선 1.2 px, 원 안은 --fig-panel, 원자 중심에서 14 px. 색은 --fig-ink.
  molsvg 가 붙이는 작은 +, − 글자는 strip_charges() 로 지우고 이 기호로 바꾼다. 전하 띤 탄소는 hide_c_label() 로 'C' 글자를 지우고 꼭짓점에 ⊕/⊖ 만 단다.
- 부분 전하: 'δ+' 는 --fig-blue, 'δ−' 는 --fig-red, 13 px 기울임 없는 글자. 결합 쌍극자는 dipole()(+ 꼬리가 달린 화살표, δ+ → δ−).
- 반응 화살표: → 는 rxn(), 평형 ⇌ 은 eq()(위는 오른쪽, 아래는 왼쪽을 향한 반쪽 화살촉 두 줄), 공명 ↔ 은 res()(한 줄 양쪽 화살촉).
  공명 ↔ 은 공명 구조 사이에만, ⇌ 은 서로 다른 화학종 사이의 평형에만 쓴다. 모두 --fig-ink, 1.8 px.
- 오비탈: 위상은 두 색으로 구별한다. + 위상 = --fig-soft-blue 면 / --fig-blue 테두리, − 위상 = --fig-soft-amber 면 / --fig-amber 테두리.
  빈 오비탈은 면을 칠하지 않고 점선 테두리(empty=True).
- 쐐기(앞) wedge(), 점선 쐐기(뒤) hash() — 입체 중심을 그린 뒤 RDKit 으로 R/S 를 다시 판정한다(check_rs_2d).
- 글자 클래스: t(14 px 본문), b(14 px 굵게), s(13 px 흐림), n(13 px 흐림, 숫자 표시), r(13 px 빨강), h(15 px 굵게 제목).
"""
import json, math, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
MOLSVG = os.path.join(HERE, 'molsvg.py')
if not os.path.exists(MOLSVG):
    MOLSVG = '/home/user/sciencebook/tools/authoring/molsvg.py'

BOND = 30.0
LP_R = 12.5
LP_DOT = 1.7
LP_SEP = 5.4
FC_R = 6.0
FC_D = 14.0
ARROW = 'var(--fig-violet)'
INK = 'var(--fig-ink)'

_cache = {}
ELCOL = {'O': 'var(--fig-red)', 'N': 'var(--fig-blue)', 'F': 'var(--fig-green)', 'Cl': 'var(--fig-green)', 'Br': 'var(--fig-green)', 'I': 'var(--fig-green)', 'S': 'var(--fig-amber)', 'P': 'var(--fig-amber)', 'B': 'var(--fig-ink)', 'Li': 'var(--fig-violet)'}


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def f1(v):
    s = '%.1f' % v
    return '0.0' if s == '-0.0' else s


def dirv(ang):
    """각도(도, 0 = 오른쪽, 90 = 위) → SVG 단위 벡터(y 아래)."""
    a = math.radians(ang)
    return (math.cos(a), -math.sin(a))


def angle_of(p, q):
    """p 에서 q 를 향한 각도(도, 수학 방향)."""
    return math.degrees(math.atan2(-(q[1] - p[1]), q[0] - p[0]))


def molsvg(smiles, prefix, bond=BOND, rotate=0.0, flip=False, explicit_h=False, show_carbons=False, mono=False, font=14):
    args = ['python3', MOLSVG, '--smiles', smiles, '--prefix', prefix, '--bond', str(bond), '--font', str(font)]
    if rotate: args.append('--rotate=%s' % rotate)
    if flip: args.append('--flip')
    if explicit_h: args.append('--explicit-h')
    if show_carbons: args.append('--show-carbons')
    if mono: args.append('--mono')
    k = tuple(args)
    if k not in _cache:
        r = subprocess.run(args, capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError(r.stderr)
        if r.stderr.strip():
            print(r.stderr.strip(), file=sys.stderr)
        _cache[k] = json.loads(r.stdout)
    return json.loads(json.dumps(_cache[k]))


class Mol:
    def __init__(self, fig, d, x, y):
        self.fig, self.d, self.x, self.y = fig, d, x, y
        self.atoms = d['atoms']
        self.bonds = d['bonds']
        self.w, self.h = d['width'], d['height']
        self.svg = d['svg']
        self.prefix = re.match(r'<g class="([^"]+)"', self.svg).group(1)
        self.extra = []
        self.back = []
        self.used = {}

    # 좌표
    def p(self, i):
        """원자 i 의 그림 좌표. 글자로 적힌 원자는 원소 기호 글자의 가운데."""
        a = self.atoms[i]
        c = self._label_center(i)
        if c:
            return (self.x + c[0], self.y + c[1])
        return (self.x + a['x'], self.y + a['y'])

    def _label_center(self, i):
        el = self.atoms[i]['el']
        m = re.search(r'<text x="([\d.\-]+)" y="([\d.\-]+)" class="%s-atom-%d"[^>]*font-size:14px[^>]*text-anchor:(start|middle)[^>]*>%s</text>'
                      % (re.escape(self.prefix), i, re.escape(el[0])), self.svg)
        if not m:
            return None
        x, y = float(m.group(1)), float(m.group(2))
        w = (5.0 if len(el) == 1 else 7.6) if m.group(3) == 'start' else 0.0
        return (x + w, y - 5.0)

    def bond_mid(self, i, j, t=0.5):
        return between(self.p(i), self.p(j), t)

    def neighbors(self, i):
        out = []
        for b in self.bonds:
            if b['a'] == i: out.append(b['b'])
            elif b['b'] == i: out.append(b['a'])
        return out

    def free_angle(self, i):
        """원자 i 의 결합들과 가장 먼 방향(도)."""
        ns = self.neighbors(i)
        if not ns:
            return 90.0
        angs = sorted(angle_of(self.p(i), self.p(n)) % 360 for n in ns)
        if len(angs) == 1:
            return (angs[0] + 180) % 360
        best, ba = -1, 0
        for k in range(len(angs)):
            a0, a1 = angs[k], angs[(k + 1) % len(angs)] + (360 if k == len(angs) - 1 else 0)
            if a1 - a0 > best:
                best, ba = a1 - a0, (a0 + a1) / 2
        return ba % 360

    # 덧그리기
    def lp_pos(self, i, ang, r=LP_R):
        """원자 i 의 ang 방향 전자쌍 자리. 두 글자 원소(Br, Cl)는 가로로 조금 더 띄운다."""
        u = dirv(ang)
        px, py = self.p(i)
        rx = r + (4.5 if len(self.atoms[i]['el']) == 2 and self._label_center(i) else 0.0)
        return (px + u[0] * rx, py + u[1] * r)

    def lone_pairs(self, i, angs, r=LP_R, color=INK):
        """원자 i 에 전자쌍을 그린다. angs 가 정수면 그 개수만큼 결합·다른 표시와 가장 먼 방향을 골라 놓는다."""
        if isinstance(angs, int):
            angs = self._auto(i, angs)
        for a in angs:
            self.used.setdefault(i, []).append(a)
            self.fig.lp(self.lp_pos(i, a, r), a, color=color)
        return angs

    def _taken(self, i):
        return [angle_of(self.p(i), self.p(n)) for n in self.neighbors(i)] + self.used.get(i, [])

    def best_angle(self, i, avoid=()):
        tk = self._taken(i) + list(avoid)
        if not tk:
            return 90.0
        best, ba = -1, 90.0
        for k in range(0, 360, 3):
            dmin = min(abs((k - t + 180) % 360 - 180) for t in tk)
            # 같은 거리면 위·오른쪽을 조금 더 좋아한다
            sc = dmin + 0.01 * math.cos(math.radians(k - 60))
            if sc > best:
                best, ba = sc, float(k)
        return ba

    def _auto(self, i, n):
        ns = self.neighbors(i)
        if len(ns) == 1 and not self.used.get(i):
            b = angle_of(self.p(i), self.p(ns[0]))
            return [(b + 360.0 * (k + 1) / (n + 1)) % 360 for k in range(n)]
        out = []
        for _ in range(n):
            a = self.best_angle(i, out)
            out.append(a)
        return out

    def charge(self, i, sign, ang=None, d=FC_D):
        if ang is None:
            ang = self.best_angle(i)
            if len(self.used.get(i, [])) >= 2 and d == FC_D:
                d = 20.0
        self.used.setdefault(i, []).append(ang)
        u = dirv(ang)
        px, py = self.p(i)
        self.fig.charge((px + u[0] * d, py + u[1] * d), sign)

    def delta(self, i, sign, ang=90, d=16):
        u = dirv(ang)
        px, py = self.p(i)
        self.fig.delta((px + u[0] * d, py + u[1] * d), sign)

    def strip_charges(self, recenter=True):
        """molsvg 의 작은 +, − 글자를 지운다. 글자 하나짜리 원자(C⁺, O⁻ 등)는 원소 기호를 원자 좌표 가운데로 다시 놓는다."""
        hit = re.findall(r'<text[^>]*class="%s-atom-(\d+)"[^>]*font-size:9px[^>]*>[+−]</text>' % re.escape(self.prefix), self.svg)
        self.svg = re.sub(r'<text[^>]*font-size:9px[^>]*>[+−]</text>\n?', '', self.svg)
        if recenter:
            for i in map(int, hit):
                self.recenter(i)

    def recenter(self, i):
        """원자 i 의 글자가 하나뿐이면 원자 좌표 한가운데로 옮긴다."""
        cls = '%s-atom-%d' % (self.prefix, i)
        ts = re.findall(r'<text[^>]*class="%s"[^>]*>[^<]*</text>' % re.escape(cls), self.svg)
        if len(ts) != 1:
            return
        a = self.atoms[i]
        t = ts[0]
        t2 = re.sub(r'x="[^"]*"', 'x="%s"' % f1(a['x']), t, 1)
        t2 = re.sub(r'y="[^"]*"', 'y="%s"' % f1(a['y'] + 5.0), t2, 1)
        t2 = t2.replace('text-anchor:start', 'text-anchor:middle')
        self.svg = self.svg.replace(t, t2)
        self.close_gaps(i)

    def close_gaps(self, i, r=8.0, upto=15.0):
        """글자 둘레에서 끊긴 결합 끝을 원자 글자 가까이(r)까지 잇는다(전하 글자를 지운 뒤 생긴 빈틈)."""
        col = ELCOL.get(self.atoms[i]['el'], 'var(--fig-ink)')
        for bd in self.bonds:
            if i not in (bd['a'], bd['b']) or bd['order'] != 1.0:
                continue
            j = bd['b'] if bd['a'] == i else bd['a']
            p, q = self.p(i), self.p(j)
            L = math.dist(p, q)
            a, b = between(p, q, r / L), between(p, q, min(upto / L, 0.5))
            self.extra.append('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:2"/>' % (f1(a[0]), f1(a[1]), f1(b[0]), f1(b[1]), col))

    def hide_c_label(self, i, stub=13.0):
        """전하 띤 탄소의 'C' 글자를 지우고, 그 자리에서 끊겨 있던 결합을 꼭짓점까지 잇는다(단일 결합만)."""
        cls = '%s-atom-%d' % (self.prefix, i)
        self.svg = re.sub(r'<text[^>]*class="%s"[^>]*>[^<]*</text>\n?' % re.escape(cls), '', self.svg)
        for b in self.bonds:
            if i not in (b['a'], b['b']):
                continue
            if b['order'] != 1.0:
                raise ValueError('hide_c_label: 단일 결합만 이을 수 있다')
            j = b['b'] if b['a'] == i else b['a']
            p, q = self.p(i), self.p(j)
            L = math.dist(p, q)
            e = between(p, q, min(stub / L, 0.6))
            self.extra.append('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:var(--fig-ink);stroke-width:2;stroke-linecap:round"/>'
                              % (f1(p[0]), f1(p[1]), f1(e[0]), f1(e[1])))

    def remove_bond(self, i, j):
        """molsvg 가 그린 결합 i–j 를 지운다(쐐기·점선을 직접 그릴 때)."""
        for b, bd in enumerate(self.bonds):
            if {bd['a'], bd['b']} == {i, j}:
                self.svg = re.sub(r'<path class="%s-bond-%d [^"]*"[^>]*/>\n?' % (re.escape(self.prefix), b), '', self.svg)

    def highlight(self, idx, color='var(--fig-soft-amber)', r=11.0):
        """원자 번호 목록(작용기)을 뒤에 옅은 색 띠로 강조한다. 이웃한 원자 사이는 굵은 띠로 잇는다."""
        S = set(idx)
        for b in self.bonds:
            if b['a'] in S and b['b'] in S:
                p, q = self.p(b['a']), self.p(b['b'])
                self.back.append('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:%s;stroke-linecap:round"/>'
                                 % (f1(p[0]), f1(p[1]), f1(q[0]), f1(q[1]), color, 2 * r))
        for i in S:
            p = self.p(i)
            self.back.append('<circle cx="%s" cy="%s" r="%s" style="fill:%s"/>' % (f1(p[0]), f1(p[1]), r, color))

    def label(self, i, s, bg='var(--fig-paper)', color='var(--fig-ink)', r=8.5):
        """그려지지 않은 원자 글자(루이스 구조의 C 등)를 꼭짓점에 쓴다. 결합 끝을 배경색 원으로 가린다."""
        p = self.p(i)
        self.extra.append('<circle cx="%s" cy="%s" r="%s" style="fill:%s"/>' % (f1(p[0]), f1(p[1]), r, bg))
        self.extra.append('<text x="%s" y="%s" style="font-size:14px;fill:%s;text-anchor:middle">%s</text>' % (f1(p[0]), f1(p[1] + 5), color, esc(s)))

    def render(self):
        return ''.join(self.back) + '<g transform="translate(%s,%s)">%s</g>%s' % (f1(self.x), f1(self.y), self.svg, ''.join(self.extra))

    def dump(self):
        for a in self.atoms:
            px, py = self.p(a['i'])
            print('   atom', a['i'], a['el'], f1(px), f1(py))


def between(p, q, t=0.5):
    return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)


def offset(p, ang, d):
    u = dirv(ang)
    return (p[0] + u[0] * d, p[1] + u[1] * d)


def _qbez(p0, c, p1, t):
    a = (1 - t) ** 2; b = 2 * (1 - t) * t; e = t * t
    return (a * p0[0] + b * c[0] + e * p1[0], a * p0[1] + b * c[1] + e * p1[1])


def _qsplit(p0, c, p1, t0, t1):
    """2차 베지에의 [t0, t1] 부분을 같은 꼴의 베지에로."""
    def d(t):
        return (2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]), 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]))
    a, b = _qbez(p0, c, p1, t0), _qbez(p0, c, p1, t1)
    da = d(t0)
    h = (t1 - t0) / 2
    cc = (a[0] + da[0] * h, a[1] + da[1] * h)
    return a, cc, b


def _t_at_len(p0, c, p1, s, from_end=False, n=400):
    pts = [_qbez(p0, c, p1, k / n) for k in range(n + 1)]
    if from_end:
        pts = pts[::-1]
    acc = 0.0
    for k in range(1, n + 1):
        acc += math.dist(pts[k - 1], pts[k])
        if acc >= s:
            t = k / n
            return 1 - t if from_end else t
    return 0.0 if from_end else 1.0


class Fig:
    def __init__(self, name, w, h, title, desc, small=False):
        self.name, self.w, self.h, self.title, self.desc, self.small = name, w, h, title, desc, small
        self.items = []
        self.mols = []
        self.n_arrows = 0

    def css(self, c):
        return '%s-%s' % (self.name, c)

    def add(self, s):
        self.items.append(s)

    # 구조식
    def mol(self, smiles, key, x=None, y=None, center=None, orient=None, **kw):
        """구조식을 놓는다. orient=(i, j, 각도) 를 주면 원자 i→j 방향이 그 각도(0 = 오른쪽, 90 = 위)가 되도록 돌린다."""
        if orient is not None:
            i, j, want = orient
            kw0 = dict(kw); kw0['rotate'] = 0.0
            d0 = molsvg(smiles, '%s-%s' % (self.name, key), **kw0)
            a0 = angle_of((d0['atoms'][i]['x'], d0['atoms'][i]['y']), (d0['atoms'][j]['x'], d0['atoms'][j]['y']))
            kw['rotate'] = (want - a0) * (-1 if kw.get('flip') else 1)
            d = molsvg(smiles, '%s-%s' % (self.name, key), **kw)
            a1 = angle_of((d['atoms'][i]['x'], d['atoms'][i]['y']), (d['atoms'][j]['x'], d['atoms'][j]['y']))
            if abs(((a1 - want + 180) % 360) - 180) > 2:
                kw['rotate'] = -kw['rotate']
                d = molsvg(smiles, '%s-%s' % (self.name, key), **kw)
        else:
            d = molsvg(smiles, '%s-%s' % (self.name, key), **kw)
        if center is not None:
            x, y = center[0] - d['width'] / 2, center[1] - d['height'] / 2
        m = Mol(self, d, x, y)
        self.mols.append(m)
        self.items.append(m)
        return m

    def mol_like(self, smiles, key, A, center, **kw):
        """공명 구조 B 를 구조 A 와 같은 원자 배치(같은 원자 순서의 SMILES)로 놓는다. 돌리기·뒤집기를 찾아 맞추고,
        center 의 x 에 가운데를, 원자 0 의 높이를 A 와 같게 맞춘다."""
        def ang(atoms):
            return angle_of((atoms[0]['x'], atoms[0]['y']), (atoms[1]['x'], atoms[1]['y']))
        want = ang(A.atoms)
        for flip in (False, True):
            d0 = molsvg(smiles, '%s-%s' % (self.name, key), flip=flip, rotate=0.0, **kw)
            if len(d0['atoms']) != len(A.atoms):
                break
            base = ang(d0['atoms'])
            for rot in ((want - base), -(want - base)):
                d = molsvg(smiles, '%s-%s' % (self.name, key), flip=flip, rotate=float(rot), **kw)
                ok = all(a['el'] == b['el'] and abs((b['x'] - d['atoms'][0]['x']) - (a['x'] - A.atoms[0]['x'])) < 2.0
                         and abs((b['y'] - d['atoms'][0]['y']) - (a['y'] - A.atoms[0]['y'])) < 2.0 for a, b in zip(A.atoms, d['atoms']))
                if ok:
                    m = self.mol(smiles, key=key, center=center, flip=flip, rotate=float(rot), **kw)
                    m.y += (A.y + A.atoms[0]['y']) - (m.y + m.atoms[0]['y'])
                    return m
        raise ValueError('같은 배치를 찾지 못함: ' + smiles)

    # 덧그리기 요소
    def lp(self, p, ang, color=INK):
        u = dirv(ang + 90)
        for s in (-1, 1):
            self.add('<circle cx="%s" cy="%s" r="%s" style="fill:%s"/>' % (f1(p[0] + u[0] * s * LP_SEP / 2), f1(p[1] + u[1] * s * LP_SEP / 2), LP_DOT, color))

    def radical(self, p, color=INK):
        self.add('<circle cx="%s" cy="%s" r="%s" style="fill:%s"/>' % (f1(p[0]), f1(p[1]), LP_DOT + 0.2, color))

    def charge(self, p, sign, r=FC_R, color=INK):
        x, y = p
        s = ['<circle cx="%s" cy="%s" r="%s" style="fill:var(--fig-panel);stroke:%s;stroke-width:1.2"/>' % (f1(x), f1(y), r, color),
             '<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:1.4"/>' % (f1(x - r * 0.55), f1(y), f1(x + r * 0.55), f1(y), color)]
        if sign == '+':
            s.append('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:1.4"/>' % (f1(x), f1(y - r * 0.55), f1(x), f1(y + r * 0.55), color))
        self.add(''.join(s))

    def delta(self, p, sign, size=13):
        col = 'var(--fig-blue)' if sign == '+' else 'var(--fig-red)'
        self.add('<text x="%s" y="%s" style="font-size:%spx;fill:%s;text-anchor:middle">δ%s</text>' % (f1(p[0]), f1(p[1] + size * 0.35), size, col, '+' if sign == '+' else '−'))

    def text(self, x, y, s, cls='t', anchor='middle', style=None, raw=False):
        st = ' style="%s"' % style if style else ''
        body = s if raw else esc(s)
        self.add('<text x="%s" y="%s" class="%s" text-anchor="%s"%s>%s</text>' % (f1(x), f1(y), self.css(cls), anchor, st, body))

    def line(self, p, q, color=INK, width=1.6, dash=None, cap='round', opacity=None):
        st = 'stroke:%s;stroke-width:%s;stroke-linecap:%s' % (color, width, cap)
        if dash: st += ';stroke-dasharray:%s' % dash
        if opacity is not None: st += ';opacity:%s' % opacity
        self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="%s"/>' % (f1(p[0]), f1(p[1]), f1(q[0]), f1(q[1]), st))

    def rect(self, x, y, w, h, fill='var(--fig-panel)', stroke='var(--fig-line)', rx=8, width=1.2, dash=None, opacity=None):
        st = 'fill:%s;stroke:%s;stroke-width:%s' % (fill, stroke, width)
        if dash: st += ';stroke-dasharray:%s' % dash
        if opacity is not None: st += ';opacity:%s' % opacity
        self.add('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" style="%s"/>' % (f1(x), f1(y), f1(w), f1(h), rx, st))

    def path(self, d, style):
        self.add('<path d="%s" style="%s"/>' % (d, style))

    def cross(self, x, y, s=9, color='var(--fig-red)', width=3):
        self.line((x - s, y - s), (x + s, y + s), color, width)
        self.line((x - s, y + s), (x + s, y - s), color, width)

    def check(self, x, y, s=8, color='var(--fig-green)', width=3):
        self.add('<path d="M %s %s L %s %s L %s %s" style="fill:none;stroke:%s;stroke-width:%s;stroke-linecap:round;stroke-linejoin:round"/>'
                 % (f1(x - s), f1(y), f1(x - s * 0.3), f1(y + s * 0.7), f1(x + s), f1(y - s * 0.8), color, width))

    # 굽은 화살표
    def curved(self, p0, p1, bend=0.4, half=False, start_gap=2.0, end_gap=3.0, color=ARROW, width=1.7, head=9.0, hw=4.0, ctrl=None, dash=None):
        """p0(전자의 출발점)에서 p1(도착점)으로 굽은 화살표. bend > 0 이면 진행 방향의 왼쪽(화면에서 시계 반대 방향 쪽)으로 부푼다."""
        L = math.dist(p0, p1)
        if ctrl is None:
            mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
            dx, dy = (p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L
            nx, ny = dy, -dx          # 화면에서 진행 방향의 왼쪽
            c = (mx + nx * bend * L, my + ny * bend * L)
        else:
            c = ctrl
        t0 = _t_at_len(p0, c, p1, start_gap)
        t1 = _t_at_len(p0, c, p1, end_gap + head * 0.92, from_end=True)
        tt = _t_at_len(p0, c, p1, end_gap, from_end=True)
        a, cc, b = _qsplit(p0, c, p1, t0, t1)
        tip = _qbez(p0, c, p1, tt)
        ux, uy = tip[0] - b[0], tip[1] - b[1]
        ul = math.hypot(ux, uy) or 1.0
        ux, uy = ux / ul, uy / ul
        base = (tip[0] - ux * head, tip[1] - uy * head)
        vx, vy = -uy, ux
        st = 'fill:none;stroke:%s;stroke-width:%s;stroke-linecap:round' % (color, width)
        if dash: st += ';stroke-dasharray:%s' % dash
        self.add('<path d="M %s %s Q %s %s %s %s" style="%s"/>' % (f1(a[0]), f1(a[1]), f1(cc[0]), f1(cc[1]), f1(b[0]), f1(b[1]), st))
        if half:
            # 곡선의 바깥쪽(부푼 쪽) 갈퀴 하나
            side = 1 if bend >= 0 else -1
            nxs, nys = (uy, -ux)
            side_v = (nxs * side, nys * side)
            q = (base[0] + side_v[0] * hw * 1.1, base[1] + side_v[1] * hw * 1.1)
            self.add('<path d="M %s %s L %s %s L %s %s Z" style="fill:%s;stroke:%s;stroke-width:0.8;stroke-linejoin:round"/>'
                     % (f1(tip[0]), f1(tip[1]), f1(q[0]), f1(q[1]), f1(base[0] + ux * 2), f1(base[1] + uy * 2), color, color))
        else:
            q1 = (base[0] + vx * hw, base[1] + vy * hw)
            q2 = (base[0] - vx * hw, base[1] - vy * hw)
            notch = (tip[0] - ux * head * 0.78, tip[1] - uy * head * 0.78)
            self.add('<path d="M %s %s L %s %s L %s %s L %s %s Z" style="fill:%s;stroke:%s;stroke-width:0.8;stroke-linejoin:round"/>'
                     % (f1(tip[0]), f1(tip[1]), f1(q1[0]), f1(q1[1]), f1(notch[0]), f1(notch[1]), f1(q2[0]), f1(q2[1]), color, color))
        self.n_arrows += 1
        return tip

    def curved_away(self, p0, p1, away, bend=0.6, **kw):
        """굽은 화살표를 점 away(고리 중심 등)에서 먼 쪽으로 부풀린다."""
        L = math.dist(p0, p1)
        mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
        nx, ny = (p1[1] - p0[1]) / L, -(p1[0] - p0[0]) / L
        sgn = 1 if math.dist((mx + nx, my + ny), away) > math.dist((mx - nx, my - ny), away) else -1
        return self.curved(p0, p1, bend=abs(bend) * sgn, **kw)

    # 반응·평형·공명 화살표
    def _head(self, tip, ux, uy, L=10, hw=4.5, color=INK, half=None):
        base = (tip[0] - ux * L, tip[1] - uy * L)
        vx, vy = -uy, ux
        if half is None:
            pts = [tip, (base[0] + vx * hw, base[1] + vy * hw), (tip[0] - ux * L * 0.75, tip[1] - uy * L * 0.75), (base[0] - vx * hw, base[1] - vy * hw)]
        else:
            s = 1 if half == 'left' else -1
            pts = [tip, (base[0] + vx * hw * s, base[1] + vy * hw * s), (tip[0] - ux * L * 0.75, tip[1] - uy * L * 0.75)]
        d = 'M ' + ' L '.join('%s %s' % (f1(a), f1(b)) for a, b in pts) + ' Z'
        self.add('<path d="%s" style="fill:%s;stroke:%s;stroke-width:0.8;stroke-linejoin:round"/>' % (d, color, color))

    def _labels(self, x1, x2, y, above, below, gap=9):
        cx = (x1 + x2) / 2
        if above:
            for k, s in enumerate(above if isinstance(above, list) else [above]):
                self.text(cx, y - gap - 17 * (len(above) - 1 - k if isinstance(above, list) else 0), s, cls='s')
        if below:
            for k, s in enumerate(below if isinstance(below, list) else [below]):
                self.text(cx, y + gap + 12 + 17 * k, s, cls='s')

    def rxn(self, x1, y, x2, above=None, below=None, color=INK, dash=None, y2=None):
        y2 = y if y2 is None else y2
        L = math.hypot(x2 - x1, y2 - y)
        ux, uy = (x2 - x1) / L, (y2 - y) / L
        st = 'stroke:%s;stroke-width:1.8' % color + (';stroke-dasharray:%s' % dash if dash else '')
        self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="%s"/>' % (f1(x1), f1(y), f1(x2 - ux * 8), f1(y2 - uy * 8), st))
        self._head((x2, y2), ux, uy, color=color)
        if y2 == y:
            self._labels(x1, x2, y, above, below)

    def eq(self, x1, y, x2, above=None, below=None, color=INK, sep=3.5):
        """⇌ : 위 줄은 오른쪽(위쪽 갈퀴), 아래 줄은 왼쪽(아래쪽 갈퀴)."""
        ya, yb = y - sep, y + sep
        self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:1.8"/>' % (f1(x1), f1(ya), f1(x2 - 4), f1(ya), color))
        self._head((x2, ya), 1, 0, L=11, hw=5.5, color=color, half='right')
        self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:1.8"/>' % (f1(x1 + 4), f1(yb), f1(x2), f1(yb), color))
        self._head((x1, yb), -1, 0, L=11, hw=5.5, color=color, half='right')
        self._labels(x1, x2, y, above, below, gap=12)

    def res(self, x1, y, x2, above=None, below=None, color=INK):
        """↔ : 공명 구조 사이에만."""
        self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:1.8"/>' % (f1(x1 + 8), f1(y), f1(x2 - 8), f1(y), color))
        self._head((x2, y), 1, 0, color=color)
        self._head((x1, y), -1, 0, color=color)
        self._labels(x1, x2, y, above, below)

    def plus(self, x, y):
        self.text(x, y + 6, '+', cls='pl')

    def dipole(self, p, q, color=INK, width=1.8):
        """결합 쌍극자: p(δ+) 에서 q(δ−) 로, 꼬리에 + 가로대."""
        L = math.dist(p, q)
        ux, uy = (q[0] - p[0]) / L, (q[1] - p[1]) / L
        self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:%s"/>' % (f1(p[0]), f1(p[1]), f1(q[0] - ux * 8), f1(q[1] - uy * 8), color, width))
        self._head(q, ux, uy, L=9, hw=4.2, color=color)
        c = (p[0] + ux * 7, p[1] + uy * 7)
        vx, vy = -uy, ux
        self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:%s"/>' % (f1(c[0] + vx * 5), f1(c[1] + vy * 5), f1(c[0] - vx * 5), f1(c[1] - vy * 5), color, width))

    # 입체 결합
    def wedge(self, p, q, w=7.0, color=INK, shorten=0.0):
        """p(입체 중심) → q 로 넓어지는 채운 쐐기(종이 앞)."""
        L = math.dist(p, q)
        ux, uy = (q[0] - p[0]) / L, (q[1] - p[1]) / L
        q = (q[0] - ux * shorten, q[1] - uy * shorten)
        vx, vy = -uy, ux
        self.add('<path d="M %s %s L %s %s L %s %s Z" style="fill:%s;stroke:%s;stroke-width:0.8;stroke-linejoin:round"/>'
                 % (f1(p[0]), f1(p[1]), f1(q[0] + vx * w / 2), f1(q[1] + vy * w / 2), f1(q[0] - vx * w / 2), f1(q[1] - vy * w / 2), color, color))

    def hash(self, p, q, w=7.0, n=6, color=INK, shorten=0.0):
        """p → q 로 넓어지는 점선 쐐기(종이 뒤)."""
        L = math.dist(p, q)
        ux, uy = (q[0] - p[0]) / L, (q[1] - p[1]) / L
        L2 = L - shorten
        vx, vy = -uy, ux
        for k in range(1, n + 1):
            t = k / n
            c = (p[0] + ux * L2 * t, p[1] + uy * L2 * t)
            hw = w / 2 * t
            self.add('<line x1="%s" y1="%s" x2="%s" y2="%s" style="stroke:%s;stroke-width:1.5"/>' % (f1(c[0] + vx * hw), f1(c[1] + vy * hw), f1(c[0] - vx * hw), f1(c[1] - vy * hw), color))

    # 오비탈
    def lobe(self, c, ang, L, wid=0.55, phase='+', empty=False, opacity=0.85, back=0.0, scale_y=1.0, stroke_w=1.3):
        """원자 c 에서 ang 방향으로 뻗은 엽 하나(눈물 모양). L: 길이, wid: 폭/길이 비."""
        pts = []
        n = 48
        for k in range(n + 1):
            t = math.pi * k / n        # 0..π
            # 끝이 둥근 눈물 모양: 축 방향 x = L * (1 - cos t)/2, 폭 y = sin t * (1 - cos t)/2 의 변형
            xx = L * (1 - math.cos(t)) / 2
            yy = wid * L * math.sin(t) * (0.35 + 0.65 * (1 - math.cos(t)) / 2)
            pts.append((xx, yy))
        pts = pts + [(x, -y) for x, y in reversed(pts[1:-1])]
        a = math.radians(ang)
        ca, sa = math.cos(a), math.sin(a)
        P = []
        for xx, yy in pts:
            X = xx * ca - yy * sa
            Y = (xx * sa + yy * ca) * scale_y
            P.append((c[0] + X, c[1] - Y))
        d = 'M ' + ' L '.join('%s %s' % (f1(x), f1(y)) for x, y in P) + ' Z'
        if empty:
            st = 'fill:none;stroke:var(--fig-muted);stroke-width:1.3;stroke-dasharray:4 3'
        elif phase == '+':
            st = 'fill:var(--fig-soft-blue);stroke:var(--fig-blue);stroke-width:%s;fill-opacity:%s' % (stroke_w, opacity)
        else:
            st = 'fill:var(--fig-soft-amber);stroke:var(--fig-amber);stroke-width:%s;fill-opacity:%s' % (stroke_w, opacity)
        self.add('<path d="%s" style="%s"/>' % (d, st))

    def p_orbital(self, c, ang, L=26, wid=0.5, empty=False, top_phase='+', **kw):
        """아령 모양 p 오비탈: ang 방향 엽은 top_phase, 반대쪽 엽은 반대 위상."""
        other = '-' if top_phase == '+' else '+'
        self.lobe(c, ang, L, wid, phase=top_phase, empty=empty, **kw)
        self.lobe(c, ang + 180, L, wid, phase=other, empty=empty, **kw)

    def render(self):
        nm = self.name
        style = ('.{n}-t{{font-size:14px;fill:var(--fig-ink)}} .{n}-b{{font-size:14px;fill:var(--fig-ink);font-weight:600}} '
                 '.{n}-h{{font-size:15px;fill:var(--fig-ink);font-weight:700}} .{n}-s{{font-size:13px;fill:var(--fig-muted)}} '
                 '.{n}-n{{font-size:13px;fill:var(--fig-muted)}} .{n}-r{{font-size:13px;fill:var(--fig-red);font-weight:600}} '
                 '.{n}-g{{font-size:13px;fill:var(--fig-green);font-weight:600}} .{n}-v{{font-size:13px;fill:var(--fig-violet)}} '
                 '.{n}-pl{{font-size:20px;fill:var(--fig-ink)}} .{n}-f{{font-size:14px;fill:var(--fig-ink)}}').format(n=nm)
        out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d"%s role="img" aria-labelledby="t-%s d-%s">'
               % (self.w, self.h, ' class="fig-small"' if self.small else '', nm, nm),
               '  <title id="t-%s">%s</title>' % (nm, esc(self.title)),
               '  <desc id="d-%s">%s</desc>' % (nm, esc(self.desc)),
               '  <style>%s</style>' % style]
        for it in self.items:
            out.append('  ' + (it.render() if isinstance(it, Mol) else it))
        out.append('</svg>')
        s = '\n'.join(out) + '\n'
        return s

    def save(self, path):
        s = self.render()
        bad = re.findall(r'(?:class|text-anchor|id)="[^"]*−[^"]*"', s)
        if bad:
            raise ValueError('속성에 유니코드 마이너스: %s' % bad[:3])
        for m in re.finditer(r'<text[^>]*>([^<]*)</text>', s):
            pass
        open(path, 'w', encoding='utf-8').write(s)
        print('저장 %s (%.1f kB, 굽은 화살표 %d개)' % (os.path.basename(path), len(s.encode()) / 1024, self.n_arrows))


# ───── 확인 도구(RDKit) ─────
VAL = {'H': 1, 'B': 3, 'C': 4, 'N': 5, 'O': 6, 'F': 7, 'Cl': 7, 'Br': 7, 'I': 7, 'S': 6, 'P': 5, 'Li': 1, 'Na': 1}


def check_species(smiles, name=''):
    """원자마다 결합 수(차수 합), 비공유 전자쌍 수, 형식 전하(V − N − B/2), 옥텟을 출력하고 전하 합을 돌려준다."""
    from rdkit import Chem
    m = Chem.AddHs(Chem.MolFromSmiles(smiles))
    tot_e, tot_q = 0, 0
    rows = []
    for a in m.GetAtoms():
        el = a.GetSymbol()
        if el == 'H':
            tot_e += 1; tot_q += a.GetFormalCharge(); continue
        bo = sum(b.GetBondTypeAsDouble() for b in a.GetBonds())
        q = a.GetFormalCharge()
        V = VAL[el]
        nonb = V - q - bo           # 비공유 전자 수(라디칼 없음 가정)
        nonb -= a.GetNumRadicalElectrons()
        fc = V - nonb - a.GetNumRadicalElectrons() - bo
        oct_ = 2 * bo + nonb + a.GetNumRadicalElectrons()
        rows.append('%s%d: 결합 %g, 전자쌍 %g%s, 형식 전하 %+d, 둘레 전자 %g' % (el, a.GetIdx(), bo, nonb / 2,
                    (' + 홀전자 %d' % a.GetNumRadicalElectrons()) if a.GetNumRadicalElectrons() else '', fc, oct_))
        assert fc == q, (smiles, el, fc, q)
        tot_e += V; tot_q += q
    tot_e -= tot_q
    print('  [%s] %s  원자가 전자 %d, 전하 %+d' % (name, smiles, tot_e, tot_q))
    for r in rows:
        print('     ' + r)
    return tot_q


def check_step(left, right, label=''):
    """반응 전후 원자 수와 전하 합이 같은지 확인한다."""
    from rdkit import Chem
    from collections import Counter

    def tally(lst):
        c, q = Counter(), 0
        for s in lst:
            m = Chem.AddHs(Chem.MolFromSmiles(s))
            for a in m.GetAtoms():
                c[a.GetSymbol()] += 1; q += a.GetFormalCharge()
        return c, q
    cl, ql = tally(left); cr, qr = tally(right)
    ok = cl == cr and ql == qr
    print('  단계 %s: %s → %s  원자 %s, 전하 %+d → %+d  %s' % (label, ' + '.join(left), ' + '.join(right), dict(cl), ql, qr, '보존 OK' if ok else '!! 어긋남'))
    assert ok
    return ok


def check_rs_2d(elems, coords, center, wedges, expect):
    """2차원 좌표(화면, y 아래)와 쐐기 정보로 R/S 를 RDKit 으로 판정한다.
    elems: 원소 목록, coords: [(x, y)], center: 입체 중심 번호, wedges: {이웃 번호: 'wedge'|'hash'}, expect: 'R'|'S'."""
    from rdkit import Chem
    from rdkit.Chem import rdchem
    rw = Chem.RWMol()
    for e in elems:
        rw.AddAtom(Chem.Atom(e))
    for j in range(len(elems)):
        if j != center:
            rw.AddBond(center, j, Chem.BondType.SINGLE)
    m = rw.GetMol()
    conf = Chem.Conformer(len(elems))
    for k, (x, y) in enumerate(coords):
        conf.SetAtomPosition(k, (x, -y, 0.0))
    m.AddConformer(conf)
    for b in m.GetBonds():
        j = b.GetEndAtomIdx() if b.GetBeginAtomIdx() == center else b.GetBeginAtomIdx()
        if j in wedges:
            b.SetBondDir(rdchem.BondDir.BEGINWEDGE if wedges[j] == 'wedge' else rdchem.BondDir.BEGINDASH)
    Chem.SanitizeMol(m)
    Chem.AssignChiralTypesFromBondDirs(m)
    Chem.AssignStereochemistry(m, cleanIt=True, force=True)
    cc = Chem.FindMolChiralCenters(m, includeUnassigned=True, useLegacyImplementation=False)
    print('  R/S 판정:', cc, '기대', expect, Chem.MolToSmiles(m))
    assert cc and cc[0][1] == expect, cc
    return cc


# ───── 3차원 스케치(오비탈·입체 모양) ─────
def view_matrix(yaw, pitch):
    """y축 둘레로 yaw, x축 둘레로 pitch 만큼 돌리는 회전 행렬(라디안). 좌표: x 오른쪽, y 위, z 보는 사람 쪽."""
    import numpy as np
    cy, sy, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pitch), math.sin(pitch)
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    return Rx @ Ry


class Scene3:
    """3차원 좌표(px 단위)를 정사영해 깊이 순서대로 그린다. 원자 글자·결합(앞은 쐐기, 뒤는 점선 자동)·오비탈 엽·공 모형.
        S = Scene3(F, cx, cy, view_matrix(0.4, 0.5))
        S.atom('O', (0, 0, -50), color='var(--fig-red)');  S.bond(a, b, order=2);  S.lobe(pos, dir, L, wid, '+')
        S.flush()   # 먼 것부터 그린다"""

    def __init__(self, fig, cx, cy, R):
        self.F, self.cx, self.cy, self.R, self.items = fig, cx, cy, R, []
        self.atoms = []

    def P(self, v):
        import numpy as np
        w = self.R @ np.array(v, float)
        return (self.cx + w[0], self.cy - w[1]), float(w[2])

    def atom(self, lab, pos, color=INK, r=8.5, bg='var(--fig-paper)', size=14, ball=None):
        """글자 원자(ball 에 색을 주면 공 모형). 돌려준 번호를 bond() 에 쓴다."""
        c, z = self.P(pos)
        self.atoms.append((lab, pos, c, z, r if lab or ball else 0))
        def fn():
            if ball:
                self.F.add('<circle cx="%s" cy="%s" r="%s" style="fill:%s;stroke:var(--fig-ink);stroke-width:1.2"/>' % (f1(c[0]), f1(c[1]), r, ball))
                if lab:
                    self.F.add('<text x="%s" y="%s" style="font-size:%spx;fill:var(--fig-ink);text-anchor:middle;font-weight:600">%s</text>' % (f1(c[0]), f1(c[1] + size * 0.36), size, esc(lab)))
            elif lab:
                self.F.add('<circle cx="%s" cy="%s" r="%s" style="fill:%s"/>' % (f1(c[0]), f1(c[1]), r, bg))
                self.F.add('<text x="%s" y="%s" style="font-size:%spx;fill:%s;text-anchor:middle">%s</text>' % (f1(c[0]), f1(c[1] + size * 0.36), size, color, esc(lab)))
        self.items.append((z + (0.5 if ball else 1e4), fn))
        return len(self.atoms) - 1

    def bond(self, i, j, order=1, stereo='auto', color=INK, width=2.0, thresh=6.0):
        """i–j 결합. stereo='auto' 면 j 가 i 보다 thresh 이상 앞이면 쐐기, 뒤면 점선 쐐기, 아니면 보통 선."""
        (li, pi, ci, zi, ri), (lj, pj, cj, zj, rj) = self.atoms[i], self.atoms[j]
        L = math.dist(ci, cj) or 1
        ux, uy = (cj[0] - ci[0]) / L, (cj[1] - ci[1]) / L
        a = (ci[0] + ux * ri * 1.05, ci[1] + uy * ri * 1.05)
        b = (cj[0] - ux * rj * 1.05, cj[1] - uy * rj * 1.05)
        kind = 'line'
        if stereo == 'auto' and order == 1:
            if zj - zi > thresh: kind = 'wedge'
            elif zi - zj > thresh: kind = 'hash'
        elif stereo in ('wedge', 'hash'):
            kind = stereo
        def fn():
            if kind == 'wedge':
                self.F.wedge(a, b, color=color)
            elif kind == 'hash':
                self.F.hash(a, b, color=color)
            elif order == 1 or order == 'dash':
                self.F.line(a, b, color=color, width=width, dash='4 3' if order == 'dash' else None, cap='butt')
            else:
                vx, vy = -uy, ux
                offs = (-2.6, 2.6) if order == 2 else (-4.2, 0, 4.2)
                for o in offs:
                    self.F.line((a[0] + vx * o, a[1] + vy * o), (b[0] + vx * o, b[1] + vy * o), color=color, width=1.8, cap='butt')
        self.items.append(((zi + zj) / 2, fn))
        return kind

    def lobe(self, o, d, L, wid=0.42, phase='+', op=0.8, empty=False, dz=0.0):
        import numpy as np
        d = np.array(d, float); d /= np.linalg.norm(d)
        w = self.R @ d
        k = math.hypot(w[0], w[1])
        ang = math.degrees(math.atan2(w[1], w[0]))
        c, z = self.P(o)
        Lp = max(L * k, L * 0.35)
        wd = min(wid * L / Lp * (0.55 + 0.45 * k), 0.95)
        self.items.append((z + float(w[2]) * L * 0.5 + dz, lambda: self.F.lobe(c, ang, Lp, wd, phase=phase, opacity=op, empty=empty)))

    def p_orbital(self, o, d, L=40, wid=0.42, top='+', empty=False, op=0.75):
        import numpy as np
        self.lobe(o, d, L, wid, top, op=op, empty=empty)
        self.lobe(o, tuple(-np.array(d, float)), L, wid, '-' if top == '+' else '+', op=op, empty=empty)

    def poly(self, pts, style, z=-1e3):
        P = [self.P(p)[0] for p in pts]
        self.items.append((z, lambda: self.F.path('M ' + ' L '.join('%s %s' % (f1(x), f1(y)) for x, y in P) + ' Z', style)))

    def custom(self, z, fn):
        self.items.append((z, fn))

    def flush(self):
        for z, fn in sorted(self.items, key=lambda t: t[0]):
            fn()
        self.items = []


# ───── 정전기 퍼텐셜 지도(점전하 모형) ─────
VDW = {'H': 1.10, 'C': 1.70, 'N': 1.55, 'O': 1.52, 'F': 1.47, 'Cl': 1.75, 'Br': 1.85, 'Li': 1.45, 'B': 1.65, 'S': 1.80}
ESP_STOPS = [(0.0, (200, 30, 30)), (0.2, (238, 120, 40)), (0.37, (232, 205, 60)), (0.5, (80, 185, 90)), (0.7, (50, 165, 205)), (1.0, (40, 70, 200))]


ESP_STATS = []          # 마지막으로 계산한 표면 퍼텐셜 값들(척도를 고를 때 참고)


def esp_color(t):
    """0(가장 음, 빨강) → 1(가장 양, 파랑). 색 자체가 내용이므로 고정색을 쓴다."""
    t = min(max(t, 0.0), 1.0)
    for (t0, c0), (t1, c1) in zip(ESP_STOPS, ESP_STOPS[1:]):
        if t <= t1:
            u = (t - t0) / (t1 - t0)
            return '#%02x%02x%02x' % tuple(int(round(a + (b - a) * u)) for a, b in zip(c0, c1))
    return '#%02x%02x%02x' % ESP_STOPS[-1][1]


def esp_map(F, key, elems, xyz, charges, cx, cy, scale, R, vmin=-40.0, vmax=40.0, cell=2.5, radius_scale=1.0, nbins=28):
    """분자 표면(반데르발스 구의 합집합, 보는 쪽 면)에서 점전하 Σ q/r 로 퍼텐셜(kcal/mol)을 계산해 색칠한다.
    elems: 원소, xyz: Å 좌표, charges: 부분 전하(e), (cx, cy): 그림 위 중심, scale: px/Å, R: 회전 행렬.
    vmin → 빨강(전자 풍부), vmax → 파랑(전자 부족). 같은 척도로 비교하려면 vmin, vmax 를 같게 준다. 화면 좌표 목록을 돌려준다."""
    import numpy as np
    del ESP_STATS[:]
    X = (R @ (np.array(xyz, float) - np.mean(np.array(xyz, float), axis=0)).T).T
    rad = np.array([VDW[e] * radius_scale for e in elems])
    q = np.array(charges, float)
    sx = cx + X[:, 0] * scale
    sy = cy - X[:, 1] * scale
    cid = '%s-%s-clip' % (F.name, key)
    circ = ''.join('<circle cx="%s" cy="%s" r="%s"/>' % (f1(a), f1(b), f1(r * scale)) for a, b, r in zip(sx, sy, rad))
    F.add('<clipPath id="%s">%s</clipPath>' % (cid, circ))
    F.add(''.join('<circle cx="%s" cy="%s" r="%s" style="fill:var(--fig-ink);stroke:var(--fig-ink);stroke-width:2.4"/>' % (f1(a), f1(b), f1(r * scale)) for a, b, r in zip(sx, sy, rad)))
    x0, x1 = int(min(sx - rad * scale)) - 2, int(max(sx + rad * scale)) + 2
    y0, y1 = int(min(sy - rad * scale)) - 2, int(max(sy + rad * scale)) + 2
    rects = []
    yy = y0
    while yy < y1:
        run_c, run_x = None, None
        xx = x0
        cols = []
        while xx < x1:
            px, py = xx + cell / 2, yy + cell / 2
            # 화면 좌표 → 회전 좌표계(Å)
            ax, ay = (px - cx) / scale, -(py - cy) / scale
            best = None
            for k in range(len(elems)):
                d2 = (ax - X[k, 0]) ** 2 + (ay - X[k, 1]) ** 2
                r2 = rad[k] ** 2
                if d2 < r2 * 1.02:
                    zs = X[k, 2] + math.sqrt(max(r2 - d2, 0.0))
                    if best is None or zs > best:
                        best = zs
            if best is None:
                cols.append(None)
            else:
                pt = np.array([ax, ay, best])
                dist = np.linalg.norm(X - pt, axis=1)
                V = 332.06 * float(np.sum(q / np.maximum(dist, 0.3)))
                ESP_STATS.append(V)
                t = (V - vmin) / (vmax - vmin)
                b = int(round(min(max(t, 0), 1) * (nbins - 1)))
                cols.append(b)
            xx += cell
        # 같은 색 가로 구간을 하나의 사각형으로
        k = 0
        while k < len(cols):
            if cols[k] is None:
                k += 1; continue
            j = k
            while j + 1 < len(cols) and cols[j + 1] == cols[k]:
                j += 1
            rects.append('<rect x="%s" y="%s" width="%s" height="%s" style="fill:%s"/>' % (f1(x0 + k * cell), f1(yy), f1((j - k + 1) * cell + 0.4), f1(cell + 0.4), esp_color(cols[k] / (nbins - 1))))
            k = j + 1
        yy += cell
    F.add('<g clip-path="url(#%s)">%s</g>' % (cid, ''.join(rects)))
    return list(zip(sx, sy, X[:, 2]))


def esp_bar(F, x, y, w, h=12, left='전자 풍부(−)', right='전자 부족(+)', vmin=None, vmax=None):
    """색 척도 막대."""
    n = 40
    for k in range(n):
        F.add('<rect x="%s" y="%s" width="%s" height="%s" style="fill:%s"/>' % (f1(x + w * k / n), f1(y), f1(w / n + 0.5), h, esp_color(k / (n - 1))))
    F.add('<rect x="%s" y="%s" width="%s" height="%s" style="fill:none;stroke:var(--fig-line);stroke-width:1"/>' % (f1(x), f1(y), f1(w), h))
    F.text(x - 8, y + h - 1, left, cls='s', anchor='end')
    F.text(x + w + 8, y + h - 1, right, cls='s', anchor='start')
    if vmin is not None:
        F.text(x, y + h + 15, vmin, cls='n', anchor='middle')
        F.text(x + w, y + h + 15, vmax, cls='n', anchor='middle')
