import { Marked, type ElWord } from './basisMarks';

// 교육과정 분석 ⑤ — 문서 문장과 거기서 나온 평가 시사점을 같은 줄에 놓고 화살표로 잇는다. 읽기 전용.
// 자료에는 어느 시사점이 어느 문장에서 나왔는지 적혀 있지 않아, 같은 말이 얼마나 겹치는지로 짝을 찾는다.
// 시사점의 글자 조각 중 이 비율 이상이 어느 문장에도 없으면 잇지 않고 따로 모은다.
const MIN_OVERLAP = 0.2;

const pieces = (text: string) => {
  const s = text.replace(/[\s·,.「」()'"‘’]/g, '');
  const out = new Set<string>();
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3));
  return out;
};

// 시사점마다 가장 많이 겹치는 문장 번호 (없으면 -1)
function matchSources(source: string[], implications: string[]) {
  const sets = source.map(pieces);
  return implications.map((m) => {
    const mine = pieces(m);
    const scores = sets.map((set) => [...mine].filter((p) => set.has(p)).length / Math.max(1, mine.size));
    const best = Math.max(0, ...scores);
    return best >= MIN_OVERLAP ? scores.indexOf(best) : -1;
  });
}

export interface DocRow {
  label: string;
  source: string[];
  implications: string[];
  els: ElWord[];
  empty?: string; // 문서 문장이 없을 때 그 칸에 쓸 말
}

export default function DocTable({ rows }: { rows: DocRow[] }) {
  return (
    <table className="an-table doc-table">
      <thead>
        <tr>
          <th scope="col">구분</th>
          <th scope="col">교육과정 문서 내용</th>
          <th scope="col">분석 — 평가에 주는 시사점</th>
        </tr>
      </thead>
      {rows.map((r) => {
        const implications = r.implications.map((t) => t.trim()).filter(Boolean);
        const link = matchSources(r.source, implications);
        const free = implications.filter((_, k) => link[k] < 0);
        const lines = r.source.length ? r.source : [null];
        return (
          <tbody key={r.label}>
            {lines.map((s, i) => {
              const mine = s === null ? [] : implications.filter((_, k) => link[k] === i);
              const on = mine.length ? 'is-on' : '';
              return (
                <tr key={i}>
                  {i === 0 && (
                    <th scope="rowgroup" rowSpan={lines.length + (free.length ? 1 : 0)}>
                      {r.label}
                    </th>
                  )}
                  <td className={`dc-src ${on}`}>
                    {s === null ? (
                      <b className="empty">{r.empty ?? '—'}</b>
                    ) : (
                      <span>
                        <Marked text={s} els={r.els} />
                      </span>
                    )}
                  </td>
                  <td className={`dc-imp ${on}`}>
                    {mine.map((m, j) => (
                      <span key={j} className="dc-sticker">
                        <Marked text={m} els={r.els} />
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
            {free.length > 0 && (
              <tr>
                <td colSpan={2} className="dc-free">
                  <span className="dc-free-label">{r.source.length ? '특정 문장과 잇지 않은 시사점' : '문장이 없어 따로 둔 시사점'}</span>
                  {free.map((m, j) => (
                    <span key={j} className="dc-sticker">
                      <Marked text={m} els={r.els} />
                    </span>
                  ))}
                </td>
              </tr>
            )}
          </tbody>
        );
      })}
    </table>
  );
}
