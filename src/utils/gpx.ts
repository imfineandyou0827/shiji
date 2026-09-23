import type { TrackPoint } from '../types';

const MAX_POINTS = 5000;

function collect(doc: Document, name: string): Element[] {
  return Array.from(doc.getElementsByTagNameNS('*', name));
}

function children(el: Element, name: string): Element[] {
  return Array.from(el.getElementsByTagNameNS('*', name));
}

function pointFrom(node: Element): TrackPoint | null {
  const lat = parseFloat(node.getAttribute('lat') ?? '');
  const lon = parseFloat(node.getAttribute('lon') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const point: TrackPoint = { lat, lon };
  const eleNode = children(node, 'ele')[0] ?? node.getElementsByTagName('ele')[0];
  if (eleNode?.textContent) {
    const ele = parseFloat(eleNode.textContent);
    if (Number.isFinite(ele)) point.ele = ele;
  }
  return point;
}

function readSegment(parent: Element, pointTag: string): TrackPoint[] {
  return children(parent, pointTag)
    .map(pointFrom)
    .filter((p): p is TrackPoint => p !== null);
}

function pushSegment(segments: TrackPoint[][], points: TrackPoint[]): void {
  if (points.length > 0) segments.push(points);
}

export function parseGpx(text: string): TrackPoint[][] {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (collect(doc, 'parsererror').length > 0) return [];

  const segments: TrackPoint[][] = [];

  for (const seg of collect(doc, 'trkseg')) pushSegment(segments, readSegment(seg, 'trkpt'));
  if (segments.length === 0) {
    for (const trk of collect(doc, 'trk')) pushSegment(segments, readSegment(trk, 'trkpt'));
  }
  if (segments.length === 0) {
    for (const rte of collect(doc, 'rte')) pushSegment(segments, readSegment(rte, 'rtept'));
  }
  if (segments.length === 0) {
    const wpt = collect(doc, 'wpt')
      .map(pointFrom)
      .filter((p): p is TrackPoint => p !== null);
    pushSegment(segments, wpt);
  }

  return segments;
}

function haversineKm(a: TrackPoint, b: TrackPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function computeDistanceKm(segments: TrackPoint[][]): number | null {
  let total = 0;
  let counted = false;
  for (const points of segments) {
    for (let i = 1; i < points.length; i += 1) {
      total += haversineKm(points[i - 1], points[i]);
      counted = true;
    }
  }
  return counted ? Math.round(total * 100) / 100 : null;
}

export function computeElevationGainM(segments: TrackPoint[][]): number | null {
  let gain = 0;
  let counted = false;
  for (const points of segments) {
    const eles = points
      .map((p) => p.ele)
      .filter((e): e is number => typeof e === 'number');
    for (let i = 1; i < eles.length; i += 1) {
      const diff = eles[i] - eles[i - 1];
      if (diff > 0) gain += diff;
      counted = true;
    }
  }
  return counted ? Math.round(gain) : null;
}

export function elevationRange(segments: TrackPoint[][]): [number, number] | null {
  const eles = segments
    .flat()
    .map((p) => p.ele)
    .filter((e): e is number => typeof e === 'number');
  if (eles.length === 0) return null;
  return [Math.min(...eles), Math.max(...eles)];
}

function simplifySegment(points: TrackPoint[], step: number): TrackPoint[] {
  const out: TrackPoint[] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export function simplifySegments(segments: TrackPoint[][], max = MAX_POINTS): TrackPoint[][] {
  const total = segments.reduce((n, s) => n + s.length, 0);
  if (total <= max) return segments;
  const step = Math.ceil(total / max);
  return segments
    .map((points) => (points.length > 1 ? simplifySegment(points, step) : points))
    .filter((s) => s.length > 0);
}

export function countPoints(segments: TrackPoint[][]): number {
  return segments.reduce((n, s) => n + s.length, 0);
}
