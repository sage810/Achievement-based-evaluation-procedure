# 스티커 테마 — 역할 → 색 표 (자동 생성)

> **직접 고치지 않는다.** `design-sticker/tokens.json` 의 `role` 을 고치고 `node design-sticker/build.mjs` 를 돌리면 이 표와 `design-sticker/tokens.css` 가 바뀐다.
> 활동지(차시)에 실제로 입혀지는 값은 `design/themes/sticker/theme.css` — 둘을 같이 고친다(빌드가 어긋난 값을 알려 줌).
> 기본 테마(파스텔 레트로 창)의 표는 `docs/rules/color-map.md`.

- 활동지에서는 `var(--msi-role-이름)` 으로 쓴다(예: `background:var(--msi-role-progress-head)`).
- 카드는 **머리(-head) · 몸통(-body)** 를 한 벌로 쓴다. 활동이 5개 이상이면 act1~act4 를 차례로 돌려 쓴다.
- 오로라 빛처럼 투명도가 필요한 곳은 `color-mix(in srgb, var(--msi-role-aurora-pink) 60%, transparent)`.


## 창·배경

| 역할 | 토큰 | 값 |
|---|---|---|
| 창 바깥 배경 바탕 라벤더 | `--msi-role-page-bg` | `#FAF2E1` |
| 바깥 배경 모눈 선(28px) | `--msi-role-page-grid` | `#E8D9C0` |
| 오로라 빛 — 분홍(바깥 배경·창·TODAY_TOPIC·MY_INFO·PDF 버튼 뒤 빛) | `--msi-role-aurora-pink` | `#F9C4D0` |
| 오로라 빛 — 하늘 | `--msi-role-aurora-sky` | `#D4E6F7` |
| 오로라 빛 — 라벤더 | `--msi-role-aurora-lavender` | `#DCD6EE` |
| 오로라 lavender 20% — aurora-lavender 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-lavender-a20` | `rgba(0,0,0,0)` |
| 오로라 lavender 28% — aurora-lavender 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-lavender-a28` | `rgba(0,0,0,0)` |
| 오로라 lavender 60% — aurora-lavender 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-lavender-a60` | `rgba(0,0,0,0)` |
| 오로라 pink 20% — aurora-pink 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-pink-a20` | `rgba(0,0,0,0)` |
| 오로라 pink 32% — aurora-pink 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-pink-a32` | `rgba(0,0,0,0)` |
| 오로라 pink 60% — aurora-pink 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-pink-a60` | `rgba(0,0,0,0)` |
| 오로라 sky 20% — aurora-sky 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-sky-a20` | `rgba(0,0,0,0)` |
| 오로라 sky 32% — aurora-sky 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-sky-a32` | `rgba(0,0,0,0)` |
| 오로라 sky 60% — aurora-sky 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-sky-a60` | `rgba(0,0,0,0)` |
| 창 몸통(크림 서리 유리의 바탕) | `--msi-role-window-body` | `#FFFDF8` |
| 제목줄(학교 이름 + 탭) | `--msi-role-titlebar-head` | `repeating-linear-gradient(90deg,rgba(255,255,255,.45) 0 10px,rgba(255,255,255,0) 10px 20px) #FBE3E8` |

## 메뉴 탭(고른 탭)

| 역할 | 토큰 | 값 |
|---|---|---|
| 고른 탭 — 이용 규칙(솜사탕) | `--msi-role-tab-rules` | `#FFFDF8` |
| 고른 탭 — 시간표 | `--msi-role-tab-time` | `#FFFDF8` |
| 고른 탭 — 오늘의 급식 | `--msi-role-tab-meal` | `#FFFDF8` |
| 고른 탭 — 수업 활동지(오로라) | `--msi-role-tab-sheet` | `#FFFDF8` |
| 메뉴 탭 4개를 감싸는 분홍 트랙 | `--msi-role-tabbar-track` | `#F3C9D5` |

## 수업 활동지 카드

