'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

const SKINS = {
  retro: {
    name: 'Retro',
    colors: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#7986cb', '#ffb74d'],
    bodyBg: '#0f0f17',
    boardBg: '#1a1a25',
    gridColor: '#22222e',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },
  neon: {
    name: 'Neon',
    colors: [null, '#00fff9', '#faff00', '#ff00e6', '#00ff6a', '#ff2d55', '#4d7bff', '#ff9f1c'],
    bodyBg: '#000000',
    boardBg: '#000000',
    gridColor: '#111118',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      context.save();
      context.globalAlpha = alpha ?? 1;
      context.shadowColor = color;
      context.shadowBlur = 14;
      context.fillStyle = color;
      context.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
      context.shadowBlur = 0;
      context.strokeStyle = 'rgba(255,255,255,0.6)';
      context.lineWidth = 1;
      context.strokeRect(x * size + 2.5, y * size + 2.5, size - 5, size - 5);
      context.restore();
    },
  },
  pastel: {
    name: 'Pastel',
    colors: [null, '#a8d8ea', '#fff1b8', '#e0c3fc', '#c1f0c1', '#ffc9c9', '#c3d4ff', '#ffdcb0'],
    bodyBg: '#f7f0ea',
    boardBg: '#fdf6f0',
    gridColor: '#eee0e0',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      roundRect(context, x * size + 2, y * size + 2, size - 4, size - 4, 6);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.5)';
      roundRect(context, x * size + 4, y * size + 4, size - 8, (size - 8) / 2, 3);
      context.fill();
      context.globalAlpha = 1;
    },
  },
  pixel: {
    name: 'Pixel art',
    colors: [null, '#3ddc97', '#ffe066', '#ff6b6b', '#4ecdc4', '#c44536', '#a06cd5', '#ff9f1c'],
    bodyBg: '#101820',
    boardBg: '#101820',
    gridColor: '#1c2733',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      const px = (size - 2) / 3;
      context.strokeStyle = 'rgba(0,0,0,0.35)';
      context.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        context.beginPath();
        context.moveTo(x * size + 1 + i * px, y * size + 1);
        context.lineTo(x * size + 1 + i * px, y * size + size - 1);
        context.stroke();
        context.beginPath();
        context.moveTo(x * size + 1, y * size + 1 + i * px);
        context.lineTo(x * size + size - 1, y * size + 1 + i * px);
        context.stroke();
      }
      context.fillStyle = 'rgba(255,255,255,0.3)';
      context.fillRect(x * size + 1, y * size + 1, px, px);
      context.globalAlpha = 1;
    },
  },
};

const SKIN_STORAGE_KEY = 'tetris-skin';
let currentSkin = SKINS[localStorage.getItem(SKIN_STORAGE_KEY)] ? localStorage.getItem(SKIN_STORAGE_KEY) : 'retro';

const skinSelect = document.getElementById('skin-select');

function applySkin(skinId) {
  if (!SKINS[skinId]) return;
  currentSkin = skinId;
  localStorage.setItem(SKIN_STORAGE_KEY, skinId);
  skinSelect.value = skinId;
  const skin = SKINS[skinId];
  document.body.style.background = skin.bodyBg;
  canvas.style.background = skin.boardBg;
  nextCanvas.style.background = skin.boardBg;
  if (typeof draw === 'function' && board) {
    draw();
    if (next) drawNext();
  }
}

skinSelect.addEventListener('change', () => applySkin(skinSelect.value));

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');

const pauseOverlay = document.getElementById('pause-overlay');
const pauseMain = document.getElementById('pause-main');
const pauseControls = document.getElementById('pause-controls');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const controlsBtn = document.getElementById('controls-btn');
const backBtn = document.getElementById('back-btn');
const startLevelSelect = document.getElementById('start-level-select');

const START_LEVEL_KEY = 'tetris-start-level';
const MAX_START_LEVEL = 10;

const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const startRecordsList = document.getElementById('start-records-list');
const startBestCombo = document.getElementById('start-best-combo');
const startMaxLines = document.getElementById('start-max-lines');

const saveScoreRow = document.getElementById('save-score-row');
const playerNameInput = document.getElementById('player-name-input');
const saveScoreBtn = document.getElementById('save-score-btn');
const overlayRecordsList = document.getElementById('overlay-records-list');
const overlayBestCombo = document.getElementById('overlay-best-combo');
const overlayMaxLines = document.getElementById('overlay-max-lines');

const RECORDS_KEY = 'tetrisRecords';

let board, current, next, score, lines, level, combo, maxCombo, paused, lastTime, dropAccum, dropInterval, animId;
let gameOver = true;
let startLevel = loadStartLevel();

function loadStartLevel() {
  const stored = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
  if (Number.isInteger(stored) && stored >= 1 && stored <= MAX_START_LEVEL) return stored;
  return 1;
}

