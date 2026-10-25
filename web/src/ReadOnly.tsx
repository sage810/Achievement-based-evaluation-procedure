// 읽기 전용 글 — 입력칸 대신 쓰는 작은 조각들

// 줄바꿈을 살린 글. 비어 있으면 「—」
export function Text({ value }: { value: string }) {
  return value.trim() ? <div className="ro-text">{value}</div> : <span className="empty">—</span>;
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