| 역할 | 토큰 | 값 |
|---|---|---|
| TODAY_TOPIC 머리(보라→하늘) | `--msi-role-topic-head` | `#F9C4D0` |
| TODAY_TOPIC 몸통 | `--msi-role-topic-body` | `#FEF2F5` |
| MY_INFO 머리(노랑) | `--msi-role-myinfo-head` | `#D4E6F7` |
| MY_INFO 몸통 | `--msi-role-myinfo-body` | `#F2F7FC` |
| TODAY_GOALS 머리(로즈 더스트) | `--msi-role-goals-head` | `#FBEFB4` |
| TODAY_GOALS 몸통 | `--msi-role-goals-body` | `#FFFBE9` |
| 오늘의 목표 번호 동전 | `--msi-role-goals-coin` | `#F6A8BC` |
| 도입 WARM_UP 머리(세이지) | `--msi-role-warmup-head` | `#BFE6D6` |
| 도입 WARM_UP 몸통 | `--msi-role-warmup-body` | `#EFF9F5` |
| 도입 TODAY_TOPIC(학습주제 제시) 머리(연두) | `--msi-role-intro-head` | `#FBDCC8` |
| 도입 TODAY_TOPIC 몸통 | `--msi-role-intro-body` | `#FEF6F0` |
| 전개 ACTIVITY_1 머리·질문 스티커(하늘) | `--msi-role-act1-head` | `#DCD6EE` |
| ACTIVITY_1 몸통 | `--msi-role-act1-body` | `#F6F4FB` |
| ACTIVITY_2 머리·질문 스티커(민트) | `--msi-role-act2-head` | `#EFD0E6` |
| ACTIVITY_2 몸통 | `--msi-role-act2-body` | `#FAF2F8` |
| ACTIVITY_3 머리·질문 스티커(라임 소다) | `--msi-role-act3-head` | `#BFE1E6` |
| ACTIVITY_3 몸통 | `--msi-role-act3-body` | `#EFF8F9` |
| ACTIVITY_4 머리·질문 스티커(라벤더) | `--msi-role-act4-head` | `#F8CFC4` |
| ACTIVITY_4 몸통 | `--msi-role-act4-body` | `#FEF4F1` |
| 정리 KEY_SUMMARY 머리(연어) | `--msi-role-summary-head` | `#D9E8B4` |
| KEY_SUMMARY 몸통 | `--msi-role-summary-body` | `#F5F9EC` |
| 정리 CHECK_UP 머리(라일락) | `--msi-role-checkup-head` | `#CDD9F3` |
| CHECK_UP 몸통 | `--msi-role-checkup-body` | `#F2F5FC` |
| 형성평가 번호 동전 | `--msi-role-checkup-coin` | `#FBEFB4` |
| 스티커 전용: goals-coin-shape | `--msi-role-goals-coin-shape` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 4 C32 4 40 11 40 20 C40 29 32 36 22 36 C19 36 17 35.5 15 35 L8 40 L10 32 C6 29 4 25 4 20 C4 11 12 4 22 4 Z' fill='%23F6A8BC' stroke='%234A3B32' stroke-width='2.5' stroke-linejoin='round'/%3E%3C/svg%3E")` |
| 스티커 전용: checkup-coin-shape | `--msi-role-checkup-coin-shape` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 4 C32 4 40 11 40 20 C40 29 32 36 22 36 C19 36 17 35.5 15 35 L8 40 L10 32 C6 29 4 25 4 20 C4 11 12 4 22 4 Z' fill='%23FBEFB4' stroke='%234A3B32' stroke-width='2.5' stroke-linejoin='round'/%3E%3C/svg%3E")` |
| 순서 배열 ①~④ 말랑 네모 | `--msi-role-order-coin` | `#D4E6F7` |

## 왼쪽 고정 카드

| 역할 | 토큰 | 값 |
|---|---|---|
| 왼쪽 PROGRESS 머리(살구) | `--msi-role-progress-head` | `#FBE3E8` |
| PROGRESS 몸통 | `--msi-role-progress-body` | `#FFFDF8` |
| 왼쪽 HELP 머리(베이지) | `--msi-role-help-head` | `#F3EAE0` |
| HELP 몸통 | `--msi-role-help-body` | `#FFFDF8` |

