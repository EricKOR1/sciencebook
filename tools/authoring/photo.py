#!/usr/bin/env python3
"""사진·사실적 삽화를 사이트에 넣을 형태로 만드는 도구.

  python3 tools/authoring/photo.py prep <작업 그림.png> --out <폴더>/work.png [--crop x0,y0,x1,y1] [--width 960]
      원본을 자르고(원본 좌표) 너비를 맞춘 작업본을 만든다. 이 작업본을 Read 로 보고 좌표를 정한다.
  python3 tools/authoring/photo.py make <spec.json>
      작업본에 가림(영어 이름표 지우기)을 하고 docs/assets/photos/{name}.webp 와 {name}.json 을 쓴다.

spec.json (좌표는 모두 작업본 기준, 왼쪽 위가 0,0):
{
  "name": "m3-05-skin-receptors",                # 파일 이름 = 표식 <!-- photo:이름 -->. {단원 id}-{영문 설명}
  "work": "<폴더>/work.png",                      # prep 으로 만든 작업본 (GIF·WEBM 은 원본 파일을 그대로 적는다)
  "meta": "<폴더>/name.json",                     # commons.py get 이 만든 출처 기록
  "title": "피부 속의 감각 수용기",                 # 그림 아래 굵은 제목(번호 없이)
  "caption": "…",                                 # 설명 1~3문장: 무엇을 보아야 하는지
  "alt": "…",                                     # 화면을 못 보는 독자를 위한 묘사
  "author": "Blausen.com staff (2014)",           # 저작자 표시(짧게. 라이선스가 요구하는 이름)
  "changes": "영어 이름표를 지우고 한글 이름표를 붙임, 일부를 잘라 냄",   # 고친 것이 없으면 ""
  "covers": [[x, y, w, h], …],                    # 지울 영역(영어 글자). 둘레 색으로 칠한다. 색을 정하려면 [x, y, w, h, "#rrggbb"] (사각형마다) 또는 "fill": "#ffffff" (전체)
  "labels": [{"x": 206, "y": 160, "text": "자유 신경 말단", "anchor": "end"}, {"x": 206, "y": 183, "text": "통증·온도", "sub": true, "anchor": "end"}]
}
labels: x, y 는 글자의 기준점(y 는 글자 밑줄, 곧 글자 아래쪽 끝). anchor 는 start(기본)·middle·end. sub 는 작은 회색 둘째 줄. 글자는 화면에서 그림 위에 얹힌다(큰 글자 21px, 작은 글자 16.5px — 너비 960 기준).
이름표는 흰 바탕(또는 밝고 고른 바탕) 위에 놓는다. 그림 위에 직접 얹어야 하면 "plate": true 를 주어 흰 판을 깐다.
"""
import argparse, json, os, shutil, sys
from PIL import Image, ImageDraw, PngImagePlugin
PngImagePlugin.MAX_TEXT_CHUNK = 64 * 1024 * 1024      # 색 프로필이 큰 PNG 도 읽는다
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'assets', 'photos')

def prep(a):
    im = Image.open(a.src)
    if getattr(im, 'is_animated', False):
        sys.exit('움직이는 그림은 prep 하지 않는다(원본을 그대로 spec 의 work 에 적는다).')
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if a.crop:
        im = im.crop(tuple(int(v) for v in a.crop.split(',')))
    if im.width > a.width:
        im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
    im.info.pop('icc_profile', None)
    im.save(a.out)
    print(a.out, im.size)

def make(a):
    sp = json.load(open(a.spec, encoding='utf-8'))
    name = sp['name']
    meta = json.load(open(sp['meta'], encoding='utf-8'))
    if not meta.get('usable'):
        sys.exit('쓸 수 없는 라이선스: ' + str(meta.get('license')))
    for k in ('title', 'caption', 'alt', 'author'):
        if not sp.get(k):
            sys.exit(f'spec 에 {k} 가 없다')
    os.makedirs(OUT, exist_ok=True)
    src = sp['work']
    ext = os.path.splitext(src)[1].lower()
    if ext in ('.gif', '.webm'):
        size = os.path.getsize(src)
        if size > (1_600_000 if ext == '.gif' else 3_000_000):
            sys.exit(f'파일이 너무 크다({size} bytes). GIF 는 1.6 MB, WEBM 은 3 MB 이하만.')
        fn = name + ext
        shutil.copyfile(src, os.path.join(OUT, fn))
        if ext == '.gif':
            w, h = Image.open(src).size
        else:
            w, h = sp['w'], sp['h']          # 동영상은 spec 에 w, h 를 적는다
    else:
        im = Image.open(src)
        alpha = im.mode in ('RGBA', 'LA', 'P')
        im = im.convert('RGBA' if alpha else 'RGB')
        d = ImageDraw.Draw(im)
        for c in sp.get('covers', []):
            x, y, w, h = c[:4]
            fill = (c[4] if len(c) > 4 else None) or sp.get('fill')      # 사각형마다 색: [x, y, w, h, "#rrggbb"]
            if not fill:     # 둘레 네 모서리 바깥의 색을 평균해 칠한다
                pts = [(max(0, x - 2), max(0, y - 2)), (min(im.width - 1, x + w + 2), max(0, y - 2)), (max(0, x - 2), min(im.height - 1, y + h + 2)), (min(im.width - 1, x + w + 2), min(im.height - 1, y + h + 2))]
                px = [im.getpixel(p)[:3] for p in pts]
                fill = tuple(sum(v[i] for v in px) // 4 for i in range(3))
            d.rectangle([x, y, x + w, y + h], fill=fill)
        for l in sp.get('labels', []):
            if l.get('plate'):
                fs = 16.5 if l.get('sub') else 21
                tw = sum(fs * (0.95 if ord(ch) > 0x1100 else 0.55) for ch in l['text']) + 12
                x0 = l['x'] - (tw if l.get('anchor') == 'end' else tw / 2 if l.get('anchor') == 'middle' else 0) - (0 if l.get('anchor') == 'end' else 6) 
                d.rectangle([x0, l['y'] - fs, x0 + tw, l['y'] + fs * 0.32], fill=(255, 255, 255))
        fn = name + '.webp'
        im.save(os.path.join(OUT, fn), 'WEBP', quality=84, method=6)
        w, h = im.size
        size = os.path.getsize(os.path.join(OUT, fn))
        if size > 260_000:
            print(f'  ! 파일이 크다({size} bytes). 너비를 줄이거나 잘라 내는 것을 생각한다.')
    rec = {'file': fn, 'w': w, 'h': h, 'title': sp['title'], 'caption': sp['caption'], 'alt': sp['alt'], 'author': sp['author'],
           'license': meta['license'], 'license_url': meta.get('license_url', ''), 'source': meta['page'],
           **({'source_name': meta['source_name']} if meta.get('source_name') else {'commons_title': meta['title']}),
           'changes': sp.get('changes', ''), 'labels': [{k: v for k, v in l.items() if k != 'plate'} for l in sp.get('labels', [])]}
    json.dump(rec, open(os.path.join(OUT, name + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(os.path.join(OUT, fn), f'{w}×{h}', size, 'bytes |', meta['license'])

ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
p = sub.add_parser('prep'); p.add_argument('src'); p.add_argument('--out', required=True); p.add_argument('--crop'); p.add_argument('--width', type=int, default=960)
m = sub.add_parser('make'); m.add_argument('spec')
a = ap.parse_args()
prep(a) if a.cmd == 'prep' else make(a)
