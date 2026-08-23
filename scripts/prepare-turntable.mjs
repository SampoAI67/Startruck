// Estrae una sequenza "turntable" da un video in cui la camera gira attorno al mezzo.
//
// Uso:
//   node scripts/prepare-turntable.mjs                       (preset: lemans)
//   node scripts/prepare-turntable.mjs --preset=lemans --force
//   node scripts/prepare-turntable.mjs --src="Raw Hero video/x.mp4" --out=public/turntable/typeh \
//        --start=0 --duration=10 --frames=36 --width=1280
//
// Opzioni: --wm taglia il 12% inferiore (watermark dei generatori AI).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const run = promisify(execFile);
const flag = (k) => process.argv.includes(`--${k}`);
const opt = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const num = (k, d) => Number(opt(k, d));

// Preset noti, così il comando quotidiano resta corto.
const presets = {
  lemans: {
    src: 'Raw Hero video/orbit-lemans-360.mp4',
    out: 'public/turntable/lemans',
    start: 0,
    duration: 10.0,      // giro completo di 360°
    frames: 36,          // un fotogramma ogni 10°
    width: 1280,         // risoluzione nativa: serve per reggere lo zoom 3x
    eq: null,            // girato diurno: nessuna correzione
  },
};

const p = presets[opt('preset', 'lemans')] ?? {};
const SRC = opt('src', p.src);
const OUT = opt('out', p.out);
const START = num('start', p.start ?? 0);
const DURATION = num('duration', p.duration);
const FRAMES = num('frames', p.frames ?? 36);
const WIDTH = num('width', p.width ?? 1280);
const EQ = opt('eq', p.eq);

if (!SRC || !OUT || !DURATION) {
  console.error('Servono almeno --src, --out e --duration (o un --preset valido).');
  process.exit(1);
}

const TMP = path.join(OUT, '_tmp');
const exists = async (f) => !!(await stat(f).catch(() => null));

if (!flag('force') && (await exists(path.join(OUT, '01.webp')))) {
  console.log('Sequenza già presente. Usa --force per rigenerarla.');
  process.exit(0);
}

// Ripulisce i fotogrammi vecchi: se la nuova sequenza è più corta, i residui
// della precedente resterebbero lì a confondere.
await rm(OUT, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

const filters = [
  flag('wm') && 'crop=iw:floor(ih*0.88/2)*2:0:0',
  `fps=${(FRAMES / DURATION).toFixed(6)}`,
  `scale=${WIDTH}:-2:flags=lanczos`,
  EQ,
].filter(Boolean).join(',');

await run('ffmpeg', [
  '-y', '-ss', String(START), '-t', String(DURATION), '-i', SRC,
  '-vf', filters,
  '-frames:v', String(FRAMES),
  path.join(TMP, '%03d.png'),
]);

const files = (await readdir(TMP)).filter((f) => f.endsWith('.png')).sort();
let total = 0;

for (const [i, f] of files.entries()) {
  const info = await sharp(path.join(TMP, f))
    .webp({ quality: 72 })
    .toFile(path.join(OUT, `${String(i + 1).padStart(2, '0')}.webp`));
  total += info.size;
}

await rm(TMP, { recursive: true, force: true });

const { width, height } = await sharp(path.join(OUT, '01.webp')).metadata();
console.log(`${files.length} fotogrammi ${width}×${height} → ${OUT}`);
console.log(`peso totale ${(total / 1024 / 1024).toFixed(2)} MB (${Math.round(total / files.length / 1024)} KB l'uno)`);
