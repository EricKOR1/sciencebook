// 통합과학 교재 Markdown → HTML 빌드 스크립트
// 사용: cd tools && npm install && node build.mjs
//
// - 수식($…$, $$…$$)은 KaTeX로, mermaid 도표는 SVG로 미리 그려 넣는다(인터넷 없이도 보임).
// - 단원 md 안의 HTML 주석 표식을 그림·애니메이션으로 바꾼다.
//     <!-- fig:이름 -->    → docs/assets/fig/이름.svg 를 본문에 넣음(도표·일러스트)
//     <!-- photo:이름 -->  → docs/assets/photos/photos.json 에 등록된 사진(파일이 있을 때만)
//     <!-- sim:이름 -->    → docs/assets/js/sims/이름.js 인터랙티브 애니메이션
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
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BOOK = '통합과학 개념에서 산업까지';

// ───────────────────────── 원고 목록 ─────────────────────────
const UNITS = [
  { n: 1, book: 1, name: '과학의 기초', dir: '통합과학1/1단원_과학의_기초' },
  { n: 2, book: 1, name: '물질과 규칙성', dir: '통합과학1/2단원_물질과_규칙성' },
  { n: 3, book: 1, name: '시스템과 상호작용', dir: '통합과학1/3단원_시스템과_상호작용' },
  { n: 4, book: 2, name: '변화와 다양성', dir: '통합과학2/4단원_변화와_다양성' },
  { n: 5, book: 2, name: '환경과 에너지', dir: '통합과학2/5단원_환경과_에너지' },
  { n: 6, book: 2, name: '과학과 미래 사회', dir: '통합과학2/6단원_과학과_미래_사회' },
];
const EXTRA = [
  { id: 'guide', src: '교재_설계_안내.md', title: '교재 설계 안내', out: 'guide.html' },
  { id: 'standards', src: '부록/교육과정_성취기준.md', title: '부록 1. 교육과정 성취기준', out: 'appendix-standards.html' },
  { id: 'map', src: '부록/연계_지도.md', title: '부록 2. 연계 지도', out: 'appendix-map.html' },
  { id: 'glossary', src: '부록/핵심_용어_사전.md', title: '부록 3. 핵심 용어 사전', out: 'appendix-glossary.html' },
];

const lessons = [];
for (const u of UNITS) {
  for (const f of fs.readdirSync(path.join(ROOT, u.dir)).filter((x) => /^\d-\d_.*\.md$/.test(x)).sort()) {
    const src = path.join(u.dir, f);
    const md = fs.readFileSync(path.join(ROOT, src), 'utf8');
    const h1 = md.match(/^# (\d-\d)\. (.+?)(?: — (.+))?$/m);
    const std = md.match(/\*\*성취기준 \[(10통과[12]-0\d-0\d)\]\*\*/);
    lessons.push({ id: h1[1], title: h1[2].trim(), sub: (h1[3] || '').trim(), std: std ? std[1] : '', unit: u, src, out: `${h1[1]}.html`, md });
  }
}
// md 경로 → html 파일명 (본문 속 상대 링크 변환용)
const LINKMAP = new Map();
for (const l of lessons) LINKMAP.set(path.basename(l.src), l.out);
for (const e of EXTRA) LINKMAP.set(path.basename(e.src), e.out);
LINKMAP.set('README.md', 'index.html');

// ───────────────────────── 보조 자료 ─────────────────────────
const photos = fs.existsSync(path.join(ASSETS, 'photos/photos.json'))
  ? JSON.parse(fs.readFileSync(path.join(ASSETS, 'photos/photos.json'), 'utf8')) : {};
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  for (const [k, v] of Object.entries(MM_VARS)) svg = svg.split(k).join(v).split(k.toUpperCase()).join(v);
  svg = svg.replace(/<\?xml[^>]*>/, '').replace(/MMID/g, `mm-${uid}`)
    .replace(/(<svg[^>]*?)\sstyle="[^"]*"/, '$1').replace(/(<svg[^>]*?)\swidth="[^"]*"/, '$1');
  return `<figure class="diagram" role="img"><div class="diagram-scroll">${svg}</div></figure>`;
}

