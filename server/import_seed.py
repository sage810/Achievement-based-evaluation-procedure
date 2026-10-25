"""data/seed/*.json 중 DB에 아직 없는 성취기준만 더한다. 이미 있는 것(선생님이 고친 것 포함)은 건드리지 않는다.
성취기준 분석(data/seed-analysis/*.json)도 같은 방식으로 없는 것만 더한다.

실행: py -3.12 -m server.import_seed
"""
import json
from contextlib import closing

from server.main import SEED_DIR, Standard, connect, insert, seed_analyses

added = skipped = 0
with closing(connect()) as conn, conn:
    for path in sorted(SEED_DIR.glob("*.json")):
        for item in json.loads(path.read_text(encoding="utf-8")):
            s = Standard(**item)
            exists = conn.execute(
                "SELECT 1 FROM standards WHERE school_level = ? AND subject = ? AND code = ?",
                (s.school_level, s.subject, s.code),
            ).fetchone()
            if exists:
                skipped += 1
            else:
                insert(conn, s)
                added += 1
    analyses = seed_analyses(conn)
print(f"성취기준 새로 넣음 {added}개 · 이미 있어 건너뜀 {skipped}개 · 분석 새로 넣음 {analyses}개")
