# 피드백 모드

> 전체 안내(개념·사용법·재사용·문제 해결)는 [GUIDE.md](GUIDE.md), Claude 스킬은 `/feedback_mode` (`.claude/skills/feedback_mode/`).

개발 서버에서 돌아가는 앱 위에 "피드백" 버튼이 생긴다. 켜고 아무 요소나 클릭하면 메모를 적거나 글자를 바로 고쳐서
보낼 수 있고, 보낸 내용은 프로젝트의 `.claude/feedback.md` 에 쌓인다. Claude Code 는 세션을 시작할 때 이 파일에
처리 안 된 항목(`[ ]`)이 있으면 먼저 읽고 코드에 반영한 뒤 `[x]` 로 바꾼다.

보낸 뒤에도 우하단 "보낸 목록"(또는 저장 직후 알림의 "보기·수정")에서 처리 전 항목을 다시 보고 고치거나 지울 수 있다.

배포본에는 들어가지 않는다 (Vite 플러그인은 `apply: 'serve'`, 오버레이는 `import.meta.env.DEV` 안에서만 불러온다).

## 다른 프로젝트에 넣기 (Vite 앱 공통, React 아니어도 됨)

1. 이 폴더(`tools/feedback-mode/`)를 통째로 복사한다.
2. `vite.config.js`:
   ```js
   import feedbackMode from './tools/feedback-mode/vite-plugin.js';
   export default defineConfig({ plugins: [react(), feedbackMode()] });
   // 옵션: feedbackMode({ file: '.claude/feedback.md', endpoint: '/__feedback' })
   ```
3. 앱 진입점(`main.jsx` 등) 맨 아래:
   ```js
   if (import.meta.env.DEV) import('../tools/feedback-mode/overlay.js').then((m) => m.mountFeedbackMode({ app: '앱 이름' }));
   ```
4. 그 프로젝트의 `CLAUDE.md`(또는 napkin)에 한 줄: "세션 시작 때 `.claude/feedback.md` 에 `[ ]` 항목이 있으면 먼저 처리".

## 기록 형식

```
## 2026-10-01 15:02:11 · /rentals/return
- 종류: 글자 수정
- 요소: button.btn.btn-primary  (글자: "저장")
- 위치: main > div.card > table.data > tbody > tr:nth-of-type(1) > td:nth-of-type(10) > button.btn.btn-primary
- 수정: "저장" → "반납 처리"
- 메모: 확인자 안 골라도 눌리게 해줘
- 화면: 정보부 업무 관리 · 1440×900
- 상태: [ ] 처리 전
```

`위치` 는 클릭한 요소까지의 CSS 경로라 어느 화면의 어느 요소인지 바로 찾을 수 있다. `수정` 은 원문 → 수정문이고,
글자 수정은 화면에도 바로 반영돼 미리 볼 수 있다(새로고침하면 원래대로 — 실제 반영은 Claude 가 코드를 고쳐서 한다).

## 범위

화면(글자·배치·동작)에 대한 요청 전용이다. 메뉴얼 본문·비고·명단처럼 **데이터**인 것은 앱의 셀 편집으로 고쳐야
원본(시트)에 저장된다 — 피드백 모드로 보내면 코드 변경 요청으로 취급된다.
