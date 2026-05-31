/**
 * Procedural 3D Chess Piece Geometry Generator.
 * Creates chess piece meshes using parametric geometry instead of external GLTF files.
 * This avoids asset loading issues and keeps the bundle self-contained.
 */

import * as THREE from 'three';

/** Create a lathe geometry from a profile (revolution solid) */
function createLatheGeometry(
  points: [number, number][],
  segments: number = 32
): THREE.LatheGeometry {
  const vectors = points.map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(vectors, segments);
}

/** Create a pawn mesh */
export function createPawnGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0, 0],
    [0.35, 0],
    [0.35, 0.05],
    [0.3, 0.08],
    [0.2, 0.1],
    [0.15, 0.15],
    [0.13, 0.2],
    [0.12, 0.3],
    [0.14, 0.35],
    [0.18, 0.38],
    [0.18, 0.42],
    [0.14, 0.45],
    [0.12, 0.5],
    [0.12, 0.55],
    [0.15, 0.6],
    [0.17, 0.62],
    [0.17, 0.65],
    [0.15, 0.68],
    [0.12, 0.72],
    [0.08, 0.78],
    [0, 0.82],
  ];
  return createLatheGeometry(points);
}

/** Create a rook mesh */
export function createRookGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0, 0],
    [0.38, 0],
    [0.38, 0.05],
    [0.32, 0.08],
    [0.22, 0.1],
    [0.18, 0.12],
    [0.16, 0.18],
    [0.15, 0.25],
    [0.15, 0.55],
    [0.17, 0.58],
    [0.22, 0.6],
    [0.25, 0.62],
    [0.25, 0.72],
    [0.28, 0.74],
    [0.28, 0.82],
    [0.22, 0.82],
    [0.22, 0.78],
    [0.18, 0.78],
    [0.18, 0.82],
    [0.12, 0.82],
    [0.12, 0.78],
    [0.06, 0.78],
    [0.06, 0.82],
    [0, 0.82],
  ];
  return createLatheGeometry(points, 4); // 4 segments for boxy look
}

/** Create a knight mesh - this one uses a custom shape since it can't be lathed */
export function createKnightGeometry(): THREE.BufferGeometry {
  // Knight base (lathed)
  const basePoints: [number, number][] = [
    [0, 0],
    [0.35, 0],
    [0.35, 0.05],
    [0.3, 0.08],
    [0.2, 0.1],
    [0.16, 0.15],
    [0.14, 0.2],
    [0.13, 0.3],
    [0.15, 0.35],
    [0.18, 0.38],
    [0.18, 0.42],
    [0.15, 0.45],
  ];
  const base = createLatheGeometry(basePoints);

  // Knight head shape (extruded)
  const shape = new THREE.Shape();
  shape.moveTo(-0.12, 0.45);
  shape.lineTo(-0.15, 0.5);
  shape.lineTo(-0.18, 0.6);
  shape.lineTo(-0.2, 0.7);
  shape.lineTo(-0.15, 0.8);
  shape.lineTo(-0.08, 0.88);
  shape.lineTo(0.0, 0.92);
  shape.lineTo(0.1, 0.9);
  shape.lineTo(0.18, 0.82);
  shape.lineTo(0.2, 0.72);
  shape.lineTo(0.18, 0.62);
  shape.lineTo(0.15, 0.55);
  shape.lineTo(0.12, 0.48);
  shape.lineTo(0.12, 0.45);
  shape.lineTo(-0.12, 0.45);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 4,
  };

  const head = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  head.translate(0, 0, -0.09);

  // Merge geometries
  const merged = mergeBufferGeometries([base, head]);
  return merged || base;
}

/** Create a bishop mesh */
export function createBishopGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0, 0],
    [0.35, 0],
    [0.35, 0.05],
    [0.3, 0.08],
    [0.2, 0.1],
    [0.16, 0.15],
    [0.14, 0.2],
    [0.12, 0.3],
    [0.14, 0.35],
    [0.18, 0.38],
    [0.18, 0.42],
    [0.14, 0.45],
    [0.1, 0.5],
    [0.08, 0.58],
    [0.1, 0.65],
    [0.14, 0.7],
    [0.12, 0.75],
    [0.08, 0.82],
    [0.04, 0.88],
    [0.02, 0.92],
    [0.04, 0.95],
    [0.03, 0.98],
    [0, 1.0],
  ];
  return createLatheGeometry(points);
}

