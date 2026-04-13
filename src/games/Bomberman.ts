// Bomberman Duel
import { inputManager } from '../engine/InputManager';
import { soundManager } from '../engine/SoundManager';
import { scoreManager } from '../engine/ScoreManager';

const GRID = 15, CS = 42;
const W = GRID * CS, H = GRID * CS;

type Cell = 'empty' | 'wall' | 'brick' | 'powerup_bomb' | 'powerup_flame' | 'powerup_speed' | 'powerup_shield';

interface Bomb { x: number; y: number; timer: number; range: number; owner: 1 | 2; }
interface Explosion { x: number; y: number; timer: number; }
interface Player { x: number; y: number; speed: number; maxBombs: number; bombRange: number; shield: boolean; alive: boolean; }

export function runBomberman(canvas: HTMLCanvasElement, onEnd: (winner: 1 | 2 | 0) => void) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = W; canvas.height = H;

  let grid: Cell[][] = [];
  let bombs: Bomb[] = [];
  let explosions: Explosion[] = [];
  let p1: Player, p2: Player;
  let wins1 = 0, wins2 = 0;
  let running = true;
  let moveCD1 = 0, moveCD2 = 0;
  let bombCD1 = 0, bombCD2 = 0;

  function initRound() {
    grid = Array.from({ length: GRID }, (_, r) =>
      Array.from({ length: GRID }, (_, c) => {
        if (r === 0 || r === GRID - 1 || c === 0 || c === GRID - 1) return 'wall';
        if (r % 2 === 0 && c % 2 === 0) return 'wall';
        // Clear spawn areas
        if ((r <= 2 && c <= 2) || (r >= GRID - 3 && c >= GRID - 3)) return 'empty';
        return Math.random() < 0.6 ? 'brick' : 'empty';
      })
    );
    bombs = []; explosions = [];
    p1 = { x: 1, y: 1, speed: 1, maxBombs: 1, bombRange: 2, shield: false, alive: true };
    p2 = { x: GRID - 2, y: GRID - 2, speed: 1, maxBombs: 1, bombRange: 2, shield: false, alive: true };
  }
  initRound();

  function placeBomb(player: Player, pNum: 1 | 2) {
    const gx = Math.round(player.x), gy = Math.round(player.y);
    const count = bombs.filter(b => b.owner === pNum).length;
    if (count >= player.maxBombs) return;
    if (bombs.some(b => b.x === gx && b.y === gy)) return;
    bombs.push({ x: gx, y: gy, timer: 180, range: player.bombRange, owner: pNum });
    soundManager.menuSelect();
  }

  function explode(bomb: Bomb) {
    soundManager.explosion();
    const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      for (let i = 0; i <= (dx === 0 && dy === 0 ? 0 : bomb.range); i++) {
        const x = bomb.x + dx * i, y = bomb.y + dy * i;
        if (x < 0 || x >= GRID || y < 0 || y >= GRID) break;
        if (grid[y][x] === 'wall') break;
        explosions.push({ x, y, timer: 30 });
        if (grid[y][x] === 'brick') {
          // Random power-up
          const r = Math.random();
          if (r < 0.2) grid[y][x] = 'powerup_bomb';
          else if (r < 0.4) grid[y][x] = 'powerup_flame';
          else if (r < 0.55) grid[y][x] = 'powerup_speed';
          else if (r < 0.65) grid[y][x] = 'powerup_shield';
          else grid[y][x] = 'empty';
          break;
        }
        // Check player hit
        const checkHit = (p: Player) => {
          if (Math.round(p.x) === x && Math.round(p.y) === y && p.alive) {
            if (p.shield) { p.shield = false; } else { p.alive = false; }
          }
        };
        checkHit(p1); checkHit(p2);
      }
    }
  }

  function movePlayer(player: Player, isP1: boolean) {
    const inp = isP1 ? inputManager.p1 : inputManager.p2;
    const spd = 0.06 * player.speed;
    let nx = player.x, ny = player.y;
    if (inp.up) ny -= spd;
    if (inp.down) ny += spd;
    if (inp.left) nx -= spd;
    if (inp.right) nx += spd;

    // Collision
    const gx = Math.round(nx), gy = Math.round(ny);
    const canWalk = (x: number, y: number) => {
      if (x < 0 || x >= GRID || y < 0 || y >= GRID) return false;
      const cell = grid[y][x];
      if (cell === 'wall' || cell === 'brick') return false;
      if (bombs.some(b => b.x === x && b.y === y && !(Math.round(player.x) === x && Math.round(player.y) === y))) return false;
      return true;
    };

    if (canWalk(Math.round(nx), Math.round(player.y))) player.x = nx;
    if (canWalk(Math.round(player.x), Math.round(ny))) player.y = ny;

    // Pickup power-ups
    const px = Math.round(player.x), py = Math.round(player.y);
    const cell = grid[py]?.[px];
    if (cell?.startsWith('powerup_')) {
      soundManager.powerUp();
      if (cell === 'powerup_bomb') player.maxBombs++;
      if (cell === 'powerup_flame') player.bombRange++;
      if (cell === 'powerup_speed') player.speed = Math.min(2, player.speed + 0.3);
      if (cell === 'powerup_shield') player.shield = true;
      grid[py][px] = 'empty';
    }
  }

  function update() {
    if (!running) return;
    movePlayer(p1, true);
    movePlayer(p2, false);

    // Bomb placement
    if (inputManager.p1.action1 && bombCD1 <= 0) { placeBomb(p1, 1); bombCD1 = 15; }
    if (inputManager.p2.action1 && bombCD2 <= 0) { placeBomb(p2, 2); bombCD2 = 15; }
    bombCD1--; bombCD2--;

    // Update bombs
    bombs = bombs.filter(b => { b.timer--; if (b.timer <= 0) { explode(b); return false; } return true; });
    // Update explosions
    explosions = explosions.filter(e => { e.timer--; return e.timer > 0; });

    // Check round end
    if (!p1.alive || !p2.alive) {
      if (!p1.alive && !p2.alive) { /* draw, redo */ }
      else if (!p1.alive) wins2++;
      else wins1++;

      if (wins1 >= 2) { running = false; scoreManager.recordWin('bomberman', 1); onEnd(1); return; }
      if (wins2 >= 2) { running = false; scoreManager.recordWin('bomberman', 2); onEnd(2); return; }
      setTimeout(() => initRound(), 500);
    }
  }

  function render() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < GRID; r++)
      for (let c = 0; c < GRID; c++) {
        const x = c * CS, y = r * CS;
        const cell = grid[r][c];
        // Checker floor
        ctx.fillStyle = (r + c) % 2 === 0 ? '#111122' : '#0e0e1e';
        ctx.fillRect(x, y, CS, CS);

        if (cell === 'wall') { ctx.fillStyle = '#444466'; ctx.fillRect(x, y, CS, CS); ctx.strokeStyle = '#666688'; ctx.strokeRect(x + 1, y + 1, CS - 2, CS - 2); }
        else if (cell === 'brick') { ctx.fillStyle = '#553322'; ctx.fillRect(x + 1, y + 1, CS - 2, CS - 2); }
        else if (cell?.startsWith('powerup_')) {
          const colors: Record<string, string> = { powerup_bomb: '#ff8800', powerup_flame: '#ff0044', powerup_speed: '#00ff88', powerup_shield: '#0088ff' };
          ctx.fillStyle = colors[cell] || '#fff';
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(x + CS / 2, y + CS / 2, 8, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

    // Bombs
    bombs.forEach(b => {
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(b.x * CS + CS / 2, b.y * CS + CS / 2, CS / 3, 0, Math.PI * 2); ctx.fill();
      // Fuse
      if (Math.floor(b.timer / 5) % 2 === 0) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath(); ctx.arc(b.x * CS + CS / 2, b.y * CS + CS / 2 - CS / 3, 3, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Explosions
    explosions.forEach(e => {
      const a = e.timer / 30;
      ctx.fillStyle = `rgba(255, ${Math.floor(100 * a)}, 0, ${a})`;
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 15 * a;
      ctx.fillRect(e.x * CS + 2, e.y * CS + 2, CS - 4, CS - 4);
      ctx.shadowBlur = 0;
    });

    // Players
    if (p1.alive) {
      ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10;
      ctx.fillRect(p1.x * CS + 6, p1.y * CS + 6, CS - 12, CS - 12);
      if (p1.shield) { ctx.strokeStyle = '#0088ff'; ctx.lineWidth = 2; ctx.strokeRect(p1.x * CS + 3, p1.y * CS + 3, CS - 6, CS - 6); ctx.lineWidth = 1; }
    }
    if (p2.alive) {
      ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 10;
      ctx.fillRect(p2.x * CS + 6, p2.y * CS + 6, CS - 12, CS - 12);
      if (p2.shield) { ctx.strokeStyle = '#0088ff'; ctx.lineWidth = 2; ctx.strokeRect(p2.x * CS + 3, p2.y * CS + 3, CS - 6, CS - 6); ctx.lineWidth = 1; }
    }
    ctx.shadowBlur = 0;

    // HUD
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = '#00ffff'; ctx.textAlign = 'left';
    ctx.fillText(`P1 W:${wins1}`, 5, H - 5);
    ctx.fillStyle = '#ff00ff'; ctx.textAlign = 'right';
    ctx.fillText(`P2 W:${wins2}`, W - 5, H - 5);
  }

  let animId: number;
  function loop() { update(); render(); if (running) animId = requestAnimationFrame(loop); }
  loop();
  return () => { running = false; cancelAnimationFrame(animId); };
}
