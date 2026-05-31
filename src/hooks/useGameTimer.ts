/**
 * Game Timer Hook — Manages chess clocks for both players.
 * Uses requestAnimationFrame for precise timing without blocking the render loop.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/game-store';

export function useGameTimer() {
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = (timestamp: number) => {
      const state = useGameStore.getState();
      
      if (!state.timerActive || state.settings.timeControl === 0 || state.showPromotionDialog) {
        lastTickRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTickRef.current === 0) {
        lastTickRef.current = timestamp;
      }

      const delta = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;

      // Only tick if delta is reasonable (prevent large jumps from tab switching)
      if (delta > 0 && delta < 1000) {
        const currentTime = state.turn === 'w' ? state.whiteTime : state.blackTime;
        const newTime = Math.max(0, currentTime - delta);
        state.updateTimer(state.turn, newTime);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Activate timer on first move
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.moveHistory.length,
      (length) => {
        if (length === 1) {
          useGameStore.getState().setTimerActive(true);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Add increment after each move
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.moveHistory.length,
      (length, prevLength) => {
        if (length > prevLength && length > 1) {
          const state = useGameStore.getState();
          const { increment } = state.settings;
          if (increment > 0) {
            // Add increment to the player who just moved (opposite of current turn)
            const movedColor = state.turn === 'w' ? 'b' : 'w';
            const currentTime = movedColor === 'w' ? state.whiteTime : state.blackTime;
            state.updateTimer(movedColor, currentTime + increment * 1000);
          }
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Stop timer on game over
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.status,
      (status) => {
        if (['checkmate', 'stalemate', 'draw', 'resigned', 'timeout'].includes(status)) {
          useGameStore.getState().setTimerActive(false);
        }
      }
    );
    return () => unsubscribe();
  }, []);
}