## PDF 버튼

| 역할 | 토큰 | 값 |
|---|---|---|
| PDF 버튼 유리 속(오로라) | `--msi-role-pdf-btn` | `#F7AEC0` |
| PDF 저장 끝남(민트) | `--msi-role-pdf-done` | `#BFE6D6` |
| PDF 저장 실패(연어) | `--msi-role-pdf-error` | `#F6B4AE` |

## 고르기 칩(분석 유형)

| 역할 | 토큰 | 값 |
|---|---|---|
| 고르기 칩(분석 유형) 유리 속 — PDF 버튼과 같은 오로라 | `--msi-role-chip-glass` | `#FFFDF8` |
| 고르기 칩 — 맞게 고름(민트 + ✓) | `--msi-role-chip-ok` | `#DDF2E6` |
| 고르기 칩 — 틀리게 고름(연어 + ✗) | `--msi-role-chip-no` | `#FBE0E0` |

## 이용 규칙 탭

| 역할 | 토큰 | 값 |
|---|---|---|
| 이용 규칙 HOW_TO_USE 머리 | `--msi-role-howto-head` | `#FBDCC8` |
| HOW_TO_USE 몸통 | `--msi-role-howto-body` | `#FEF6F0` |
| RULE_01 머리(피치 셔벗) | `--msi-role-rule1-head` | `#DCD6EE` |
| RULE_01 몸통 | `--msi-role-rule1-body` | `#F6F4FB` |
| RULE_02 머리(라임 소다) | `--msi-role-rule2-head` | `#D9E8B4` |
| RULE_02 몸통 | `--msi-role-rule2-body` | `#F5F9EC` |
| RULE_03 머리(민트) | `--msi-role-rule3-head` | `#BFE1E6` |
| RULE_03 몸통 | `--msi-role-rule3-body` | `#EFF8F9` |
| MESSAGE 머리(라벤더) | `--msi-role-message-head` | `#F8CFC4` |
| MESSAGE 몸통 | `--msi-role-message-body` | `#FEF4F1` |
| LOADING 머리(노랑) | `--msi-role-loading-head` | `#CDD9F3` |
| LOADING 몸통 | `--msi-role-loading-body` | `#F2F5FC` |

## 보기 버튼(시간표·급식)

| 역할 | 토큰 | 값 |
|---|---|---|
| 고른 보기 버튼 — 일간(바닐라) · 시간표·급식 같음 | `--msi-role-view-day` | `#F7E8DF` |
| 고른 보기 버튼 — 주간(세이지) | `--msi-role-view-week` | `#E9E2F0` |
| 고른 보기 버튼 — 월간(로즈) | `--msi-role-view-month` | `#E3EBE6` |

## 시간표 탭

| 역할 | 토큰 | 값 |
|---|---|---|
| 시간표 주간 머리 줄(TIME·월~금) | `--msi-role-tt-week-head` | `#F3EAE0` |
| 시간표 월간 요일 줄(SUN~SAT) | `--msi-role-tt-month-head` | `#F3EAE0` |
| 시간표 주간 첫 열(교시 칸) | `--msi-role-tt-time-col` | `#F3EAE0` |
| 시간표 GRADE/CLASS 상자 | `--msi-role-tt-grade-box` | `#FFFDF8` |

## 오늘의 급식 탭

| 역할 | 토큰 | 값 |
|---|---|---|
| 급식 일간 TODAY_LUNCH 머리 | `--msi-role-lunch-head` | `#F8CFC4` |
| TODAY_LUNCH 몸통 | `--msi-role-lunch-body` | `#FEF4F1` |
| 급식 TOTAL 칼로리 상자(피치 셔벗) | `--msi-role-lunch-total` | `#FBEFB4` |
| 급식 월간 요일 줄 | `--msi-role-lunch-month-head` | `#F3EAE0` |
| 급식 주간 월요일 카드 머리(코랄) | `--msi-role-lunch-mon` | `#F9C4D0` |
| 화요일(살구노랑) | `--msi-role-lunch-tue` | `#FBDCC8` |
| 수요일(연두) | `--msi-role-lunch-wed` | `#FBEFB4` |
| 목요일(청록) | `--msi-role-lunch-thu` | `#BFE6D6` |
| 금요일(라벤더블루) | `--msi-role-lunch-fri` | `#D4E6F7` |

