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

## 보강 작업 (그림·바로 확인·중간/고난도 문항) — 진행 중

지침: `ENHANCE_BRIEF.md`. 점검: `python3 tools/authoring/check_lesson.py --enhanced`. 지도 그림 밑그림: `basemap.mjs`.
단계: 보강(E) → 새로 넣은 문항 검토(C). 한 번에 12개 묶음 안팎으로 돌린다.

| 묶음 | 단원 | E | C |
|---|---|---|---|
| e-m-a | m1-01 m1-02 m1-03 | 완료 | |
| e-m-b | m1-04 m1-05 m1-06 | 완료 | |
| e-m-c | m1-07 m2-01 m2-02 | 진행 | |
| e-m-d | m2-03 m2-04 m2-05 | 완료 | |
| e-m-e | m2-06 m2-07 m2-08 | 완료 | |
| e-m-f | m3-01 m3-02 m3-03 | 완료 | |
| e-m-g | m3-04 m3-05 | 완료 | |
| e-m-h | m3-06 m3-07 m3-08 | 완료 | |
| e-i-1 | 1-1 1-2 1-3 1-4 | 완료 | |
| e-i-2 | 2-1 2-2 2-3 | 완료 | |
| e-i-3 | 2-4 2-5 2-6 | 완료 | |
| e-i-4 | 3-1 3-2 3-3 | 완료 | |
| e-i-5 | 3-4 3-5 3-6 | 진행 | |
| e-i-6 | 4-1 4-2 4-3 | 진행 | |
| e-i-7 | 4-4 4-5 | 진행 | |
| e-i-8 | 5-1 5-2 5-3 | 진행 | |
| e-i-9 | 5-4 5-5 5-6 | 진행 | |
| e-i-10 | 6-1 6-2 6-3 6-4 | 진행 | |
| e-phy | phy-1 phy-2 phy-3 | 진행 | |
| e-chem-a | chem-1 chem-2 | 진행 | |
| e-chem-b | chem-3 chem-4 | 진행 | |
| e-bio | bio-1 bio-2 bio-3 | 진행 | |
| e-earth | earth-1 earth-2 earth-3 | 진행 | |
| e-mech | mech-1 mech-2 mech-3 | | |
| e-emq | emq-1 emq-2 emq-3 | | |
| e-matter-a | matter-1 matter-2 | | |
| e-matter-b | matter-3 matter-4 | | |
| e-rxn | rxn-1 rxn-2 rxn-3 | | |
| e-cell | cell-1 cell-2 cell-3 | | |
| e-gene | gene-1 gene-2 gene-3 | | |
| e-esys | esys-1 esys-2 esys-3 | | |
| e-astro | astro-1 astro-2 astro-3 | | |
| e-uphy-a~d | uphy-1~12 (3개씩) | | |
| e-uchem-a~d | uchem-1~12 (3개씩) | | |
| e-ubio-a~e | ubio-1~13 (3·3·3·2·2) | | |
| e-uearth-a~d | uearth-1~11 (3·3·3·2) | | |
