# 가져온 외부 스킬 안내

`agent-skills-정리.md`(2026-09-24)에 있는 60개 중에서 **이 저장소(정보 수업 활동지)에 실제로 쓸 만한 것**만 골라
`.claude/skills/` 에 넣었습니다. 우리가 만든 스킬(`lesson-*` · `skill-guide`)은 `.claude/README.md` 를 보세요.

## 한눈에

| 스킬 | 무엇을 | 부르는 법 | 저절로 켜지나 |
|---|---|---|---|
| **napkin** | 이 저장소에서 반복된 실수·요령을 `.claude/napkin.md` 한 장에 모아 두고 매 세션 참고 | 부를 필요 없음 | ✅ 매 세션 |
| **better-interface** | 화면 하나를 접근성·레이아웃·문구·타이포·색·UI 다듬기 6분야로 검수해 **최대 15개**로 정리 | `/better-interface` · "06 화면 검수해줘" | ✅ 검수 요청 시 |
| **interface-review** | **이번에 바꾼 것만** 검수(커밋 안 한 수정·브랜치) — "내가 더 나쁘게 만들었나?" | `/interface-review` | ❌ 직접 불러야 함 |
| better-accessibility · better-layout · better-writing · better-typography · better-colors · better-ui | 위 두 스킬이 쓰는 분야별 기준. 하나만 따로 불러도 됨 | `/better-accessibility` 등 · "색 대비 확인해줘" | ✅ 해당 요청 시 |
| **i-have-adhd** | 답을 "다음 할 일 먼저 · 단계 번호 · 목록 5개까지 · 인사말·요약 없음" 형태로 | `/i-have-adhd` (끄기: "stop adhd mode") | ❌ 직접 불러야 함 |

## 이 프로젝트에서 이렇게 써요

### 1. napkin — 같은 실수 두 번 안 하기

- 새 세션이 시작되면 Claude 가 `.claude/napkin.md` 를 먼저 읽고 그대로 따릅니다(따로 말할 필요 없음).
- 작업 중에 "이건 다음에도 또 나오겠다" 싶은 요령이 생기면 Claude 가 한 줄씩 추가·정리합니다. 분류별 10개까지만 남겨요.
- 처음 내용은 구조 개편 때 겪은 것들로 채워 뒀어요(dist 직접 수정 금지, `--find` 캡처, x-dc querySelector 함정 등).
- 직접 부탁해도 돼요: "이거 napkin 에 적어둬", "napkin 정리해줘".

### 2. better-interface / interface-review — 배포 전 검수

| 상황 | 이렇게 말하기 |
|---|---|
| 한 차시를 통째로 새 눈으로 보고 싶다 | `/lesson-check 06 새 눈으로 검수` → 서브에이전트가 **better-interface** 방식으로 검수해 보고 |
| 방금 고친 것만 확인하고 싶다 (커밋 전) | `/interface-review` |
| 한 분야만 | "06 색 대비 확인해줘"(better-colors · better-accessibility), "빈칸 문구 다듬어줘"(better-writing) |

- 결과는 `HIGH / MEDIUM / LOW` 심각도와 `파일:줄` 근거가 붙은 목록으로 와요. 고칠 항목을 고르면 `lesson-edit` 규칙대로 고칩니다.
- **우선순위**: 이 스킬들은 일반적인 웹 기준이라 "새 팔레트 만들기" 같은 제안도 합니다. 이 저장소에서는
  `docs/rules/design.md` 토큰이 이깁니다 — 토큰 밖 색·서체는 **제안만 받고 적용하지 않아요**(`lesson-edit` 규칙에 적어 둠).
- better-writing 은 예시가 영어지만 "짧고 분명하게·용어 통일·상황에 맞는 어조" 원칙은 한국어 발문·안내 문구에도 그대로 통해요.

### 3. i-have-adhd — 답을 짧고 실행 순서대로

