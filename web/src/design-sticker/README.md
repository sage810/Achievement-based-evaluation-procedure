# 스티커 디자인 토큰 (sticker) — 스케치북 스티커

크림색 스케치북 종이 위에 갈색 잉크로 선을 긋고, 뽀얀 파스텔 스티커를 붙인 듯한 디자인입니다.
**ai 1차시 「인공지능이란?」(2026-10-22)에 적용된 모양**을 그대로 토큰·부품으로 묶었습니다.

- 크림 종이 `#FAF2E1` + 점무늬 · 갈색 잉크 `#4A3B32` · 밀키 파스텔 카드 · **아래로 폭신하게 번지는 그림자**(어긋난 그림자 X)
- 둥근 모서리(창 22 · 카드 18 · 상자 14 · 입력칸 12 · 태그 8) · 테두리 3px · 유리·오로라 빛 없음(평평한 종이)
- 분홍 줄무늬 제목줄 · 동그란 창 단추 · 분홍 트랙 안 알약 탭 · 말풍선 번호 · 박음질 PDF 버튼 · 캐릭터 아이콘

> **기본 디자인 토큰은 그대로 있습니다.** `design/`(파스텔 레트로 창 — 남보라 잉크 + 어긋난 하드 섀도우 + 격자)은
> 데이터분석 01~10 같은 지난 차시와 새 차시 틀이 씁니다. 이 폴더는 그 옆에 **따로** 둔 스티커 한 벌이고, `design/` 을 고치지 않습니다.

---

## 1. 무엇이 어디에 있나

| 파일 | 내용 |
|---|---|
| `tokens.json` | **원본.** 기본 `design/tokens.json` 과 같은 묶음·이름(`--msi-…`)에 값만 스티커로 — 색 57 · 서체 · 크기 · 여백 · 테두리 · 모서리 · 그림자 · 유리 · 움직임 · **역할 198**(카드·탭·과목·알레르기…) · 부품 치수 · 모양 |
| `tokens.css` | 위에서 만든 CSS 변수 355개 + `@font-face` — **직접 고치지 않음** |
| `components.css` | 기본 부품(`design/components.css` 본뜸, 스티커 값) + 맨 아래 **스티커 장식**(제목줄·탭·알약·말풍선·PDF 버튼·걷는 GIF…) |
| `preview.html` | 브라우저로 열면 색·서체·부품을 한눈에 (자동 생성) |
| `color-map.md` | 역할 → 색 표 (자동 생성) |
| `build.mjs` | `node design-sticker/build.mjs` → `tokens.css` · `preview.html` · `color-map.md` 다시 만들기 + **차시용 `theme.css` 의 변수 묶음(`:root{}`)도 다시 씀** |
| `fonts/` | GangwonEdu · CookieRun(400/700) · Maplestory(300/700) · Silkscreen(400/700) woff2 — 기본과 같은 서체 |
| `assets/` | `app-icon.png`(제목줄 학교 아이콘) · `icons/`(탭 4 · 카드 8, 128px) · `topic-walk.gif`(걷는 캐릭터) · `pdf-pop.gif`(튀어나오는 캐릭터) |

**스티커 값은 `tokens.json` 한 곳에서만 고칩니다**(선생님 결정 2026-10-23).

```text
design-sticker/tokens.json ──node design-sticker/build.mjs──┬─▶ design-sticker/tokens.css · preview.html · color-map.md   (다른 웹앱)
                                                             └─▶ design/themes/sticker/theme.css 의 :root{ } 변수 묶음       (활동지 차시)
```

| 쓰는 곳 | 불러오는 파일 | 어떻게 들어가나 |
|---|---|---|
| 정보 수업 **활동지(차시)** | `design/themes/sticker/theme.css` — 맨 위 `:root{}` 는 **자동 생성**(기본 토큰과 다른 값 218개), 그 아래 장식 규칙은 손으로 | 차시 `lesson.json` 의 `"theme": "sticker"` → 활동지 빌드가 `</body>` 앞에 넣음 |
| **다른 웹앱** · 시안 · 문서 | `design-sticker/tokens.css` + `components.css` | `<link>` 또는 `import` |

