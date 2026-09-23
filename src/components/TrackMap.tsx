import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BaseLayer, TrackPoint } from '../types';
import styles from './TrackMap.module.css';

const BASES: Record<BaseLayer, { url: string; attribution: string; maxZoom: number }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
};

interface TrackMapProps {
  segments: TrackPoint[][];
  base?: BaseLayer;
  height?: number;
}

export function TrackMap({ segments, base = 'osm', height = 260 }: TrackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const groupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([30, 110], 4);
    mapRef.current = map;
    const timer = window.setTimeout(() => map.invalidateSize(), 60);
    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      groupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const config = BASES[base];
    tileRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);
  }, [base]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (groupRef.current) {
      map.removeLayer(groupRef.current);
      groupRef.current = null;
    }
    const valid = segments.filter((s) => s.length > 0);
    if (valid.length === 0) return;

    const group = L.layerGroup();
    const all: [number, number][] = [];
    for (const segment of valid) {
      const latlngs = segment.map((p) => [p.lat, p.lon] as [number, number]);
      all.push(...latlngs);
      if (latlngs.length >= 2) {
        L.polyline(latlngs, { color: '#3f7d5c', weight: 4, opacity: 0.9 }).addTo(group);
      }
    }

    const start = valid[0][0];
    const lastSegment = valid[valid.length - 1];
    const end = lastSegment[lastSegment.length - 1];
    L.circleMarker([start.lat, start.lon], {
      radius: 6,
      color: '#fff',
      weight: 2,
      fillColor: '#3f7d5c',
      fillOpacity: 1,
    }).addTo(group);
    L.circleMarker([end.lat, end.lon], {
      radius: 6,
      color: '#fff',
      weight: 2,
      fillColor: '#b5453a',
      fillOpacity: 1,
    }).addTo(group);

    group.addTo(map);
    groupRef.current = group;
    map.fitBounds(L.latLngBounds(all), { padding: [24, 24] });
  }, [segments]);

  return <div ref={containerRef} className={styles.map} style={{ height }} />;
}
