// Ottimizza le copertine finalizzate in poster web-ready per i <video>.
// Uso: node scripts/optimize-posters.mjs
import sharp from 'sharp';

const SRC = 'Startruck immagini/Immagini utilizzabili';
const OUT = 'public';

const jobs = [
  { in: `${SRC}/Lemans Copertina2.png`, out: `${OUT}/poster-lemans.webp` },
  { in: `${SRC}/TypeH Copertina2.png`, out: `${OUT}/poster-typeh.webp` },
  { in: `${SRC}/Privacy Copertina2.png`, out: `${OUT}/poster-privacy.webp` },
];

for (const j of jobs) {
  const meta = await sharp(j.in).metadata();
  const info = await sharp(j.in)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(j.out);
  console.log(`${j.out}  ${meta.width}x${meta.height} -> ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
}
