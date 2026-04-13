// SoundManager - generates all sounds programmatically via Web Audio API
class SoundManager {
  private ctx: AudioContext | null = null;
  private volume = 0.5;
  private muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  private gain(): GainNode {
    const g = this.getCtx().createGain();
    g.gain.value = this.muted ? 0 : this.volume;
    g.connect(this.getCtx().destination);
    return g;
  }

  private beep(freq: number, dur: number, type: OscillatorType = 'square') {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  menuSelect() { this.beep(440, 0.08); }
  
  point() { this.beep(660, 0.1); setTimeout(() => this.beep(880, 0.1), 100); }
  
  death() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
    osc.connect(g);
    g.gain.setValueAtTime(this.muted ? 0 : this.volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  powerUp() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.1, 'sine'), i * 80));
  }

  explosion() {
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.gain();
    src.connect(g);
    src.start();
  }

  victory() {
    [523, 659, 784, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      setTimeout(() => this.beep(f, 0.15, 'sine'), i * 150)
    );
  }

  countdown() { this.beep(440, 0.15); }
  countdownGo() { this.beep(880, 0.3); }

  gameStart() {
    [262, 330, 392, 523].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, 'sine'), i * 100));
  }

  setVolume(v: number) { this.volume = Math.max(0, Math.min(1, v)); }
  getVolume() { return this.volume; }
  toggleMute() { this.muted = !this.muted; return this.muted; }
  isMuted() { return this.muted; }
}

export const soundManager = new SoundManager();
