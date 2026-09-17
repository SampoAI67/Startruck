// Pubblica il prototipo del remake cliente dentro al sito Astro.
//
// Il file su cui si lavora resta UNO SOLO: Remake/Archivio/startruck-remake-work.html.
// Questo script ne fa una copia in public/remake/index.html insieme agli asset
// che gli servono, cosi' finisce su /Startruck/remake/ senza che esistano due
// versioni da tenere allineate a mano.
//
// public/remake/ e' generata e NON versionata: la sorgente e' Remake/Archivio.
// Gira da sola come "prebuild" (quindi anche su GitHub Actions).
//
//   node scripts/sync-remake.mjs

import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = 'Remake/Archivio';
const OUT = 'public/remake';

// Solo cio' che serve alla pagina pubblicata. Fuori restano il file originale
// del cliente, il reel pesante (sta in public/video, gia' compresso) e le note.
const FILES = [
  ['startruck-remake-work.html', 'index.html'],
  'logo.png',
  'logo-startruck.svg',
  'onlylogo.svg',
  'wordmark-startruck.svg',
  'tread.png',
  'poster-lemans.webp',
  'poster-privacy.webp',
  'poster-typeh.webp',
  'lavori.json',
];
const DIRS = ['lavori', 'optionals', 'clienti'];      // optionals puo' non esserci ancora

async function copyIfExists(from, to) {
  try {
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}

const main = async () => {
  await fs.rm(OUT, { recursive: true, force: true });   // niente residui di ieri
  await fs.mkdir(OUT, { recursive: true });

  let n = 0;
  for (const entry of FILES) {
    const [from, to] = Array.isArray(entry) ? entry : [entry, entry];
    if (await copyIfExists(path.join(SRC, from), path.join(OUT, to))) n++;
    else console.warn(`manca ${from}`);
  }

  for (const dir of DIRS) {
    let names = [];
    try { names = await fs.readdir(path.join(SRC, dir)); } catch { continue; }
    for (const f of names) {
      if (!/\.(webp|jpe?g|png|svg)$/i.test(f)) continue;   // niente note o .txt
      if (await copyIfExists(path.join(SRC, dir, f), path.join(OUT, dir, f))) n++;
    }
  }

  console.log(`${n} file -> ${OUT}`);
};

main().catch((e) => { console.error('errore:', e.message); process.exit(1); });
