# 프로젝트 지도

처음 만든 문서라 2026-11 UI 개선에서 바뀐 파일만 적었다. 나머지 파일은 작업하면서 채운다.

| 파일 | 메모 |
|---|---|
| `web/src/ContextBar.tsx` | 새 파일. 분석·문항 화면 위에 붙는 막대(현재 항목, ◀▶, 구역 칩)와 읽던 자리 기억 (평가계획서 검토 탭은 안 씀) |
| `web/src/ReadOnly.tsx` | `RichText` 추가. `Text`와 같은 읽기 전용 글이지만 `\| 칸 \|` 줄 묶음을 표로 보여 줌 |
| `server/item_docx.py` | `write_rich` 추가. `write`와 같은 칸 쓰기지만 문항·예시답안의 표 문법을 칸 안의 표로 넣음 |
| `server/main.py` | `GET /api/analyses` 추가. `/api/analyses/{sid}`와 같은 자료를 한 과목 전체로 한 번에 줌 (그래프 탭). 평가계획서 업로드·결과·엑셀 끝점은 지움 (`GET /api/review-template`만 남음) |
| `web/src/fonts/kopub.css` | 새 파일. 본문 글꼴을 `core`(자주 쓰는 글자)와 `rest`(나머지)로 나눠 선언. `rest`는 드문 글자가 나올 때만 받음 |
| `web/src/App.tsx` | 학교급·과목·성취기준 기억, 선택 영역 한 줄 접기. 평가계획서 탭도 같은 학교급·과목 칸을 씀 |
| `web/src/DocTable.tsx` | 새 파일. 교육과정 분석 ⑤의 문서 문장과 평가 시사점을 같은 줄에 놓고 화살표로 잇는 표 |
| `web/src/PlanReview.tsx` | 다시 씀. 업로드·검토 결과 화면 대신 검토 지침 md와 프롬프트를 내려받는 화면. 서버 없이 동작. 탭 이름은 「평가계획서 검토」, 프롬프트는 복사 없이 내려받기만, 점검표는 접기 |
| `web/src/reviewGuide.ts` | 새 파일. `analysisMarkdown.ts`와 같이 화면에서 md를 만들지만, 과목 원문·점검 항목·엑셀 코드를 묶은 AI용 지침과 프롬프트 3개를 만듦 |
| `web/src/review-guide/guide.md` | 새 파일. 지운 `docs/평가계획서-검토-절차.md`의 내용을 외부 AI가 읽도록 옮긴 지침 틀 |
| `web/src/app.css` | 사이드바 폭 232→212px(메뉴 이름이 한 줄에 딱 맞는 폭). 손잡이 위치·본문 왼쪽 여백도 20px씩 당김. 표가 가로로 밀리지 않으려면 본문 폭 950px 필요 |
| `web/src/review-guide/make_xlsx.py` | 새 파일. 지운 서버 엑셀 내보내기와 같은 양식을 템플릿 파일 없이 만드는 코드. 지침 md 안에 그대로 들어감 |
