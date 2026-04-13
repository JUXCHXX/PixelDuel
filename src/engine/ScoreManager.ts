export interface GameScores {
  highScore: number;
  wins: { p1: number; p2: number };
}

type ScoreData = Record<string, GameScores>;

const STORAGE_KEY = 'pixelduel_scores';

const defaultScores = (): GameScores => ({ highScore: 0, wins: { p1: 0, p2: 0 } });

class ScoreManager {
  private data: ScoreData;

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.data = raw ? JSON.parse(raw) : {};
    } catch { this.data = {}; }
  }

  private save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); }

  get(game: string): GameScores {
    if (!this.data[game]) this.data[game] = defaultScores();
    return this.data[game];
  }

  recordWin(game: string, player: 1 | 2) {
    const s = this.get(game);
    player === 1 ? s.wins.p1++ : s.wins.p2++;
    this.save();
  }

  updateHighScore(game: string, score: number) {
    const s = this.get(game);
    if (score > s.highScore) { s.highScore = score; this.save(); }
  }

  getAll(): ScoreData { return { ...this.data }; }

  reset() { this.data = {}; this.save(); }
}

export const scoreManager = new ScoreManager();
