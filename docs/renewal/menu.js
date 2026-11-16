'use strict';

const scenarios = {
  new: { name: '', best: 0, rating: 1000, wins: 0 },
  rookie: { name: 'ユナ', best: 24, rating: 1000, wins: 0 },
  standard: { name: 'ユナ', best: 128, rating: 1140, wins: 5 },
  master: { name: 'ユナ', best: 268, rating: 1260, wins: 12 }
};

const skins = [
  ['⚾', 'クラシック昭和', '初期装備', () => true],
  ['🌱', 'ルーキーエメラルド', '8人バトルで初勝利', player => player.wins >= 1],
  ['☀', 'サンセットレトロ', '8人バトルで10勝', player => player.wins >= 10],
  ['🔥', 'ゴールデンフレーム', '1日でバトル50回', () => false],
  ['⚡', 'ブルースパーク', '8人バトルで100勝', player => player.wins >= 100],
  ['🌸', 'サクラブルーム', 'ひとり特訓で200点', player => player.best >= 200],
  ['♕', 'エンペラークラウン', 'ひとり特訓で500点', player => player.best >= 500],
  ['🌈', '昭和レインボー', '8人バトルで5連勝', () => false],
  ['🌌', 'ダブルレインボー', '8人バトルで10連勝', () => false],
  ['◇', 'ダイヤプリズム', 'マスターリーグ 1,500 PT', player => player.rating >= 1500]
];

const languages = [
  ['ko', '한국어'],
  ['ja', '日本語'],
  ['en', 'English'],
  ['zh-TW', '繁體中文'],
  ['es', 'Español']
];

const display = document.getElementById('screen');
const masthead = document.querySelector('.masthead');
const format = new Intl.NumberFormat('ja-JP');
const WORLD_UNLOCK_SCORE = 31;
const MATCH_SECONDS = 20;
const PITCH_DURATION_MS = 1480; // Total frame duration of title-pitch.gif.
const title = '<span>インフィニティ</span><span>ピッチング</span>';
let player = { ...scenarios.new };
let page;
let matchTimer;
let pitchTimer;
let pitchRun = 0;
let requestedMode = 'home';
let rankMode = 'world';
let rankScope = 'global';
let equippedIndex = 0;
let language = 'ja';
const volume = { bgm: 80, sfx: 80 };

const league = () => player.rating > 1200 ? 'マスターリーグ' : '一般リーグ';
const canEnterWorld = () => player.best >= WORLD_UNLOCK_SCORE;

function panel(title, body, back = 'home', subtitle = '') {
  const backButton = back ? `<button class="back" type="button" data-go="${back}">← 戻る</button>` : '';
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
  const unlocked = canEnterWorld();
  const world = mode('世界8人バトル', league(), 'world', 'primary');
  const solo = mode('ひとり特訓', '自己ベストに挑戦', 'solo', unlocked ? '' : 'primary');
  const friends = mode('フレンド特訓', '4桁の招待コード', 'friend');
  const locked = mode('世界8人バトル', `未解放 · ${player.best} / ${WORLD_UNLOCK_SCORE}点`, 'unlock', 'locked');
  const actions = unlocked
    ? `${world}<div class="duo">${solo}${friends}</div>`
    : `${solo}<div class="duo">${locked}${friends}</div>`;
  const rating = unlocked ? format.format(player.rating) : '—';

  return `<section class="portrait-scene lobby" aria-label="メインメニュー">
    <img class="scene-art" src="assets/title-pitch-finish.webp" alt="ピッチャーが投げたボールが手前に迫る場面" fetchpriority="high">
    <nav class="corner-menu" aria-label="サブメニュー">
      ${action('TOP 1000', 'ranking', 'corner-button rank-button')}
      <div class="corner-group">
        <button class="corner-button" type="button" data-go="collection" aria-label="コレクション" title="コレクション"><span aria-hidden="true">✦</span></button>
        <button class="corner-button" type="button" data-go="settings" aria-label="設定" title="設定"><span aria-hidden="true">⚙</span></button>
      </div>
    </nav>
    <h2 class="game-title" tabindex="-1">${title}</h2>
    <div class="lobby-middle">
      <p class="speech-bubble">よしっ！世界一のピッチャーになるために、<br>今日も特訓だ！</p>
    </div>
    <div class="home-content" aria-label="プレイメニュー">
      <div class="profile">
        <div><small>選手</small><strong data-player-name></strong></div>
        <div><small>自己ベスト</small><strong class="number">${format.format(player.best)}</strong></div>
        <div><small>バトルPT</small><strong class="number">${rating}</strong></div>
      </div>
      <div class="actions">${actions}</div>
      ${action('プレイ・購入情報', 'play-info', 'play-info-button')}
    </div>
  </section>`;
}

