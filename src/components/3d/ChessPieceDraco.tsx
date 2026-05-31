/**
 * Optimized Draco-compressed 3D Chess Piece Component.
 * 
 * ARCHITECTURE COMPLIANCE:
 * This component is designed to load heavily compressed .glb files (Draco/Meshopt)
 * hosted on Vercel Blob to bypass the 4.5MB serverless limit and utilize the global CDN.
 */

'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { squareToWorld } from '@/engine/types';
import type { PieceType, PieceColor } from '@/engine/types';

interface ChessPieceDracoProps {
  type: PieceType;
  color: PieceColor;
  square: string;
  isSelected: boolean;
  onSelect: (square: string) => void;
}

// Ensure you set this in your Vercel Dashboard Environment Variables!
const VERCEL_BLOB_URL = process.env.NEXT_PUBLIC_VERCEL_BLOB_URL || '';

export default function ChessPieceDraco({
  type,
  color,
  square,
  isSelected,
  onSelect,
}: ChessPieceDracoProps) {
  const meshRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  // Load the Draco compressed GLTF from Vercel Blob CDN
  // The 'true' parameter automatically configures the DRACOLoader via Google CDN
  const { nodes, materials } = useGLTF(
    `${VERCEL_BLOB_URL}/optimized-chess-set-draco.glb`, 
    true 
  ) as any;

  // Map our internal piece types ('p', 'n', 'b', 'r', 'q', 'k') to the mesh names in your GLB
  const meshName = useMemo(() => {
    const map: Record<PieceType, string> = {
      p: 'Pawn',
      n: 'Knight',
      b: 'Bishop',
      r: 'Rook',
      q: 'Queen',
      k: 'King'
    };
    return `${color === 'w' ? 'White' : 'Black'}_${map[type]}`;
  }, [type, color]);

  const targetPos = useMemo(() => squareToWorld(square), [square]);

  // Spring animation for smooth movement (decoupled from the high-frequency engine)
  const springProps = useSpring({
    position: [targetPos.x, isSelected ? 0.25 : 0, targetPos.z] as [number, number, number],
    scale: hovered ? [1.08, 1.08, 1.08] as [number, number, number] : [1, 1, 1] as [number, number, number],
    config: { mass: 1, tension: 200, friction: 24 },
  });

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

  // Safety fallback if the Vercel Blob URL isn't configured or model fails to load
  if (!nodes || !nodes[meshName]) {
    return null;
  }

  return (
    <animated.group
      ref={meshRef}
      position={springProps.position}
      scale={springProps.scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={nodes[meshName].geometry}
        material={materials[color === 'w' ? 'WhiteGlassMaterial' : 'BlackGlassMaterial']}
      >
        {/* Selection Glow Indicator overlay */}
        {(isSelected || hovered) && (
          <meshStandardMaterial 
            color={color === 'w' ? '#f0e6d6' : '#1a1a2e'}
            emissive={isSelected ? '#4a9eff' : '#6ab0ff'}
            emissiveIntensity={isSelected ? 0.8 : 0.3}
            transparent
            opacity={0.5}
          />
        )}
      </mesh>
    </animated.group>
  );
}

// Preload the assets from the CDN to avoid pop-in
if (VERCEL_BLOB_URL) {
  useGLTF.preload(`${VERCEL_BLOB_URL}/optimized-chess-set-draco.glb`, true);
}
