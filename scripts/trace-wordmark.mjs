// Traccia il wordmark "STARTRUCK ITALIA" (PNG b/n) in un SVG nitido e scalabile.
// Uso: node scripts/trace-wordmark.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const potrace = require('potrace');

const SRC = 'Startruck immagini/SVG/No Logo.png';
const OUT = 'public/wordmark-startruck.svg';

potrace.trace(
  SRC,
  { color: '#161616', background: 'transparent', threshold: 145, turdSize: 2, optTolerance: 0.2 },
  (err, svg) => {
    if (err) { console.error(err); process.exit(1); }
    writeFileSync(OUT, svg);
    console.log(`OK -> ${OUT}  (${(svg.length / 1024).toFixed(1)} KB)`);
  }
);
