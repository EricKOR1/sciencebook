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

## 대학 일반 과학 (48개 단원) — 진행 중

지침: `UNIV_GUIDE.md`. 단계: 집필(W) → 검토(R) → 그림·시뮬레이션(V)

| 묶음 | 단원 | W | R | V |
|---|---|---|---|---|
| uphy-a | uphy-1 uphy-2 uphy-3 | 진행 | | |
| uphy-b | uphy-4 uphy-5 uphy-6 | 진행 | | |
| uphy-c | uphy-7 uphy-8 uphy-9 | 진행 | | |
| uphy-d | uphy-10 uphy-11 uphy-12 | 진행 | | |
| uchem-a | uchem-1 uchem-2 uchem-3 | 진행 | | |
| uchem-b | uchem-4 uchem-5 uchem-6 | 진행 | | |
| uchem-c | uchem-7 uchem-8 uchem-9 | 진행 | | |
| uchem-d | uchem-10 uchem-11 uchem-12 | 진행 | | |
| ubio-a | ubio-1 ubio-2 ubio-3 | 진행 | | |
| ubio-b | ubio-4 ubio-5 ubio-6 | 진행 | | |
| ubio-c | ubio-7 ubio-8 ubio-9 | 진행 | | |
| ubio-d | ubio-10 ubio-11 | 진행 | | |
| ubio-e | ubio-12 ubio-13 | 진행 | | |
| uearth-a | uearth-1 uearth-2 uearth-3 | 진행 | | |
| uearth-b | uearth-4 uearth-5 uearth-6 | 진행 | | |
| uearth-c | uearth-7 uearth-8 uearth-9 | 진행 | | |
| uearth-d | uearth-10 uearth-11 | 진행 | | |

마무리 때 할 일: 전체 빌드·qa·check, renumber_figs, README·교재_설계_안내·`m3-08-book-map.svg`(단계별 단원 수)·오프라인 묶음 갱신.
