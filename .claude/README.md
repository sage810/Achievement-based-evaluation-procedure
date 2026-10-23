# 스킬 모음 — 무엇이 있고 어떻게 부르나

이 저장소에는 **우리가 만든 스킬 8개(`lesson-*` · `skill-guide`)** 와 **가져온 외부 스킬 10개**가 있고, **에이전트는 없습니다.**
모든 일은 메인 대화에서 선생님과 주고받으며 하고, "새 눈으로 검수"처럼 따로 떼는 게 나은 일만 `lesson-check` 가 필요할 때
기본(범용) 서브에이전트를 잠깐 씁니다. (같은 서브에이전트 호출을 자꾸 반복하게 되면 그때 `.claude/agents/` 에 하나씩 추가.)

- 가져온 외부 스킬(napkin · better-interface 묶음 · interface-review · i-have-adhd)의 자세한 설명·호출법·출처는
  **[`external-skills.md`](external-skills.md)** 를 보세요.
- `.claude/napkin.md` 는 napkin 스킬이 관리하는 "이 저장소 요령 모음"이에요. 매 세션 시작 때 읽힙니다.

## 우리 스킬

| 스킬 | 언제 | 이렇게 말하면 돼요 | 하는 일 |
|---|---|---|---|
| **lesson-edit** | 활동지를 고칠 때 (가장 많이 씀) | `/lesson-edit 06 MISSION_1 이유 카드 삭제` · "6차시 이상치 부분 빈칸으로" · "이 파일 06차시로 가져와줘" | lesson.html 최소 수정 → 빌드 → 브라우저 자동 검사 → 고친 곳 캡처 확인 |
| **lesson-new** | 새 차시를 처음 만들 때 | `/lesson-new 08 유튜브 데이터로 관계 분석` · "이 PDF 로 8차시 만들어줘" | 아이디어 2~3개 → 선택 → spec.md → 차시 폴더 → 본문 조립 (단계마다 멈춰서 확인) |
| **lesson-teacher** | 교사용 화면·정답지 PDF | `/lesson-teacher 06` · "6차시 정답지 PDF" | answers.json 채우기 → `npm run teacher` → PDF 확인 |
| **lesson-exam** | 수행평가(시험지)를 만들 때 | `/lesson-exam` · "수행평가 B형 만들어줘" | 결정 묻기 → 비공개(.gitignore) 먼저 → 09 틀로 시험지 → answers.json(정답·허용 답·배점) → 검사·정답 노출 검사·exam-key 합계 → 제출 가로채 시험 → 선생님 체크리스트 (기준: `docs/rules/exam.md`) |
| **lesson-ppt** | 차시 활동지로 수업 PPT(캔바용)를 만들 때 | `/lesson-ppt ai/02` · "2차시 PPT 만들어줘" | spec.md 읽기 → 장 구성 `ppt.json` → `npm run ppt --check`(PowerPoint 로 넘침 0) → `--page` 받는 링크 게시 (기준: `docs/rules/ppt.md`) |
| **lesson-theme** | 차시 테마(색·모양)를 만들거나 입힐 때 | `/lesson-theme` · "Claude Design 이 테마 만들어줬어 (zip)" · "ai/02 에 sticker 입혀줘" · 테마 미리보기의 「아이콘 변경」 피드백 | 견본 읽기 → 결정 묻기 → `design/themes/<이름>/theme.css` → 틀 미리보기·견본 캡처 비교 → PDF 리허설 → 차시에 입히기(숫자 차시는 변수로 바꾸고 전후 같음 확인) → 아이콘 그림 (기준: `docs/rules/theme.md`) |
| **lesson-check** | 배포 전 점검·검수 | `/lesson-check 06` · "05, 06 새 눈으로 검수해줘" | 자동 검사 + (요청 시) 서브에이전트가 better-interface 방식으로 검수 → 고를 항목만 수정 |
| **skill-guide** | 어떤 스킬을 어떻게 쓸지 보고 고르고 싶을 때 | `? 06 빈칸 안내 문구 다듬어줘` · `스킬: 06 색 대비 확인` · `/skill-guide …` | 맞는 스킬로 계획 2~3개 비교(무엇·이번엔·조정·결과물) → 고른 것만 실행 → "앞으로도"면 조정을 저장(우리 스킬은 SKILL.md, 외부 스킬은 napkin.md) |

## 가져온 외부 스킬 (요약 — 자세히는 external-skills.md)

