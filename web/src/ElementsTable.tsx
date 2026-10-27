import { useEffect, useState } from 'react';
import type { ElementRow } from './api';
import { BasisText, EL_COLORS, type Spot } from './basisMarks';
import { Text } from './ReadOnly';

// 평가요소 표 — 교육과정 분석 ⑦ (연수 양식의 평가요소 추출 표). 읽기 전용.

const COLS = [
  ['element', '평가요소 (「~하기」로 진술)'],
  ['basis', '도출 근거 (②~⑥의 어떤 내용·해설에서)'],
  ['reason', '도출 이유 (왜 이것을 평가해야 하는가)'],
  ['content', '평가 내용 (무엇으로 확인할 것인가)'],
] as const;

export default function ElementsTable({ rows, basis }: { rows: ElementRow[]; basis: Spot[][] }) {
  // 위 본문에 실제로 밑줄이 그어진 「평가요소 번호|낱말」 — 이것만 도출 근거 링크로 만든다
  const [drawn, setDrawn] = useState<Set<string>>(new Set());
  useEffect(() => {
    const found = new Set<string>();
    document.querySelectorAll<HTMLElement>('.analysis .ul[data-el]').forEach((el) =>
      el.dataset.words!.split('|').forEach((w) => found.add(`${el.dataset.el}|${w}`)),
    );
    setDrawn(found);
  }, [rows, basis]);

  return (
    <>
      {/* 평가요소마다 표 하나: 표 위에 「평가요소 N」 알약(위 ②③⑤⑥ 본문의 도출 근거 밑줄과 같은 색), 표는 항목 이름 | 내용 */}
      {rows.length > 0 && (
        <p className="msi-small el-legend">
          위 ②·③·⑤·⑥ 본문의 색 밑줄은 같은 색 평가요소의 도출 근거예요. 도출 근거의 밑줄 친 낱말을 누르면 그곳으로 가요.
        </p>
      )}
      {rows.map((r, i) => (
        <div key={i} className="el-block">
          <h3 className={`msi-unit el-tag el-c${i % EL_COLORS}`}>평가요소 {i + 1}</h3>
          <table className="an-table el-table">
            <colgroup>
              <col className="el-label-col" />
              <col />
            </colgroup>
            <tbody>
              {COLS.map(([key, label]) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  <td>
                    {key === 'basis' ? (
                      <BasisText
                        text={r.basis}
                        i={i}
                        words={(basis[i] ?? []).flatMap((s) => s.words)}
                        has={(w) => drawn.has(`${i}|${w}`)}
                      />
                    ) : (
                      <Text value={r[key]} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
