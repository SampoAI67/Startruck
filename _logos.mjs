// I loghi dei clienti arrivano da otto file di misure e proporzioni diverse
// (uno e' verticale, uno e' una striscia lunga). Si normalizzano ad ALTEZZA
// comune e larghezza libera: e' cosi' che una fila di marchi si legge, non
// schiacciandoli tutti nello stesso riquadro.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'Remake/Archivio/clienti';
const H = 160;                       // 2x di 80px a schermo
const files = (await fs.readdir(DIR)).filter(f => f.startsWith('_'));

for (const f of files) {
  const name = f.slice(1).replace(/\.(png|webp|jpe?g)$/i, '');
  const src = path.join(DIR, f);
  const img = sharp(src);
  const meta = await img.metadata();
  const out = await sharp(src)
    .trim({ threshold: 12 })         // via il bordo vuoto, se c'e'
    .resize({ height: H, fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 88, alphaQuality: 90 })
    .toBuffer();
  await fs.writeFile(path.join(DIR, `${name}.webp`), out);
  const m2 = await sharp(out).metadata();
  console.log(name.padEnd(12), `${meta.width}x${meta.height} -> ${m2.width}x${m2.height}`, `${(out.length/1024).toFixed(1)}KB`);
  await fs.rm(src);
}
