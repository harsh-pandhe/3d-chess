/**
 * Core type definitions for the 3D Chess Engine.
 * These types are shared between the engine layer, state layer, and UI layer.
 */

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  square: string;
  /** Stable ID for animations - bitwise encoded: (Instance << 4) | (Color << 3) | Type */
  stableId: number;
}

export interface BoardSquare {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
  notation: string; // e.g., "e4"
  piece: ChessPiece | null;
  isHighlighted: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
}

export interface MoveRecord {
  from: string;
  to: string;
  san: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
  timestamp: number;
}

export interface GameTimers {
  white: number; // ms remaining
  black: number;
  increment: number; // ms per move
  isRunning: boolean;
  activeColor: PieceColor;
}

export type GameMode = 'local' | 'ai' | 'online';
export type GameStatus = 'idle' | 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'timeout';
export type AIDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface GameSettings {
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  timeControl: number; // minutes
  increment: number; // seconds
  playerColor: PieceColor;
  enableSounds: boolean;
  enableAnimations: boolean;
  showCoordinates: boolean;
  boardTheme: 'classic' | 'modern' | 'midnight' | 'ocean';
}

/** 3D world coordinates for piece placement */
export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

/** Maps algebraic notation to 3D world coordinates */
export function squareToWorld(square: string): WorldPosition {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, ...
  const rank = parseInt(square[1]) - 1;   // 1=0, 2=1, ...
  return {
    x: (file - 3.5) * 1.0,
    y: 0.0,
    z: (rank - 3.5) * -1.0,
  };
}

/** Piece type enum values for bitwise encoding */
const PIECE_TYPE_MAP: Record<PieceType, number> = {
  'p': 0, 'n': 1, 'b': 2, 'r': 3, 'q': 4, 'k': 5
};

/**
 * Generate a stable integer ID for a chess piece.
 * Format: (Instance << 4) | (Color << 3) | Type
 * This ensures React keys remain stable across moves for smooth animations.
 */
export function generateStableId(type: PieceType, color: PieceColor, instance: number): number {
  const colorBit = color === 'w' ? 0 : 1;
  const typeBits = PIECE_TYPE_MAP[type];
  return (instance << 4) | (colorBit << 3) | typeBits;
}

/** Decode a stable ID back to its components */
export function decodeStableId(id: number): { type: PieceType; color: PieceColor; instance: number } {
  const typeBits = id & 0b111;
  const colorBit = (id >> 3) & 1;
  const instance = id >> 4;
  
  const typeEntries = Object.entries(PIECE_TYPE_MAP);
  const typeEntry = typeEntries.find(([, val]) => val === typeBits);
  
  return {
    type: (typeEntry ? typeEntry[0] : 'p') as PieceType,
    color: colorBit === 0 ? 'w' : 'b',
    instance,
  };
}
