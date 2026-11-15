# 단원별 시뮬레이션 계획

이름은 `docs/assets/js/sims/{이름}.js` 파일 이름이자 `<!-- sim:이름 -->` 표식이다. **3D** 표시는 `api.scene3d`로 만드는 입체 모형.
원고를 읽고 더 알맞은 주제가 있으면 같은 개수 안에서 바꿔도 된다(이름은 영문 소문자·하이픈, 다른 단원과 겹치지 않게). "없음"인 단원은 그림만 만든다.

## 중학교
| 단원 | 시뮬레이션 |
|---|---|
| m1-01 과학과 인류의 지속가능한 삶 | 없음 |
| m1-02 생물의 구성과 다양성 | `kingdom-sort` 생물을 특징에 따라 5계로 분류해 보기(2D) |
| m1-03 열 | `heat-equilibrium` 온도가 다른 두 물체의 입자 운동과 열평형, 시간–온도 그래프(2D) |
| m1-04 물질의 상태 변화 | `state-change` 가열·냉각 곡선과 고체·액체·기체 입자 모형(2D) |
| m1-05 힘의 작용 | `force-balance` 나란한 두 힘의 합성, 알짜힘과 물체의 운동 상태 변화(2D) |
| m1-06 기체의 성질 | `gas-laws` 피스톤 속 입자 모형으로 압력–부피, 온도–부피 관계(2D) |
| m1-07 태양계 | **3D** `moon-phases` 달의 공전과 위상 변화, 일식·월식 위치 |
| m2-01 물질의 특성 | `density-lab` 질량·부피로 밀도 구하기와 뜨고 가라앉기(2D) |
| m2-02 지권의 변화 | `rock-cycle` 암석의 순환 과정 따라가기(2D) |
| m2-03 빛과 파동 | `reflect-refract` 입사각을 바꾸며 반사·굴절 광선 보기(2D), `sound-wave` 진폭·진동수와 파형(2D) |
| m2-04 물질의 구성 | **3D** `molecule-models` 물·이산화 탄소·암모니아·메테인 등 분자 모형 돌려 보기 |
| m2-05 식물과 에너지 | `photosynthesis-lab` 빛의 세기·이산화 탄소 농도·온도와 광합성량(2D) |
| m2-06 동물과 에너지 | `blood-circulation` 온몸 순환과 폐순환 경로, 산소가 많은 혈액·적은 혈액(2D) |
| m2-07 전기와 자기 | `ohm-circuit` 전압·저항과 전류, 직렬·병렬 연결(2D), **3D** `motor-3d` 자기장 속 전류가 흐르는 코일이 받는 힘과 전동기 |
| m2-08 별과 우주 | `parallax` 연주시차와 별까지의 거리(2D), **3D** `milky-way` 우리은하의 구조와 태양계의 위치 |
| m3-01 화학 반응의 규칙성 | `reaction-balance` 입자 모형으로 화학 반응식 계수 맞추기와 질량 보존(2D) |
| m3-02 날씨와 기후변화 | `cloud-formation` 상승하는 공기 덩어리의 단열 팽창·이슬점·구름 생성(2D) |
| m3-03 수권과 해수의 순환 | `seawater-profile` 깊이에 따른 수온 분포와 계절·바람의 영향(2D) |
| m3-04 운동과 에너지 | `motion-graphs` 등속 운동·속력이 일정하게 변하는 운동의 그래프(2D), `energy-coaster` 위치 에너지와 운동 에너지의 전환·보존(2D) |
| m3-05 자극과 반응 | `reflex-arc` 자극에서 반응까지의 경로: 의식적인 반응과 무조건 반사(2D) |
| m3-06 생식과 유전 | `cell-division` 체세포분열과 생식세포 형성 과정의 염색체 행동(2D), `mendel-cross` 멘델 교배 실험과 자손의 비(2D) |
| m3-07 재해·재난과 안전 | 없음 |
| m3-08 과학과 나의 미래 | 없음 |

