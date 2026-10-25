"""평가계획서 검토 도우미 — Claude Code 가 검토할 때 쓰는 명령 (절차: docs/평가계획서-검토-절차.md)

  py -3.12 tools/plan_review.py pending          검토 대기 목록
  py -3.12 tools/plan_review.py text <id>        원본에서 글자를 뽑아 data/plans/<id>.txt 로 저장
  py -3.12 tools/plan_review.py save <id> <json> 검토 결과 JSON({"summary", "items"})을 앱에 넣기

개발 서버(npm run dev)가 켜져 있어야 한다(API: http://localhost:8000).
"""
import json
import re
import struct
import sys
import urllib.request
import zipfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLANS = ROOT / "data" / "plans"
API = "http://localhost:8000/api"


def call(path: str, method: str = "GET", body: dict | None = None):
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        return json.load(res)


def pdf_text(path: Path) -> str:
    from pypdf import PdfReader

    return "".join(f"\n===== p.{i} =====\n{p.extract_text() or ''}" for i, p in enumerate(PdfReader(path).pages, 1))


def hwp_text(path: Path) -> str:
    """HWP 5.0 본문(BodyText/Section*)의 문단 글자(PARA_TEXT 레코드)만 뽑는다."""
    import olefile

    ole = olefile.OleFileIO(str(path))
    compressed = ole.openstream("FileHeader").read()[36] & 1
    sections = sorted((d for d in ole.listdir() if d[0] == "BodyText"), key=lambda d: int(d[1][7:]))
    paras = []
    for sec in sections:
        data = ole.openstream("/".join(sec)).read()
        if compressed:
            data = zlib.decompress(data, -15)
        i = 0
        while i < len(data):
            head = struct.unpack_from("<I", data, i)[0]
            tag, size = head & 0x3FF, (head >> 20) & 0xFFF
            i += 4
            if size == 0xFFF:
                size = struct.unpack_from("<I", data, i)[0]
                i += 4
            if tag == 67:  # HWPTAG_PARA_TEXT
                chars, j, t = [], 0, data[i : i + size]
                while j < len(t):
                    c = struct.unpack_from("<H", t, j)[0]
                    if c < 32:  # 제어 문자: 줄바꿈·탭은 살리고, 확장 제어(16바이트)는 건너뜀
                        if c in (9, 10, 13):
                            chars.append("\t" if c == 9 else "\n")
                        j += 2 if c in (0, 9, 10, 13) else 16
                        continue
                    chars.append(chr(c))
                    j += 2
                paras.append("".join(chars).strip())
            i += size
    return "\n".join(p for p in paras if p)


def hwpx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as z:
        names = sorted(n for n in z.namelist() if re.match(r"Contents/section\d+\.xml$", n))
        out = []
        for n in names:
            xml = z.read(n).decode("utf-8")
            for para in re.findall(r"<hp:p\b.*?</hp:p>", xml, flags=re.S):
                text = "".join(re.findall(r"<hp:t\b[^>]*>(.*?)</hp:t>", para, flags=re.S))
                text = re.sub(r"<[^>]+>", "", text).strip()
                if text:
                    out.append(text)
        return "\n".join(out)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    cmd, *args = sys.argv[1:] or ["help"]
    if cmd == "pending":
        rows = [r for r in call("/plan-reviews") if r["status"] == "pending"]
        for r in rows:
            print(f"{r['id']}\t{r['filename']}\t올림 {r['uploaded_at']}")
        if not rows:
            print("검토 대기 중인 평가계획서가 없습니다.")
    elif cmd == "text":
        rid = int(args[0])
        src = next(PLANS.glob(f"{rid}.*"))
        reader = {".pdf": pdf_text, ".hwp": hwp_text, ".hwpx": hwpx_text}[src.suffix.lower()]
        out = PLANS / f"{rid}.txt"
        out.write_text(reader(src), encoding="utf-8")
        print(out)
    elif cmd == "save":
        rid, path = int(args[0]), Path(args[1])
        res = call(f"/plan-reviews/{rid}/result", "PUT", json.loads(path.read_text(encoding="utf-8")))
        print(f"저장됨: {res['filename']} ({res['status']}, 항목 {len(res['result']['items'])}개)")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
