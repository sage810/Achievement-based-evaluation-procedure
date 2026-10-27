import { useEffect, useMemo, useState } from 'react';
import { api, LEVELS, type AnalysisData, type Curriculum, type Standard } from './api';
import { analysisMarkdown, downloadMarkdown } from './analysisMarkdown';
import { areaNo } from './catalog';
import ElementsTable from './ElementsTable';
import LevelingCard from './Leveling';
import { Bullets, Text } from './ReadOnly';

// 교육과정 분석 탭 — 연수 양식(①~⑧) 순서대로 한 성취기준의 분석을 보여 준다.
// 읽기 전용: 내용은 Claude Code 가 채우고 선생님은 고치지 않는다(선생님 지시 2026-10-24).

const CATS = [
  ['knowledge', '지식·이해'],
  ['skills', '과정·기능'],
  ['attitude', '가치·태도'],
] as const;

const CONN_ROWS = [
  ['standard', '성취기준'],
  ['idea', '핵심 아이디어'],
  ['link', '성취기준과 핵심 아이디어의 연결점'],
] as const;

// 해설 문단을 문장(「~다.」) 단위로 나눈다
const sentences = (text: string) => text.split(/(?<=다\.)\s+/).filter((t) => t.trim());

interface Props {
  subject: string;
  items: Standard[];
  curriculum: Curriculum | null;
}