## 과목 색(시간표 19과목)

| 역할 | 토큰 | 값 |
|---|---|---|
| 국어 — 언어(분홍) | `--msi-role-subj-korean` | `#F9C4D0` |
| 영어 — 언어 | `--msi-role-subj-english` | `#F7B8C8` |
| 한문 — 언어 | `--msi-role-subj-hanmun` | `#FBD8DF` |
| 생활 중국어 — 언어 | `--msi-role-subj-chinese` | `#F4CBDE` |
| 사회 — 사회(주황·금빛) | `--msi-role-subj-social` | `#FBDCC8` |
| 역사 — 사회 | `--msi-role-subj-history` | `#F8CFC4` |
| 도덕 — 사회 | `--msi-role-subj-ethics` | `#FBEFB4` |
| 체육 — 예체능(연두·초록) | `--msi-role-subj-pe` | `#BFE6D6` |
| 미술 — 예체능 | `--msi-role-subj-art` | `#D9E8B4` |
| 음악 — 예체능 | `--msi-role-subj-music` | `#BFE1E6` |
| 수학 — 수리·과학(민트·하늘) | `--msi-role-subj-math` | `#D4E6F7` |
| 과학 — 수리·과학 | `--msi-role-subj-science` | `#CDD9F3` |
| 정보 — 수리·과학 | `--msi-role-subj-info` | `#B9D4F0` |
| 기술·가정 — 수리·과학 | `--msi-role-subj-tech-home` | `#DCE9F9` |
| 동아리활동 — 창체(파랑·보라) | `--msi-role-subj-club` | `#DCD6EE` |
| 자율·자치활동 — 창체 | `--msi-role-subj-autonomy` | `#EFD0E6` |
| 진로활동 — 창체 | `--msi-role-subj-career` | `#E6D9F2` |
| 자율활동 — 창체 | `--msi-role-subj-self` | `#E1D4F0` |
| 봉사활동 — 창체 | `--msi-role-subj-volunteer` | `#F2DDEB` |

## 급식 알레르기 19가지

| 역할 | 토큰 | 값 |
|---|---|---|
| 급식 알레르기 1 난류 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff4d6d) | `--msi-role-allergen-1` | `#FDE3E1` |
| 급식 알레르기 10 돼지고기 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #3d5afe) | `--msi-role-allergen-10` | `#DEE1F2` |
| 급식 알레르기 11 복숭아 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #7c4dff) | `--msi-role-allergen-11` | `#EADFF5` |
| 급식 알레르기 12 토마토 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #b429ff) | `--msi-role-allergen-12` | `#E6D8F0` |
| 급식 알레르기 13 아황산류 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #e040fb) | `--msi-role-allergen-13` | `#F3DDEC` |
| 급식 알레르기 14 호두 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff2d95) | `--msi-role-allergen-14` | `#FBE0EA` |
| 급식 알레르기 15 닭고기 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff5252) | `--msi-role-allergen-15` | `#FBDEDA` |
| 급식 알레르기 16 소고기 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #c1440e) | `--msi-role-allergen-16` | `#F1E2D6` |
| 급식 알레르기 17 오징어 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #00867d) | `--msi-role-allergen-17` | `#D6EEEA` |
| 급식 알레르기 18 조개류 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #5d6dff) | `--msi-role-allergen-18` | `#D7E2F6` |
| 급식 알레르기 19 잣 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #8d6e00) | `--msi-role-allergen-19` | `#F6EACB` |
| 급식 알레르기 2 우유 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff7a1a) | `--msi-role-allergen-2` | `#FDE8D6` |
| 급식 알레르기 3 메밀 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ffb800) | `--msi-role-allergen-3` | `#FBF3C8` |
| 급식 알레르기 4 땅콩 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #e8d000) | `--msi-role-allergen-4` | `#FAEDB9` |
| 급식 알레르기 5 대두 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #9ed900) | `--msi-role-allergen-5` | `#EEF5CF` |
| 급식 알레르기 6 밀 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #2fc744) | `--msi-role-allergen-6` | `#DDF2E6` |
| 급식 알레르기 7 고등어 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #00c9a7) | `--msi-role-allergen-7` | `#D8F1EE` |
| 급식 알레르기 8 게 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #00bcd4) | `--msi-role-allergen-8` | `#DDEFF9` |
| 급식 알레르기 9 새우 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #0091ff) | `--msi-role-allergen-9` | `#DCE6F8` |

