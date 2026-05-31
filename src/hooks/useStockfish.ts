/**
 * Stockfish AI Hook — Manages the Web Worker for AI chess analysis.
 * Falls back to random moves if Stockfish WASM isn't available.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const setAIWorker = useGameStore((s) => s.setAIWorker);
  const makeMove = useGameStore((s) => s.makeMove);

  const initWorker = useCallback(() => {
    try {
      // Detect WASM support
      const wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
      const workerUrl = wasmSupported ? '/stockfish/stockfish.wasm.js' : '/stockfish/stockfish.js';
      
      const worker = new Worker(workerUrl);
      
      worker.addEventListener('message', (e: MessageEvent) => {
        const data = e.data as string;
        console.log('Stockfish:', data); // Debugging
        
        // Parse UCI "bestmove" response
        if (typeof data === 'string' && data.startsWith('bestmove')) {
          const parts = data.split(' ');
          const moveStr = parts[1];
          if (moveStr && moveStr.length >= 4) {
            const from = moveStr.substring(0, 2);
            const to = moveStr.substring(2, 4);
            const promotion = moveStr.length > 4 ? moveStr[4] : undefined;
            
            makeMove(from, to, promotion as 'q' | 'r' | 'b' | 'n' | undefined);
            useGameStore.setState({ isAIThinking: false });
          }
        }
      });

      worker.addEventListener('error', (err) => {
        console.error('Stockfish worker error:', err);
        workerRef.current = null;
        setAIWorker(null);
      });

      // Initialize Stockfish UCI protocol
      worker.postMessage('uci');
      worker.postMessage('setoption name Hash value 32');
      worker.postMessage('setoption name Threads value 1');
      worker.postMessage('isready');

      workerRef.current = worker;
      setAIWorker(worker);
    } catch {
      console.warn('Web Workers not supported or Stockfish unavailable. Using fallback AI.');
    }
  }, [setAIWorker, makeMove]);

  useEffect(() => {
    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initWorker]);

  // Listen for AI move requests
  useEffect(() => {
    let fallbackTimeout: NodeJS.Timeout;
    
    const unsubscribe = useGameStore.subscribe(
      (state) => state.isAIThinking,
      (isThinking) => {
        if (isThinking) {
          const { engine, settings } = useGameStore.getState();
          const fen = engine.fen();
          
          if (workerRef.current) {
            const levelMap = {
              beginner: { depth: 2, time: 500 },
              intermediate: { depth: 5, time: 1000 },
              advanced: { depth: 10, time: 3000 },
              master: { depth: 14, time: 5000 },
            };
            
            const config = levelMap[settings.aiDifficulty];
            
            workerRef.current.postMessage(`position fen ${fen}`);
            workerRef.current.postMessage(`go depth ${config.depth} movetime ${config.time}`);
          }
          
          // Fallback: If no response in time + 1000ms buffer, make a random move
          const bufferTime = workerRef.current ? 6000 : 1000;
          
          fallbackTimeout = setTimeout(() => {
            const currentState = useGameStore.getState();
            if (currentState.isAIThinking) {
              console.warn('AI took too long or failed. Using fallback heuristic move.');
              const fallbackMove = engine.getBestFallbackMove();
              if (fallbackMove) {
                useGameStore.getState().makeMove(fallbackMove.from, fallbackMove.to, fallbackMove.promotion || 'q');
              }
              useGameStore.setState({ isAIThinking: false });
            }
          }, bufferTime);
        } else {
          clearTimeout(fallbackTimeout);
        }
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);
}