- `theme.css` 의 `:root{ … }` 안은 손으로 고치지 않습니다(다음 빌드에 덮어씀). 맨 위에 「자동 생성」 주석이 있습니다.
- 들어가는 것: `role` · `shape` · `glass` · `motion` · `rgb` 중 **기본 `design/tokens.json` 과 값이 다른 것**(같은 값은 활동지의 기본 토큰 블록에 이미 있음). 순서는 `color-map.md` 묶음 순.
- 설명 주석은 토큰의 `$note`(스티커 이유·주의) — `$description` 은 색 표의 이름 칸이라 건드리지 않습니다.
- 색은 `#hex` · `rgba()` 만 — 다른 색 함수가 있으면 빌드가 멈춥니다(활동지 PDF 저장이 못 읽음).

---

## 2. 새 차시(활동지)를 스티커로 만들 때

1. **틀에서 새로 만들기**(가장 쉬움)
   ```
   npm run new -- <단원>/<차시> --theme sticker --title "차시 제목"
   npm run portal-upgrade -- <단원>/<차시>
   npm run check -- <단원>/<차시>
   ```
   틀(`lessons/_templates/order`)은 모서리·테두리·그림자를 변수(`--msi-shape-*`)로 써서 테마가 그대로 입혀집니다.
2. **이미 있는 차시에 입히기** — 스킬 `lesson-theme` 6단계(규칙 `docs/rules/theme.md`):
   - 틀에서 만든 차시: `lesson.json` 에 `"theme": "sticker"` 한 줄
   - 숫자 모양 차시(예: ai/02 처음 상태): `node .claude/skills/lesson-theme/references/to-vars.mjs <단원/차시>` →
     `style-compare.mjs` 가 **✔ 전후 계산 스타일 같음**일 때만 테마 줄을 넣는다. 토큰 블록에 모양 변수가 없으면 먼저 `node design/build.mjs`.
   - 수업용 화면(`present.html`)이 있으면 `to-vars --file present.html` → `style-compare --present`.
3. **확인**: `npm run check -- <차시>` → 캡처 · PDF 저장 리허설(테마 색·말풍선 동전·모서리가 PDF 에도 나오는지).
4. 지금 스티커를 쓰는 차시: **ai/01 · ai/02**. 데이터분석 차시는 숫자 모양이라 걸지 않습니다(색 일부만 바뀜).

스티커 테마가 차시에 자동으로 해 주는 것(=`theme.css`): 색 · 모양 · 점무늬 바탕 · 제목줄 줄무늬 · 창 단추 동그라미 · 학교 아이콘 그림 ·
메뉴 탭 알약과 캐릭터 아이콘 · 카드 아이콘 칸 캐릭터 그림(`data-ic` 이모지 → 그림) · 단원 이름 버터 알약 · 번호 동전 말풍선 ·
순서 ①~④ 말랑 네모 · 버튼 올림/누름 · 분홍 포커스 고리 · 박음질 PDF 버튼 · 수업용 화면 장식. 자세한 목록: `design/themes/sticker/theme.md`.

**자동으로 안 되는 것** — ai/01 에서만 넣은 장식 4가지는 아래 「4. 골라 쓰는 장식」을 보고 필요한 차시에 붙입니다.

---

## 3. 다른 웹앱에 붙이기

**1) `design-sticker` 폴더를 통째로 복사**합니다(`fonts/` · `assets/` 가 `tokens.css` · `components.css` 옆에 있어야 서체·그림이 나옵니다).