| 스킬 | 언제 | 부르는 법 |
|---|---|---|
| **napkin** | 항상 (같은 실수 반복 방지) | 저절로 켜짐 · "napkin 에 적어둬" |
| **better-interface** (+ better-accessibility·layout·writing·typography·colors·ui) | 화면 하나 종합 검수 | `/better-interface` · `/lesson-check 06 새 눈으로` |
| **interface-review** | 방금 고친 것만 검수 | `/interface-review` (직접 불러야 함) |
| **i-have-adhd** | 답을 "다음 할 일 먼저·번호 단계"로 짧게 | `/i-have-adhd` · 끄기 "stop adhd mode" |

## 스킬 폴더 구조

```
.claude/
├─ README.md                ← 지금 이 문서 (목록·사용법)
├─ external-skills.md       ← 가져온 외부 스킬 안내 (호출법·활용·출처·안 넣은 것)
├─ napkin.md                ← napkin 스킬이 관리하는 저장소 요령 모음
├─ settings.json            ← 허용된 명령(npm run …, git status 등) + hook 등록
├─ hooks/skill-guide.js     ← 요청 앞의 `?`·`스킬:` 을 보고 skill-guide 를 켜는 hook
└─ skills/
   ├─ lesson-edit/   SKILL.md + references/rules.md        ┐
   ├─ lesson-new/    SKILL.md                              │
   ├─ lesson-teacher/SKILL.md                              │
   ├─ lesson-exam/   SKILL.md (기준: docs/rules/exam.md)    │ 우리 스킬
   ├─ lesson-ppt/    SKILL.md (기준: docs/rules/ppt.md)     │
   ├─ lesson-theme/  SKILL.md + references/*.mjs(견본 캡처·아이콘·PDF 리허설·숫자→변수·전후 비교) │
   ├─ lesson-check/  SKILL.md + references/review-prompt.md│
   ├─ skill-guide/   SKILL.md                              ┘
   ├─ napkin/                                              ┐
   ├─ better-interface/  interface-review/                 │ 가져온 외부 스킬 (원본 그대로 + LICENSE)
   ├─ better-accessibility/ better-layout/ better-writing/ │
   ├─ better-typography/ better-colors/ better-ui/         │
   └─ i-have-adhd/                                         ┘
```

- `SKILL.md` 는 짧게(순서와 꼭 지킬 것만), 긴 규칙은 `references/` 나 `docs/rules/` 에 두고 **필요할 때만 읽게** 했습니다.
  그래서 매번 문서 260KB 를 다 읽지 않아요.
- 스킬을 새로 만들 땐 `skills/<이름>/SKILL.md` 를 만들고 위 표에 한 줄 추가하면 됩니다. (Claude Code 는 `.claude/skills/` 아래만 스킬로 인식해요.)
- 외부 스킬을 더 가져올 땐 폴더를 통째로 `skills/` 에 넣고 LICENSE 를 함께 두고, `external-skills.md` 표에 출처·판 번호를 적어 주세요. 라이선스가 없는 스킬은 공개 저장소에 넣지 않아요.

## 스킬이 쓰는 명령 (직접 쳐도 됨)

| 명령 | 하는 일 |
|---|---|
| `npm run build` | 소스 → 배포본 (`dist/pages` = GitHub Pages, `dist/embed` = 구글 사이트 붙여넣기용, 둘 다 교사용 포함) |
| `npm run check -- 06` | 빌드 + 브라우저 자동 검사 + 캡처 (`--find "글자"` 로 특정 부분 캡처) |
| `npm run teacher -- 06` | answers.json 으로 정답지 PDF |
| `npm run ppt -- ai/01 [--check] [--page]` | 차시 `ppt.json` 으로 수업 PPT(`dist/ppt/`) · `--check` PowerPoint 로 그려 넘침 검사 · `--page` 받는 링크 페이지 (처음 한 번 `npm --prefix scripts/ppt install`) |
| `npm run exam-key -- 09 [--send]` | 수행평가 정답 표 확인(배점 합계) · 시트로 보내기(선생님 열쇠) |
| `npm run exam-pdf -- <폴더> [--send]` | USB 로 받은 수행평가 PDF 의 숨은 답 확인 · 시트로 보내기 |
| `npm run new -- data-analysis/08 --from 07 --title "…"` | 새 차시 폴더 |
| `npm run import -- <파일> data-analysis/06` | 완성된 한 파일짜리 HTML 을 차시 소스로 가져오기 (원본과 바이트 단위 동일 확인) |
| `npm run portal-upgrade -- 06` | 4탭 차시 화면을 지금 규칙대로 — 제목줄 칩 탭 · 시간표 날짜 카드 · 급식 ◀ 날짜 ▶ · 급식 일간 가운데 (이미 적용된 건 건너뜀, `--dry`) |
| `npm run neis` | `data/timetable.json`·`meal.json` → `data/neis-snapshot.json` (시간표·급식 탭 데이터) |
| `npm run serve` | `dist/pages` 를 내 컴퓨터에서 열어 보기 |
