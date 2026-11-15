# 그림·시뮬레이션 제작 지침 — 「한 권으로 잇는 과학」

단원 원고(Markdown)는 `tools/build.mjs`가 `docs/*.html`로 바꾼다. 너의 일은 담당 단원에
**(1) 정적 그림(SVG)** 과 **(2) 직접 조작하는 2D·3D 시뮬레이션(JS)** 을 만들고, 원고에 **표식**을 넣는 것이다.
독자는 중·고등학생이다. 과학적으로 정확해야 하고, 교육과정 범위를 지킨다.

## 0. 먼저 읽을 것
1. 2D 견본: `docs/assets/js/sims/impulse.js`, 3D 견본: `docs/assets/js/sims/nacl-lattice.js`
2. 공통 틀: `docs/assets/js/book.js` 의 `Sims` 설명 주석(2D API와 `api.scene3d` 3D API)
3. 그림 견본: `docs/assets/fig/3-4-crumple-zone.svg`
4. 색 토큰: `docs/assets/book.css` 맨 위 `:root` 의 `--fig-*`
5. 담당 단원 원고 전체. 표식 예: `통합과학1/3단원_시스템과_상호작용/3-4_운동량과_충격량.md` 에서 `<!-- sim:impulse -->`, `<!-- fig:3-4-crumple-zone -->`

## 1. 표식
- 그림: `<!-- fig:파일이름 -->` → `docs/assets/fig/파일이름.svg`
- 시뮬레이션: `<!-- sim:이름 -->` → `docs/assets/js/sims/이름.js`
- **한 줄에 단독으로, 앞뒤 빈 줄.** 관련 설명 바로 뒤(예제 앞)에 둔다. 원고의 다른 글은 고치지 않는다(명백한 과학 오류를 발견하면 고치지 말고 최종 보고에 적는다).

## 2. 정적 그림(SVG)
- 단원당 **2~3개**. 글만으로 이해하기 어려운 구조·과정·비교를 그린다. 원고에 이미 있는 mermaid 도표와 같은 내용은 그리지 않는다.
- 파일 이름: `{단원 id}-{영문-설명}.svg` (예: `m1-05-force-balance.svg`, `phy-2-field-lines.svg`)
- `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 H" role="img" aria-labelledby="t-이름 d-이름">` 로 시작. 첫 자식으로
  `<title id="t-이름">그림 {표시 번호}-{n} 제목</title>` (예: `그림 중1-5-1 힘의 평형`) 과 `<desc id="d-이름">한두 문장 설명</desc>`. width/height 속성 금지.