function seats(filled = false) {
  const entries = Array.from({ length: 8 }, (_, i) => {
    if (i === 0) return '<li class="occupied">自分</li>';
    if (filled) return `<li class="occupied">ボット ${i}</li>`;
    return '<li>空き</li>';
  });
  return `<ol class="seats" aria-label="参加枠">${entries.join('')}</ol>`;
}

function rankings() {
  const isWorld = rankMode === 'world';
  const isGlobal = rankScope === 'global';
  const pool = isGlobal ? ['ミオ', 'サム', 'ルイ'] : ['ソジン', 'ハリン', 'イアン'];
  const scores = isWorld ? [1620, 1495, 1310] : [302, 284, 271];
  const unit = isWorld ? ' PT' : '点';
  const rows = pool.map((name, index) =>
    `<li><span>${index + 1}</span><strong>${name}</strong><span class="number">${format.format(scores[index])}${unit}</span></li>`
  ).join('');
  const showOwn = isWorld ? canEnterWorld() : player.best > 0;
  const ownStat = isWorld ? player.rating : player.best;
  const own = showOwn
    ? `<p class="status">自分の記録 · ${format.format(ownStat)}${unit}</p>`
    : '<p class="hint">まだ記録がありません。</p>';

  return panel('TOP 1000', `
    <div class="tabs" role="group" aria-label="ランキング種別">${buttons([['world', '8人バトル'], ['solo', 'ひとり特訓']], 'rank-mode', rankMode)}</div>
    <div class="tabs" role="group" aria-label="ランキング範囲">${buttons([['global', '世界'], ['country', '国内']], 'rank-scope', rankScope)}</div>
    <ol class="rank-list">${rows}</ol>${own}`);
}

function collection() {
  const cards = skins.map(([icon, name, rule, isUnlocked], index) => {
    const unlocked = isUnlocked(player);
    const equipped = equippedIndex === index;
    return `<div class="paper-card"><h3><span class="swatch" aria-hidden="true">${icon}</span>${name}</h3>
      <p class="hint">${rule}</p>
      <button class="plain" type="button" data-equip="${index}" ${!unlocked || equipped ? 'disabled' : ''}>${equipped ? '装備中' : unlocked ? '装備する' : '未解放'}</button></div>`;
  }).join('');
  return panel('コレクション', cards, 'home', '実績を達成してボールの軌跡や投球エフェクトを集めよう。');
}

function settings() {
  const options = languages.map(([key, name]) =>
    `<option value="${key}" ${language === key ? 'selected' : ''}>${name}</option>`
  ).join('');
  return panel('設定', `
    <label class="field">言語<select id="language">${options}</select></label>
    <p class="hint">この試作画面は日本語で表示されます。言語の選択はこのタブ内で保持されます。</p>
    <label class="field">BGM <output id="bgm-value">${volume.bgm}%</output><input type="range" id="bgm" min="0" max="100" value="${volume.bgm}"></label>
    <label class="field">効果音 <output id="sfx-value">${volume.sfx}%</output><input type="range" id="sfx" min="0" max="100" value="${volume.sfx}"></label>
    <div class="paper-card"><h3>アカウント連携</h3><p class="hint">未連携。ログインは実際のゲーム内で行えます。</p>
      <button class="plain" type="button" data-account>Googleでログイン</button>
      <button class="plain" type="button" data-account>Appleでログイン</button>
    </div>
    <p class="status" id="notice" role="status"></p>`);
}

