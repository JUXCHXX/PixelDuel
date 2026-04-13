// InputManager - maps keyboard to player actions
export type Action = 'up' | 'down' | 'left' | 'right' | 'action1' | 'action2';
export type PlayerInputs = Record<Action, boolean>;

const P1_MAP: Record<string, Action> = {
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  Space: 'action1', ShiftLeft: 'action2',
};
const P2_MAP: Record<string, Action> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'action1', ControlRight: 'action2',
};

class InputManager {
  p1: PlayerInputs = { up: false, down: false, left: false, right: false, action1: false, action2: false };
  p2: PlayerInputs = { up: false, down: false, left: false, right: false, action1: false, action2: false };
  private listeners: Array<(player: 1 | 2, action: Action, pressed: boolean) => void> = [];

  constructor() {
    window.addEventListener('keydown', (e) => this.handle(e, true));
    window.addEventListener('keyup', (e) => this.handle(e, false));
  }

  private handle(e: KeyboardEvent, pressed: boolean) {
    const a1 = P1_MAP[e.code];
    if (a1) { e.preventDefault(); this.p1[a1] = pressed; this.notify(1, a1, pressed); return; }
    const a2 = P2_MAP[e.code];
    if (a2) { e.preventDefault(); this.p2[a2] = pressed; this.notify(2, a2, pressed); return; }
  }

  onInput(cb: (player: 1 | 2, action: Action, pressed: boolean) => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notify(player: 1 | 2, action: Action, pressed: boolean) {
    this.listeners.forEach(l => l(player, action, pressed));
  }

  reset() {
    const clear = (p: PlayerInputs) => { (Object.keys(p) as Action[]).forEach(k => p[k] = false); };
    clear(this.p1); clear(this.p2);
  }
}

export const inputManager = new InputManager();
