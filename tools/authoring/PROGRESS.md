# 진행 상황 (작업 기록)

단계: 집필(W) → 검토(R) → 그림·시뮬레이션(V)

| 묶음 | 단원 | W | R | V |
|---|---|---|---|---|
| A | m1-01 m1-02 m1-03 | 완료 | 완료 | 완료 |
| B | m1-04 m1-05 m1-06 | 완료 | 완료 | 완료 |
| C | m1-07 m2-01 m2-02 | 완료 | 완료 | 완료 |
| D | m2-03 m2-04 m2-05 | 완료 | 완료 | 완료 |
| E | m2-06 m2-07 m2-08 | 완료 | 완료 | 완료 |
| F | m3-01 m3-02 m3-03 | 완료 | 완료 | 완료 |
| G | m3-04 m3-05 | 완료 | 완료 | 완료 |
| H | m3-06 m3-07 m3-08 | 완료 | 완료 | 완료 |
| phy | phy-1~3 | 완료 | 완료 | 완료 |
| chem | chem-1~4 | 완료 | 완료 | 완료 |
| bio | bio-1~3 | 완료 | 완료 | 완료 |
| earth | earth-1~3 | 완료 | 완료 | 완료 |
| mech | mech-1~3 | 완료 | 완료 | 완료 |
| emq | emq-1~3 | 완료 | 완료 | 완료 |
| matter | matter-1~4 | 완료 | 완료 | 완료 |
| rxn | rxn-1~3 | 완료 | 완료 | 완료 |
| cell | cell-1~3 | 완료 | 완료 | 완료 |
| gene | gene-1~3 | 완료 | 완료 | 완료 |
| esys | esys-1~3 | 완료 | 완료 | 완료 |
| astro | astro-1~3 | 완료 | 완료 | 완료 |

## 마무리 상태

- 단원 92개, 그림(SVG) 209개, 시뮬레이션 101개(3D 15개) 완성.
- `node tools/build.mjs` 전체 빌드, `python3 tools/authoring/check_lesson.py`(문제 0), `node tools/qa.mjs`(문제 0) 통과.
- 그림 번호는 `python3 tools/authoring/renumber_figs.py --write` 로 원고 순서에 맞춘다(그림을 더하거나 옮긴 뒤 실행).
- 학습 기록(읽던 위치·읽은 정도·완료 표시)은 `docs/assets/js/book.js`의 Progress 모듈. 독자 기기의 브라우저(localStorage `sb-progress`)에만 저장한다.
- `download/sciencebook-web.zip` 은 `docs/` 를 묶은 오프라인용 사본(압축을 풀고 index.html을 연다). 사이트를 다시 만든 뒤에는 새로 묶는다.

## 대학 일반 과학 (48개 단원) — 완료

지침: `UNIV_GUIDE.md`. 단계: 집필(W) → 검토(R) → 그림·시뮬레이션(V)

| 묶음 | 단원 | W | R | V |
|---|---|---|---|---|
| uphy-a | uphy-1 uphy-2 uphy-3 | 완료 | 완료 | 완료 |
| uphy-b | uphy-4 uphy-5 uphy-6 | 완료 | 완료 | 완료 |
| uphy-c | uphy-7 uphy-8 uphy-9 | 완료 | 완료 | 완료 |
| uphy-d | uphy-10 uphy-11 uphy-12 | 완료 | 완료 | 완료 |
| uchem-a | uchem-1 uchem-2 uchem-3 | 완료 | 완료 | 완료 |
| uchem-b | uchem-4 uchem-5 uchem-6 | 완료 | 완료 | 완료 |
| uchem-c | uchem-7 uchem-8 uchem-9 | 완료 | 완료 | 완료 |
| uchem-d | uchem-10 uchem-11 uchem-12 | 완료 | 완료 | 완료 |
| ubio-a | ubio-1 ubio-2 ubio-3 | 완료 | 완료 | 완료 |
| ubio-b | ubio-4 ubio-5 ubio-6 | 완료 | 완료 | 완료 |
| ubio-c | ubio-7 ubio-8 ubio-9 | 완료 | 완료 | 완료 |
| ubio-d | ubio-10 ubio-11 | 완료 | 완료 | 완료 |
| ubio-e | ubio-12 ubio-13 | 완료 | 완료 | 완료 |
| uearth-a | uearth-1 uearth-2 uearth-3 | 완료 | 완료 | 완료 |
| uearth-b | uearth-4 uearth-5 uearth-6 | 완료 | 완료 | 완료 |
| uearth-c | uearth-7 uearth-8 uearth-9 | 완료 | 완료 | 완료 |
| uearth-d | uearth-10 uearth-11 | 완료 | 완료 | 완료 |

