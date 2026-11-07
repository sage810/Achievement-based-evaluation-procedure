import { useEffect, useState } from 'react';
import { hasScrollMemory } from './ContextBar';
import { flushSync } from 'react-dom';
import Analysis from './Analysis';
import Graph from './Graph';
import ItemDev from './ItemDev';
import PlanReview from './PlanReview';
import Sidebar, { LOCAL_ONLY, type Tab } from './Sidebar';
import { api, READ_ONLY, type Curriculum, type Standard } from './api';
import { SCHOOL_LEVELS, SUBJECTS } from './catalog';

// 사이드바 열림 상태는 이 브라우저에만 기억한다(없으면 넓은 화면은 열고 좁은 화면은 닫음)
const SIDEBAR_KEY = 'sidebar-open';
function initialSidebarOpen() {
  try {
    const v = localStorage.getItem(SIDEBAR_KEY);
    if (v !== null) return v === '1';
  } catch {
    /* 저장소를 못 쓰면 기본값 */
  }
  return window.matchMedia('(min-width: 901px)').matches;
}

const TITLES: Record<Tab, string> = {
  analysis: '교육과정 분석',
  graph: '교육과정 그래프',
  review: '평가계획서 검토',
  items: '문항 개발',
};

// 탭은 주소 끝(#graph 등)에 기억한다 — 새로 고침·뒤로 가기에도 그 탭이 유지된다
function tabFromHash(): Tab {
  const t = location.hash.slice(1) as Tab;
  return t in TITLES && !(READ_ONLY && LOCAL_ONLY.includes(t)) ? t : 'analysis';
}

// 학교급·과목·성취기준은 이 브라우저에 기억한다 — 새로 고침해도, 탭을 옮겨도 이어진다
const SELECTION_KEY = 'app-selection';
function savedSelection() {
  let s: { schoolLevel?: string; subject?: string; stdCode?: string } = {};
  try {
    s = JSON.parse(localStorage.getItem(SELECTION_KEY) ?? '{}');
  } catch {
    /* 저장소를 못 쓰면 기본값 */
  }
  const schoolLevel = s.schoolLevel && SCHOOL_LEVELS.includes(s.schoolLevel) ? s.schoolLevel : SCHOOL_LEVELS[0];
  const subject = s.subject && SUBJECTS[schoolLevel].includes(s.subject) ? s.subject : SUBJECTS[schoolLevel][0];
  return { schoolLevel, subject, stdCode: typeof s.stdCode === 'string' ? s.stdCode : null };
}

