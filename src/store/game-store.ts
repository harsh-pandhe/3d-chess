/**
 * Zustand Store — Single shared state between Engine, 3D Canvas, and React UI.
 * This is the state layer that bridges the engine and the UI.
 * 
 * Design: The store uses subscriptions and selectors to ensure that
 * only the relevant parts of the UI re-render when state changes.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ChessEngine } from '@/engine/chess-engine';
import type {
  ChessPiece,
  PieceColor,
  PieceType,
  MoveRecord,
  GameMode,
  GameStatus,
  GameSettings,
  AIDifficulty,
} from '@/engine/types';

interface GameState {
  // Engine instance
  engine: ChessEngine;

  // Board state
  pieces: ChessPiece[];
  selectedSquare: string | null;
  validMoves: string[];
  lastMove: { from: string; to: string } | null;
  
  // Game state
  turn: PieceColor;
  status: GameStatus;
  moveHistory: MoveRecord[];
  capturedPieces: { white: PieceType[]; black: PieceType[] };
  
  // Settings
  settings: GameSettings;

  // Timers
  whiteTime: number;
  blackTime: number;
  timerActive: boolean;

  // AI state
  isAIThinking: boolean;
  aiWorker: Worker | null;

  // UI state
  showPromotionDialog: boolean;
  promotionSquare: { from: string; to: string } | null;
  boardRotated: boolean;

  // Actions
  selectSquare: (square: string | null) => void;
  makeMove: (from: string, to: string, promotion?: PieceType) => boolean;
  promoteAndMove: (type: PieceType) => void;
  newGame: (settings?: Partial<GameSettings>) => void;
  undoMove: () => void;
  resignGame: () => void;
  setSettings: (settings: Partial<GameSettings>) => void;
  toggleBoardRotation: () => void;
  updateTimer: (color: PieceColor, time: number) => void;
  setTimerActive: (active: boolean) => void;
  
  // AI actions
  requestAIMove: () => void;
  setAIWorker: (worker: Worker | null) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  mode: 'local',
  aiDifficulty: 'intermediate',
  timeControl: 10,
  increment: 5,
  playerColor: 'w',
  enableSounds: true,
  enableAnimations: true,
  showCoordinates: true,
  boardTheme: 'midnight',
};

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => {
    const engine = new ChessEngine();

    return {
      engine,
      pieces: engine.getPieces(),
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      turn: 'w',
      status: 'idle',
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      settings: DEFAULT_SETTINGS,
      whiteTime: DEFAULT_SETTINGS.timeControl * 60 * 1000,
      blackTime: DEFAULT_SETTINGS.timeControl * 60 * 1000,
      timerActive: false,
      isAIThinking: false,
      aiWorker: null,
      showPromotionDialog: false,
      promotionSquare: null,
      boardRotated: false,

      selectSquare: (square: string | null) => {
        const { engine, selectedSquare, turn, status, settings, isAIThinking } = get();
        
        // Don't allow moves during AI turn or when game is over
        if (status !== 'playing' && status !== 'check' && status !== 'idle') return;
        if (settings.mode === 'ai' && turn !== settings.playerColor) return;
        if (isAIThinking) return;

        if (square === null) {
          set({ selectedSquare: null, validMoves: [] });
          return;
        }

        // If a square is already selected, try to make a move
        if (selectedSquare) {
          const validMoves = get().validMoves;
          if (validMoves.includes(square)) {
            // Check if this is a pawn promotion
            const piece = engine.getPieceAt(selectedSquare);
            if (piece && piece.type === 'p') {
              const isPromotion = 
                (piece.color === 'w' && square[1] === '8') ||
                (piece.color === 'b' && square[1] === '1');
              if (isPromotion) {
                set({
                  showPromotionDialog: true,
                  promotionSquare: { from: selectedSquare, to: square },
                });
                return;
              }
            }
            get().makeMove(selectedSquare, square);
            return;
          }
        }

        // Select the square if it has a piece of the current turn
        const piece = engine.getPieceAt(square);
        if (piece && piece.color === turn) {
          const moves = engine.getValidMoves(square);
          set({ selectedSquare: square, validMoves: moves });
        } else {
          set({ selectedSquare: null, validMoves: [] });
        }
      },

      makeMove: (from: string, to: string, promotion?: PieceType) => {
        const { engine, settings, capturedPieces } = get();
        
        const moveRecord = engine.makeMove(from, to, promotion);
        if (!moveRecord) return false;

        // Update captured pieces
        const newCaptured = { ...capturedPieces };
        if (moveRecord.captured) {
          if (moveRecord.color === 'w') {
            newCaptured.black = [...newCaptured.black, moveRecord.captured];
          } else {
            newCaptured.white = [...newCaptured.white, moveRecord.captured];
          }
        }

        // Determine game status
        let status: GameStatus = 'playing';
        if (engine.isCheckmate()) {
          status = 'checkmate';
        } else if (engine.isStalemate()) {
          status = 'stalemate';
        } else if (engine.isDraw()) {
          status = 'draw';
        } else if (engine.isCheck()) {
          status = 'check';
        }

        set({
          pieces: engine.getPieces(),
          selectedSquare: null,
          validMoves: [],
          lastMove: { from, to },
          turn: engine.turn(),
          status,
          moveHistory: [...get().moveHistory, moveRecord],
          capturedPieces: newCaptured,
          showPromotionDialog: false,
          promotionSquare: null,
        });

        // Request AI move if in AI mode and it's AI's turn
        if (settings.mode === 'ai' && engine.turn() !== settings.playerColor && !engine.isGameOver()) {
          setTimeout(() => get().requestAIMove(), 300);
        }

        return true;
      },

      promoteAndMove: (type: PieceType) => {
        const { promotionSquare } = get();
        if (promotionSquare) {
          get().makeMove(promotionSquare.from, promotionSquare.to, type);
        }
      },

      newGame: (settingsOverride?: Partial<GameSettings>) => {
        const currentSettings = get().settings;
        const newSettings = { ...currentSettings, ...settingsOverride };
        const { engine } = get();
        engine.reset();

        const timeMs = newSettings.timeControl * 60 * 1000;

        set({
          pieces: engine.getPieces(),
          selectedSquare: null,
          validMoves: [],
          lastMove: null,
          turn: 'w',
          status: 'playing',
          moveHistory: [],
          capturedPieces: { white: [], black: [] },
          settings: newSettings,
          whiteTime: timeMs,
          blackTime: timeMs,
          timerActive: false,
          isAIThinking: false,
          showPromotionDialog: false,
          promotionSquare: null,
          boardRotated: newSettings.playerColor === 'b',
        });

        // If AI mode and AI goes first
        if (newSettings.mode === 'ai' && newSettings.playerColor === 'b') {
          setTimeout(() => get().requestAIMove(), 500);
        }
      },

      undoMove: () => {
        const { engine, settings } = get();
        const move = engine.undo();
        if (!move) return;

        // In AI mode, undo both AI and player move
        if (settings.mode === 'ai') {
          engine.undo();
        }

        const newHistory = [...get().moveHistory];
        newHistory.pop();
        if (settings.mode === 'ai') newHistory.pop();

        set({
          pieces: engine.getPieces(),
          selectedSquare: null,
          validMoves: [],
          lastMove: null,
          turn: engine.turn(),
          status: engine.isCheck() ? 'check' : 'playing',
          moveHistory: newHistory,
        });
      },

      resignGame: () => {
        set({ status: 'resigned', timerActive: false });
      },

      setSettings: (newSettings: Partial<GameSettings>) => {
        set({ settings: { ...get().settings, ...newSettings } });
      },

      toggleBoardRotation: () => {
        set({ boardRotated: !get().boardRotated });
      },

      updateTimer: (color: PieceColor, time: number) => {
        if (color === 'w') {
          set({ whiteTime: time });
        } else {
          set({ blackTime: time });
        }
        if (time <= 0) {
          set({ status: 'timeout', timerActive: false });
        }
      },

      setTimerActive: (active: boolean) => {
        set({ timerActive: active });
      },

      requestAIMove: () => {
        const { engine, aiWorker, settings } = get();
        if (engine.isGameOver()) return;

        set({ isAIThinking: true });

        const depthMap: Record<AIDifficulty, number> = {
          beginner: 3,
          intermediate: 8,
          advanced: 14,
          master: 20,
        };

        if (aiWorker) {
          const depth = depthMap[settings.aiDifficulty];
          aiWorker.postMessage({
            type: 'position',
            fen: engine.fen(),
            depth,
          });
        } else {
          // Fallback: heuristic move
          setTimeout(() => {
            const fallbackMove = engine.getBestFallbackMove();
            if (fallbackMove) {
              get().makeMove(fallbackMove.from, fallbackMove.to, fallbackMove.promotion || 'q');
            }
            set({ isAIThinking: false });
          }, 500);
        }
      },

      setAIWorker: (worker: Worker | null) => {
        set({ aiWorker: worker });
      },
    };
  })
);

// Derived selectors for performance - only subscribe to specific slices
export const usePieces = () => useGameStore((s) => s.pieces);
export const useSelectedSquare = () => useGameStore((s) => s.selectedSquare);
export const useValidMoves = () => useGameStore((s) => s.validMoves);
export const useLastMove = () => useGameStore((s) => s.lastMove);
export const useTurn = () => useGameStore((s) => s.turn);
export const useGameStatus = () => useGameStore((s) => s.status);
export const useMoveHistory = () => useGameStore((s) => s.moveHistory);
export const useSettings = () => useGameStore((s) => s.settings);
export const useIsAIThinking = () => useGameStore((s) => s.isAIThinking);
