'use strict';

const scenarios = {
  new: { name: '', best: 0, rating: 1000, wins: 0 },
  rookie: { name: '유나', best: 24, rating: 1000, wins: 0 },
  standard: { name: '유나', best: 128, rating: 1140, wins: 5 },
  master: { name: '유나', best: 268, rating: 1260, wins: 12 }
};

const skins = [
  ['⚾', '클래식 쇼와', '기본 지급', () => true],
  ['🌱', '루키 에메랄드', '8인 배틀 첫 승', player => player.wins >= 1],
  ['☀', '선셋 레트로', '8인 배틀 10승', player => player.wins >= 10],
  ['🔥', '골든 프레임', '하루 배틀 50판', () => false],
  ['⚡', '블루 스파크', '8인 배틀 100승', player => player.wins >= 100],
  ['🌸', '사쿠라 블룸', '나홀로 특훈 200점', player => player.best >= 200],
  ['♕', '황제 크라운', '나홀로 특훈 500점', player => player.best >= 500],
  ['🌈', '쇼와 레인보우', '8인 배틀 5연승', () => false],
  ['🌌', '더블 레인보우', '8인 배틀 10연승', () => false],
  ['◇', '다이아 프리즘', '마스터 리그 1,500 PT', player => player.rating >= 1500]
];

const languages = [
  ['ko', '한국어'],
  ['ja', '日本語'],
  ['en', 'English'],
  ['zh-TW', '繁體中文'],
  ['es', 'Español']
];

const display = document.getElementById('screen');
const device = document.querySelector('.device');
const dock = document.querySelector('.dock');
const format = new Intl.NumberFormat('ko-KR');
const WORLD_UNLOCK_SCORE = 31;
const MATCH_SECONDS = 20;
let player = { ...scenarios.standard };
let activeScenario = 'standard';
let page = 'home';
let matchTimer;
let rankMode = 'world';
let rankScope = 'global';
let equippedIndex = 0;
let language = 'ko';
const volume = { bgm: 80, sfx: 80 };

const league = () => player.rating > 1200 ? '마스터 리그' : '일반 리그';
const canEnterWorld = () => player.best >= WORLD_UNLOCK_SCORE;

function panel(title, body, back = 'home', subtitle = '') {
  const backButton = back ? `<button class="back" type="button" data-go="${back}">← 이전</button>` : '';
  const heading = subtitle ? `<p class="hint">${subtitle}</p>` : '';
  return `<section class="screen-panel">${backButton}<h2 tabindex="-1">${title}</h2>${heading}${body}</section>`;
}

