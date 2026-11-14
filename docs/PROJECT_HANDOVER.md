# ⚾ 超特訓！無限ピッチング (Infinite Pitcher) - 프로젝트 인계 및 마스터 가이드

> **이 문서는 Windows PC로 프로젝트를 이전하여 새로운 개발 환경 또는 AI 어시스턴트가 프로젝트의 전체 개요, 아키텍처, 지금까지 구현된 모든 기획/요구사항 및 히스토리를 한눈에 즉시 파악할 수 있도록 정리한 마스터 인계 문서입니다.**

---

## 📌 1. [Quick Start] 핵심 요약 (이것만 먼저 읽으세요!)

* **게임명**: 超特訓！無限ピッチング (Infinite Pitcher / 무한 피칭)
* **장르**: 80~90년대 레트로 쇼와 아케이드 감성의 아케이드 야구 배팅/피칭 순발력 넘버 퍼즐 게임
* **타겟 플랫폼**: 모바일 웹(HTML5) + 하이브리드 앱(Capacitor 기반 iOS / Android 글로벌 출시 예정)
* **기술 스택**: 
  * 프론트엔드: 순수 **HTML5 Canvas 2D + Vanilla JavaScript + CSS3** (외부 무거운 엔진 없이 `index.html` 단일 파일 올인원 구조)
  * 백엔드/서버: **Firebase Realtime Database (RTDB) + Firebase Auth** (무과금 실시간 동기화)
  * 해상도 기준: **1080 x 1920 (9:16 모바일 세로 풀 화면)**, Dynamic Visual Viewport & Safe-area Inset 대응
* **Git 원격 저장소**: `https://github.com/indiealbum84/Infinite_Pitcher.git` (기본 브랜치: `main`)

---

## 🎮 2. 게임 핵심 규칙 및 메카닉 (Core Gameplay)

1. **기본 룰 (Number Matching)**:
   * 야구장 타격대 위에 1행 10개의 번호 블록이 배치됩니다. (1~10, 11~20, 21~30 ... 무작위 셔플 배치)
   * 투수 캐릭터를 좌우로 드래그/이동하여 **현재 순서에 맞는 번호(1번부터 오름차순)**를 향해 공을 던집니다.
   * 올바른 번호의 블록을 맞히면 점수 +1 및 해당 블록 파괴, 블록들이 아래로 한 줄씩 스크롤 다운됩니다.
   * **잘못된 번호의 블록을 맞히거나 헛스윙하면 즉시 게임오버(Game Over)**됩니다.
2. **속도 및 난이도 가속화**:
   * 점수가 올라갈수록 공을 던지는 쿨다운 간격이 점진적으로 빨라집니다 (1000ms → 900ms → 800ms → 700ms → 600ms → 500ms → 400ms).
3. **특수 공 & 기믹 (Gimmick Balls)**:
   * **31번 공 (파이어볼 / Fireball)**:
     * 31번, 131번, 231번 등 `(n - 31) % 100 === 0` 지점에서 발동.
     * 불꽃 연출과 함께 해당 열의 세로 블록 전체를 일렬로 관통 파괴!
   * **94점 도달 시 & 101번 공 (미러볼 / Mirrorball)**:
     * 101번대 진입 시 웨이브 연출과 함께 화면에 보이는 **모든 숫자의 좌우 자릿수가 반전**되어 표시 (예: 105 → 501, 107 → 701).
   * **201번 공 (스트라이프볼 / Stripeball)**:
     * 줄무늬 야구공. 10줄 단위로 정상 숫자 줄과 거울 반전 줄이 번갈아 교차 배치되는 극한의 집중력 기믹.
   * **301번 공 (플래시볼 / Flashball)**:
     * 번개 연출과 함께 숫자가 깜빡이며 보였다 안 보였다 하는 블라인드 기믹.

---

## 💬 3. 지금까지 나눈 대화 및 주요 기획 요구사항 반영 내역

사용자와 집중적으로 논의하여 최종 구현 및 검증 완료된 핵심 기능들입니다.

### ① 게임 최초 시작 시 영구 닉네임 등록 & 전 세계 욕설/금칙어 자동 차단
* **기획 배경**: 기존에는 게임오버 후에 매번 닉네임을 입력하여 등록하는 방식이었으나, 최초 게임 실행 시 1번만 자신의 게임 이름을 정하도록 변경.
* **이름 변경 불가 경고**:
  * 한 번 등록된 이름은 **절대 변경할 수 없음**을 등록 화면 및 confirm 창에서 강력 경고(`⚠️ 한 번 등록한 이름은 절대 바꿀 수 없으니 신중하게 선택해주세요!`).
  * 서버(`ranks`, `ranks_country`, `users`)에 해당 이름으로 영구 바인딩.
