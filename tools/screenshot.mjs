// 화면 확인 도구: node screenshot.mjs <html 파일> <저장할 png> [CSS 선택자|-] [light|dark] [너비]
// 콘솔 오류와, 애니메이션(figure.sim)이 제대로 붙었는지도 함께 알려 준다.
import path from 'node:path';
import puppeteer from 'puppeteer';
const [, , file, out, sel = '-', theme = 'light', width = '1280'] = process.argv;
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push(String(e)));
await p.setViewport({ width: +width, height: 900, deviceScaleFactor: 1 });
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
await p.goto('file://' + path.resolve(file), { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 1200));
if (sel !== '-') {
  const el = await p.$(sel);
  if (!el) { console.log('선택자를 찾지 못함:', sel); } else { await el.scrollIntoView(); await new Promise((r) => setTimeout(r, 700)); await el.screenshot({ path: out }); }
} else await p.screenshot({ path: out, fullPage: false });
const sims = await p.$$eval('figure.sim', (fs) => fs.map((f) => `${f.dataset.sim}:${f.dataset.mounted ? '작동' : '안 붙음'}`));
const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
console.log('애니메이션:', sims.join(', ') || '없음');
console.log('가로 넘침:', overflow ? '있음(고쳐야 함)' : '없음');
console.log('오류:', errs.filter((e) => !/fonts\.g/.test(e)).join('\n') || '없음');
await b.close();
