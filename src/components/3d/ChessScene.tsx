/**
 * Main 3D Chess Scene.
 * Orchestrates the board, pieces, lighting, camera, and post-processing.
 * This is the primary canvas component.
 */

'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Preload,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import * as THREE from 'three';
import ChessBoard3D from './ChessBoard3D';
import ChessPiece3D from './ChessPiece3D';
import ChessPieceDraco from './ChessPieceDraco';
import { useGameStore } from '@/store/game-store';
import type { ChessPiece } from '@/engine/types';

function SceneContent() {
  const pieces = useGameStore((s) => s.pieces);
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const validMoves = useGameStore((s) => s.validMoves);
  const lastMove = useGameStore((s) => s.lastMove);
  const turn = useGameStore((s) => s.turn);
  const status = useGameStore((s) => s.status);
  const settings = useGameStore((s) => s.settings);
  const engine = useGameStore((s) => s.engine);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const boardRotated = useGameStore((s) => s.boardRotated);

  // Determine if there's a check
  const checkSquare = useMemo(() => {
    if (status === 'check' || status === 'checkmate') {
      return engine.getKingSquare(turn);
    }
    return null;
  }, [status, turn, engine]);

  // Determine which squares have pieces for capture indicators
  const occupiedSquares = useMemo(() => {
    const set = new Set<string>();
    pieces.forEach((p: ChessPiece) => set.add(p.square));
    return set;
  }, [pieces]);

  const handleSquareClick = useCallback(
    (square: string) => {
      selectSquare(square);
    },
    [selectSquare]
  );

  const UseDraco = !!process.env.NEXT_PUBLIC_VERCEL_BLOB_URL;

  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={6}
        maxDistance={16}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-5, 8, -5]}
        intensity={0.4}
        color="#b4c4e0"
      />
      <pointLight position={[0, 6, 0]} intensity={0.3} color="#ffeedd" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Board */}
      <ChessBoard3D
        selectedSquare={selectedSquare}
        validMoves={validMoves}
        lastMove={lastMove}
        checkSquare={checkSquare}
        occupiedSquares={occupiedSquares}
        boardRotated={boardRotated}
        showCoordinates={settings.showCoordinates}
        onSquareClick={handleSquareClick}
      />

      {/* Pieces */}
      <group rotation={boardRotated ? [0, Math.PI, 0] : [0, 0, 0]}>
        {pieces.map((piece: ChessPiece) => 
          UseDraco ? (
            <ChessPieceDraco
              key={piece.stableId}
              type={piece.type}
              color={piece.color}
              square={piece.square}
              isSelected={selectedSquare === piece.square}
              onSelect={handleSquareClick}
            />
          ) : (
            <ChessPiece3D
              key={piece.stableId}
              type={piece.type}
              color={piece.color}
              square={piece.square}
              isSelected={selectedSquare === piece.square}
              onSelect={handleSquareClick}
            />
          )
        )}
      </group>

      {/* Contact shadows under pieces */}
      <ContactShadows
        position={[0, -0.09, 0]}
        opacity={0.5}
        scale={12}
        blur={2}
        far={4}
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.3}
          intensity={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.4} />
      </EffectComposer>

      <Preload all />
    </>
  );
}

/** Loading fallback for the 3D scene */
function SceneLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

export default function ChessScene() {
  return (
    <Canvas
      frameloop="demand"
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{
        position: [0, 8, 8],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1.2,
      }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0a0a0f']} />
      <fog attach="fog" args={['#0a0a0f', 15, 30]} />
      <Suspense fallback={<SceneLoader />}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
