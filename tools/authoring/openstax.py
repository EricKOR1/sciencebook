#!/usr/bin/env python3
"""OpenStax 공개 교과서(자유 이용 CC BY 4.0 판)의 그림·사진을 찾아 쓰는 도구. 인터넷 요청이 없어 바로 끝난다.

  python3 tools/authoring/openstax.py search "plasma membrane" [--book biology] [--limit 30]
      그림의 영어 설명(alt·caption)·절 제목·그림 id 에서 낱말을 찾는다(낱말을 모두 포함하는 그림. 여러 낱말은 띄어 쓴다. "a|b" 는 a 또는 b).
      한 장의 그림을 모두 보려면: search "" --book "chemistry 2e" --chapter 17 --limit 80
  python3 tools/authoring/openstax.py show <그림 id>            # 한 그림의 전체 설명·출처·파일 경로
  python3 tools/authoring/openstax.py get <그림 id> --out <폴더>/name [--part 2]
      작업용 그림(name.png) + name.json(출처 기록, photo.py make 의 meta)을 만든다. 한 그림에 파일이 여럿이면 --part 로 고른다.
  python3 tools/authoring/openstax.py index                     # 색인 다시 만들기(책을 새로 받았을 때)

책 원본은 /home/user/openstax/osbooks-* 에 있고, 모두 라이선스가 CC BY 4.0 이던 마지막 판으로 맞춰 두었다
(OpenStax 는 2026년 3월부터 새 판을 CC BY-NC-SA 로 바꾸었다. 그 뒤 판의 자료는 쓰지 않는다).
캡션에 '허락을 받아 실음(permission)'·'©' 같은 말이 있는 그림은 자유 이용이 아닐 수 있어 ✗ 로 표시하고 get 을 거부한다.
"""
import argparse, glob, json, os, re, subprocess, sys
import xml.etree.ElementTree as ET
ROOT = '/home/user/openstax'
IDX = os.path.join(ROOT, 'figures.json')
NS = '{http://cnx.rice.edu/cnxml}'
COL = '{http://cnx.rice.edu/collxml}'
MD = '{http://cnx.rice.edu/mdml}'
SLUG = {'Biology 2e': 'biology-2e', 'Concepts of Biology': 'concepts-biology', 'Anatomy and Physiology 2e': 'anatomy-and-physiology-2e',
        'Chemistry 2e': 'chemistry-2e', 'Chemistry: Atoms First 2e': 'chemistry-atoms-first-2e', 'Astronomy 2e': 'astronomy-2e',
        'Microbiology': 'microbiology', 'College Physics 2e': 'college-physics-2e',
        'University Physics Volume 1': 'university-physics-volume-1', 'University Physics Volume 2': 'university-physics-volume-2',
        'University Physics Volume 3': 'university-physics-volume-3'}
BAD = re.compile(r'permission|©|\(c\)|copyright|all rights reserved|trademark|courtesy of', re.I)

def text(el):
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip() if el is not None else ''

def license_of(repo):
    try:
        return open(os.path.join(repo, 'LICENSE'), encoding='utf-8').readline().strip()
    except OSError:
        return ''

def build():
    figs = []
    for repo in sorted(glob.glob(os.path.join(ROOT, 'osbooks-*'))):
        lic = license_of(repo)
        if not lic.startswith('Attribution 4.0'):
            print(f'  ! {os.path.basename(repo)}: 라이선스가 CC BY 4.0 이 아니다({lic}). 건너뜀', file=sys.stderr); continue
        commit = subprocess.run(['git', '-C', repo, 'log', '-1', '--format=%h %ad', '--date=short'], capture_output=True, text=True).stdout.strip()
        where = {}       # module id → (book, chapter no, chapter title, section no)
        for cx in sorted(glob.glob(os.path.join(repo, 'collections', '*.xml'))):
            root = ET.parse(cx).getroot()
            book = text(root.find(f'.//{MD}title'))
            if book not in SLUG: continue           # AP 과정용처럼 겹치는 책은 뺀다
            ch = 0
            def walk(node, chapter):
                nonlocal ch
                for c in node:
                    if c.tag == f'{COL}subcollection':
                        title = text(c.find(f'{MD}title'))
                        content = c.find(f'{COL}content')
                        has_mod = any(x.tag == f'{COL}module' for x in content)
                        if has_mod:
                            ch += 1; sec = 0
                            for m in content:
                                if m.tag == f'{COL}module':
                                    where.setdefault(m.get('document'), (book, ch, title, sec)); sec += 1
                                elif m.tag == f'{COL}subcollection':
                                    walk([m], (ch, title))
                        else:
                            walk(content, None)
            walk(root.find(f'{COL}content'), None)
        for mp in sorted(glob.glob(os.path.join(repo, 'modules', '*', 'index.cnxml'))):
            mid = os.path.basename(os.path.dirname(mp))
            if mid not in where: continue
            book, ch, chtitle, sec = where[mid]
            try: root = ET.parse(mp).getroot()
            except ET.ParseError: continue
            mtitle = text(root.find(f'{NS}title'))
            for f in root.iter(f'{NS}figure'):
                imgs = [im.get('src') for im in f.iter(f'{NS}image') if im.get('src')]
                if not imgs: continue
                alt = ' / '.join(m.get('alt', '') for m in f.iter(f'{NS}media'))
                cap = ' '.join(text(c) for c in f.iter(f'{NS}caption'))
                files = [os.path.normpath(os.path.join(os.path.dirname(mp), s)) for s in imgs]
                files = [x for x in files if os.path.exists(x)]
                if not files: continue
                cred = re.findall(r'\((credit[^()]*(?:\([^()]*\)[^()]*)*)\)', cap)
                figs.append({'id': f'{SLUG[book]}:{f.get("id") or os.path.basename(files[0])}', 'book': book, 'chapter': ch, 'chapter_title': chtitle,
                             'section': f'{ch}.{sec}' if sec else f'{ch} 도입', 'module_title': mtitle, 'alt': alt, 'caption': cap,
                             'credit': '; '.join(cred), 'files': files, 'usable': not BAD.search(cap), 'commit': commit})
    json.dump(figs, open(IDX, 'w', encoding='utf-8'), ensure_ascii=False)
    print(len(figs), '개 그림 색인 →', IDX)

