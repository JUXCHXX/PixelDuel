import React from 'react';
import type { GameId } from './GameCanvas';
import { soundManager } from '../engine/SoundManager';

const GAMES: Array<{
  id: GameId;
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  controls: string;
  color: string;
}> = [
  { id: 'pong', name: 'PONG', description: 'Classic paddle battle with power-ups', difficulty: 'EASY', controls: 'P1: W/S · P2: ↑/↓', color: '#00ffff' },
  { id: 'snake', name: 'SNAKE', description: 'Dual snake arena - survive & eat', difficulty: 'MEDIUM', controls: 'P1: WASD · P2: Arrows', color: '#00ff88' },
  { id: 'tetris', name: 'TETRIS', description: 'Side-by-side battle, send garbage!', difficulty: 'MEDIUM', controls: 'P1: WASD+Shift · P2: Arrows+Ctrl', color: '#ff00ff' },
  { id: 'wordle', name: 'WORDLE', description: 'Word guessing duel - same word!', difficulty: 'EASY', controls: 'Type + Enter · TAB switch', color: '#ffff00' },
  { id: 'bomberman', name: 'BOMBER', description: 'Blow up your opponent!', difficulty: 'HARD', controls: 'P1: WASD+Space · P2: Arrows+Enter', color: '#ff8800' },
  { id: 'racing', name: 'RACER', description: 'Top-down pixel racing, 3 laps', difficulty: 'MEDIUM', controls: 'P1: WASD · P2: Arrows', color: '#ff0044' },
];

interface GameSelectorProps {
  onSelect: (game: GameId) => void;
  onBack: () => void;
}

const diffColors: Record<string, string> = {
  EASY: '#00ff88',
  MEDIUM: '#ffff00',
  HARD: '#ff0044',
};

const GameSelector: React.FC<GameSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="flex flex-col items-center gap-8 p-8 crt-on">
      <h2 className="font-arcade text-primary text-lg">SELECT GAME</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
        {GAMES.map((game, i) => (
          <button
            key={game.id}
            className="card-fall group relative flex flex-col items-center gap-3 p-6 rounded border-2 border-border bg-card hover:border-primary transition-all duration-300 cursor-pointer text-left"
            style={{ animationDelay: `${i * 0.1}s`, borderColor: 'transparent' }}
            onMouseEnter={() => soundManager.menuSelect()}
            onClick={() => { soundManager.menuSelect(); onSelect(game.id); }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = game.color;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${game.color}40, 0 0 40px ${game.color}20`;
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div className="font-arcade text-sm" style={{ color: game.color }}>
              {game.name}
            </div>
            <span
              className="font-arcade text-[8px] px-2 py-1 rounded"
              style={{ color: diffColors[game.difficulty], border: `1px solid ${diffColors[game.difficulty]}` }}
            >
              {game.difficulty}
            </span>
            <p className="text-muted-foreground text-sm font-body text-center">
              {game.description}
            </p>
            <p className="text-muted-foreground text-xs font-body opacity-60">
              {game.controls}
            </p>
          </button>
        ))}
      </div>
      <button className="neon-btn mt-4" onClick={onBack}>
        ← BACK
      </button>
    </div>
  );
};

export default GameSelector;
