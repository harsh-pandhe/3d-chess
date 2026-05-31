/**
 * New Game Menu — Fullscreen dialog for game setup.
 * Displayed at startup and between games.
 */

'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
import type { GameMode, AIDifficulty, PieceColor } from '@/engine/types';
import { useRouter } from 'next/navigation';
import styles from './NewGameMenu.module.css';

interface NewGameMenuProps {
  onClose: () => void;
}

const TIME_CONTROLS = [
  { label: '1 min', value: 1, increment: 0, tag: 'Bullet' },
  { label: '3 min', value: 3, increment: 0, tag: 'Blitz' },
  { label: '3|2', value: 3, increment: 2, tag: 'Blitz' },
  { label: '5 min', value: 5, increment: 0, tag: 'Blitz' },
  { label: '10 min', value: 10, increment: 0, tag: 'Rapid' },
  { label: '15|10', value: 15, increment: 10, tag: 'Rapid' },
  { label: '30 min', value: 30, increment: 0, tag: 'Classical' },
  { label: '∞', value: 0, increment: 0, tag: 'Unlimited' },
];

const AI_LEVELS: { level: AIDifficulty; label: string; elo: string; icon: string }[] = [
  { level: 'beginner', label: 'Beginner', elo: '~800', icon: '🌱' },
  { level: 'intermediate', label: 'Intermediate', elo: '~1400', icon: '⚔️' },
  { level: 'advanced', label: 'Advanced', elo: '~2000', icon: '🏆' },
  { level: 'master', label: 'Master', elo: '~2500+', icon: '👑' },
];

export default function NewGameMenu({ onClose }: NewGameMenuProps) {
  const newGame = useGameStore((s) => s.newGame);
  const router = useRouter();
  
  const [mode, setMode] = useState<GameMode>('local');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('intermediate');
  const [timeControl, setTimeControl] = useState(10);
  const [increment, setIncrement] = useState(0);
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');

  const handleStartGame = useCallback(() => {
    let finalRoomId = null;
    if (mode === 'online') {
      finalRoomId = Math.random().toString(36).substring(2, 9);
      router.push(`/?room=${finalRoomId}`);
    } else {
      router.push('/'); // Clear room from url if any
    }

    newGame({
      mode,
      aiDifficulty,
      timeControl,
      increment,
      playerColor,
    });
    onClose();
  }, [mode, aiDifficulty, timeControl, increment, playerColor, newGame, onClose, router]);

  return (
    <div className={styles.overlay}>
      <div className={styles.menu}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>♔</div>
          <h1 className={styles.title}>New Game</h1>
          <p className={styles.subtitle}>Choose your battle</p>
        </div>

        {/* Game Mode */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Game Mode</h3>
          <div className={styles.modeGrid}>
            <button
              className={`${styles.modeCard} ${mode === 'local' ? styles.modeActive : ''}`}
              onClick={() => setMode('local')}
              id="mode-local"
            >
              <span className={styles.modeIcon}>👥</span>
              <span className={styles.modeLabel}>Local</span>
              <span className={styles.modeDesc}>Play on same device</span>
            </button>
            <button
              className={`${styles.modeCard} ${mode === 'ai' ? styles.modeActive : ''}`}
              onClick={() => setMode('ai')}
              id="mode-ai"
            >
              <span className={styles.modeIcon}>🤖</span>
              <span className={styles.modeLabel}>vs AI</span>
              <span className={styles.modeDesc}>Play against Stockfish</span>
            </button>
            <button
              className={`${styles.modeCard} ${mode === 'online' ? styles.modeActive : ''}`}
              onClick={() => setMode('online')}
              id="mode-online"
            >
              <span className={styles.modeIcon}>🌐</span>
              <span className={styles.modeLabel}>Online</span>
              <span className={styles.modeDesc}>Play with a friend</span>
            </button>
          </div>
        </div>

        {/* AI Difficulty (only in AI mode) */}
        {mode === 'ai' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>AI Difficulty</h3>
            <div className={styles.aiGrid}>
              {AI_LEVELS.map(({ level, label, elo, icon }) => (
                <button
                  key={level}
                  className={`${styles.aiCard} ${aiDifficulty === level ? styles.aiActive : ''}`}
                  onClick={() => setAiDifficulty(level)}
                  id={`ai-${level}`}
                >
                  <span className={styles.aiIcon}>{icon}</span>
                  <span className={styles.aiLabel}>{label}</span>
                  <span className={styles.aiElo}>{elo}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color selection (AI & Online mode) */}
        {(mode === 'ai' || mode === 'online') && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Play as</h3>
            <div className={styles.colorPicker}>
              <button
                className={`${styles.colorBtn} ${playerColor === 'w' ? styles.colorActive : ''}`}
                onClick={() => setPlayerColor('w')}
                id="color-white"
              >
                <span className={styles.colorPiece}>♔</span>
                White
              </button>
              <button
                className={`${styles.colorBtn} ${playerColor === 'b' ? styles.colorActive : ''}`}
                onClick={() => setPlayerColor('b')}
                id="color-black"
              >
                <span className={styles.colorPieceDark}>♚</span>
                Black
              </button>
            </div>
          </div>
        )}

        {/* Time Control */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Time Control</h3>
          <div className={styles.timeGrid}>
            {TIME_CONTROLS.map(({ label, value, increment: inc, tag }) => (
              <button
                key={label}
                className={`${styles.timeCard} ${timeControl === value && increment === inc ? styles.timeActive : ''}`}
                onClick={() => {
                  setTimeControl(value);
                  setIncrement(inc);
                }}
                id={`time-${label.replace(/[^a-zA-Z0-9]/g, '')}`}
              >
                <span className={styles.timeValue}>{label}</span>
                <span className={styles.timeTag}>{tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button className={styles.startBtn} onClick={handleStartGame} id="start-game-btn">
          <span className={styles.startBtnIcon}>⚔</span>
          Start Game
        </button>
      </div>
    </div>
  );
}
