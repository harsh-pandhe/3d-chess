/**
 * ChessApp — Main application component that orchestrates the 3D canvas and UI overlays.
 * Loaded dynamically to avoid SSR issues with Three.js.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import GameHUD from '@/components/ui/GameHUD';
import NewGameMenu from '@/components/ui/NewGameMenu';
import { useGameStore } from '@/store/game-store';
import { useStockfish } from '@/hooks/useStockfish';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import styles from './ChessApp.module.css';

// Dynamic import of the 3D scene to prevent SSR hydration errors
const ChessScene = dynamic(() => import('@/components/3d/ChessScene'), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner} />
      <div className={styles.loadingText}>Loading 3D Engine...</div>
    </div>
  ),
});

export default function ChessApp() {
  const status = useGameStore((s) => s.status);
  const settings = useGameStore((s) => s.settings);
  const [showMenu, setShowMenu] = useState(true);
  
  // Safe extraction of room from URL
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');

  // Initialize hooks
  useStockfish();
  useGameTimer();
  useMultiplayer(settings.mode === 'online' ? (roomParam || 'global-lobby') : null);

  const autoJoined = useRef(false);

  useEffect(() => {
    // If someone visits the app with a ?room= link, bypass the menu and join as black (guest)
    if (roomParam && !autoJoined.current) {
      autoJoined.current = true;
      const { newGame } = useGameStore.getState();
      newGame({
        mode: 'online',
        playerColor: 'b', // Guest gets black by default. In a real app, you'd sync who picked what color.
      });
      setShowMenu(false);
    }
  }, [roomParam]);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleOpenMenu = useCallback(() => {
    setShowMenu(true);
  }, []);

  // Show menu when game is idle or after game over
  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout'].includes(status);

  return (
    <div className={styles.appContainer}>
      {/* 3D Canvas — full viewport */}
      <div className={styles.canvasContainer}>
        <ChessScene />
      </div>

      {/* 2D HUD overlay */}
      <GameHUD />

      {/* New Game Menu */}
      {(showMenu || status === 'idle') && (
        <NewGameMenu onClose={handleCloseMenu} />
      )}

      {/* Game Over — Rematch prompt */}
      {isGameOver && !showMenu && (
        <div className={styles.gameOverOverlay}>
          <button className={styles.rematchBtn} onClick={handleOpenMenu} id="rematch-menu-btn">
            New Game
          </button>
        </div>
      )}
    </div>
  );
}
