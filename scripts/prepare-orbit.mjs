// Prepara l'orbita per il configuratore in modalità VIDEO.
//
// Invece di una sequenza di immagini si spedisce un solo file: il browser lo
// decodifica da sé, quindi si ottengono 240 posizioni (1,5°) con meno peso di
// 120 immagini. Per i primi piani restano i fermo-immagine ad alta risoluzione.
//
// GOP corto (4) invece di all-intra: costa 4 decodifiche per salto invece di 1,
// ma pesa quasi la metà — e i salti restano impercettibili.
//
// Uso: node scripts/prepare-orbit.mjs [--preset=lemans] [--force]
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const run = promisify(execFile);
const flag = (k) => process.argv.includes(`--${k}`);
const opt = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};

const presets = {
  lemans: {
    src: 'Raw Hero video/orbit-lemans-360-4k.mp4',
    out: 'public/orbit/lemans',
    duration: 10.0,
    width: 1280,
    crf: 30,
    gop: 4,
    posterAt: 0,
    // Angoli su cui zoomano gli accessori: servono anche come fermo-immagine
    // grandi, perché il video a 1280 non regge un ingrandimento 4×.
    hiresAngles: [150, 201, 291],
    hiresWidth: 3200,
  },
};

const p = presets[opt('preset', 'lemans')];
if (!p) { console.error('Preset sconosciuto.'); process.exit(1); }

const OUT = p.out;
const MP4 = path.join(OUT, 'orbit.mp4');
const exists = async (f) => !!(await stat(f).catch(() => null));

if (!flag('force') && (await exists(MP4))) {
  console.log('Orbita già presente. Usa --force per rigenerarla.');
  process.exit(0);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'hi'), { recursive: true });

/* ------------------------------------------------------------------ video -- */
await run('ffmpeg', [
  '-y', '-i', p.src,
  '-an',
  '-t', String(p.duration),
  '-vf', `scale=${p.width}:-2:flags=lanczos`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(p.crf),
  '-g', String(p.gop),
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',       // l'indice in testa: si può cercare subito
  MP4,
]);

const { size } = await stat(MP4);
console.log(`video   orbit.mp4  ${(size / 1024 / 1024).toFixed(2)} MB  (GOP ${p.gop}, crf ${p.crf}, ${p.width}px)`);

/* ----------------------------------------------------------------- poster -- */
const tmp = path.join(OUT, '_f.png');
await run('ffmpeg', ['-y', '-ss', String(p.posterAt), '-i', MP4, '-frames:v', '1', '-update', '1', tmp]);
await sharp(tmp).webp({ quality: 74 }).toFile(path.join(OUT, 'poster.webp'));

/* ------------------------------------------------- fermo-immagine per lo zoom */
let hiTotal = 0;
for (const angle of p.hiresAngles) {
  const t = (angle / 360) * p.duration;
  await run('ffmpeg', [
    '-y', '-ss', t.toFixed(4), '-i', p.src, '-frames:v', '1', '-update', '1',
    '-vf', `scale=${p.hiresWidth}:-2:flags=lanczos`,
    tmp,
  ]);
  const info = await sharp(tmp).webp({ quality: 76 }).toFile(path.join(OUT, 'hi', `${angle}.webp`));
  hiTotal += info.size;
}
await rm(tmp, { force: true });

console.log(`stills  ${p.hiresAngles.length} × ${p.hiresWidth}px  ${(hiTotal / 1024 / 1024).toFixed(2)} MB  (solo allo zoom)`);
console.log(`totale iniziale ${((size + hiTotal * 0) / 1024 / 1024).toFixed(2)} MB — i fermo-immagine si scaricano dopo.`);
