# 평가계획서 검토 결과 엑셀 만들기 — 앱의 검토 템플릿 양식 그대로.
# 「채우는 곳」만 바꿔 실행한다. 아래의 칸·색·글꼴은 고치지 않는다. openpyxl 이 없으면 먼저 설치한다.
import json
import math
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.styles.colors import Color
from openpyxl.worksheet.page import PageMargins
from openpyxl.worksheet.properties import PageSetupProperties

# ── 채우는 곳 ──
GUIDE_MD = "평가계획서_검토지침.md"  # 이 지침 md 의 경로
PLAN_NAME = "평가계획서.pdf"  # 검토한 계획서의 파일 이름
REVIEWED_AT = "2026-01-01"  # 검토한 날
OUT_DIR = "."  # 엑셀을 저장할 폴더
CHECKLIST = None  # 코드에서 md 를 읽을 수 없는 환경이면 3장의 JSON 을 여기에 그대로 넣는다
RESULT = {
    "summary": "3~6줄 요약. 줄은 \n 으로 나눈다.",
    "items": {
        # 38개 항목 모두. verdict 는 bad, warn, ok, na 중 하나
        "가1": {"verdict": "bad", "where": "찾은 위치", "finding": "근거", "fix": "수정 제안"},
    },
}
# ── 여기까지 ──

VERDICT = {"bad": "✖ 문제", "warn": "△ 고민 필요", "ok": "✔ 잘 됨", "na": "－ 해당 없음"}
INK = Color(theme=1)
BASE_ROW_H = {  # 지침 점검의 항목별 기본 행 높이
    "1": 48, "2": 48, "3": 37.5, "4": 37.5, "5": 37.5, "6": 48, "7": 48, "8": 48, "9": 34.5, "10": 37.5,
    "11": 48, "12": 34.5, "13": 34.5, "14": 37.5, "15": 34.5, "16": 34.5, "17": 34.5, "18": 37.5, "19": 48,
    "20": 48, "21": 48, "22": 34.5, "23": 48, "24": 34.5, "25": 48, "26": 34.5,
}


def font(size, bold=False, italic=False, color=None):
    return Font(name="Malgun Gothic", size=size, bold=bold, italic=italic, color=color)


def fill(rgb):
    return PatternFill("solid", fgColor=rgb)


def box(rgb):
    side = Side(style="thin", color=rgb)
    return Border(left=side, right=side, top=side, bottom=side)


LAYOUT = {
    "intent": {
        "tab": "FF548235",
        "freeze": "A5",
        "margins": (0.7, 0.7, 0.75, 0.75, 0.3, 0.3),
        "widths": [7.54296875, 33.0, 30.08984375, 51.54296875, 35.81640625, 14.0, 60.0, 50.0],
        "last_merged": "E",
        "row_h": {1: 25.5, 2: 24.0, 3: 17.0, 4: 22.5},
        "group_h": 34.5,
        "head": ["ID", "점검 질문", "어디를 보나", "어떻게 판단하나", "이런 경우를 찾으세요 (예)", "판정", "찾은 위치 · 근거", "수정 제안"],
        "border": box("FFC8D2DC"),
        "title": (font(15, True, color="FF16324F"), Alignment(vertical="center")),
        "intro": (font(9, italic=True, color="FF8A94A0"), Alignment(vertical="center", wrap_text=True)),
        "head_style": (font(11, True, color="FFFFFFFF"), fill("FF2E75B6"), Alignment(horizontal="center", vertical="center")),
        "group": (font(11, True, color="FFFFFFFF"), fill("FF1F3864"), Alignment(vertical="center", wrap_text=True)),
        "id": (font(11, True, color=INK), fill("FFDDEBF7"), Alignment(horizontal="center", vertical="center", wrap_text=True)),
        "question": (font(11, True, color=INK), Alignment(vertical="center", wrap_text=True)),
        "body": (font(9, color=INK), Alignment(vertical="center", wrap_text=True)),
        "example": font(9, color="FF7F3F00"),
        "verdict_fill": None,
    },
    "rules": {
        "tab": "FF7F7F7F",
        "freeze": "A5",
        "margins": (0.4, 0.4, 0.5, 0.5, 0.0, 0.0),
        "widths": [6.0, 22.0, 26.0, 40.0, 30.0, 8.0, 14.0, 60.0, 50.0],
        "last_merged": "G",
        "row_h": {1: 31.5, 2: 30.0, 4: 30.0},
        "group_h": 24.0,
        "head": ["No", "점검 항목", "어디를 보나", "어떻게 확인하나 (판정 기준)", "실제로 나온 오류 예", "등급", "판정", "찾은 위치 · 근거", "수정 제안"],
        "border": box("FFC9D3E3"),
        "title": (font(15, True, color="FF1F3864"), Alignment(horizontal="left", vertical="center", wrap_text=True)),
        "intro": (font(9, italic=True, color="FF595959"), Alignment(horizontal="left", vertical="center", wrap_text=True)),
        "head_style": (font(10, True, color="FFFFFFFF"), fill("FF2E75B6"), Alignment(horizontal="center", vertical="center", wrap_text=True)),
        "group": (font(10, True, color="FFFFFFFF"), fill("FF595959"), Alignment(horizontal="left", vertical="center", wrap_text=True)),
        "id": (font(10, True, color="FF000000"), fill("FFF2F2F2"), Alignment(horizontal="center", vertical="center", wrap_text=True)),
        "question": (font(10, True, color="FF000000"), Alignment(horizontal="left", vertical="center", wrap_text=True)),
        "body": (font(9, color="FF000000"), Alignment(horizontal="left", vertical="center", wrap_text=True)),
        "example": font(9, color="FF7F3F00"),
        "verdict_fill": fill("FFFFF2CC"),
    },
}


