#!/usr/bin/env python3
"""구조식 밑그림 도구: SMILES → 이 책의 그림 규칙(색 토큰, <text> 글자)에 맞는 골격 구조식 SVG 조각.

사용:
  python3 tools/authoring/molsvg.py --smiles 'C[C@H](Br)CC' [--bond 32] [--prefix ochem-4-q-x-m1]
          [--mono] [--rotate 30] [--flip] [--show-carbons] [--explicit-h] [--atom-index] [--out mol.json]

결과(JSON, --out 이 없으면 표준 출력):
  svg     : <g class="{prefix}">…</g> 한 덩어리. 그림 안에서 <g transform="translate(x,y)">…</g> 로 감싸 원하는 자리에 놓는다.
  width, height : 조각의 크기(px). 왼쪽 위가 (0, 0).
  atoms   : [{"i": 원자 번호(SMILES 순서), "el": 원소, "x": …, "y": …}, …]  — 굽은 화살표·이름표·부분 전하를 붙일 좌표.
  bonds   : [{"a": i, "b": j, "order": 1|2|3|1.5}, …]

지침:
- 입체는 SMILES 의 @/@@, / \\ 로 준다(쐐기·점선과 E/Z 가 그대로 그려진다). 그린 뒤 atoms 좌표로 R/S·E/Z 를 반드시 눈으로 확인한다.
- 수소를 드러내 그리려면 SMILES 에 [H] 로 쓰고 --explicit-h 를 준다. 전하는 [O-], [NH4+] 처럼 쓴다. 고립 전자쌍·굽은 화살표·부분 전하(δ+)·전이 상태의 점선 결합은 이 도구가 그리지 않는다. atoms 좌표를 써서 직접 덧그린다.
- 색: 탄소 뼈대와 결합은 --fig-ink, O 는 --fig-red, N 은 --fig-blue, 할로젠은 --fig-green, S·P 는 --fig-amber, 금속 등은 --fig-violet. --mono 를 주면 모두 --fig-ink.
- --prefix 는 그림 파일 이름 + 구별자(글자로 시작). 한 그림에 여러 분자를 넣으면 분자마다 다르게 준다.
- 방향족 고리는 케쿨레 구조(번갈아 놓인 이중 결합)로 그린다.
"""
import argparse, json, math, re, sys
from rdkit import Chem
from rdkit.Chem import rdDepictor
from rdkit.Chem.Draw import rdMolDraw2D

ap = argparse.ArgumentParser()
ap.add_argument('--smiles', required=True)
ap.add_argument('--bond', type=float, default=32.0, help='결합 길이(px)')
ap.add_argument('--prefix', default='mol')
ap.add_argument('--mono', action='store_true')
ap.add_argument('--rotate', type=float, default=0.0, help='시계 반대 방향 회전(도)')
ap.add_argument('--flip', action='store_true', help='좌우 뒤집기(입체 표시는 함께 바뀌어 같은 분자를 유지)')
ap.add_argument('--show-carbons', action='store_true', help='말단 CH3 를 글자로 적는다')
ap.add_argument('--explicit-h', action='store_true', help='SMILES 의 [H] 를 그대로 그린다')
ap.add_argument('--atom-index', action='store_true', help='원자 번호를 함께 그린다(확인용)')
ap.add_argument('--font', type=float, default=14.0)
ap.add_argument('--out')
a = ap.parse_args()
if not re.match(r'^[A-Za-z][\w-]*$', a.prefix):
    sys.exit('prefix 는 글자로 시작해야 한다')

ps = Chem.SmilesParserParams(); ps.removeHs = not a.explicit_h
mol = Chem.MolFromSmiles(a.smiles, ps)
if mol is None:
    sys.exit('SMILES 를 읽지 못함: ' + a.smiles)
rdDepictor.SetPreferCoordGen(False)
rdDepictor.Compute2DCoords(mol)
conf = mol.GetConformer()
if a.rotate or a.flip:
    th = math.radians(a.rotate)
    for i in range(mol.GetNumAtoms()):
        p = conf.GetAtomPosition(i)
        x, y = p.x, p.y
        if a.flip:
            x = -x
        conf.SetAtomPosition(i, (x * math.cos(th) - y * math.sin(th), x * math.sin(th) + y * math.cos(th), 0.0))
