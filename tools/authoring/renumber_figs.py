#!/usr/bin/env python3
"""그림 번호 맞추기: 원고에 나오는 순서대로 SVG <title>의 '그림 {표시번호}-{n}' 번호를 다시 매기고,
원고·그림·시뮬레이션 설명 속에서 그 그림을 가리키는 '그림 {표시번호}-{n}' 도 함께 고친다.
사용: python3 tools/authoring/renumber_figs.py [--write]   (--write 가 없으면 바뀔 내용만 보여 준다)"""
import glob, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
FIG = os.path.join(ROOT, 'docs', 'assets', 'fig')
SIMS = os.path.join(ROOT, 'docs', 'assets', 'js', 'sims')
write = '--write' in sys.argv
TITLE = re.compile(r'(<title[^>]*>)\s*그림\s+([^<]+?)-(\d+)(?=[\s.:<])')

lessons = []          # (원고 경로, 표시번호, [그림 이름…])
for dp, dn, fs in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in ('.git', 'node_modules', 'docs', 'tools')]
    for f in sorted(fs):
        if not re.match(r'^[a-z0-9]+-\d+_.*\.md$', f):
            continue
        p = os.path.join(dp, f)
        text = open(p, encoding='utf-8').read()
        label = re.match(r'^# (.+?)\. ', text).group(1)
        names = re.findall(r'^<!--\s*fig:([\w-]+)\s*-->\s*$', text, flags=re.M)
        lessons.append((p, label, names))

newnum = {}           # 그림 이름 → (표시번호, 새 번호)
refmap = {}           # 표시번호 → {옛 번호: 새 번호}
ambiguous = set()     # (표시번호, 옛 번호) — 같은 옛 번호를 가진 그림이 둘 이상
changed = 0
for p, label, names in lessons:
    seen = {}
    for n, name in enumerate(names, 1):
        if name in newnum:
            continue  # 같은 그림을 두 번 넣은 경우 첫 자리의 번호를 쓴다
        path = os.path.join(FIG, name + '.svg')
        if not os.path.exists(path):
            print('  ! 없음:', name); continue
        svg = open(path, encoding='utf-8').read()
        m = TITLE.search(svg)
        if not m:
            print('  ? 번호 없는 제목:', name); continue
        newnum[name] = (label, n)
        old = int(m.group(3))
        if m.group(2) != label or old != n:
            changed += 1
            print(f'{name}: 그림 {m.group(2)}-{old} → 그림 {label}-{n}')
        if m.group(2) == label:
            if old in seen and seen[old] != n:
                ambiguous.add((label, old))
            seen[old] = n
    refmap[label] = seen
for label, old in sorted(ambiguous):
    print(f'  ! 옛 번호가 겹침: 그림 {label}-{old} — 본문 속 참조는 손으로 확인')
    refmap[label].pop(old, None)

def fix_refs(text):
    """본문 속 '그림 {표시번호}-{n}' 참조를 새 번호로 바꾼다. 바꾼 횟수도 돌려준다."""
    count = 0
    for label, mp in refmap.items():
        moved = {o: n for o, n in mp.items() if o != n}
        if not moved:
            continue
        pat = re.compile(r'(그림\s+' + re.escape(label) + r'-)(\d+)(?!\d)')
        def rep(m):
            nonlocal count
            o = int(m.group(2))
            if o in moved:
                count += 1
                return m.group(1) + str(moved[o])
            return m.group(0)
        text = pat.sub(rep, text)
    return text, count

refs = 0
targets = [p for p, _, _ in lessons] + sorted(glob.glob(os.path.join(FIG, '*.svg'))) + sorted(glob.glob(os.path.join(SIMS, '*.js')))
for path in targets:
    text = open(path, encoding='utf-8').read()
    name = os.path.basename(path)[:-4]
    if path.endswith('.svg'):
        # 제목은 그림 이름으로 정확히 고치고, 나머지 글(설명·이름표)은 참조로 고친다
        m = TITLE.search(text)
        if m:
            head, title, tail = text[:m.start()], m.group(0), text[m.end():]
            if name in newnum:
                title = f'{m.group(1)}그림 {newnum[name][0]}-{newnum[name][1]}'
            head, c1 = fix_refs(head); tail, c2 = fix_refs(tail)
            new, c = head + title + tail, c1 + c2
        else:
            new, c = fix_refs(text)
    else:
        new, c = fix_refs(text)
    if c:
        refs += c
        print(f'  참조 {c}곳: {os.path.relpath(path, ROOT)}')
    if write and new != text:
        open(path, 'w', encoding='utf-8').write(new)
# 단원의 표시 번호를 다 쓰지 않은 참조(예: "물질과 에너지 3" 단원에서 "그림 3-5")는 고칠 수 없으므로 알려 준다
for p, label, _ in lessons:
    text = open(p, encoding='utf-8').read()
    for m in re.finditer(r'그림\s+((?:[가-힣A-Za-z]+\s?)*\d+(?:-\d+)+)', text):
        if not m.group(1).startswith(label + '-'):
            print(f'  ? 표시 번호가 다른 참조: {os.path.relpath(p, ROOT)} — "그림 {m.group(1)}" (이 단원은 "그림 {label}-n")')
print(f'바꿀 그림 {changed}개, 본문 속 참조 {refs}곳' + (' (고침)' if write else ''))