* **글로벌 다국어 금칙어 실시간 자동 차단 (`FORBIDDEN_SUBSTRINGS`)**:
  * 한국어, 영어, 일본어뿐 아니라 **스페인어, 프랑스어, 독일어, 포르투갈어, 러시아어, 중국어(간체/번체), 이탈리아어, 베트남어, 인도네시아/말레이어, 튀르키예어, 힌디어, 아랍어, 태국어** 등 전 세계 주요 언어권의 욕설, 비속어, 성적 비하, 혐오 표현, 운영자 사칭 단어를 실시간 차단.
  * **우회 차단 알고리즘**:
    * **유니코드 NFD 정규화**: 악센트/다이어크리틱 분리 제거 (`fúck` → `fuck`, `pútá` → `puta`, `scheiße` → `scheisse`).
    * **리트스피크(Leet) 치환**: `sh1t`, `b!tch`, `c0ck`, `f@ck` 등 숫자/기호 치환 자동 복원 검사.
    * **구분자 압축**: `f_u_c_k`, `s.h.i.t`, `p-u-t-a` 등 공백/언더바/하이픈 끼워넣기 자동 적발.
    * **연속 문자 압축**: `fuuuuck`, `shiiit` 등 중복 타이핑 우회 차단.
    * 타이핑 즉시 안전하지 않은 글자는 직전 글자로 자동 롤백되며 빨간 경고 표시.

### ② 리더보드 (유저당 단 1개의 최고 점수만 서버 유지)
* **원칙**: 한 플레이어가 여러 번 플레이해도 랭킹 보드에 이름이 중복으로 도배되지 않고, **자신의 역대 최고 점수(Personal Best) 단 1개만 서버에 등록/유지**.
* **동작 방식**:
  * 게임이 끝나면 처음에 등록한 내 이름으로 내 기존 최고 기록과 비교(`newScore > bestScore`).
  * 최고 기록을 경신했을 때만 Firebase(`ranks/{accountKey}`, `ranks_country/{country}/{accountKey}`)에 자동 업데이트.
  * 기존 기록보다 낮으면 서버 데이터를 덮어쓰지 않고 기존 최고 점수 유지.
  * 글로벌 TOP 1000 및 접속 국가(IP 기반 자동 감지) TOP 1000 탭 제공.

### ③ 수익화 & 무료 플레이 티켓 시스템 (31번 파이어볼 언락 룰)
* **개인 모드 (Solo Mode)**:
  * 31번 파이어볼을 넘어서기 전(초보 구간)에는 **무제한 무료 플레이**.
  * 31번 파이어볼을 돌파하는 순간: 축하 팝업 모달 출력 ("축하합니다! 파이어볼 컨텐츠를 언락하셨습니다").
  * 언락된 이후부터는 **하루 무료 3판** 제공 (UTC 00:00 기준 리셋).
  * 무료 3판 소진 후: **광고 1회 시청 후 1판 플레이** 또는 **$4.99 광고 제거 패스** 구매 유도 링크/버튼 제공.
* **온라인 대전 모드 (Battle Mode)**:
  * 무제한 모드 없이 **하루 기본 무료 3판**.
  * 무료 3판 소진 후에는 광고를 봐야 대전 입장 가능.
* **$4.99 광고 없애기 (No Ads Pass)**:
  * 구매 시 개인 모드 및 온라인 대전 모드 모두 평생 광고 없이 무제한 플레이.

### ④ 온라인 멀티 대전 모드 (최대 8인 실시간 배틀로얄)
* **입장 간소화**: 메인화면에서 [대전] 버튼을 누르면 별도 닉네임 입력 없이 **처음에 등록한 영구 닉네임으로 즉시 로비/빠른 매칭 화면으로 진입**.
* **빠른 매칭 (Quick Match)**:
  * 7초간 공개 대기방을 탐색/호스팅.
  * 7초 내 실제 유저가 부족할 경우 **AI 챌린저 봇(1~3명)이 자동 합류**하여 매칭 지연 없이 바로 게임 시작.
* **친구 초대 코드 대전**: 4자리 숫자 방 코드로 특정 친구들끼리 매칭 가능.
* **서바이벌 룰**:
  * 8명이 동시에 플레이하다가 탈락자가 발생하며, **2등 플레이어가 게임오버되는 순간 1등이 확정되며 게임 즉시 종료**.
  * 내가 먼저 죽었을 경우: 결과를 보고 즉시 퇴장하거나, 남아있는 다른 사람들의 경기를 끝까지 라이브 관전 가능.
  * 모든 경기가 끝나면 최종 순위 결과 화면 표시 후 **5초 카운트다운 뒤 방이 자동 폭파/정리**.
