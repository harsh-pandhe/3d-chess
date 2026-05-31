/**
 * 3D Chess Board Component.
 * Renders the 8x8 grid with interactive squares, highlighting, and coordinates.
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { squareToWorld } from '@/engine/types';

interface ChessBoard3DProps {
  selectedSquare: string | null;
  validMoves: string[];
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  occupiedSquares: Set<string>;
  boardRotated: boolean;
  showCoordinates: boolean;
  onSquareClick: (square: string) => void;
}

// Board color themes
const BOARD_COLORS = {
  light: '#c8b899',
  dark: '#7b6b4f',
  selected: '#f7d359',
  validMove: '#6bcf7f',
  validCapture: '#e85d5d',
  lastMoveFrom: '#b8d4e8',
  lastMoveTo: '#8ec4e8',
  check: '#ff4444',
};

function BoardSquare({
  file,
  rank,
  isLight,
  isSelected,
  isValidMove,
  isLastMoveFrom,
  isLastMoveTo,
  isCheck,
  hasOccupant,
  onClick,
}: {
  file: number;
  rank: number;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isCheck: boolean;
  hasOccupant: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const notation = String.fromCharCode(97 + file) + (rank + 1);
  const pos = squareToWorld(notation);

  // Determine square color
  let color = isLight ? BOARD_COLORS.light : BOARD_COLORS.dark;
  let emissive = '#000000';
  let emissiveIntensity = 0;

  if (isCheck) {
    emissive = BOARD_COLORS.check;
    emissiveIntensity = 0.6;
  } else if (isSelected) {
    color = BOARD_COLORS.selected;
    emissive = '#ffd700';
    emissiveIntensity = 0.3;
  } else if (isValidMove) {
    emissive = hasOccupant ? BOARD_COLORS.validCapture : BOARD_COLORS.validMove;
    emissiveIntensity = hovered ? 0.6 : 0.3;
  } else if (isLastMoveFrom || isLastMoveTo) {
    color = isLastMoveFrom ? BOARD_COLORS.lastMoveFrom : BOARD_COLORS.lastMoveTo;
    emissiveIntensity = 0.15;
    emissive = '#88bbdd';
  }

  return (
    <mesh
      position={[pos.x, -0.05, pos.z]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (isValidMove) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={0.1}
        roughness={0.8}
      />
      {/* Valid move indicator dot */}
      {isValidMove && !hasOccupant && (
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
          <meshStandardMaterial
            color={BOARD_COLORS.validMove}
            transparent
            opacity={0.7}
            emissive={BOARD_COLORS.validMove}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
      {/* Valid capture ring indicator */}
      {isValidMove && hasOccupant && (
        <mesh position={[0, 0.06, 0]}>
          <torusGeometry args={[0.35, 0.05, 8, 24]} />
          <meshStandardMaterial
            color={BOARD_COLORS.validCapture}
            transparent
            opacity={0.7}
            emissive={BOARD_COLORS.validCapture}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </mesh>
  );
}

export default function ChessBoard3D({
  selectedSquare,
  validMoves,
  lastMove,
  checkSquare,
  occupiedSquares,
  boardRotated,
  showCoordinates,
  onSquareClick,
}: ChessBoard3DProps) {

  // Generate the 64 squares
  const squares = useMemo(() => {
    const result: { file: number; rank: number; isLight: boolean; notation: string }[] = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const isLight = (file + rank) % 2 === 1;
        const notation = String.fromCharCode(97 + file) + (rank + 1);
        result.push({ file, rank, isLight, notation });
      }
    }
    return result;
  }, []);

  const handleSquareClick = useCallback(
    (notation: string) => {
      onSquareClick(notation);
    },
    [onSquareClick]
  );

  return (
    <group rotation={boardRotated ? [0, Math.PI, 0] : [0, 0, 0]}>
      {/* Board frame / border */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[9, 0.12, 9]} />
        <meshStandardMaterial
          color="#3d2e1f"
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>

      {/* Glass layer over the board for aesthetics */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[8, 0.01, 8]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.3}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Board squares */}
      {squares.map(({ file, rank, isLight, notation }) => (
        <BoardSquare
          key={notation}
          file={file}
          rank={rank}
          isLight={isLight}
          isSelected={selectedSquare === notation}
          isValidMove={validMoves.includes(notation)}
          isLastMoveFrom={lastMove?.from === notation}
          isLastMoveTo={lastMove?.to === notation}
          isCheck={checkSquare === notation}
          hasOccupant={occupiedSquares.has(notation)}
          onClick={() => handleSquareClick(notation)}
        />
      ))}

      {/* Coordinate labels */}
      {showCoordinates && (
        <>
          {/* File labels (a-h) */}
          {Array.from({ length: 8 }, (_, i) => (
            <Text
              key={`file-${i}`}
              position={[(i - 3.5), -0.08, 4.2]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.2}
              color="#a09080"
              anchorX="center"
              anchorY="middle"
            >
              {String.fromCharCode(97 + i)}
            </Text>
          ))}
          {/* Rank labels (1-8) */}
          {Array.from({ length: 8 }, (_, i) => (
            <Text
              key={`rank-${i}`}
              position={[-4.2, -0.08, (i - 3.5) * -1]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.2}
              color="#a09080"
              anchorX="center"
              anchorY="middle"
            >
              {String(i + 1)}
            </Text>
          ))}
        </>
      )}
    </group>
  );
}