// ───────────────────────── Markdown 변환 ─────────────────────────
const CALLOUT = { NOTE: '성취기준·참고', TIP: '도움말', IMPORTANT: '핵심', WARNING: '주의', CAUTION: '심화 · 평가 범위 밖' };
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
function renderMath(m) {
  try {
    return katex.renderToString(m.tex, { displayMode: m.display, throwOnError: true, output: 'html', strict: 'ignore', trust: false });
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
      const cap = (raw.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
      const desc = (raw.match(/<desc>([^<]*)<\/desc>/) || [])[1] || '';
      return `<figure class="fig" id="fig-${name}"><div class="fig-art">${raw}</div>${cap ? `<figcaption><b>${cap}</b>${desc ? ` ${desc}` : ''}</figcaption>` : ''}</figure>`;
    }
    if (kind === 'photo') {
      const p = photos[name];
      if (!p || !fs.existsSync(path.join(ASSETS, 'photos', p.file))) return '';
      return `<figure class="photo"><img src="assets/photos/${p.file}" alt="${escapeHtml(p.alt || p.caption)}" loading="lazy"><figcaption><b>${p.caption}</b> <span class="credit">${p.credit || ''}</span></figcaption></figure>`;
    }
    const js = path.join(ASSETS, 'js', 'sims', `${name}.js`);
    if (!fs.existsSync(js)) { console.warn(`  ! 애니메이션 없음: ${name}`); return ''; }
    sims.add(name);
    return `<figure class="sim" data-sim="${name}"><noscript>이 애니메이션은 자바스크립트가 필요하다.</noscript></figure>`;
  });
  return { html, toc, sims: [...sims] };
}

