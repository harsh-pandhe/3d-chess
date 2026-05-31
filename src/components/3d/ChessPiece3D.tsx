/**
 * 3D Chess Piece Component.
 * Uses react-spring for smooth position animations and procedural geometry.
 * Each piece has a stable key (bitwise encoded ID) to maintain identity across moves.
 */

'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { getPieceGeometry } from './piece-geometry';
import { squareToWorld } from '@/engine/types';
import type { PieceType, PieceColor } from '@/engine/types';

interface ChessPiece3DProps {
  type: PieceType;
  color: PieceColor;
  square: string;
  isSelected: boolean;
  onSelect: (square: string) => void;
}

// Color palette for pieces
const PIECE_COLORS = {
  white: {
    base: '#f0e6d6',
    emissive: '#2a2520',
    metalness: 0.3,
    roughness: 0.4,
  },
  black: {
    base: '#1a1a2e',
    emissive: '#0a0a15',
    metalness: 0.5,
    roughness: 0.3,
  },
};

export default function ChessPiece3D({
  type,
  color,
  square,
  isSelected,
  onSelect,
}: ChessPiece3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // Get the target world position for this square
  const targetPos = useMemo(() => squareToWorld(square), [square]);

  // Spring animation for smooth piece movement
  const springProps = useSpring({
    position: [targetPos.x, isSelected ? 0.25 : 0, targetPos.z] as [number, number, number],
    scale: hovered ? [1.08, 1.08, 1.08] as [number, number, number] : [1, 1, 1] as [number, number, number],
    config: { mass: 1, tension: 200, friction: 24 },
  });

  // Create geometry (memoized per piece type)
  const geometry = useMemo(() => getPieceGeometry(type), [type]);

  // Piece height scale factors
  const heightScale = useMemo(() => {
    const scales: Record<PieceType, number> = {
      p: 0.45,
      r: 0.5,
      n: 0.55,
      b: 0.6,
      q: 0.65,
      k: 0.7,
    };
    return scales[type];
  }, [type]);

  // Material properties
  const materialProps = useMemo(() => {
    const palette = color === 'w' ? PIECE_COLORS.white : PIECE_COLORS.black;
    return palette;
  }, [color]);

  // Glow effect when selected
  const emissiveIntensity = isSelected ? 0.8 : hovered ? 0.3 : 0;

  // Hover animation - gentle floating
  useFrame((state) => {
    if (meshRef.current && (isSelected || hovered)) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = Math.sin(t * 2) * 0.03;
    }
  });

  const handlePointerOver = useCallback((e: THREE.Event) => {
    (e as unknown as { stopPropagation: () => void }).stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  const handleClick = useCallback((e: THREE.Event) => {
    (e as unknown as { stopPropagation: () => void }).stopPropagation();
    onSelect(square);
  }, [onSelect, square]);

  return (
    <animated.mesh
      ref={meshRef}
      geometry={geometry}
      position={springProps.position}
      scale={springProps.scale}
      castShadow
      receiveShadow
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <group scale={[1, heightScale / 0.45, 1]}>
        {/* Using the mesh directly with geometry */}
      </group>
      <meshPhysicalMaterial
        color={materialProps.base}
        emissive={isSelected ? '#4a9eff' : hovered ? '#6ab0ff' : materialProps.emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={color === 'w' ? 0.1 : 0.2}
        transmission={0.9}
        thickness={0.5}
        ior={1.5}
        envMapIntensity={2}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </animated.mesh>
  );
}