function Items({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="info-block">
      <h3 className="info-title">{title}</h3>
      <ul className="info-list">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

// 과목 정보 — 교육과정의 성격·목표·교수학습·평가 (읽기 전용)
function SubjectInfo({ c }: { c: Curriculum }) {
  return (
    <details className="msi-card info-card sec-overview">
      <summary className="msi-card-head">
        <h2>
          개요 · {c.school_level} {c.subject} 교육과정
        </h2>
        <span className="r" />
      </summary>
      <div className="msi-card-body">
        <div className="info-block">
          <h3 className="info-title">성격</h3>
          {c.character.map((p, i) => (
            <p key={i} className="info-p">
              {p}
            </p>
          ))}
        </div>
        <div className="info-block">
          <h3 className="info-title">목표</h3>
          <p className="info-p">{c.goals_intro}</p>
          <ol className="info-list">
            {c.goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ol>
        </div>
        <Items title="교수·학습의 방향" items={c.teaching_direction} />
        <Items title="교수·학습 방법" items={c.teaching_methods} />
        <Items title="평가의 방향" items={c.assessment_direction} />
        <Items title="평가 방법" items={c.assessment_methods} />
        <p className="msi-small">출처: {c.source}</p>
      </div>
    </details>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const toggleSidebar = () =>
    setSidebarOpen((o) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, o ? '0' : '1');
      } catch {
        /* 기억 못 해도 동작에는 문제없음 */
      }
      return !o;
    });
  const [saved] = useState(savedSelection);
  const [schoolLevel, setSchoolLevel] = useState(saved.schoolLevel);
  const [subject, setSubject] = useState(saved.subject);
  const [stdCode, setStdCode] = useState<string | null>(saved.stdCode); // 탭 사이에 이어지는 성취기준
  useEffect(() => {
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify({ schoolLevel, subject, stdCode }));
    } catch {
      /* 기억 못 해도 동작에는 문제없음 */
    }
  }, [schoolLevel, subject, stdCode]);
  const [items, setItems] = useState<Standard[]>([]);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [error, setError] = useState('');
  // 불러오는 중·실패를 「내용 없음」으로 보여 주지 않도록, 다 받은 뒤에만 탭을 그린다
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setError('');
    setReady(false);
    Promise.all([api.list(schoolLevel, subject), api.curriculum(schoolLevel, subject)])
      .then(([list, c]) => {
        if (!alive) return;
        setItems(list);
        setCurriculum(c);
        setReady(true);
      })
      .catch((e) => alive && setError(`목록을 불러오지 못했어요: ${e.message}`));
    return () => {
      alive = false;
    };
  }, [schoolLevel, subject]);

  const changeFilter = (setter: (v: string) => void, value: string) => setter(value);
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  const goTab = (t: Tab) => {
    setTab(t);
    location.hash = t;
    window.scrollTo(0, 0);
  };
  const switchTab = (t: Tab) => {
    goTab(t);
    // 좁은 화면에서는 메뉴가 본문을 덮으므로 고르면 닫는다 (기억해 둔 열림 상태는 그대로)
    if (window.matchMedia('(max-width: 900px)').matches) {
      setSidebarOpen(false);
      document.getElementById('main')?.focus({ preventScroll: true }); // 누른 메뉴가 사라져도 포커스를 잃지 않게
    }
  };
  // 선택 영역 — 처음 들어오면 펼쳐 두고, 본문으로 내려가면 한 줄로 접는다.
  // 읽던 자리로 돌아오는 새로 고침만 접은 채 시작한다 (펼친 높이만큼 자리가 어긋나지 않게)
  const [selOpen, setSelOpen] = useState(() => !hasScrollMemory(tab));
  const selStd = items.find((s) => s.code === stdCode) ?? null;
  const collapsed = !selOpen && (tab === 'analysis' || tab === 'items') && ready && !!curriculum && !!selStd;
  // 화면 위로 지나간 영역이 줄어드는 것이라, 읽던 글이 움직이지 않게 줄어든 만큼 스크롤을 맞춘다
  const collapseSel = () => {
    if (!selOpen) return;
    const mark = document.querySelector('.ctx-sentinel');
    const before = mark?.getBoundingClientRect().top ?? 0;
    const root = document.documentElement;
    root.style.overflowAnchor = 'none'; // 브라우저 자체 보정과 겹치지 않게
    flushSync(() => setSelOpen(false));
    window.scrollBy(0, (mark?.getBoundingClientRect().top ?? 0) - before);
    requestAnimationFrame(() => (root.style.overflowAnchor = ''));
  };
  const openSel = () => {
    setSelOpen(true);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.filters select')?.focus());
  };

  // 그래프에서 「분석 화면에서 보기」
  const openInAnalysis = (id: number) => {
    const s = items.find((x) => x.id === id);
    if (s) setStdCode(s.code);
    goTab('analysis');
  };

  return (
    <div className={`msi-page ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault(); // 주소 끝은 탭 기억에 쓰므로 바꾸지 않는다
          document.getElementById('main')?.focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      <Sidebar tab={tab} onSelect={switchTab} open={sidebarOpen} onToggle={toggleSidebar} />
      <main id="main" tabIndex={-1} className="msi-wrap app-wrap">
        <div className="msi-win-body">
          <section className="msi-topic">
            <div className="msi-topic-bar">
              {tab === 'items' ? '2단계 문항·평가도구 개발' : tab === 'analysis' ? '① 학교급과 과목 선택' : '1단계 운영 계획'}
            </div>
            <div className="msi-topic-in">
              <h1 className="msi-h1">{TITLES[tab]}</h1>
              {collapsed && (
                <div className="sel-summary">
                  <p className="sel-text" title={`[${selStd!.code}] ${selStd!.statement}`}>
                    <b>
                      {schoolLevel} {subject}
                    </b>{' '}
                    [{selStd!.code}] {selStd!.statement}
                  </p>
                  <button type="button" className="head-btn" onClick={openSel}>
                    바꾸기
                  </button>
                </div>
              )}
              {!collapsed && (
                <div className="filters">
                  <label className="msi-label">
                    학교급
                    <select
                      className="msi-field"
                      value={schoolLevel}
                      onChange={(e) =>
                        changeFilter((v) => {
                          setSchoolLevel(v);
                          if (!SUBJECTS[v].includes(subject)) setSubject(SUBJECTS[v][0]);
                        }, e.target.value)
                      }
                    >
                      {SCHOOL_LEVELS.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="msi-label">
                    과목
                    <select
                      className="msi-field"
                      value={subject}
                      onChange={(e) => changeFilter(setSubject, e.target.value)}
                    >
                      {SUBJECTS[schoolLevel].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  {ready && <p className="msi-small filters-count">성취기준 {items.length}개</p>}
                  {selOpen && (tab === 'analysis' || tab === 'items') && ready && curriculum && selStd && (
                    <button type="button" className="head-btn sel-fold" onClick={() => setSelOpen(false)}>
                      접기
                    </button>
                  )}
                </div>
              )}
              {READ_ONLY && (
                <p className="msi-small">
                  읽기 전용 배포판이에요. 문항 개발은 내 컴퓨터에서 앱을 실행해야 쓸 수 있어요.
                </p>
              )}
              {error && (
                <p className="status error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </section>

          {tab === 'review' ? (
            <PlanReview schoolLevel={schoolLevel} subject={subject} standards={items} ready={ready} loadFailed={!!error} />
          ) : error ? null : !ready ? (
            <div className="msi-note" role="status">
              불러오는 중이에요…
            </div>
          ) : tab === 'analysis' ? (
            <Analysis
              subject={subject}
              items={items}
              curriculum={curriculum}
              overview={curriculum && <SubjectInfo c={curriculum} />}
              stdCode={stdCode}
              onStdChange={setStdCode}
              onDevelop={READ_ONLY ? undefined : () => goTab('items')}
              pickerOpen={!collapsed}
              onBarStuck={collapseSel}
            />
          ) : tab === 'graph' ? (
            <Graph subject={subject} items={items} curriculum={curriculum} onOpen={openInAnalysis} />
          ) : (
            <ItemDev
              schoolLevel={schoolLevel}
              subject={subject}
              items={items}
              curriculum={curriculum}
              stdCode={stdCode}
              onStdChange={setStdCode}
              pickerOpen={!collapsed}
              onBarStuck={collapseSel}
            />
          )}
        </div>
      </main>
    </div>
  );
}