* **대전 전적 기록**: 총 플레이 판수와 1위(우승) 횟수가 프로필과 대전 로비 캡슐에 영구 기록(`🏆 12판 | 🥇 1위: 4회`).

### ⑤ Google ID / Apple ID 클라우드 연동 및 재설치 복원
* **기획 배경**: 같은 구글/애플 아이디로 플레이하거나 결제한 유저는 앱을 지웠다가 다시 설치해도 본인 이름과 기록이 유지되어야 함.
* **동작 방식**:
  * 인트로 화면 및 프로필 화면에서 Google ID / Apple ID 연동 지원.
  * 재설치 후 동일 ID로 연동 또는 [구매 복원] 클릭 시 Firebase `users/{accountKey}`에서:
    * **영구 등록 닉네임**
    * **개인 최고 점수 (Personal Best)**
    * **대전 전적 (총 매치 수, 1등 횟수)**
    * **31번 파이어볼 언락 상태**
    * **$4.99 광고 제거 패스 구매 상태**
    전부 그대로 불러와 로컬에 복원.

### ⑥ 회사 로고 스플래시 화면 (108 Project)
* 앱 시작 시 최우선 화면으로 `splash_108project.png` (2160x3840 레티나 풀스크린)가 3초간 표시.
* 3초 카운트 후 부드러운 페이드아웃으로 메인화면(`intro-screen`)으로 자동 전환.
* 기다리기 싫은 유저를 위해 **화면 탭 시 즉시 스킵** 지원.

### ⑦ 디자이너 발주서 & 글로벌 Top 50 게임 UI 분석 레퍼런스
* **`DESIGN_ORDER_SHEET.html` / `.csv`**:
  * Part A: 디자이너 교체용 기존 스프라이트 20종 목록 (배경, 캐릭터, 공, UI 등)
  * Part B: 캔버스 코드로 그려진 그래픽 9종 (야구장 필드, 넘버 블록, 파이어볼 불꽃 효과, 미러볼 등)
* **`GLOBAL_TOP50_UI_REFERENCE.html` / `.csv`**:
  * 글로벌 매출 1~50위 모바일 게임들의 UI 레이아웃, 컬러 팔레트, 배경화면 트렌드 분석 보고서.

---

## 📂 4. 프로젝트 파일 구조 및 소스코드 맵

```text
InfinitePitcher/
├── index.html                   # ⭐ 핵심 메인 파일 (HTML + CSS + Canvas 게임 엔진 + Firebase 올인원)
├── database.rules.json          # Firebase Realtime Database 보안 규칙 (점수 갱신/계정 보호)
├── manifest.json                # PWA 및 모바일 웹 앱 설정 매니페스트
├── guide.html                   # 게임 가이드/소개 웹페이지
├── README.md                    # 저장소 개요 및 실행 안내 문서
│
├── docs/                        # 📑 기획 및 디자인 문서 폴더
│   ├── GAME_DESIGN_DOCUMENT.md      # ⭐ 정식 게임 기획서 (GDD)
│   ├── DESIGN_ORDER_SHEET.html      # 디자이너 발주용 리스트 (HTML 인터랙티브 뷰)
│   ├── DESIGN_ORDER_SHEET.csv       # 디자이너 발주용 리스트 (스프레드시트/엑셀용 CSV)
│   ├── GLOBAL_TOP50_UI_REFERENCE.html # 글로벌 Top 50 모바일 게임 UI 레퍼런스 (HTML 뷰)
│   ├── GLOBAL_TOP50_UI_REFERENCE.csv  # 글로벌 Top 50 모바일 게임 UI 레퍼런스 (CSV)
│   ├── PROJECT_HANDOVER.md          # 프로젝트 종합 인수인계 문서
│   ├── author.txt                   # 제작자 메타 정보
│   └── title.txt                    # 게임 공식 타이틀 텍스트
│
├── images/                      # 🎨 그래픽 및 스프라이트 이미지 폴더
│   ├── splash_108project.png        # 🏢 회사 로고 스플래시 화면 (2160x3840)
│   ├── title.png                    # 타이틀 로고 아트
│   ├── main_background.png          # 메인 인트로 화면 배경
│   ├── pitcher.png                  # 투수 기본 대기 스프라이트
│   ├── pitcher_throw.png            # 투수 투구 동작 스프라이트
│   ├── cart.png                     # 야구공 볼 카트 스프라이트
│   ├── fireball.png                 # 파이어볼 이펙트 아트
│   ├── mirrorball.png               # 미러볼 이펙트 아트
│   ├── stripeball.png               # 스트라이프볼 이펙트 아트
│   ├── flashball.png                # 플래시볼 이펙트 아트
│   ├── top100.png                   # 랭킹 모달 호출 버튼 아이콘
│   ├── thumbnail.png                # 앱 썸네일 아이콘
│   └── splash.png                   # 레거시 타이틀 배경
│
└── sounds/                      # 🔊 BGM 및 사운드 효과음 폴더
    ├── bgm_title.mp3                # 인트로 / 메인 로비 BGM
    ├── bgm_game.wav                 # 인게임 플레이 BGM (Web Audio 무손실 루프)
    ├── throw.mp3                    # 일반 투구 SFX
    ├── throw_hit.mp3                # 블록 명중 타격 SFX
    ├── throw_fireball.mp3           # 파이어볼 투구 SFX
    ├── fireball.mp3                 # 파이어볼 관통 폭발 SFX
    ├── throw_mirrorball.mp3         # 미러볼 투구 SFX
    ├── mirrorball.mp3               # 숫자 반전 발동 SFX
    ├── stripeball.mp3               # 스트라이프볼 발동 SFX
    ├── flashball.mp3                # 플래시볼 발동 SFX
    ├── click.mp3                    # 버튼 클릭 SFX
    ├── win.mp3                      # 대전 1위 / 승리 SFX
    └── gameover.mp3                 # 탈락 / 게임오버 SFX
```

