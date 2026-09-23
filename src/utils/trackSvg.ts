import type { TrackPoint } from '../types';

export function trackSvg(segments: TrackPoint[][], width = 640, height = 240): string {
  const valid = segments.filter((s) => s.length > 0);
  const all = valid.flat();
  if (all.length < 2) return '';

  const pad = 16;
  const lats = all.map((p) => p.lat);
  const lons = all.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const spanLat = maxLat - minLat || 1e-6;
  const spanLon = maxLon - minLon || 1e-6;

  const project = (p: TrackPoint): [number, number] => [
    pad + ((p.lon - minLon) / spanLon) * (width - 2 * pad),
    pad + ((maxLat - p.lat) / spanLat) * (height - 2 * pad),
  ];

  const lines = valid
    .map((segment) => {
      const pts = segment
        .map(project)
        .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
        .join(' ');
      return `<polyline points="${pts}" fill="none" stroke="#3f7d5c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />`;
    })
    .join('');

  const [sx, sy] = project(valid[0][0]);
  const lastSegment = valid[valid.length - 1];
  const [ex, ey] = project(lastSegment[lastSegment.length - 1]);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" preserveAspectRatio="xMidYMid meet" style="background:#f5f4f1;border-radius:10px">${lines}<circle cx="${sx.toFixed(
    1,
  )}" cy="${sy.toFixed(1)}" r="5" fill="#fff" stroke="#3f7d5c" stroke-width="3"/><circle cx="${ex.toFixed(
    1,
  )}" cy="${ey.toFixed(1)}" r="5" fill="#b5453a" stroke="#fff" stroke-width="2"/></svg>`;
}
