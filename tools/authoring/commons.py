#!/usr/bin/env python3
"""위키미디어 공용(Wikimedia Commons)에서 자유 이용 그림·사진을 찾고 내려받는 도구.

  python3 tools/authoring/commons.py search "skin receptors" [--limit 12]      # 후보와 라이선스 보기
  python3 tools/authoring/commons.py info "File:Blausen 0809 Skin TactileReceptors.png"
  python3 tools/authoring/commons.py get  "File:….png" --width 1100 --out <폴더>/name   # 축소본 + name.json(출처 기록)

쓸 수 있는 라이선스만 통과시킨다: 퍼블릭 도메인(PD, CC0), CC BY, CC BY-SA. (NC·ND, 공정 이용, 라이선스 불명은 쓰지 않는다.)
"""
import argparse, html, json, os, re, sys, time, urllib.parse, urllib.request
API = 'https://commons.wikimedia.org/w/api.php'
UA = 'ScienceTextbookSiteBuilder/1.0 (static educational site builder)'
OK = re.compile(r'^(pd|cc0|cc-zero|public domain|cc[- ]by(-sa)?[- ]\d|cc by(-sa)? \d|cc-by(-sa)?-\d)', re.I)

def fetch(url, tries=6):
    """요청 사이에 쉬고, 429(요청이 너무 잦음)면 점점 길게 기다렸다 다시 한다."""
    for n in range(tries):
        try:
            time.sleep(1.2)
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            return urllib.request.urlopen(req, timeout=60).read()
        except Exception as e:
            if n == tries - 1: raise
            time.sleep([5, 15, 30, 60, 90][min(n, 4)])

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
    g = sub.add_parser('get'); g.add_argument('title'); g.add_argument('--width', type=int, default=1100); g.add_argument('--out', required=True)
    a = ap.parse_args()
    if a.cmd == 'search':
        r = call({'action': 'query', 'list': 'search', 'srsearch': a.q, 'srnamespace': 6, 'srlimit': a.limit})
        titles = [x['title'] for x in r['query']['search']]
        for it in (info(titles) if titles else []):
            print(('✓' if it['usable'] else '✗'), it['title'], '|', it['license'], '|', f"{it['w']}×{it['h']}", it['mime'], '|', it['author'][:50], '|', it['desc'][:90])
    elif a.cmd == 'info':
        for it in info(a.title): print(json.dumps(it, ensure_ascii=False, indent=1))
    else:
        it = info([a.title], a.width)[0]
        if not it['usable']: sys.exit('쓸 수 없는 라이선스: ' + it['license'])
        # 축소본 서버(thumb.wikimedia.org)는 막혀 있을 수 있으므로 원본을 받아 여기서 줄인다.
        from PIL import Image
        import io
        data = fetch(it['url'])
        im = Image.open(io.BytesIO(data))
        if getattr(im, 'is_animated', False):
            ext = os.path.splitext(urllib.parse.urlparse(it['url']).path)[1].lower()
            open(a.out + ext, 'wb').write(data)          # 움직이는 그림(GIF)은 그대로 둔다
        else:
            if im.width > a.width:
                im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
            alpha = im.mode in ('RGBA', 'LA', 'P')
            ext = '.webp'
            im.convert('RGBA' if alpha else 'RGB').save(a.out + ext, 'WEBP', quality=82, method=6)
        it['saved_width'], it['saved_height'] = im.size
        json.dump(it, open(a.out + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(a.out + ext, os.path.getsize(a.out + ext), 'bytes', im.size, '|', it['license'], '|', it['author'][:60])
if __name__ == '__main__':
    main()
