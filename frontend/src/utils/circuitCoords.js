// src/utils/circuitCoords.js
// SVG path data for F1 circuit maps (normalized to 200x200 viewBox)
// Paths are approximate representations for UI visualization

export const CIRCUIT_SVG_PATHS = {
  monaco: {
    viewBox: '0 0 200 200',
    sectors: [
      { id: 'S1', path: 'M 100,20 L 140,20 L 160,40 L 160,80 L 140,100' },
      { id: 'S2', path: 'M 140,100 L 120,120 L 80,130 L 60,120 L 40,100' },
      { id: 'S3', path: 'M 40,100 L 40,60 L 60,40 L 100,20' },
    ],
    drsZones: [
      { path: 'M 100,20 L 140,20', start: { x: 100, y: 20 }, end: { x: 140, y: 20 } },
    ],
  },
  silverstone: {
    viewBox: '0 0 200 200',
    sectors: [
      { id: 'S1', path: 'M 30,100 L 30,60 L 50,40 L 100,30 L 150,40' },
      { id: 'S2', path: 'M 150,40 L 170,60 L 170,100 L 150,130 L 120,150' },
      { id: 'S3', path: 'M 120,150 L 80,160 L 50,150 L 30,130 L 30,100' },
    ],
    drsZones: [
      { path: 'M 100,30 L 150,40', start: { x: 100, y: 30 }, end: { x: 150, y: 40 } },
      { path: 'M 30,130 L 30,100', start: { x: 30, y: 130 }, end: { x: 30, y: 100 } },
    ],
  },
  monza: {
    viewBox: '0 0 200 200',
    sectors: [
      { id: 'S1', path: 'M 40,100 L 40,40 L 100,20 L 160,40' },
      { id: 'S2', path: 'M 160,40 L 160,100 L 140,120' },
      { id: 'S3', path: 'M 140,120 L 100,160 L 60,150 L 40,130 L 40,100' },
    ],
    drsZones: [
      { path: 'M 40,40 L 160,40', start: { x: 40, y: 40 }, end: { x: 160, y: 40 } },
      { path: 'M 40,130 L 40,100', start: { x: 40, y: 130 }, end: { x: 40, y: 100 } },
      { path: 'M 160,100 L 160,40', start: { x: 160, y: 100 }, end: { x: 160, y: 40 } },
    ],
  },
  spa: {
    viewBox: '0 0 200 200',
    sectors: [
      { id: 'S1', path: 'M 20,90 L 40,50 L 90,20 L 150,40 L 170,60' },
      { id: 'S2', path: 'M 170,60 L 180,90 L 160,130 L 130,150' },
      { id: 'S3', path: 'M 130,150 L 90,170 L 50,160 L 20,130 L 20,90' },
    ],
    drsZones: [
      { path: 'M 20,90 L 40,50', start: { x: 20, y: 90 }, end: { x: 40, y: 50 } },
      { path: 'M 170,60 L 180,90', start: { x: 170, y: 60 }, end: { x: 180, y: 90 } },
    ],
  },
  abu_dhabi: {
    viewBox: '0 0 200 200',
    sectors: [
      { id: 'S1', path: 'M 100,20 L 160,20 L 180,60 L 180,100' },
      { id: 'S2', path: 'M 180,100 L 160,140 L 100,160 L 60,150 L 40,130' },
      { id: 'S3', path: 'M 40,130 L 20,100 L 30,60 L 60,30 L 100,20' },
    ],
    drsZones: [
      { path: 'M 100,20 L 160,20', start: { x: 100, y: 20 }, end: { x: 160, y: 20 } },
      { path: 'M 20,100 L 30,60', start: { x: 20, y: 100 }, end: { x: 30, y: 60 } },
    ],
  },
};

/**
 * Get a circuit's sector colors for SVG rendering
 * @param {string} circuitId
 * @param {object} sectorBests - { S1: 'purple'|'green'|null, S2: ..., S3: ... }
 */
export function getSectorColor(rank) {
  switch (rank) {
    case 'fastest': return '#9B59B6';  // Purple
    case 'personal': return '#1B9A1B'; // Green
    case 'normal': return '#F0F0F0';   // White
    default: return '#555555';
  }
}

/**
 * Get all available circuit IDs
 */
export function getAvailableCircuits() {
  return Object.keys(CIRCUIT_SVG_PATHS);
}