**2-a) 그냥 HTML**
```html
<link rel="stylesheet" href="design-sticker/tokens.css">
<link rel="stylesheet" href="design-sticker/components.css">   <!-- 부품까지 쓸 때 -->
```
**2-b) Vite · React 등** — 진입점에서 불러오면 서체·그림 경로를 번들러가 처리합니다.
```js
import '../design-sticker/tokens.css';
import '../design-sticker/components.css';
```
**3) 쓸 영역을 `.msi-page` 로 감쌉니다**(그 안에만 서체·글자색·점무늬 바탕).
```html
<div class="msi-page"><div class="msi-wrap">
  <div class="msi-window">
    <div class="msi-titlebar">
      <div class="msi-win-title"><span class="msi-app-ic" aria-hidden="true"></span>앱 이름</div>
      <div class="msi-spacer"></div>
      <div class="msi-tabbar" role="tablist" aria-label="메뉴">
        <button class="msi-tab" type="button" role="tab" aria-selected="true"><span class="msi-tab-ic" style="background-image:url(design-sticker/assets/icons/tab-rules.png)"></span>이용 규칙</button>
        <button class="msi-tab" type="button" role="tab" aria-selected="false"><span class="msi-tab-ic" style="background-image:url(design-sticker/assets/icons/tab-time.png)"></span>시간표</button>
      </div>
      <div class="msi-win-btns"><span></span><span></span><span class="x"></span></div>
    </div>
    <div class="msi-win-body">
      <section class="msi-topic"><div class="msi-topic-bar">TODAY_TOPIC</div>
        <div class="msi-topic-in" style="text-align:center">
          <div><span class="msi-unit">인공지능</span> <span class="msi-unit msi-unit--no">1차시</span></div>
          <h1 class="msi-h1">인공지능이란?</h1>
        </div></section>
      <section class="msi-card" style="--accent:var(--msi-role-act1-head)">
        <div class="msi-card-head"><span>ACTIVITY_1</span></div>
        <div class="msi-card-body"><div class="msi-act-line"><span class="msi-coin">1</span><h2 class="msi-h2">활동 제목</h2></div> … </div>
      </section>
      <button class="msi-pdf-btn" type="button">📄 PDF로 저장하기</button>
    </div>
  </div>
</div></div>
```
(인라인 `url()` 은 HTML 기준 경로입니다. `components.css` 안의 `assets/…` 는 CSS 파일 기준이라 폴더째 옮기면 그대로 맞습니다.)

### 스티커 부품 클래스 (기본 부품에 더한 것)

| 클래스 | 모양 | 비고 |
|---|---|---|
| `.msi-titlebar` | 분홍 바탕 + 흰 세로 줄무늬 | 기본 부품을 덮어씀 |
| `.msi-win-btns span` ×3 | 버터 · 민트 · 살몬 동그라미 26px | 글자 없음 |
| `.msi-app-ic` | 제목 앞 52px 학교 아이콘 | 다른 그림은 `background-image` 만 바꿈 |
| `.msi-tabbar` › `.msi-tab[aria-selected]` › `.msi-tab-ic` | 분홍 트랙 안 알약, 고른 탭 흰 종이, 아이콘 30px | 폰(≤560px)은 트랙 모서리 18 |
| `.msi-unit` · `.msi-unit--no` | 단원 이름 버터 알약 · 차시 귤빛 알약 | 「골라 쓰는 장식 ①」 |
| `.msi-coin` · `.msi-coin--butter` | 번호 말풍선(분홍 · 버터) 44px | 그림은 `--msi-role-goals-coin-shape`(SVG) |
| `.msi-order` | 순서 ①~④ 말랑 네모 40px | |
| `.msi-ic` | 카드 아이콘 칸 40px + 캐릭터 그림 | 칸 색은 `--accent` |
| `.msi-pill.is-check` · `a.msi-pill[target=_blank]` | 확인 = 민트 · 바깥 사이트 = 베이비블루 | 올리면 ↑2px, 누르면 ↓1px |
| `.msi-pdf-btn[data-state]` | 박음질 라벨(안쪽 점선) + 분홍 번짐 | `busy` 버터 · `done` 민트 · `error` 살몬 |
| `.msi-walk` · `.msi-pop` | 걷는 GIF · 튀어나오는 GIF | 「골라 쓰는 장식 ②③」 |