const renderers = {
  splash: () => `
    <section class="portrait-scene opening" aria-labelledby="opening-title">
      <img class="scene-art" src="assets/opening-fullshot.webp" alt="放課後のグラウンドでマウンドに立つピッチャー" fetchpriority="high">
      <h2 id="opening-title" class="game-title" tabindex="-1">${title}</h2>
      ${action('スタート', 'pitch')}
    </section>`,
  pitch: () => `
    <section class="portrait-scene pitch-scene" aria-label="投球アニメーション">
      <img class="scene-art" src="assets/opening-fullshot.webp" alt="">
      ${action('スキップ', 'home', 'skip-pitch')}
    </section>`,
  name: () => panel('選手名を登録', `
    <form class="form" id="name-form">
      <label class="field">選手名<input name="playerName" maxlength="10" autocomplete="off" required></label>
      <p class="hint">日本語・韓国語は5文字、半角英字は10文字まで。登録後は変更できません。</p>
      <p class="error" role="alert"></p><button class="cta" type="submit">この名前で始める</button>
    </form>
    <div class="paper-card"><h3>プレイ記録を復元</h3>
      <button class="plain" type="button" data-account>Googleで復元</button>
      <button class="plain" type="button" data-account>Appleで復元</button>
    </div><p class="status" id="notice" role="status"></p>`),
  home,
  'play-info': () => panel('プレイ・購入情報', `
    <p>Web版は回数制限なしで遊べます。</p>
    <div class="paper-card"><h3>広告削除パス</h3><p class="hint">アプリ版で購入や復元ができます。</p>
      <button class="plain" type="button" data-account>購入を復元</button>
    </div><p class="status" id="notice" role="status"></p>`),
  unlock: () => panel('世界8人バトルの解放', `
    <div class="paper-card ticket"><strong class="number">${player.best} / ${WORLD_UNLOCK_SCORE}</strong>
      <progress class="progress" value="${player.best}" max="${WORLD_UNLOCK_SCORE}" aria-label="世界8人バトルの解放進捗"></progress>
      <p>ひとり特訓で31点に達すると解放されます。</p>
    </div>${action('ひとり特訓', 'solo')}`),
  solo: () => panel('ひとり特訓', `
    <div class="paper-card ticket"><span>自己ベスト</span><strong class="number">${format.format(player.best)}点</strong></div>
    <p>ピッチャーを左右に動かし、自動で投げるボールを数字の順番に当てよう。</p>
    ${action('特訓画面を見る', 'training')}`),
  training: () => panel('特訓画面', `
    <div class="paper-card"><p class="status">スコア 0 · 次は 1</p>
      <div class="score-board" aria-label="数字ブロックの例">${[8, 4, 6, 1, 9, 7, 3, 2, 10, 5].map(n => `<span ${n === 1 ? 'class="target"' : ''}>${n}</span>`).join('')}</div>
      <div class="venue day" role="img" aria-label="昼の練習場"></div>
      <p class="hint">次のブロックは色と太い枠線で表示します。</p>
    </div>${action('リザルトを見る', 'solo-result')}`, 'solo'),
  'solo-result': () => panel('特訓終了', `
    <div class="paper-card ticket"><span>今回のスコア</span><strong class="number">24点</strong><span>自己ベスト ${Math.max(24, player.best)}点</span></div>
    ${action('リトライ', 'solo')}${action('ランキングを見る', 'ranking', 'plain')}`),
  world: () => panel('世界8人バトル', `
    <div class="venue night" role="img" aria-label="照明が灯る夜の球場"></div>
    <div class="paper-card ticket"><span>${league()}</span><strong class="number">${format.format(player.rating)} PT</strong><span>通算優勝 ${player.wins}回</span></div>
    <p class="hint">最大20秒間プレイヤーを探します。空き枠にはボットが参加します。</p>
    ${action('クイックマッチ', 'matching')}`),
  matching: () => panel('対戦相手を検索中', `
    <div class="paper-card"><strong class="number" id="timer">${MATCH_SECONDS}秒</strong>
      <p class="status" id="match-status" role="status">プレイヤー 1 / 8人</p>
      ${seats()}
    </div>${action('キャンセル', 'world', 'plain')}`, null),
  'match-ready': () => panel('8人がスタンバイ', `
    <div class="paper-card"><p class="status">プレイヤー1人 · ボット7体</p>${seats(true)}</div>
    ${action('対戦リザルトを見る', 'battle-result')}`, 'world'),
  'battle-result': () => panel('対戦リザルト', `
    <div class="paper-card ticket"><span>最終順位</span><strong class="number">2位 · +10 PT</strong><span>${format.format(player.rating)} → ${format.format(player.rating + 10)} PT</span></div>
    <ol class="rank-list"><li><span>1</span><strong>ボット 3</strong><span>82点</span></li><li class="own"><span>2</span><strong data-player-name></strong><span>79点</span></li><li><span>3</span><strong>ボット 1</strong><span>63点</span></li></ol>
    ${action('もう一度対戦する', 'matching')}${action('ホームへ', 'home', 'plain')}`),
  friend: () => panel('フレンド特訓', `
    ${action('ルームを作る', 'friend-host')}
    <form class="form" id="friend-form">
      <label class="field">招待コード<input name="roomCode" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" placeholder="0000" required></label>
      <p class="error" role="alert"></p><button class="plain" type="submit">コードで参加</button>
    </form><p class="hint">試作用の招待コードは 2741 です。</p>`),
  'friend-host': () => panel('フレンド招待', `
    <div class="paper-card ticket"><span>ルームコード</span><strong class="number">2741</strong><span>フレンドを待っています · 1 / 8人</span></div>
    ${action('ゲーム開始', 'friend-joined', 'cta', true)}${action('ルームを退出', 'friend', 'plain')}`, 'friend'),
  'friend-joined': () => panel('ルーム待機中', `
    <div class="paper-card"><p class="status">コード 2741 · 2 / 8人</p><p>ホストがゲームを始めると自動で参加します。</p></div>
    ${action('ルームを退出', 'friend', 'plain')}`, 'friend'),
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
    display.querySelector('#timer').textContent = `${remaining}秒`;
  }, 250);
}