Chem.Kekulize(mol, clearAromaticFlags=False)
dm = rdMolDraw2D.PrepareMolForDrawing(mol, kekulize=True, addChiralHs=False, wedgeBonds=True)

d = rdMolDraw2D.MolDraw2DSVG(-1, -1, noFreetype=True)
o = d.drawOptions()
o.scalingFactor = a.bond / 1.5
o.bondLineWidth = 2
o.padding = 0.08
o.clearBackground = False
o.fixedFontSize = int(round(a.font))
o.minFontSize = int(round(a.font)); o.maxFontSize = int(round(a.font))
o.multipleBondOffset = 0.16
o.additionalAtomLabelPadding = 0.08
o.addStereoAnnotation = False
o.addAtomIndices = a.atom_index
if a.show_carbons:
    o.explicitMethyl = True
SENTI = {'ink': (2, 4, 6), 'red': (232, 4, 6), 'blue': (4, 6, 234), 'green': (4, 156, 6), 'amber': (236, 158, 6), 'violet': (158, 6, 236)}
SENT = {k: tuple(v / 255 for v in c) for k, c in SENTI.items()}
def hexof(c): return '#%02X%02X%02X' % tuple(int(round(v * 255)) for v in c)
pal = {}
for z in range(0, 119):
    pal[z] = SENT['ink'] if a.mono else SENT['violet']
if not a.mono:
    for z in (1, 5, 6, 14): pal[z] = SENT['ink']
    pal[8] = SENT['red']; pal[7] = SENT['blue']
    for z in (9, 17, 35, 53): pal[z] = SENT['green']
    for z in (15, 16, 34): pal[z] = SENT['amber']
o.setAtomPalette(pal)
o.setLegendColour(SENT['ink']) if hasattr(o, 'setLegendColour') else None
d.DrawMolecule(dm)
d.FinishDrawing()
raw = d.GetDrawingText()
m = re.search(r"width='([\d.]+)px' height='([\d.]+)px'", raw)
W, H = float(m.group(1)), float(m.group(2))
body = raw[raw.find('<!-- END OF HEADER -->') + len('<!-- END OF HEADER -->'):]
body = body[:body.rfind('</svg>')]
body = re.sub(r"<rect style='opacity:1.0;fill:#FFFFFF[^>]*>\s*</rect>", '', body)
for name, c in SENT.items():
    body = body.replace(hexof(c), f'var(--fig-{name})')
body = body.replace('#000000', 'var(--fig-ink)')
left = sorted(set(re.findall(r'#[0-9A-Fa-f]{6}', body)))
if left:
    print('  ! 바꾸지 못한 색:', left, file=sys.stderr)
    body = re.sub(r'#[0-9A-Fa-f]{6}', 'var(--fig-ink)', body)
body = re.sub(r"class='([^']*)'", lambda mm: "class='" + ' '.join(f'{a.prefix}-{c}' for c in mm.group(1).split()) + "'", body)
body = re.sub(r";?font-family:[^;']*", '', body)
body = body.replace("'", '"').strip()
body = re.sub(r'>-</text>', '>−</text>', body)          # 음전하는 마이너스 기호로
body = re.sub(r';fill-opacity:1|;stroke-opacity:1|;font-style:normal|;font-weight:normal|;stroke-linejoin:miter|fill-rule:evenodd;', '', body)
body = re.sub(r'\n\s*\n', '\n', body)
svg = f'<g class="{a.prefix}">\n{body}\n</g>'
atoms = []
for i in range(dm.GetNumAtoms()):
    p = d.GetDrawCoords(i)
    atoms.append({'i': i, 'el': dm.GetAtomWithIdx(i).GetSymbol(), 'x': round(p.x, 1), 'y': round(p.y, 1)})
bonds = [{'a': b.GetBeginAtomIdx(), 'b': b.GetEndAtomIdx(), 'order': b.GetBondTypeAsDouble()} for b in dm.GetBonds()]
res = {'svg': svg, 'width': round(W, 1), 'height': round(H, 1), 'atoms': atoms, 'bonds': bonds, 'smiles': a.smiles}
txt = json.dumps(res, ensure_ascii=False, indent=1)
if a.out:
    open(a.out, 'w', encoding='utf-8').write(txt)
    print(f'{a.out}: {W:.0f}×{H:.0f}px, 원자 {len(atoms)}개')
else:
    print(txt)
