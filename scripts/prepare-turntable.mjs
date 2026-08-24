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
    src: 'Raw Hero video/orbit-lemans-360-4k.mp4',
    out: 'public/turntable/lemans',
    start: 0,
    duration: 10.0,      // giro completo di 360°
    frames: 72,          // un fotogramma ogni 5°: sotto i 10° lo scatto sparisce
    // La sequenza di rotazione non deve essere nitida — i primi piani arrivano
    // dai file `hi` — quindi la risoluzione si spende in angoli, non in pixel.
    width: 1280,
    hires: [31, 41, 59], // stessi angoli di prima (16/21/30 su 36 fotogrammi)
    hiresWidth: 3200,
    eq: null,            // girato diurno esposto bene: nessuna correzione
  },
};

const p = presets[opt('preset', 'lemans')] ?? {};
const SRC = opt('src', p.src);
const OUT = opt('out', p.out);
const START = num('start', p.start ?? 0);
const DURATION = num('duration', p.duration);
const FRAMES = num('frames', p.frames ?? 36);
const WIDTH = num('width', p.width ?? 1600);
const EQ = opt('eq', p.eq);
const HIRES = (opt('hires', (p.hires ?? []).join(',')) || '')
  .split(',').map(Number).filter(Boolean);
const HIRES_WIDTH = num('hires-width', p.hiresWidth ?? 3200);

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

/* ------------------------------------------------------------- alta risoluzione */
if (HIRES.length) {
  const HI = path.join(OUT, 'hi');
  const HTMP = path.join(HI, '_tmp');
  await mkdir(HTMP, { recursive: true });
  let hiTotal = 0;

  for (const n of HIRES) {
    // istante esatto del fotogramma n della sequenza
    const t = START + ((n - 1) / FRAMES) * DURATION;
    const raw = path.join(HTMP, `${n}.png`);
    await run('ffmpeg', [
      '-y', '-ss', t.toFixed(4), '-i', SRC, '-frames:v', '1',
      '-vf', [flag('wm') && 'crop=iw:floor(ih*0.88/2)*2:0:0', `scale=${HIRES_WIDTH}:-2:flags=lanczos`, EQ]
        .filter(Boolean).join(','),
      raw,
    ]);
    const info = await sharp(raw)
      .webp({ quality: 76 })
      .toFile(path.join(HI, `${String(n).padStart(2, '0')}.webp`));
    hiTotal += info.size;
  }

  await rm(HTMP, { recursive: true, force: true });
  const hm = await sharp(path.join(HI, `${String(HIRES[0]).padStart(2, '0')}.webp`)).metadata();
  console.log(`${HIRES.length} fotogrammi ad alta risoluzione ${hm.width}×${hm.height} → ${HI}`);
  console.log(`peso ${(hiTotal / 1024 / 1024).toFixed(2)} MB (caricati solo allo zoom)`);
}
