// 「한 권으로 잇는 과학」 Markdown → HTML 빌드 스크립트
// 사용: cd tools && npm install && node build.mjs          (전체)
//       node build.mjs m1-03 3-4                           (그 단원만 다시 만들기)
//
// - 책의 구성(학교급 → 학년·과목 → 단원)은 tools/book.json 에 적혀 있다.
// - 단원 원고는 "{단원 id}_{제목}.md" (예: m1-03_열.md, phy-1_힘과_에너지.md, 3-4_운동량과_충격량.md)
// - 수식($…$, $$…$$)은 KaTeX로, mermaid 도표는 SVG로 미리 그려 넣는다(인터넷 없이도 보임).
// - 원고 안의 HTML 주석 표식
//     <!-- prev: m1-05, m3-04 -->  이 단원보다 먼저 배우는 관련 단원 id  (개념 연결 상자에 표시)
//     <!-- next: phy-1 -->         이 단원에서 이어지는 관련 단원 id
//     <!-- fig:이름 -->            docs/assets/fig/이름.svg 그림
//     <!-- sim:이름 -->            docs/assets/js/sims/이름.js 인터랙티브 시뮬레이션
//     <!-- photo:이름 -->          docs/assets/photos/이름.json 에 등록된 사진·사실적 삽화(자유 이용 자료, 출처 표시)
import fs0 from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import katex from 'katex';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'docs');
const ASSETS = path.join(OUT, 'assets');
const CACHE = path.join(HERE, '.cache');
const CHROME = process.env.CHROME_PATH || (fs0.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'book.json'), 'utf8'));
const BOOK = CFG.title;
const EXTRA = CFG.extra;
const STRANDS = CFG.strands;
const ID_RE = /^([a-z0-9]+-\d+)_.*\.md$/;

// ───────────────────────── 원고 목록 ─────────────────────────
const natural = (a, b) => a.localeCompare(b, 'en', { numeric: true });
const WANT = new Set(process.argv.slice(2));
const lessons = [];
for (const g of CFG.groups) {
  for (const part of g.parts) {
    const units = part.units || [{ name: '', dir: part.dir }];
    for (const u of units) {
      const dir = path.join(ROOT, u.dir);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((x) => ID_RE.test(x)).sort(natural)) {
        const src = path.join(u.dir, f);
        const md = fs.readFileSync(path.join(ROOT, src), 'utf8');
        const id = f.match(ID_RE)[1];
        if (part.draft && !WANT.has(id)) continue;   // 아직 만드는 중인 과목: 그 단원을 지정해 빌드할 때만 넣는다
        const h1 = md.match(/^# (.+?)\. (.+?)(?: — (.+))?$/m);
        if (!h1) { console.warn(`  ! 제목 줄 형식 오류: ${src}`); continue; }
        const meta = (key) => [...md.matchAll(new RegExp(`<!--\\s*${key}:\\s*([^>]*?)\\s*-->`, 'g'))]
          .flatMap((m) => m[1].split(/[,\s]+/)).filter(Boolean);
        lessons.push({ id, label: h1[1].trim(), title: h1[2].trim(), sub: (h1[3] || '').trim(), group: g, part, unit: u, src, out: `${id}.html`, md,
          strand: CFG.lessonStrands[id] || part.strand || 'society', prev: new Set(meta('prev')), next: new Set(meta('next')) });
      }
    }
  }
}
const byId = new Map(lessons.map((l) => [l.id, l]));
const order = new Map(lessons.map((l, i) => [l.id, i]));

// 통합과학 단원: STEP 1의 중학교 성취기준 코드([9과05-01] 등)에서 '먼저 배운 단원'을 자동으로 찾는다
const midId = (n) => (n <= 7 ? `m1-0${n}` : n <= 15 ? `m2-0${n - 7}` : `m3-0${n - 15}`);
for (const l of lessons) {
  if (l.group.id !== 'common') continue;
  const a = l.md.indexOf('## STEP 1.'), b = l.md.indexOf('## STEP 2.');
  if (a < 0 || b < 0) continue;
  for (const m of l.md.slice(a, b).matchAll(/9과(\d\d)-\d\d/g)) l.prev.add(midId(+m[1]));
}
// 연결은 양방향으로 맞춘다: A가 next로 B를 가리키면 B의 prev에 A가 들어간다. 없는 단원은 뺀다.
for (const l of lessons) {
  for (const p of [...l.prev]) { const o = byId.get(p); if (!o || o === l) l.prev.delete(p); else o.next.add(l.id); }
  for (const n of [...l.next]) { const o = byId.get(n); if (!o || o === l) l.next.delete(n); else o.prev.add(l.id); }
}
for (const l of lessons) {
  // 책 순서상 뒤에 있는 단원이 prev에 있거나 앞 단원이 next에 있으면 자리를 바꾼다
  for (const p of [...l.prev]) if (order.get(p) > order.get(l.id)) { l.prev.delete(p); l.next.add(p); }
  for (const n of [...l.next]) if (order.get(n) < order.get(l.id)) { l.next.delete(n); l.prev.add(n); }
  l.prevList = [...l.prev].map((x) => byId.get(x)).sort((x, y) => order.get(x.id) - order.get(y.id));
  l.nextList = [...l.next].map((x) => byId.get(x)).sort((x, y) => order.get(x.id) - order.get(y.id));
}

