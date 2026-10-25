import type { ElementRow } from './api';
import { Text } from './ReadOnly';

// 평가요소 표 — 교육과정 분석 ⑦ (연수 양식의 평가요소 추출 표). 읽기 전용.

const COLS = [
  ['element', '평가요소 (「~하기」로 진술)'],
  ['basis', '도출 근거 (②~⑥의 어떤 내용·해설에서)'],
  ['reason', '도출 이유 (왜 이것을 평가해야 하는가)'],
  ['content', '평가 내용 (무엇으로 확인할 것인가)'],
  ['method', '평가방법'],
] as const;

export default function ElementsTable({ rows }: { rows: ElementRow[] }) {
  return (
    <>
      {/* 평가요소마다 표 하나: 맨 위 「평가요소 N」, 아래로 항목 이름 | 내용 */}
      {rows.map((r, i) => (
        <table key={i} className="an-table el-table">
          <colgroup>
            <col className="el-label-col" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="colgroup" colSpan={2}>
                평가요소 {i + 1}
              </th>
            </tr>
          </thead>
          <tbody>
            {COLS.map(([key, label]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>
                  <Text value={r[key]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </>
  );
}
