// Snake Battle
import { inputManager, type Action } from '../engine/InputManager';
import { soundManager } from '../engine/SoundManager';
import { scoreManager } from '../engine/ScoreManager';

const COLS = 20, ROWS = 15, CELL = 40;
const W = COLS * CELL, H = ROWS * CELL;

interface Seg { x: number; y: number; }

export function runSnake(canvas: HTMLCanvasElement, onEnd: (winner: 1 | 2 | 0) => void) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = W; canvas.height = H;

  let dir1 = { x: 1, y: 0 }, dir2 = { x: -1, y: 0 };
  let snake1: Seg[] = [{ x: 3, y: 7 }, { x: 2, y: 7 }, { x: 1, y: 7 }];
  let snake2: Seg[] = [{ x: 16, y: 7 }, { x: 17, y: 7 }, { x: 18, y: 7 }];
  let food: Seg = spawnFood();
  let special: Seg | null = null;
  let specialTimer = 0;
  let score1 = 0, score2 = 0;
  let wins1 = 0, wins2 = 0;
  const winsNeeded = 3;
  let running = true;
  let moveTimer = 0;
  const moveInterval = 8; // frames between moves
  let foodPulse = 0;

  function spawnFood(): Seg {
    let p: Seg;
    do { p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (snake1.some(s => s.x === p.x && s.y === p.y) || snake2.some(s => s.x === p.x && s.y === p.y));
    return p;
  }

  // Direction handling
  inputManager.onInput((player, action, pressed) => {
    if (!pressed) return;
    if (player === 1) {
      if (action === 'up' && dir1.y !== 1) dir1 = { x: 0, y: -1 };
      if (action === 'down' && dir1.y !== -1) dir1 = { x: 0, y: 1 };
      if (action === 'left' && dir1.x !== 1) dir1 = { x: -1, y: 0 };
      if (action === 'right' && dir1.x !== -1) dir1 = { x: 1, y: 0 };
    } else {
      if (action === 'up' && dir2.y !== 1) dir2 = { x: 0, y: -1 };
      if (action === 'down' && dir2.y !== -1) dir2 = { x: 0, y: 1 };
      if (action === 'left' && dir2.x !== 1) dir2 = { x: -1, y: 0 };
      if (action === 'right' && dir2.x !== -1) dir2 = { x: 1, y: 0 };
    }
  });

  function moveSnake(snake: Seg[], dir: { x: number; y: number }): Seg {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    snake.unshift(head);
    return head;
  }

  function collides(head: Seg, snake: Seg[]): boolean {
    return snake.some((s, i) => i > 0 && s.x === head.x && s.y === head.y);
  }

  function outOfBounds(head: Seg): boolean {
    return head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
  }

  function resetRound() {
    snake1 = [{ x: 3, y: 7 }, { x: 2, y: 7 }, { x: 1, y: 7 }];
    snake2 = [{ x: 16, y: 7 }, { x: 17, y: 7 }, { x: 18, y: 7 }];
    dir1 = { x: 1, y: 0 }; dir2 = { x: -1, y: 0 };
    food = spawnFood(); special = null;
    score1 = 0; score2 = 0;
  }

  function update() {
    if (!running) return;
    moveTimer++;
    foodPulse += 0.05;
    specialTimer++;
    if (specialTimer > 600 && !special) { special = spawnFood(); specialTimer = 0; }

    if (moveTimer < moveInterval) return;
    moveTimer = 0;

    const h1 = moveSnake(snake1, dir1);
    const h2 = moveSnake(snake2, dir2);

    let dead1 = outOfBounds(h1) || collides(h1, snake1) || snake2.some(s => s.x === h1.x && s.y === h1.y);
    let dead2 = outOfBounds(h2) || collides(h2, snake2) || snake1.some((s, i) => i > 0 && s.x === h2.x && s.y === h2.y);

    // Head-on collision
    if (h1.x === h2.x && h1.y === h2.y) { dead1 = true; dead2 = true; }

    if (dead1 || dead2) {
      soundManager.death();
      if (dead1 && !dead2) wins2++;
      else if (dead2 && !dead1) wins1++;
      if (wins1 >= winsNeeded) { running = false; scoreManager.recordWin('snake', 1); onEnd(1); return; }
      if (wins2 >= winsNeeded) { running = false; scoreManager.recordWin('snake', 2); onEnd(2); return; }
      resetRound();
      return;
    }

    // Food
    let ate1 = false, ate2 = false;
    if (h1.x === food.x && h1.y === food.y) { score1++; ate1 = true; soundManager.point(); food = spawnFood(); }
    if (h2.x === food.x && h2.y === food.y) { score2++; ate2 = true; soundManager.point(); food = spawnFood(); }
    if (special) {
      if (h1.x === special.x && h1.y === special.y) { score1 += 5; ate1 = true; soundManager.powerUp(); special = null; }
      if (h2.x === special.x && h2.y === special.y) { score2 += 5; ate2 = true; soundManager.powerUp(); special = null; }
    }
    if (!ate1) snake1.pop();
    if (!ate2) snake2.pop();
  }

  function render() {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

    // Snake 1
    snake1.forEach((s, i) => {
      const t = 1 - i / snake1.length;
      ctx.fillStyle = `rgba(0, ${Math.floor(200 + 55 * t)}, 255, ${0.5 + 0.5 * t})`;
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = i === 0 ? 15 : 5;
      ctx.fillRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
    });

    // Snake 2
    snake2.forEach((s, i) => {
      const t = 1 - i / snake2.length;
      ctx.fillStyle = `rgba(255, 0, ${Math.floor(200 + 55 * t)}, ${0.5 + 0.5 * t})`;
      ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = i === 0 ? 15 : 5;
      ctx.fillRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
    });
    ctx.shadowBlur = 0;

    // Food
    const pulse = Math.sin(foodPulse) * 4;
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 10 + pulse;
    ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 3 + pulse / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Special food
    if (special) {
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 15;
      ctx.beginPath();
      const cx = special.x * CELL + CELL / 2, cy = special.y * CELL + CELL / 2;
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI / 5) - Math.PI / 2 + foodPulse;
        const r = i % 2 === 0 ? 14 : 7;
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // HUD
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`P1: ${score1}  W:${wins1}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(`P2: ${score2}  W:${wins2}`, W - 10, 25);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(`FIRST TO ${winsNeeded} WINS`, W / 2, 25);
  }

  let animId: number;
  function loop() { update(); render(); if (running) animId = requestAnimationFrame(loop); }
  loop();
  return () => { running = false; cancelAnimationFrame(animId); };
}
