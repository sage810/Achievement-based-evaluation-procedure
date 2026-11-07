# 프로젝트 지도

처음 만든 문서라 2026-11 UI 개선에서 바뀐 파일만 적었다. 나머지 파일은 작업하면서 채운다.

| 파일 | 메모 |
|---|---|
| `web/src/ContextBar.tsx` | 새 파일. 분석·문항·평가계획서 화면 위에 붙는 막대(현재 항목, ◀▶, 구역 칩)와 읽던 자리 기억 |
| `web/src/ReadOnly.tsx` | `RichText` 추가. `Text`와 같은 읽기 전용 글이지만 `\| 칸 \|` 줄 묶음을 표로 보여 줌 |
| `server/item_docx.py` | `write_rich` 추가. `write`와 같은 칸 쓰기지만 문항·예시답안의 표 문법을 칸 안의 표로 넣음 |
| `server/main.py` | `GET /api/analyses` 추가. `/api/analyses/{sid}`와 같은 자료를 한 과목 전체로 한 번에 줌 (그래프 탭) |
| `web/src/fonts/kopub.css` | 새 파일. 본문 글꼴을 `core`(자주 쓰는 글자)와 `rest`(나머지)로 나눠 선언. `rest`는 드문 글자가 나올 때만 받음 |
| `web/src/App.tsx` | 학교급·과목·성취기준 기억, 선택 영역 한 줄 접기 |