/** Create a queen mesh */
export function createQueenGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0, 0],
    [0.38, 0],
    [0.38, 0.05],
    [0.32, 0.08],
    [0.22, 0.1],
    [0.18, 0.15],
    [0.16, 0.2],
    [0.14, 0.3],
    [0.16, 0.35],
    [0.2, 0.38],
    [0.2, 0.42],
    [0.16, 0.45],
    [0.12, 0.52],
    [0.1, 0.6],
    [0.12, 0.68],
    [0.16, 0.72],
    [0.2, 0.75],
    [0.18, 0.8],
    [0.14, 0.85],
    [0.1, 0.9],
    [0.06, 0.95],
    [0.03, 1.0],
    [0.06, 1.04],
    [0.04, 1.08],
    [0, 1.1],
  ];
  return createLatheGeometry(points);
}

/** Create a king mesh */
export function createKingGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0, 0],
    [0.4, 0],
    [0.4, 0.05],
    [0.34, 0.08],
    [0.24, 0.1],
    [0.2, 0.15],
    [0.18, 0.2],
    [0.16, 0.3],
    [0.18, 0.35],
    [0.22, 0.38],
    [0.22, 0.42],
    [0.18, 0.45],
    [0.14, 0.52],
    [0.12, 0.6],
    [0.14, 0.68],
    [0.18, 0.72],
    [0.22, 0.75],
    [0.2, 0.8],
    [0.16, 0.85],
    [0.12, 0.92],
    [0.08, 0.98],
    [0.04, 1.04],
    [0, 1.08],
  ];
  const body = createLatheGeometry(points);

  // King's cross
  const crossVertical = new THREE.BoxGeometry(0.04, 0.18, 0.04);
  crossVertical.translate(0, 1.16, 0);
  const crossHorizontal = new THREE.BoxGeometry(0.14, 0.04, 0.04);
  crossHorizontal.translate(0, 1.12, 0);

  const merged = mergeBufferGeometries([body, crossVertical, crossHorizontal]);
  return merged || body;
}

/** Simple buffer geometry merge utility */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0];

  // Calculate total vertex count
  let totalPositions = 0;
  let totalNormals = 0;
  let totalIndices = 0;

  for (const geo of geometries) {
    geo.computeVertexNormals();
    const pos = geo.getAttribute('position');
    const norm = geo.getAttribute('normal');
    const idx = geo.getIndex();
    if (pos) totalPositions += pos.count;
    if (norm) totalNormals += norm.count;
    if (idx) totalIndices += idx.count;
    else if (pos) totalIndices += pos.count;
  }

  const positions = new Float32Array(totalPositions * 3);
  const normals = new Float32Array(totalNormals * 3);
  const indices = new Uint32Array(totalIndices);

  let posOffset = 0;
  let normOffset = 0;
  let idxOffset = 0;
  let vertexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.getAttribute('position');
    const norm = geo.getAttribute('normal');
    const idx = geo.getIndex();

    if (pos) {
      for (let i = 0; i < pos.count * 3; i++) {
        positions[posOffset + i] = (pos.array as Float32Array)[i];
      }
    }
    if (norm) {
      for (let i = 0; i < norm.count * 3; i++) {
        normals[normOffset + i] = (norm.array as Float32Array)[i];
      }
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices[idxOffset + i] = (idx.array as Uint16Array | Uint32Array)[i] + vertexOffset;
      }
      idxOffset += idx.count;
    } else if (pos) {
      for (let i = 0; i < pos.count; i++) {
        indices[idxOffset + i] = i + vertexOffset;
      }
      idxOffset += pos.count;
    }

    if (pos) {
      vertexOffset += pos.count;
      posOffset += pos.count * 3;
    }
    if (norm) {
      normOffset += norm.count * 3;
    }
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();

  return merged;
}

/** Get geometry for a piece type */
export function getPieceGeometry(type: string): THREE.BufferGeometry {
  switch (type) {
    case 'p': return createPawnGeometry();
    case 'r': return createRookGeometry();
    case 'n': return createKnightGeometry();
    case 'b': return createBishopGeometry();
    case 'q': return createQueenGeometry();
    case 'k': return createKingGeometry();
    default: return createPawnGeometry();
  }
}
