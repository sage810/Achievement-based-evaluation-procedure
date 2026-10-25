import { useState } from 'react';
import { LEVELS, type AnalysisData, type ElementRow, type Leveling as LevelingData, type Standard } from './api';
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

  return (
    <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-leveling)' }}>
      <div className="msi-card-head">
        <span>⑧ 평가요소 수준화</span>
        <span className="r">① 도출 내용 확인 → ② 도출 이유 재확인 → ③ 수준화</span>
      </div>
      <div className="msi-card-body">
        {elements.length === 0 && <div className="msi-note">⑦ 평가요소가 아직 없어요.</div>}
        {elements.map((el, i) => {
          const lv = { ...emptyLeveling(), ...el.leveling };
          return (
            <div key={i} className="lvz-block">
              <h3 className="info-title">평가요소 {i + 1}</h3>
              {/* 6행 × 2열: 왼쪽 항목 이름, 오른쪽 내용 */}
              <table className="an-table lvz-info">
                <tbody>
                  <tr>
                    <th scope="row">평가요소</th>
                    <td className="lvz-element">{el.element || '(빈 평가요소)'}</td>
                  </tr>
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
                    <th scope="row">평가 방법</th>
                    <td>{el.method || '—'}</td>
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

              <div className="msi-table-scroll">
                <table className="an-table lvz-table">
                  <thead>
                    <tr>
                      <th scope="col">수준</th>
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
                        <td className="lv-statement">{std.levels[l]}</td>
                        <td className="lvz-cue">{cues[l]?.cues || '—'}</td>
                        {CELLS.map(([key]) => (
                          <td key={key}>
                            <Text value={lv.levels[l][key]} />
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