export default function Analysis({ subject, items, curriculum }: Props) {
  const areas = curriculum?.areas ?? [];
  const [area, setArea] = useState(areas[0]?.no ?? '');
  const inArea = useMemo(() => items.filter((s) => areaNo(s.code) === area), [items, area]);
  const [stdId, setStdId] = useState<number | null>(null);
  const std = items.find((s) => s.id === stdId) ?? null;
  const areaInfo = areas.find((a) => a.no === area) ?? null;

  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [connHint, setConnHint] = useState(false); // 「성취기준과의 연결」 ? 질문

  // 과목이 바뀌면 첫 영역으로
  useEffect(() => setArea(areas[0]?.no ?? ''), [curriculum]); // eslint-disable-line react-hooks/exhaustive-deps

  // 영역이 바뀌면 그 영역 첫 성취기준으로
  useEffect(() => setStdId(inArea[0]?.id ?? null), [area, items]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stdId === null) {
      setData(null);
      return;
    }
    let alive = true;
    setError('');
    api
      .analysis(stdId)
      .then((a) => alive && setData(a?.data ?? null))
      .catch((e) => alive && setError(`분석을 불러오지 못했어요: ${e.message}`));
    return () => {
      alive = false;
    };
  }, [stdId]);

  if (!curriculum) {
    return (
      <div className="msi-note">
        <b>{subject}</b> 과목은 교육과정 내용 체계(핵심 아이디어·지식·이해·과정·기능·가치·태도)가 아직 없어 분석할 수 없어요.
        Claude Code에 이 과목의 교육과정을 넣어 달라고 말해 주세요.
      </div>
    );
  }

  return (
    <div className="analysis">
      {/* ① 영역·성취기준 고르기 */}
      <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-pick)' }}>
        <div className="msi-card-head">
          <span>① 영역 · 성취기준 선택</span>
        </div>
        <div className="msi-card-body">
          <div className="pick-row pick-stack">
            <label className="msi-label">
              영역
              <select className="msi-field" value={area} onChange={(e) => setArea(e.target.value)}>
                {areas.map((a) => (
                  <option key={a.no} value={a.no}>
                    {Number(a.no)}. {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="msi-label pick-std">
              성취기준
              <select className="msi-field" value={stdId ?? ''} onChange={(e) => setStdId(Number(e.target.value))}>
                {inArea.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.statement}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {error && <p className="status error">{error}</p>}
      {!std || !areaInfo ? (
        <div className="msi-note">이 영역에 성취기준이 없어요.</div>
      ) : !data ? (
        <div className="msi-note">이 성취기준은 아직 분석이 없어요. Claude Code에 분석을 채워 달라고 말해 주세요.</div>
      ) : (
        <>
          {/* ② 핵심 아이디어 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-ideas)' }}>
            <div className="msi-card-head">
              <span>② 핵심 아이디어</span>
              <span className="r">✓ 맞닿은 문장</span>
            </div>
            <div className="msi-card-body">
              <ul className="idea-list">
                {areaInfo.core_ideas.map((t, i) => {
                  const on = data.core_idea_links.includes(i);
                  return (
                    <li key={i}>
                      <div className={`idea ${on ? 'is-on' : ''}`}>
                        <span className="idea-mark" aria-label={on ? '맞닿음' : undefined}>
                          {on ? '✓' : ''}
                        </span>
                        <span>{t}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <span className="th-with-help conn-head">
                <b className="msi-label">성취기준과의 연결</b>
                <button
                  type="button"
                  className="help-btn"
                  aria-expanded={connHint}
                  aria-controls="conn-hint"
                  aria-label="성취기준과의 연결 점검 질문 보기"
                  title="점검 질문 보기"
                  onClick={() => setConnHint(!connHint)}
                >
                  ?
                </button>
              </span>
              {connHint && (
                <p id="conn-hint" className="lvz-hint" role="note">
                  이 성취기준을 배우면 핵심 아이디어의 어느 부분에 다가가는가?
                </p>
              )}
              <table className="an-table conn-table">
                <tbody>
                  {CONN_ROWS.map(([key, label]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>
                        <Text value={data.core_idea_connection[key]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ③ 내용 체계 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-system)' }}>
            <div className="msi-card-head">
              <span>③ 내용 체계 — 범주별 내용 요소</span>
            </div>
            <div className="msi-card-body">
              <div className="ks-table" role="table">
                <div className="ks-row ks-head" role="row">
                  <span role="columnheader">범주</span>
                  <span role="columnheader">내용 요소 (교육과정 내용 체계)</span>
                  <span role="columnheader">★ 이 성취기준과 직접 관련된 요소</span>
                </div>
                {CATS.map(([key, label]) => (
                  <div key={key} className="ks-row" role="row">
                    <b role="rowheader">{label}</b>
                    <ul role="cell">
                      {areaInfo[key].map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                    <ul role="cell" className="ks-star">
                      {std[key].length ? std[key].map((t, i) => <li key={i}>{t}</li>) : <li className="empty">없음</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ⑤ 해설 · 적용 시 고려 사항 — 3×3 표 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-doc)' }}>
            <div className="msi-card-head">
              <span>⑤ 성취기준 해설 · 적용 시 고려 사항</span>
            </div>
            <div className="msi-card-body">
              <div className="msi-table-scroll">
                <table className="an-table doc-table">
                  <thead>
                    <tr>
                      <th scope="col">구분</th>
                      <th scope="col">교육과정 문서 내용</th>
                      <th scope="col">분석 — 평가에 주는 시사점</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">성취기준 해설</th>
                      <td>
                        {std.explanation ? (
                          <ul className="info-list">
                            {sentences(std.explanation).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        ) : (
                          <b className="empty">해설 없음</b>
                        )}
                      </td>
                      <td>
                        <Bullets items={data.explanation_implications} />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">적용 시 고려 사항</th>
                      <td>
                        <ul className="info-list">
                          {areaInfo.considerations.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <Bullets items={data.consideration_implications} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ⑥ 성취수준 범주별 분석 — 6×6 표 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-levels)' }}>
            <div className="msi-card-head">
              <span>⑥ 성취기준별 성취수준 범주별 분석</span>
              <span className="r">위에서 아래로 무엇이 빠지는지</span>
            </div>
            <div className="msi-card-body">
              <div className="msi-table-scroll">
                <table className="an-table lv-table">
                  <thead>
                    <tr>
                      <th scope="col">수준</th>
                      <th scope="col">성취수준 진술문</th>
                      <th scope="col">지식·이해</th>
                      <th scope="col">과정·기능</th>
                      <th scope="col">가치·태도</th>
                      <th scope="col">수준 구분 단서 (수식어·동사)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEVELS.map((lv) => (
                      <tr key={lv}>
                        <th scope="row">{lv}</th>
                        <td className="lv-statement">{std.levels[lv]}</td>
                        {(['knowledge', 'skills', 'attitude', 'cues'] as const).map((key) => (
                          <td key={key} className={key === 'cues' ? 'cue' : ''}>
                            {/* 지식·이해, 과정·기능은 한 줄에 하나씩 점으로 */}
                            {key === 'knowledge' || key === 'skills' ? (
                              <Bullets items={data.levels[lv][key].split('\n')} />
                            ) : (
                              <Text value={data.levels[lv][key]} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ⑦ 평가요소 추출 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-elements)' }}>
            <div className="msi-card-head">
              <span>⑦ 평가요소 추출</span>
              <span className="r">무엇을 + 어떻게 → ~하기</span>
            </div>
            <div className="msi-card-body">
              <ElementsTable rows={data.elements} />
            </div>
          </section>

          {/* ⑧ 평가요소 수준화 */}
          <LevelingCard std={std} elements={data.elements} cues={data.levels} />

          <div className="md-save">
            <button
              type="button"
              className="msi-btn"
              onClick={() => downloadMarkdown(`교육과정분석_${std.code}.md`, analysisMarkdown(std, areaInfo, data))}
            >
              이 성취기준 분석 md 파일로 저장
            </button>
          </div>
        </>
      )}
    </div>
  );
}