def load_checklist():
    if CHECKLIST is not None:
        return CHECKLIST
    try:
        text = Path(GUIDE_MD).read_text(encoding="utf-8")
    except OSError:
        sys.exit(f"지침 md 를 읽지 못했어요: {GUIDE_MD}. GUIDE_MD 경로를 고치거나 CHECKLIST 에 3장의 JSON 을 넣으세요.")
    found = re.search(r"`{3}json checklist\r?\n(.*?)\r?\n`{3}", text, re.S)
    if not found:
        sys.exit("지침 md 에서 3장의 점검 항목을 찾지 못했어요. CHECKLIST 에 3장의 JSON 을 넣으세요.")
    return json.loads(found.group(1))


def clean(value):
    return "" if value is None else str(value)


def checked_items(sheets):
    """38개 항목이 모두 바르게 채워졌을 때만 엑셀을 만든다."""
    items = {str(k): v for k, v in RESULT["items"].items()}
    ids = [q["id"] for sheet in sheets for group in sheet["groups"] for q in group["items"]]
    problems = []
    missing = [i for i in ids if i not in items]
    unknown = [k for k in items if k not in ids]
    wrong = [k for k, v in items.items() if not isinstance(v, dict) or v.get("verdict") not in VERDICT]
    empty = [k for k, v in items.items() if k not in wrong and not clean(v.get("finding")).strip()]
    if missing:
        problems.append("빠진 항목: " + ", ".join(missing))
    if unknown:
        problems.append("없는 항목: " + ", ".join(unknown))
    if wrong:
        problems.append("판정 값이 bad, warn, ok, na 가 아닌 항목: " + ", ".join(wrong))
    if empty:
        problems.append("근거(finding)가 빈 항목: " + ", ".join(empty))
    if not str(RESULT.get("summary", "")).strip():
        problems.append("요약(summary)이 비어 있어요")
    if problems:
        sys.exit("엑셀을 만들지 않았어요. " + " / ".join(problems))
    return items


def lines(text, width):
    per_line = max(1, int(width * 0.58))  # 9pt 한글 기준 한 줄에 들어가는 글자 수
    return sum(max(1, math.ceil(len(part) / per_line)) for part in str(text).split("\n"))


def as_text(cell):
    if isinstance(cell.value, str) and cell.value.startswith("="):
        cell.data_type = "s"  # 수식으로 저장되지 않게
    return cell


def styled(ws, row, col, value, parts, border=None):
    cell = as_text(ws.cell(row=row, column=col, value=value))
    for part in parts:
        if isinstance(part, Font):
            cell.font = part
        elif isinstance(part, PatternFill):
            cell.fill = part
        elif isinstance(part, Alignment):
            cell.alignment = part
    if border:
        cell.border = border
    return cell