완료 상태: 책 전체 단원 140개, 그림 353개, 시뮬레이션 193개(3D 21개). 전체 빌드·check_lesson·qa 모두 통과.

## 보강 작업 (그림·바로 확인·중간/고난도 문항) — 완료

순서: 보강(E, `ENHANCE_BRIEF.md`) → 보강분 검토(C, `ENHANCE_REVIEW_BRIEF.md`) → 그림 번호 다시 매기기(`renumber_figs.py --write`) → 전체 빌드·점검.

| 구분 | 단원 | E | C |
|---|---|---|---|
| 중학교 | m1-01 ~ m3-08 (23개) | 완료 | 완료 |
| 통합과학 | 1-1 ~ 6-4 (31개) | 완료 | 완료 |
| 고등학교 일반 선택 | phy, chem, bio, earth (13개) | 완료 | 완료 |
| 고등학교 진로 선택 | mech, emq, matter, rxn, cell, gene, esys, astro (25개) | 완료 | 완료 |
| 대학 일반 과학 | uphy, uchem, ubio, uearth (48개) | 완료 | 완료 |

### 마무리 상태

- 단원 140개, 그림(SVG) 1005개(보강으로 652개 추가), 시뮬레이션 193개(3D 21개).
- 바로 확인 1033곳(3712문항), 실력 다지기 534문항, 도전 342문항 추가.
- `check_lesson.py --enhanced` 140개 모두 OK, `qa.mjs` 147쪽 × 2가지 화면 문제 없음.
- 검토에서 고친 것(대표): 범위 밖 문항 교체·단서 추가, 해설 수치·논리 오류, 문항과 해설 불일치, 그림의 방향·이름표 뒤바뀜(배사/향사, 천구의 동서, DNA 나선 방향, 궤도 방향, 바람대 화살표), 힘 화살표 길이 비율, 지시점 위치, 지도 이름표 위치, 글자 겹침·잘림, 어두운 화면에서 뒤집히는 색.
- 그림 생성기에서 생긴 결함 두 가지는 전체 SVG를 훑어 고쳤다: 숫자로 시작하는 CSS 클래스 이름(스타일이 적용되지 않음), 속성 이름에 들어간 유니코드 마이너스(−).

### 다음에 보강할 때 알아 둘 것

- 그림을 새로 넣으면 끝에 `python3 tools/authoring/renumber_figs.py --write` 를 돌린다(SVG 제목 번호와 본문·그림 속 "그림 ○-○" 참조를 함께 고친다).
- 지도는 `basemap.mjs` 로 그린다. `--res 10m` 은 좁은 범위에서 육지·바다 채움이 뒤집히는 경우가 있어, 한반도 지도는 `--res 50m` 이 안전하다.
- 그림의 CSS 클래스 이름은 글자로 시작하게 한다(단원 id가 숫자로 시작하면 앞에 `f` 를 붙인다).

## 문항 그림 보충 (예제·바로 확인·확인 문제) — 완료

독자 요청: "예제, 바로 확인, 실력 다지기, 도전 문항에서도 그림 자료가 필요하다면 넣어서 문항 설명을 보충해 달라."