- `/i-have-adhd` 한 번이면 그 세션이 끝날 때까지 유지돼요. 끄려면 "stop adhd mode" 또는 "normal mode".
- 여러 차시를 연달아 고칠 때 "지금 몇 단계째, 다음에 할 일"이 매번 첫 줄에 오게 할 때 좋아요.
- "설명해줘/자세히" 라고 하면 그때만 길게 답하고, 지우기·강제 push 같은 위험한 일 앞에서는 확인부터 합니다.

## 이 컴퓨터 전역에 설치한 스킬 — impeccable (2026-10-15)

위 스킬들과 달리 **이 저장소가 아니라 내 컴퓨터의 `~/.claude/` 에** 설치했어요. 그래서 이 컴퓨터의 **모든 프로젝트**에서 쓸 수 있고,
저장소(git)에는 아무것도 올라가지 않아요. 다른 컴퓨터에서 이 저장소를 열면 이 스킬은 없어요.

### 무엇인가

- 화면(웹 UI) 디자인을 계획·검수·다듬기 하는 스킬 묶음. 명령 하나(`/impeccable`) 아래에 하위 명령 24개가 있어요.
- 설치된 곳
  - 스킬: `~/.claude/skills/impeccable/` (검사 프로그램 `impeccable.exe` 포함, Node 없이 돌아감)
  - 보조 에이전트 4개: `~/.claude/agents/impeccable-*.md` (완성본 검토·DESIGN.md 기록 등, 스킬이 알아서 부름)
  - **디자인 훅**: `~/.claude/settings.json` 의 `hooks` — Claude 가 `.html`·`.css`·`.js` 등을 고칠 때마다 빠른 검사,
    한 턴이 끝날 때 정밀 검사(최대 30초)를 해서 지적 사항을 Claude 에게 넘겨요. 각 프로젝트에 `.impeccable/` 캐시 폴더가 생겨요(git 에는 안 잡힘).

### 부르는 법

1. **프로젝트마다 처음 한 번** `/impeccable init` — 이 프로젝트가 무엇인지(대상·목적·분위기) 묻고 `PRODUCT.md` 에 적어요.
2. 그다음엔 `/impeccable <명령> <대상>` (예: `/impeccable audit 07 활동지`). `/impeccable` 만 치면 상황에 맞는 메뉴를 보여 줘요.
3. 명령 없이 "이 화면 디자인 다듬어줘"처럼 말해도 Claude 가 알아서 이 스킬을 부를 수 있어요.
4. 자주 쓰는 명령은 `/impeccable pin audit` → 다음부터 `/audit` 만 쳐도 돼요(빼기: `/impeccable unpin audit`).

| 묶음 | 명령 | 하는 일 |
|---|---|---|
| 만들기 | `shape` · `init` · `document` · `extract` | 코드 전에 화면 계획 · 프로젝트 정보(`PRODUCT.md`) · 지금 코드로 `DESIGN.md` 만들기 · 토큰·부품 뽑기 |
| 평가 | `critique` · `audit` | UX 리뷰(점수 포함) · 기술 점검(접근성·성능·반응형) |
| 다듬기 | `polish` · `bolder` · `quieter` · `distill` · `harden` · `onboard` | 배포 전 마무리 · 더 강하게 · 더 차분하게 · 군더더기 빼기 · 오류·예외 상황 대비 · 첫 화면·빈 화면 |
| 더하기 | `animate` · `colorize` · `typeset` · `layout` · `delight` · `overdrive` | 움직임 · 색 · 글꼴 위계 · 간격·배치 · 개성 · 한계까지 밀어붙이기 |
| 고치기 | `clarify` · `adapt` · `optimize` | 문구·안내·오류 메시지 · 화면 크기별 맞춤 · 속도 |
| 반복 | `live` · `generate` | 브라우저에서 요소를 골라 여러 시안 비교 |

### 이 저장소에서 쓸 때 주의

