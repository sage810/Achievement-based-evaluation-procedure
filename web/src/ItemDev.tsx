import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, LEVELS, type Curriculum, type ItemData, type ItemSet, type Level, type Standard } from './api';
import { areaNo } from './catalog';
import ContextBar, { focusFirstHeading, jumpTo, sectionInView, showSection, useScrollMemory } from './ContextBar';
import { Bullets, RichText, Text } from './ReadOnly';

// 문항 개발 탭 — 연수 양식 「[모듈 3] 수행평가 과제 및 채점기준표 개발」 모양으로 과제를 보여 준다.
// 읽기 전용: 성취기준을 골라 과제를 만들면 교육과정 분석 내용으로 미리 채우고, 「초안 요청」 뒤
// Claude Code 가 나머지를 채운다(절차: docs/문항-초안-절차.md). 선생님은 고치지 않는다(선생님 지시 2026-10-24).

const CATS = [
  ['knowledge', '지식·이해'],
  ['skills', '과정·기능'],
  ['attitude', '가치·태도'],
] as const;
const POLL_MS = 10_000;

const byLevel = (f: (lv: Level) => string) =>
  Object.fromEntries(LEVELS.map((lv) => [lv, f(lv)])) as Record<Level, string>;

type Status = { kind: 'ok' | 'error'; text: string } | null;

interface Props {
  schoolLevel: string;
  subject: string;
  items: Standard[];
  curriculum: Curriculum | null;
  stdCode: string | null; // 탭 사이에 이어지는 성취기준 — 처음 열 때 이것을 연다
  onStdChange: (code: string) => void;
  pickerOpen: boolean; // false 면 영역·성취기준 칸 대신 화면 위 한 줄 요약이 보인다
  onBarStuck: () => void;
}

const SECTIONS = [
  { id: 'sec-task', label: '1️⃣ 정보표' },
  { id: 'sec-question', label: '2️⃣ 문항' },
  { id: 'sec-rubric', label: '3️⃣ 채점기준표' },
  { id: 'sec-answers', label: '4️⃣ 예시답안' },
];

// 제목 줄 옆 ? — 누르면 안내 글
function HelpLine({ title, hint, id }: { title: string; hint: string; id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="std-line">
        <b>{title}</b>
        <button
          type="button"
          className="help-btn"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`${title} 설명 보기`}
          title={title}
          onClick={() => setOpen(!open)}
        >
          ?
        </button>
      </p>
      {open && (
        <p id={id} className="lvz-hint" role="note">
          {hint}
        </p>
      )}
    </>
  );
}

