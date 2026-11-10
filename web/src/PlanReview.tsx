import { useEffect, useState } from 'react';
import { downloadMarkdown } from './analysisMarkdown';
import { api, type ReviewSheet, type Standard } from './api';
import { REVIEW_PROMPTS, reviewGuideFilename, reviewGuideMarkdown } from './reviewGuide';

// 평가계획서 검토 탭 — 검토 지침 md 와 프롬프트를 내려받아 생성형 AI에 넣는다. 서버 없이 동작한다.

const SHEET_SEC = { intent: 'sec-plan-intent', rules: 'sec-plan-rules' };

type Note = { place: 'guide' | 'prompt'; kind: 'ok' | 'error'; text: string } | null;

interface Props {
  schoolLevel: string;
  subject: string;
  standards: Standard[];
  ready: boolean; // 고른 과목의 성취기준을 다 받았는가
  loadFailed: boolean; // 고른 과목의 자료를 받지 못했는가
}

export default function PlanReview({ schoolLevel, subject, standards, ready, loadFailed }: Props) {
  const [sheets, setSheets] = useState<ReviewSheet[]>([]);
  const [promptId, setPromptId] = useState(REVIEW_PROMPTS[0].id);
  const [note, setNote] = useState<Note>(null); // 누른 버튼 곁에 보이는 결과 알림
  const [templateError, setTemplateError] = useState('');
  const prompt = REVIEW_PROMPTS.find((p) => p.id === promptId) ?? REVIEW_PROMPTS[0];

  useEffect(() => {
    api
      .reviewTemplate()
      .then(setSheets)
      .catch((e) => setTemplateError(`검토 항목을 불러오지 못했어요: ${e.message}`));
  }, []);

  useEffect(() => setNote(null), [schoolLevel, subject, promptId]); // 지난 알림이 지금 고른 것처럼 보이지 않게

  const canDownload = ready && sheets.length > 0 && standards.length > 0;

  function downloadGuide() {
    downloadMarkdown(reviewGuideFilename(schoolLevel, subject), reviewGuideMarkdown(sheets, standards, schoolLevel, subject));
    setNote({ place: 'guide', kind: 'ok', text: `✓ ${schoolLevel} ${subject} 검토 지침을 내려받았어요.` });
  }

  function downloadPrompt() {
    downloadMarkdown(prompt.file, prompt.text);
    setNote({ place: 'prompt', kind: 'ok', text: `✓ 「${prompt.label}」 프롬프트를 내려받았어요.` });
  }

  // 알림 자리는 늘 두어 화면 낭독기가 바뀐 글을 읽게 한다
  const noteSlot = (place: 'guide' | 'prompt') => {
    const here = note?.place === place ? note : null;
    return (
      <p className={`status ${here?.kind ?? 'ok'}`} role="status">
        {here?.text}
      </p>
    );
  };

  return (
    <div className="analysis">
      <section id="sec-guide" className="msi-card sec-plan-guide">
        <div className="msi-card-head">
          <h2>검토 지침과 프롬프트</h2>
          <span className="r">
            {schoolLevel} {subject}
          </span>
        </div>
        <div className="msi-card-body">
          <div className="msi-note tip-note">
            <b>TIP</b> 검토 지침 md와 프롬프트를 내려받아, 평가계획서와 함께 생성형 AI에 넣어 주세요.
          </div>
          <div className="guide-actions">
            <button type="button" className="msi-btn" onClick={downloadGuide} disabled={!canDownload}>
              검토 지침 md 내려받기
            </button>
            <p className="msi-small">
              {canDownload
                ? `${schoolLevel} ${subject} 성취기준 ${standards.length}개의 원문, 점검 항목 38개, 답변 형식, 엑셀 양식이 들어 있어요.`
                : loadFailed || templateError
                  ? '자료를 불러오지 못해 내려받을 수 없어요. 새로 고침해 주세요.'
                  : '자료를 불러오는 중이에요.'}
            </p>
            {noteSlot('guide')}
          </div>
          {templateError && (
            <p className="status error" role="alert">
              {templateError}
            </p>
          )}
          <div className="guide-actions prompt-row">
            <label className="msi-label">
              프롬프트 예시
              <select className="msi-field" value={prompt.id} onChange={(e) => setPromptId(e.target.value)}>
                {REVIEW_PROMPTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="msi-btn secondary" onClick={downloadPrompt}>
              프롬프트 내려받기
            </button>
            {noteSlot('prompt')}
          </div>
        </div>
      </section>

      <section id="sec-how" className="msi-card sec-plan-how">
        <div className="msi-card-head">
          <h2>사용 순서</h2>
        </div>
        <div className="msi-card-body">
          <ol className="how-steps">
            <li>
              <b>지침 내려받기.</b> 학교급과 과목을 고르고 검토 지침 md를 내려받아요.
            </li>
            <li>
              <b>프롬프트 고르기.</b> 쓰는 AI에 맞는 예시를 골라 내려받아요. 엑셀 파일을 만들어 주는지 모르겠으면 「{REVIEW_PROMPTS[0].label}」로 먼저 해 보세요.
            </li>
            <li>
              <b>AI에 넣기.</b> 생성형 AI에 md와 평가계획서를 첨부하고 프롬프트를 보내요. HWP·HWPX는 AI가 잘 읽지 못할 수 있으니 PDF로 저장해 첨부해 주세요. 학사일정이 있으면 함께 첨부해 주세요. 평가 시기까지 판정할 수 있어요.
            </li>
            <li>
              <b>결과 확인하기.</b> 검토 요약과 표, 엑셀 파일을 받아요. AI 판정은 틀릴 수 있으니 성적이나 공문에 쓰기 전에 원본과 대조해 주세요.
            </li>
          </ol>
          <p className="info-p">
            <b>계획서가 외부 AI 서비스로 전달돼요.</b> 보내기 전에 학생·교사 개인정보가 없는지 확인하고, 학교 지침을 따라 주세요.
          </p>
        </div>
      </section>

      {sheets.map((sheet) => (
        <details key={sheet.key} id={`sec-sheet-${sheet.key}`} className={`msi-card info-card ${SHEET_SEC[sheet.key]}`}>
          <summary className="msi-card-head">
            <h2>{sheet.title}</h2>
            <span className="r" />
          </summary>
          <div className="msi-card-body">
            {sheet.groups.map((g) => (
              <div key={g.title} className="review-group">
                <h3 className="info-title">{g.title}</h3>
                <div className="msi-table-scroll" role="region" aria-label={g.title} tabIndex={0}>
                  <table className="an-table review-table">
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">점검 질문</th>
                        <th scope="col">어디를 보나</th>
                        <th scope="col">어떻게 판단하나</th>
                        <th scope="col">예</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((q) => (
                        <tr key={q.id}>
                          <th scope="row">{q.id}</th>
                          <td data-label="점검 질문">
                            {q.question}
                            {q.grade && <span className="th-sub">({q.grade})</span>}
                          </td>
                          <td data-label="어디를 보나">{q.where}</td>
                          <td data-label="어떻게 판단하나">{q.how}</td>
                          <td data-label="예">{q.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
