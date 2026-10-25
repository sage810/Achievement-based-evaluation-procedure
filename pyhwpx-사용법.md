# pyhwpx 사용법

아래아한글(HWP/HWPX) 문서를 파이썬으로 자동화하는 라이브러리 **pyhwpx**와, 이를 Claude Code에서 쓰기 위한 전역 스킬 정리.

- 라이브러리: pyhwpx 1.7.2 — PC 전역 Python 3.12에 설치됨
- 공식 문서: https://martiniifun.github.io/pyhwpx/
- 소스: https://github.com/martiniifun/pyhwpx
- 전역 스킬: `C:\Users\comsc\.claude\skills\pyhwpx\SKILL.md`

> pyhwpx는 Windows에 설치된 **실제 한글 프로그램을 띄워서** 조작한다. 한글이 설치된 Windows에서만 동작한다.

---

## 1. 호출법

### Claude Code에서 (스킬)

방법 두 가지 중 편한 것을 쓴다.

1. **그냥 말하기** — 대화에 "한글 파일", "hwp", "hwpx", "pyhwpx", "한글 자동화" 같은 말이 나오면 스킬이 자동으로 불려 온다.
   - 예: `이 양식.hwp로 명단.xlsx 학생마다 PDF 만들어줘`
2. **직접 부르기** — 입력창에 `/pyhwpx` 를 입력하고 뒤에 할 일을 적는다.
   - 예: `/pyhwpx 성적표.hwp 의 첫 번째 표를 엑셀로 뽑아줘`

스킬은 전역(`~/.claude/skills`)에 있어서 어느 프로젝트 폴더에서든 쓸 수 있다.

### 파이썬에서 직접

```powershell
py -3.12 내스크립트.py
```

```python
from pyhwpx import Hwp
hwp = Hwp(new=True, visible=False)
```

---

## 2. 사용법

### 기본 뼈대

```python
from pyhwpx import Hwp

hwp = Hwp(new=True, visible=False)        # 한글을 새로, 화면에 안 보이게 실행
try:
    hwp.open(r"C:\경로\양식.hwp")          # 새 문서면 생략
    hwp.insert_text("안녕하세요")
    hwp.save_as(r"C:\경로\결과.hwp")        # PDF: hwp.save_as(r"C:\경로\결과.pdf", "PDF")
finally:
    hwp.clear(1)                            # 저장 안 한 변경 버리고
    hwp.quit()                              # 한글 종료
```

### `Hwp()` 옵션

| 옵션 | 기본값 | 의미 |
|---|---|---|
| `new` | `False` | `True`면 새 한글을 띄움. `False`면 **이미 열린 한글 창에 붙음** |
| `visible` | `True` | `False`면 화면에 안 보이게 백그라운드 실행 |
| `register_module` | `True` | 파일 접근 보안 팝업이 뜨지 않게 함 |

### 지켜야 할 것

- 자동 작업은 `Hwp(new=True, visible=False)` 로 연다. 옵션 없이 열면 편집 중인 한글 문서를 건드릴 수 있다.
- 끝나면 반드시 `hwp.quit()` — 안 하면 Hwp.exe가 백그라운드에 계속 남는다.
- 파일 경로는 **절대경로**로 쓴다. 한글은 상대경로를 자기 기준으로 해석한다.
- 원본 hwp는 덮어쓰지 말고 `save_as` 로 새 이름에 저장한다.
- `import pyhwpx` 는 처음에 시간이 좀 걸린다(pandas 등 로딩).

### 자주 쓰는 메서드