포커스는 분홍 3px 고리(`--msi-pink-edge`), 움직임 줄이기 설정이면 올림·걷기·튀어나오기를 모두 멈춥니다.

---

## 4. 골라 쓰는 장식 — ai/01 에서만 넣은 것 (선생님 결정 2026-10-22: 테마에 넣지 않고 차시마다 골라 붙임)

차시에 붙일 때는 **ai/01 의 `lessons/ai/01/lesson.html` 에서 아래 검색어로 찾아 그대로 복사**하고, 그림은 그 차시 `assets/` 에 복사해 `msi-asset:./assets/…` 로 씁니다
(이 폴더의 `assets/topic-walk.gif` · `assets/pdf-pop.gif` 와 같은 파일). 붙인 뒤 `npm run check -- <차시>`.
다른 웹앱은 `components.css` 의 `.msi-walk` · `.msi-pop` + 아래 스크립트를 씁니다.

### ① 「N차시」 귤빛 알약 (2026-10-22)
주제 카드의 「· 1차시」를 알약으로. 색은 화면에 안 쓴 색 중 고른 **귤빛** `linear-gradient(135deg,#FFE3BD,#FFC992)` (시안 A 카라멜 · B 귤빛 · C 세이지 중 B).
- 차시: `lesson.html` 검색어 **`.unit-head .no {`** 의 규칙(2줄)을 복사하고, 글자 `<span class="no">· N차시</span>` 에서 「· 」를 뺀다.
  ```css
  .unit-head .no { font-family: 'CookieRun', Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif; font-weight: 700; font-size: 16px; color: var(--msi-role-base-night-sky-ink);
    background: linear-gradient(135deg,#FFE3BD,#FFC992); border: var(--msi-shape-bw2) solid var(--msi-role-base-night-sky-ink); border-radius: var(--msi-shape-r-pill); padding: 2px 12px; }
  ```
- 웹앱: `<span class="msi-unit msi-unit--no">1차시</span>`

### ② 주제 카드 아래 테두리를 걷는 캐릭터 GIF (2026-10-22)
하치와레·치이카와가 주제 카드 아래 테두리를 땅처럼 밟고 **오른쪽 끝 → 제목 글자 오른쪽 끝**까지 걷고, 글자에 닿으면 사라졌다가 1초 뒤 오른쪽 끝에서 다시 나타남(왼쪽으로만).

| 값 | 뜻 |
|---|---|
| 크기 93px | GIF 원본 282px 중 그림은 가로 12~269 · 세로 62~198(12장 모두 잰 값) → 93px 이면 캐릭터 키 약 45px |
| `bottom:-26px` | 93px 일 때 발끝 아래 투명 28px → 테두리 위 **2px**(발이 보이게) |
| 오른쪽 끝 = 상자 폭 − 101px | 93 + 둥근 모서리에 발이 가리지 않게 8px 안쪽 |
| 사라질 자리 `--tg-stop` | 제목 글자 오른쪽 끝 − 4px(그림 왼쪽 투명분). 스크립트가 0.7초마다 잼(화면 폭·글꼴마다 다름) |
| 7초 한 번 | 걷기 6초(85.71%) · 안 보임 1초. **먼저 투명(85.72%) → 그다음 오른쪽 끝으로(86.5%)** |
| 처음 1.2초 숨김 | 자리를 다 잰 뒤 `.is-ready` 로 나타남 — 탭을 처음 열 때 버벅임 방지 |
| `transform` 으로 이동 | `left` 로 움직이면 화면 배치를 다시 해서 끊김 |
| 걷는 중엔 자리 안 바꿈 | 새로 잰 자리는 안 보이는 1초에만 적용 — 걷다가 휙 옮겨지지 않게 |
| 폰(≤700px) 숨김 · 걸을 거리 60px 미만 숨김 · 움직임 줄이기면 오른쪽 끝에 서 있음 · PDF 에는 안 나옴(`no-pdf`) | |

