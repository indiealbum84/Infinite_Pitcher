# ⚾ 超特訓！無限ピッチング (Infinite Pitcher)

> **쇼와 레트로 아케이드 감성의 원터치 야구 피칭 액션 퍼즐 게임**  
> 전 세계 유저들과 실시간으로 경쟁하는 **글로벌 & 국가별 TOP 1000 랭킹**과 **세계 8인 실시간 온라인 배틀** 지원!

🎮 **[지금 바로 웹에서 플레이하기 (Live Game)](https://indiealbum84.github.io/Infinite_Pitcher/)**  
📖 **[게임 플레이 가이드 (User Guide)](https://indiealbum84.github.io/Infinite_Pitcher/guide.html)**

---

## 🌟 주요 게임 모드

1. **⚡ 세계 8인 배틀 (World 8-Player Battle)**
   * 전 세계 유저와 실시간으로 1개 방에 최대 8명까지 참가하는 스피드 피칭 배틀!
   * 20초 매칭 대기 시간 동안 실제 플레이어들이 우선 배정되며, 부족한 인원은 정교한 봇으로 자동 매칭됩니다.
   * 인게임 상단에 8명의 실시간 점수가 1줄 허드로 생중계되며, 내 번호는 하이라이트 박스로 표시됩니다.
2. **👤 나홀로 특훈 (Solo Practice Mode)**
   * 1번부터 무한대로 올라가는 숫자 블록을 향해 투구하는 개인 기록 갱신 모드.
   * 31번 파이어볼(세로 열 관통 폭파), 101번 미러볼(숫자 상하 반전), 201번 스트라이프볼, 301번 플래시볼 등 마구 기믹 등장!
3. **👥 친구와 특훈 (Friend Room Mode)**
   * 4자리 방 코드를 공유하여 친구와 1:1로 함께 즐기는 비공개 대전 모드.

---

## 📁 저장소 폴더 구조 (Project Structure)

```text
InfinitePitcher/
├── index.html                   # 🕹️ 게임 메인 엔진 (Canvas 렌더러 + 오디오 + Firebase 통신 올인원)
├── guide.html                   # 📖 사용자 플레이 가이드 웹페이지
├── manifest.json                # 📱 PWA / 모바일 웹 앱 설정 매니페스트
├── database.rules.json          # 🔒 Firebase Realtime Database 보안 규칙
├── README.md                    # 📄 저장소 개요 및 안내 문서
│
├── docs/                        # 📑 기획 및 디자인 문서 폴더
│   ├── GAME_DESIGN_DOCUMENT.md      # ⭐ 정식 게임 기획서 (GDD 마스터 문서)
│   ├── DESIGN_ORDER_SHEET.html      # 디자이너 발주용 리스트 (HTML 인터랙티브 뷰)
│   ├── DESIGN_ORDER_SHEET.csv       # 디자이너 발주용 리스트 (스프레드시트/엑셀용 CSV)
│   ├── GLOBAL_TOP50_UI_REFERENCE.html # 글로벌 Top 50 모바일 게임 UI 레퍼런스 (HTML 뷰)
│   ├── GLOBAL_TOP50_UI_REFERENCE.csv  # 글로벌 Top 50 모바일 게임 UI 레퍼런스 (CSV)
│   ├── PROJECT_HANDOVER.md          # 프로젝트 종합 인수인계 문서
│   ├── author.txt                   # 개발팀 정보
│   └── title.txt                    # 게임 공식 타이틀명
│
├── images/                      # 🎨 그래픽 및 스프라이트 이미지
│   ├── splash_108project.png        # 회사 로고 스플래시 화면
│   ├── main_background.png          # 메인 인트로 화면 배경
│   ├── title.png                    # 타이틀 로고 아트
│   ├── pitcher.png                  # 투수 준비 기본 자세 스프라이트
│   ├── pitcher_throw.png            # 투수 투구 동작 스프라이트
│   ├── cart.png                     # 야구공 볼 카트 스프라이트
│   ├── fireball.png                 # 파이어볼 이펙트 컷인
│   ├── mirrorball.png               # 미러볼 이펙트 컷인
│   ├── stripeball.png               # 스트라이프볼 이펙트 컷인
│   ├── flashball.png                # 플래시볼 이펙트 컷인
│   ├── top100.png                   # 랭킹 모달 호출 버튼 아이콘
│   ├── thumbnail.png                # 대표 썸네일 아이콘
│   └── splash.png                   # 레거시 타이틀 배경
│
└── sounds/                      # 🔊 BGM 및 사운드 효과음
    ├── bgm_title.mp3                # 메인 로비 BGM
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

## 🛠️ 기술 스택

* **Frontend**: HTML5, Canvas 2D API, Web Audio API, CSS3 Flex/Grid, Vanilla JavaScript (Zero Dependencies)
* **Backend / Database**: Firebase Realtime Database (실시간 멀티플레이어 배틀, 동기화 시드, 글로벌/국가별 TOP 1000 랭킹)
* **Hosting**: GitHub Pages (HTTPS 정적 호스팅)