- **디자인 기준은 여전히 `docs/rules/design.md` 가 이겨요.** impeccable 이나 훅이 토큰 밖 색·서체·새 스타일을 제안하면
  better-* 스킬과 똑같이 **제안만 받고 적용하지 않아요**(`lesson-edit` 규칙).
- `init`·`document` 는 저장소 맨 위에 `PRODUCT.md`·`DESIGN.md` 를 만들어요. 이 저장소에서 돌릴지는 먼저 정하고 쓰세요(올릴지·`.gitignore` 할지).
- 훅이 거슬리면 `~/.claude/settings.json` 의 `hooks` 항목만 지우면 꺼져요(스킬은 그대로). 설치 전 설정 백업: `~/.claude/settings.json.bak-before-impeccable`.
- **업데이트**: 공식 명령은 `npx impeccable update` 지만, 홈 폴더에서 돌리면 훅이 `~/.claude/settings.local.json`(홈 폴더에서 일할 때만 켜지는 파일)에
  들어가요(설치 때 실제로 그랬음). 돌린 뒤 훅이 `settings.json` 에 있는지 확인하거나, Claude 에게 "impeccable 업데이트해줘"라고 맡기세요.

## 출처 · 라이선스 · 업데이트

| 스킬 | 출처 | 가져온 판 | 라이선스 |
|---|---|---|---|
| better-interface, interface-review, better-accessibility, better-layout, better-writing, better-typography, better-colors, better-ui | github.com/jakubkrehel/skills | `267330e` (2026-08-29) | MIT (각 폴더 LICENSE) |
| napkin | github.com/blader/napkin | `27fa60a` (2026-02-20) | MIT |
| i-have-adhd | github.com/ayghri/i-have-adhd | `839872f` (2026-09-19) | MIT |
| impeccable (전역, 저장소 밖) | github.com/pbakaus/impeccable | 스킬 v4.5.2 · 엔진 v0.1.14 (2026-10-15, `npx impeccable install`) | Apache-2.0 |

- 가져온 뒤 **내용은 고치지 않았어요**(원본 그대로 + LICENSE 추가). 이 프로젝트에 맞춘 규칙은 우리 스킬(`lesson-*`)과 `napkin.md` 쪽에 적었습니다.
- 새 판으로 바꾸고 싶으면: 원본 저장소의 해당 스킬 폴더를 받아 같은 이름 폴더를 통째로 덮어쓰고, 위 표의 판 번호를 고치면 됩니다.

## 검토했지만 넣지 않은 것

| 이름 | 안 넣은 이유 | 대신 |
|---|---|---|
| transitions.dev | 저장소에 **라이선스 표시가 없고** 유료(Pro) 판이 섞인 서비스라, 공개 저장소에 복사해 두면 안 돼요 | 필요하면 저장소 밖(내 컴퓨터의 전역 스킬 폴더 `~/.claude/skills`)에만 설치하거나, transitions.dev 사이트에서 CSS 를 복사해 쓰기 |
| frontend-design · ui-ux-pro-max · taste-skill | "브리프마다 새 팔레트·새 스타일"을 만드는 스킬이라 고정된 디자인 시스템(`design.md`)과 정면으로 부딪혀요 | 새 **다른** 웹앱을 만들 때 전역 design-system 스킬과 함께 |
| addyosmani/accessibility | better-accessibility 와 겹쳐서 둘 다 켜지면 같은 걸 두 번 봐요 | better-accessibility |
| frontend-slides | 좋은 수업 슬라이드 도구지만 이 저장소는 활동지 전용 — 빌드·배포 흐름에 안 들어가요 | 슬라이드용 폴더/저장소를 따로 만들 때 |
| napkin 외 작업 규율 묶음(superpowers · spec-kit · OpenSpec · agent-skills) | 우리 `lesson-*` 흐름과 역할이 겹치고 무거워요 | — |
| context7 (MCP) | 쓰는 라이브러리(React 18·jsPDF 2.5·html2canvas 1.4)가 고정돼 있어 최신 문서 주입이 거의 필요 없어요 | — |