function levelToDropInterval(lvl) {
  return Math.max(100, 1000 - (lvl - 1) * 90);
}

function populateStartLevelSelect() {
  for (let i = 1; i <= MAX_START_LEVEL; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    startLevelSelect.appendChild(opt);
  }
  startLevelSelect.value = startLevel;
}

function loadRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECORDS_KEY));
    return {
      scores: Array.isArray(parsed?.scores) ? parsed.scores : [],
      bestCombo: Number(parsed?.bestCombo) || 0,
      maxLines: Number(parsed?.maxLines) || 0,
    };
  } catch {
    return { scores: [], bestCombo: 0, maxLines: 0 };
  }
}

function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function qualifiesForTop(records, value) {
  return records.scores.length < 5 || value > records.scores[records.scores.length - 1].score;
}

function renderRecordsList(listEl, records, highlightId) {
  listEl.innerHTML = '';
  if (!records.scores.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Sin récords todavía';
    listEl.appendChild(li);
    return;
  }
  records.scores.forEach(entry => {
    const li = document.createElement('li');
    if (entry.id === highlightId) li.classList.add('highlight');
    const name = document.createElement('span');
    name.className = 'record-name';
    name.textContent = entry.name;
    const sc = document.createElement('span');
    sc.className = 'record-score';
    sc.textContent = entry.score.toLocaleString();
    li.appendChild(name);
    li.appendChild(sc);
    listEl.appendChild(li);
  });
}

function updateStatsDisplay(comboEl, linesEl, records) {
  comboEl.textContent = records.bestCombo;
  linesEl.textContent = records.maxLines;
}

function renderStartOverlay() {
  const records = loadRecords();
  renderRecordsList(startRecordsList, records, null);
  updateStatsDisplay(startBestCombo, startMaxLines, records);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = startLevel + Math.floor(lines / 10);
    dropInterval = levelToDropInterval(level);
    updateHUD();
  } else {
    combo = 0;
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  SKINS[currentSkin].drawBlock(context, x, y, colorIndex, size, alpha);
}

function drawGrid() {
  ctx.strokeStyle = SKINS[currentSkin].gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);

  const records = loadRecords();
  records.bestCombo = Math.max(records.bestCombo, maxCombo);
  records.maxLines = Math.max(records.maxLines, lines);
  saveRecords(records);

  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  renderRecordsList(overlayRecordsList, records, null);
  updateStatsDisplay(overlayBestCombo, overlayMaxLines, records);

  if (qualifiesForTop(records, score)) {
    saveScoreRow.classList.remove('hidden');
    playerNameInput.value = '';
    overlay.classList.remove('hidden');
    playerNameInput.focus();
  } else {
    saveScoreRow.classList.add('hidden');
    overlay.classList.remove('hidden');
  }
}

function saveCurrentScore() {
  const records = loadRecords();
  const name = playerNameInput.value.trim().slice(0, 10) || 'AAA';
  const id = Date.now();
  records.scores.push({ id, name, score });
  records.scores.sort((a, b) => b.score - a.score);
  records.scores = records.scores.slice(0, 5);
  saveRecords(records);
  saveScoreRow.classList.add('hidden');
  renderRecordsList(overlayRecordsList, records, id);
}

function openPauseMenu() {
  cancelAnimationFrame(animId);
  showPauseMain();
  pauseOverlay.classList.remove('hidden');
}

function closePauseMenu() {
  pauseOverlay.classList.add('hidden');
  lastTime = performance.now();
  loop(lastTime);
}

function showPauseMain() {
  pauseMain.classList.remove('hidden');
  pauseControls.classList.add('hidden');
}

function showPauseControls() {
  pauseMain.classList.add('hidden');
  pauseControls.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    closePauseMenu();
  } else {
    openPauseMenu();
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  applySkin(currentSkin);
  board = createBoard();
  score = 0;
  lines = 0;
  level = startLevel;
  combo = 0;
  maxCombo = 0;
  paused = false;
  gameOver = false;
  dropInterval = levelToDropInterval(level);
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', () => {
  init();
});
controlsBtn.addEventListener('click', showPauseControls);
backBtn.addEventListener('click', showPauseMain);
startLevelSelect.addEventListener('change', () => {
  const val = parseInt(startLevelSelect.value, 10);
  startLevel = val;
  localStorage.setItem(START_LEVEL_KEY, String(val));
});

startBtn.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  init();
});

resetRecordsBtn.addEventListener('click', () => {
  if (!confirm('¿Resetear todos los récords?')) return;
  localStorage.removeItem(RECORDS_KEY);
  renderStartOverlay();
});

saveScoreBtn.addEventListener('click', saveCurrentScore);
playerNameInput.addEventListener('keydown', e => {
  if (e.code === 'Enter') saveCurrentScore();
});

applySkin(currentSkin);
populateStartLevelSelect();
renderStartOverlay();
