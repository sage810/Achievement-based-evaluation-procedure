import { useEffect, useRef, useState } from 'react';
import { api, type PlanReview as Review, type ReviewSheet, type Verdict } from './api';
import ContextBar, { focusFirstHeading, jumpTo, useScrollMemory } from './ContextBar';

// 평가계획서 검토 탭 — 올리면 「검토 대기」로 쌓이고, Claude Code 가 검토 템플릿 38개 항목으로
// 판정·근거·수정 제안을 채우면 여기서 보고 엑셀로 내려받는다 (절차: docs/평가계획서-검토-절차.md)

const VERDICT_LABEL: Record<Verdict, string> = { bad: '✖ 문제', warn: '△ 고민 필요', ok: '✔ 잘 됨', na: '－ 해당 없음' };
const SHEET_ACCENT = { intent: 'var(--hd-ideas)', rules: 'var(--hd-system)' };
const POLL_MS = 10_000;

const dateText = (iso: string | null) => (iso ? iso.replace('T', ' ').slice(0, 16) : '');

type Status = { kind: 'ok' | 'error'; text: string } | null;

export default function PlanReview() {
  const [sheets, setSheets] = useState<ReviewSheet[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [listLoaded, setListLoaded] = useState(false);
  const [filter, setFilter] = useState<Verdict | null>(null); // 판정 알약으로 걸러 보기 (화면만, 엑셀은 그대로)
  useEffect(() => setFilter(null), [selected]);
  const [listOpen, setListOpen] = useState(false); // 평소에는 지금 계획서 한 줄만 — 결과가 바로 보이게

  // 고른 것이 없으면(처음 열 때, 지운 뒤) 가장 최근에 검토한 것을, 그것도 없으면 가장 최근에 올린 것을 연다
  useEffect(() => {
    if (!reviews.length || reviews.some((r) => r.id === selected)) return;
    const recent = (key: 'reviewed_at' | 'uploaded_at') =>
      [...reviews].filter((r) => r[key]).sort((a, b) => (b[key] ?? '').localeCompare(a[key] ?? ''))[0];
    setSelected((recent('reviewed_at') ?? recent('uploaded_at') ?? reviews[0]).id);
  }, [reviews, selected]);

  const refresh = () =>
    api
      .planReviews()
      .then((list) => {
        setReviews(list);
        setListLoaded(true);
      })
      .catch((e) => setStatus({ kind: 'error', text: `목록을 불러오지 못했어요: ${e.message}` }));

  useEffect(() => {
    api
      .reviewTemplate()
      .then(setSheets)
      .catch((e) => setStatus({ kind: 'error', text: `검토 항목을 불러오지 못했어요: ${e.message}` }));
    refresh();
  }, []);

  // 검토 대기가 있으면 Claude Code 가 결과를 넣을 때까지 가끔 다시 불러온다
  const anyPending = reviews.some((r) => r.status === 'pending');
  useEffect(() => {
    if (!anyPending) return;
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [anyPending]);

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const r = await api.uploadPlan(file);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      await refresh();
      setSelected(r.id);
      setStatus({ kind: 'ok', text: `✓ 「${r.filename}」을 올렸어요. Claude Code에 「평가계획서 검토」라고 말해 주세요.` });
      // 다 올렸으니 올리기 칸을 접는다 (누른 버튼이 숨으므로 포커스는 접는 줄로)
      requestAnimationFrame(() => {
        const more = document.querySelector<HTMLDetailsElement>('.upload-more');
        if (more) more.open = false;
        more?.querySelector('summary')?.focus();
      });
    } catch (e) {
      setStatus({ kind: 'error', text: `올리지 못했어요: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Review) {
    if (!window.confirm(`「${r.filename}」과 검토 결과를 지울까요?`)) return;
    try {
      await api.deletePlan(r.id);
      if (selected === r.id) setSelected(null);
      await refresh();
      focusFirstHeading();
    } catch (e) {
      setStatus({ kind: 'error', text: `지우지 못했어요: ${(e as Error).message}` });
    }
  }

  const current = reviews.find((r) => r.id === selected) ?? null;
  useScrollMemory('review', current?.id, !!current?.result && sheets.length > 0);
  const items = current?.result?.items ?? {};
  const count = (v: Verdict) => Object.values(items).filter((it) => it.verdict === v).length;
  const shown = (id: string) => !filter || items[id]?.verdict === filter;
  // 문제가 있어도 통과처럼 보이지 않도록, 완료 칩에는 문제 수를 함께 적는다
  const statusLabel = (r: Review) => {
    if (r.status !== 'done') return '검토 대기';
    const bad = Object.values(r.result?.items ?? {}).filter((it) => it.verdict === 'bad').length;
    return bad ? `검토 완료 · 문제 ${bad}` : '검토 완료 · 문제 없음';
  };

  function pick(r: Review) {
    setSelected(r.id);
    setListOpen(false);
    requestAnimationFrame(() => jumpTo('sec-summary')); // 목록이 접힌 뒤의 자리로
  }

  const shownList = listOpen ? reviews : reviews.filter((r) => r.id === selected);
  const visibleSheets = sheets.filter((sheet) => sheet.groups.some((g) => g.items.some((q) => shown(q.id))));
  const uploadForm = (
    <>
      <p className="info-p">
        올린 뒤 Claude Code에 <b>「평가계획서 검토」</b>라고 말하면, 검토 템플릿의 성취평가 취지 점검 12개와 지침 빠른 점검
        26개 항목으로 판정·근거·수정 제안을 채워 이 화면에 보여 줘요.
      </p>
      <div className="pick-row upload-row">
        <label className="msi-label">
          평가계획서 파일
          <input
            ref={fileInput}
            className="msi-field"
            type="file"
            accept=".pdf,.hwp,.hwpx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button type="button" className="msi-btn" onClick={upload} disabled={!file || busy}>
          {busy ? '올리는 중…' : '올리기'}
        </button>
      </div>
    </>
  );

  return (
    <div className="analysis">
      {listLoaded && reviews.length === 0 ? (
        <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-pick)' }}>
          <div className="msi-card-head">
            <h2>평가계획서 올리기</h2>
            <span className="r">PDF · HWP · HWPX</span>
          </div>
          <div className="msi-card-body">{uploadForm}</div>
        </section>
      ) : (
        <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-subject)' }}>
          <div className="msi-card-head">
            <h2>올린 평가계획서{reviews.length > 0 && ` ${reviews.length}개`}</h2>
            <button type="button" className="head-btn" onClick={refresh}>
              새로 고침
            </button>
          </div>
          <div className="msi-card-body">
            {!listLoaded ? (
              <p className="info-p">{status?.kind === 'error' ? '목록을 표시할 수 없어요. 아래 안내를 확인해 주세요.' : '불러오는 중이에요…'}</p>
            ) : (
              <>
                <ul className="plan-list">
                  {shownList.map((r) => (
                    <li key={r.id} className={r.id === selected ? 'is-on' : ''}>
                      <button type="button" className="plan-name" onClick={() => pick(r)} aria-pressed={r.id === selected}>
                        {r.filename}
                        <span className="plan-date">올림 {dateText(r.uploaded_at)}</span>
                      </button>
                      <span className={`plan-status ${r.status === 'done' ? 'reviewed' : r.status}`}>{statusLabel(r)}</span>
                      <a className="head-btn" href={`/api/plan-reviews/${r.id}/file`} target="_blank" rel="noreferrer">
                        원본
                      </a>
                      <button type="button" className="el-del" onClick={() => remove(r)} aria-label={`${r.filename} 지우기`}>
                        지우기
                      </button>
                    </li>
                  ))}
                </ul>
                {reviews.length > 1 && (
                  <button type="button" className="head-btn plan-more" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
                    {listOpen ? '목록 접기' : `다른 계획서 보기 (${reviews.length - 1}개)`}
                  </button>
                )}
                <details className="task-more upload-more">
                  <summary>
                    <span className="task-more-note">PDF · HWP · HWPX</span>
                  </summary>
                  <div className="task-more-body">{uploadForm}</div>
                </details>
              </>
            )}
          </div>
        </section>
      )}

      {status && (
        <p className={`status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
          {status.text}
        </p>
      )}

      {current?.result && (
        <ContextBar
          label={current.filename}
          sections={[
            { id: 'sec-summary', label: '검토 요약' },
            ...visibleSheets.map((sh) => ({ id: `sec-sheet-${sh.key}`, label: sh.title.split(' — ')[0] })),
          ]}
        />
      )}

      {current && current.status === 'pending' && (
        <div id="sec-summary" className="msi-note">
          <b>「{current.filename}」은 검토 대기 중이에요.</b> Claude Code에 「평가계획서 검토」라고 말하면 검토를 시작해요. 결과가 들어오면 이
          화면이 저절로 바뀌어요.
        </div>
      )}

      {current?.result && (
        <>
          <section id="sec-summary" className="msi-card" style={{ ['--accent' as string]: 'var(--hd-levels)' }}>
            <div className="msi-card-head">
              <h2>검토 요약 — {current.filename}</h2>
              <span className="r">검토 {dateText(current.reviewed_at)}</span>
            </div>
            <div className="msi-card-body">
              <div className="verdict-count" role="group" aria-label="판정으로 걸러 보기">
                {(['bad', 'warn', 'ok', 'na'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`verdict v-${v}`}
                    aria-pressed={filter === v}
                    disabled={count(v) === 0}
                    onClick={() => setFilter(filter === v ? null : v)}
                  >
                    {VERDICT_LABEL[v]} {count(v)}
                  </button>
                ))}
                {filter && (
                  <button type="button" className="head-btn" onClick={() => setFilter(null)}>
                    전체 보기
                  </button>
                )}
              </div>
              <p className="msi-small verdict-hint" role="status">
                {filter ? `「${VERDICT_LABEL[filter]}」 ${count(filter)}개만 아래 표에 보여요. 엑셀에는 전체가 들어가요.` : '판정을 누르면 그 항목만 아래 표에 보여요.'}
              </p>
              <p className="info-p review-summary">{current.result.summary}</p>
              <p className="msi-small std-full">Claude Code의 판정이에요. 성적이나 공문에 쓰기 전에 원본과 대조해 주세요.</p>
              <a className="msi-btn secondary dl-btn" href={`/api/plan-reviews/${current.id}/xlsx`}>
                엑셀로 내려받기 (검토 템플릿 양식)
              </a>
            </div>
          </section>

          {visibleSheets.map((sheet) => (
            <section key={sheet.key} id={`sec-sheet-${sheet.key}`} className="msi-card" style={{ ['--accent' as string]: SHEET_ACCENT[sheet.key] }}>
              <div className="msi-card-head">
                <h2>{sheet.title}</h2>
              </div>
              <div className="msi-card-body">
                {sheet.groups.filter((g) => g.items.some((q) => shown(q.id))).map((g) => (
                  <div key={g.title} className="review-group">
                    <h3 className="info-title">{g.title}</h3>
                    <div className="msi-table-scroll">
                      <table className="an-table review-table">
                        <thead>
                          <tr>
                            <th scope="col">ID</th>
                            <th scope="col">점검 질문</th>
                            <th scope="col">판정</th>
                            <th scope="col">찾은 위치 · 근거</th>
                            <th scope="col">수정 제안</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.items.filter((q) => shown(q.id)).map((q) => {
                            const it = items[q.id];
                            return (
                              <tr key={q.id}>
                                <th scope="row">{q.id}</th>
                                <td data-label="점검 질문">
                                  {q.question}
                                  {q.grade && <span className="th-sub">({q.grade})</span>}
                                  <details className="review-how">
                                    <summary aria-label={`${q.id} 판단 기준`}>판단 기준</summary>
                                    <p>
                                      <b>어디를 보나</b> {q.where}
                                    </p>
                                    <p>
                                      <b>어떻게 판단하나</b> {q.how}
                                    </p>
                                    <p>
                                      <b>예</b> {q.example}
                                    </p>
                                  </details>
                                </td>
                                <td data-label="판정">{it ? <span className={`verdict v-${it.verdict}`}>{VERDICT_LABEL[it.verdict]}</span> : '—'}</td>
                                <td data-label="찾은 위치 · 근거">
                                  {it?.where && <b className="review-where">{it.where}</b>}
                                  {it?.finding}
                                </td>
                                <td data-label="수정 제안">{it?.fix}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
