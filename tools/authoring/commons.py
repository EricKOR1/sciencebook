#!/usr/bin/env python3
"""위키미디어 공용(Wikimedia Commons)에서 자유 이용 그림·사진을 찾고 내려받는 도구.

  python3 tools/authoring/commons.py search "skin receptors" [--limit 12]      # 후보와 라이선스 보기
  python3 tools/authoring/commons.py info "File:Blausen 0809 Skin TactileReceptors.png"
  python3 tools/authoring/commons.py get  "File:….png" --width 960 --out <폴더>/name    # 작업용 그림(name.png/.gif/.webm) + name.json(출처 기록)

요청은 모든 담당이 한 줄로 서서 나간다(검색·정보는 6초, 파일은 25초 간격. 서버가 429 를 주면 더 오래 쉰다). 그래서 명령 하나가 수십 초~몇 분 걸릴 수 있다.
한 번에 여러 명령을 동시에 돌리지 말고, 검색어를 잘 골라 요청 수를 줄인다.

쓸 수 있는 라이선스만 통과시킨다: 퍼블릭 도메인(PD, CC0), CC BY, CC BY-SA. (NC·ND, 공정 이용, 라이선스 불명은 쓰지 않는다.)
"""
import argparse, html, json, os, re, sys, time, urllib.parse, urllib.request
API = 'https://commons.wikimedia.org/w/api.php'
UA = 'HanGwonScienceBook/1.0 (https://erickor1.github.io/sciencebook/; open educational textbook) python-urllib'
OK = re.compile(r'^(pd|cc0|cc-zero|public domain|cc[- ]by(-sa)?[- ]\d|cc by(-sa)? \d|cc-by(-sa)?-\d)', re.I)

# 위키미디어는 이름을 밝히지 않은 자동 요청을 엄격히 제한한다(429). 그래서 모든 담당의 요청을 잠금 파일로 한 줄로 세우고,
# 검색·정보 요청은 GAP_API 초, 파일 내려받기는 GAP_FILE 초 간격을 지킨다. 서버가 Retry-After 를 주면 그만큼 더 쉰다.
GAP_API, GAP_FILE = 2.0, 4.0
LOCK = '/tmp/claude-0/-home-user-sciencebook/96b7e817-0e5e-5324-8416-180ac4e267af/scratchpad/commons.lock'

def fetch(url, tries=8):
    import fcntl
    os.makedirs(os.path.dirname(LOCK), exist_ok=True)
    gap = GAP_FILE if 'upload.wikimedia.org' in url else GAP_API
    for n in range(tries):
        with open(LOCK, 'a+') as lk:
            fcntl.flock(lk, fcntl.LOCK_EX)
            lk.seek(0)
            try: ready = float(lk.read().strip() or 0)
            except ValueError: ready = 0
            wait = ready - time.time()
            if wait > 0: time.sleep(min(wait, 900))
            err, penalty = None, gap
            try:
                req = urllib.request.Request(url, headers={'User-Agent': UA})
                data = urllib.request.urlopen(req, timeout=90).read()
            except Exception as e:
                err = e
                ra = None
                try: ra = float(e.headers.get('retry-after'))
                except Exception: pass
                penalty = (ra + 10 if ra else [30, 60, 120, 180, 240, 300, 300][min(n, 6)]) + gap
            lk.seek(0); lk.truncate(); lk.write(str(time.time() + penalty)); lk.flush()
        if err is None:
            return data
        if n == tries - 1 or '404' in str(err) or '403' in str(err):
            raise err
        print(f'  … 서버가 잠시 쉬라고 함({str(err)[:40]}), {penalty:.0f}초 뒤 다시', file=sys.stderr)

def call(params):
    return json.loads(fetch(API + '?' + urllib.parse.urlencode({**params, 'format': 'json'})))

def strip(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s or ''))).strip()