function navigate(next, focus = true) {
  clearInterval(matchTimer);
  clearTimeout(pitchTimer);
  page = next === 'world' && !canEnterWorld() ? 'unlock' : next;
  display.innerHTML = renderers[page]();
  const playerLabel = player.name || 'ゲスト';
  display.querySelectorAll('[data-player-name]').forEach(element => { element.textContent = playerLabel; });
  masthead.hidden = ['splash', 'pitch', 'home', 'name'].includes(page);
  if (page === 'matching') startMatching();
  if (focus) display.querySelector('h2, .skip-pitch')?.focus();
}

function playPitch() {
  if (page !== 'splash') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    navigate('home');
    return;
  }

  navigate('pitch');
  const scene = display.querySelector('.pitch-scene');
  const still = scene.querySelector('.scene-art');
  const animation = new Image();
  animation.className = 'scene-art';
  animation.alt = '';
  const finish = () => {
    if (scene.isConnected) navigate('home');
  };
  pitchTimer = setTimeout(finish, 4000);
  animation.onload = () => {
    if (!still.isConnected) return;
    still.replaceWith(animation);
    clearTimeout(pitchTimer);
    pitchTimer = setTimeout(finish, PITCH_DURATION_MS);
  };
  animation.onerror = finish;
  const run = pitchRun++;
  animation.src = run === 0 ? 'assets/title-pitch.gif' : `assets/title-pitch.gif?replay=${run}`;
}

function chooseScenario(key) {
  player = { ...scenarios[key] };
  equippedIndex = 0;
  requestedMode = 'home';
  document.querySelectorAll('[data-scenario]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.scenario === key));
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
  const { scenario, go, rankMode: modeFilter, rankScope: scopeFilter, equip } = button.dataset;
  if (scenario) chooseScenario(scenario);
  else if (go === 'pitch') playPitch();
  else if (['solo', 'world', 'friend'].includes(go) && !player.name) {
    requestedMode = go;
    navigate('name');
  } else if (go) navigate(go);
  else if (modeFilter) updateRankFilter('rankMode', modeFilter);
  else if (scopeFilter) updateRankFilter('rankScope', scopeFilter);
  else if (equip !== undefined) {
    equippedIndex = Number(equip);
    navigate('collection');
  } else if (button.hasAttribute('data-account')) {
    display.querySelector('#notice').textContent = 'この試作画面ではアカウントへの接続や購入はできません。';
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
      form.querySelector('.error').textContent = '名前を確認してください。日本語・韓国語は5文字、半角英字は10文字までです。';
      return;
    }
    player.name = name;
    navigate(requestedMode);
  } else if (data.get('roomCode') === '2741') {
    navigate('friend-joined');
  } else {
    form.querySelector('.error').textContent = 'ルームが見つかりません。コードを確認してください。';
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

if (new URLSearchParams(location.search).get('preview') === 'home') {
  chooseScenario('standard');
} else {
  navigate('splash', false);
}
