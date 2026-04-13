import React, { useRef, useEffect, useState } from 'react';
import { soundManager } from '../engine/SoundManager';
import GamepadControls from './GamepadControls';

type GameId = 'pong' | 'snake' | 'tetris' | 'wordle' | 'bomberman' | 'racing';
type GameMode = 'local' | 'online';
type Screen = 'menu' | 'select' | 'playing' | 'records' | 'lobby';

interface GameCanvasProps {
  game: GameId;
  onEnd: (winner: 1 | 2 | 0) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ game, onEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Simular eventos de teclado desde controles móviles
  const simulateKeyEvent = (key: string, type: 'keydown' | 'keyup') => {
    const charCode = key === ' ' ? 32 : key.charCodeAt(0);
    const event = new KeyboardEvent(type, {
      key: key,
      code: key === ' ' ? 'Space' : key.length > 1 ? key : key.toUpperCase(),
      keyCode: charCode,
      which: charCode,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cleanup: (() => void) | undefined;

    const loadGame = async () => {
      setGameStarted(true);
      switch (game) {
        case 'pong': { const { runPong } = await import('../games/Pong'); cleanup = runPong(canvas, onEnd); break; }
        case 'snake': { const { runSnake } = await import('../games/Snake'); cleanup = runSnake(canvas, onEnd); break; }
        case 'tetris': { const { runTetris } = await import('../games/Tetris'); cleanup = runTetris(canvas, onEnd); break; }
        case 'bomberman': { const { runBomberman } = await import('../games/Bomberman'); cleanup = runBomberman(canvas, onEnd); break; }
        case 'racing': { const { runRacing } = await import('../games/Racing'); cleanup = runRacing(canvas, onEnd); break; }
      }
    };
    loadGame();

    return () => {
      cleanup?.();
      setGameStarted(false);
    };
  }, [game, onEnd]);

  return (
    <div className="game-canvas-container flex flex-col items-center pb-40 md:pb-0">
      <canvas ref={canvasRef} className="border border-border rounded" />
      {gameStarted && (
        <GamepadControls
          gameType={game}
          onKeyDown={(key) => simulateKeyEvent(key, 'keydown')}
          onKeyUp={(key) => simulateKeyEvent(key, 'keyup')}
        />
      )}
    </div>
  );
};

export default GameCanvas;
export type { GameId, GameMode, Screen };
