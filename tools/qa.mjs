// 사이트 전체 점검: node qa.mjs [쪽 이름 …]   (이름을 주지 않으면 docs/*.html 전부)
// 쪽마다 밝은 화면 1280px, 어두운 화면 390px 로 열어 콘솔 오류, 가로 넘침, 시뮬레이션 작동 여부를 보고,
// 내부 링크(파일·#위치)가 끊어진 곳이 없는지 확인한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../docs');
const only = process.argv.slice(2);
const pages = fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).filter((f) => !only.length || only.includes(f.replace('.html', ''))).sort();
const problems = [];
const note = (pg, msg) => problems.push(`${pg}: ${msg}`);

// 1) 내부 링크
const html = new Map(fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).map((f) => [f, fs.readFileSync(path.join(OUT, f), 'utf8')]));
const ids = new Map([...html].map(([f, s]) => [f, new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
for (const pg of pages) {
  for (const m of html.get(pg).matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|data:|javascript:)/.test(href)) continue;
    const [file, hash] = href.split('#');
    const target = file || pg;
    if (!html.has(target)) { if (!fs.existsSync(path.join(OUT, decode(target)))) note(pg, `끊어진 링크 → ${href}`); continue; }
    if (hash && hash !== 'resume' && !ids.get(target).has(decode(hash))) note(pg, `없는 위치 → ${href}`);
  }
  for (const m of html.get(pg).matchAll(/<script src="([^"]+)"/g)) if (!fs.existsSync(path.join(OUT, m[1]))) note(pg, `없는 스크립트 → ${m[1]}`);
  if (/class="(fig|sim)-missing"|그림 없음|애니메이션 없음/.test(html.get(pg))) note(pg, '빠진 그림·시뮬레이션 표식');
}

// 2) 화면
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const CONFIGS = [{ theme: 'light', width: 1280 }, { theme: 'dark', width: 390 }];
let simTotal = 0;
async function check(pg, cfg) {
  const p = await browser.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.setViewport({ width: cfg.width, height: 900, deviceScaleFactor: 1 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: cfg.theme }]);
  await p.goto('file://' + path.join(OUT, pg), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 250));
  // 시뮬레이션을 하나씩 화면에 올려 움직여 본다
  const n = await p.$$eval('figure.sim', (fs) => fs.length);
  for (let i = 0; i < n; i++) {
    await p.evaluate((k) => document.querySelectorAll('figure.sim')[k].scrollIntoView({ block: 'center' }), i);
    await new Promise((r) => setTimeout(r, 180));
  }
  const r = await p.evaluate(() => ({
    sims: [...document.querySelectorAll('figure.sim')].map((f) => ({ name: f.dataset.sim, ok: !!f.dataset.mounted, drawn: !!f.querySelector('canvas, svg'), w: f.scrollWidth - f.clientWidth })),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    wide: [...document.querySelectorAll('main *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > window.innerWidth + 2 && !e.closest('.table-wrap, .fig-scroll, figure.fig, pre, .katex-display, .mermaid, .map-wrap'); }).slice(0, 3).map((e) => e.tagName + '.' + e.className),
  }));
  const tag = `${pg} [${cfg.theme} ${cfg.width}]`;
  errs.forEach((e) => note(tag, `오류: ${e.slice(0, 200)}`));
  if (r.overflow > 1) note(tag, `가로 넘침 ${r.overflow}px ${r.wide.join(', ')}`);
  r.sims.forEach((s) => { if (!s.ok) note(tag, `시뮬레이션 안 붙음: ${s.name}`); else if (!s.drawn) note(tag, `시뮬레이션 화면 없음: ${s.name}`); else if (s.w > 2) note(tag, `시뮬레이션 안쪽 넘침 ${s.w}px: ${s.name}`); });
  if (cfg.width === 1280) simTotal += r.sims.length;
  await p.close();
}
const jobs = pages.flatMap((pg) => CONFIGS.map((cfg) => [pg, cfg]));
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length) { const [pg, cfg] = jobs[next++]; try { await check(pg, cfg); } catch (e) { note(pg, `점검 실패: ${String(e).slice(0, 160)}`); } } }));
await browser.close();

console.log(`점검한 쪽 ${pages.length}개 × 2가지 화면, 시뮬레이션 ${simTotal}개(쪽마다 센 합)`);
if (!problems.length) console.log('문제 없음');
else { problems.sort().forEach((x) => console.log(' - ' + x)); console.log(`\n문제 ${problems.length}건`); }
process.exit(problems.length ? 1 : 0);
