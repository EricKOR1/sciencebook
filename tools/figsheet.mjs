// 그림 모아 보기(점검용): node figsheet.mjs <저장할 png> <light|dark> <단원id:그림이름> …
// 빌드된 쪽에서 그림(figure#fig-이름)을 찍어 한 장으로 모은다. 여러 그림을 한눈에 확인할 때 쓴다.
// 접힌 정답·해설(<details>) 안의 그림도 펼쳐서 찍는다.
import fs0 from 'node:fs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [, , out, theme, ...items] = process.argv;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'figsheet-'));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || (fs0.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'), args: ['--no-sandbox'] });
const shots = [];
const pages = new Map();
for (const it of items) {
  const [pg, fig] = it.split(':');
  let p = pages.get(pg);
  if (!p) { p = await b.newPage(); await p.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]); await p.goto('file://' + path.resolve(HERE, '../docs', pg + '.html'), { waitUntil: 'load' }); pages.set(pg, p); }
  await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));   // 정답·해설 안의 그림도 찍히게 펼친다
  const el = await p.$('#fig-' + fig + ' .fig-art') || await p.$('#fig-' + fig);
  if (!el) { console.log('없음:', it); continue; }
  const f = path.join(tmp, fig + '.png');
  await el.screenshot({ path: f }); shots.push([fig, f]);
}
const html = `<body style="margin:0;background:#777;display:grid;grid-template-columns:repeat(2,1fr);gap:6px;align-items:start;font:12px sans-serif">${shots.map(([n, f]) => `<div style="background:#fff"><div style="padding:2px 6px;background:#222;color:#fff">${n}</div><img src="file://${f}" style="width:100%;display:block"></div>`).join('')}</body>`;
fs.writeFileSync(path.join(tmp, 'sheet.html'), html);
const p = await b.newPage(); await p.setViewport({ width: 1500, height: 900, deviceScaleFactor: 1 });
await p.goto('file://' + path.join(tmp, 'sheet.html'), { waitUntil: 'load' });
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('저장:', out, shots.length + '개');