// md 경로 → html 파일명 (본문 속 상대 링크 변환용)
const LINKMAP = new Map();
for (const l of lessons) LINKMAP.set(path.basename(l.src), l.out);
for (const e of EXTRA) LINKMAP.set(path.basename(e.src), e.out);
LINKMAP.set('README.md', 'index.html');
LINKMAP.set('핵심_용어_사전.md', 'glossary.html');

// ───────────────────────── 보조 자료 ─────────────────────────
// 사진·사실적 삽화의 정보: docs/assets/photos/{이름}.json (그림마다 하나)
const photos = {};
if (fs.existsSync(path.join(ASSETS, 'photos'))) {
  for (const f of fs.readdirSync(path.join(ASSETS, 'photos')).filter((x) => x.endsWith('.json')).sort()) {
    try { photos[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(ASSETS, 'photos', f), 'utf8')); }
    catch (e) { console.warn(`  ! 사진 정보 읽기 실패: ${f}`); }
  }
}
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 사진·사실적 삽화(자유 이용 자료). photos.json 의 한 항목:
//   { file, w, h, title, caption, alt, author, license, license_url, source, source_name, changes, labels: [{x, y, text, anchor, sub}] }
//   source_name 은 출처 링크에 쓸 이름(없으면 Wikimedia Commons). 예: 'OpenStax 《Biology 2e》 그림 4.8'
// labels 는 그림 위에 얹는 한글 이름표(좌표는 그림의 w×h 기준).
const photoCredit = (p) => {
  // 사진판(여러 장 모음)은 출처가 같은 것끼리 묶어 한 번만 적는다.
  const link = (e) => (e.source ? `<a href="${escapeHtml(e.source)}" rel="noopener">${escapeHtml(e.source_name || 'Wikimedia Commons')}</a>` : '');
  const lic = (e) => (e.license ? (e.license_url ? `<a href="${escapeHtml(e.license_url)}" rel="noopener">${escapeHtml(e.license)}</a>` : escapeHtml(e.license)) : '');
  const plain = (e) => !e.author || (/^OpenStax( \(Rice University\))?$/.test(e.author) && /^OpenStax/.test(e.source_name || ''));
  const base = (a) => a.replace(/\s*\(OpenStax[^)]*\)\s*$/, '').trim();
  const groups = [];
  for (const e of [p, ...(p.more || [])]) {
    const key = `${e.source}|${e.source_name}|${e.license}`;
    let g = groups.find((x) => x.key === key);
    if (!g) { g = { key, e, authors: [] }; groups.push(g); }
    if (!plain(e) && !g.authors.some((a) => a.includes(base(e.author))) && !(p.author || '').includes(base(e.author)) || e === p && !plain(e)) g.authors.push(e.author);
  }
  const parts = groups.map((g) => [g.authors.map(escapeHtml).join(', '), link(g.e), lic(g.e)].filter(Boolean).join(', '));
  return `출처: ${parts.join(' / ')}${p.changes ? ` · ${escapeHtml(p.changes)}` : ''}`;
};
function photoFigure(name, p) {
  const labels = (p.labels || []).map((l) => `<text x="${l.x}" y="${l.y}" text-anchor="${l.anchor || 'start'}" class="${l.sub ? 'pl-sub' : 'pl-main'}">${escapeHtml(l.text)}</text>`).join('');
  const overlay = labels ? `<svg class="photo-labels" viewBox="0 0 ${p.w} ${p.h}" aria-hidden="true">${labels}</svg>` : '';
  const anim = /\.(gif|webm|mp4)$/i.test(p.file);
  const media = /\.(webm|mp4)$/i.test(p.file)
    ? `<video src="assets/photos/${p.file}" width="${p.w}" height="${p.h}" controls loop muted playsinline preload="metadata" aria-label="${escapeHtml(p.alt || p.title)}"></video>`
    : `<img src="assets/photos/${p.file}" width="${p.w}" height="${p.h}" alt="${escapeHtml(p.alt || p.title)}" loading="lazy">`;
  return `<figure class="photo${labels ? ' labeled' : ''}${anim ? ' anim' : ''}${p.w <= 560 ? ' small' : ''}${p.h > p.w * 1.1 ? ' tall' : ''}" id="photo-${name}"><div class="photo-art"><div class="photo-stack">${media}${overlay}</div></div>`
    + `<figcaption><b>${escapeHtml(p.title)}</b>${p.caption ? ` ${escapeHtml(p.caption)}` : ''} <span class="credit">${photoCredit(p)}</span></figcaption></figure>`;
}
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'sec';
const stripEmoji = (s) => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();

// ───────────────────────── mermaid → SVG ─────────────────────────
const MM_VARS = { '#a1a1a1': 'var(--mm-node)', '#a2a2a2': 'var(--mm-border)', '#a3a3a3': 'var(--mm-text)', '#a4a4a4': 'var(--mm-line)',
  '#a5a5a5': 'var(--mm-node2)', '#a6a6a6': 'var(--mm-group)', '#a7a7a7': 'var(--mm-label)' };
const MM_CFG = { theme: 'base', flowchart: { htmlLabels: true, curve: 'basis', padding: 12 },
  themeVariables: { primaryColor: '#a1a1a1', primaryBorderColor: '#a2a2a2', primaryTextColor: '#a3a3a3', lineColor: '#a4a4a4',
    secondaryColor: '#a5a5a5', tertiaryColor: '#a6a6a6', edgeLabelBackground: '#a7a7a7', fontFamily: 'inherit', fontSize: '15px' } };
