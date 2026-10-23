# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-09-24] dist/ 는 빌드 결과라 고쳐도 다음 빌드에 사라짐**
   Do instead: `lessons/<단원>/<차시>/lesson.html` 을 고치고 `npm run check -- <차시>` 로 확인.
2. **[2026-09-24] 전체 캡처는 너무 길어서 고친 곳이 안 보임**
   Do instead: `npm run check -- <차시> --find "<고친 곳 근처 글자>"` → `dist/check/<단원>-<차시>-find.png` 를 연다.
3. **[2026-09-24] 완성본 HTML(3~4MB)을 손으로 옮기면 표식이 깨짐**
   Do instead: `npm run import -- <파일> <단원>/<차시>` — 원본과 바이트 단위로 같은지 스스로 확인한다.
4. **[2026-09-30] 4탭 차시를 Playwright 로 재면 좌표가 어긋남(x-dc 숨은 복제본 + `zoom`)**
   Do instead: 선택자에 `:visible` 을 붙이고, 넘침·정렬은 `getBoundingClientRect` 대신 요소 캡처로 눈 확인.
5. **[2026-10-17] file:// 로 연 활동지에서 PDF 저장이 "Tainted canvas" 로 실패(그림이 다른 출처로 취급됨)**
   Do instead: PDF·자동 보관 리허설은 `node scripts/serve.mjs` 를 켜고 `http://127.0.0.1:8080/<단원>/<차시>/` 로 한다.
6. **[2026-10-17] 자동 보관은 0.3초 미뤄 저장 — 리허설에서 쉬지 않고 누르다 탭을 바꾸면 "안 되살아남"처럼 보임**
   Do instead: 틀·07·ai/01 은 고침(탭 누를 때·pagehide 에 바로 보관 + `_keepClear` 가 미뤄 둔 보관을 취소 — 적고 곧바로 PDF 를 누르면 다음 사람에게 답이 되살아났음). 틀 밖 예전 차시를 복사해 쓰면 이 두 군데를 확인.
8. **[2026-10-18] `<img>` 로 넣은 SVG 는 페이지 글꼴(CookieRun 등)을 못 씀 + 이 PC 엔 Python 이 없어 font-subset.py 불가**
   Do instead: `.claude/skills/lesson-new/references/svg-font.mjs`(scratchpad 에 `npm i subset-font`) — 그림 글자만 남긴 woff2 를 SVG 안에 넣음(약 5KB). 그림 글자를 고치면 다시 돌린다.
9. **[2026-10-20] `docs/templates/*.docx` 를 생성 스크립트로 다시 만들면 선생님이 Word 로 손본 것(뺀 칸·표시)이 사라짐**
   Do instead: 먼저 `docProps/core.xml` 의 lastModifiedBy 와 `docx-read.mjs` 글 비교로 손본 곳을 찾고, 작은 고침은 docx 안 XML 을 jszip 으로 직접 고친 뒤 스크립트도 같은 글이 나오게 맞춘다(`from-template.md` 「양식 고치기」).
7. **[2026-10-17] 정답지 `{ near, text }` 누르기는 안에 요소가 없는 단추만 찾음 → `glass-chip`(안에 `.gc-ic`)은 못 누름**
   Do instead: 묶음 aria-label 로 선택자를 쓴다: `"[aria-label='…'] button.glass-chip:has-text('정답 보기'):visible"`, O/X 는 `button:text-is('O')`.
10. **[2026-10-21] 차시 테마를 `design/tokens.json` 에 넣으면 안 됨 — `node design/build.mjs` 가 표식 있는 차시(틀·ai/01·07·present.html)를 모두 바꿈**
   Do instead: 테마는 `design/themes/<이름>/theme.css` + 차시 `lesson.json` 의 `"theme"`(빌드가 `</body>` 앞에 넣음, `docs/rules/theme.md`). 틀을 고칠 땐 숫자 대신 `--msi-shape-*` 변수. 바꾼 뒤 「전후 계산 스타일 같음」 확인은 getComputedStyle 비교(4탭·폰·올림·누름·포커스).
   메뉴 탭·창 단추·PDF 버튼은 인라인 style(`tabChip()` 등)·`!important` 규칙이라 theme.css 선택자에도 `!important`. 유리·오로라는 `--msi-glass-*: none`·`aurora-*-aNN: rgba(0,0,0,0)` 로 끔. SVG data URI 배경(말풍선 동전)은 PDF 에도 나옴(sticker, 2026-10-21).