- 차시: `lesson.html` 에서 세 군데를 복사한다.
  1. CSS — 검색어 **`주제 카드 아래 테두리를 땅처럼 걷는`** 부터 `@media (max-width: 700px) { .tg-walk` 까지
  2. 그림 — 주제 카드 제목 줄 바로 아래 `<img class="tg-walk no-pdf" src="msi-asset:./assets/topic-walk.gif" width="282" height="282" alt="" aria-hidden="true">`
     (주제 카드 몸통 `.tg-bd` 안, 상자는 `overflow:hidden` 인 `.tg-card`)
  3. 스크립트 — 검색어 **`[ai/01] 주제 카드의 걷는 GIF`** 의 `<script>` 통째. 안의 `"인공지능이란?"` 을 **그 차시 제목 글자**로 바꾼다(멈출 글자를 찾는 열쇠).
- 웹앱(`.msi-walk`): 상자 안에 `<img class="msi-walk" src="design-sticker/assets/topic-walk.gif" alt="" aria-hidden="true" data-stop-at="#topic-title">` 를 넣고
  ```js
  // 걷는 GIF — data-stop-at 글자의 오른쪽 끝까지. 상자(부모)는 position:relative; overflow:hidden
  (function () {
    function fit() {
      document.querySelectorAll('.msi-walk').forEach(function (w) {
        var box = w.parentNode, t = document.querySelector(w.dataset.stopAt); if (!w.offsetParent || !box || !t) return;
        var r = document.createRange(); r.selectNodeContents(t);
        var tr = r.getBoundingClientRect(), br = box.getBoundingClientRect(); if (!br.width) return;
        var k = box.offsetWidth / br.width;                         // zoom 보정
        var stop = Math.round((tr.right - br.left) * k - 4), dist = box.offsetWidth - 101 - stop;
        var a = w.classList.contains('is-ready') && w.getAnimations()[0];
        if (!a || (a.currentTime % 7000) > 6100) { w.style.setProperty('--msi-walk-stop', stop + 'px'); w.style.setProperty('--msi-walk-dist', dist + 'px'); }
        if (dist < 60) { w.classList.remove('is-ready'); clearTimeout(w._wait); w._wait = 0; return; }
        if (!w.classList.contains('is-ready') && !w._wait) w._wait = setTimeout(function () { w.classList.add('is-ready'); }, 1200);
      });
    }
    setInterval(fit, 700); addEventListener('resize', fit); if (document.fonts) document.fonts.ready.then(fit); fit();
  })();
  ```

### ③ PDF 저장할 때 튀어나오는 캐릭터 GIF (2026-10-22)
「PDF로 저장하기」를 누르면 치이카와 친구들이 버튼 위로 통 튀어나왔다가(크게 → 살짝 작게) 2.4초 뒤 사라짐. 크기 180px, 버튼 가운데 위.
- **저장이 실제로 시작될 때만** — 이름이 비었거나 진행률이 모자라 안내창이 뜨면 안 나옴(버튼이 `aria-busy="true"` 가 됐는지 클릭 직후 확인).
- `body` 에 붙여 PDF(`#sheetPrintArea` 복제본)에는 안 찍힘 · 떠 있는 동안 또 만들지 않음(처음 누르면 PDF 도구를 받은 뒤 버튼을 다시 눌러 주기 때문).
- 차시: `lesson.html` 에서 CSS 검색어 **`PDF 버튼을 누르면 치이카와 친구들 GIF`**(3줄) + 스크립트 검색어 **`[ai/01] PDF 버튼을 누르면 GIF`** 의 `<script>` 통째.
  저장 코드(`savePdf`)는 고치지 않는다.