def write_sheet(wb, sheet, items):
    key = sheet["key"]
    lay = LAYOUT[key]
    ws = wb.create_sheet(sheet["sheet"])
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.tabColor = lay["tab"]
    ws.sheet_format.defaultColWidth = 14.453125
    left, right, top, bottom, header, footer = lay["margins"]
    ws.page_margins = PageMargins(left=left, right=right, top=top, bottom=bottom, header=header, footer=footer)
    if key == "rules":
        ws.page_setup.orientation = "landscape"
        ws.page_setup.paperSize = 9
        ws.page_setup.fitToHeight = 0
        ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    for i, width in enumerate(lay["widths"]):
        ws.column_dimensions[chr(65 + i)].width = width
    for row, height in lay["row_h"].items():
        ws.row_dimensions[row].height = height

    styled(ws, 1, 1, sheet["title"], lay["title"])
    styled(ws, 2, 1, sheet["intro"], lay["intro"])
    ws.merge_cells(f"A1:{lay['last_merged']}1")
    ws.merge_cells(f"A2:{lay['last_merged']}2")
    for col, title in enumerate(lay["head"], start=1):
        styled(ws, 4, col, title, lay["head_style"], lay["border"])

    first_result = len(lay["head"]) - 2  # 판정 칸
    clipped = []
    row = 5
    for group in sheet["groups"]:
        title = group["title"] + (f"\n{group['desc']}" if group.get("desc") else "")
        styled(ws, row, 1, title, lay["group"], lay["border"])
        ws.merge_cells(f"A{row}:{lay['last_merged']}{row}")
        ws.row_dimensions[row].height = lay["group_h"]
        row += 1
        for q in group["items"]:
            it = items[q["id"]]
            styled(ws, row, 1, int(q["id"]) if q["id"].isdigit() else q["id"], lay["id"], lay["border"])
            styled(ws, row, 2, q["question"], lay["question"], lay["border"])
            styled(ws, row, 3, q["where"], lay["body"], lay["border"])
            styled(ws, row, 4, q["how"], lay["body"], lay["border"])
            styled(ws, row, 5, q["example"], (lay["example"], lay["body"][1]), lay["border"])
            if key == "rules":
                color = "FFC00000" if q.get("grade") == "필수" else "FF595959"
                styled(ws, row, 6, q.get("grade"), (font(10, True, color=color), lay["id"][2]), lay["border"])
            where = f"[{clean(it.get('where'))}] " if it.get("where") else ""
            values = (VERDICT[it["verdict"]], where + clean(it.get("finding")), clean(it.get("fix")))
            for i, value in enumerate(values):
                cell = styled(ws, row, first_result + i, value, lay["body"], lay["border"])
                if i == 0 and lay["verdict_fill"]:
                    cell.fill = lay["verdict_fill"]
            need = 6 + max(
                lines(q["question"], lay["widths"][1] * 0.8) * 17,  # 점검 질문은 글자가 크다
                *(lines(q[name], lay["widths"][i]) * 13.5 for i, name in ((2, "where"), (3, "how"), (4, "example"))),
                *(lines(v, lay["widths"][first_result - 1 + i]) * 13.5 for i, v in enumerate(values)),
            )
            base = BASE_ROW_H[q["id"]] if key == "rules" else 48
            ws.row_dimensions[row].height = min(409, max(base, need))  # 글이 잘리지 않게 늘린다
            if need > 409:
                clipped.append(q["id"])
            row += 1
    ws.freeze_panes = lay["freeze"]
    return clipped


def main():
    sheets = load_checklist()
    items = checked_items(sheets)
    wb = Workbook()
    s = wb.active
    s.title = "검토 요약"
    plan = Path(str(PLAN_NAME).replace("\\", "/")).name.strip()
    s["A1"], s["A2"], s["A3"] = "평가계획서 검토 결과", f"파일: {plan}", f"검토일: {REVIEWED_AT}"
    s["A5"] = RESULT["summary"]
    as_text(s["A5"])
    s["A1"].font = Font(bold=True, size=14)
    s["A5"].alignment = Alignment(wrap_text=True, vertical="top")
    s.column_dimensions["A"].width = 110
    clipped = [i for sheet in sheets for i in write_sheet(wb, sheet, items)]
    out = Path(OUT_DIR) / f"{Path(plan).stem} 검토 결과.xlsx"
    wb.save(out)
    counts = {label: sum(1 for it in items.values() if it["verdict"] == key) for key, label in VERDICT.items()}
    print(f"저장: {out}\n" + " · ".join(f"{label} {n}" for label, n in counts.items()))
    if clipped:
        print("글이 길어 엑셀 칸에서 잘릴 수 있는 항목: " + ", ".join(clipped) + ". 글을 줄여 다시 실행하세요.")


main()