## 기본 색(DESIGN.md 팔레트)

| 역할 | 토큰 | 값 |
|---|---|---|
| DESIGN.md 팔레트 — apricot | `--msi-role-base-apricot` | `#FBDCC8` |
| DESIGN.md 팔레트 — blush-paper | `--msi-role-base-blush-paper` | `#FEF2F5` |
| DESIGN.md 팔레트 — butter | `--msi-role-base-butter` | `#FBEFB4` |
| DESIGN.md 팔레트 — button-ink | `--msi-role-base-button-ink` | `#4A3B32` |
| DESIGN.md 팔레트 — cotton-pink | `--msi-role-base-cotton-pink` | `#F9C4D0` |
| DESIGN.md 팔레트 — cream-paper | `--msi-role-base-cream-paper` | `#FFFDF8` |
| DESIGN.md 팔레트 — grid-line | `--msi-role-base-grid-line` | `#E8D9C0` |
| DESIGN.md 팔레트 — lavender | `--msi-role-base-lavender` | `#DCD6EE` |
| DESIGN.md 팔레트 — lavender-desk | `--msi-role-base-lavender-desk` | `#FAF2E1` |
| DESIGN.md 팔레트 — lilac | `--msi-role-base-lilac` | `#EFD0E6` |
| DESIGN.md 팔레트 — link-berry | `--msi-role-base-link-berry` | `#c96a97` |
| DESIGN.md 팔레트 — live-violet | `--msi-role-base-live-violet` | `#B04A6C` |
| DESIGN.md 팔레트 — mint | `--msi-role-base-mint` | `#BFE6D6` |
| DESIGN.md 팔레트 — muted-violet | `--msi-role-base-muted-violet` | `#7A6A60` |
| DESIGN.md 팔레트 — night-sky-ink | `--msi-role-base-night-sky-ink` | `#4A3B32` |
| DESIGN.md 팔레트 — periwinkle | `--msi-role-base-periwinkle` | `#CDD9F3` |
| DESIGN.md 팔레트 — periwinkle-strong | `--msi-role-base-periwinkle-strong` | `#B9D4F0` |
| DESIGN.md 팔레트 — placeholder-haze | `--msi-role-base-placeholder-haze` | `#C9ADA1` |
| DESIGN.md 팔레트 — salmon | `--msi-role-base-salmon` | `#F8CFC4` |
| DESIGN.md 팔레트 — sand | `--msi-role-base-sand` | `#F3EAE0` |
| DESIGN.md 팔레트 — sky | `--msi-role-base-sky` | `#BFE1E6` |
| DESIGN.md 팔레트 — sprout | `--msi-role-base-sprout` | `#D9E8B4` |
| DESIGN.md 팔레트 — white | `--msi-role-base-white` | `#FFFDF8` |

## 4탭 공통 화면(상태·칸·안내 상자 등)