function action(label, route, style = 'cta', disabled = false) {
  return `<button class="${style}" type="button" data-go="${route}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

function mode(name, detail, route, style = '') {
  return `<button class="mode ${style}" type="button" data-go="${route}">
    <span><b>${name}</b><small>${detail}</small></span><span class="arrow" aria-hidden="true">→</span>
  </button>`;
}

function buttons(items, group, current) {
  return items.map(([value, name]) =>
    `<button type="button" class="tab" data-${group}="${value}" aria-pressed="${value === current}">${name}</button>`
  ).join('');
}

function home() {
  const world = mode('세계 8인 배틀', league(), 'world', 'primary');
  const solo = mode('나홀로 특훈', '개인 최고 기록에 도전', 'solo', canEnterWorld() ? '' : 'primary');
  const friends = mode('친구와 특훈', '4자리 초대 코드', 'friend');
  const locked = mode('세계 8인 배틀 · 잠김', `솔로 최고 ${player.best} / ${WORLD_UNLOCK_SCORE}점`, 'unlock', 'locked');
  const actions = canEnterWorld() ? `${world}<div class="duo">${solo}${friends}</div>` : `${solo}${locked}${friends}`;
  const rating = canEnterWorld() ? format.format(player.rating) : '—';

  return `<section aria-label="홈">
    <div class="cover">
      <img src="assets/home-hero.webp" alt="방과 후 야구부 투수가 야구공을 들어 투구를 준비하는 모습" fetchpriority="high">
      <h2 tabindex="-1"><small>超特訓！無限ピッチング</small>무한 피칭</h2>
    </div>
    <div class="home-content">
      <div class="profile">
        <div><small>선수</small><strong data-player-name></strong></div>
        <div><small>솔로 최고</small><strong class="number">${format.format(player.best)}</strong></div>
        <div><small>배틀 PT</small><strong class="number">${rating}</strong></div>
      </div>
      <div class="actions">${actions}</div>
    </div>
  </section>`;
}

function seats(filled = false) {
  const entries = Array.from({ length: 8 }, (_, i) => {
    if (i === 0) return '<li class="occupied">나</li>';
    if (filled) return `<li class="occupied">봇 ${i}</li>`;
    return '<li>빈 자리</li>';
  });
  return `<ol class="seats" aria-label="참가 슬롯">${entries.join('')}</ol>`;
}

function rankings() {
  const isWorld = rankMode === 'world';
  const isGlobal = rankScope === 'global';
  const pool = isGlobal ? ['미오', '샘', '루이'] : ['서진', '하린', '이안'];
  const scores = isWorld ? [1620, 1495, 1310] : [302, 284, 271];
  const unit = isWorld ? ' PT' : '점';
  const rows = pool.map((name, index) =>
    `<li><span>${index + 1}</span><strong>${name}</strong><span class="number">${format.format(scores[index])}${unit}</span></li>`
  ).join('');
  const showOwn = isWorld ? canEnterWorld() : player.best > 0;
  const ownStat = isWorld ? player.rating : player.best;
  const own = showOwn
    ? `<p class="status">내 기록 · ${format.format(ownStat)}${unit}</p>`
    : '<p class="hint">아직 등록된 내 기록이 없습니다.</p>';

  return panel('TOP 1000', `
    <div class="tabs" role="group" aria-label="랭킹 종류">${buttons([['world', '8인 배틀'], ['solo', '나홀로 특훈']], 'rank-mode', rankMode)}</div>
    <div class="tabs" role="group" aria-label="랭킹 범위">${buttons([['global', '세계'], ['country', '국가']], 'rank-scope', rankScope)}</div>
    <ol class="rank-list">${rows}</ol>${own}`, null);
}

function collection() {
  const cards = skins.map(([icon, name, rule, isUnlocked], index) => {
    const unlocked = isUnlocked(player);
    const equipped = equippedIndex === index;
    return `<div class="paper-card"><h3><span class="swatch" aria-hidden="true">${icon}</span>${name}</h3>
      <p class="hint">${rule}</p>
      <button class="plain" type="button" data-equip="${index}" ${!unlocked || equipped ? 'disabled' : ''}>${equipped ? '장착 중' : unlocked ? '장착' : '잠김'}</button></div>`;
  }).join('');
  return panel('컬렉션', cards, null, '업적으로 볼 궤적과 투수 효과를 모아요.');
}

function settings() {
  const options = languages.map(([key, name]) =>
    `<option value="${key}" ${language === key ? 'selected' : ''}>${name}</option>`
  ).join('');
  return panel('설정', `
    <label class="field">언어<select id="language">${options}</select></label>
    <p class="hint">선택은 이 탭에서 유지됩니다. 시안 문구는 한국어로 표시됩니다.</p>
    <label class="field">배경음악 <output id="bgm-value">${volume.bgm}%</output><input type="range" id="bgm" min="0" max="100" value="${volume.bgm}"></label>
    <label class="field">효과음 <output id="sfx-value">${volume.sfx}%</output><input type="range" id="sfx" min="0" max="100" value="${volume.sfx}"></label>
    <div class="paper-card"><h3>계정 연동</h3><p class="hint">미연동 · 실제 로그인은 게임에서 진행합니다.</p>
      <button class="plain" type="button" data-account>Google 로그인</button>
      <button class="plain" type="button" data-account>Apple 로그인</button>
    </div>
    <p class="status" id="notice" role="status"></p>`);
}

const renderers = {
  splash: () => `
    <section class="opening" aria-labelledby="opening-title">
      <img class="opening-art" src="assets/opening-fullshot.webp" alt="방과 후 야구장 마운드에 선 어린 투수의 전신" fetchpriority="high">
      <h2 id="opening-title" tabindex="-1"><small>超特訓！無限ピッチング</small>무한 피칭</h2>
      ${action('시작하기', 'language')}
    </section>`,
  language: () => panel('언어 선택', `<div class="language-list">${languages.map(([key, label]) => `<button class="plain" type="button" data-language="${key}">${label}</button>`).join('')}</div>`, 'splash'),
  name: () => panel('선수 이름 등록', `
    <form class="form" id="name-form">
      <label class="field">선수 이름<input name="playerName" maxlength="10" autocomplete="off" required></label>
      <p class="hint">한글·일본어 5자 또는 영문 10자까지. 등록하면 바꿀 수 없어요.</p>
      <p class="error" role="alert"></p><button class="cta" type="submit">이 이름으로 시작</button>
    </form>
    <div class="paper-card"><h3>기존 기록 복원</h3>
      <button class="plain" type="button" data-account>Google로 복원</button>
      <button class="plain" type="button" data-account>Apple로 복원</button>
    </div><p class="status" id="notice" role="status"></p>`, 'language'),
  home,
  unlock: () => panel('세계 8인 배틀 해금', `
    <div class="paper-card ticket"><strong class="number">${player.best} / ${WORLD_UNLOCK_SCORE}</strong>
      <progress class="progress" value="${player.best}" max="${WORLD_UNLOCK_SCORE}" aria-label="세계 배틀 해금 진행률"></progress>
      <p>솔로 최고 기록이 31점에 도달하면 열려요.</p>
    </div>${action('나홀로 특훈', 'solo')}`),
  solo: () => panel('나홀로 특훈', `
    <div class="paper-card ticket"><span>개인 최고</span><strong class="number">${format.format(player.best)}점</strong></div>
    <p>투수를 좌우로 움직여 자동으로 던지는 공을 숫자 순서대로 맞혀요.</p>
    ${action('훈련 화면 보기', 'training')}`),
  training: () => panel('훈련 화면', `
    <div class="paper-card"><p class="status">점수 0 · 다음 목표 1</p>
      <div class="score-board" aria-label="숫자 블록 예시">${[8, 4, 6, 1, 9, 7, 3, 2, 10, 5].map(n => `<span ${n === 1 ? 'class="target"' : ''}>${n}</span>`).join('')}</div>
      <div class="venue day" role="img" aria-label="낮 훈련장 일러스트"></div>
      <p class="hint">목표 블록은 색과 굵은 윤곽선으로 표시해요.</p>
    </div>${action('솔로 결과 시안 보기', 'solo-result')}`, 'solo'),
  'solo-result': () => panel('훈련 종료', `
    <div class="paper-card ticket"><span>이번 기록</span><strong class="number">24점</strong><span>개인 최고 ${Math.max(24, player.best)}점</span></div>
    ${action('다시 도전', 'solo')}${action('랭킹 보기', 'ranking', 'plain')}`),
  world: () => panel('세계 8인 배틀', `
    <div class="venue night" role="img" aria-label="조명이 켜진 야간 경기장 일러스트"></div>
    <div class="paper-card ticket"><span>${league()}</span><strong class="number">${format.format(player.rating)} PT</strong><span>누적 우승 ${player.wins}회</span></div>
    <p class="hint">최대 20초 동안 선수를 찾아요. 자리가 남으면 봇이 합류합니다.</p>
    ${action('빠른 매칭', 'matching')}`),
  matching: () => panel('선수를 찾는 중', `
    <div class="paper-card"><strong class="number" id="timer">${MATCH_SECONDS}초</strong>
      <p class="status" id="match-status" role="status">실제 선수 1 / 8명</p>
      ${seats()}
    </div>${action('매칭 취소', 'world', 'plain')}`, null),
  'match-ready': () => panel('8명 준비 완료', `
    <div class="paper-card"><p class="status">실제 선수 1명 · 봇 7명</p>${seats(true)}</div>
    ${action('배틀 결과 시안 보기', 'battle-result')}`, 'world'),
  'battle-result': () => panel('배틀 결과', `
    <div class="paper-card ticket"><span>최종 순위</span><strong class="number">2위 · +10 PT</strong><span>${format.format(player.rating)} → ${format.format(player.rating + 10)} PT</span></div>
    <ol class="rank-list"><li><span>1</span><strong>봇 3</strong><span>82점</span></li><li class="own"><span>2</span><strong data-player-name></strong><span>79점</span></li><li><span>3</span><strong>봇 1</strong><span>63점</span></li></ol>
    ${action('다시 매칭', 'matching')}${action('홈으로', 'home', 'plain')}`),
  friend: () => panel('친구와 특훈', `
    ${action('방 만들기', 'friend-host')}
    <form class="form" id="friend-form">
      <label class="field">초대 코드<input name="roomCode" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" placeholder="0000" required></label>
      <p class="error" role="alert"></p><button class="plain" type="submit">코드로 참가</button>
    </form><p class="hint">시안용 참가 코드는 2741입니다.</p>`),
  'friend-host': () => panel('친구 초대', `
    <div class="paper-card ticket"><span>내 방 코드</span><strong class="number">2741</strong><span>친구를 기다리는 중 · 1 / 8명</span></div>
    ${action('경기 시작', 'friend-joined', 'cta', true)}${action('방 나가기', 'friend', 'plain')}`, 'friend'),
  'friend-joined': () => panel('초대방 대기실', `
    <div class="paper-card"><p class="status">코드 2741 · 2 / 8명</p><p>방장이 경기를 시작하면 자동으로 입장해요.</p></div>
    ${action('방 나가기', 'friend', 'plain')}`, 'friend'),
  ranking: rankings,
  collection,
  settings
};

function startMatching() {
  const deadline = performance.now() + MATCH_SECONDS * 1000;
  matchTimer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    if (remaining === 0) {
      navigate('match-ready');
      return;
    }
    display.querySelector('#timer').textContent = `${remaining}초`;
  }, 250);
}

function navigate(next, focus = true) {
  clearInterval(matchTimer);
  page = next === 'world' && !canEnterWorld() ? 'unlock' : next;
  display.innerHTML = renderers[page]();
  display.querySelectorAll('[data-player-name]').forEach(element => { element.textContent = player.name; });
  const onboarding = ['splash', 'language', 'name'].includes(page);
  dock.hidden = onboarding;
  device.querySelector('.masthead').hidden = onboarding;
  dock.querySelectorAll('[data-go]').forEach(button => {
    if (button.dataset.go === page) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (page === 'matching') startMatching();
  if (focus) display.querySelector('h2').focus();
}

function chooseScenario(key) {
  activeScenario = key;
  player = { ...scenarios[activeScenario] };
  equippedIndex = 0;
  document.querySelectorAll('[data-scenario]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.scenario === activeScenario));
  });
  navigate(key === 'new' ? 'splash' : 'home');
}

function updateRankFilter(key, value) {
  if (key === 'rankMode') rankMode = value;
  else rankScope = value;
  navigate('ranking', false);
  const group = key === 'rankMode' ? 'rank-mode' : 'rank-scope';
  display.querySelector(`[data-${group}="${value}"]`).focus();
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const { scenario, go, language: selectedLanguage, rankMode: modeFilter, rankScope: scopeFilter, equip } = button.dataset;
  if (scenario) chooseScenario(scenario);
  else if (go) navigate(go);
  else if (selectedLanguage) {
    language = selectedLanguage;
    navigate('name');
  } else if (modeFilter) updateRankFilter('rankMode', modeFilter);
  else if (scopeFilter) updateRankFilter('rankScope', scopeFilter);
  else if (equip !== undefined) {
    equippedIndex = Number(equip);
    navigate('collection');
  } else if (button.hasAttribute('data-account')) {
    display.querySelector('#notice').textContent = '이 시안에서는 계정에 연결하지 않습니다.';
  }
});

display.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  if (form.id === 'name-form') {
    const name = String(data.get('playerName')).trim();
    const weight = [...name].reduce((sum, letter) => sum + (/^[\x20-\x7E]$/.test(letter) ? 1 : 2), 0);
    if (!name || weight > 10) {
      form.querySelector('.error').textContent = '이름을 확인해 주세요. 한글·일본어는 5자, 영문은 10자까지 가능해요.';
      return;
    }
    player.name = name;
    navigate('home');
  } else if (data.get('roomCode') === '2741') {
    navigate('friend-joined');
  } else {
    form.querySelector('.error').textContent = '방을 찾지 못했어요. 코드를 다시 확인해 주세요.';
  }
});

display.addEventListener('change', event => {
  if (event.target.id === 'language') language = event.target.value;
});

display.addEventListener('input', event => {
  const { id, value } = event.target;
  if (id === 'bgm' || id === 'sfx') {
    volume[id] = Number(value);
    display.querySelector(`#${id}-value`).textContent = `${value}%`;
  }
});

if (new URLSearchParams(location.search).get('preview') === 'opening') {
  chooseScenario('new');
} else {
  navigate('home', false);
}
