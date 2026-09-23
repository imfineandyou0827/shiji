import type { BaseLayer, TrackPoint } from '../types';

const TILE = 256;
const MAX_TILES = 40;

interface Source {
  url: (x: number, y: number, z: number) => string;
  maxZoom: number;
}

const SOURCES: Record<BaseLayer, Source> = {
  osm: {
    url: (x, y, z) => `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`,
    maxZoom: 18,
  },
  topo: {
    url: (x, y, z) => `https://a.tile.opentopomap.org/${z}/${x}/${y}.png`,
    maxZoom: 16,
  },
  satellite: {
    url: (x, y, z) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    maxZoom: 18,
  },
};

function lonToX(lon: number, z: number): number {
  return ((lon + 180) / 360) * Math.pow(2, z) * TILE;
}

function latToY(lat: number, z: number): number {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * Math.pow(2, z) * TILE;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderTrackMap(
  segments: TrackPoint[][],
  base: BaseLayer = 'osm',
  maxWidth = 680,
  maxHeight = 400,
): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const points = segments.filter((s) => s.length > 0).flat();
  if (points.length < 2) return null;

  const source = SOURCES[base] ?? SOURCES.osm;
  const pad = 26;
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  let zoom = source.maxZoom;
  let px0 = 0;
  let py0 = 0;
  let px1 = 0;
  let py1 = 0;
  let tiles = Number.POSITIVE_INFINITY;
  for (; zoom >= 1; zoom -= 1) {
    px0 = lonToX(minLon, zoom);
    px1 = lonToX(maxLon, zoom);
    py0 = latToY(maxLat, zoom);
    py1 = latToY(minLat, zoom);
    const spanX = px1 - px0;
    const spanY = py1 - py0;
    const tx0 = Math.floor(px0 / TILE);
    const tx1 = Math.floor(px1 / TILE);
    const ty0 = Math.floor(py0 / TILE);
    const ty1 = Math.floor(py1 / TILE);
    tiles = (tx1 - tx0 + 1) * (ty1 - ty0 + 1);
    if (spanX <= maxWidth - 2 * pad && spanY <= maxHeight - 2 * pad && tiles <= MAX_TILES) {
      break;
    }
  }
  zoom = Math.max(1, zoom);

  const offsetX = px0 - pad;
  const offsetY = py0 - pad;
  const width = Math.min(maxWidth, Math.round(px1 - px0 + 2 * pad));
  const height = Math.min(maxHeight, Math.round(py1 - py0 + 2 * pad));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#e9e7e0';
  ctx.fillRect(0, 0, width, height);

  const tx0 = Math.floor(px0 / TILE);
  const tx1 = Math.floor(px1 / TILE);
  const ty0 = Math.floor(py0 / TILE);
  const ty1 = Math.floor(py1 / TILE);
  const images = await Promise.all(
    Array.from({ length: (tx1 - tx0 + 1) * (ty1 - ty0 + 1) }, (_, i) => {
      const cols = tx1 - tx0 + 1;
      const tx = tx0 + (i % cols);
      const ty = ty0 + Math.floor(i / cols);
      return loadImage(source.url(tx, ty, zoom)).then((img) => ({ img, tx, ty }));
    }),
  );
  let loaded = 0;
  for (const { img, tx, ty } of images) {
    if (!img) continue;
    loaded += 1;
    ctx.drawImage(img, tx * TILE - offsetX, ty * TILE - offsetY, TILE, TILE);
  }
  if (loaded === 0) return null;

  const project = (p: TrackPoint): [number, number] => [
    lonToX(p.lon, zoom) - offsetX,
    latToY(p.lat, zoom) - offsetY,
  ];

  const valid = segments.filter((s) => s.length > 0);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3f7d5c';
  ctx.lineWidth = 4;
  for (const segment of valid) {
    if (segment.length < 2) continue;
    ctx.beginPath();
    segment.forEach((p, i) => {
      const [x, y] = project(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  const marker = (p: TrackPoint, fill: string) => {
    const [x, y] = project(p);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  };
  marker(valid[0][0], '#3f7d5c');
  const last = valid[valid.length - 1];
  marker(last[last.length - 1], '#b5453a');

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