- **색은 CSS 변수만**: `style="fill:var(--fig-soft-blue);stroke:var(--fig-blue)"` 또는 SVG 안 `<style>` 클래스. `fill="var(--x)"` 같은 프레젠테이션 속성은 동작하지 않는다.
  쓸 수 있는 변수: `--fig-ink --fig-muted --fig-line --fig-paper --fig-panel --fig-accent --fig-blue --fig-red --fig-green --fig-amber --fig-violet --fig-teal --fig-soft-blue --fig-soft-red --fig-soft-green --fig-soft-amber --fig-soft-violet --fig-soft-teal`.
  고정 색(#fff, black…) 금지(어두운 화면에서 깨짐). 실제 색이 내용인 경우(스펙트럼, 지시약 색 등)만 예외. 모든 도형에 fill 명시.
- 글자 13~15px(720 기준), `font-family` 지정 금지. 글자·도형이 겹치지 않게, viewBox 안에 여유.
- SVG 안의 id·class는 파일 이름을 접두어로(한 페이지에 여러 그림이 인라인으로 들어감).
- 비율이 실제와 다르면 "모식도"라고 밝힌다. 과학적으로 틀린 그림 금지. 래스터 이미지·외부 참조·스크립트 금지.
- 반복 도형이 많으면 scratchpad에 python 생성 스크립트를 두고 만들어도 된다.

## 3. 시뮬레이션(JS) — 공통
- 배정받은 시뮬레이션만 만든다. `Sims.register('이름', { title, caption, init(api) })`, 파일 하나로 완결, 외부 라이브러리 금지.
- **정확성**: 물리량·비율·방향이 맞아야 한다. 단순화·가정은 caption에 밝힌다. 그 단원의 교육과정 범위를 넘는 식·용어를 화면에 넣지 않는다.
- **멈춘 첫 화면만 보고도** 무엇을 보여 주는지 알 수 있어야 한다. `api.reduced`(움직임 줄이기)가 참이면 자동 재생하지 않고 버튼으로 단계 진행하거나 최종 상태를 바로 그린다.
- 조작은 슬라이더·버튼 1~4개. 입력 id는 `이름-…` 접두어. `api.readout`으로 숫자·상태를 보여 준다.
- 색·글꼴은 그릴 때마다 `api.tokens()`에서(테마가 바뀌면 다시 그려지도록 `api.onResize(draw)` 등록). 캔버스 글자 11px 이상.
- 휴대폰 폭(360px)에서도 겹치지 않게: `api.canvas({ aspect: function (w) { return w < 560 ? 세로비 : 가로비; } })`. 가로 스크롤 금지.
- `api.loop`의 콜백은 `dt`가 0보다 클 때만 계산한다. 움직일 필요가 없으면 `pause()`.
- caption: 무엇을 해 보면 되는지 + 핵심 깨달음 + 단순화·가정(2~4문장).

## 4. 3D 시뮬레이션 — `api.scene3d`
입체 구조·공간 배치가 핵심인 개념(분자·결정 구조, DNA, 천체의 운동, 자기장, 전자기파 등)에 쓴다.
```js
var S = api.scene3d({
  yaw: 0.6, pitch: 0.35,      // 처음 시점(라디안)
  dist: 9, scale: 0.16,       // 카메라 거리, 화면 크기 대비 배율(장면 크기에 맞게 조절)
  label: '접근성 설명',
  draw: function (g, T, S) {  // 다시 그릴 때마다 호출. g로 도형을 추가하면 깊이 순서대로 자동 정렬해 그린다
    g.sphere([0, 0, 0], 0.5, T.figBlue, { label: 'O' });
    g.line([0, 0, 0], [1, 1, 0], T.figLine, { width: 3 });
    g.circle([0, 0, 0], 2, [0, 1, 0], T.figMuted, { dash: [4, 4] });   // y축에 수직인 평면의 원(궤도)
    g.poly([[...], [...], [...]], T.figSoftBlue, { alpha: 0.4 });
    g.arrow([0, 0, 0], [0, 1.5, 0], T.figRed);
    g.text([0, 1.7, 0], '자전축', { size: 12 });
  },
});
S.redraw();                    // 상태가 바뀌면 호출
S.onFrame(function (dt, t) { … });   // 움직이는 장면(공전 등). 안에서 상태만 바꾸면 자동으로 다시 그린다
S.setAutoRotate(true);         // 자동 회전(사용자가 버튼으로도 켜고 끌 수 있다)
```
- 좌표: x 오른쪽, y 위, z 보는 사람 쪽. 장면은 원점 중심, 대략 반지름 3 안에 들어오게 잡고 `scale`로 맞춘다.
- '자동 회전', '위아래로 기울이기', '처음 시점' 버튼과 "끌어서 돌려 보기" 안내는 틀이 자동으로 넣는다.
- 공(sphere)이 많으면(수백 개) 느려진다. 200개 이하로.
- 긴 선·곡선은 `g.path(points, …)` 로 잘게 나눠 넣어야 공과의 앞뒤 관계가 맞게 그려진다.
- 2D로 충분한 내용을 억지로 3D로 만들지 않는다. 돌려 봐야 이해되는 것만.

## 5. 확인 (반드시)
```
cd /home/user/sciencebook/tools
node build.mjs m1-05 m1-06                 # 담당 단원 id만 (인자 없는 전체 빌드는 하지 말 것)
node screenshot.mjs ../docs/m1-05.html <scratchpad>/<담당이름>-a.png "figure.sim[data-sim=이름]" light 1280
node screenshot.mjs ../docs/m1-05.html <scratchpad>/<담당이름>-b.png "figure.sim[data-sim=이름]" dark 390
node screenshot.mjs ../docs/m1-05.html <scratchpad>/<담당이름>-c.png "#fig-m1-05-force-balance" dark 1280
```
- scratchpad: `/tmp/claude-0/-home-user-sciencebook/96b7e817-0e5e-5324-8416-180ac4e267af/scratchpad` (없으면 mkdir -p). 저장소 안에 확인용 파일을 만들지 않는다.
- 출력의 `오류: 없음`, `가로 넘침: 없음`, 시뮬레이션 `작동`을 확인하고, png를 Read 도구로 직접 본다(밝은·어두운 화면, 휴대폰 폭). 겹침·잘림·안 보이는 색을 고친다.
- 버튼을 누른 뒤 상태도 확인하려면 `tools/screenshot.mjs`를 scratchpad로 복사해 클릭·드래그를 추가한 스크립트를 쓴다.
- 휴대폰 폭에서 정적 그림이 그림 칸 안에서 가로로 밀리는 것은 공통 동작(정상)이다.

## 6. 하지 말 것
- `book.css`, `book.js`, `build.mjs`, `screenshot.mjs`, `book.json`, 다른 담당의 파일 수정. 공통 기능이 필요하면 최종 보고에 요청으로 적는다.
- 전체 빌드, git 커밋·푸시.

## 7. 최종 보고 (간결하게)
1. 만든 파일(그림·시뮬레이션)과 넣은 위치
2. 시뮬레이션별: 무엇을 조작하면 무엇을 보여 주는지, 단순화·가정
3. 확인 결과(오류·가로 넘침·작동), 원고에서 발견한 오류 의심, 공통 기능 요청
