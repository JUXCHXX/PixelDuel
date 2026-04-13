// Pixel Racer - top-down racing
import { inputManager } from '../engine/InputManager';
import { soundManager } from '../engine/SoundManager';
import { scoreManager } from '../engine/ScoreManager';

const W = 800, H = 600;

interface Car {
  x: number; y: number; angle: number; speed: number; lap: number;
  checkpoint: boolean; color: string; trail: Array<{ x: number; y: number }>;
}

// Simple oval track defined by center, radii
const CX = 400, CY = 300, RX = 300, RY = 200, TRACK_W = 80;

function isOnTrack(x: number, y: number): boolean {
  const dx = (x - CX) / RX, dy = (y - CY) / RY;
  const d = Math.sqrt(dx * dx + dy * dy);
  const innerR = 1 - TRACK_W / (2 * Math.min(RX, RY));
  const outerR = 1 + TRACK_W / (2 * Math.min(RX, RY));
  return d > innerR - 0.15 && d < outerR + 0.15;
}

export function runRacing(canvas: HTMLCanvasElement, onEnd: (winner: 1 | 2 | 0) => void) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = W; canvas.height = H;

  const LAPS = 3;
  const startAngle = -Math.PI / 2;
  const sx = CX + Math.cos(startAngle) * RX;
  const sy = CY + Math.sin(startAngle) * RY;

  let car1: Car = { x: sx - 15, y: sy, angle: 0, speed: 0, lap: 0, checkpoint: false, color: '#00ffff', trail: [] };
  let car2: Car = { x: sx + 15, y: sy, angle: 0, speed: 0, lap: 0, checkpoint: false, color: '#ff00ff', trail: [] };
  let running = true;

  function updateCar(car: Car, isP1: boolean) {
    const inp = isP1 ? inputManager.p1 : inputManager.p2;
    const onTrack = isOnTrack(car.x, car.y);
    const friction = onTrack ? 0.98 : 0.94;
    const accel = onTrack ? 0.15 : 0.05;
    const turnSpeed = 0.04 * Math.min(1, Math.abs(car.speed) / 2);

    if (inp.up) car.speed += accel;
    if (inp.down) car.speed -= accel * 0.5;
    if (inp.left) car.angle -= turnSpeed;
    if (inp.right) car.angle += turnSpeed;

    car.speed *= friction;
    car.speed = Math.max(-3, Math.min(8, car.speed));

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    // Keep in bounds
    car.x = Math.max(10, Math.min(W - 10, car.x));
    car.y = Math.max(10, Math.min(H - 10, car.y));

    // Trail
    if (Math.abs(car.speed) > 1) {
      car.trail.push({ x: car.x, y: car.y });
      if (car.trail.length > 20) car.trail.shift();
    }

    // Lap detection (cross start line going right direction)
    const dy = car.y - CY;
    // Checkpoint: bottom of track
    if (dy > RY * 0.8) car.checkpoint = true;
    // Finish line: top, going left-to-right past start
    if (car.checkpoint && car.y < sy + 20 && car.y > sy - 20 && Math.abs(car.x - sx) < 40) {
      car.lap++;
      car.checkpoint = false;
      soundManager.point();
      if (car.lap >= LAPS) {
        running = false;
        const winner = car === car1 ? 1 : 2;
        scoreManager.recordWin('racing', winner as 1 | 2);
        onEnd(winner as 1 | 2);
      }
    }
  }

  // Collision between cars
  function carCollision() {
    const dx = car1.x - car2.x, dy = car1.y - car2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) {
      const nx = dx / dist, ny = dy / dist;
      car1.speed *= 0.5; car2.speed *= 0.5;
      car1.x += nx * 5; car1.y += ny * 5;
      car2.x -= nx * 5; car2.y -= ny * 5;
    }
  }

  function update() {
    if (!running) return;
    updateCar(car1, true);
    updateCar(car2, false);
    carCollision();
  }

  function render() {
    // Background (grass)
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, W, H);

    // Track
    ctx.strokeStyle = '#333';
    ctx.lineWidth = TRACK_W;
    ctx.beginPath();
    ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Track lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Start line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx - 30, sy); ctx.lineTo(sx + 30, sy); ctx.stroke();
    ctx.lineWidth = 1;

    // Trails
    [car1, car2].forEach(car => {
      car.trail.forEach((t, i) => {
        const a = i / car.trail.length;
        ctx.globalAlpha = a * 0.3;
        ctx.fillStyle = car.color;
        ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI * 2); ctx.fill();
      });
    });
    ctx.globalAlpha = 1;

    // Cars
    [car1, car2].forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      ctx.fillStyle = car.color;
      ctx.shadowColor = car.color; ctx.shadowBlur = 12;
      ctx.fillRect(-12, -7, 24, 14);
      // Windshield
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(6, -4, 4, 8);
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // HUD
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`P1 LAP ${Math.min(car1.lap + 1, LAPS)}/${LAPS}`, 10, 25);
    ctx.fillText(`SPD ${Math.abs(car1.speed * 20).toFixed(0)}`, 10, 45);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(`P2 LAP ${Math.min(car2.lap + 1, LAPS)}/${LAPS}`, W - 10, 25);
    ctx.fillText(`SPD ${Math.abs(car2.speed * 20).toFixed(0)}`, W - 10, 45);

    // Mini-map
    const mx = W - 100, my = H - 80, ms = 0.2;
    ctx.strokeStyle = '#333'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(mx + CX * ms, my + CY * ms - 20, RX * ms, RY * ms, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath(); ctx.arc(mx + car1.x * ms, my + car1.y * ms - 20, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath(); ctx.arc(mx + car2.x * ms, my + car2.y * ms - 20, 3, 0, Math.PI * 2); ctx.fill();
  }

  let animId: number;
  function loop() { update(); render(); if (running) animId = requestAnimationFrame(loop); }
  loop();
  return () => { running = false; cancelAnimationFrame(animId); };
}
