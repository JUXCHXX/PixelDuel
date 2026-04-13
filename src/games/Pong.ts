// Pong Evolved - Canvas game
import { inputManager } from '../engine/InputManager';
import { soundManager } from '../engine/SoundManager';
import { scoreManager } from '../engine/ScoreManager';

interface PowerUp {
  x: number; y: number; type: 'big' | 'speed' | 'magnet'; timer: number;
}

export function runPong(canvas: HTMLCanvasElement, onEnd: (winner: 1 | 2 | 0) => void) {
  const ctx = canvas.getContext('2d')!;
  const W = 800, H = 500;
  canvas.width = W; canvas.height = H;

  const paddleH = 80, paddleW = 12, ballR = 8;
  let p1y = H / 2, p2y = H / 2;
  let bx = W / 2, by = H / 2, bvx = 4, bvy = 2;
  let score1 = 0, score2 = 0;
  const maxScore = 7;
  let paddleSpeed = 6;
  let p1h = paddleH, p2h = paddleH;
  let trail: Array<{ x: number; y: number; color: string }> = [];
  let powerUps: PowerUp[] = [];
  let powerUpTimer = 0;
  let p1Effects: Record<string, number> = {};
  let p2Effects: Record<string, number> = {};
  let lastHit: 1 | 2 = 1;
  let running = true;
  let lineOffset = 0;

  function spawnPowerUp() {
    const types: PowerUp['type'][] = ['big', 'speed', 'magnet'];
    powerUps.push({
      x: W / 4 + Math.random() * W / 2,
      y: 40 + Math.random() * (H - 80),
      type: types[Math.floor(Math.random() * types.length)],
      timer: 600,
    });
  }

  function resetBall(dir: number) {
    bx = W / 2; by = H / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const speed = 4;
    bvx = Math.cos(angle) * speed * dir;
    bvy = Math.sin(angle) * speed;
    trail = [];
  }

  function update() {
    if (!running) return;
    // Input
    const p1 = inputManager.p1, p2 = inputManager.p2;
    if (p1.up) p1y = Math.max(p1h / 2, p1y - paddleSpeed);
    if (p1.down) p1y = Math.min(H - p1h / 2, p1y + paddleSpeed);
    if (p2.up) p2y = Math.max(p2h / 2, p2y - paddleSpeed);
    if (p2.down) p2y = Math.min(H - p2h / 2, p2y + paddleSpeed);

    // Ball
    bx += bvx; by += bvy;
    trail.push({ x: bx, y: by, color: lastHit === 1 ? '#00ffff' : '#ff00ff' });
    if (trail.length > 15) trail.shift();

    // Wall bounce
    if (by - ballR < 0 || by + ballR > H) { bvy *= -1; by = Math.max(ballR, Math.min(H - ballR, by)); }

    // Paddle collision
    if (bx - ballR < paddleW + 10 && by > p1y - p1h / 2 && by < p1y + p1h / 2 && bvx < 0) {
      const rel = (by - p1y) / (p1h / 2);
      bvx = Math.abs(bvx) * 1.05;
      bvy = rel * 5;
      lastHit = 1;
      soundManager.menuSelect();
    }
    if (bx + ballR > W - paddleW - 10 && by > p2y - p2h / 2 && by < p2y + p2h / 2 && bvx > 0) {
      const rel = (by - p2y) / (p2h / 2);
      bvx = -Math.abs(bvx) * 1.05;
      bvy = rel * 5;
      lastHit = 2;
      soundManager.menuSelect();
    }

    // Speed cap
    const maxV = 10;
    bvx = Math.max(-maxV, Math.min(maxV, bvx));

    // Score
    if (bx < 0) { score2++; soundManager.point(); resetBall(1); }
    if (bx > W) { score1++; soundManager.point(); resetBall(-1); }

    // Power-ups
    powerUpTimer++;
    if (powerUpTimer > 600 && powerUps.length < 2) { spawnPowerUp(); powerUpTimer = 0; }
    powerUps = powerUps.filter(p => {
      p.timer--;
      if (p.timer <= 0) return false;
      const dx = bx - p.x, dy = by - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        soundManager.powerUp();
        if (p.type === 'big') { if (lastHit === 1) p1h = 120; else p2h = 120; setTimeout(() => { p1h = paddleH; p2h = paddleH; }, 8000); }
        if (p.type === 'speed') { bvx *= 1.5; bvy *= 1.2; }
        return false;
      }
      return true;
    });

    // Check win
    if (score1 >= maxScore) { running = false; scoreManager.recordWin('pong', 1); onEnd(1); }
    if (score2 >= maxScore) { running = false; scoreManager.recordWin('pong', 2); onEnd(2); }
  }

  function render() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Center line
    lineOffset = (lineOffset + 0.5) % 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -lineOffset;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    trail.forEach((t, i) => {
      const a = i / trail.length;
      ctx.globalAlpha = a * 0.4;
      ctx.fillStyle = t.color;
      ctx.beginPath(); ctx.arc(t.x, t.y, ballR * a, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ball
    ctx.fillStyle = '#fff';
    ctx.shadowColor = lastHit === 1 ? '#00ffff' : '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(bx, by, ballR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Paddles
    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(10, p1y - p1h / 2, paddleW, p1h);
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(W - 10 - paddleW, p2y - p2h / 2, paddleW, p2h);
    ctx.shadowBlur = 0;

    // Power-ups
    powerUps.forEach(p => {
      ctx.fillStyle = p.type === 'big' ? '#0088ff' : p.type === 'speed' ? '#ffff00' : '#00ff88';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Scores
    ctx.font = '32px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff'; ctx.fillText(String(score1), W / 4, 50);
    ctx.fillStyle = '#ff00ff'; ctx.fillText(String(score2), 3 * W / 4, 50);
  }

  let animId: number;
  function loop() {
    update(); render();
    if (running) animId = requestAnimationFrame(loop);
  }
  loop();

  return () => { running = false; cancelAnimationFrame(animId); };
}