let browser = null;
async function mermaidSvg(def, uid) {
  // 가로로 너무 긴 도표는 본문 폭에서 글자가 작아지므로 세로 방향으로 다시 그린다
  let svg = await mermaidRaw(def);
  let w = +((svg.match(/viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+)/) || [])[1] || 0);
  if (w > 860 && /^\s*(flowchart|graph)\s+LR/.test(def)) {
    svg = await mermaidRaw(def.replace(/^(\s*(?:flowchart|graph)\s+)LR/, '$1TB'));
    w = +((svg.match(/viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+)/) || [])[1] || 0);
  }
  for (const [k, v] of Object.entries(MM_VARS)) svg = svg.split(k).join(v).split(k.toUpperCase()).join(v);
  svg = svg.replace(/<\?xml[^>]*>/, '').replace(/MMID/g, `mm-${uid}`)
    .replace(/(<svg[^>]*?)\sstyle="[^"]*"/, '$1').replace(/(<svg[^>]*?)\swidth="[^"]*"/, '$1')
    .replace(/<svg /, `<svg style="width:${Math.round(w)}px" `);
  return `<figure class="diagram" role="img"><div class="diagram-scroll">${svg}</div></figure>`;
}
async function mermaidRaw(def) {
  fs.mkdirSync(CACHE, { recursive: true });
  const key = crypto.createHash('sha1').update(JSON.stringify(MM_CFG) + def).digest('hex').slice(0, 16);
  const file = path.join(CACHE, `mm-${key}.svg`);
  let svg;
  if (fs.existsSync(file)) svg = fs.readFileSync(file, 'utf8');
  else {
    if (!browser) {
      const puppeteer = (await import('puppeteer')).default;
      browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    }
    const { renderMermaid } = await import('@mermaid-js/mermaid-cli');
    const { data } = await renderMermaid(browser, def, 'svg', { backgroundColor: 'transparent', mermaidConfig: MM_CFG, svgId: 'MMID' });
    svg = Buffer.from(data).toString('utf8');
    fs.writeFileSync(file, svg);
  }
  return svg;
}

