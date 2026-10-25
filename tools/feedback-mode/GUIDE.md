# 피드백 모드 안내서

## 1. 피드백 모드란

개발 중인 웹앱 화면 위에서 **"여기 이거 고쳐줘"를 바로 찍어서 Claude Code 에게 전달**하는 도구다.
Claude Design 의 comment / edit 기능을 내 프로젝트 안에서 쓰는 것과 같다.

- 개발 서버(`npm run dev`)에서만 동작한다. 배포 빌드에는 들어가지 않는다.
- 화면에서 요소를 클릭 → 메모나 글자 수정을 적어 보냄 → 프로젝트의 `.claude/feedback.md` 에 쌓임.
- Claude Code 가 세션을 시작할 때 이 파일의 `[ ]`(처리 전) 항목을 먼저 읽고 코드에 반영한 뒤 `[x]` 로 바꾼다.

말로 "대여 카드 위쪽 그 버튼 있잖아…" 하고 설명하는 대신, 요소를 직접 클릭하면 CSS 경로·원문·화면 크기까지 같이 기록되므로
Claude 가 어느 화면의 어느 요소인지 헷갈리지 않는다.

## 2. 사용법 (사람)

1. `npm run dev` 로 개발 서버를 켜고 앱을 연다.
2. 화면 **우하단 "피드백" 버튼**을 누르면 모드가 켜진다 (버튼이 빨갛게 바뀌고 "피드백 끄기 (Esc)" 표시).
3. 고치고 싶은 **요소를 클릭**한다. 켜져 있는 동안은 링크·버튼의 원래 동작이 막히고 패널만 열린다.
4. 패널에서 둘 중 하나(또는 둘 다)를 적는다.
   - **글자 고치기**: 원문이 채워져 있다. 바꾸면 화면에 바로 반영돼 미리 볼 수 있다. (새로고침하면 원래대로 — 진짜 반영은 Claude 가 코드를 고쳐서 한다.) 글자가 없는 요소는 이 칸이 비활성화된다.
   - **메모**: "이 버튼을 검색창 왼쪽으로, 글자는 더 크게" 같은 자유 요청.
   - **디자인 추천 받기** (체크박스): "밋밋해", "색이 어색해"처럼 정답이 하나가 아닌 요청일 때 켠다. Claude 가 바로 고치지 않고
     ui-ux-pro-max 스킬(디자인 자료집)을 검색해 **후보 2~3개를 먼저 보여 주고**, 고른 것만 반영한다. (9번 참고)
5. **보내기** → 배지 숫자가 올라가고 `.claude/feedback.md` 에 기록된다. **취소**는 기록 없이 닫기.
6. **보낸 내용 다시 보고 고치기**: 보낸 직후 화면 아래에 뜨는 알림의 **"보기·수정"** 을 누르거나, 우하단 **"보낸 목록"** 버튼(피드백 버튼 왼쪽, 모드가 꺼져 있어도 보임)을 누른다.
   - 처리 전(`[ ]`) 항목이 최신순으로 나온다. **수정**: 고친 글자·메모·"디자인 추천 받기"를 바꿔 저장 → `.claude/feedback.md` 의 해당 항목이 바로 고쳐진다. 요소·위치·화면은 그대로다.
   - **삭제**: 두 번 눌러야 지워진다(첫 번째는 "정말 삭제"로 바뀜). 메모·고친 글자·디자인 추천 중 하나는 남아 있어야 저장된다.
   - 이미 처리된(`[x]`) 항목은 "처리된 항목 보기"로 읽기만 할 수 있다(Claude 가 이미 반영했으므로 고치면 기록이 어긋난다). 서버도 거부한다.
7. **Esc**: 패널이 열려 있으면 패널 닫기 → 목록이 열려 있으면 목록 닫기 → 한 번 더 누르면 모드 끄기.
8. 모드를 끄면 앱이 평소처럼 동작한다.

팁: 여러 곳을 한꺼번에 돌아다니며 쌓은 뒤, Claude 에게 "피드백 모드 처리해줘"라고 하면 한 번에 반영된다.

## 3. 무엇이 기록되나

```
## 2026-10-01 15:02:11 · /rentals/return
- 종류: 글자 수정            ← 글자 수정 / 메모
- 요소: button.btn.btn-primary  (글자: "저장")
- 위치: main > div.card > table.data > tbody > tr:nth-of-type(1) > td:nth-of-type(10) > button.btn.btn-primary
- 수정: "저장" → "반납 처리"
- 메모: 확인자 안 골라도 눌리게 해줘
- 디자인 추천: 요청            ← "디자인 추천 받기" 를 켰을 때만
- 화면: 정보부 업무 관리 · 1440×900
- 상태: [ ] 처리 전
```