순서: 문항 그림 넣기(Q, `PROBLEM_FIGS_BRIEF.md`) → 검토(R, `PROBLEM_FIGS_REVIEW_BRIEF.md`) → 그림 번호 다시 매기기 → 전체 빌드·점검. 140개 단원 모두 Q·R 완료.

- 문항 그림 685개 추가(파일 이름에 `-q-`). 전체 그림 1689개.
- 문제 쪽 그림은 정답을 드러내지 않게 기호(A, B, (가), ㉠)만 붙이고, 풀이에 필요한 그림(자유 물체 도형, 작도, 그래프 위의 넓이 등)은 정답·해설(`<details>`) 안에 넣었다.
- 검토에서 고친 것(대표): 그림의 비율·색·설명 글(`<desc>`)로 정답이 드러나는 경우, 문제의 수치와 어긋난 화살표 길이·띠 굵기·색칠 범위, 뒤바뀐 방향(밸브 열림·닫힘, 공전 화살표, 기체 포집관 높이), 지시선 위치, 글자 겹침·잘림.
- 전체 SVG 를 훑어 고친 형식 결함: 글자 속의 날 부등호 `<`(→ `&lt;`. 그대로 두면 그림 아래 설명 글이 나오지 않는다), viewBox 아래 끝에 걸친 글자.
- `tools/figsheet.mjs` 는 접힌 해설 안의 그림도 펼쳐서 찍는다. `book.css` 의 `.fig-small`(viewBox 너비 420~480인 간단한 그림은 480px 보다 커지지 않는다)을 문항 그림에 쓴다.

## 대학 전공 과정 — 화학 (진행 중)

독자 요청: "일반 물리~지구과학에서 더 들어가 물리화학·유기화학 등 대학 2~4학년 수준의 교재도 만들어 달라." → 화학부터(물리화학·유기화학 → 무기·분석·생화학), 수학 도구 단원을 따로 두고, 학부 2~4학년 표준 범위까지.

지침: `MAJOR_GUIDE.md`(범위 66개 단원). 단계와 작업 지시:
집필(W, `MAJOR_WRITE_BRIEF.md`, 단원 1개씩) → 검토(R, `MAJOR_REVIEW_BRIEF.md`) → 그림·시뮬레이션(V, `MAJOR_VISUALS_BRIEF.md`, 단원 1개씩) → 그림 검토(VR, `MAJOR_VISUALS_REVIEW_BRIEF.md`) → 그림 번호 정리·전체 빌드·점검.

- 원고는 처음부터 완성본(바로 확인, 문제 5단계)으로 쓰고, 그림 자리는 `<!-- 그림 요청: … -->` 주석으로 남긴다. V 단계에서 표식으로 바꾼다(끝나면 `grep -rn "요청:" 대학_전공과정` 이 비어야 한다).
- 구조식은 `tools/authoring/molsvg.py`(RDKit 필요: `pip install rdkit`)로 그린다. 시뮬레이션 이름은 `mj-` 로 시작.
- id: umath-1~8(수학 도구), pchem-1~12, ochem-1~14, ichem-1~10, achem-1~10, bchem-1~12. 폴더 `대학_전공과정/`.

| 과목 | W | R | V | VR |
|---|---|---|---|---|
| 수학 도구 umath-1~8 | 진행 중 | | | |
| 물리화학 pchem-1~12 | 1~6 진행 중 | | | |
| 유기화학 ochem-1~14 | | | | |
| 무기화학 ichem-1~10 | | | | |
| 분석화학 achem-1~10 | | | | |
| 생화학 bchem-1~12 | | | | |

끝낼 때 할 일: `book.json` 의 subtitle("…대학 일반 과학까지" → 전공 과정까지), README·교재_설계_안내.md 의 단원 수·구성 표, `LESSONS.md` 에 전공 단원 표 추가, 표지 문구(build.mjs coverBody 의 근거 문장), `download/sciencebook-web.zip` 갱신.