def info(titles, width=None):
    p = {'action': 'query', 'titles': '|'.join(titles), 'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata'}
    if width: p['iiurlwidth'] = width
    out = []
    for pg in call(p)['query']['pages'].values():
        ii = (pg.get('imageinfo') or [None])[0]
        if not ii: continue
        m = ii.get('extmetadata', {})
        g = lambda k: strip(m.get(k, {}).get('value', ''))
        lic = g('LicenseShortName')
        out.append({'title': pg['title'], 'license': lic, 'license_url': g('LicenseUrl'), 'author': g('Artist')[:160], 'credit': g('Credit')[:160],
                    'desc': g('ImageDescription')[:200], 'w': ii.get('width'), 'h': ii.get('height'), 'mime': ii.get('mime'),
                    'url': ii.get('url'), 'thumb': ii.get('thumburl'), 'page': ii.get('descriptionurl'),
                    'usable': bool(OK.match(lic)) and 'nc' not in lic.lower().split('-') and 'nd' not in lic.lower().split('-')})
    return out

def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('search'); s.add_argument('q'); s.add_argument('--limit', type=int, default=12)
    i = sub.add_parser('info'); i.add_argument('title', nargs='+')
    g = sub.add_parser('get'); g.add_argument('title'); g.add_argument('--width', type=int, default=960); g.add_argument('--out', required=True)
    a = ap.parse_args()
    if a.cmd == 'search':
        r = call({'action': 'query', 'list': 'search', 'srsearch': a.q, 'srnamespace': 6, 'srlimit': a.limit})
        titles = [x['title'] for x in r['query']['search']]
        for it in (info(titles) if titles else []):
            print(('✓' if it['usable'] else '✗'), it['title'], '|', it['license'], '|', f"{it['w']}×{it['h']}", it['mime'], '|', it['author'][:50], '|', it['desc'][:90])
    elif a.cmd == 'info':
        for it in info(a.title): print(json.dumps(it, ensure_ascii=False, indent=1))
    else:
        it = info([a.title])[0]
        if not it['usable']: sys.exit('쓸 수 없는 라이선스: ' + it['license'])
        # 원본을 통째로 받으면 서버에 부담을 주므로 표준 크기 축소본(960·1280·1920)을 받는다.
        # 축소본 주소: …/commons/thumb/{a}/{ab}/{파일}/{크기}px-{파일}(SVG·TIFF 등은 뒤에 .png/.jpg)
        from PIL import Image
        import io
        std = min([w for w in (960, 1280, 1920) if w >= a.width] or [1920])
        base = it['url'].split('?')[0]
        fname = base.rsplit('/', 1)[1]
        low = fname.lower()
        suffix = '.png' if low.endswith('.svg') else ('.jpg' if low.endswith(('.tif', '.tiff', '.pdf', '.djvu')) else '')
        thumb = base.replace('/commons/', '/commons/thumb/', 1) + f'/{std}px-{fname}{suffix}'
        animated = low.endswith(('.gif', '.webm', '.ogv'))
        if animated or (it['w'] and it['w'] <= std):
            data = fetch(base)                      # 움직이는 그림과 작은 그림은 원본
        else:
            try: data = fetch(thumb)
            except Exception: data = fetch(base)
        if low.endswith(('.webm', '.ogv')):
            ext = os.path.splitext(low)[1]
            open(a.out + ext, 'wb').write(data)
            json.dump(it, open(a.out + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            print(a.out + ext, len(data), 'bytes |', it['license'], '|', it['author'][:60]); return
        im = Image.open(io.BytesIO(data))
        if getattr(im, 'is_animated', False):
            ext = '.gif'
            open(a.out + ext, 'wb').write(data)          # 움직이는 그림(GIF)은 그대로 둔다
        else:
            if im.width > a.width:
                im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
            alpha = im.mode in ('RGBA', 'LA', 'P')
            ext = '.png'
            im.convert('RGBA' if alpha else 'RGB').save(a.out + ext, 'PNG')      # 작업용 원본(가공은 photo.py 로)
        it['saved_width'], it['saved_height'] = im.size
        json.dump(it, open(a.out + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(a.out + ext, os.path.getsize(a.out + ext), 'bytes', im.size, '|', it['license'], '|', it['author'][:60])
if __name__ == '__main__':
    main()
