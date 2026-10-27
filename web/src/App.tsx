import { useEffect, useState } from 'react';
import Analysis from './Analysis';
import Graph from './Graph';
import ItemDev from './ItemDev';
import PlanReview from './PlanReview';
import Sidebar, { type Tab } from './Sidebar';
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
    <details className="msi-card info-card" style={{ ['--accent' as string]: 'var(--hd-overview)' }}>
      <summary className="msi-card-head">
        <span>
          개요 · {c.school_level} {c.subject} 교육과정
        </span>
        <span className="r">펼치기</span>
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
  const [tab, setTab] = useState<Tab>('analysis');
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
  const [schoolLevel, setSchoolLevel] = useState(SCHOOL_LEVELS[0]);
  const [subject, setSubject] = useState(SUBJECTS[SCHOOL_LEVELS[0]][0]);
  const [items, setItems] = useState<Standard[]>([]);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setError('');
    api
      .list(schoolLevel, subject)
      .then((list) => alive && setItems(list))
      .catch((e) => alive && setError(`목록을 불러오지 못했어요: ${e.message}`));
    api
      .curriculum(schoolLevel, subject)
      .then((c) => alive && setCurriculum(c))
      .catch(() => alive && setCurriculum(null));
    return () => {
      alive = false;
    };
  }, [schoolLevel, subject]);

  const changeFilter = (setter: (v: string) => void, value: string) => setter(value);
  const switchTab = (t: Tab) => {
    setOpenStdId(null);
    setTab(t);
  };
  // 그래프에서 「분석 화면에서 보기」로 넘어갈 때 열 성취기준
  const [openStdId, setOpenStdId] = useState<number | null>(null);
  const openInAnalysis = (id: number) => {
    setOpenStdId(id);
    setTab('analysis');
  };

  return (
    <div className={`msi-page ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar tab={tab} onSelect={switchTab} open={sidebarOpen} onToggle={toggleSidebar} />
      <div className="msi-wrap app-wrap">
        <div className="msi-win-body">
          <section className="msi-topic">
            <div className="msi-topic-bar">{tab === 'items' ? 'STEP_2 · ITEM' : 'STEP_1 · PLAN'}</div>
            <div className="msi-topic-in">
              <div>
                <span className="msi-unit">{tab === 'items' ? '2단계' : '1단계'}</span>
              </div>
              <h1 className="msi-h1">{TITLES[tab]}</h1>
              {tab !== 'review' && (
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
                  <p className="msi-small filters-count">성취기준 {items.length}개</p>
                </div>
              )}
              {READ_ONLY && (
                <p className="msi-small">
                  읽기 전용 배포판이에요. 평가계획서 검토·문항 개발은 내 컴퓨터에서 앱을 실행해야 쓸 수 있어요.
                </p>
              )}
              {error && <p className="status error">{error}</p>}
            </div>
          </section>

          {tab === 'analysis' ? (
            <>
              {curriculum && <SubjectInfo c={curriculum} />}
              <Analysis subject={subject} items={items} curriculum={curriculum} initialStdId={openStdId} />
            </>
          ) : tab === 'graph' ? (
            <Graph subject={subject} items={items} curriculum={curriculum} onOpen={openInAnalysis} />
          ) : tab === 'items' ? (
            <ItemDev schoolLevel={schoolLevel} subject={subject} items={items} curriculum={curriculum} />
          ) : (
            <PlanReview />
          )}
        </div>
      </div>
    </div>
  );
}