export default function ItemDev({ schoolLevel, subject, items, curriculum, stdCode, onStdChange, pickerOpen, onBarStuck }: Props) {
  const areas = curriculum?.areas ?? [];
  const [start] = useState(() => items.find((s) => s.code === stdCode) ?? null);
  const [list, setList] = useState<ItemSet[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [area, setArea] = useState(start ? areaNo(start.code) : (areas[0]?.no ?? ''));
  const inArea = useMemo(() => items.filter((s) => areaNo(s.code) === area), [items, area]);
  const [newStd, setNewStd] = useState<number | null>(start?.id ?? null);
  const [pickId, setPickId] = useState<number | null>(null); // 같은 성취기준 과제가 여럿일 때 목록에서 고른 것
  // 보이는 과제 = 고른 성취기준의 과제(목록에서 고른 것, 없으면 가장 최근 것)
  const current = useMemo(() => {
    const mine = list.filter((x) => x.data.standard_id === newStd);
    return mine.find((x) => x.id === pickId) ?? [...mine].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;
  }, [list, newStd, pickId]);
  const [elementsHint, setElementsHint] = useState(false); // 평가 요소 옆 ?
  const [listLoaded, setListLoaded] = useState(false); // 받기 전에는 「과제 없음」·초안 요청 버튼을 띄우지 않는다
  const [listOpen, setListOpen] = useState(false); // 평소에는 지금 과제 한 줄만 — 문항이 바로 보이게

  const refresh = () =>
    api
      .itemSets(schoolLevel, subject)
      .then((l) => {
        setList(l);
        setListLoaded(true);
        return l;
      })
      .catch((e) => {
        setStatus({ kind: 'error', text: `목록을 불러오지 못했어요: ${e.message}` });
        return [] as ItemSet[];
      });

  useEffect(() => {
    refresh().then((l) => {
      if (start || !l.length) return;
      // 이어 볼 성취기준이 없으면(이 브라우저에서 처음) 가장 최근에 고친 과제를 연다
      const latest = [...l].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
      const std = items.find((s) => s.id === latest.data.standard_id);
      if (!std) return;
      setArea(areaNo(std.code));
      setNewStd(std.id ?? null);
      setPickId(latest.id);
    });
  }, [schoolLevel, subject]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setArea((prev) => (areas.some((a) => a.no === prev) ? prev : (areas[0]?.no ?? ''))), [curriculum]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setNewStd((prev) => (inArea.some((s) => s.id === prev) ? prev : (inArea[0]?.id ?? null))), [area, items]); // eslint-disable-line react-hooks/exhaustive-deps

  useScrollMemory('items', current?.id, !!current);
  // ◀▶ 뒤에도 보던 구역을 유지한다
  const keep = useRef<string | null>(null);
  useEffect(() => {
    if (keep.current && current) showSection(keep.current);
    keep.current = null;
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosenCode = items.find((s) => s.id === newStd)?.code;
  useEffect(() => {
    if (chosenCode) onStdChange(chosenCode);
  }, [chosenCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 초안 요청 중이면 Claude Code 가 채울 때까지 가끔 다시 불러온다
  const requested = current?.status === 'requested';
  useEffect(() => {
    if (!requested) return;
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [requested]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!curriculum) {
    return (
      <div className="msi-note">
        <b>{subject}</b> 과목은 아직 교육과정 분석을 할 수 없어 문항 개발도 할 수 없어요. Claude Code에 이 과목의
        교육과정을 넣어 달라고 말해 주세요.
      </div>
    );
  }

  // 과제가 없는 성취기준에서 초안을 요청하면 교육과정 분석 탭의 내용으로 양식을 미리 채워 만들고 바로 요청한다
  async function create() {
    const std = items.find((s) => s.id === newStd);
    const areaInfo = areas.find((a) => a.no === area);
    if (!std || !areaInfo) return;
    setBusy(true);
    try {
      const an = await api.analysis(std.id!);
      const els = (an?.data.elements ?? []).filter((e) => e.element.trim());
      const code = `[${std.code}]`;
      const d: ItemData = {
        area: areaInfo.name,
        title: '',
        standard_id: std.id ?? null,
        standard: `${code} ${std.statement}`,
        levels: byLevel((lv) => std.levels[lv]),
        min_traits: byLevel(() => ''),
        curriculum_analysis: [
          std.explanation && `[성취기준 해설]\n${std.explanation}`,
          areaInfo.considerations.length && `[성취기준 적용 시 고려 사항]\n${areaInfo.considerations.join('\n')}`,
        ]
          .filter(Boolean)
          .join('\n'),
        content: {
          knowledge: std.knowledge.join('\n'),
          skills: std.skills.join('\n'),
          attitude: std.attitude.join('\n'),
        },
        elements: els.map((e) => e.element).join('\n'),
        method: '',
        lessons: ['1차시', '2-3차시', '4차시'].map((stage) => ({ stage, teaching: '', assessment: '' })),
        dev_direction: '',
        item_info: els.map((e, i) => ({ no: String(i + 1), standard: code, element: e.element })),
        question: '',
        rubric: els.map((e, i) => ({
          no: String(i + 1),
          element: e.element,
          criterion: '',
          // 교육과정 분석 ⑧ 수준화의 판단 준거(없으면 수준화된 평가요소)를 수행 수준 초안으로
          rows: LEVELS.map((lv) => ({
            level: lv,
            text: e.leveling?.levels[lv]?.criteria || e.leveling?.levels[lv]?.performance || '',
            score: '',
          })),
        })),
        basic_score: '',
        answers: els.map((_, i) => ({ no: String(i + 1), answer: '' })),
      };
      const it = await api.createItemSet({
        school_level: schoolLevel,
        subject,
        data: d,
        status: 'requested',
        ai_draft: false,
      });
      setPickId(it.id);
      await refresh();
      setStatus({
        kind: 'ok',
        text: `✓ [${std.code}] 과제를 만들고 초안을 요청했어요. Claude Code에 「문항 초안」이라고 말해 주세요.`,
      });
    } catch (e) {
      setStatus({ kind: 'error', text: `만들지 못했어요: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function requestDraft() {
    if (!current) return;
    // 이미 쓴 과제는 내용이 바뀔 수 있으므로 한 번 묻는다 (절차: 채워진 칸은 살리되 다듬을 수 있음)
    if (
      current.data.question.trim() &&
      !window.confirm(`Claude Code가 빈칸을 채우고, 이미 쓴 내용도 다듬을 수 있어요.
지금 내용이 바뀔 수 있어요. 다시 요청할까요?`)
    )
      return;
    setBusy(true);
    try {
      const { school_level, subject: subj, data, ai_draft } = current;
      await api.saveItemSet(current.id, { school_level, subject: subj, data, status: 'requested', ai_draft });
      await refresh();
      setStatus({ kind: 'ok', text: '✓ 초안을 요청했어요. Claude Code에 「문항 초안」이라고 말해 주세요.' });
    } catch (e) {
      setStatus({ kind: 'error', text: `요청하지 못했어요: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  // 평가 방법을 바꾸면 그 방법에 맞게 문항을 새로 구성할지 묻고, 「예」면 Claude Code 에 다시 구성을 요청한다
  async function changeMethod(method: string) {
    if (!current || method === current.data.method) return false;
    if (!window.confirm(`평가 방법을 「${method}」(으)로 바꾸면 Claude Code가 과제명·수업 단계·문항·채점기준표·예시답안을 새로 써요.
지금 내용은 덮어써져요. 바꿀까요?`)) return false;
    setBusy(true);
    try {
      const { school_level, subject: subj, data, ai_draft } = current;
      const next = { ...data, method, redraft: `평가 방법을 「${data.method || '없음'}」에서 「${method}」(으)로 바꿈` };
      await api.saveItemSet(current.id, { school_level, subject: subj, data: next, status: 'requested', ai_draft });
      await refresh();
      setStatus({ kind: 'ok', text: `✓ 「${method}」에 맞게 다시 구성을 요청했어요. Claude Code에 「문항 초안」이라고 말해 주세요.` });
      return true;
    } catch (e) {
      setStatus({ kind: 'error', text: `요청하지 못했어요: ${(e as Error).message}` });
      return false;
    } finally {
      setBusy(false);
    }
  }

  // 목록에서 과제를 고르면 영역·성취기준 선택도 그 과제 것으로 하고, 목록을 접어 과제 내용으로 간다
  function pickItem(it: ItemSet) {
    const std = items.find((s) => s.id === it.data.standard_id);
    if (!std) return;
    setArea(areaNo(std.code));
    setNewStd(std.id ?? null);
    setPickId(it.id);
    setStatus(null);
    setListOpen(false);
    onBarStuck(); // 위 선택 영역도 먼저 접어, 움직이는 도중에 자리가 바뀌지 않게 한다
    // 목록이 접힌 뒤의 자리로. 초안 대기 중이면 그 안내부터 보이게
    requestAnimationFrame(() => jumpTo(it.status === 'requested' ? 'sec-wait' : 'sec-task'));
  }

  // ◀ ▶ — 영역을 넘어 과목 전체 성취기준을 차례로
  const stdIndex = items.findIndex((s) => s.id === newStd);
  function goStd(s: Standard) {
    keep.current = sectionInView(SECTIONS.map((x) => x.id));
    setArea(areaNo(s.code));
    setNewStd(s.id ?? null);
    setPickId(null);
    setStatus(null);
  }

  async function remove(it: ItemSet) {
    if (!window.confirm(`「${it.data.title || it.data.standard}」 과제를 지울까요?`)) return;
    try {
      await api.deleteItemSet(it.id);
      await refresh();
      focusFirstHeading();
    } catch (e) {
      setStatus({ kind: 'error', text: `지우지 못했어요: ${(e as Error).message}` });
    }
  }

  const data = current?.data ?? null;
  const finished = !!data?.question.trim(); // 문항까지 쓰인 과제 — 주 버튼이 내려받기가 된다
  const chosen = inArea.find((s) => s.id === newStd) ?? null;
  const shownList = listOpen ? list : list.filter((it) => it.id === current?.id);
  // 만점 = 채점 요소마다 가장 높은 배점의 합
  const maxTotal = data?.rubric.reduce((s, b) => s + Math.max(0, ...b.rows.map((r) => Number(r.score) || 0)), 0) ?? 0;

  return (
    <div className="analysis">
      <section className="msi-card sec-pick">
        <div className="msi-card-head">
          <h2>수행평가 과제</h2>
          <span className="r">연수 양식 「수행평가 과제 및 채점기준표 개발」</span>
        </div>
        <div className="msi-card-body">
          {pickerOpen && (
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
              <label className="msi-label">
                성취기준
                <select
                  className="msi-field"
                  value={newStd ?? ''}
                  onChange={(e) => {
                    setNewStd(Number(e.target.value));
                    setPickId(null);
                    setStatus(null);
                  }}
                >
                  {inArea.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.statement}
                    </option>
                  ))}
                </select>
              </label>
              {/* 선택칸은 글이 길면 잘리므로 전문을 아래에 한 번 더 보여 준다 */}
              {chosen && (
                <p className="msi-small std-full">
                  [{chosen.code}] {chosen.statement}
                </p>
              )}
            </div>
          )}
          {list.length > 0 && (
            <div className="plan-master">
              <div className="plan-master-head">
                <h3 className="info-title">이 과목의 과제 {list.length}개</h3>
                {(listOpen || shownList.length < list.length) && (
                  <button type="button" className="head-btn" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
                    {listOpen ? '목록 접기' : current ? `다른 과제 보기 (${list.length - 1}개)` : '과제 목록 보기'}
                  </button>
                )}
              </div>
              {shownList.length > 0 && (
                <ul className="plan-list">
                  {shownList.map((it) => (
                    <li key={it.id} className={it.id === current?.id ? 'is-on' : ''}>
                      <button
                        type="button"
                        className="plan-name"
                        aria-pressed={it.id === current?.id}
                        onClick={() => pickItem(it)}
                      >
                        {it.data.title || '(과제명 없음)'}
                        <span className="plan-date">
                          {it.data.standard.length > 60 ? `${it.data.standard.slice(0, 60)}…` : it.data.standard} · <span className="nowrap">수정 {it.updated_at.replace('T', ' ').slice(0, 16)}</span>
                        </span>
                      </button>
                      {it.status === 'requested' && <span className="plan-status pending">초안 요청</span>}
                      {it.ai_draft && <span className="plan-status done">AI 초안</span>}
                      <button
                        type="button"
                        className="el-del"
                        onClick={() => remove(it)}
                        aria-label={`${it.data.title} 지우기`}
                      >
                        지우기
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* 과제가 있으면 상태는 아래쪽 버튼 옆(늘 보이는 자리)에 나온다 */}
          {status && !current && (
            <p className={`status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
              {status.text}
            </p>
          )}
          {!listLoaded && !status && (
            <p className="msi-small" role="status">
              불러오는 중이에요…
            </p>
          )}
        </div>
      </section>

      {chosen && (
        <ContextBar
          label={`[${chosen.code}]`}
          title={data?.title || chosen.statement}
          sections={current ? SECTIONS : []}
          onStuck={onBarStuck}
          step={{
            prev: stdIndex > 0 ? () => goStd(items[stdIndex - 1]) : undefined,
            next: stdIndex >= 0 && stdIndex < items.length - 1 ? () => goStd(items[stdIndex + 1]) : undefined,
          }}
        />
      )}

      {!current && newStd !== null && listLoaded && (
        <div className="msi-note new-item-note">
          <span>이 성취기준은 아직 과제가 없어요. 초안을 요청하면 교육과정 분석 내용으로 양식을 만들고 Claude Code가 채워요.</span>
          <button type="button" className="msi-btn" onClick={create} disabled={busy}>
            Claude Code 초안 요청
          </button>
        </div>
      )}

      {data && current && (
        <>
          {requested && (
            <div id="sec-wait" className="msi-note">
              <b>초안 요청 중이에요.</b> Claude Code에 「문항 초안」이라고 말하면 학습한 평가 자료 기준으로 빈칸을
              채워요. 채워지면 이 화면이 저절로 바뀌어요.
            </div>
          )}

          {/* 1️⃣ 수행평가 과제 정보표 */}
          <section id="sec-task" className="msi-card sec-ideas">
            <div className="msi-card-head">
              <h2>1️⃣ 수행평가 과제 정보표</h2>
              <span className="r">
                {subject} · {data.area}
              </span>
            </div>
            <div className="msi-card-body">
              <p className="std-line">
                <b>평가 과제명:</b>
                {data.title || '—'}
              </p>

              <p className="std-line">
                <b>성취기준:</b>
                {data.standard}
              </p>

              <p className="std-line">
                <b>평가 방법:</b>
                {data.method || '—'}
              </p>

              {/* 나머지는 접어 두어 문항·채점기준표가 바로 보이게 한다 (평가 방법 바꾸기도 이 안에 있다) */}
              <details className="task-more">
                <summary>
                  <span className="task-more-note">성취수준 · 교육과정 분석 · 내용 요소 · 평가 방법 바꾸기 · 수업 연계 · 문항 정보</span>
                </summary>
                <div className="task-more-body">
                  {/* 최소 능력자 수행 특성 — 표 위 제목, ? 는 뜻 */}
                  <HelpLine
                    title="성취수준별 최소 능력자의 수행 특성"
                    hint="성취수준별 최소 능력자의 수행 특성 (「겨우 그 수준에 드는 학생」이 보일 수행 — 분할점수의 근거)"
                    id="min-traits-hint"
                  />
                  <table className="an-table traits-table" aria-label="성취수준별 최소 능력자의 수행 특성">
                    <colgroup>
                      <col className="form-col-lv" />
                      <col />
                    </colgroup>
                    <tbody>
                      {LEVELS.map((lv) => (
                        <tr key={lv}>
                          <th scope="row">{lv}</th>
                          <td>
                            <Text value={data.min_traits[lv]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 성취기준별 성취수준 — 따로 표, ? 는 출처 안내 */}
                  <HelpLine title="성취기준별 성취수준" hint="원문 (교육과정 분석 탭과 같음)" id="levels-hint" />
                  <table className="an-table traits-table" aria-label="성취기준별 성취수준">
                    <colgroup>
                      <col className="form-col-lv" />
                      <col />
                    </colgroup>
                    <tbody>
                      {LEVELS.map((lv) => (
                        <tr key={lv}>
                          <th scope="row">{lv}</th>
                          <td className="lv-statement">{data.levels[lv]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 교육과정 분석 — 이름은 표 위 글로, [소제목]은 알약 태그 */}
                  <p className="std-line">
                    <b>교육과정 분석</b>
                  </p>
                  <table className="an-table">
                    <tbody>
                      <tr>
                        <td className="analysis-cell">
                          {splitSections(data.curriculum_analysis).map((sec, i) => (
                            <div key={i} className="analysis-sec">
                              {sec.label && <span className="tag-pill">{sec.label}</span>}
                              <Text value={sec.body} />
                            </div>
                          ))}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 내용 요소 — 이름은 표 위 글로 */}
                  <p className="std-line">
                    <b>내용 요소</b>
                  </p>
                  <table className="an-table form-table">
                    <colgroup>
                      <col className="form-col-label" />
                      <col />
                    </colgroup>
                    <tbody>
                      {CATS.map(([key, label]) => (
                        <tr key={key}>
                          <th scope="row">{label}</th>
                          <td>
                            <Bullets items={data.content[key].split('\n')} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <table className="an-table form-table">
                    <colgroup>
                      <col className="form-col-label" />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th scope="row">
                          <span className="th-with-help form-help">
                            평가 요소
                            <button
                              type="button"
                              className="help-btn"
                              aria-expanded={elementsHint}
                              aria-controls="elements-hint"
                              aria-label="평가 요소 작성 안내 보기"
                              title="평가 요소 작성 안내"
                              onClick={() => setElementsHint(!elementsHint)}
                            >
                              ?
                            </button>
                          </span>
                        </th>
                        <td>
                          {elementsHint && (
                            <p id="elements-hint" className="lvz-hint" role="note">
                              Claude Code가 「~하기」 꼴로 한 줄에 하나씩 채워요.
                            </p>
                          )}
                          <Bullets items={data.elements.split('\n')} />
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">평가 방법</th>
                        <td>
                          <MethodPicker
                            key={current.id}
                            value={data.method}
                            disabled={busy || requested}
                            onPick={changeMethod}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <h3 className="info-title">수업·평가 연계</h3>
                  <div className="msi-table-scroll">
                    <table className="an-table lesson-table">
                      <thead>
                        <tr>
                          <th scope="col">단계</th>
                          <th scope="col">교수･학습 활동</th>
                          <th scope="col">
                            평가 활동 및 주요 평가 내용<span className="th-sub">(진단·형성평가, 교사·동료 피드백)</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lessons.map((ls, i) => (
                          <tr key={i}>
                            <th scope="row">{ls.stage}</th>
                            <td data-label="교수･학습 활동">
                              <Tagged value={ls.teaching} />
                            </td>
                            <td data-label="평가 활동 및 주요 평가 내용">
                              <Tagged value={ls.assessment} />
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <th scope="row">
                            개발 방향 및<br />
                            활용 시 고려 사항
                          </th>
                          <td colSpan={2}>
                            <Text value={data.dev_direction} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="info-title">문항 정보</h3>
                  <div className="msi-table-scroll">
                    <table className="an-table info-table">
                      <thead>
                        <tr>
                          <th scope="col">문항/과제 번호</th>
                          <th scope="col">성취기준</th>
                          <th scope="col">평가 요소</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.item_info.map((r, i) => (
                          <tr key={i}>
                            <td data-label="문항/과제 번호">{r.no}</td>
                            <td data-label="성취기준">{r.standard}</td>
                            <td data-label="평가 요소">{r.element}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            </div>
          </section>

          {/* 2️⃣ 수행평가 문항 */}
          <section id="sec-question" className="msi-card sec-system">
            <div className="msi-card-head">
              <h2>2️⃣ 수행평가 문항</h2>
              <span className="r">발문 · 자료 · 〈조건〉 · [배점]</span>
            </div>
            <div className="msi-card-body">
              <div className="question-box">
                <RichText value={data.question} />
              </div>
            </div>
          </section>

          {/* 3️⃣ 채점기준표 */}
          <section id="sec-rubric" className="msi-card sec-doc">
            <div className="msi-card-head">
              <h2>3️⃣ 채점기준표</h2>
              <span className="r">만점 {maxTotal}점</span>
            </div>
            <div className="msi-card-body">
              {data.rubric.map((b, i) => (
                <div key={i} className="rubric-block">
                  <div className="rubric-head">
                    <b className="rubric-no">문항 {b.no || i + 1}</b>
                    <p className="rubric-meta">
                      <b>평가 요소:</b> {b.element}
                    </p>
                    <p className="rubric-meta">
                      <b>채점 요소:</b> {b.criterion || '—'}
                    </p>
                  </div>
                  <div className="msi-table-scroll">
                    <table className="an-table rubric-table">
                      <thead>
                        <tr>
                          <th scope="col">성취수준</th>
                          <th scope="col">수행 수준(채점기준)</th>
                          <th scope="col">배점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r, k) => (
                          <tr key={k}>
                            <th scope="row">{r.level}</th>
                            <td data-label="수행 수준(채점기준)">
                              <Text value={r.text} />
                            </td>
                            <td className="rubric-score" data-label="배점">{r.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <table className="an-table form-table basic-table" aria-label="기본점수">
                <colgroup>
                  <col className="form-col-label" />
                  <col />
                </colgroup>
                <tbody>
                  {basicRows(data.basic_score).map(([label, text]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>
                        <Text value={text} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4️⃣ 예시답안 */}
          <section id="sec-answers" className="msi-card sec-levels">
            <div className="msi-card-head">
              <h2>4️⃣ 예시답안</h2>
            </div>
            <div className="msi-card-body">
              <div className="msi-table-scroll">
                <table className="an-table answer-table">
                  <thead>
                    <tr>
                      <th scope="col">문항번호</th>
                      <th scope="col">예시 답안</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.answers.map((a, i) => (
                      <tr key={i}>
                        <td data-label="문항번호">{a.no}</td>
                        <td data-label="예시 답안">
                          <RichText value={a.answer} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {current.ai_draft && (
            <p className="msi-small std-full">
              Claude Code가 쓴 초안이에요. 학생에게 내기 전에 성취기준·채점기준과 대조해 주세요.
            </p>
          )}
          <div className="actions">
            <p className={`status ${status?.kind ?? ''}`} role="status" aria-live="polite">
              {status?.text}
            </p>
            <a className={`msi-btn dl-btn ${finished ? '' : 'secondary'}`} href={`/api/item-sets/${current.id}/docx`}>
              워드로 내려받기
            </a>
            <button
              type="button"
              className={`msi-btn ${finished ? 'secondary' : ''}`}
              onClick={requestDraft}
              disabled={busy || requested}
            >
              {requested ? '초안 요청됨' : finished ? '초안 다시 요청' : 'Claude Code 초안 요청'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 평가 방법 드롭다운 — 「직접 입력」이면 글칸 + 적용 버튼. 바꾸기를 취소하면 원래 값으로 돌아간다
const METHODS = ['논술', '구술/발표', '토의/토론', '프로젝트', '실험', '포트폴리오'];
const CUSTOM = '직접 입력';
function MethodPicker({
  value,
  disabled,
  onPick,
}: {
  value: string;
  disabled: boolean;
  onPick: (method: string) => Promise<boolean>;
}) {
  const known = METHODS.includes(value);
  const [pick, setPick] = useState(known || !value ? value : CUSTOM);
  const [custom, setCustom] = useState(known ? '' : value);
  useEffect(() => {
    setPick(METHODS.includes(value) || !value ? value : CUSTOM);
    if (!METHODS.includes(value)) setCustom(value);
  }, [value]);

  const choose = async (v: string) => {
    setPick(v);
    if (v === CUSTOM) return;
    if (!(await onPick(v))) setPick(known || !value ? value : CUSTOM);
  };
  const applyCustom = async () => {
    const v = custom.trim();
    if (v && !(await onPick(v))) setCustom(known ? '' : value);
  };

  return (
    <div className="method-pick">
      <select
        className="msi-field"
        aria-label="평가 방법"
        value={pick}
        disabled={disabled}
        onChange={(e) => choose(e.target.value)}
      >
        {!value && <option value="">선택</option>}
        {[...METHODS, CUSTOM].map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      {pick === CUSTOM && (
        <>
          <input
            className="msi-field"
            aria-label="평가 방법 직접 입력"
            value={custom}
            disabled={disabled}
            placeholder="평가 방법 입력"
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          />
          <button
            type="button"
            className="msi-btn secondary"
            disabled={disabled || !custom.trim() || custom.trim() === value}
            onClick={applyCustom}
          >
            적용
          </button>
        </>
      )}
    </div>
  );
}

// 기본점수 글(「항목: 내용」 줄)을 표 행으로. 같은 항목 줄은 한 칸에 모은다
function basicRows(text: string): [string, string][] {
  const rows: [string, string][] = [];
  for (const line of text.split('\n').filter((t) => t.trim())) {
    const m = line.match(/^([^:]{1,10}):\s*(.*)$/);
    const [label, body] = m ? [m[1].trim(), m[2]] : ['기본점수', line];
    const row = rows.find((r) => r[0] === label);
    if (row) row[1] += '\n' + body;
    else rows.push([label, body]);
  }
  return rows.length ? rows : [['기본점수', '']];
}

// 수업·평가 연계 칸 — 평가·피드백 이름만 알약 태그로
const TAG_RE = /\[(진단평가|형성평가)\]|(교사 피드백|동료 피드백|최소 성취수준 보장 연계 피드백):?/g;
function Tagged({ value }: { value: string }) {
  if (!value.trim()) return <span className="empty">—</span>;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of value.matchAll(TAG_RE)) {
    parts.push(value.slice(last, m.index), <span key={m.index} className="tag-pill tag-inline">{m[1] ?? m[2]}</span>);
    last = m.index + m[0].length;
  }
  parts.push(value.slice(last));
  return <div className="ro-text">{parts}</div>;
}

// 교육과정 분석 글을 [소제목] 줄 기준으로 나눈다
type Section = { label: string; body: string };
function splitSections(text: string): Section[] {
  const out: Section[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\[(.+)\]\s*$/);
    if (m) out.push({ label: m[1], body: '' });
    else if (out.length) out[out.length - 1].body += (out[out.length - 1].body ? '\n' : '') + line;
    else out.push({ label: '', body: line });
  }
  return out.length ? out : [{ label: '', body: '' }];
}
