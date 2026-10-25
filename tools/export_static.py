"""GitHub Pages 읽기 전용 배포판용 데이터 — git 에 있는 seed 만으로 임시 DB를 만들어 snapshot.json 으로 내보낸다.

로컬 data/assessment.db(선생님이 고친 내용·학교 문서)는 건드리지도 싣지도 않는다.
실행: py -3.12 tools/export_static.py dist/snapshot.json
"""
import json
import os
import sys
import tempfile
from pathlib import Path

out = Path(sys.argv[1])
with tempfile.TemporaryDirectory() as tmp:
    os.environ["ASSESSMENT_DB"] = str(Path(tmp) / "snapshot.db")
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from server import main  # 불러올 때 빈 임시 DB에 seed 를 넣는다

    standards = main.list_standards()
    analyses = {s["id"]: a for s in standards if (a := main.get_analysis(s["id"]))}
    curriculum = json.loads(main.CURRICULUM_PATH.read_text(encoding="utf-8")) if main.CURRICULUM_PATH.exists() else []
    snapshot = {
        "standards": standards,
        "analyses": analyses,
        "curriculum": curriculum,
        "review_template": main.get_review_template(),
    }

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")
print(f"{out} — 성취기준 {len(standards)}개 · 분석 {len(analyses)}개")