- 웹앱: 저장을 시작하는 곳에서 `msiPop(button)` 을 부른다.
  ```js
  function msiPop(btn, src) {
    if (msiPop.on) return; msiPop.on = true;
    var r = btn.getBoundingClientRect(), img = new Image();
    img.className = 'msi-pop'; img.alt = ''; img.setAttribute('aria-hidden', 'true'); img.src = src || 'design-sticker/assets/pdf-pop.gif';
    img.style.left = (r.left + r.width / 2) + 'px'; img.style.top = Math.max(8, r.top - 180) + 'px';
    document.body.appendChild(img);
    setTimeout(function () { img.remove(); msiPop.on = false; }, 2500);
  }
  ```

### ④ 「✓ 저장했어요」를 버튼이 다 넓어진 뒤에 (2026-10-22, 고친 것)
저장 중 PDF 버튼은 동그라미(58~62px)로 줄었다가 끝나면 0.6초 동안 다시 넓어진다. 글자를 바로 넣으면 좁은 버튼 밖으로 삐져나와서, 비워 두었다가 0.6초 뒤 넣는다(움직임 줄이기면 바로).
- 차시: `lesson.html` 의 `savePdf` 안 `const done = () => {` 에서 `btn.textContent = pdfOk ? '✓ 저장했어요' : …` 한 줄을 아래 세 줄로 바꾼다.
  ```js
  btn.textContent = '';
  const _msg = pdfOk ? '✓ 저장했어요' : '⚠ 다시 눌러 주세요';
  setTimeout(() => { if (btn.getAttribute('data-state')) btn.textContent = _msg; }, window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600);
  ```
  지금은 ai/01 만 고쳐져 있다 — 틀(`_templates/order`)과 다른 차시도 같은 코드라 같은 증상이 날 수 있다.

---

## 5. 그림(assets)

| 파일 | 쓰임 | 이모지 자리(`data-ic`) |
|---|---|---|
| `app-icon.png` | 제목줄 학교 아이콘 | 🏫 |
| `icons/tab-rules.png` · `tab-time.png` · `tab-meal.png` · `tab-sheet.png` | 메뉴 탭 4 | 📜 · 🕒 · 🍚 · ✏️ |
| `icons/ic-target.png` · `ic-palette.png` · `ic-search.png` · `ic-brain.png` · `ic-robot.png` · `ic-wave.png` · `ic-rice.png` · `ic-check.png` | 카드 아이콘 | 🎯 · 🎨 · 🔎 · 🧠 · 🤖 · 🌊 · 🍚 · 📝✅ |
| `topic-walk.gif` | 걷는 하치와레·치이카와 (282px, 12장, 투명) | ② |
| `pdf-pop.gif` | 튀어나오는 치이카와 친구들 (282px, 21장, 2.1초, 투명) | ③ |

- 원본은 선생님이 보내 준 그림(Downloads). 아이콘은 `.claude/skills/lesson-theme/references/icon-make.mjs` 로 단색 바탕을 지우고 128px 로 줄였다.
- **치이카와 원작 캐릭터 그림**입니다. 공개 사이트(GitHub Pages)에 쓰는 것은 선생님이 정함(2026-10-21) — 다른 곳(외부 공개 앱·배포물)에 쓸 때는 다시 확인합니다.
- 새 아이콘을 더할 때: 차시 쪽은 `design/themes/sticker/icons/` + `theme.css` 에 `[data-ic="<이모지>"]` 규칙(스킬 `lesson-theme` 7단계), 이 폴더는 `assets/icons/` 에도 복사.

---

## 6. 토큰 요약 (전체는 `preview.html` · `tokens.css` · `color-map.md`)

