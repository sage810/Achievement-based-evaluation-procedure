"""문항 개발 초안 도우미 — Claude Code 가 「문항 초안」 요청을 처리할 때 쓰는 명령 (절차: docs/문항-초안-절차.md)

  py -3.12 tools/item_draft.py pending           초안 요청 목록
  py -3.12 tools/item_draft.py show <id>         지금 내용을 data/items/<id>.json 으로 꺼내기
  py -3.12 tools/item_draft.py save <id> <json>  채운 JSON 을 앱에 넣기(초안 요청 해제, 「AI 초안」 표시)
  py -3.12 tools/item_draft.py new <학교급> <성취기준 코드>   과제가 없을 때 교육과정 분석 내용으로 정보표를 미리 채워 새 과제 만들기
                                                  (화면의 「Claude Code 초안 요청」과 같은 내용, 예: new 중학교 9정04-01)
  py -3.12 tools/item_draft.py find <성취기준 코드>   그 성취기준의 과제 id 찾기
  py -3.12 tools/item_draft.py check <id 또는 json>   채점기준표 규칙 검사(A~E 5행, 등간격, [n점] 합 = 만점, 기본점수, 금지어, 「~한 경우」)

개발 서버(npm run dev)가 켜져 있어야 한다(API: http://localhost:8000).
"""
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "data" / "items"
API = "http://localhost:8000/api"


def call(path: str, method: str = "GET", body: dict | None = None):
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        return json.load(res)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    cmd, *args = sys.argv[1:] or ["help"]
    if cmd == "pending":
        rows = [r for r in call("/item-sets") if r["status"] == "requested"]
        for r in rows:
            print(f"{r['id']}\t{r['school_level']} {r['subject']}\t{r['data']['standard']}\t{r['data']['title']}")
            if r["data"].get("redraft"):
                print(f"\t↳ 다시 구성: {r['data']['redraft']}")
        if not rows:
            print("초안 요청된 과제가 없습니다.")
    elif cmd == "show":
        rid = int(args[0])
        r = call(f"/item-sets/{rid}")
        ITEMS.mkdir(parents=True, exist_ok=True)
        out = ITEMS / f"{rid}.json"
        out.write_text(json.dumps(r["data"], ensure_ascii=False, indent=2), encoding="utf-8")
        print(out)
    elif cmd == "save":
        rid, path = int(args[0]), Path(args[1])
        cur = call(f"/item-sets/{rid}")
        body = {
            "school_level": cur["school_level"],
            "subject": cur["subject"],
            "data": {k: v for k, v in json.loads(path.read_text(encoding="utf-8")).items() if k != "redraft"},
            "status": "draft",
            "ai_draft": True,
        }
        res = call(f"/item-sets/{rid}", "PUT", body)
        print(f"저장됨: {res['data']['title']} (채점 요소 {len(res['data']['rubric'])}개)")
    elif cmd == "find":
        code = args[0].strip("[]")
        rows = [r for r in call("/item-sets") if r["data"]["standard"].startswith(f"[{code}]")]
        for r in rows:
            print(f"{r['id']}\t{r['status']}\t{r['data']['title'] or '(과제명 없음)'}")
        if not rows:
            print(f"[{code}] 과제가 없습니다. new 로 만드세요.")
    elif cmd == "new":
        level, code = args[0], args[1].strip("[]")
        print(new_item(level, code))
    elif cmd == "check":
        arg = args[0]
        data = (json.loads(Path(arg).read_text(encoding="utf-8")) if arg.endswith(".json")
                else call(f"/item-sets/{int(arg)}")["data"])
        problems = check(data)
        print("\n".join(problems) if problems else "통과: 채점기준표 규칙을 모두 지킴")
    else:
        print(__doc__)


LEVELS = "ABCDE"


