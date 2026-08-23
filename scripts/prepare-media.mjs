// Prepara i media sorgente (OneDrive) in asset web-ready dentro public/.
// Idempotente: salta ciò che è già aggiornato. Uso: node scripts/prepare-media.mjs [--force]
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const run = promisify(execFile);
const FORCE = process.argv.includes('--force');

const VID_SRC = 'VIdeo AI Startruck';
const IMG_SRC = 'Startruck immagini/Immagini utilizzabili';
const OUT_VIDEO = 'public/video';
const OUT_IMG = 'public/img';
const OUT_LOGO = 'public/logos';

/* ------------------------------------------------------------------ video -- */
// Loop decorativi, sempre muti: bitrate alto inutile. CRF 30 + no audio + faststart.
// `wm: true` = la clip è generata con Veo e porta il watermark in basso a destra:
// si taglia il 12% inferiore prima dello scale (i soggetti sono centrati, non si perde nulla).
const videos = [
  { in: 'STN LM HERO.mp4',        out: 'lemans-hero.mp4',         w: 1600, wm: true },
  { in: 'ST LM MOBILE.mp4',       out: 'lemans-hero-mobile.mp4',  w: 720  },
  { in: 'Le Mans Home.mp4',       out: 'lemans-detail.mp4',       w: 1440 },
  { in: 'Privacy Hero Video.mp4', out: 'privacy-hero.mp4',        w: 1600, wm: true },
  { in: 'Privacy Hero Mobile.mp4',out: 'privacy-hero-mobile.mp4', w: 720  },
  { in: '1218(1).mp4',            out: 'privacy-detail.mp4',      w: 1440, wm: true },
  { in: '0122.mp4',               out: 'typeh-hero.mp4',          w: 1600, wm: true },
  { in: 'TypeH home.mp4',         out: 'typeh-detail.mp4',        w: 1440, wm: true },
];

// Poster estratto dal video compresso: garantisce che il primo frame combaci.
const posterAt = { 'lemans-detail.mp4': 6, 'typeh-detail.mp4': 3, 'privacy-detail.mp4': 1 };

/* ------------------------------------------------------------------ foto --- */
const galleries = {
  lemans: [
    'Le Mans/Peugeot/DJI_20250218_121209_273.jpg',
    'Le Mans/Mercedes/DJI_20250224_165249_224.jpg',
    'Le Mans/MAN/MAN BLU_1.JPEG',
    'Le Mans/Iveco/G IVECO_3.JPEG',
    'Le Mans/Mercedes/DALMA_1.JPEG',
    'Le Mans/Peugeot/DJI_20250218_122106_383.jpg',
  ],
  privacy: [
    'Privacy/Peugeot/IMG_2857.jpeg',
    'Privacy/Citroen/IMG_3098.JPEG',
    'Privacy/Iveco/IMG_1317.JPEG',
    'Privacy/Fiat/IMG_2786.JPEG',
    'Privacy/Optional/IMG_2990.jpeg',
    'Privacy/ONE_2.jpeg',
  ],
  typeh: [
    'Type H/IMG_3894.jpg',
    'Type H/IMG_4996.jpeg',
    'Type H/270.jpg',
    'Type H/IMG_9635.JPEG',
    'Type H/IMG_2772.JPEG',
    'Type H/271.jpg',
  ],
};

const isStale = async (src, out) => {
  if (FORCE) return true;
  try {
    const [a, b] = await Promise.all([stat(src), stat(out)]);
    return a.mtimeMs > b.mtimeMs;
  } catch {
    return true; // out non esiste
  }
};

async function encodeVideos() {
  await mkdir(OUT_VIDEO, { recursive: true });
  await mkdir(OUT_IMG, { recursive: true });

  for (const v of videos) {
    const src = path.join(VID_SRC, v.in);
    const out = path.join(OUT_VIDEO, v.out);

    if (await isStale(src, out)) {
      const filters = [v.wm && 'crop=iw:floor(ih*0.88/2)*2:0:0', `scale=${v.w}:-2:flags=lanczos`]
        .filter(Boolean)
        .join(',');
      await run('ffmpeg', [
        '-y', '-i', src,
        '-an',                                  // niente audio: i loop sono muti
        '-vf', filters,
        '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '30',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',              // metadata in testa: parte prima
        out,
      ]);
    }

    // poster dal video compresso
    const poster = path.join(OUT_IMG, v.out.replace(/\.mp4$/, '.webp'));
    if (await isStale(out, poster)) {
      const tmp = path.join(OUT_IMG, '_frame.png');
      await run('ffmpeg', ['-y', '-ss', String(posterAt[v.out] ?? 0.5), '-i', out, '-frames:v', '1', tmp]);
      await sharp(tmp).webp({ quality: 72 }).toFile(poster);
      await run('node', ['-e', `require('fs').unlinkSync(${JSON.stringify(tmp)})`]);
    }

    const { size } = await stat(out);
    console.log(`video  ${v.out.padEnd(26)} ${(size / 1024 / 1024).toFixed(2)} MB`);
  }
}

async function encodeLogos() {
  await mkdir(OUT_LOGO, { recursive: true });
  const dir = path.join(IMG_SRC, 'Le Mans/Loghi');
  for (const f of await readdir(dir)) {
    if (!/\.png$/i.test(f)) continue;
    const src = path.join(dir, f);
    const out = path.join(OUT_LOGO, `${f.replace(/\.png$/i, '').toLowerCase()}.webp`);
    if (!(await isStale(src, out))) continue;
    // trim del margine trasparente → altezza uniforme: allineamento ottico nella striscia
    await sharp(src).trim().resize({ height: 160, fit: 'inside' }).webp({ quality: 82 }).toFile(out);
    console.log(`logo   ${path.basename(out)}`);
  }
}

async function encodeGalleries() {
  await mkdir(OUT_IMG, { recursive: true });
  for (const [line, files] of Object.entries(galleries)) {
    for (const [i, rel] of files.entries()) {
      const src = path.join(IMG_SRC, rel);
      const out = path.join(OUT_IMG, `${line}-${String(i + 1).padStart(2, '0')}.webp`);
      if (!(await isStale(src, out))) continue;
      const info = await sharp(src)
        .rotate()                               // rispetta l'orientamento EXIF
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 72 })
        .toFile(out);
      console.log(`photo  ${path.basename(out).padEnd(26)} ${(info.size / 1024).toFixed(0)} KB`);
    }
  }
}

await encodeVideos();
await encodeLogos();
await encodeGalleries();
console.log('\nMedia pronti in public/.');
