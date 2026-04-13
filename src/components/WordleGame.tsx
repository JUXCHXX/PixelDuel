import React, { useState, useEffect, useCallback } from 'react';
import { createWordleState, evaluateGuess, checkWin, type WordleState } from '../games/Wordle';
import { soundManager } from '../engine/SoundManager';
import { scoreManager } from '../engine/ScoreManager';

interface WordleGameProps {
  onEnd: (winner: 1 | 2 | 0) => void;
}

const MAX_GUESSES = 6;

const WordleGame: React.FC<WordleGameProps> = ({ onEnd }) => {
  const [state, setState] = useState<WordleState>(createWordleState);
  const [results1, setResults1] = useState<Array<Array<'correct' | 'present' | 'absent'>>>([]);
  const [results2, setResults2] = useState<Array<Array<'correct' | 'present' | 'absent'>>>([]);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);

  // Timer
  useEffect(() => {
    if (state.winner !== null) return;
    const interval = setInterval(() => {
      setState(s => {
        if (s.timeLeft <= 1) {
          // Time's up - compare
          const g1 = s.guesses1.length > 0 ? evaluateGuess(s.guesses1[s.guesses1.length - 1], s.word).filter(r => r === 'correct').length : 0;
          const g2 = s.guesses2.length > 0 ? evaluateGuess(s.guesses2[s.guesses2.length - 1], s.word).filter(r => r === 'correct').length : 0;
          const winner = g1 > g2 ? 1 : g2 > g1 ? 2 : 0;
          return { ...s, timeLeft: 0, winner: winner as 0 | 1 | 2 };
        }
        return { ...s, timeLeft: s.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.winner]);

  useEffect(() => {
    if (state.winner !== null && state.winner !== 0) {
      scoreManager.recordWin('wordle', state.winner as 1 | 2);
      soundManager.victory();
      setTimeout(() => onEnd(state.winner!), 2000);
    } else if (state.winner === 0) {
      setTimeout(() => onEnd(0), 2000);
    }
  }, [state.winner, onEnd]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (state.winner !== null) return;
    const key = e.key.toUpperCase();

    setState(s => {
      const currentField = activePlayer === 1 ? 'current1' : 'current2';
      const guessesField = activePlayer === 1 ? 'guesses1' : 'guesses2';
      const current = s[currentField];
      const guesses = s[guessesField];

      if (key === 'BACKSPACE') {
        return { ...s, [currentField]: current.slice(0, -1) };
      }

      if (key === 'TAB') {
        e.preventDefault();
        setActivePlayer(p => p === 1 ? 2 : 1);
        return s;
      }

      if (key === 'ENTER' && current.length === 5) {
        if (guesses.length >= MAX_GUESSES) return s;
        const newGuesses = [...guesses, current];
        const result = evaluateGuess(current, s.word);
        if (activePlayer === 1) setResults1(r => [...r, result]);
        else setResults2(r => [...r, result]);

        soundManager.menuSelect();

        if (checkWin(current, s.word)) {
          soundManager.victory();
          return { ...s, [guessesField]: newGuesses, [currentField]: '', winner: activePlayer as 1 | 2 };
        }

        // Switch player after guess
        setActivePlayer(p => p === 1 ? 2 : 1);
        return { ...s, [guessesField]: newGuesses, [currentField]: '' };
      }

      if (/^[A-Z]$/.test(key) && current.length < 5) {
        return { ...s, [currentField]: current + key };
      }

      return s;
    });
  }, [state.winner, activePlayer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderGrid = (guesses: string[], results: Array<Array<'correct' | 'present' | 'absent'>>, current: string, isActive: boolean, player: 1 | 2) => {
    const rows = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
      const cells = [];
      const guess = guesses[i];
      const result = results[i];

      for (let j = 0; j < 5; j++) {
        let letter = '';
        let cls = 'wordle-cell';

        if (guess) {
          letter = guess[j];
          if (result) cls += ` ${result[j]}`;
        } else if (i === guesses.length && !guess) {
          letter = current?.[j] || '';
          if (isActive) cls += ' border-primary';
        }

        cells.push(
          <div key={j} className={cls}>
            {letter}
          </div>
        );
      }
      rows.push(
        <div key={i} className="flex gap-1">
          {cells}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1 items-center">
        <div
          className="font-arcade text-sm mb-2"
          style={{ color: player === 1 ? '#00ffff' : '#ff00ff' }}
        >
          PLAYER {player} {isActive && '◄'}
        </div>
        {rows}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Timer */}
      <div className="font-arcade text-xl text-accent">
        {Math.floor(state.timeLeft / 60)}:{(state.timeLeft % 60).toString().padStart(2, '0')}
      </div>

      <div className="text-muted-foreground font-body text-sm">
        TAB to switch player · Type and ENTER to guess
      </div>

      <div className="flex gap-8">
        {renderGrid(state.guesses1, results1, state.current1, activePlayer === 1, 1)}
        <div className="w-px bg-border" />
        {renderGrid(state.guesses2, results2, state.current2, activePlayer === 2, 2)}
      </div>

      {state.winner !== null && (
        <div className="font-arcade text-lg text-center mt-4">
          {state.winner === 0 ? (
            <span className="text-accent">DRAW!</span>
          ) : (
            <span style={{ color: state.winner === 1 ? '#00ffff' : '#ff00ff' }}>
              PLAYER {state.winner} WINS!
            </span>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            Word was: {state.word}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordleGame;
