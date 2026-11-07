// 읽기 전용 글 — 입력칸 대신 쓰는 작은 조각들

// 줄바꿈을 살린 글. 비어 있으면 「—」
export function Text({ value }: { value: string }) {
  return value.trim() ? <div className="ro-text">{value}</div> : <span className="empty">—</span>;
}

// 문항·예시답안 글 — 「| 칸 | 칸 |」 줄이 2줄 이상 이어진 곳은 표로 보여 준다
const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isRule = (l: string) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
const cellsOf = (l: string) =>
  l
    .trim()
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());

export function RichText({ value }: { value: string }) {
  if (!value.trim()) return <span className="empty">—</span>;
  const lines = value.split('\n');
  const blocks: (string | string[][])[] = [];
  for (let i = 0; i < lines.length; ) {
    let j = i;
    while (j < lines.length && isRow(lines[j])) j++;
    if (j - i >= 2) {
      blocks.push(lines.slice(i, j).filter((l) => !isRule(l)).map(cellsOf));
      i = j;
    } else {
      const last = blocks[blocks.length - 1];
      if (typeof last === 'string') blocks[blocks.length - 1] = `${last}\n${lines[i]}`;
      else blocks.push(lines[i]);
      i++;
    }
  }
  return (
    <>
      {blocks.map((b, k) =>
        typeof b === 'string' ? (
          <div key={k} className="ro-text">
            {b}
          </div>
        ) : (
          <div key={k} className="msi-table-scroll ro-table-wrap">
            <table className="an-table ro-table">
              <thead>
                <tr>
                  {b[0].map((c, n) => (
                    <th key={n} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.slice(1).map((row, r) => (
                  <tr key={r}>
                    {row.map((c, n) => (
                      <td key={n}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </>
  );
}

// 한 줄에 하나인 목록을 점 목록으로. 비어 있으면 「—」
export function Bullets({ items }: { items: string[] }) {
  const list = items.map((t) => t.trim()).filter(Boolean);
  if (!list.length) return <span className="empty">—</span>;
  return (
    <ul className="info-list">
      {list.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}