// ───────────────────────── Markdown 변환 ─────────────────────────
const CALLOUT = { NOTE: '참고', TIP: '도움말', IMPORTANT: '핵심', WARNING: '주의', CAUTION: '심화 · 평가 범위 밖' };
function protectMath(md, store) {
  // 코드 블록·코드 스팬은 건드리지 않고 수식만 자리표시자로 바꾼다.
  const parts = md.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  return parts.map((p, i) => {
    if (i % 2) return p;
    p = p.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => { store.push({ tex, display: true }); return `@@MATH${store.length - 1}@@`; });
    p = p.replace(/(^|[^\\$])\$([^\s$](?:[^$\n]*?[^\s$\\])?)\$(?!\d)/g, (_, pre, tex) => { store.push({ tex, display: false }); return `${pre}@@MATH${store.length - 1}@@`; });
    return p;
  }).join('');
}
// 한 덩어리 \mathrm{…}로 쓴 긴 화학 반응식은 휴대폰 화면에서 줄이 바뀌지 못해 옆으로 넘친다.
// 맨 바깥 수준의 +, 화살표에서 덩어리를 나눠 KaTeX가 그 자리에서 줄을 바꿀 수 있게 한다(글 속 수식에만 적용).
function splitChem(tex) {
  const t = tex.trim();
  if (t.length < 28 || !t.startsWith('\\mathrm{')) return tex;
  let depth = 0, end = -1;
  for (let i = 7; i < t.length; i++) {
    const c = t[i];
    if (c === '\\') { i++; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end !== t.length - 1) return tex;
  const inner = t.slice(8, end);
  const parts = [];
  let cur = '';
  depth = 0;
  const OPS = ['\\rightleftharpoons', '\\longrightarrow', '\\rightarrow', '\\to'];
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (depth === 0) {
      const op = OPS.find((o) => inner.startsWith(o, i) && !/[a-zA-Z]/.test(inner[i + o.length] || ''));
      if (op) { parts.push(cur, op); cur = ''; i += op.length - 1; continue; }
      if (c === '+' && inner[i - 1] === ' ' && inner[i + 1] === ' ') { parts.push(cur, '+'); cur = ''; continue; }
    }
    if (c === '\\') { cur += c + (inner[i + 1] || ''); i++; continue; }
    if (c === '{') depth++; else if (c === '}') depth--;
    cur += c;
  }
  parts.push(cur);
  if (parts.length < 3) return tex;
  return parts.map((x, i) => (i % 2 ? ` ${x} ` : (x.trim() ? `\\mathrm{${x.trim()}}` : ''))).join('');
}
function renderMath(m) {
  // KaTeX는 가운뎃점(·)을 처리하지 못하므로 \cdot 으로 바꾼다(\text{…} 안에서는 잠시 밖으로 꺼낸다)
  const tex = (m.display ? m.tex : splitChem(m.tex)).replace(/\\text\{([^{}]*)\}/g, (all, inner) => `\\text{${inner.replace(/·/g, '}\\cdot\\text{')}}`).replace(/·/g, '\\cdot ').replace(/µ/g, 'μ')
    // 핵종 표기처럼 간격 명령 바로 뒤에 위·아래 첨자가 오면(\, ^{4}_{2}He) KaTeX가 처리하지 못하므로 빈 묶음을 끼운다
    .replace(/(\\[,;:!]|\\quad|\\qquad)\s*(?=[\^_])/g, '$1{}')
    // KaTeX 기본 글꼴에 없는 기호는 \text 로 감싸 본문 글꼴로 보여 준다
    .replace(/(?<!\\text\{[^{}]*)([℃‰ⅠⅡⅢⅣⅤ])/g, '\\text{$1}');
  try {
    return katex.renderToString(tex, { displayMode: m.display, throwOnError: true, output: 'html', strict: 'ignore', trust: false });
  } catch (e) {
    console.warn('  ! 수식 오류:', m.tex.slice(0, 60), '→', e.message.split('\n')[0]);
    return `<code class="math-error">${escapeHtml(m.tex)}</code>`;
  }
}

async function convert(md, ctx) {
  const math = [];
  const mermaids = [];
  const toc = [];
  const used = new Set(ctx.knownIds || []);
  const uniq = (s) => { let id = s, k = 2; while (used.has(id)) id = `${s}-${k++}`; used.add(id); return id; };
  md = protectMath(md, math);

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(text, level) {
        if (level === 1) return '';
        let label = stripEmoji(text);
        let cls = '';
        const step = label.match(/^STEP (\d)\.\s*(.+)$/);
        if (step) { label = `<span class="step-badge s${step[1]}">STEP ${step[1]}</span><span class="h-text">${step[2]}</span>`; cls = ` class="step-h s${step[1]}"`; }
        // '바로 확인'(개념 직후의 짧은 확인 문항)과 문제 난이도 표시
        if (level === 4 && /바로 확인$/.test(label)) { label = '<span class="qc-badge">바로 확인</span><span class="qc-note">방금 읽은 내용, 바로 점검하기</span>'; cls = ' class="quick-h"'; }
        const stars = level === 3 ? { 기본: 1, 응용: 2, '융합·서술형': 2, '실력 다지기': 2, 도전: 3 }[label] : 0;
        if (stars) label += `<span class="level" title="난이도"><span class="sr">난이도 ${stars}단계(3단계 중) </span>${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></span>`;
        const id = uniq(slug(step ? `step-${step[1]}` : stripEmoji(text)));
        if (level === 2) toc.push({ id, text: stripEmoji(text), step: step ? +step[1] : 0 });
        return `<h${level} id="${id}"${cls}>${label}</h${level}>\n`;
      },
      code(code, lang) {
        if (lang === 'mermaid') { mermaids.push(code); return `@@MERMAID${mermaids.length - 1}@@`; }
        return `<pre class="code"><code>${escapeHtml(code)}</code></pre>`;
      },
      table(header, body) { return `<div class="table-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`; },
      blockquote(quote) {
        const m = quote.match(/^\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br>)?\s*/);
        if (!m) return `<blockquote>${quote}</blockquote>\n`;
        const kind = m[1].toLowerCase();
        let inner = '<p>' + quote.slice(m[0].length);
        inner = inner.replace(/^<p>\s*<\/p>/, '');
        return `<aside class="callout ${kind}"><p class="callout-title">${CALLOUT[m[1]]}</p>${inner}</aside>\n`;
      },
      link(href, title, text) {
        if (href && !/^(https?:|#|mailto:)/.test(href)) {
          const [p, hash] = href.split('#');
          const mapped = LINKMAP.get(path.basename(decodeURIComponent(p)));
          if (mapped) href = mapped + (hash ? `#${hash}` : '');
        }
        const ext = /^https?:/.test(href);
        return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
      },
    },
  });

  let html = marked.parse(md);
  // 수식 복원
  html = html.replace(/@@MATH(\d+)@@/g, (_, i) => renderMath(math[+i]));
  // mermaid 복원 (문단으로 감싸진 경우 포함)
  for (let i = 0; i < mermaids.length; i++) {
    const svg = await mermaidSvg(mermaids[i], `${ctx.id}-${i}`);
    html = html.replace(new RegExp(`(<p>)?@@MERMAID${i}@@(</p>)?`), () => svg);
  }
  // 정답 접기 꾸미기
  html = html.replace(/<details>\s*<summary>([^<]*)<\/summary>/g, '<details class="answer"><summary><span>$1</span></summary><div class="answer-body">')
    .replace(/<\/details>/g, '</div></details>');
  // 그림·사진·애니메이션 표식
  const sims = new Set();
  html = html.replace(/<!--\s*(fig|photo|sim):([\w-]+)\s*-->/g, (all, kind, name) => {
    if (kind === 'fig') {
      const f = path.join(ASSETS, 'fig', `${name}.svg`);
      if (!fs.existsSync(f)) { console.warn(`  ! 그림 없음: ${name}`); return ''; }
      const raw = fs.readFileSync(f, 'utf8').replace(/<\?xml[^>]*>/, '');
      const cap = (raw.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '';
      const desc = (raw.match(/<desc[^>]*>([^<]*)<\/desc>/) || [])[1] || '';
      return `<figure class="fig" id="fig-${name}"><div class="fig-art">${raw}</div>${cap ? `<figcaption><b>${cap}</b>${desc ? ` ${desc}` : ''}</figcaption>` : ''}</figure>`;
    }
    if (kind === 'photo') {
      const p = photos[name];
      if (!p || !fs.existsSync(path.join(ASSETS, 'photos', p.file))) { console.warn(`  ! 사진 없음: ${name}`); return ''; }
      (ctx.photos = ctx.photos || []).push(name);
      return photoFigure(name, p);
    }
    const js = path.join(ASSETS, 'js', 'sims', `${name}.js`);
    if (!fs.existsSync(js)) { console.warn(`  ! 애니메이션 없음: ${name}`); return ''; }
    sims.add(name);
    return `<figure class="sim" id="sim-${name}" data-sim="${name}"><noscript>이 애니메이션은 자바스크립트가 필요하다.</noscript></figure>`;
  });
  return { html, toc, sims: [...sims] };
}