| 역할 | 토큰 | 값 |
|---|---|---|
| 아쿠아 칩(동아리 시간 등) | `--msi-role-ui-aqua` | `#E6EEEA` |
| 월간 시간표 표시 글자 | `--msi-role-ui-badge-ink` | `#6B5B51` |
| 처리 중 줄무늬 A | `--msi-role-ui-busy-a` | `#FBEFB4` |
| 처리 중 줄무늬 B | `--msi-role-ui-busy-b` | `#FFF6D6` |
| 안내 상자 — 질문 | `--msi-role-ui-callout-ask` | `#FFFBE9` |
| 안내 상자 — 이유 | `--msi-role-ui-callout-reason` | `#EEF7F2` |
| 안내 상자 — 팁 | `--msi-role-ui-callout-tip` | `#F1EEF9` |
| 안내 상자 — 주의 | `--msi-role-ui-callout-warn` | `#FEF4F1` |
| 작은 캡션 글자(EMPTY · DROP HERE · KCAL 등) | `--msi-role-ui-caption-violet` | `#6B5B51` |
| 날짜 글자 | `--msi-role-ui-date-ink` | `#4A3B32` |
| 진한 보라 글자(순서 배열 태그 등) | `--msi-role-ui-deep-violet` | `#6B5B51` |
| 빈 칸·다른 달 칸 바탕 | `--msi-role-ui-empty-cell` | `#FAF2E1` |
| 빈 시간표 칸 글자 | `--msi-role-ui-empty-ink` | `#857062` |
| 퀴즈 틀림 바탕 | `--msi-role-ui-feedback-no-bg` | `#FBE0E0` |
| 퀴즈 틀림 글자 · GOAL 라벨 | `--msi-role-ui-feedback-no-ink` | `#A64A4A` |
| 퀴즈 맞음 바탕 | `--msi-role-ui-feedback-ok-bg` | `#DDF2E6` |
| 퀴즈 맞음 글자 | `--msi-role-ui-feedback-ok-ink` | `#2F6B48` |
| 입력·끌어 놓기 칸 포커스·강조 테두리 | `--msi-role-ui-focus-pink` | `#E56A8E` |
| 맨 아래 @sage810 | `--msi-role-ui-footer-ink` | `#6B5B51` |
| 작은 보조 버튼 올림 | `--msi-role-ui-ghost-hover` | `#F3EAE0` |
| 흐린 초록(예전 과목 색 · 체육) | `--msi-role-ui-green-mut` | `#c9e8b8` |
| 도움말 펼침 카드 바탕 | `--msi-role-ui-guide-body` | `#EFF9F5` |
| 예전 과목 색 · 보건 | `--msi-role-ui-health-pink` | `#f5b7c8` |
| 그래프 시각화하기 도움말 바탕 | `--msi-role-ui-help-box` | `#FFFDF8` |
| HELP 버튼 올림 | `--msi-role-ui-help-btn-hover` | `#F3EAE0` |
| HELP 버튼 펼침 | `--msi-role-ui-help-btn-open` | `#FBE3E8` |
| 형광펜 라일락 | `--msi-role-ui-hl-lilac` | `#EFD0E6` |
| 링크 올림 | `--msi-role-ui-link-hover` | `#4A3B32` |
| 시간표 — 지금 교시 줄 바탕 | `--msi-role-ui-live-row` | `#FEF2F5` |
| 시간표 NOTE 라벨 글자 | `--msi-role-ui-note-ink` | `#6B5B51` |
| 올리브(예전 과목 색 · 자율) | `--msi-role-ui-olive` | `#e3e0b0` |
| 아주 옅은 보라 바탕 | `--msi-role-ui-pale-violet` | `#FFFDF8` |
| 붙여넣기 칸 안내 글자 | `--msi-role-ui-paste-hint-ink` | `#6B5B51` |
| 종이 버튼 눌림 바탕 | `--msi-role-ui-periwinkle-press` | `#CDD9F3` |
| 창 X 버튼 · 진한 분홍 칸 | `--msi-role-ui-pink-strong` | `#F6B4AE` |
| 흐린 보라 칩(동아리 활동 등) | `--msi-role-ui-purple-mut` | `#DCD6EE` |
| 연보라 칸 바탕(주말·교시 칸·GRADE 상자) | `--msi-role-ui-soft-lavender` | `#F3EAE0` |
| 상태 — 완료 바탕 | `--msi-role-ui-status-past-bg` | `#EFE8DF` |
| 상태 — 완료 글자 | `--msi-role-ui-status-past-ink` | `#6B5B51` |
| 상태 — 예정 글자 | `--msi-role-ui-status-upcoming-ink` | `#857062` |
| 상태 — 예정 점선 | `--msi-role-ui-status-upcoming-line` | `#C9ADA1` |
| 단계 번호 빨강(흰 글자) | `--msi-role-ui-step-red` | `#c0392b` |
| 빈 칸 줄무늬 크림 | `--msi-role-ui-stripe-cream` | `#FFFDF8` |
| 빈 칸 줄무늬 연보라 | `--msi-role-ui-stripe-violet-a` | `#FEF2F5` |
| 빈 칸 줄무늬 보라 | `--msi-role-ui-stripe-violet-b` | `#FEF2F5` |
| 핵심 요약 표 머리 | `--msi-role-ui-summary-th` | `#F3EAE0` |
| 시간표 끝나는 시각 글자 | `--msi-role-ui-time-end-ink` | `#6B5B51` |
| 달력 오늘 칸 바탕 | `--msi-role-ui-today-cell` | `#FFF6D6` |
| 급식 TOTAL 글자 | `--msi-role-ui-total-ink` | `#8a4f36` |
| 입력칸 자리표시자 글자(분홍 종이 위 4.5:1↑, 2026-10-16 audit) | `--msi-role-ui-placeholder` | `#857062` |
| 수업용 화면 「일반 소프트웨어」 이름표(선생님 지정 2026-10-19, 「인공지능 소프트웨어」는 base-lilac) | `--msi-role-ui-label-general` | `#ffd685` |