| 하고 싶은 일 | 메서드 |
|---|---|
| 글자 넣기 / 줄바꿈 | `insert_text("내용")`, `BreakPara()` |
| 문서 전체 찾아 바꾸기 | `find_replace_all("{{이름}}", "홍길동")` (정규식: `regex=True`) |
| 누름틀(필드) 목록 | `get_field_list()`, `fields_to_dict()` |
| 누름틀 채우기 | `put_field_text("이름", "홍길동")` |
| 여러 누름틀 한 번에 | `put_field_text({"이름": "홍길동", "반": "3"})` |
| 누름틀 있는지 확인 | `field_exist("이름")` |
| 표 만들기 | `create_table(행, 열)`, `table_from_data(데이터프레임 또는 2차원 리스트)` |
| 표 읽기 | `table_to_df(n)` (n번째 표 → pandas), `table_to_csv(n, 경로)` |
| 표 안 이동 | `get_into_nth_table(n)`, `goto_addr("B3")` |
| 글자 모양 | `set_font(FaceName="맑은 고딕", Height=11, Bold=True, TextColor=hwp.rgb_color(255, 0, 0))` |
| 문단 모양 | `set_para(AlignType="Center", LineSpacing=160)` |
| 셀 색 칠하기 | `cell_fill((255, 255, 0))` |
| 그림 넣기 | `insert_picture(경로, width=…, height=…)` |
| 다른 hwp 끼워 넣기 | `insert_file(경로)` |
| 쪽 수 | `hwp.PageCount` |
| 쪽별 텍스트 | `get_page_text(쪽번호)` |
| 쪽을 이미지로 저장 | `create_page_image(경로, 쪽번호)` |
| 쪽 번호 넣기 | `page_num_pos(position=…)` |
| 한글 기본 기능 실행 | `hwp.Run("MoveDocBegin")`, `hwp.Run("SelectAll")` 등 |

저장 형식: `save_as(경로, "HWP")` / `"HWPX"` / `"PDF"`

---

## 3. 이 스킬로 할 수 있는 일

### 문서 대량 생성
엑셀 명단 + 한글 양식 1개 → 학생별 가정통신문, 상장, 성적 안내문, 수행평가 결과지를 hwp나 PDF로 한 번에 만든다.

```python
import pandas as pd
from pyhwpx import Hwp

rows = pd.read_excel(r"C:\경로\명단.xlsx").to_dict("records")
hwp = Hwp(new=True, visible=False)
try:
    for r in rows:
        hwp.open(r"C:\경로\양식.hwp")          # 양식에 '이름','반','점수' 누름틀이 있다고 가정
        for k, v in r.items():
            if hwp.field_exist(k):
                hwp.put_field_text(k, str(v))
        hwp.save_as(rf"C:\경로\출력\{r['이름']}.pdf", "PDF")
finally:
    hwp.clear(1)
    hwp.quit()
```

누름틀이 없는 양식이면 `{{이름}}` 같은 자리 표시를 넣어 두고 `find_replace_all` 로 바꾼다.

### 표 ↔ 엑셀
- 엑셀이나 CSV 데이터를 한글 표로 넣기 (`table_from_data`)
- 한글 문서 속 표를 엑셀, CSV, 데이터프레임으로 뽑기 (`table_to_df`, `table_to_csv`)
- 셀 색, 열 너비, 행 높이, 셀 여백 조절

### 서식 일괄 정리
- 글꼴, 크기, 색, 굵기 변경
- 줄 간격, 정렬, 들여쓰기 변경
- 스타일 적용 및 쓰지 않는 스타일 정리
- 쪽 번호 넣기
- 찾아 바꾸기 (정규식 가능)

### 변환과 추출
- hwp → PDF, HWPX, 쪽별 이미지
- 문서 전체나 쪽별 텍스트 추출 (채점, 검색, 요약용)
- 문서 속 그림 모두 저장 (`save_all_pictures`)

### 합치기와 삽입
- 여러 hwp 파일을 하나로 합치기 (`insert_file`)
- 그림, 하이퍼링크, 메모 넣기

### Claude에게 이렇게 말하면 된다
- `양식.hwp 로 명단.xlsx 학생마다 PDF 만들어줘`
- `이 폴더의 hwp 파일을 전부 PDF로 바꿔줘`
- `성적표.hwp 의 표를 엑셀로 뽑아줘`
- `보고서.hwp 글꼴을 전부 맑은 고딕 11pt로 바꿔서 새 파일로 저장해줘`
- `1반~5반 hwp 파일을 하나로 합쳐줘`
