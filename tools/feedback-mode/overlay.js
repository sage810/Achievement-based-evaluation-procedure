/**
 * 피드백 모드 — 화면 오버레이. 프레임워크 없이 순수 DOM 이라 React/Vue/정적 페이지 어디서나 쓴다.
 * 개발 서버에서만 불러온다(main.jsx 의 import.meta.env.DEV 가드). 켜면:
 *   - 아무 요소나 클릭 → 그 요소를 가리킨 채 메모를 적어 보낸다 (앱의 클릭 동작은 막힘)
 *   - 요소에 글자가 있으면 바로 고쳐 보낼 수 있다 ("원문" → "수정문"). 화면에도 바로 반영돼 미리 볼 수 있다
 *   - Esc 로 끈다
 *   - 보낸 뒤에도 우하단 "보낸 목록"에서 처리 전 항목을 다시 보고 고치거나 지울 수 있다 (저장 직후 알림의 "보기·수정" 으로도 열림)
 * 보낸 내용은 vite-plugin.js 가 .claude/feedback.md 에 쌓고, Claude 가 다음 세션에서 읽어 처리한다.
 *
 *   mountFeedbackMode({ app: '앱 이름', endpoint: '/__feedback' })
 */
export function mountFeedbackMode({ app = document.title, endpoint = '/__feedback' } = {}) {
  if (document.getElementById('fbm-root')) return;
  const root = document.createElement('div');
  root.id = 'fbm-root';
  root.innerHTML = `
    <style>
      #fbm-root{position:fixed;inset:0;pointer-events:none;z-index:2147483000;font:13px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#101114}
      #fbm-root *{box-sizing:border-box}
      .fbm-dock{position:fixed;z-index:1;right:16px;bottom:16px;display:flex;align-items:center;gap:8px;pointer-events:none}
      .fbm-listbtn{pointer-events:auto;min-height:40px;padding:8px 14px;border:1.5px solid #dedee5;border-radius:999px;background:#fff;color:#101114;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(16,17,20,.15)}
      .fbm-listbtn[aria-expanded=true]{border-color:#7132f5;color:#4533b5}
      .fbm-toggle{pointer-events:auto;display:flex;align-items:center;gap:6px;min-height:40px;padding:8px 14px;border:0;border-radius:999px;background:#101114;color:#fff;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(16,17,20,.25)}
      .fbm-toggle.on{background:#c62f42}
      .fbm-toggle .fbm-badge{min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#7132f5;font-size:11px;line-height:18px;text-align:center}
      .fbm-hl{position:fixed;pointer-events:none;border:2px solid #c62f42;background:rgba(198,47,66,.08);border-radius:4px;display:none}
      .fbm-panel{position:fixed;z-index:2;max-height:calc(100vh - 32px);overflow-y:auto;pointer-events:auto;width:320px;max-width:calc(100vw - 32px);background:#fff;border:1px solid #dedee5;border-radius:12px;box-shadow:0 12px 32px rgba(16,17,20,.2);padding:12px;display:none}
      .fbm-panel.open{display:block}
      .fbm-panel h3{margin:0 0 6px;font-size:13px;font-weight:800}
      .fbm-panel .fbm-el{font:12px/1.4 ui-monospace,Consolas,monospace;color:#686b82;word-break:break-all;margin-bottom:8px}
      .fbm-panel label{display:block;font-size:12px;font-weight:700;color:#686b82;margin:8px 0 4px}
      .fbm-panel textarea,.fbm-panel input{width:100%;font:inherit;padding:8px 10px;border:1.5px solid #8f8fa0;border-radius:8px;resize:vertical}
      .fbm-panel textarea{min-height:70px}
      .fbm-panel label.fbm-check{display:flex;align-items:center;gap:6px;color:#101114;font-weight:600;cursor:pointer;white-space:nowrap;margin-bottom:0}
      .fbm-panel .fbm-hint{margin:2px 0 0 22px;font-size:12px;color:#686b82}
      .fbm-panel input[type=checkbox]{width:16px;height:16px;margin:0;padding:0;accent-color:#7132f5}
      .fbm-row{display:flex;gap:6px;justify-content:flex-end;margin-top:10px}
      .fbm-btn{min-height:34px;padding:6px 12px;border:0;border-radius:8px;font:inherit;font-weight:700;cursor:pointer;background:#f1f1f6;color:#101114}
      .fbm-btn.primary{background:#7132f5;color:#fff}
      .fbm-list{position:fixed;z-index:2;right:16px;width:380px;max-width:calc(100vw - 32px);overflow-y:auto;pointer-events:auto;background:#fff;border:1px solid #dedee5;border-radius:12px;box-shadow:0 12px 32px rgba(16,17,20,.2);padding:12px;display:none}
      .fbm-list.open{display:block}
      .fbm-list-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
      .fbm-list-head h3{margin:0;font-size:13px;font-weight:800;flex:1}
      .fbm-list-head .fbm-sub{font-weight:600;color:#686b82;font-size:12px}
      .fbm-item{border:1px solid #dedee5;border-radius:10px;padding:10px;margin-bottom:8px;background:#fff}
      .fbm-item.editing{border-color:#7132f5;box-shadow:0 0 0 2px rgba(113,50,245,.15)}
      .fbm-item.done{background:#f7f7fa;color:#686b82}
      .fbm-item-top{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#686b82}
      .fbm-item-top .fbm-route{font:11px/1.4 ui-monospace,Consolas,monospace;word-break:break-all}
      .fbm-item-top .fbm-when{white-space:nowrap}
      .fbm-item-el{margin:4px 0 0;font:12px/1.4 ui-monospace,Consolas,monospace;color:#686b82;word-break:break-all}
      .fbm-item p{margin:4px 0 0;word-break:break-word}
      .fbm-item .fbm-chip{display:inline-block;margin-top:6px;padding:1px 8px;border-radius:999px;background:#ece8ff;color:#4533b5;font-size:11px;font-weight:700}
      .fbm-item .fbm-result{font-size:12px}
      .fbm-btn.danger{color:#a02033}
      .fbm-btn.danger.armed{background:#c62f42;color:#fff}
      .fbm-btn.sm{min-height:30px;padding:4px 10px;font-size:12px}
      .fbm-empty{margin:8px 0;color:#686b82}
      .fbm-toast{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);pointer-events:none;padding:8px 14px;border-radius:999px;background:#101114;color:#fff;font-weight:700;opacity:0;transition:opacity .15s}
      .fbm-toast.show{opacity:1}
      .fbm-toast .fbm-act{margin-left:10px;padding:2px 10px;border:0;border-radius:999px;background:#fff;color:#101114;font:inherit;font-weight:800;cursor:pointer}
    </style>
    <div class="fbm-hl"></div>
    <div class="fbm-panel" role="dialog" aria-label="피드백 작성">
      <h3>이 요소에 대한 피드백</h3>
      <div class="fbm-el"></div>
      <label for="fbm-text">글자 고치기 <span style="font-weight:400">(그대로 두면 메모만 보냄)</span></label>
      <input id="fbm-text" type="text" autocomplete="off" />
      <label for="fbm-note">메모</label>
      <textarea id="fbm-note" placeholder="예: 이 버튼을 검색창 왼쪽으로, 글자는 더 크게"></textarea>
      <label class="fbm-check"><input id="fbm-design" type="checkbox" /> 디자인 추천 받기</label>
      <div class="fbm-hint">바로 고치지 않고 후보 2~3개를 먼저 제안받음 (ui-ux-pro-max)</div>
      <div class="fbm-row"><button type="button" class="fbm-btn" data-act="cancel">취소</button><button type="button" class="fbm-btn primary" data-act="send">보내기</button></div>
    </div>
    <div class="fbm-list" role="dialog" aria-label="보낸 피드백 목록"></div>
    <div class="fbm-dock">
      <button type="button" class="fbm-listbtn" aria-expanded="false">보낸 목록</button>
      <button type="button" class="fbm-toggle" aria-pressed="false">피드백 <span class="fbm-badge" hidden>0</span></button>
    </div>
    <div class="fbm-toast" role="status"></div>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const dock = $('.fbm-dock'), listBtn = $('.fbm-listbtn'), listPanel = $('.fbm-list');
  const toggle = $('.fbm-toggle'), hl = $('.fbm-hl'), panel = $('.fbm-panel'), elInfo = $('.fbm-el');
  const textIn = $('#fbm-text'), noteIn = $('#fbm-note'), designIn = $('#fbm-design'), badge = $('.fbm-badge'), toast = $('.fbm-toast');
  let on = false, target = null, textNode = null;

  const isOurs = (el) => root.contains(el);
  function pick(e) { return isOurs(e.target) ? null : e.target; }
  function outline(el) {
    if (!el) { hl.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    Object.assign(hl.style, { display: 'block', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  }
  function ownText(el) { // 자식 요소가 아닌, 이 요소가 직접 가진 글자(버튼 라벨 등)
    const t = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    return t ?? null;
  }
  function describe(el) {
    const seg = (n) => {
      let s = n.tagName.toLowerCase();
      if (n.id) return `${s}#${n.id}`;
      const cls = [...n.classList].filter((c) => !c.startsWith('fbm')).slice(0, 2);
      if (cls.length) s += `.${cls.join('.')}`;
      const sib = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName) : [];
      if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(n) + 1})`;
      return s;
    };
    const parts = [];
    for (let n = el, i = 0; n && n !== document.body && i < 6; n = n.parentElement, i++) { parts.unshift(seg(n)); if (n.tagName === 'MAIN') break; }
    return { element: seg(el), path: parts.join(' > ') };
  }

  function onMove(e) { if (on && !panel.classList.contains('open')) outline(pick(e)); }
  function onClick(e) {
    if (!on) return;
    const el = pick(e);
    if (!el) return; // 오버레이 자체 클릭은 통과
    e.preventDefault(); e.stopPropagation();
    target = el; textNode = ownText(el);
    outline(el);
    const d = describe(el);
    elInfo.textContent = `${d.element}  ·  ${d.path}`;
    textIn.value = textNode ? textNode.textContent.trim() : '';
    textIn.disabled = !textNode;
    noteIn.value = ''; designIn.checked = false;
    const r = el.getBoundingClientRect();
    closeList();
    panel.classList.add('open'); // 먼저 열어서 실제 크기를 잰 뒤 자리를 정한다 (높이를 짐작하면 칸이 늘 때 화면 밖으로 밀린다)
    placePanel(r);
    (textNode ? textIn : noteIn).focus();
  }
  /**
   * 패널 자리: 요소 아래 → 요소 위 → 화면 안에 맞춤 순으로 고른다. 패널이 우하단 "피드백 끄기" 버튼과 가로로 겹치면
   * 세로로 그 버튼 위까지만 쓴다 (버튼이 패널의 보내기 버튼을 가리지 않게).
   */
  function placePanel(r) {
    const M = 16, vw = window.innerWidth, vh = window.innerHeight;
    const ph = panel.offsetHeight, pw = panel.offsetWidth, tg = dock.getBoundingClientRect();
    const left = Math.min(vw - pw - M, Math.max(M, r.left));
    const floor = left + pw > tg.left - 8 ? tg.top - 8 : vh - M; // 이 가로 구간에서 패널이 쓸 수 있는 맨 아래
    const fits = (t) => t >= M && t + ph <= floor;
    let top = r.bottom + 8;
    if (!fits(top)) top = r.top - ph - 8;
    if (!fits(top)) top = Math.max(M, Math.min(r.bottom + 8, floor - ph));
    Object.assign(panel.style, { top: `${top}px`, left: `${Math.max(M, left)}px` });
  }
  function closePanel() { panel.classList.remove('open'); outline(null); target = null; textNode = null; }
  function setOn(v) {
    on = v; toggle.classList.toggle('on', on); toggle.setAttribute('aria-pressed', String(on));
    toggle.childNodes[0].textContent = on ? '피드백 끄기 (Esc) ' : '피드백 ';
    document.documentElement.style.cursor = on ? 'crosshair' : '';
    if (!on) closePanel();
  }
  async function send() {
    if (!target) return;
    const d = describe(target);
    const original = textNode ? textNode.textContent.trim() : '';
    const edited = textNode ? textIn.value.trim() : '';
    const changed = textNode && edited && edited !== original;
    const note = noteIn.value.trim();
    const design = designIn.checked; // Claude 가 ui-ux-pro-max 스킬로 후보를 먼저 제안하도록 표시
    if (!changed && !note && !design) { noteIn.focus(); return; }
    const body = { app, route: location.pathname + location.search, element: d.element, path: d.path, text: original, note, viewport: `${window.innerWidth}×${window.innerHeight}` };
    if (changed) body.newText = edited;
    if (design) body.design = true;
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || '저장 실패');
      if (changed) textNode.textContent = textNode.textContent.replace(original, edited); // 미리보기(새로고침하면 원래대로)
      say(`저장됨 → ${j.file}`, { label: '보기·수정', fn: () => openList(j.key) }); refreshBadge(); closePanel(); if (listPanel.classList.contains('open')) loadList();
    } catch (e) { say(`보내기 실패: ${e.message}`); }
  }
  function say(msg, action) {
    toast.textContent = msg; toast.style.pointerEvents = 'none';
    if (action) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fbm-act'; b.textContent = action.label;
      b.addEventListener('click', () => { toast.classList.remove('show'); toast.style.pointerEvents = 'none'; action.fn(); });
      toast.append(b); toast.style.pointerEvents = 'auto';
    }
    toast.classList.add('show'); clearTimeout(say.t);
    say.t = setTimeout(() => { toast.classList.remove('show'); toast.style.pointerEvents = 'none'; }, action ? 7000 : 2200);
  }

  // ---- 보낸 목록: 처리 전 항목을 다시 보고 고치거나 지운다 (처리된 항목은 읽기만) ----
  let entries = [], editingKey = null, showDone = false, armedKey = null;
  const mk = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const btn = (label, cls, fn) => { const b = mk('button', `fbm-btn sm ${cls || ''}`, label); b.type = 'button'; b.addEventListener('click', fn); return b; };
  async function loadList() {
    try { const j = await (await fetch(`${endpoint}?list=1`)).json(); entries = j.entries ?? []; renderList(); } catch { say('목록을 불러오지 못했습니다'); }
  }
  function placeList() {
    const d = dock.getBoundingClientRect();
    listPanel.style.bottom = `${window.innerHeight - d.top + 8}px`;
    listPanel.style.maxHeight = `${Math.max(160, d.top - 24)}px`;
  }
  function openList(key) {
    closePanel(); editingKey = key ?? null; armedKey = null;
    listPanel.classList.add('open'); listBtn.setAttribute('aria-expanded', 'true'); placeList(); loadList();
  }
  function closeList() { listPanel.classList.remove('open'); listBtn.setAttribute('aria-expanded', 'false'); editingKey = null; armedKey = null; }
  function renderList() {
    const open = entries.filter((e) => !e.done), done = entries.filter((e) => e.done);
    listPanel.replaceChildren();
    const head = mk('div', 'fbm-list-head');
    const h = mk('h3', null, '보낸 피드백 '); h.append(mk('span', 'fbm-sub', `처리 전 ${open.length}건`));
    head.append(h, btn('닫기', '', closeList));
    listPanel.append(head);
    if (!open.length) listPanel.append(mk('p', 'fbm-empty', '처리 전 항목이 없습니다.'));
    open.forEach((e) => listPanel.append(itemView(e)));
    if (done.length) {
      listPanel.append(btn(showDone ? `처리된 항목 숨기기 (${done.length})` : `처리된 항목 보기 (${done.length})`, '', () => { showDone = !showDone; renderList(); }));
      if (showDone) { const wrap = mk('div'); wrap.style.marginTop = '8px'; done.forEach((e) => wrap.append(itemView(e))); listPanel.append(wrap); }
    }
    placeList();
    const ed = listPanel.querySelector('.fbm-item.editing');
    if (ed) { ed.scrollIntoView({ block: 'nearest' }); ed.querySelector('input,textarea')?.focus(); }
  }
  function itemView(e) {
    const box = mk('div', `fbm-item${e.done ? ' done' : ''}${editingKey === e.key ? ' editing' : ''}`);
    box.dataset.key = e.key;
    const top = mk('div', 'fbm-item-top'); top.append(mk('span', 'fbm-route', e.route || '/'), mk('span', 'fbm-when', e.when));
    box.append(top, mk('div', 'fbm-item-el', e.element ?? ''));
    if (editingKey === e.key && !e.done) return editView(e, box);
    if (e.newText != null) box.append(mk('p', null, `글자: "${e.text}" → "${e.newText}"`));
    if (e.note) box.append(mk('p', null, e.note));
    if (e.design) box.append(mk('span', 'fbm-chip', '디자인 추천 요청'));
    if (e.done) { box.append(mk('p', 'fbm-result', e.result)); return box; }
    const row = mk('div', 'fbm-row');
    const del = btn('삭제', 'danger', async () => {
      if (armedKey !== e.key) {
        armedKey = e.key; del.textContent = '정말 삭제'; del.classList.add('armed'); // 두 번 눌러야 지워진다 (실수 방지)
        setTimeout(() => { if (armedKey === e.key) { armedKey = null; del.textContent = '삭제'; del.classList.remove('armed'); } }, 3000);
        return;
      }
      await mutate('DELETE', { key: e.key }, '삭제됨');
    });
    row.append(del, btn('수정', 'primary', () => { editingKey = e.key; armedKey = null; renderList(); }));
    box.append(row);
    return box;
  }
  function editView(e, box) {
    let tIn = null;
    if (e.newText != null) {
      const l = mk('label', null, `고친 글자 (원문: "${e.text}")`);
      tIn = mk('input'); tIn.type = 'text'; tIn.value = e.newText; tIn.autocomplete = 'off';
      box.append(l, tIn);
    }
    const nl = mk('label', null, '메모'), nIn = mk('textarea'); nIn.value = e.note ?? '';
    const dl = mk('label', 'fbm-check'), dIn = mk('input'); dIn.type = 'checkbox'; dIn.checked = e.design; dl.append(dIn, ' 디자인 추천 받기');
    const row = mk('div', 'fbm-row');
    const save = async () => {
      const body = { key: e.key, note: nIn.value, design: dIn.checked };
      if (tIn) body.newText = tIn.value;
      await mutate('PUT', body, '수정됨');
    };
    row.append(btn('취소', '', () => { editingKey = null; renderList(); }), btn('저장', 'primary', save));
    box.append(nl, nIn, dl, row);
    nIn.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); save(); } });
    return box;
  }
  async function mutate(method, body, okMsg) {
    try {
      const r = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || '실패');
      editingKey = null; armedKey = null; say(okMsg); refreshBadge(); loadList();
    } catch (err) { say(`실패: ${err.message}`); }
  }
  async function refreshBadge() {
    try { const j = await (await fetch(endpoint)).json(); badge.textContent = j.open; badge.hidden = !j.open; } catch { /* 개발 서버 아님 */ }
  }

  toggle.addEventListener('click', () => setOn(!on));
  listBtn.addEventListener('click', () => (listPanel.classList.contains('open') ? closeList() : openList()));
  window.addEventListener('resize', () => { if (listPanel.classList.contains('open')) placeList(); });
  panel.addEventListener('click', (e) => { const a = e.target.closest('[data-act]')?.dataset.act; if (a === 'send') send(); else if (a === 'cancel') closePanel(); });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === textIn) { e.preventDefault(); send(); } });
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (on || listPanel.classList.contains('open'))) { if (panel.classList.contains('open')) closePanel(); else if (listPanel.classList.contains('open')) closeList(); else setOn(false); } }, true);
  window.addEventListener('scroll', () => { if (target) outline(target); }, true);
  refreshBadge();
}