## Shell & Command Reliability
1. **[2026-09-24] file:// 로 연 활동지에서 `fetch at 'file:…'` CORS 콘솔 오류가 뜸**
   Do instead: 개편 전 원본도 똑같이 뜨는 기존 경고 — 무시(`npm run check` 도 걸러냄).
2. **[2026-09-24] 헤드리스 브라우저로 PDF 버튼을 누르면 받은 파일 이름이 `download` 로 나옴**
   Do instead: 원본도 같음. 파일 이름 검증은 실제 브라우저로 하고, 스크립트에선 `saveAs(경로)` 로 이름을 정한다.
3. **[2026-09-24] 이 환경은 Windows PowerShell — 한글 파일을 PowerShell 로 읽고 쓰면 인코딩이 깨지기 쉬움**
   Do instead: 파일 가공은 Node 스크립트(`scripts/`)로 한다. NEIS 받기(`fetch-neis.ps1`)만 pwsh 7.
4. **[2026-09-30] Read 도구로 PDF 가 안 열림(pdftoppm 없음), Python 도 없음**
   Do instead: `.claude/skills/lesson-new/references/pdf-pages.mjs`(pdf.js 를 scratchpad 에 설치)로 쪽 그림을 뽑아 Read.
5. **[2026-10-17] docx 양식을 눈으로 확인할 도구가 없음(soffice·pdftoppm 없음) + Word COM 스크립트가 숨은 WINWORD 를 남김**
   (`$W` 가 `$w` 를 덮음 — PowerShell 변수는 대소문자 무시 / `| Select-Object -First` 가 스크립트를 중간에 멈춤)
   Do instead: `references/docx-render.ps1`(Word 쪽 EMF → PNG, `$word` 로 Quit). 남았으면 창 없고 방금 시작된 WINWORD 만 끈다 — 선생님 Word 창은 절대 건드리지 않는다.
6. **[2026-10-18] .pptx 미리보기에 쓸 LibreOffice 가 없음(pptx 스킬의 soffice·validate.py 도 못 씀 — python 은 스토어 껍데기)**
   Do instead: `npm run ppt -- <단원>/<차시> --check` — `scripts/ppt/render.ps1`(PowerPoint COM 으로 장마다 PNG + `TextRange.BoundWidth/BoundHeight` 넘침 검사, 켜 둔 PowerPoint 는 안 끔). 규칙 `docs/rules/ppt.md`.
   장이 많을 때(70장+) 「Call was rejected by callee(RPC_E_CALL_REJECTED)」로 중간에 멈추면 PowerPoint 가 잠깐 바빴던 것 — 남은 POWERPNT 가 없는지 보고 다시 돌린다.
7. **[2026-10-18] PPT 표에 큰 글(정답)을 넣으면 PowerPoint 가 줄을 스스로 늘려 아래 글과 붙음(줄 높이는 최소값이라 넘침 검사에 안 잡힘) · pptxgenjs 표 칸 `margin` 은 첫 값이 1 이상이면 pt, 1 미만이면 인치**
   Do instead: 칸 위아래 여백 1pt(`margin: [1, 9, 1, 9]`) — 이 글꼴들의 한 줄 높이는 글자 크기 × 1.36 정도. 표 아래 글은 render PNG 로 눈 확인.

## Canva MCP 로 덱 직접 고치기
1. **[2026-10-18] 캔바 편집 도구엔 장 복제가 없고, `add_text` 는 글꼴을 못 골라 기본 글꼴로 나옴(틀 글꼴이 깨짐)**
   Do instead: 비슷한 장을 `copy-design`(page_numbers)으로 작업본에 떠서 **있는 글·도형을 고쳐 쓴다**(새 글상자 X, 도형·그림은 `insert_shape`·`insert_fill` 가능) → 선생님 확인 → `merge-designs` insert_pages 로 원본에 넣기. 작업본은 제목에 "작업본"을 붙여 알려 둔다.