## 고등학교 일반 선택
| 단원 | 시뮬레이션 |
|---|---|
| phy-1 힘과 에너지 | `collision-1d` 두 물체의 충돌과 운동량 보존(2D), 필요하면 1개 더 |
| phy-2 전기와 자기 | `electric-field` 전하 배치와 전기장·전기력선(2D), **3D** `current-magnetic-field` 직선 전류·원형 전류·솔레노이드 주위 자기장 |
| phy-3 빛과 물질 | `photoelectric` 광전 효과(2D), `wave-interference` 파동의 중첩·간섭(2D) |
| chem-1 화학의 언어 | `mole-converter` 몰과 입자 수·질량·기체 부피(2D) |
| chem-2 물질의 구조와 성질 | **3D** `vsepr` 전자쌍 반발과 분자 구조 |
| chem-3 화학 평형 | `equilibrium` 정반응·역반응 속도와 농도 변화, 조건 변화에 따른 평형 이동(2D) |
| chem-4 역동적인 화학 반응 | 원고의 핵심 내용에 맞춰 1개(2D) |
| bio-1 생명 시스템의 구성 | 원고의 핵심 내용에 맞춰 1개(2D) |
| bio-2 항상성과 몸의 조절 | `action-potential` 활동 전위와 흥분 전도(2D), `blood-glucose` 혈당량 조절의 음성 피드백(2D) |
| bio-3 생명의 연속성과 다양성 | `meiosis-variation` 감수 분열과 유전적 다양성(2D) |
| earth-1 대기와 해양의 상호작용 | 원고의 핵심 내용에 맞춰 1개(2D, 예: 온대 저기압과 전선의 이동) |
| earth-2 지구의 역사와 한반도의 암석 | `radiometric-dating` 방사성 동위 원소의 붕괴와 절대 연령(2D) |
| earth-3 태양계 천체와 별과 우주의 진화 | `hr-diagram` H–R도와 별의 진화(2D), 필요하면 1개 더 |

## 고등학교 진로 선택
| 단원 | 시뮬레이션 |
|---|---|
| mech-1 시공간과 운동 | `projectile-angle` 비스듬히 던진 물체의 운동(2D), `light-clock` 빛 시계와 시간 지연(2D) |
| mech-2 열과 에너지 | `pv-diagram` 기체의 상태 변화와 압력–부피 그래프, 열기관(2D) |
| mech-3 탄성파와 소리 | `standing-wave` 정상파와 공명(2D), `doppler` 도플러 효과(2D) |
| emq-1 전자기적 상호작용 | **3D** `charge-in-field` 자기장 속 전하의 운동, 필요하면 2D 1개 |
| emq-2 빛과 정보 통신 | **3D** `em-wave` 전기장과 자기장이 수직으로 진동하며 나아가는 전자기파, `lens-image` 렌즈와 상(2D) |
| emq-3 양자와 미시세계 | **3D** `electron-cloud` 원자의 전자 구름(확률 분포), `quantum-tunnel` 터널 효과(2D) — 원고 범위에 맞게 |
| matter-1 물질의 세 가지 상태 | **3D** `crystal-structures` 고체의 결정 구조, `ideal-gas` 이상 기체의 압력·부피·온도·입자 수(2D) |
| matter-2 용액의 성질 | `colligative` 용액의 농도와 끓는점 오름·어는점 내림·삼투압(2D) |
| matter-3 화학 변화의 자발성 | `entropy-gibbs` 엔트로피와 자유 에너지로 보는 자발성(2D) |
| matter-4 반응 속도 | `collision-theory` 충돌, 활성화 에너지, 온도·촉매의 영향(2D) |
| rxn-1 산·염기 평형 | `titration-curve` 중화 적정 곡선과 완충 작용(2D) |
| rxn-2 산화·환원 반응 | `galvanic-cell` 화학 전지와 전기 분해에서 전자의 이동(2D) |
| rxn-3 탄소 화합물과 반응 | **3D** `organic-molecules` 탄소 화합물의 입체 구조 |
| cell-1 세포 | `membrane-transport` 세포막을 통한 물질 이동 방식 비교(2D) |
| cell-2 물질대사와 에너지 | `enzyme-kinetics` 기질 농도·저해제와 효소 반응 속도(2D) |
| cell-3 세포호흡과 광합성 | `chemiosmosis` 전자 전달과 화학 삼투에 의한 ATP 합성(2D) |
| gene-1 유전자와 유전물질 | **3D** `dna-3d` DNA 이중 나선 구조, `dna-replication` 반보존적 복제(2D) |
| gene-2 유전자의 발현 | `operon` 오페론을 통한 유전자 발현 조절(2D) |
| gene-3 생명공학기술 | 원고의 핵심 기술에 맞춰 1개(2D, 예: 제한 효소와 재조합 DNA, 전기 영동) |
| esys-1 지구 탄생과 생동하는 지구 | `seismic-waves` 지진파의 전파와 지구 내부 구조(2D) |
| esys-2 해수의 운동 | `ocean-waves` 해파와 물 입자의 운동(2D), `tides` 조석과 달·태양(2D) |
| esys-3 강수 과정과 대기의 운동 | `geostrophic-wind` 기압 경도력·전향력과 바람(2D), **3D** `coriolis-globe` 자전하는 지구 위에서의 전향력 |
| astro-1 우주탐사와 행성계 | **3D** `solar-system-orbits` 행성의 궤도와 케플러 법칙, `exoplanet-transit` 식 현상으로 외계 행성 찾기(2D) |
| astro-2 태양과 별의 관측 | **3D** `celestial-sphere` 천구와 좌표계·일주 운동, 필요하면 2D 1개 |
| astro-3 은하와 우주 | `hubble-expansion` 허블 법칙과 우주 팽창(2D), `rotation-curve` 은하 회전 곡선과 암흑 물질(2D) |