---

## 🗄️ 5. Firebase Realtime Database 구조 및 보안 규칙

### 데이터베이스 노드 구조:
* `/ranks/{accountKey}`: 글로벌 랭킹 (계정당 최고 점수 1개만 저장)
* `/ranks_country/{countryCode}/{accountKey}`: 국가별 랭킹 (계정당 최고 점수 1개만 저장)
* `/users/{accountKey}`: 유저 프로필 및 계정 클라우드 동기화 정보 (이름, 최고점수, 대전전적, 31번 파이어볼 언락 여부, $4.99 구매 여부)
* `/battles/{roomId}`: 실시간 8인 멀티플레이 대전 방 (방 상태, 참가 플레이어 목록, 실시간 점수, AI 봇)

### `database.rules.json` 핵심 요약:
* 점수 등록 시 기존 점수보다 높은 경우(`newData.val() > data.val()`)에만 덮어쓰기 허용.
* 이름은 한 번 등록되면 변경 불가(`newData.child('name').val() === data.child('name').val()`).
* 최소 투구 시간 안티치트 서명(`sig`) 검증 규칙 포함.

---

## 💻 6. Windows PC 이전 및 실행 가이드

### 1) 저장소 클론 (Clone)
Windows PC의 터미널(Git Bash, PowerShell, 또는 명령 프롬프트)에서:
```bash
git clone https://github.com/indiealbum84/Infinite_Pitcher.git
cd Infinite_Pitcher
```

### 2) 로컬 실행 및 테스트 방법
브라우저 보안 정책(CORS 및 Web Audio 로컬 파일 제한)으로 인해 `index.html`을 파일 더블클릭(`file:///`)으로 여는 것보다 **로컬 HTTP 서버로 실행**하는 것이 좋습니다.

* **방법 A: VS Code Live Server 확장 프로그램 (가장 추천)**
  * VS Code에서 `Infinite_Pitcher` 폴더를 열고 `Live Server` 확장을 설치한 뒤, 우측 하단 `Go Live` 클릭.
* **방법 B: Node.js `npx serve`**
  ```bash
  npx serve .
  # 또는
  npx http-server -p 8080
  ```
* **방법 C: Python 로컬 서버**
  ```bash
  python -m http.server 8080
  ```
  브라우저에서 `http://localhost:8080` 접속.

### 3) Windows 환경 작업 시 주의사항
* **Git 줄바꿈(CRLF vs LF)**: Windows 환경에서는 Git checkout 시 CRLF로 자동 변환될 수 있으므로 필요 시 `git config core.autocrlf false` 설정 권장.
* **Capacitor 모바일 빌드**: 향후 Android APK 빌드 시 Windows에 **Android Studio** 및 JDK를 설치하고 `npx cap add android` -> `npx cap open android`로 진행.

---

## 🚀 7. 향후 예정된 작업 (Next Steps / Roadmap)

1. **디자이너 에셋 교체**:
   * 디자이너에게 전달한 `DESIGN_ORDER_SHEET`에 따라 새로 제작된 고품질 캐릭터, 타이틀, 블록, 이펙트 스프라이트로 교체.
2. **모바일 네이티브 스토어 결제 & 광고 연동 (Capacitor Plugins)**:
   * Google Play Billing / Apple StoreKit IAP ($4.99 광고 제거 연동)
   * Google AdMob (보상형 광고 Rewarded Ad 연동)
3. **스토어 빌드 및 배포**:
   * Google Play Console 및 Apple App Store Connect 등록 및 심사 제출.

---
*최종 업데이트: 2026-11-10*
*작성자: Antigravity Assistant (Infinite Pitcher Project)*
