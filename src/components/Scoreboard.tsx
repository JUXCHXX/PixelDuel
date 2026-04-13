import React from 'react';
import { scoreManager } from '../engine/ScoreManager';

const GAME_NAMES: Record<string, string> = {
  pong: 'PONG', snake: 'SNAKE', tetris: 'TETRIS',
  wordle: 'WORDLE', bomberman: 'BOMBER', racing: 'RACER',
};

interface ScoreboardProps {
  onBack: () => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ onBack }) => {
  const all = scoreManager.getAll();

  return (
    <div className="flex flex-col items-center gap-6 p-8 crt-on">
      <h2 className="font-arcade text-accent text-lg">🏆 RECORDS</h2>
      <div className="w-full max-w-lg space-y-4">
        {Object.entries(GAME_NAMES).map(([key, name]) => {
          const s = scoreManager.get(key);
          const total = s.wins.p1 + s.wins.p2;
          const p1pct = total > 0 ? (s.wins.p1 / total) * 100 : 50;
          return (
            <div key={key} className="border border-border rounded p-4 bg-card">
              <div className="font-arcade text-xs text-foreground mb-2">{name}</div>
              <div className="flex items-center gap-3 font-body text-sm">
                <span className="text-primary">P1: {s.wins.p1}</span>
                <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${p1pct}%`,
                      background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
                    }}
                  />
                </div>
                <span className="text-secondary">P2: {s.wins.p2}</span>
              </div>
              {s.highScore > 0 && (
                <div className="text-muted-foreground text-xs mt-1 font-body">
                  High Score: {s.highScore}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4">
        <button className="neon-btn" onClick={onBack}>← BACK</button>
        <button
          className="neon-btn"
          style={{ borderColor: '#ff0044', color: '#ff0044' }}
          onClick={() => { if (confirm('Reset all records?')) { scoreManager.reset(); window.location.reload(); } }}
        >
          RESET
        </button>
      </div>
    </div>
  );
};

export default Scoreboard;