2. **[2026-10-18] 캔바 MCP 의 함정 넷** — `merge-designs` 는 한 번에 작업 1개만 · 여러 장 insert_pages 는 **순서가 뒤집혀** 들어감 · 배경 `update_fill` 은 살짝 확대돼 틀이 어긋남 · 한글은 낱말 중간에서 줄이 바뀜
   Do instead: 넣은 뒤 글로 순서 확인 → `reorder_page` · 배경 바꾼 뒤 `crop_media`(페이지 locator, 0·0·1920·1080) · 줄은 `\n` 으로 직접 나눔. 장을 넣거나 빼면 오른쪽 아래 쪽 번호(글자)도 다시 매긴다(두 자리면 폭 40·left 1794.392).
3. **[2026-10-18] 캔바 MCP `create-upload-url` 은 .pptx 를 거절(「Unsupported file format ZIP」) — 공개 주소로 올려 import 하는 것도 금지**
   Do instead: 장이 많으면 `npm run ppt` 로 만들고 받는 링크(아티팩트, 같은 URL 갱신)에서 선생님이 받아 캔바에 올림 → 그 디자인에서 새 장만 `merge-designs` 로 원본에 넣는다. 쪽 번호는 PowerPoint 자동 번호라 최종 순서 그대로 전체 덱을 만들어야 맞는다.
4. **[2026-10-18] `read-design` 은 여러 쪽 design_content 를 100,000자에서 자름 · 캔바 화면의 글자 숫자는 API `fontSize`(px) × 0.75(화면 45 = API 60)**
   Do instead: 쪽을 나눠 읽거나 `transaction_id` + `element_ids` 로 골라 읽는다. 선생님이 말한 캔바 숫자 n → `font_size` = n ÷ 0.75. `edit-design` 은 쪽(page_index)마다 한 번씩, 저장(commit)은 미리보기를 보여 드리고 허락받은 뒤.

## Domain Behavior Guardrails
1. **[2026-09-24] x-dc 는 화면에 안 보이는 원본 템플릿 복제본을 남김 → 전역 querySelector 가 엉뚱한 요소를 잡음**
   Do instead: `document` 위임 IIFE + 이벤트 대상 기준 `closest()`·형제 탐색.
2. **[2026-09-24] lesson.html 의 표식(`<script data-msi-src>`, `msi-asset:`, NEIS 스냅샷)을 지우면 빌드가 깨짐**
   Do instead: 표식은 그대로 두고, 그림은 `assets/` 에 넣고 `msi-asset:./assets/이름.png` 로 참조.
3. **[2026-09-24] 진행률 계산 방식이 차시마다 다름(05 `_progressParts` · 04 `sheetProgress` · 06 `sheetChecklist`)**
   Do instead: 빈칸·퀴즈를 추가하면 그 차시 방식에 맞춰 진행률도 함께 고친다. 새 차시는 05 방식.
4. **[2026-09-24] 외부 디자인 스킬(better-colors 등)은 새 팔레트·새 스타일을 제안할 수 있음**
   Do instead: `docs/rules/design.md` 토큰이 우선. 토큰 밖 색·서체는 제안만 하고 적용하지 않는다.
5. **[2026-09-29] 4탭 활동지 시간표·급식이 "–"로 빔 = NEIS 스냅샷 기간이 끝난 것**
   (인증키 없는 실시간 조회는 pIndex 를 무시하고 샘플 5행만 줘서 스냅샷을 못 메움)
   Do instead: `pwsh scripts/fetch-neis.ps1 -TimetableWeeks 8` → `npm run neis` → check → push.
   급식은 한 달치씩 덮어쓰므로 새 달이 시작된 뒤에 받는다. 근본 해결은 Apps Script 프록시(`neisProxy`).
6. **[2026-09-30] SVG 그림에 width·height 가 없으면 "PDF로 저장하기"(html2canvas)에서 빈 칸**
   Do instead: `<svg width="96" height="96" viewBox="0 0 96 96">` 처럼 크기를 적고, 정답지 PDF 를 쪽 그림으로 뽑아 확인.
