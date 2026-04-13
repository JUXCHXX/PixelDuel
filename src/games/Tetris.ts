// Tetris Battle - two side-by-side boards
import { inputManager } from '../engine/InputManager';
import { soundManager } from '../engine/SoundManager';
import { scoreManager } from '../engine/ScoreManager';

const TCOLS = 10, TROWS = 20, CS = 24;
const BW = TCOLS * CS, BH = TROWS * CS;

const PIECES = [
  { shape: [[1,1,1,1]], color: '#00ffff' },           // I
  { shape: [[1,1],[1,1]], color: '#ffff00' },          // O
  { shape: [[0,1,0],[1,1,1]], color: '#ff00ff' },      // T
  { shape: [[1,0,0],[1,1,1]], color: '#0088ff' },      // J
  { shape: [[0,0,1],[1,1,1]], color: '#ff8800' },      // L
  { shape: [[0,1,1],[1,1,0]], color: '#00ff88' },      // S
  { shape: [[1,1,0],[0,1,1]], color: '#ff0044' },      // Z
];

interface Board { grid: (string | null)[][]; piece: any; px: number; py: number; next: any; score: number; lines: number; level: number; dropTimer: number; garbage: number; }

function createBoard(): Board {
  const grid = Array.from({ length: TROWS }, () => Array(TCOLS).fill(null));
  const piece = randomPiece();
  return { grid, piece, px: 3, py: 0, next: randomPiece(), score: 0, lines: 0, level: 1, dropTimer: 0, garbage: 0 };
}

function randomPiece() { return PIECES[Math.floor(Math.random() * PIECES.length)]; }

function rotate(shape: number[][]): number[][] {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) => Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c]));
}

function fits(board: Board, shape: number[][], px: number, py: number): boolean {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const x = px + c, y = py + r;
        if (x < 0 || x >= TCOLS || y >= TROWS) return false;
        if (y >= 0 && board.grid[y][x]) return false;
      }
  return true;
}

function lock(board: Board): number {
  const { piece, px, py } = board;
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) {
        const y = py + r;
        if (y < 0) continue;
        board.grid[y][px + c] = piece.color;
      }
  // Clear lines
  let cleared = 0;
  for (let r = TROWS - 1; r >= 0; r--) {
    if (board.grid[r].every(c => c !== null)) {
      board.grid.splice(r, 1);
      board.grid.unshift(Array(TCOLS).fill(null));
      cleared++; r++;
    }
  }
  return cleared;
}

function addGarbage(board: Board, lines: number) {
  for (let i = 0; i < lines; i++) {
    board.grid.shift();
    const row = Array(TCOLS).fill('#555');
    const hole = Math.floor(Math.random() * TCOLS);
    row[hole] = null;
    board.grid.push(row);
  }
}