| 항목 | 의미 |
|---|---|
| 제목줄 | 보낸 시각 · 그때 화면 주소(라우트) |
| 위치 | 클릭한 요소까지의 CSS 경로 — 코드에서 해당 컴포넌트를 찾는 열쇠 |
| 수정 | 원문 → 수정문 (글자 수정일 때) |
| 메모 | 자유 요청 |
| 화면 | 앱 이름 · 창 크기 (모바일 요청인지 구분) |
| 디자인 추천 | 있으면 Claude 가 후보를 먼저 제안하고 선택을 기다린다 |
| 상태 | `[ ]` 처리 전 → Claude 가 처리 후 `[x]` + 한 줄 설명 |

## 4. Claude 가 처리하는 방식

1. `.claude/feedback.md` 에서 `[ ]` 항목을 읽는다.
2. `위치` 의 CSS 경로·클래스명·원문 글자로 코드를 찾아 반영한다 (요청 범위만 최소 수정).
3. 처리한 항목은 `[x]` 로 바꾸고 무엇을 했는지 한 줄 덧붙인다.
4. 요청이 **데이터**(메뉴얼 본문·비고·명단 등)에 대한 것이면 코드가 아니라 앱의 셀 편집/시트 수정으로 안내한다.

프로젝트의 `CLAUDE.md` 또는 `.claude/napkin.md` 에 "세션 시작 때 `.claude/feedback.md` 의 `[ ]` 항목 먼저 처리" 한 줄이 있으면
부르지 않아도 자동으로 처리된다. `/feedback_mode` 스킬로 직접 호출할 수도 있다.

## 5. 범위와 한계

- **화면(글자·배치·동작) 요청 전용.** 데이터는 피드백 모드가 아니라 셀 편집으로 고친다 (시트가 원본이므로).
- 글자 미리보기는 DOM 만 바꾼 것이다. 새로고침하면 사라지고, 실제 변경은 코드 수정으로만 일어난다.
- 개발 서버 전용이다. 배포 주소(Netlify 등)에는 버튼이 없다.
- 파일은 **로컬에 쌓이는 텍스트**다. 외부로 전송되지 않는다. 다만 git 에 올라가지 않게 하려면 `.gitignore` 에 `.claude/feedback.md` 를 넣어도 된다 (선택).

## 6. 구성 파일

| 파일 | 역할 |
|---|---|
| `vite-plugin.js` | Vite 개발 서버 미들웨어 `/__feedback` (GET: 미처리 개수 / `?list=1` 항목 목록, POST: md 에 추가, PUT: 처리 전 항목 고치기, DELETE: 처리 전 항목 지우기 — 항목은 제목줄 `시각 · 경로` 로 찾음). `apply: 'serve'` 라 빌드 제외 |
| `overlay.js` | 화면 오버레이 (바닐라 JS — React 등 프레임워크 무관). 클릭 가로채기, 패널, 글자 미리보기, "보낸 목록"(다시 보기·고치기·지우기) |
| `README.md` | 짧은 요약 |
| `GUIDE.md` | 이 문서 |
| `../../.claude/skills/feedback_mode/SKILL.md` | `/feedback_mode` 스킬 |

## 7. 다른 웹앱에서 재사용

Vite 기반이면 React/Vue/Svelte/바닐라 상관없이 된다.

1. **폴더 복사**: `tools/feedback-mode/` 를 새 프로젝트의 같은 위치로 통째로 복사한다.
2. **`vite.config.js`**
   ```js
   import feedbackMode from './tools/feedback-mode/vite-plugin.js';
   export default defineConfig({ plugins: [react(), feedbackMode()] });
   // 옵션: feedbackMode({ file: '.claude/feedback.md', endpoint: '/__feedback' })
   ```
3. **진입점(`main.jsx` / `main.ts` 등) 맨 아래**
   ```js
   if (import.meta.env.DEV) import('../tools/feedback-mode/overlay.js').then((m) => m.mountFeedbackMode({ app: '앱 이름' }));
   ```
   (진입점 위치에 맞게 상대 경로 조정. `app` 은 기록의 "화면" 줄에 찍힌다.)
4. **지침 한 줄**: 새 프로젝트의 `CLAUDE.md` 에 "세션 시작 때 `.claude/feedback.md` 에 `[ ]` 항목이 있으면 먼저 처리" 추가.
5. **스킬 복사(선택)**: `.claude/skills/feedback_mode/` 도 복사하면 그 프로젝트에서도 `/feedback_mode` 로 부를 수 있다.
   모든 프로젝트에서 쓰려면 `~/.claude/skills/feedback_mode/` 로 복사한다.
