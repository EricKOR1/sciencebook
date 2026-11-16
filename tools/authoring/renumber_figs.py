#!/usr/bin/env python3
"""그림 번호 맞추기: 원고에 나오는 순서대로 SVG <title>의 '그림 {표시번호}-{n}' 번호를 다시 매긴다.
사용: python3 tools/authoring/renumber_figs.py [--write]   (--write 가 없으면 바뀔 내용만 보여 준다)"""
import os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
FIG = os.path.join(ROOT, 'docs', 'assets', 'fig')
write = '--write' in sys.argv
changed = 0
for dp, dn, fs in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in ('.git', 'node_modules', 'docs', 'tools')]
    for f in sorted(fs):
        if not re.match(r'^[a-z0-9]+-\d+_.*\.md$', f):
            continue
        text = open(os.path.join(dp, f), encoding='utf-8').read()
        label = re.match(r'^# (.+?)\. ', text).group(1)
        names = re.findall(r'^<!--\s*fig:([\w-]+)\s*-->\s*$', text, flags=re.M)
        for n, name in enumerate(names, 1):
            path = os.path.join(FIG, name + '.svg')
            if not os.path.exists(path):
                print('  ! 없음:', name); continue
            svg = open(path, encoding='utf-8').read()
            m = re.search(r'(<title[^>]*>)\s*그림\s+([^<]+?)-(\d+)(?=[\s.:<])', svg)
            if not m:
                print('  ? 번호 없는 제목:', name, re.search(r'<title[^>]*>([^<]*)', svg).group(1)[:40] if '<title' in svg else '(title 없음)'); continue
            if m.group(2) != label or int(m.group(3)) != n:
                changed += 1
                print(f'{name}: 그림 {m.group(2)}-{m.group(3)} → 그림 {label}-{n}')
                if write:
                    svg = svg[:m.start()] + f'{m.group(1)}그림 {label}-{n}' + svg[m.end():]
                    open(path, 'w', encoding='utf-8').write(svg)
print(f'바꿀 그림 {changed}개' + (' (고침)' if write else ''))
