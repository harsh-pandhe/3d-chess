/**
 * Game HUD — 2D overlay on top of the 3D canvas.
 * Displays turn indicator, timers, move history, captured pieces, and game status.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import type { PieceType, PieceColor } from '@/engine/types';
import styles from './GameHUD.module.css';

const PIECE_SYMBOLS: Record<PieceType, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Timer component for each player */
function PlayerTimer({ color, name }: { color: PieceColor; name: string }) {
  const time = useGameStore((s) => (color === 'w' ? s.whiteTime : s.blackTime));
  const turn = useGameStore((s) => s.turn);
  const isActive = turn === color;
  const status = useGameStore((s) => s.status);
  const isPlaying = status === 'playing' || status === 'check';

  return (
    <div className={`${styles.timer} ${isActive && isPlaying ? styles.timerActive : ''}`}>
      <div className={styles.timerLabel}>{name}</div>
      <div className={`${styles.timerValue} ${time < 60000 ? styles.timerLow : ''}`}>
        {formatTime(time)}
      </div>
      {isActive && isPlaying && <div className={styles.timerIndicator} />}
    </div>
  );
}

/** Captured pieces display */
function CapturedPieces({ color }: { color: PieceColor }) {
  const captured = useGameStore((s) =>
    color === 'w' ? s.capturedPieces.white : s.capturedPieces.black
  );

  if (captured.length === 0) return null;

  // Sort by value
  const valueOrder: Record<PieceType, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };
  const sorted = [...captured].sort((a, b) => valueOrder[b] - valueOrder[a]);
  const totalValue = sorted.reduce((sum, p) => sum + valueOrder[p], 0);

  return (
    <div className={styles.captured}>
      <div className={styles.capturedPieces}>
        {sorted.map((piece, i) => (
          <span
            key={`${piece}-${i}`}
            className={`${styles.capturedPiece} ${color === 'w' ? styles.capturedWhite : styles.capturedBlack}`}
          >
            {PIECE_SYMBOLS[piece]}
          </span>
        ))}
      </div>
      {totalValue > 0 && (
        <span className={styles.capturedValue}>+{totalValue}</span>
      )}
    </div>
  );
}

/** Move history list */
function MoveHistory() {
  const moveHistory = useGameStore((s) => s.moveHistory);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [moveHistory]);

  if (moveHistory.length === 0) return null;

  // Group moves into pairs (white, black)
  const movePairs: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i].san,
      black: moveHistory[i + 1]?.san,
    });
  }

  return (
    <div className={styles.moveHistory} ref={listRef}>
      <div className={styles.moveHistoryHeader}>Moves</div>
      <div className={styles.moveList}>
        {movePairs.map((pair) => (
          <div key={pair.number} className={styles.movePair}>
            <span className={styles.moveNumber}>{pair.number}.</span>
            <span className={styles.moveWhite}>{pair.white}</span>
            {pair.black && <span className={styles.moveBlack}>{pair.black}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Game status banner */
function GameStatus() {
  const status = useGameStore((s) => s.status);
  const turn = useGameStore((s) => s.turn);
  const isAIThinking = useGameStore((s) => s.isAIThinking);

  if (status === 'idle') return null;

  let message = '';
  let className = styles.statusPlaying;

  switch (status) {
    case 'playing':
      if (isAIThinking) {
        message = '🤔 AI is thinking...';
        className = styles.statusThinking;
      } else {
        message = turn === 'w' ? "White's turn" : "Black's turn";
      }
      break;
    case 'check':
      message = `⚠ ${turn === 'w' ? 'White' : 'Black'} is in check!`;
      className = styles.statusCheck;
      break;
    case 'checkmate':
      message = `👑 Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins!`;
      className = styles.statusGameOver;
      break;
    case 'stalemate':
      message = '🤝 Stalemate — Draw!';
      className = styles.statusGameOver;
      break;
    case 'draw':
      message = '🤝 Draw!';
      className = styles.statusGameOver;
      break;
    case 'resigned':
      message = `🏳 ${turn === 'w' ? 'White' : 'Black'} resigned`;
      className = styles.statusGameOver;
      break;
    case 'timeout':
      message = `⏱ ${turn === 'w' ? 'White' : 'Black'} ran out of time!`;
      className = styles.statusGameOver;
      break;
  }

  return (
    <div className={`${styles.statusBanner} ${className}`}>
      {message}
    </div>
  );
}

/** Promotion dialog */
function PromotionDialog() {
  const showPromotionDialog = useGameStore((s) => s.showPromotionDialog);
  const turn = useGameStore((s) => s.turn);
  const promoteAndMove = useGameStore((s) => s.promoteAndMove);

  if (!showPromotionDialog) return null;

  const pieces: PieceType[] = ['q', 'r', 'b', 'n'];

  return (
    <div className={styles.promotionOverlay}>
      <div className={styles.promotionDialog}>
        <div className={styles.promotionTitle}>Promote to:</div>
        <div className={styles.promotionOptions}>
          {pieces.map((piece) => (
            <button
              key={piece}
              className={`${styles.promotionOption} ${turn === 'w' ? styles.promotionWhite : styles.promotionBlack}`}
              onClick={() => promoteAndMove(piece)}
            >
              {PIECE_SYMBOLS[piece]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Invite link button for online mode */
function InviteLink() {
  const mode = useGameStore((s) => s.settings.mode);
  const [copied, setCopied] = useState(false);

  if (mode !== 'online') return null;

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button className={styles.inviteBtn} onClick={handleCopy} title="Copy Invite Link">
      {copied ? '✅ Copied!' : '🔗 Invite Friend'}
    </button>
  );
}

export default function GameHUD() {
  const settings = useGameStore((s) => s.settings);
  const status = useGameStore((s) => s.status);
  const newGame = useGameStore((s) => s.newGame);
  const undoMove = useGameStore((s) => s.undoMove);
  const resignGame = useGameStore((s) => s.resignGame);
  const toggleBoardRotation = useGameStore((s) => s.toggleBoardRotation);

  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout'].includes(status);

  const handleNewGame = useCallback(() => {
    newGame();
  }, [newGame]);

  return (
    <div className={styles.hudContainer}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>♔</span>
          <span className={styles.logoText}>3D Chess</span>
          <InviteLink />
        </div>
        <GameStatus />
        <div className={styles.topActions}>
          <PlayerTimer color="b" name="Black" />
        </div>
      </div>

      {/* Side panel */}
      <div className={styles.sidePanel}>
        <CapturedPieces color="b" />
        <MoveHistory />
        <CapturedPieces color="w" />
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <PlayerTimer color="w" name="White" />
        <div className={styles.gameActions}>
          {status === 'idle' ? (
            <button className={styles.actionBtn} onClick={handleNewGame} id="new-game-btn">
              ▶ New Game
            </button>
          ) : (
            <>
              {!isGameOver && (
                <>
                  <button className={styles.actionBtnSmall} onClick={undoMove} title="Undo" id="undo-btn">
                    ↩
                  </button>
                  <button className={styles.actionBtnSmall} onClick={resignGame} title="Resign" id="resign-btn">
                    🏳
                  </button>
                </>
              )}
              <button className={styles.actionBtnSmall} onClick={toggleBoardRotation} title="Flip board" id="flip-btn">
                🔄
              </button>
              {isGameOver && (
                <button className={styles.actionBtn} onClick={handleNewGame} id="rematch-btn">
                  ↻ New Game
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Promotion dialog overlay */}
      <PromotionDialog />
    </div>
  );
}