def new_item(level: str, code: str) -> int:
    """화면 「초안 요청」(web/src/ItemDev.tsx create)과 같은 방식으로 정보표를 미리 채운 과제를 만들고 id 를 돌려준다."""
    q = lambda **kw: urllib.parse.urlencode(kw)
    std = next(s for s in call(f"/standards?{q(school_level=level, subject='정보')}") if s["code"] == code)
    cur = call(f"/curriculum?{q(school_level=level, subject='정보')}")
    area = next(a for a in cur["areas"] if a["no"] == code.split("정")[1][:2])
    an = call(f"/analyses/{std['id']}") or {"data": {}}
    els = [e for e in an["data"].get("elements", []) if e.get("element", "").strip()]
    tag = f"[{code}]"
    lv = lambda e, k: ((e.get("leveling") or {}).get("levels", {}).get(k) or {})
    data = {
        "area": area["name"],
        "title": "",
        "standard_id": std["id"],
        "standard": f"{tag} {std['statement']}",
        "levels": {k: std["levels"][k] for k in LEVELS},
        "min_traits": {k: "" for k in LEVELS},
        "curriculum_analysis": "\n".join(x for x in [
            std["explanation"] and f"[성취기준 해설]\n{std['explanation']}",
            area["considerations"] and "[성취기준 적용 시 고려 사항]\n" + "\n".join(area["considerations"]),
        ] if x),
        "content": {k: "\n".join(std[k]) for k in ("knowledge", "skills", "attitude")},
        "elements": "\n".join(e["element"] for e in els),
        "method": "논술",
        "lessons": [{"stage": s, "teaching": "", "assessment": ""} for s in ("1차시", "2-3차시", "4차시")],
        "dev_direction": "",
        "item_info": [{"no": str(i + 1), "standard": tag, "element": e["element"]} for i, e in enumerate(els)],
        "question": "",
        "rubric": [{"no": str(i + 1), "element": e["element"], "criterion": "",
                    "rows": [{"level": k, "text": lv(e, k).get("criteria") or lv(e, k).get("performance") or "", "score": ""}
                             for k in LEVELS]} for i, e in enumerate(els)],
        "basic_score": "",
        "answers": [{"no": str(i + 1), "answer": ""} for i in range(len(els))],
    }
    res = call("/item-sets", "POST", {"school_level": level, "subject": "정보", "data": data,
                                      "status": "draft", "ai_draft": False})
    return res["id"]


def check(d: dict) -> list[str]:
    """docs/문항-초안-절차.md 의 채점기준표 규칙 검사. 어긴 것만 돌려준다."""
    out, tops, e_min = [], [], []
    for b in d["rubric"]:
        no = b.get("no") or "?"
        rows = b["rows"]
        if [r["level"] for r in rows] != list(LEVELS):
            out.append(f"문항 {no}: 성취수준 행이 A·B·C·D·E 5행이 아님")
            continue
        try:
            sc = [int(r["score"]) for r in rows]
        except ValueError:
            out.append(f"문항 {no}: 배점이 정수가 아님")
            continue
        if len({sc[k] - sc[k + 1] for k in range(4)}) != 1 or sc[0] <= sc[1]:
            out.append(f"문항 {no}: 배점이 등간격 내림차순이 아님 {sc}")
        if sc[-1] < 2:
            out.append(f"문항 {no}: E 배점이 2점 미만 {sc}")
        tops.append(sc[0])
        e_min.append(sc[-1])
        for r in rows:
            t = r["text"].strip()
            if re.search("못|미흡|부족", t):
                out.append(f"문항 {no} {r['level']}행: 결핍어(못·미흡·부족)")
            if not re.search(r"경우(\(.*\))?$", t):
                out.append(f"문항 {no} {r['level']}행: 「~한 경우」로 끝나지 않음")
            if ", 또는 " in t:
                out.append(f"문항 {no} {r['level']}행: 「, 또는」 나열")
        if len({r["text"] for r in rows}) < 5:
            out.append(f"문항 {no}: 같은 문장 행이 있음(배타성)")
    total = sum(tops)
    head, _, rest = d["question"].partition("\n")  # 첫 줄(※ …)의 [n점]·[총 n점]은 전체 점수
    m = re.search(r"\[(?:총 ?)?(\d+)점\]", head)
    if m and int(m.group(1)) != total:
        out.append(f"문항 머리 [{m.group(0)}] ≠ 채점표 만점 {total}점")
    pts = [int(x) for x in re.findall(r"\[(\d+)점\]", rest)]
    if pts and sum(pts) != total:
        out.append(f"하위 문항 [n점] 합 {pts} ≠ 채점표 만점 {total}점")
    bm = re.match(r"기본점수:\s*(\d+)점", d.get("basic_score", ""))
    if not bm:
        out.append("기본점수 줄(「기본점수: n점 …」)이 없음")
    else:
        b = int(bm.group(1))
        if not (0.2 * total <= b < 0.4 * total):
            out.append(f"기본점수 {b}점이 만점 {total}점의 20% 이상 40% 미만이 아님")
        if b >= sum(e_min):
            out.append(f"기본점수 {b}점이 E 최저점 합 {sum(e_min)}점보다 낮지 않음")
    if len(d["answers"]) != len(d["rubric"]) or any(not a["answer"].strip() for a in d["answers"]):
        out.append("예시답안이 문항 수만큼 채워지지 않음")
    if any(not d["min_traits"].get(k, "").strip() for k in LEVELS):
        out.append("최소 능력자 수행 특성 A~E 중 빈칸이 있음")
    return out


if __name__ == "__main__":
    main()