| 묶음 | 스티커 값 | 기본(design/) |
|---|---|---|
| 잉크 `--msi-ink` · `--msi-rgb-ink` | `#4A3B32` · `74,59,50` | `#4b3b6b` · `75,59,107` |
| 바탕 `--msi-page` · 종이 `--msi-paper` · 점무늬 `--msi-grid` | `#FAF2E1` · `#FFFDF8` · `#E8D9C0`(22px 점) | `#e7e3f7` · `#fffdf7` · 격자 |
| 흐린 글자 `--msi-muted-2` / `--msi-muted` | `#6B5B51`(6.4:1) / `#857062`(4.6:1 — 큰 글자만) | `#6b5b93` / `#8b7cb8` |
| 「진행 중」 `--msi-status-live-bg` · 링크 | `#B04A6C`(크림 글자 5.1:1) | `#7b5cd6` |
| 모서리 창·카드·상자·버튼·입력칸·태그 | 22 · 18 · 14 · 14 · 12 · 8 (`--msi-shape-radius-k: 1.35`) | 16 · 14 · 11 · 10 · 9 · 6 |
| 테두리 창 / 나머지 | 3px / 3px | 4px / 3px |
| 그림자 창·카드·버튼·칩 | `0 14px 34px` · `0 8px 20px` · `0 4px 10px` · `0 3px 8px` (갈색 .12~.2) | `8px 8px 0` · `5px 5px 0` … (블러 0) |
| 유리 층 `--msi-glass-*` · 오로라 | 끔(`none` · 투명) | 켬 |
| 누름 `--msi-motion-press` | `translateY(1px)` | `scale(1.04,.9)` |
| 카드 머리 topic·goals·warmup·intro·act1~4·summary·checkup | 분홍 · 버터 · 민트 · 살구 · 라벤더 · 라일락 · 하늘 · 살몬 · 새싹 · 연파랑 | — |
| 서체 · 글자 크기 · 여백 | 기본과 같음(제목 GangwonEdu · 소제목 CookieRun · 본문 Maplestory · 영문 Silkscreen, **글자 16px 이상**) | |

---

## 7. 고칠 때

- **값**: `design-sticker/tokens.json` **만** 고치고 `node design-sticker/build.mjs` → `tokens.css` 와 차시용 `theme.css` 의 `:root{}` 가 함께 바뀐다.
  그다음 스티커를 쓰는 차시 `npm run check -- ai/01 ai/02`. (새 변수를 더할 때도 tokens.json 에 — 기본 토큰에 없는 이름은 `$description` 에 쓰임을 적는다.)
- **부품 모양**: `components.css`. 활동지 쪽 장식은 `theme.css` 의 선택자 규칙(`#appTitlebar …` · `:is(#sheetPrintArea, .msi-pdf-clone) …`).
- **기본 토큰(`design/`)은 건드리지 않는다** — `node design/build.mjs` 는 기본 테마와 틀·ai/01·07 의 토큰 블록을 다시 채운다(스티커 값을 거기 넣으면 모든 차시가 바뀜).

### 테마 쪽에서 지킬 것 (`docs/rules/theme.md` §3)
- 색은 `#hex` · `rgba()` 만 — `color-mix()` · `oklch()` 등은 활동지 빌드가 멈춘다(PDF html2canvas). 요소 자신의 `inset` 그림자 X(PDF 흰 판).
- 인라인 style 로 그리는 것(메뉴 탭 · 창 단추 · 카드 머리 · 아이콘 칸)은 선택자에 `!important`.
- 글자 16px 이상 · 누르는 것 44px 이상 · 본문 대비 4.5:1 · 상태는 색 + 글/기호.

## 8. 이력
- 2026-10-21 Claude Design 견본(`input/claude-design/sticker/`) → 차시 테마 `design/themes/sticker/` · ai/01 에 입힘
- 2026-10-22 ai/02 에도 입힘 · 시간표 탭 아이콘 · ai/01 피드백(걷는 GIF · PDF GIF · 귤빛 알약 · 저장 글자) · **이 폴더(design-sticker/) 만듦** — 기본 `design/` 은 그대로
- 2026-10-23 값을 한 곳으로 — `tokens.json` 이 원본, 빌드가 차시용 `theme.css` 의 `:root{}` 를 다시 씀(바꾸기 전후 변수 218개 값 모두 같음 · ai/01 · ai/02 검사 통과)