## 유리 · 움직임 · 손가락 크기 (색이 아닌 토큰 — 활동지 블록에 함께 들어감)

| 쓰임 | 토큰 | 값 |
|---|---|---|
| 유리 알약 윗면 빛띠(버튼·칩·PDF) | `--msi-glass-top` | `none` |
| 유리 머리 윗면 빛띠(카드 머리·탭·보기 버튼) | `--msi-glass-top-head` | `none` |
| 올리면 지나가는 빛 한 줄(background-size 300%, position 100% → 0%) | `--msi-glass-sheen` | `none` |
| 흰 유리 막(오로라 속 위) | `--msi-glass-white` | `none` |
| 유리 알약 안쪽 흰 테(위 1.5px · 아래 속광) — box-shadow 앞쪽에 | `--msi-glass-inset` | `0 0 0 0 rgba(0,0,0,0)` |
| PDF 큰 알약 안쪽 흰 테 | `--msi-glass-inset-big` | `0 0 0 0 rgba(0,0,0,0)` |
| 유리 머리 안쪽 흰 테(::after 에) | `--msi-glass-inset-head` | `0 0 0 0 rgba(0,0,0,0)` |
| PDF 버튼 뒤 흐림(backdrop-filter) — 터치 기기에선 끔 | `--msi-glass-backdrop` | `none` |
| 물방울 꾹(누름) — 튕기는 곡선 | `--msi-motion-ease-spring` | `cubic-bezier(.34,1.56,.64,1)` |
| 빛 쓱 · 그림자 · 펼침 | `--msi-motion-ease-out` | `cubic-bezier(.2,0,0,1)` |
| 유리 알약·칩 누름 | `--msi-motion-press` | `translateY(1px)` |
| PDF 큰 알약 누름 | `--msi-motion-press-big` | `translateY(1px)` |
| content-max | `--msi-size-content-max` | `1080px` |
| 문서형 화면 | `--msi-size-doc-max` | `980px` |
| 손가락으로 누르는 것의 최소 높이(태블릿·크롬북) | `--msi-size-touch-min` | `44px` |
| 수업 활동지 글자 최소 크기 — 이보다 작은 글자 없음(선생님 지시 2026-10-20, ai/01·새 차시 틀) | `--msi-size-text-min` | `16px` |
| 그림·영상 최대 폭 | `--msi-part-figure-max` | `680px` |
| 이름표를 놓는 칸 최소 폭 | `--msi-part-slot-min` | `176px` |
| 여러 줄이 되는 알약(긴 보기 고르기 칩·순서 카드) 모서리 | `--msi-part-choice-radius` | `22px` |
| O/X 버튼 최소 폭 | `--msi-part-ox-min` | `56px` |
| 버튼 줄·개념 카드·이름표 줄 사이 | `--msi-part-gap` | `10px` |
| 그림을 누르면 나오는 영상 칸 기본 비율(그림과 같게, 다르면 그 영상에만 style 로) | `--msi-part-figure-ratio` | `680 / 300` |
| 둥글기 배율 — 0 이면 네모, 1.5 면 더 둥글게(알약·동그라미는 그대로) | `--msi-shape-radius-k` | `1.35` |
| 기본 2px 모서리 | `--msi-shape-r2` | `calc(2px * var(--msi-shape-radius-k))` |
| 기본 4px 모서리 | `--msi-shape-r4` | `calc(4px * var(--msi-shape-radius-k))` |
| 기본 5px 모서리 | `--msi-shape-r5` | `calc(5px * var(--msi-shape-radius-k))` |
| 기본 6px 모서리 | `--msi-shape-r6` | `8px` |
| 기본 7px 모서리 | `--msi-shape-r7` | `calc(7px * var(--msi-shape-radius-k))` |
| 기본 8px 모서리 | `--msi-shape-r8` | `calc(8px * var(--msi-shape-radius-k))` |
| 기본 9px 모서리 | `--msi-shape-r9` | `12px` |
| 기본 10px 모서리 | `--msi-shape-r10` | `14px` |
| 기본 11px 모서리 | `--msi-shape-r11` | `14px` |
| 기본 12px 모서리 | `--msi-shape-r12` | `14px` |
| 기본 14px 모서리 | `--msi-shape-r14` | `18px` |
| 기본 16px 모서리 | `--msi-shape-r16` | `22px` |
| 기본 20px 모서리 | `--msi-shape-r20` | `calc(20px * var(--msi-shape-radius-k))` |
| 알약 버튼·칩(The Aurora Pill Rule) — 테마가 바꾸면 버튼이 알약이 아니게 됨 | `--msi-shape-r-pill` | `999px` |
| 가는 선 | `--msi-shape-bw1` | `1px` |
| 작은 칩·점선 구분선 | `--msi-shape-bw2` | `2px` |
| 카드·버튼·입력칸 기본 테두리 | `--msi-shape-bw3` | `3px` |
| 창·주제 카드 | `--msi-shape-bw4` | `3px` |
| 어긋난 그림자 거리 배율 — 0 이면 그림자 없음 | `--msi-shape-shadow-k` | `1` |
| 그림자 흐림 — 기본 0(The Zero-Blur Rule), 테마가 부드러운 그림자를 원할 때만 | `--msi-shape-shadow-blur` | `0px` |
| 기본 1px 어긋난 그림자의 위치·흐림(색은 rgba(var(--msi-rgb-ink),투명도)) | `--msi-shape-sh1` | `0 1px 2px` |
| 기본 2px 어긋난 그림자의 위치·흐림(색은 rgba(var(--msi-rgb-ink),투명도)) | `--msi-shape-sh2` | `0 2px 5px` |
| 기본 3px 어긋난 그림자의 위치·흐림(색은 rgba(var(--msi-rgb-ink),투명도)) | `--msi-shape-sh3` | `0 3px 8px` |
| 기본 4px 어긋난 그림자의 위치·흐림(색은 rgba(var(--msi-rgb-ink),투명도)) | `--msi-shape-sh4` | `0 4px 10px` |
| 기본 5px 어긋난 그림자의 위치·흐림(색은 rgba(var(--msi-rgb-ink),투명도)) | `--msi-shape-sh5` | `0 8px 20px` |
| 기본 6px 어긋난 그림자의 위치·흐림(색은 rgba(var(--msi-rgb-ink),투명도)) | `--msi-shape-sh6` | `0 10px 24px` |
| 기본 8px 어긋난 그림자의 위치·흐림(색은 rgba(var(--msi-rgb-ink),투명도)) | `--msi-shape-sh8` | `0 14px 34px` |
| 밤하늘 잉크(base-night-sky-ink #4b3b6b)의 R,G,B — 테마가 잉크 색을 바꾸면 같이 바꾼다 | `--msi-rgb-ink` | `74,59,50` |
