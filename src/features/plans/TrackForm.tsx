import { useRef, useState } from 'react';
import type { BaseLayer, Difficulty, Track, TrackPoint } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { TrackMap } from '../../components/TrackMap';
import { Field, Select, TextArea, TextInput } from '../../components/forms';
import {
  computeDistanceKm,
  computeElevationGainM,
  countPoints,
  elevationRange,
  parseGpx,
  simplifySegments,
} from '../../utils/gpx';
import type { TrackInput } from '../../store/useStore';
import styles from './TrackForm.module.css';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: '', label: '未定' },
  { value: 'easy', label: '轻松' },
  { value: 'moderate', label: '中等' },
  { value: 'hard', label: '困难' },
  { value: 'expert', label: '挑战' },
];

const BASE_LAYERS: { value: BaseLayer; label: string }[] = [
  { value: 'osm', label: '标准地图' },
  { value: 'topo', label: '地形图' },
  { value: 'satellite', label: '卫星图' },
];

interface TrackFormProps {
  open: boolean;
  initial?: Track | null;
  onClose: () => void;
  onSubmit: (input: TrackInput) => void;
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function TrackForm(props: TrackFormProps) {
  if (!props.open) return null;
  return <TrackFormBody {...props} />;
}

function TrackFormBody({ initial, onClose, onSubmit }: TrackFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [distance, setDistance] = useState(initial?.distanceKm?.toString() ?? '');
  const [elevation, setElevation] = useState(initial?.elevationGainM?.toString() ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? '');
  const [duration, setDuration] = useState(initial?.durationMin?.toString() ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [segments, setSegments] = useState<TrackPoint[][]>(initial?.segments ?? []);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>(initial?.baseLayer ?? 'osm');
  const [gpxText, setGpxText] = useState('');
  const [gpxMsg, setGpxMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = name.trim().length > 0 || countPoints(segments) > 1;

  const applyGpx = (text: string) => {
    const full = parseGpx(text);
    if (countPoints(full) < 2) {
      setGpxMsg('没有解析到轨迹点，请确认是 GPX 文件（支持 trkpt / rtept / wpt）。');
      return;
    }
    const stored = simplifySegments(full);
    setSegments(stored);
    const fullCount = countPoints(full);
    const storedCount = countPoints(stored);
    const segInfo = full.length > 1 ? `，${full.length} 段` : '';
    setGpxMsg(
      storedCount < fullCount
        ? `已解析 ${fullCount} 个点${segInfo}，为控制体积抽样为 ${storedCount} 个`
        : `已解析 ${fullCount} 个轨迹点${segInfo}`,
    );
    if (!distance) {
      const d = computeDistanceKm(full);
      if (d !== null) setDistance(String(d));
    }
    if (!elevation) {
      const g = computeElevationGainM(full);
      if (g !== null) setElevation(String(g));
    }
  };

  const range = elevationRange(segments);

  const submit = () => {
    if (!valid) return;
    onSubmit({
      name: name.trim() || '未命名轨迹',
      link: link.trim(),
      distanceKm: toNumber(distance),
      elevationGainM: toNumber(elevation),
      difficulty,
      durationMin: toNumber(duration),
      notes: notes.trim(),
      segments,
      baseLayer,
    });
    onClose();
  };

  return (
    <Modal
      open
      title={initial ? '编辑轨迹' : '添加轨迹'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={submit} disabled={!valid}>
            保存
          </Button>
        </>
      }
    >
      <Field label="名称">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：武功山穿越线"
          autoFocus
        />
      </Field>

      <Field label="轨迹链接" hint="两步路 / 高德 / AllTrails 等">
        <TextInput
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <div className={styles.grid}>
        <Field label="距离（km）">
          <TextInput
            type="number"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="12.5"
          />
        </Field>
        <Field label="累计爬升（m）">
          <TextInput
            type="number"
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            placeholder="800"
          />
        </Field>
        <Field label="难度">
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="预计时长（分钟）">
          <TextInput
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="360"
          />
        </Field>
      </div>

      <Field label="GPX 轨迹" hint="粘贴 GPX 内容或选择文件，自动解析并预览">
        <div className={styles.gpxActions}>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            选择 GPX 文件
          </Button>
          <Button size="sm" variant="secondary" onClick={() => applyGpx(gpxText)} disabled={!gpxText.trim()}>
            解析粘贴内容
          </Button>
          {countPoints(segments) > 1 && (
            <Button size="sm" variant="ghost" onClick={() => { setSegments([]); setGpxMsg(''); }}>
              清除轨迹
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".gpx,application/gpx+xml,application/xml"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => applyGpx(String(reader.result));
                reader.readAsText(file);
              }
              e.target.value = '';
            }}
          />
        </div>
        <TextArea
          value={gpxText}
          onChange={(e) => setGpxText(e.target.value)}
          placeholder="<gpx>…<trkpt lat=&quot;27.4&quot; lon=&quot;114.1&quot;><ele>1200</ele></trkpt>…</gpx>"
          style={{ marginTop: 8 }}
        />
      </Field>

      {countPoints(segments) > 1 && (
        <div className={styles.preview}>
          <TrackMap segments={segments} base={baseLayer} />
          {range && (
            <span className={styles.range}>
              海拔 {Math.round(range[0])}–{Math.round(range[1])} m
            </span>
          )}
        </div>
      )}
      {gpxMsg && <p className={styles.msg}>{gpxMsg}</p>}

      <Field label="地图底图">
        <Select value={baseLayer} onChange={(e) => setBaseLayer(e.target.value as BaseLayer)}>
          {BASE_LAYERS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="备注">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="补给点、注意事项…" />
      </Field>
    </Modal>
  );
}
