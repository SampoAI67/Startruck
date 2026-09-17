// Costruisce la griglia "Ultimi lavori": immagini quadrate ottimizzate + lavori.json.
//
// Due sorgenti, stesso identico trattamento in uscita:
//   --local <cartella>   immagini gia' in casa (seed / fallback curato)
//   --apify              ultimo dataset dello scraper Instagram, via API
//
// Perche' si SCARICANO le immagini invece di puntare agli URL di Instagram:
// gli URL della CDN (scontent-*.cdninstagram.com) sono firmati e scadono, quindi
// salvarli significa ritrovarsi la griglia vuota dopo qualche giorno.
//
//   node scripts/build-lavori.mjs --local "public/img" --limit 18
//   APIFY_TOKEN=xxx node scripts/build-lavori.mjs --apify --limit 18

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Le immagini le serve il sito cosi' come sono; l'indice lo legge
// src/components/home/Works.astro al build.
const OUT_DIR = 'public/lavori';
const OUT_JSON = 'src/data/lavori.json';
const CELL = 760;                       // 2x della cella a 1116px di griglia
const ACTOR = 'apify~instagram-scraper';

const args = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = args.indexOf(n);
  return i === -1 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true);
};
// La rotaia e' alta due righe e ogni lavoro e' una terna di post dello stesso
// giorno: le terne vanno tenute intere e in fila sulla stessa riga, quindi il
// conteggio si tronca a multipli di SEI (due righe di terne).
const limit = Math.floor(Number(flag('--limit', 18)) / 6) * 6;

// Il token sta in una variabile d'ambiente (CI) oppure in un file FUORI dal
// repo: non finisce in un commit e non passa dalla chat.
async function readToken() {
  if (process.env.APIFY_TOKEN) return process.env.APIFY_TOKEN.trim();
  // .env del progetto: letto a mano, senza dipendenze e senza passare dalla shell
  try {
    const env = await fs.readFile('.env', 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*APIFY_TOKEN\s*=\s*(.*)$/);
      if (m) {
        const v = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (v) return v;
      }
    }
  } catch {}
  return null;
}

// Lancia lo scraper e aspetta che finisca. Consuma credito Apify
// (pay-per-result: un post = un risultato), quindi si attiva solo con --run.
async function triggerRun(token) {
  const profile = flag('--profile', 'https://www.instagram.com/startruckitalia/');
  const body = {
    directUrls: [profile],          // URL con /username/ = post di quel profilo
    resultsType: 'posts',
    resultsLimit: Number(flag('--posts', 12)),
    addParentData: false,
  };
  const r = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}&waitForFinish=180`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`avvio run fallito: ${r.status}`);
  const run = (await r.json()).data;
  console.log(`run ${run.id}: ${run.status}`);
  if (run.status !== 'SUCCEEDED') throw new Error(`run in stato ${run.status}`);
  return run.defaultDatasetId;
}

async function fromApify() {
  const token = await readToken();
  if (!token) throw new Error('token assente: riempi APIFY_TOKEN in .env (o nell ambiente su CI)');
  const datasetId = flag('--run') ? await triggerRun(token) : null;
  const url = datasetId
    ? `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=60`
    : `https://api.apify.com/v2/acts/${ACTOR}/runs/last/dataset/items?token=${token}&status=SUCCEEDED&limit=60`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Apify ha risposto ${res.status}`);
  const items = await res.json();

  return items
    .filter((p) => p.type === 'Image' || p.type === 'Sidecar')   // niente video/reel
    .filter((p) => p.displayUrl)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
    .map((p) => ({
      src: p.displayUrl,
      caption: (p.caption || '').split('\n')[0].slice(0, 120),
      permalink: p.url || null,
      date: p.timestamp || null,
    }));
}

async function fromLocal(dir) {
  const files = (await fs.readdir(dir))
    .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
    .filter((f) => !/hero|detail|mobile/i.test(f))               // niente ritagli da hero
    .sort();
  // si alternano le linee, cosi' la griglia non mostra tre foto uguali di fila
  const byLine = {};
  for (const f of files) (byLine[f.split('-')[0]] ||= []).push(f);
  const lines = Object.keys(byLine).sort();
  const mixed = [];
  for (let i = 0; mixed.length < files.length; i++) {
    for (const l of lines) if (byLine[l][i]) mixed.push(byLine[l][i]);
    if (i > 40) break;
  }
  return mixed.slice(0, limit).map((f) => ({
    src: path.join(dir, f),
    caption: '',
    permalink: null,
    date: null,
  }));
}

async function loadBytes(src) {
  if (/^https?:/.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`immagine ${r.status}: ${src}`);
    return Buffer.from(await r.arrayBuffer());
  }
  return fs.readFile(src);
}

const main = async () => {
  const posts = flag('--apify') ? await fromApify() : await fromLocal(flag('--local', 'public/img'));
  if (!posts.length) {
    console.log('nessun post: lascio la griglia com\'e\'');   // meglio vecchia che vuota
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const out = [];
  for (let i = 0; i < posts.length; i++) {
    const name = `lavoro-${String(i + 1).padStart(2, '0')}.webp`;
    const bytes = await loadBytes(posts[i].src);
    await sharp(bytes)
      .resize(CELL, CELL, { fit: 'cover', position: 'attention' })  // taglia dove c'e' il soggetto
      .webp({ quality: 78 })
      .toFile(path.join(OUT_DIR, name));
    out.push({ img: `lavori/${name}`, caption: posts[i].caption, permalink: posts[i].permalink, date: posts[i].date });
  }

  await fs.writeFile(OUT_JSON, JSON.stringify({ updated: new Date().toISOString(), posts: out }, null, 2));
  console.log(`${out.length} immagini -> ${OUT_DIR}`);
  console.log(`indice -> ${OUT_JSON}`);
};

main().catch((e) => { console.error('errore:', e.message); process.exit(1); });
