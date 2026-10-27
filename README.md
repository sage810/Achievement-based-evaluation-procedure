# 성취평가 도우미

중·고등학교 **정보 교과** 선생님이 성취평가제 절차를 따라 평가를 준비하도록 돕는 웹앱입니다.
교육과정 분석부터 평가계획서 검토, 수행평가 문항 개발까지 연수 양식 순서대로 화면에 정리합니다.
분석·검토·초안 작성 같은 글쓰기는 [Claude Code](https://claude.com/claude-code)가 맡고, 선생님은 화면에서 결과를 확인하고 내려받습니다.

## 다루는 범위

평가 절차 4단계를 왼쪽 메뉴로 나눴습니다. ①·② 단계가 동작하고 ③·④ 단계는 준비 중입니다.

| 단계 | 탭 | 하는 일 |
|---|---|---|
| ① 운영 계획 | **교육과정 분석** | 성취기준 하나를 연수 양식 ①~⑧ 순서로 보여 줍니다. 성취기준·A~E 성취수준, 지식·이해 / 과정·기능 / 가치·태도, 평가요소, 평가요소 수준화(A~E 수행·판단 준거·과제 아이디어)가 들어 있습니다. |
| ① 운영 계획 | **평가계획서** | 학교 평가계획서(PDF·HWP·HWPX)를 올리면 「검토 대기」로 쌓입니다. Claude Code가 검토 항목 38개(취지 점검·지침 점검)로 판정(✖ 문제 / △ 고민 필요 / ✔ 잘 됨 / － 해당 없음)과 근거·수정 제안을 채우고, 결과는 엑셀로 내려받습니다. |
| ② 문항·평가도구 개발 | **문항 개발** | 성취기준을 골라 수행평가 과제를 만들면 교육과정 분석 내용이 미리 채워집니다. 「초안 요청」을 누르면 Claude Code가 과제명, 수업 단계, 발문·자료·조건, 채점기준표(채점 요소마다 A~E 5행), 기본점수, 예시답안을 씁니다. 완성본은 워드(.docx)로 내려받습니다. |
| ③ 채점 | 채점 | 준비 중 |
| ④ 결과 분석·피드백 | 분석·피드백 | 준비 중 |

수록 과목은 중학교 정보, 고등학교 정보·인공지능 기초·데이터 과학·정보과학·소프트웨어와 생활입니다(`data/seed/`).

화면은 읽기 전용입니다. 내용은 Claude Code가 채우고, 선생님은 요청과 확인을 맡습니다.

## Claude Code와 함께 쓰는 법

개발 서버를 켠 채 Claude Code에 아래처럼 말하면 됩니다. 결과는 10초 안에 화면에 저절로 반영됩니다.

| 이렇게 말하면 | 하는 일 | 절차 문서 |
|---|---|---|
| 「평가계획서 검토」 | 검토 대기 계획서를 검토해 결과를 앱에 넣음 | [docs/평가계획서-검토-절차.md](docs/평가계획서-검토-절차.md) |
| 「문항 초안」 | 초안 요청된 과제의 빈칸을 채움 | [docs/문항-초안-절차.md](docs/문항-초안-절차.md) |
| 「[12정02-01] 수행평가 문항·채점기준표·예시답안 만들어줘」 | 학생 관심 주제 후보를 먼저 묻고 문항 세트를 만듦 (`assessment-item` 스킬) | [docs/스킬-문항개발-사용법.md](docs/스킬-문항개발-사용법.md) |
| 「피드백 처리해줘」 | 화면 우하단 「피드백」 버튼으로 쌓인 수정 요청을 처리 | [tools/feedback-mode/GUIDE.md](tools/feedback-mode/GUIDE.md) |

## 실행

필요한 것: Node.js, Python 3.12(Windows `py` 런처 기준)

```bash
npm install
py -3.12 -m pip install fastapi uvicorn pydantic python-docx
npm run dev
```

- 화면: http://localhost:5173 (Vite + React)
- API: http://localhost:8000 (FastAPI). 화면의 `/api` 요청은 이 서버로 넘어갑니다.
- 처음 실행하면 `data/assessment.db`(SQLite)가 만들어지고 `data/seed/` 의 성취기준과 `data/seed-analysis/` 의 분석이 들어갑니다.
  나중에 시드에 성취기준이 늘면 `py -3.12 -m server.import_seed` 로 없는 것만 더합니다(이미 있는 것은 건드리지 않음).

## 읽기 전용 배포판 (GitHub Pages)

<https://sage810.github.io/Achievement-based-evaluation-procedure/>

설치 없이 브라우저에서 **교육과정 분석** 탭만 볼 수 있는 배포판입니다.

- 서버 없이 동작합니다. 빌드할 때 git에 있는 시드(`data/seed/`, `data/seed-analysis/`)로 `snapshot.json`을 만들어 읽습니다. 로컬 DB와 학교 문서는 올라가지 않습니다.
- 평가계획서 검토와 문항 개발은 저장이 필요해서 사이드바에 「로컬 전용」으로 막혀 있습니다. 이 두 탭은 내 컴퓨터에서 `npm run dev`로 실행해야 씁니다.

### 다시 배포하는 법

- `main`에 push하면 [.github/workflows/pages.yml](.github/workflows/pages.yml)이 자동으로 빌드해 배포합니다.
  단, `web/`, `server/`, `data/`, `tools/export_static.py`, `vite.config.ts`, `package*.json`, 워크플로 파일이 바뀐 push에서만 돕니다.
- 위 파일이 바뀌지 않았는데 다시 배포하려면 GitHub 저장소 **Actions** 탭 → 「배포 (GitHub Pages)」 → **Run workflow**를 누릅니다. 빈 커밋으로는 배포되지 않습니다.
- 처음 한 번은 저장소 **Settings → Pages → Build and deployment → Source**를 「GitHub Actions」로 바꿔야 합니다(이미 설정됨).

## 폴더 구성

```
web/            화면 (React + TypeScript, Vite root)
  src/          탭별 화면(Analysis·Leveling·PlanReview·ItemDev), 디자인 토큰(design-sticker/)
server/         API 서버 (FastAPI + SQLite), 문항 워드 내보내기(item_docx.py), 시드 넣기(import_seed.py)
tools/          Claude Code가 쓰는 명령
  plan_review.py   평가계획서 검토: pending | text | save
  item_draft.py    문항 초안: pending | show | save | new | find | check
  export_static.py 배포판용 snapshot.json 만들기
  feedback-mode/   개발 서버 전용 화면 피드백 도구
data/
  seed/            과목별 성취기준·성취수준
  seed-analysis/   성취기준 분석 초안
  curriculum.json  교육과정 원문(과목·영역 정보)
  review-template.json  평가계획서 검토 항목 38개
  templates/       검토 결과 엑셀 양식
docs/           절차 문서, 논술형 평가 연수 자료 정리본(docs/논술형 평가/정리/)
.claude/        Claude Code 설정과 스킬
.github/        GitHub Pages 자동 배포 워크플로
```

## 저장소에 올리지 않는 것

다음은 `.gitignore`로 제외했습니다. 받은 저장소에는 없으니 필요하면 따로 준비해야 합니다.

- `data/assessment.db`: 앱 데이터. 올라온 평가계획서 검토 내용이 들어 있어 제외합니다. 처음 실행할 때 시드로 새로 만들어집니다.
- `data/plans/`: 올라온 평가계획서 원본(학교 문서)
- `data/items/`: 문항 초안 작업용으로 꺼낸 JSON
- `docs/` 의 PDF·HWP·XLSX 원본: 연수 강의안, 교육청 자료, 교육과정 PDF 등. 저장소에는 직접 정리한 `.md` 본만 있습니다.
  절차 문서가 가리키는 원본(예: 「AI 서논술형 채점기준표 예시.xlsx」, 「발문과 반응지시어 정리.xlsx」)도 여기에 해당합니다.
- `.claude/feedback.md`: 화면 피드백 기록
