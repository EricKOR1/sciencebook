// 지도 그림용 밑그림 만들기 (Natural Earth 자료, 공개 저작물)
// 정확한 해안선 위에 기단·해류·판 경계·태풍 경로 등을 그릴 수 있게, 육지 윤곽의 SVG path 와
// 경위도 → 그림 좌표 변환 결과를 JSON 으로 내놓는다.
//
// 사용 예 (tools 폴더에서):
//   node authoring/basemap.mjs --bbox 105,18,155,58 --width 720 --height 560 \
//        --points "서울:127,37.5;오호츠크해:148,53" --lines "쿠로시오:122,22 128,28 135,33 142,36" --graticule 10
//   node authoring/basemap.mjs --world --center 150 --width 720 --height 380 --graticule 30
//
// 옵션
//   --bbox 서,남,동,북      그릴 범위(경도·위도). --world 를 주면 전 세계
//   --width, --height       그림 크기(px). 지도는 이 안에 여백 --pad(기본 8) 를 두고 맞춘다
//   --proj                  mercator(기본, 지역 지도) | equirect | equalearth(기본, --world) | natural | ortho
//   --center 경도           지도 가운데 경도(세계 지도를 태평양 중심으로 그릴 때 150~180). ortho 는 --center 경도,위도
//   --res 110m|50m|10m      해안선 정밀도(기본: 세계 110m, 지역 50m. 우리나라만 크게 그릴 때는 10m)
//   --minarea 넓이          이보다 작은(px²) 섬은 뺀다(기본 6)
//   --points "이름:경도,위도;…"   점의 그림 좌표를 계산
//   --lines  "이름:경도,위도 경도,위도 …;…"  꺾은선(경로)의 path d 를 계산(부드럽게 하려면 점을 촘촘히)
//   --graticule 간격        경위선 path (간격은 도)
//   --out 파일.json         결과를 파일로 저장(없으면 표준 출력)
// 결과 JSON: { viewBox, land, graticule, frame, points:{이름:[x,y]}, lines:{이름:"M…"} , note }
//   land 는 <path d="…"> 에 그대로 넣는다(fill-rule 은 evenodd 권장).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as d3 from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) { const k = a.slice(2); const v = process.argv[i + 1]; if (v === undefined || v.startsWith('--')) args[k] = true; else { args[k] = v; i++; } }
}
const W = +(args.width || 720), H = +(args.height || 480), PAD = +(args.pad ?? 8);
const world = !!args.world;
const bbox = world ? [-180, -85, 180, 85] : String(args.bbox || '100,15,160,60').split(',').map(Number);
const [w, s, e, n] = bbox;
const res = args.res || (world ? '110m' : '50m');
const topo = JSON.parse(fs.readFileSync(require.resolve(`world-atlas/land-${res}.json`), 'utf8'));
const land = feature(topo, topo.objects.land);

const projName = args.proj || (world ? 'equalearth' : 'mercator');
const make = { mercator: d3.geoMercator, equirect: d3.geoEquirectangular, equalearth: d3.geoEqualEarth, natural: d3.geoNaturalEarth1, ortho: d3.geoOrthographic }[projName];
if (!make) { console.error('모르는 투영법:', projName); process.exit(1); }
const proj = make();
const center = args.center ? String(args.center).split(',').map(Number) : null;
const midLon = center ? center[0] : (world ? 0 : (w + e) / 2);
proj.rotate([-midLon, projName === 'ortho' && center && center[1] != null ? -center[1] : 0]);
// 범위에 맞추기: 테두리를 따라 점을 찍어 그 범위가 그림에 꽉 차게 한다
let fitTo;
if (world || projName === 'ortho') fitTo = { type: 'Sphere' };
else {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([w + (e - w) * t, s], [w + (e - w) * t, n], [w, s + (n - s) * t], [e, s + (n - s) * t]); }
  fitTo = { type: 'MultiPoint', coordinates: pts };
}
proj.fitExtent([[PAD, PAD], [W - PAD, H - PAD]], fitTo);
if (!world && projName !== 'ortho') proj.clipExtent([[PAD, PAD], [W - PAD, H - PAD]]);
const r1 = (x) => Math.round(x * 10) / 10;
const pathGen = d3.geoPath(proj).digits(1);

// 작은 섬 빼기
const minArea = +(args.minarea ?? 6);
const polys = land.features ? land.features.flatMap((f) => (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates])) : (land.geometry.type === 'MultiPolygon' ? land.geometry.coordinates : [land.geometry.coordinates]);
const kept = polys.filter((p) => { const a = pathGen.area({ type: 'Polygon', coordinates: p }); return a >= minArea; });
const landPath = pathGen({ type: 'MultiPolygon', coordinates: kept }) || '';

const out = { viewBox: `0 0 ${W} ${H}`, projection: projName, bbox: world ? 'world' : bbox, land: landPath };
if (args.graticule) {
  const step = +args.graticule;
  const g = d3.geoGraticule().step([step, step]);
  if (!world) g.extent([[w - step, s - step], [e + step, n + step]]);
  out.graticule = pathGen(g()) || '';
}
out.frame = world || projName === 'ortho' ? pathGen({ type: 'Sphere' }) : `M${PAD},${PAD}H${W - PAD}V${H - PAD}H${PAD}Z`;
out.points = {};
if (args.points) for (const item of String(args.points).split(';').filter(Boolean)) {
  const k = item.lastIndexOf(':'); const name = item.slice(0, k).trim(); const [lon, lat] = item.slice(k + 1).split(',').map(Number);
  const p = proj([lon, lat]); out.points[name] = p ? [r1(p[0]), r1(p[1])] : null;
}
out.lines = {};
if (args.lines) for (const item of String(args.lines).split(';').filter(Boolean)) {
  const k = item.indexOf(':'); const name = item.slice(0, k).trim();
  const coords = item.slice(k + 1).trim().split(/\s+/).map((c) => c.split(',').map(Number));
  out.lines[name] = pathGen({ type: 'LineString', coordinates: coords }) || '';
}
out.note = '해안선: Natural Earth(공개 저작물). 그림에는 fill 을 CSS 변수로 주고, 작은 섬은 생략된 모식 지도임을 설명에 밝힌다.';
const text = JSON.stringify(out);
if (args.out) { fs.writeFileSync(path.resolve(args.out), text); console.log(`저장: ${args.out}  (육지 path ${Math.round(landPath.length / 1024)} KB, 점 ${Object.keys(out.points).length}개, 선 ${Object.keys(out.lines).length}개)`); }
else console.log(text);