export function runTetris(canvas: HTMLCanvasElement, onEnd: (winner: 1 | 2 | 0) => void) {
  const ctx = canvas.getContext('2d')!;
  const TW = BW * 2 + 120;
  canvas.width = TW; canvas.height = BH;

  let b1 = createBoard(), b2 = createBoard();
  let running = true;
  let frameCount = 0;

  // Input cooldowns
  let p1cd: Record<string, number> = {};
  let p2cd: Record<string, number> = {};

  function handleInput(board: Board, isP1: boolean) {
    const inp = isP1 ? inputManager.p1 : inputManager.p2;
    const cd = isP1 ? p1cd : p2cd;
    const now = frameCount;

    if (inp.left && (!cd.left || now - cd.left > 6)) {
      if (fits(board, board.piece.shape, board.px - 1, board.py)) board.px--;
      cd.left = now;
    }
    if (inp.right && (!cd.right || now - cd.right > 6)) {
      if (fits(board, board.piece.shape, board.px + 1, board.py)) board.px++;
      cd.right = now;
    }
    if (inp.down && (!cd.down || now - cd.down > 3)) {
      if (fits(board, board.piece.shape, board.px, board.py + 1)) board.py++;
      cd.down = now;
    }
    if (inp.up && (!cd.up || now - cd.up > 12)) {
      const rotated = rotate(board.piece.shape);
      if (fits(board, rotated, board.px, board.py)) board.piece = { ...board.piece, shape: rotated };
      cd.up = now;
    }
    if (inp.action2 && (!cd.action2 || now - cd.action2 > 15)) {
      while (fits(board, board.piece.shape, board.px, board.py + 1)) board.py++;
      cd.action2 = now;
    }
  }

  function updateBoard(board: Board, other: Board): boolean {
    const dropSpeed = Math.max(3, 30 - board.level * 3);
    board.dropTimer++;
    if (board.dropTimer >= dropSpeed) {
      board.dropTimer = 0;
      if (fits(board, board.piece.shape, board.px, board.py + 1)) {
        board.py++;
      } else {
        const cleared = lock(board);
        if (cleared > 0) {
          soundManager.point();
          board.lines += cleared;
          board.score += [0, 100, 300, 500, 800][cleared] * board.level;
          board.level = 1 + Math.floor(board.lines / 10);
          const garbage = [0, 0, 1, 2, 4][cleared];
          if (garbage > 0) addGarbage(other, garbage);
        }
        // Add pending garbage
        if (board.garbage > 0) { addGarbage(board, board.garbage); board.garbage = 0; }
        board.piece = board.next;
        board.next = randomPiece();
        board.px = 3; board.py = 0;
        if (!fits(board, board.piece.shape, board.px, board.py)) return true; // dead
      }
    }
    return false;
  }

  function drawBoard(board: Board, ox: number) {
    // Background
    ctx.fillStyle = '#08081a';
    ctx.fillRect(ox, 0, BW, BH);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x <= TCOLS; x++) { ctx.beginPath(); ctx.moveTo(ox + x * CS, 0); ctx.lineTo(ox + x * CS, BH); ctx.stroke(); }
    for (let y = 0; y <= TROWS; y++) { ctx.beginPath(); ctx.moveTo(ox, y * CS); ctx.lineTo(ox + BW, y * CS); ctx.stroke(); }

    // Grid
    for (let r = 0; r < TROWS; r++)
      for (let c = 0; c < TCOLS; c++)
        if (board.grid[r][c]) {
          ctx.fillStyle = board.grid[r][c]!;
          ctx.fillRect(ox + c * CS + 1, r * CS + 1, CS - 2, CS - 2);
        }

    // Current piece
    const { piece, px, py } = board;
    ctx.shadowColor = piece.color; ctx.shadowBlur = 8;
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        if (piece.shape[r][c]) {
          ctx.fillStyle = piece.color;
          ctx.fillRect(ox + (px + c) * CS + 1, (py + r) * CS + 1, CS - 2, CS - 2);
        }
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = board === b1 ? '#00ffff' : '#ff00ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, 0, BW, BH);
    ctx.lineWidth = 1;
  }

  function drawCenter() {
    const cx = BW + 10;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(cx, 0, 100, BH);

    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('P1', cx + 50, 30);
    ctx.fillText(`LVL ${b1.level}`, cx + 50, 50);
    ctx.fillText(`${b1.lines} LN`, cx + 50, 70);
    ctx.fillText(`${b1.score}`, cx + 50, 90);

    ctx.fillStyle = '#ff00ff';
    ctx.fillText('P2', cx + 50, BH - 80);
    ctx.fillText(`LVL ${b2.level}`, cx + 50, BH - 60);
    ctx.fillText(`${b2.lines} LN`, cx + 50, BH - 40);
    ctx.fillText(`${b2.score}`, cx + 50, BH - 20);

    ctx.fillStyle = '#fff';
    ctx.fillText('VS', cx + 50, BH / 2);

    // Next pieces
    ctx.fillStyle = '#fff';
    ctx.fillText('NEXT', cx + 50, 120);
    drawMiniPiece(b1.next, cx + 25, 130);
    ctx.fillText('NEXT', cx + 50, BH - 130);
    drawMiniPiece(b2.next, cx + 25, BH - 120);
  }

  function drawMiniPiece(piece: any, ox: number, oy: number) {
    const s = 10;
    ctx.fillStyle = piece.color;
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        if (piece.shape[r][c]) ctx.fillRect(ox + c * s, oy + r * s, s - 1, s - 1);
  }

  function update() {
    if (!running) return;
    frameCount++;
    handleInput(b1, true);
    handleInput(b2, false);
    const dead1 = updateBoard(b1, b2);
    const dead2 = updateBoard(b2, b1);
    if (dead1 || dead2) {
      running = false;
      soundManager.death();
      if (dead1 && !dead2) { scoreManager.recordWin('tetris', 2); onEnd(2); }
      else if (dead2 && !dead1) { scoreManager.recordWin('tetris', 1); onEnd(1); }
      else onEnd(0);
    }
  }

  function render() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, TW, BH);
    drawBoard(b1, 0);
    drawBoard(b2, BW + 120);
    drawCenter();
  }

  let animId: number;
  function loop() { update(); render(); if (running) animId = requestAnimationFrame(loop); }
  loop();
  return () => { running = false; cancelAnimationFrame(animId); };
}