// ───────────────────────── 페이지 틀 ─────────────────────────
const FONTS = 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap';
function navTree(current) {
  let s = '<nav class="book-nav" aria-label="교재 목차"><a class="nav-home" href="index.html">처음으로</a>';
  for (const b of [1, 2]) {
    s += `<p class="nav-book">통합과학${b}</p>`;
    for (const u of UNITS.filter((x) => x.book === b)) {
      s += `<p class="nav-unit"><span>${u.n}단원</span> ${u.name}</p><ul>`;
      for (const l of lessons.filter((x) => x.unit === u)) {
        s += `<li><a href="${l.out}"${l.id === current ? ' aria-current="page"' : ''}><span class="nav-id">${l.id}</span>${l.title}</a></li>`;
      }
      s += '</ul>';
    }
  }
  s += '<p class="nav-book">부록</p><ul>';
  for (const e of EXTRA) s += `<li><a href="${e.out}"${e.id === current ? ' aria-current="page"' : ''}>${e.title}</a></li>`;
  return s + '</ul></nav>';
}
function page({ title, current, body, sims = [], bodyClass = '' }) {
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
<body class="${bodyClass}">
<header class="topbar">
  <button class="menu-btn" id="menu-btn" aria-controls="drawer" aria-expanded="false">목차</button>
  <a class="brand" href="index.html">${BOOK}</a>
  <button class="theme-btn" id="theme-btn" aria-label="밝은 화면과 어두운 화면 바꾸기">화면</button>
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

// ───────────────────────── 빌드 ─────────────────────────
async function buildLesson(l, i) {
  const body = l.md.replace(/^# .+\n/, '');
  const { html, toc, sims } = await convert(body, { id: l.id });
  const prev = lessons[i - 1];
  const next = lessons[i + 1];
  const pager = `<nav class="pager">${prev ? `<a class="prev" href="${prev.out}"><small>이전 단원</small>${prev.id} ${prev.title}</a>` : '<span></span>'}${next ? `<a class="next" href="${next.out}"><small>다음 단원</small>${next.id} ${next.title}</a>` : '<a class="next" href="appendix-map.html"><small>부록</small>연계 지도</a>'}</nav>`;
  const hero = `<header class="lesson-hero u${l.unit.n}">
  <p class="eyebrow">통합과학${l.unit.book} · ${l.unit.n}단원 ${l.unit.name}</p>
  <h1><span class="lesson-id">${l.id}</span>${l.title}</h1>
  ${l.sub ? `<p class="lesson-sub">${l.sub}</p>` : ''}
</header>`;
  const out = page({ title: `${l.id} ${l.title}`, current: l.id, sims,
    body: `<div class="lesson-grid">${ladder(toc)}<article class="prose lesson">${hero}${html}${pager}</article></div>` });
  fs.writeFileSync(path.join(OUT, l.out), out);
  return { sims: sims.length };
}
async function buildExtra(e) {
  const md = fs.readFileSync(path.join(ROOT, e.src), 'utf8');
  const h1 = (md.match(/^# (.+)$/m) || [])[1] || e.title;
  const { html, sims } = await convert(md.replace(/^# .+\n/, ''), { id: e.id });
  const out = page({ title: e.title, current: e.id, sims,
    body: `<article class="prose wide"><header class="lesson-hero plain"><p class="eyebrow">${BOOK}</p><h1>${h1}</h1></header>${html}</article>` });
  fs.writeFileSync(path.join(OUT, e.out), out);
}
function coverBody() {
  const unitCards = UNITS.map((u) => `<section class="unit-card u${u.n}">
    <p class="unit-no">통합과학${u.book} · ${u.n}단원</p><h2>${u.name}</h2>
    <ol>${lessons.filter((l) => l.unit === u).map((l) => `<li><a href="${l.out}"><span class="nav-id">${l.id}</span>${l.title}</a></li>`).join('')}</ol>
  </section>`).join('');
  return `<section class="cover">
  <p class="eyebrow">2022 개정 교육과정 · 고등학교 공통 과목</p>
  <h1>통합과학<br><span>개념에서 산업까지</span></h1>
  <p class="cover-lede">중학교에서 배운 개념에서 출발해 고등학교 핵심 개념을 정확히 이해하고, 대학 전공과 실제 산업 현장까지 이어지는 길을 보여 주는 교재이다. 이해하기 어려운 개념은 직접 움직여 보며 익힐 수 있다.</p>
  <ol class="cover-ladder">
    <li class="s1"><b>STEP 1</b>중학교 다시 보기</li><li class="s2"><b>STEP 2</b>기초 다지기</li><li class="s3"><b>STEP 3</b>핵심 개념</li>
    <li class="s4"><b>STEP 4</b>오개념 바로잡기</li><li class="s5"><b>STEP 5</b>선택과목·대학</li><li class="s6"><b>STEP 6</b>산업·진로</li>
  </ol>
  <p class="cover-links"><a class="btn" href="${lessons[0].out}">1-1부터 시작하기</a><a class="btn ghost" href="guide.html">교재 설계 안내</a></p>
</section>
<div class="unit-grid">${unitCards}</div>
<section class="appendix-row"><h2>부록</h2><ul>${EXTRA.filter((e) => e.id !== 'guide').map((e) => `<li><a href="${e.out}">${e.title}</a></li>`).join('')}</ul>
<p class="source">근거: 교육부 고시 제2022-33호 [별책 9] 「과학과 교육과정」</p></section>`;
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

  // node build.mjs 3-4 3-5 처럼 단원 번호를 주면 그 단원만 다시 만든다
  const only = process.argv.slice(2);
  let simCount = 0;
  for (let i = 0; i < lessons.length; i++) {
    if (only.length && !only.includes(lessons[i].id)) continue;
    const r = await buildLesson(lessons[i], i);
    simCount += r.sims;
    console.log(`✓ ${lessons[i].out}${r.sims ? `  (애니메이션 ${r.sims})` : ''}`);
  }
  if (only.length) { if (browser) await browser.close(); return; }
  for (const e of EXTRA) { await buildExtra(e); console.log(`✓ ${e.out}`); }
  fs.writeFileSync(path.join(OUT, 'index.html'), page({ title: BOOK, current: 'home', body: coverBody(), bodyClass: 'home' }));
  console.log('✓ index.html');
  if (browser) await browser.close();
  console.log(`\n완료: 단원 ${lessons.length}개, 애니메이션 ${simCount}개`);
}
main().catch((e) => { console.error(e); if (browser) browser.close(); process.exit(1); });