// ───────────────────────── 페이지 틀 ─────────────────────────
const FONTS = 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap';
const FINDERS = [
  { id: 'map', out: 'map.html', title: '개념 연계 지도' },
  { id: 'glossary', out: 'glossary.html', title: '핵심 용어 사전' },
  { id: 'sims', out: 'sims.html', title: '시뮬레이션 모아 보기' },
  ...(Object.keys(photos).length ? [{ id: 'credits', out: 'credits.html', title: '사진·삽화 출처' }] : []),
];
const partLessons = (part) => lessons.filter((l) => l.part === part);
// 과목 이름이 붙은 번호("일반물리학 3")는 그 과목 목록 안에서는 숫자만 보여 준다
const shortLabel = (l) => (l.label.startsWith(l.part.name + ' ') ? l.label.slice(l.part.name.length + 1) : l.label);
const navItem = (l, current) => `<li><a href="${l.out}" data-id="${l.id}"${l.id === current ? ' aria-current="page"' : ''}><span class="nav-id">${escapeHtml(shortLabel(l))}</span>${escapeHtml(l.title)}</a></li>`;

function navTree(current) {
  const cur = byId.get(current);
  let s = '<nav class="book-nav" aria-label="교재 목차"><a class="nav-home" href="index.html">처음으로 · 전체 목차</a>'
    + '<input class="nav-filter" id="nav-filter" type="search" placeholder="단원 이름으로 찾기" aria-label="단원 이름으로 찾기" autocomplete="off">';
  for (const g of CFG.groups) {
    const parts = g.parts.filter((p) => partLessons(p).length);
    if (!parts.length) continue;
    s += `<p class="nav-group">${g.name}</p>`;
    for (const p of parts) {
      s += `<details class="nav-part"${cur && cur.part === p ? ' open' : ''}><summary>${p.name}<span class="nav-count">${partLessons(p).length}</span></summary>`;
      const units = p.units || [{ name: '' }];
      for (const u of units) {
        const ls = partLessons(p).filter((l) => !p.units || l.unit === u);
        if (!ls.length) continue;
        if (u.name) s += `<p class="nav-unit">${u.name}</p>`;
        s += `<ul>${ls.map((l) => navItem(l, current)).join('')}</ul>`;
      }
      s += '</details>';
    }
  }
  s += '<p class="nav-group">찾아보기</p><ul class="nav-extra">';
  for (const e of [...FINDERS, ...EXTRA]) s += `<li><a href="${e.out}"${e.id === current ? ' aria-current="page"' : ''}>${e.title}</a></li>`;
  return s + '</ul></nav>';
}
function page({ title, current, body, sims = [], bodyClass = '', lesson = null }) {
  // 단원 쪽에는 학습 기록(읽던 위치·완료 표시)용 정보를 붙인다. 기록은 독자 기기의 브라우저에만 저장된다(book.js의 Progress).
  const bodyAttrs = lesson ? ` data-lesson="${lesson.id}" data-title="${escapeHtml(lesson.title)}" data-where="${escapeHtml(lesson.part.short || lesson.part.name)}"` : '';
  const simTags = sims.map((s) => `<script src="assets/js/sims/${s}.js" defer></script>`).join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="assets/katex/katex.min.css">
<link rel="stylesheet" href="assets/book.css">
<script src="assets/js/book.js" defer></script>
${simTags}
</head>
<body class="${bodyClass}"${bodyAttrs}>
<header class="topbar">
  <button class="menu-btn" id="menu-btn" aria-controls="drawer" aria-expanded="false">목차</button>
  <a class="brand" href="index.html">${BOOK}</a>
  <button class="theme-btn" id="theme-btn" aria-label="밝은 화면과 어두운 화면 바꾸기">화면</button>
  ${lesson ? '<div class="read-bar" id="read-bar" aria-hidden="true"><i></i></div>' : ''}
</header>
<div class="shell">
<aside class="drawer" id="drawer">${navTree(current)}</aside>
<main class="main" id="main">
${body}
</main>
</div>
</body>
</html>
`;
}

function ladder(toc) {
  const items = toc.filter((t) => t.step || /단원 들어가기|탐구 활동|개념 확인 문제|한눈에 정리/.test(t.text));
  return `<nav class="ladder" aria-label="이 단원의 흐름"><p class="ladder-title">이 단원의 흐름</p><ol>${items.map((t) =>
    `<li class="${t.step ? `s${t.step}` : 'extra'}"><a href="#${t.id}">${t.step ? `<b>STEP ${t.step}</b> ` : ''}${escapeHtml(t.text.replace(/^STEP \d\.\s*/, ''))}</a></li>`).join('')}</ol></nav>`;
}
const where = (l) => l.part.short || l.part.name;
const linkItem = (l) => `<li><a href="${l.out}"><span class="lp-where">${escapeHtml(where(l))}</span>${escapeHtml(l.title)}</a></li>`;
function linksPanel(l) {
  if (!l.prevList.length && !l.nextList.length) return '';
  const col = (title, list, empty) => `<div class="lp-col"><p class="lp-title">${title}</p>${list.length ? `<ul>${list.map(linkItem).join('')}</ul>` : `<p class="lp-empty">${empty}</p>`}</div>`;
  return `<section class="links-panel" aria-label="개념 연결">
  ${col('먼저 배운 내용', l.prevList, '이 책에서는 여기가 출발점이다.')}
  <div class="lp-now"><span>지금</span><b>${escapeHtml(l.title)}</b></div>
  ${col('이어지는 내용', l.nextList, '이 책에서는 여기가 마지막 단계이다.')}
</section>`;
}

// ───────────────────────── 빌드 ─────────────────────────
async function buildLesson(l, i) {
  const body = l.md.replace(/^# .+\n/, '');
  const { html, toc, sims } = await convert(body, { id: l.id });
  l.sims = sims;
  const prev = lessons[i - 1];
  const next = lessons[i + 1];
  const pg = (x, cls, small) => `<a class="${cls}" href="${x.out}"><small>${small} · ${escapeHtml(where(x))}</small>${escapeHtml(x.title)}</a>`;
  const pager = `<nav class="pager">${prev ? pg(prev, 'prev', '이전 단원') : '<span></span>'}${next ? pg(next, 'next', '다음 단원') : '<a class="next" href="map.html"><small>찾아보기</small>개념 연계 지도</a>'}</nav>`;
  const crumbs = [l.group.name, l.part.name, l.unit.name].filter(Boolean).join(' · ');
  const hero = `<header class="lesson-hero st-${l.strand}">
  <p class="eyebrow">${escapeHtml(crumbs)}</p>
  <h1><span class="lesson-id">${escapeHtml(l.label)}</span>${escapeHtml(l.title)}</h1>
  ${l.sub ? `<p class="lesson-sub">${escapeHtml(l.sub)}</p>` : ''}
</header>`;
  const doneBox = `<section class="done-box" id="done-box" hidden>
  <label><input type="checkbox" id="done-check"><span>이 단원 학습을 마쳤다</span></label>
  <p>표시해 두면 목차에 ✓가 붙고, 첫 화면에서 전체 진행 상황을 볼 수 있다. 읽던 위치와 이 표시는 지금 쓰는 기기의 브라우저에만 저장된다.</p>
</section>`;
  const out = page({ title: `${l.title} · ${where(l)}`, current: l.id, sims, lesson: l,
    body: `<div class="lesson-grid">${ladder(toc)}<article class="prose lesson">${hero}${linksPanel(l)}${html}${doneBox}${pager}</article></div>` });
  fs.writeFileSync(path.join(OUT, l.out), out);
  return { sims: sims.length };
}
async function buildDoc({ id, out, title, md, wide = true, eyebrow = BOOK }) {
  const h1 = (md.match(/^# (.+)$/m) || [])[1] || title;
  const { html, sims } = await convert(md.replace(/^# .+\n/, ''), { id });
  fs.writeFileSync(path.join(OUT, out), page({ title, current: id, sims,
    body: `<article class="prose ${wide ? 'wide' : ''}"><header class="lesson-hero plain"><p class="eyebrow">${eyebrow}</p><h1>${h1}</h1></header>${html}</article>` }));
}

// 표지: 학교급 → 학년·과목 → 단원 전체 목차
function coverBody() {
  const groups = CFG.groups.map((g) => {
    const parts = g.parts.filter((p) => partLessons(p).length);
    if (!parts.length) return '';
    const cards = parts.map((p) => {
      const units = p.units || [{ name: '' }];
      const inner = units.map((u) => {
        const ls = partLessons(p).filter((l) => !p.units || l.unit === u);
        if (!ls.length) return '';
        return `${u.name ? `<p class="toc-unit">${u.name}</p>` : ''}<ol>${ls.map((l) => `<li><a href="${l.out}" data-id="${l.id}" data-where="${escapeHtml(where(l))}"><span class="nav-id">${escapeHtml(shortLabel(l))}</span><span>${escapeHtml(l.title)}</span></a></li>`).join('')}</ol>`;
      }).join('');
      return `<section class="toc-card" id="toc-${p.id}"><h3>${p.name}<span class="nav-count">${partLessons(p).length}단원</span></h3>${inner}</section>`;
    }).join('');
    return `<section class="toc-group" id="toc-${g.id}"><h2>${g.name}</h2><div class="toc-grid">${cards}</div></section>`;
  }).join('');
  const jump = CFG.groups.map((g) => {
    const parts = g.parts.filter((p) => partLessons(p).length);
    return parts.length ? `<div class="jump-row"><span class="jump-group">${g.name}</span>${parts.map((p) => `<a href="#toc-${p.id}">${p.name}</a>`).join('')}</div>` : '';
  }).join('');
  const simCount = new Set(lessons.flatMap((l) => l.sims || [])).size;
  return `<section class="cover">
  <p class="eyebrow">2022 개정 교육과정 · 과학과</p>
  <h1>${CFG.title.replace('잇는 과학', '<span>잇는 과학</span>')}</h1>
  <p class="cover-lede">${CFG.subtitle}. 학년이 올라가도 같은 개념이 어떻게 이어지고 깊어지는지 한눈에 따라갈 수 있도록 ${lessons.length}개 단원을 하나로 엮었다. 단원마다 먼저 배운 내용과 이어지는 내용을 바로 오갈 수 있고, 이해하기 어려운 개념은 ${simCount}개의 시뮬레이션으로 직접 움직여 보며 익힌다.</p>
  <section class="resume-panel" id="resume-panel" aria-label="이어서 학습하기" hidden></section>
  <nav class="jump" aria-label="학년·과목 바로 가기">${jump}</nav>
  <p class="cover-links"><a class="btn" href="map.html">개념 연계 지도 보기</a><a class="btn ghost" href="sims.html">시뮬레이션 모아 보기</a><a class="btn ghost" href="glossary.html">용어 사전</a></p>
</section>
${groups}
<section class="appendix-row"><h2>찾아보기·부록</h2><ul>${[...FINDERS, ...EXTRA].map((e) => `<li><a href="${e.out}">${e.title}</a></li>`).join('')}</ul>
<p class="source">근거: 교육부 고시 제2022-33호 [별책 9] 「과학과 교육과정」. 중학교 단원의 학년 배치는 교과서(학교)에 따라 다를 수 있다. 대학 일반 과학과 대학 전공 과정 단원은 정해진 교육과정이 없어, 대학에서 널리 쓰이는 교재들의 공통 목차를 참고해 범위를 정했다.</p></section>
<section class="progress-admin" id="progress-admin" hidden><h2>학습 기록</h2>
<p>읽던 위치, 읽은 정도, 완료 표시는 지금 쓰는 기기의 이 브라우저에만 저장된다. 다른 기기나 다른 브라우저에서는 따로 기록되며, 브라우저의 사이트 데이터를 지우면 함께 사라진다.</p>
<div class="pa-btns"></div></section>`;
}

// 개념 연계 지도: 영역(가로) × 학년·과목 단계(세로)
function mapBody() {
  const stages = [];
  for (const g of CFG.groups) {
    if (g.id === 'general' || g.id === 'career' || g.id === 'university' || g.id === 'major') stages.push({ name: g.name.replace('고등학교 ', ''), list: lessons.filter((l) => l.group === g), showPart: true });
    else for (const p of g.parts) stages.push({ name: g.id === 'middle' ? `중학교 ${p.name}` : p.name, list: partLessons(p) });
  }
  const rows = stages.filter((s) => s.list.length).map((s) => `<tr><th scope="row">${s.name}</th>${STRANDS.map((st) => {
    const ls = s.list.filter((l) => l.strand === st.id);
    return `<td class="st-${st.id}">${ls.map((l) => `<a class="map-chip" href="${l.out}" data-id="${l.id}" data-links="${[...l.prevList, ...l.nextList].map((x) => x.id).join(' ')}">${s.showPart ? `<small>${escapeHtml(where(l))}</small>` : ''}${escapeHtml(l.title)}</a>`).join('')}</td>`;
  }).join('')}</tr>`).join('');
  return `<article class="prose wide"><header class="lesson-hero plain"><p class="eyebrow">${BOOK}</p><h1>개념 연계 지도</h1>
  <p class="lesson-sub">같은 영역의 개념이 학년을 따라 어떻게 이어지는지 보여 준다. 단원에 마우스를 올리거나 한 번 누르면 연결된 단원이 함께 표시되고, 한 번 더 누르면 그 단원으로 이동한다.</p></header>
  <div class="table-wrap map-wrap"><table class="map-table" id="map-table"><thead><tr><th>단계</th>${STRANDS.map((s) => `<th class="st-${s.id}">${s.name}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

// 핵심 용어 사전: 각 단원 '핵심 용어' 표에서 자동으로 모은다
function glossaryMd() {
  const terms = new Map();
  for (const l of lessons) {
    const m = l.md.match(/###\s*핵심 용어\s*\n+((?:\|.*\n?)+)/);
    if (!m) continue;
    for (const row of m[1].split('\n').slice(2)) {
      const c = row.split('|').map((x) => x.trim());
      if (c.length < 4 || !c[1]) continue;
      const name = c[1].replace(/\*\*/g, '');
      const key = name.replace(/\s+/g, '');
      if (!terms.has(key)) terms.set(key, { name, def: c[2], ls: [] });
      const t = terms.get(key);
      if (!t.ls.includes(l)) t.ls.push(l);
    }
  }
  const initial = (s) => {
    const c = s.codePointAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) { const ch = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[Math.floor((c - 0xac00) / 588)]; return { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' }[ch] || ch; }
    return 'A–Z·기호';
  };
  const groups = new Map();
  for (const t of [...terms.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))) {
    const k = initial(t.name);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  const keys = [...groups.keys()].sort((a, b) => (a.startsWith('A') ? 1 : b.startsWith('A') ? -1 : a.localeCompare(b, 'ko')));
  let md = `# 핵심 용어 사전\n\n책 전체의 핵심 용어 ${terms.size}개를 가나다순으로 모았다. 뜻은 그 용어가 처음 나오는 단원의 설명이며, 오른쪽 단원을 누르면 그 용어를 다루는 단원으로 이동한다.\n\n`;
  for (const k of keys) {
    md += `## ${k}\n\n| 용어 | 뜻 | 다루는 단원 |\n|---|---|---|\n`;
    for (const t of groups.get(k)) md += `| **${t.name}** | ${t.def} | ${t.ls.map((l) => `[${where(l)} · ${l.title}](${path.basename(l.src)})`).join('<br>')} |\n`;
    md += '\n';
  }
  return { md, count: terms.size };
}

// 시뮬레이션 모아 보기
function simsBody() {
  const rows = [];
  for (const l of lessons) for (const s of l.sims || []) {
    const js = fs.readFileSync(path.join(ASSETS, 'js', 'sims', `${s}.js`), 'utf8');
    const title = (js.match(/title:\s*(['"])((?:\\.|(?!\1).)*)\1/) || [])[2] || s;
    rows.push({ l, s, title: title.replace(/\\(['"])/g, '$1'), is3d: /scene3d\s*\(/.test(js) });
  }
  const by = CFG.groups.map((g) => {
    const rs = rows.filter((r) => r.l.group === g);
    if (!rs.length) return '';
    return `<h2>${g.name}</h2><ul class="sim-index">${rs.map((r) => `<li><a href="${r.l.out}#sim-${r.s}"><span class="sim-kind ${r.is3d ? 'k3d' : ''}">${r.is3d ? '3D' : '2D'}</span><b>${escapeHtml(r.title)}</b><small>${escapeHtml(where(r.l))} · ${escapeHtml(r.l.title)}</small></a></li>`).join('')}</ul>`;
  }).join('');
  return { html: `<article class="prose wide"><header class="lesson-hero plain"><p class="eyebrow">${BOOK}</p><h1>시뮬레이션 모아 보기</h1>
  <p class="lesson-sub">직접 조작해 보는 시뮬레이션 ${rows.length}개. 3D 표시는 마우스나 손가락으로 끌어서 돌려 볼 수 있는 입체 모형이다.</p></header>${by}</article>`, count: rows.length };
}

// 사진·삽화 출처: 자유 이용 자료의 저작자·라이선스를 한곳에 모아 밝힌다
function creditsBody() {
  const rows = [];
  for (const l of lessons) for (const m of l.md.matchAll(/<!--\s*photo:([\w-]+)\s*-->/g)) {
    const p = photos[m[1]];
    if (p) rows.push({ l, name: m[1], p });
  }
  const by = CFG.groups.map((g) => {
    const rs = rows.filter((r) => r.l.group === g);
    if (!rs.length) return '';
    return `<h2>${g.name}</h2><ul class="credit-index">${rs.map((r) => `<li><a href="${r.l.out}#photo-${r.name}"><b>${escapeHtml(r.p.title)}</b></a> <small>${escapeHtml(where(r.l))} · ${escapeHtml(r.l.title)}</small><br><span class="credit">${photoCredit(r.p)}</span></li>`).join('')}</ul>`;
  }).join('');
  return `<article class="prose wide"><header class="lesson-hero plain"><p class="eyebrow">${BOOK}</p><h1>사진·삽화 출처</h1>
  <p class="lesson-sub">이 책의 사진과 사실적인 삽화 ${rows.length}점은 퍼블릭 도메인이거나 자유 이용 라이선스(CC BY, CC BY-SA)로 공개된 자료이다. 저작자와 라이선스를 아래에 밝힌다. 한글 이름표를 덧붙이거나 일부를 잘라 쓴 경우에는 그 사실을 함께 적었다. CC BY-SA 자료를 고친 그림은 같은 라이선스로 다시 쓸 수 있다.</p></header>${by}</article>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // KaTeX 글꼴·스타일 복사
  const kdir = path.join(ASSETS, 'katex');
  fs.mkdirSync(path.join(kdir, 'fonts'), { recursive: true });
  const kdist = path.join(HERE, 'node_modules/katex/dist');
  fs.copyFileSync(path.join(kdist, 'katex.min.css'), path.join(kdir, 'katex.min.css'));
  for (const f of fs.readdirSync(path.join(kdist, 'fonts')).filter((x) => x.endsWith('.woff2'))) fs.copyFileSync(path.join(kdist, 'fonts', f), path.join(kdir, 'fonts', f));
  // woff2만 남기고 나머지 글꼴 참조는 지운다(용량 절약)
  const kcss = fs.readFileSync(path.join(kdir, 'katex.min.css'), 'utf8').replace(/,url\(fonts\/[^)]+\.(woff|ttf)\) format\("(woff|truetype)"\)/g, '');
  fs.writeFileSync(path.join(kdir, 'katex.min.css'), kcss);

  // node build.mjs m1-03 3-4 처럼 단원 id를 주면 그 단원만 다시 만든다
  const only = process.argv.slice(2);
  const unknown = only.filter((x) => !byId.has(x));
  if (unknown.length) console.warn(`  ! 없는 단원 id: ${unknown.join(', ')}`);
  let simCount = 0;
  for (let i = 0; i < lessons.length; i++) {
    if (only.length && !only.includes(lessons[i].id)) continue;
    const r = await buildLesson(lessons[i], i);
    simCount += r.sims;
    console.log(`✓ ${lessons[i].out}${r.sims ? `  (시뮬레이션 ${r.sims})` : ''}`);
  }
  if (only.length) { if (browser) await browser.close(); return; }
  for (const e of EXTRA) { await buildDoc({ id: e.id, out: e.out, title: e.title, md: fs.readFileSync(path.join(ROOT, e.src), 'utf8') }); console.log(`✓ ${e.out}`); }
  const g = glossaryMd();
  await buildDoc({ id: 'glossary', out: 'glossary.html', title: '핵심 용어 사전', md: g.md });
  fs.writeFileSync(path.join(OUT, 'map.html'), page({ title: '개념 연계 지도', current: 'map', body: mapBody() }));
  const sm = simsBody();
  fs.writeFileSync(path.join(OUT, 'sims.html'), page({ title: '시뮬레이션 모아 보기', current: 'sims', body: sm.html }));
  fs.writeFileSync(path.join(OUT, 'index.html'), page({ title: BOOK, current: 'home', body: coverBody(), bodyClass: 'home' }));
  if (Object.keys(photos).length) fs.writeFileSync(path.join(OUT, 'credits.html'), page({ title: '사진·삽화 출처', current: 'credits', body: creditsBody() }));
  console.log('✓ glossary.html, map.html, sims.html, index.html');
  if (browser) await browser.close();
  console.log(`\n완료: 단원 ${lessons.length}개, 시뮬레이션 ${sm.count}개, 용어 ${g.count}개`);
}
main().catch((e) => { console.error(e); if (browser) browser.close(); process.exit(1); });