6. `npm run dev` → 우하단에 "피드백" 버튼이 보이면 성공.

Vite 가 아닌 번들러(webpack 등)는 `overlay.js` 는 그대로 쓰되, `/__feedback` 으로 POST 를 받아 md 에 덧붙이는
작은 서버 미들웨어를 `vite-plugin.js` 를 참고해 따로 만들어야 한다.

## 8. 문제 해결

| 증상 | 확인 |
|---|---|
| 버튼이 안 보인다 | `npm run dev`(개발 서버)로 연 화면인가? 배포본/`npm run preview` 에는 없다. 진입점에 DEV import 줄이 있는지 |
| 보내기를 눌러도 파일이 안 생긴다 | `vite.config.js` 에 `feedbackMode()` 가 있는지, 서버를 재시작했는지. 브라우저에서 `/__feedback` 을 열어 `{"file":...,"open":N}` 이 나오는지 |
| 켜 놨는데 링크가 그대로 동작한다 | 버튼 색(빨강 = 켜짐) 확인. 다른 곳을 눌러 모드가 꺼졌는지 (Esc 2번이면 꺼짐) |
| 피드백이 쌓였는데 Claude 가 모른다 | 세션 시작 지침(4번 항목)이 없거나, 이미 열려 있던 세션이다 → "피드백 모드 처리해줘" 라고 요청 |
| "디자인 추천 받기" 를 켰는데 후보 없이 바로 고쳤다 | 그 프로젝트에 `.claude/skills/ui-ux-pro-max/` 가 있는지, `python --version` 이 3.x 인지 확인 (9번) |

## 9. ui-ux-pro-max 연결 (디자인 추천)

[ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 는 UI 스타일 79종·팔레트 192종·폰트 조합 74종·UX 가이드라인 119개를
검색할 수 있는 Claude 스킬이다 (스킬 자체의 호출법·활용·재사용은 [docs/ui-ux-pro-max.md](../../docs/ui-ux-pro-max.md)). 피드백 모드와는 이렇게 이어진다.

```
[피드백 패널] "디자인 추천 받기" 체크 → 보내기
        ↓
[.claude/feedback.md]  - 디자인 추천: 요청
        ↓
[/feedback_mode 처리]  메모 주제로 도메인 선택 → search.py --domain … 검색
                       → 이 앱의 기존 토큰(styles.css :root)에 맞춰 후보 2~3개 제시
        ↓
[사용자] 하나 고름 → 그 후보만 코드에 반영 → [x]
```

- 언제 켜나: "밋밋해", "답답해", "색이 어색해", "더 보기 좋게"처럼 **정답이 하나가 아닌** 요청. "왼쪽으로 옮겨"처럼 지시가 분명하면 켤 필요 없다.
- ui-ux-pro-max 는 이제 **전역 설치**(`~/.claude/skills/ui-ux-pro-max/`)라 어느 프로젝트에서나 쓸 수 있고, "디자인 시안"/"UI 시안"/"디자인 추천" 이라는
  말만 해도 피드백 모드 없이 바로 호출된다. 자세한 건 [docs/ui-ux-pro-max.md](../../docs/ui-ux-pro-max.md).
  체크 안 해도 Claude 가 메모를 느낌·판단으로 읽으면 같은 절차를 밟는다.
- 도메인 선택 기준: 색/대비 → `color`, 글꼴 → `typography`, 차트 → `chart`, 아이콘 → `icons`, 여백/배치/표/폼/터치 → `ux`, 분위기 전체 → `style`.
- **전체 테마 추천(`--design-system`)은 쓰지 않는다.** 이 앱처럼 교내 업무용 표·폼 중심 화면에 돌리면 SaaS 랜딩용 글래스모피즘·다크 테마가
  나온다(실제 확인). 항목별 `--domain` 검색만 쓰고, 결과는 기존 보라 테마 토큰 안에서 번역한다.
- 직접 검색해 보기(터미널): `python .claude\skills\ui-ux-pro-max\scripts\search.py "dense admin table spacing" --domain ux -n 3`
- 설치: 터미널에서 `npx --yes ui-ux-pro-max-cli init --ai claude` (Python 3 필요, Windows 는 `winget install Python.Python.3.12`).
  이 설치기는 `.claude/skills/` 에 ui-ux-pro-max 외에 `design`, `design-system`, `ui-styling`, `brand`, `slides`, `banner-design` 스킬도 함께 넣는다.
  필요 없으면 그 폴더들은 지워도 된다 (피드백 모드 연결은 `ui-ux-pro-max` 만 쓴다).
