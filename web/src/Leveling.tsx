import { useMemo, useState } from 'react';
import { LEVELS, type AnalysisData, type ElementRow, type Leveling as LevelingData, type Standard } from './api';
import { cueWords, EL_COLORS, Marked, sharedTints } from './basisMarks';
import { Text } from './ReadOnly';

// 교육과정 분석 ⑧ 평가요소 수준화 — ⑦에서 뽑은 평가요소마다
// ① 도출 내용 확인 → ② 도출 이유 재확인 → ③ A~E 수준화 (연수 양식 2-2). 읽기 전용.

const CELLS = [
  ['performance', '③ 수준화된 평가요소', '이 수준 학생이 해낼 수 있는 수행'],
  ['criteria', '판단 준거', '어떤 증거를 보이면 이 수준인가'],
  ['idea', '문항·과제 아이디어', ''],
] as const;

const emptyLeveling = (): LevelingData => ({
  recheck: '',
  levels: Object.fromEntries(LEVELS.map((lv) => [lv, { performance: '', criteria: '', idea: '' }])) as LevelingData['levels'],
});

interface Props {
  std: Standard;
  elements: ElementRow[];
  cues: AnalysisData['levels'];
}

export default function LevelingCard({ std, elements, cues }: Props) {
  const [hintOpen, setHintOpen] = useState<number | null>(null); // ? 를 누른 평가요소 번호
  // 평가요소·수준마다 진술문과 수준화된 평가요소에 함께 나오는 말
  const taken = useMemo(
    () =>
      elements.map((el) =>
        Object.fromEntries(LEVELS.map((l) => [l, sharedTints(std.levels[l], el.leveling?.levels[l]?.performance ?? '')])),
      ),
    [std, elements],
  );

  return (
    <section id="sec-leveling" className="msi-card sec-leveling">
      <div className="msi-card-head">
        <h2>⑧ 평가요소 수준화</h2>
        <span className="r">① 도출 내용 확인 → ② 도출 이유 재확인 → ③ 수준화</span>
      </div>
      <div className="msi-card-body">
        {elements.length === 0 && <div className="msi-note">⑦ 평가요소가 아직 없어요.</div>}
        {elements.length > 0 && <p className="msi-small el-legend">스티커는 수준화된 평가요소가 성취수준 진술문에서 가져온 말이에요.</p>}
        {elements.map((el, i) => {
          const lv = { ...emptyLeveling(), ...el.leveling };
          return (
            <div key={i} className="lvz-block">
              <h3 className={`msi-unit el-tag el-c${i % EL_COLORS}`}>평가요소 {i + 1}</h3>
              <table className="an-table lvz-info">
                <tbody>
                  <tr>
                    <th scope="row">평가요소</th>
                    <td className="lvz-element">{el.element || '(빈 평가요소)'}</td>
                  </tr>
                </tbody>
              </table>

              {/* ⑦과 같은 내용과 그 재확인이라 접어 둔다. 펼치면 표가 접기 띠에 붙는다 */}
              <details className="task-more lvz-more">
                <summary>
                  <span className="task-more-note">도출 근거 · 도출 이유 · 평가 내용 · 재확인</span>
                </summary>
                <table className="an-table lvz-info">
                  <tbody>
                    <tr>
                      <th scope="row">도출 근거</th>
                      <td>{el.basis}</td>
                    </tr>
                    <tr>
                      <th scope="row">도출 이유</th>
                      <td>{el.reason}</td>
                    </tr>
                    <tr>
                      <th scope="row">평가 내용</th>
                      <td>{el.content}</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <span className="th-with-help">
                          도출 이유 재확인
                          <button
                            type="button"
                            className="help-btn"
                            aria-expanded={hintOpen === i}
                            aria-controls={`recheck-hint-${i}`}
                            aria-label="도출 이유 재확인 점검 질문 보기"
                            title="점검 질문 보기"
                            onClick={() => setHintOpen(hintOpen === i ? null : i)}
                          >
                            ?
                          </button>
                        </span>
                      </th>
                      <td>
                        {hintOpen === i && (
                          <p id={`recheck-hint-${i}`} className="lvz-hint" role="note">
                            성취기준 진술·핵심 아이디어·성취기준 해설의 어느 부분과 이어지는가? 적용 시 고려사항에 맞는가? 다른
                            평가요소와 겹치지 않는가? 성취수준 A~E로 나눌 수 있을 만큼 구체적인가?
                          </p>
                        )}
                        <Text value={lv.recheck} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </details>

              <div className="msi-table-scroll">
                <table className={`an-table lvz-table ul-${i % EL_COLORS}`}>
                  <thead>
                    <tr>
                      <th scope="col">
                        수준<span className="th-sub">요소 {i + 1}</span>
                      </th>
                      <th scope="col">성취수준 진술문</th>
                      <th scope="col">수준 구분 단서 (분석 ⑥)</th>
                      {CELLS.map(([key, label, sub]) => (
                        <th key={key} scope="col">
                          {label}
                          {sub && <span className="th-sub">({sub})</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LEVELS.map((l) => (
                      <tr key={l}>
                        <th scope="row">{l}</th>
                        <td className="lv-statement" data-label="성취수준 진술문">
                          <Marked text={std.levels[l]} hl={cueWords(cues[l]?.cues ?? '', std.levels[l])} tint={taken[i][l][0]} />
                        </td>
                        <td className="lvz-cue" data-label="수준 구분 단서">
                          {cues[l]?.cues ? <Marked text={cues[l].cues} hl={cueWords(cues[l].cues, std.levels[l])} /> : '—'}
                        </td>
                        {CELLS.map(([key, label]) => (
                          <td key={key} data-label={label}>
                            {key === 'performance' && lv.levels[l][key].trim() ? (
                              <div className="ro-text">
                                <Marked text={lv.levels[l][key]} tint={taken[i][l][1]} />
                              </div>
                            ) : (
                              <Text value={lv.levels[l][key]} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
