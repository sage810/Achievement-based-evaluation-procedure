import { useEffect, useRef, useState } from 'react';
import { api, type PlanReview as Review, type ReviewSheet, type Verdict } from './api';

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

  const refresh = () =>
    api
      .planReviews()
      .then(setReviews)
      .catch((e) => setStatus({ kind: 'error', text: `목록을 불러오지 못했어요: ${e.message}` }));

  useEffect(() => {
    api.reviewTemplate().then(setSheets).catch(() => setSheets([]));
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
    } catch (e) {
      setStatus({ kind: 'error', text: `지우지 못했어요: ${(e as Error).message}` });
    }
  }

  const current = reviews.find((r) => r.id === selected) ?? null;
  const items = current?.result?.items ?? {};
  const count = (v: Verdict) => Object.values(items).filter((it) => it.verdict === v).length;

  return (
    <div className="analysis">
      <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-pick)' }}>
        <div className="msi-card-head">
          <span>평가계획서 올리기</span>
          <span className="r">PDF · HWP · HWPX</span>
        </div>
        <div className="msi-card-body">
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
          {status && (
            <p className={`status ${status.kind}`} role="status">
              {status.text}
            </p>
          )}
        </div>
      </section>

      <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-subject)' }}>
        <div className="msi-card-head">
          <span>올린 평가계획서</span>
          <button type="button" className="head-btn" onClick={refresh}>
            새로 고침
          </button>
        </div>
        <div className="msi-card-body">
          {reviews.length === 0 ? (
            <p className="info-p">아직 올린 평가계획서가 없어요.</p>
          ) : (
            <ul className="plan-list">
              {reviews.map((r) => (
                <li key={r.id} className={r.id === selected ? 'is-on' : ''}>
                  <button type="button" className="plan-name" onClick={() => setSelected(r.id)} aria-pressed={r.id === selected}>
                    {r.filename}
                    <span className="plan-date">올림 {dateText(r.uploaded_at)}</span>
                  </button>
                  <span className={`plan-status ${r.status}`}>{r.status === 'done' ? '검토 완료' : '검토 대기'}</span>
                  <a className="head-btn" href={`/api/plan-reviews/${r.id}/file`} target="_blank" rel="noreferrer">
                    원본
                  </a>
                  <button type="button" className="el-del" onClick={() => remove(r)} aria-label={`${r.filename} 지우기`}>
                    지우기
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {current && current.status === 'pending' && (
        <div className="msi-note">
          <b>「{current.filename}」은 검토 대기 중이에요.</b> Claude Code에 「평가계획서 검토」라고 말하면 검토를 시작해요. 결과가 들어오면 이
          화면이 저절로 바뀌어요.
        </div>
      )}

      {current?.result && (
        <>
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-levels)' }}>
            <div className="msi-card-head">
              <span>검토 요약 — {current.filename}</span>
              <span className="r">검토 {dateText(current.reviewed_at)}</span>
            </div>
            <div className="msi-card-body">
              <p className="verdict-count">
                {(['bad', 'warn', 'ok', 'na'] as const).map((v) => (
                  <span key={v} className={`verdict v-${v}`}>
                    {VERDICT_LABEL[v]} {count(v)}
                  </span>
                ))}
              </p>
              <p className="info-p review-summary">{current.result.summary}</p>
              <a className="msi-btn secondary dl-btn" href={`/api/plan-reviews/${current.id}/xlsx`}>
                엑셀로 내려받기 (검토 템플릿 양식)
              </a>
            </div>
          </section>

          {sheets.map((sheet) => (
            <section key={sheet.key} className="msi-card" style={{ ['--accent' as string]: SHEET_ACCENT[sheet.key] }}>
              <div className="msi-card-head">
                <span>{sheet.title}</span>
              </div>
              <div className="msi-card-body">
                {sheet.groups.map((g) => (
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
                          {g.items.map((q) => {
                            const it = items[q.id];
                            return (
                              <tr key={q.id}>
                                <th scope="row">{q.id}</th>
                                <td>
                                  {q.question}
                                  {q.grade && <span className="th-sub">({q.grade})</span>}
                                  <details className="review-how">
                                    <summary>판단 기준</summary>
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
                                <td>{it ? <span className={`verdict v-${it.verdict}`}>{VERDICT_LABEL[it.verdict]}</span> : '—'}</td>
                                <td>
                                  {it?.where && <b className="review-where">{it.where}</b>}
                                  {it?.finding}
                                </td>
                                <td>{it?.fix}</td>
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