7. **[2026-10-16] PDF 영역에 `color-mix()`·`color()` 가 있으면 "PDF로 저장하기"가 통째로 실패(html2canvas 1.4.1 이 못 읽음)**
   요소 자체의 `inset` box-shadow 도 그 요소를 통째로 흰색으로 칠함(TODAY_TOPIC 머리).
   Do instead: 투명도는 rgba 역할 토큰(`aurora-pink-a60` 등), 유리 속광은 `::after` 에 두거나 `.msi-pdf-clone` 규칙으로 PDF 복제본에서 끈다. 색을 바꾼 뒤엔 이름 칸을 채우고 `window.__MSI_ANSWER_SHEET=true` 로 진행률 확인을 넘겨 실제 저장까지 시험한다.
8. **[2026-10-16] 4탭 활동지는 다른 탭을 누르면 `sc-if` 로 활동지가 통째로 빠져서 state 밖 칸(해석 textarea·붙여넣은 그래프)이 사라짐**
   Do instead: 틀(`_templates/order`)의 자동 보관(`this._keep…`, 메모리 + localStorage 3시간, PDF 저장하면 지움)을 쓴다. 리허설은 "적기 → 다른 탭 → 돌아오기 → 새로고침" 까지.
9. **[2026-10-16] 색은 역할 토큰으로만 — 07·틀은 색 글자 대신 `var(--msi-role-…)` (흰 PDF 바탕·canvas fillStyle 만 예외)**
   Do instead: 값은 `design/tokens.json` role → `node design/build.mjs`(표식 있는 lesson.html 블록 자동 갱신). 공용 글꼴을 바꾸거나 새 데이터를 넣으면 `python scripts/font-subset.py` 다시(원본 design/fonts).
10. **[2026-10-18] 'GangwonEdu' 글꼴 파일(design/fonts·shared/fonts 의 GangwonEdu-400.woff2)의 실제 글꼴은 강원교육튼튼(GangwonEduPower) ExtraBold** — DESIGN.md 의 "강원교육모두"와 다름
   Do instead: PPT·캔바처럼 웹 밖에서 큰 제목을 같은 모양으로 내려면 글꼴 이름 `GangwonEduPower`(강원교육튼튼, 이 PC 설치됨)를 쓴다. 쿠키런은 굵기마다 이름이 따로라 `CookieRun Bold` + 굵게 끔.

## 모션그래픽 (scripts/motion · docs/rules/motion.md)
1. **[2026-10-18] WebCodecs(VideoEncoder)는 보안 문맥에서만 — about:blank·file:// 에선 `undefined`**
   Do instead: 127.0.0.1 로 띄운 페이지에서 쓴다(render.mjs 의 서버). `hardwareAcceleration:'prefer-software'` + `bitrateMode:'quantizer'` 조합은 이 PC 에서 거절되니 enc.html 처럼 후보를 차례로 `isConfigSupported` 로 고른다.
2. **[2026-10-18] `display:flex` 로 가운데 맞춘 상자 안에서 글과 `<b>` 사이 띄어쓰기가 사라짐(글 조각이 각각 flex 항목이 됨)**
   Do instead: 안 내용을 `<span>` 하나로 감싼다.
3. **[2026-10-18] 아티팩트 페이지는 doctype·html·head·body 를 넣지 않는다(게시 때 틀로 감쌈)** — 원본 index.html 은 완전한 문서로 두고 `--page` 가 껍데기를 걷어 낸 site/index.html 을 만든다.
   Do instead: 원본을 고치고 `npm run motion -- <차시> --page` 로 다시 만들어 같은 file_path 로 게시.

## User Directives
1. **[2026-09-24] "고민만", "가능 여부만" 이라고 하면 만들지 않는다**
   Do instead: 판단·선택지·근거만 답하고, 파일을 만들거나 고치지 않는다.
2. **[2026-09-24] 같은 활동지 파일을 계속 고친다**
   Do instead: `_v2`·새 파일을 만들지 말고 같은 `lesson.html` 을 최소 diff 로 수정. "새로 만들자"고 할 때만 `/lesson-new`.
