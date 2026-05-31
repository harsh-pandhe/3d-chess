/**
 * Chess Engine - Wrapper around chess.js with stable piece tracking.
 * This is the engine layer - pure TypeScript, no React dependencies.
 */

import { Chess, type Move, type Square, type PieceSymbol, type Color } from 'chess.js';
import { 
  type ChessPiece, 
  type PieceType, 
  type PieceColor, 
  type MoveRecord,
  generateStableId 
} from './types';

export class ChessEngine {
  private game: Chess;
  private pieceRegistry: Map<string, ChessPiece>; // stableId -> piece
  private instanceCounters: Map<string, number>;   // "type-color" -> next instance

  constructor(fen?: string) {
    this.game = new Chess(fen);
    this.pieceRegistry = new Map();
    this.instanceCounters = new Map();
    this.initializePieceRegistry();
  }

  /** Initialize piece registry from the starting position */
  private initializePieceRegistry(): void {
    this.pieceRegistry.clear();
    this.instanceCounters.clear();

    const board = this.game.board();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square) {
          const type = square.type as PieceType;
          const color = square.color as PieceColor;
          const instance = this.getNextInstance(type, color);
          const stableId = generateStableId(type, color, instance);
          
          const notation = String.fromCharCode(97 + file) + (8 - rank);
          
          this.pieceRegistry.set(String(stableId), {
            type,
            color,
            square: notation,
            stableId,
          });
        }
      }
    }
  }

  private getNextInstance(type: PieceType, color: PieceColor): number {
    const key = `${type}-${color}`;
    const current = this.instanceCounters.get(key) || 0;
    this.instanceCounters.set(key, current + 1);
    return current;
  }

  /** Get all current pieces with their stable IDs */
  getPieces(): ChessPiece[] {
    return Array.from(this.pieceRegistry.values());
  }

  /** Get piece at a specific square */
  getPieceAt(square: string): ChessPiece | null {
    for (const piece of this.pieceRegistry.values()) {
      if (piece.square === square) {
        return piece;
      }
    }
    return null;
  }

  /** Get valid moves for a piece at a given square */
  getValidMoves(square: string): string[] {
    const moves = this.game.moves({ square: square as Square, verbose: true });
    return moves.map((m: Move) => m.to);
  }

  /** Attempt to make a move. Returns the move record if successful, null otherwise. */
  makeMove(from: string, to: string, promotion?: PieceType): MoveRecord | null {
    try {
      const move = this.game.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion as PieceSymbol | undefined,
      });

      if (!move) return null;

      // Update piece registry
      this.updateRegistryAfterMove(move);

      return {
        from: move.from,
        to: move.to,
        san: move.san,
        piece: move.piece as PieceType,
        color: move.color as PieceColor,
        captured: move.captured as PieceType | undefined,
        promotion: move.promotion as PieceType | undefined,
        flags: move.flags,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  /** Update the piece registry after a move */
  private updateRegistryAfterMove(move: Move): void {
    // Find the piece that moved
    const movedPiece = this.getPieceAt(move.from);
    if (!movedPiece) return;

    // Handle capture - remove captured piece
    if (move.captured) {
      let capturedSquare = move.to;
      // En passant: captured pawn is not on the destination square
      if (move.flags.includes('e')) {
        const epRank = move.color === 'w' ? '5' : '4';
        capturedSquare = move.to[0] + epRank;
      }
      
      for (const [key, piece] of this.pieceRegistry.entries()) {
        if (piece.square === capturedSquare && piece.color !== move.color) {
          this.pieceRegistry.delete(key);
          break;
        }
      }
    }

    // Update the moved piece's square
    movedPiece.square = move.to;

    // Handle promotion
    if (move.promotion) {
      movedPiece.type = move.promotion as PieceType;
    }

    // Handle castling - move the rook
    if (move.flags.includes('k') || move.flags.includes('q')) {
      const isKingside = move.flags.includes('k');
      const rank = move.color === 'w' ? '1' : '8';
      const rookFrom = isKingside ? `h${rank}` : `a${rank}`;
      const rookTo = isKingside ? `f${rank}` : `d${rank}`;
      
      const rook = this.getPieceAt(rookFrom);
      if (rook) {
        rook.square = rookTo;
      }
    }
  }

  /** Get the current turn color */
  turn(): PieceColor {
    return this.game.turn() as PieceColor;
  }

  /** Check if the current player is in check */
  isCheck(): boolean {
    return this.game.isCheck();
  }

  /** Check if the game is over (checkmate, stalemate, draw) */
  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  /** Check if it's checkmate */
  isCheckmate(): boolean {
    return this.game.isCheckmate();
  }

  /** Check if it's stalemate */
  isStalemate(): boolean {
    return this.game.isStalemate();
  }

  /** Check if it's a draw */
  isDraw(): boolean {
    return this.game.isDraw();
  }

  /** Get FEN string of current position */
  fen(): string {
    return this.game.fen();
  }

  /** Get the full move history */
  history(): string[] {
    return this.game.history();
  }

  /** Get PGN representation */
  pgn(): string {
    return this.game.pgn();
  }

  /** Reset the game to starting position */
  reset(): void {
    this.game.reset();
    this.initializePieceRegistry();
  }

  /** Load a game from FEN */
  load(fen: string): boolean {
    try {
      this.game.load(fen);
      this.initializePieceRegistry();
      return true;
    } catch {
      return false;
    }
  }

  /** Undo the last move */
  undo(): Move | null {
    const move = this.game.undo();
    if (move) {
      // Re-initialize registry from current board state
      this.pieceRegistry.clear();
      this.instanceCounters.clear();
      this.initializePieceRegistry();
    }
    return move;
  }

  /** Get the king's square for a color */
  getKingSquare(color: PieceColor): string | null {
    const board = this.game.board();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const sq = board[rank][file];
        if (sq && sq.type === 'k' && sq.color === color) {
          return String.fromCharCode(97 + file) + (8 - rank);
        }
      }
    }
    return null;
  }

  /** Get all valid moves for the current player */
  getAllValidMoves(): Move[] {
    return this.game.moves({ verbose: true });
  }

  /** Get move count */
  moveNumber(): number {
    return this.game.moveNumber();
  }

  /** Basic heuristic AI fallback (when Stockfish fails) */
  getBestFallbackMove(): Move | null {
    const moves = this.getAllValidMoves();
    if (moves.length === 0) return null;

    const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    let bestMove = moves[0];
    let maxScore = -1000;

    for (const move of moves) {
      // Base score with some randomness to avoid predictable play
      let score = Math.random() * 5;

      if (move.captured) {
        score += pieceValues[move.captured] || 0;
      }
      
      if (move.promotion) {
        score += 80; // Value promotions highly
      }
      
      // Bonus for checking the opponent
      if (move.san.includes('+')) {
        score += 15;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }
}
