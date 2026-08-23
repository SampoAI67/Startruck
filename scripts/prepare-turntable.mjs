// Estrae la sequenza "turntable" dal girato reale.
//
// Sorgente: Raw Hero video/IMG_3411_3.mp4 — negli ultimi secondi la camera
// compie un arco di ~180° attorno al mezzo (muso → coda). Non è una piattaforma
// rotante: il mezzo si sposta un po' nell'inquadratura. Va bene per il
// prototipo; per la versione definitiva serve uno shooting controllato.
//
// Uso: node scripts/prepare-turntable.mjs [--frames=36] [--force]
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const run = promisify(execFile);
const arg = (k, d) => Number(process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);

const SRC = 'Raw Hero video/IMG_3411_3.mp4';
const OUT = 'public/turntable/lemans';
const TMP = 'public/turntable/_tmp';

const START = 18.4;      // il mezzo è fuori e inquadrato pulito
const DURATION = 11.0;   // fino a fine arco
const FRAMES = arg('frames', 36);
const WIDTH = 1000;

const exists = async (p) => !!(await stat(p).catch(() => null));

if (!process.argv.includes('--force') && (await exists(`${OUT}/01.webp`))) {
  console.log('Sequenza già presente. Usa --force per rigenerarla.');
  process.exit(0);
}

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
await mkdir(OUT, { recursive: true });

// Il girato è al tramonto ed è molto chiuso: senza una schiarita il mezzo
// scompare nel nero. Restiamo comunque su toni scuri, in linea col sito.
const fps = (FRAMES / DURATION).toFixed(6);
await run('ffmpeg', [
  '-y', '-ss', String(START), '-t', String(DURATION), '-i', SRC,
  '-vf', `fps=${fps},scale=${WIDTH}:-2:flags=lanczos,eq=brightness=0.055:contrast=1.16:saturation=1.06`,
  '-frames:v', String(FRAMES),
  path.join(TMP, '%03d.png'),
]);

const files = (await readdir(TMP)).filter((f) => f.endsWith('.png')).sort();
let total = 0;

for (const [i, f] of files.entries()) {
  const out = path.join(OUT, `${String(i + 1).padStart(2, '0')}.webp`);
  const info = await sharp(path.join(TMP, f)).webp({ quality: 68 }).toFile(out);
  total += info.size;
}

await rm(TMP, { recursive: true, force: true });

console.log(`${files.length} fotogrammi → ${OUT}`);
console.log(`peso totale ${(total / 1024 / 1024).toFixed(2)} MB (${Math.round(total / files.length / 1024)} KB l'uno)`);