def load():
    if not os.path.exists(IDX): build()
    return json.load(open(IDX, encoding='utf-8'))

def find(fid):
    hit = [f for f in load() if f['id'] == fid] or [f for f in load() if f['id'].endswith(':' + fid)]
    if not hit: sys.exit('그런 그림 id 가 없다: ' + fid)
    return hit[0]

def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('search'); s.add_argument('q'); s.add_argument('--book', default=''); s.add_argument('--chapter', type=int); s.add_argument('--limit', type=int, default=30)
    sh = sub.add_parser('show'); sh.add_argument('id')
    g = sub.add_parser('get'); g.add_argument('id'); g.add_argument('--out', required=True); g.add_argument('--part', type=int, default=1); g.add_argument('--width', type=int, default=1280)
    sub.add_parser('index')
    a = ap.parse_args()
    if a.cmd == 'index': return build()
    if a.cmd == 'search':
        words = [w.lower().split('|') for w in a.q.split()]
        n = 0
        for f in load():
            if a.book and not f['book'].lower().startswith(a.book.lower()): continue      # 책 이름의 앞부분으로 고른다
            if a.chapter and f['chapter'] != a.chapter: continue
            hay = (f['id'] + ' ' + f['alt'] + ' ' + f['caption'] + ' ' + f['module_title'] + ' ' + f['chapter_title']).lower()
            if all(any(re.search(r'\b' + re.escape(alt), hay) for alt in w) for w in words):      # 낱말의 앞부분이 맞아야 한다(mica 가 chemical 에 걸리지 않게)
                n += 1
                if n > a.limit: continue
                print(('✓' if f['usable'] else '✗'), f['id'], f'| {f["book"]} {f["section"]} {f["module_title"]} | 파일 {len(f["files"])}개')
                print('    ', os.path.basename(f['files'][0]), '—', (f['alt'] or f['caption'])[:230])
                if f['credit']: print('     출처 표시:', f['credit'][:160])
        print(f'— {n}개 찾음' + (f' (처음 {a.limit}개만 보임. 낱말을 더 주거나 --limit 를 늘린다)' if n > a.limit else ''))
        return
    f = find(a.id)
    if a.cmd == 'show':
        print(json.dumps(f, ensure_ascii=False, indent=1)); return
    if not f['usable']: sys.exit('자유 이용인지 분명하지 않은 그림이다(캡션에 허락·저작권 표시). 쓰지 않는다.')
    from PIL import Image, PngImagePlugin
    PngImagePlugin.MAX_TEXT_CHUNK = 64 * 1024 * 1024
    src = f['files'][a.part - 1]
    im = Image.open(src)
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if im.width > a.width:
        im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    im.info.pop('icc_profile', None)      # 큰 색 프로필은 떼고 저장한다
    im.save(a.out + '.png')
    slug = SLUG[f['book']]
    # 원 저작자가 캡션에 있으면 그 표시를 저작자 칸에 쓴다(없으면 OpenStax). 책 이름은 source_name 으로 따로 나온다.
    author = (re.sub(r'^credit[^:]*:\s*', '', f['credit']) + ' (OpenStax 수록)') if f['credit'] else 'OpenStax'
    meta = {'title': f['id'], 'license': 'CC BY 4.0', 'license_url': 'https://creativecommons.org/licenses/by/4.0/', 'author': author,
            'page': f'https://openstax.org/details/books/{slug}', 'source_name': f'OpenStax 《{f["book"]}》 {f["section"]} {f["module_title"]}',
            'usable': True, 'alt_en': f['alt'], 'caption_en': f['caption'], 'file': src, 'commit': f['commit']}
    json.dump(meta, open(a.out + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(a.out + '.png', im.size, '|', meta['source_name'], '|', author[:120])

if __name__ == '__main__':
    import signal
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)      # | head 로 잘라도 오류가 나지 않게
    main()
