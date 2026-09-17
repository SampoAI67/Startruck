// Genera le tre pagine modello del remake cliente dai dati del remake in Astro.
//
// Sorgente unica dei contenuti: src/data/lines.ts (lo stesso file che usa
// src/pages/allestimenti/[slug].astro). Qui lo si legge e si scrivono tre viste
// <div id="view-..."> nel file del prototipo, fra i due marcatori:
//
//   <!-- MODELLI:INIZIO ... -->   ...   <!-- MODELLI:FINE -->
//
// ATTENZIONE: rigenerare SOVRASCRIVE tutto quello che sta fra i marcatori.
// Per questo lo script NON gira da solo col build: le viste si adattano a
// mano, e un build non deve cancellare il lavoro. Si lancia quando i dati
// cambiano e le viste non sono ancora state ritoccate:
//
//   node scripts/build-model-pages.mjs
//
// CSS e JS delle viste NON sono generati: stanno nel file, sotto .mp, e si
// modificano liberamente.

import fs from 'node:fs/promises';
import { lines } from '../src/data/lines.ts';

const FILE = 'Remake/Archivio/startruck-remake-work.html';
// Gli asset (video, foto, loghi dei marchi) sono quelli del sito Astro
// pubblicato: stesso indirizzo assoluto che il prototipo usa gia' per gli hero.
const ASSET = 'https://sampoai67.github.io/Startruck/';
const START = '<!-- MODELLI:INIZIO';
const END = '<!-- MODELLI:FINE -->';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad2 = (n) => String(n).padStart(2, '0');
const url = (p) => ASSET + p;

// ---- blocchi (uno per componente Astro) ------------------------------------

const arrow = '<svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><line x1="0" y1="6" x2="20" y2="6" /><path d="M15 1 L21 6 L15 11" /></svg>';

function videoBanner({ video, videoMobile, poster, eyebrow, index, title, text, cta, height = 'full', first = false, heading = 'h2', scrollCue = false }) {
  const titleLines = title.split('\n').map((l, i) =>
    `<span class="mp-mask"><span style="--d:${(i * 0.09).toFixed(2)}s">${esc(l)}</span></span>`).join('');
  return `
  <section class="mp-vb mp-dark mp-vb-${height}${first ? ' mp-vb-first' : ''}">
    <div class="mp-vb-media" data-parallax>
      <video class="mp-vb-video" poster="${url(poster)}" muted loop playsinline preload="none" aria-hidden="true">
        ${videoMobile ? `<source src="${url(videoMobile)}" media="(max-width: 760px)" type="video/mp4">` : ''}
        <source src="${url(video)}" type="video/mp4">
      </video>
    </div>
    <div class="mp-vb-scrim"></div>
    <div class="mp-container mp-vb-content">
      ${eyebrow ? `<p class="mp-label" data-index="${esc(index)}" data-reveal>${esc(eyebrow)}</p>` : ''}
      <${heading} class="mp-vb-title" data-reveal>${titleLines}</${heading}>
      ${text ? `<p class="mp-vb-text" data-reveal data-delay=".18s">${esc(text)}</p>` : ''}
      ${cta ? `<div data-reveal data-delay=".26s"><a class="mp-vb-cta" href="#" data-scrollto="${esc(cta.target)}">${esc(cta.label)} ${arrow}</a></div>` : ''}
    </div>
    ${scrollCue ? '<div class="mp-vb-cue" aria-hidden="true"><span>SCROLL</span><i></i></div>' : ''}
  </section>`;
}

function marquee(items) {
  const seq = items.map((w) =>
    `<span class="mp-mq-cell"><span class="mp-mq-word">${esc(w)}</span><span class="mp-slashes" aria-hidden="true"><i></i><i></i><i></i></span></span>`).join('');
  // due copie identiche: la traccia scorre del 50% e riparte senza salto
  return `
  <div class="mp-mq">
    <div class="mp-mq-track">
      <span class="mp-mq-seq">${seq}</span><span class="mp-mq-seq" aria-hidden="true">${seq}</span>
    </div>
  </div>`;
}

function section({ tone, label, index, id, pad = 'normal', body }) {
  return `
  <section class="mp-${tone} ${pad === 'tight' ? 'mp-pad-tight' : 'mp-pad'}"${id ? ` id="${id}"` : ''}>
    <div class="mp-container">
      ${label ? `<p class="mp-label" data-index="${esc(index)}" data-reveal>${esc(label)}</p>` : ''}
      ${body}
    </div>
  </section>`;
}

function statRow(stats, solo = false) {
  // solo: la riga sta da sola nella sezione, senza un titolo sopra da cui
  // staccarsi, quindi niente margine d'attacco
  return `
      <ul class="mp-sr${solo ? ' mp-sr-solo' : ''}">
        ${stats.map((s, i) => `
        <li class="mp-sr-item mp-rule" data-reveal data-delay="${(i * 0.08).toFixed(2)}s">
          <span class="mp-sr-value" data-count="${esc(s.value)}">${esc(s.value)}</span>
          <span class="mp-sr-label">${esc(s.label)}</span>
          ${s.note ? `<span class="mp-sr-note mp-soft">${esc(s.note)}</span>` : ''}
        </li>`).join('')}
      </ul>`;
}

function specTabs(dotazione, optionals, image) {
  const groups = [
    { id: 'dotazione', label: 'Dotazione', items: dotazione },
    { id: 'optionals', label: 'Optionals', items: optionals },
  ];
  return `
      <div class="mp-st">
        <div class="mp-st-head" role="tablist">
          ${groups.map((g, i) => `
          <button class="mp-st-tab${i === 0 ? ' is-active' : ''}" type="button" role="tab" data-tab="${g.id}" aria-selected="${i === 0}">
            <span class="mp-st-tablabel">${g.label}</span>
            <span class="mp-st-count">${pad2(g.items.length)}</span>
          </button>`).join('')}
        </div>
        <div class="mp-st-body">
          <div class="mp-st-lists">
            ${groups.map((g, gi) => `
            <ul class="mp-st-list${gi === 0 ? ' is-active' : ''}" data-panel="${g.id}">
              ${g.items.map((it, i) => `
              <li class="mp-st-item">
                <button class="mp-st-row${gi === 0 && i === 0 ? ' is-open' : ''}" type="button">
                  <span class="mp-st-num">${pad2(i + 1)}</span>
                  <span class="mp-st-title">${esc(it.title)}</span>
                  <span class="mp-plus" aria-hidden="true"><i></i><i></i></span>
                </button>
                <div class="mp-st-panel"><div class="mp-st-inner">
                  ${it.spec ? `<p class="mp-st-spec">${esc(it.spec)}</p>` : ''}
                  <p class="mp-st-desc">${esc(it.desc)}</p>
                </div></div>
              </li>`).join('')}
            </ul>`).join('')}
          </div>
          ${image ? `
          <figure class="mp-st-figure" data-reveal>
            <img src="${url(image)}" alt="" width="1600" height="900" loading="lazy" decoding="async">
            <figcaption class="mp-st-hint"><span class="mp-st-dot"></span>Click</figcaption>
          </figure>` : ''}
        </div>
      </div>`;
}

function gallery(images, captions = []) {
  const feature = images.length === 6;
  return `
      <div class="mp-gal${feature ? ' mp-gal-feature' : ''}">
        ${images.map((src, i) => `
        <figure class="mp-gal-item" data-reveal data-delay="${((i % 3) * 0.08).toFixed(2)}s">
          <div class="mp-gal-frame"><img src="${url(src)}" alt="${esc(captions[i])}" loading="lazy" decoding="async" width="1600" height="1067"></div>
          ${captions[i] ? `<figcaption>${esc(captions[i])}</figcaption>` : ''}
        </figure>`).join('')}
      </div>`;
}

// ClientLogos.astro: i marchi dei telai, bianchi su trasparenza
const BRANDS = [
  ['iveco', 'Iveco'], ['mercedes', 'Mercedes-Benz'], ['man', 'MAN'], ['ww', 'Volkswagen'],
  ['renault', 'Renault'], ['peugeot', 'Peugeot'], ['citroen', 'Citroën'], ['fiat', 'Fiat'], ['ford', 'Ford'],
];
function clientLogos(title) {
  return `
      <div class="mp-cl">
        <h2 class="mp-cl-title" data-reveal>${esc(title)}</h2>
        <ul class="mp-cl-grid">
          ${BRANDS.map(([f, n], i) => `
          <li data-reveal data-delay="${(i * 0.05).toFixed(2)}s"><img src="${url(`logos/${f}.webp`)}" alt="${esc(n)}" width="160" height="80" loading="lazy" decoding="async"></li>`).join('')}
        </ul>
      </div>`;
}

// Faq.astro: nessuna linea ha domande proprie, quindi valgono queste
const FAQ_DEFAULT = [
  { q: 'Su quali veicoli potete montare un allestimento?', a: 'Lavoriamo sui principali telai in commercio: Iveco, Mercedes, MAN, Volkswagen, Renault, Peugeot, Citroën, Fiat, Nissan, Ford e Maxus. Se il tuo mezzo non è in elenco scrivici: nella maggior parte dei casi troviamo comunque la soluzione.' },
  { q: 'Serve la patente C per guidarlo?', a: 'No. Le Mans è progettato attorno al limite delle 3,5 tonnellate: struttura interamente in alluminio, peso contenuto e carico utile fino a 1,5 tonnellate. Si guida con la patente B.' },
  { q: 'Quanto tempo serve per la consegna?', a: 'Dipende dall’allestimento e dalla disponibilità del telaio. Dopo il sopralluogo ti diamo una finestra di consegna precisa e la manteniamo: preferiamo dire una data vera piuttosto che una comoda.' },
  { q: 'Posso portare il mio veicolo o lo procurate voi?', a: 'Entrambe le cose. Puoi portarci il tuo telaio oppure ce ne occupiamo noi, seguendo l’ordine e la pratica dal primo all’ultimo passaggio.' },
  { q: 'L’allestimento è omologato?', a: 'Sì. Ogni mezzo esce dalla nostra officina con la pratica di omologazione completa e i documenti pronti per la circolazione.' },
  { q: 'Fate assistenza dopo la consegna?', a: 'Sì, e non è un servizio a parte: chi ha costruito il tuo allestimento è la stessa persona che risponde al telefono se un anno dopo hai bisogno di un ricambio o di una regolazione.' },
];
function faq(items, slug) {
  return `
      <ul class="mp-faq">
        ${items.map((it, i) => `
        <li class="mp-faq-item" data-reveal data-delay="${(i * 0.04).toFixed(2)}s">
          <details name="faq-${slug}">
            <summary><span class="mp-faq-q">${esc(it.q)}</span><span class="mp-plus" aria-hidden="true"><i></i><i></i></span></summary>
            <div class="mp-faq-panel"><div class="mp-faq-inner"><p>${esc(it.a)}</p></div></div>
          </details>
        </li>`).join('')}
      </ul>`;
}

function contactForm(line) {
  const mail = 'startruck@outlook.it';
  const id = (k) => `cf-${line.slug}-${k}`;
  return `
      <div class="mp-cf">
        <form class="mp-cf-form" data-mailto="${mail}" data-model="${esc(line.name)}" novalidate>
          <h2 class="mp-cf-formtitle">Richiedi un preventivo</h2>
          <div class="mp-cf-field">
            <label for="${id('name')}">Nome completo</label>
            <input id="${id('name')}" name="name" type="text" placeholder="Nome e cognome" required autocomplete="name">
          </div>
          <div class="mp-cf-row">
            <div class="mp-cf-field">
              <label for="${id('email')}">Email</label>
              <input id="${id('email')}" name="email" type="email" placeholder="nome@esempio.it" required autocomplete="email">
            </div>
            <div class="mp-cf-field">
              <label for="${id('phone')}">Telefono</label>
              <input id="${id('phone')}" name="phone" type="tel" placeholder="+39 ___ ___ ____" autocomplete="tel">
            </div>
          </div>
          <div class="mp-cf-field">
            <label for="${id('msg')}">Messaggio</label>
            <textarea id="${id('msg')}" name="message" rows="4" placeholder="Che mezzo hai e cosa devi trasportare?" required></textarea>
          </div>
          <button class="mp-cf-submit" type="submit"><span>Invia</span> ${arrow}</button>
          <p class="mp-cf-status" role="status" aria-live="polite"></p>
        </form>
        <div class="mp-cf-aside">
          <p class="mp-label" data-index="[ ✱ ]">Parliamone</p>
          <h2 class="mp-cf-kicker" data-reveal>Se hai in mente un progetto</h2>
          <p class="mp-cf-shout" data-reveal data-delay=".08s">CONTATTACI</p>
          <ul class="mp-cf-contacts">
            <li><a href="tel:+393408427538">+39 340 842 7538</a></li>
            <li><a href="mailto:${mail}">${mail}</a></li>
            <li class="mp-cf-addr">Str. Boschi — 46045 Pozzolo sul Mincio (MN)</li>
          </ul>
          <a class="mp-cf-cfg" href="#configuratore" data-prefill="${esc(line.name)}">Configura ${esc(line.name)} ${arrow}</a>
        </div>
      </div>`;
}

function otherLines(others) {
  return `
      <div class="mp-others">
        ${others.map((o) => `
        <a class="mp-ol" href="#${o.slug}" data-reveal>
          <img src="${url(o.hero.poster)}" alt="" width="1600" height="900" loading="lazy" decoding="async">
          <span class="mp-ol-scrim"></span>
          <span class="mp-ol-body"><span class="mp-ol-tag">${esc(o.tagline)}</span><span class="mp-ol-name">${esc(o.name)}</span></span>
          <span class="mp-ol-go" aria-hidden="true">→</span>
        </a>`).join('')}
      </div>`;
}

// ---- la pagina (stesso ordine di [slug].astro) -----------------------------

function page(line) {
  const others = lines.filter((l) => l.slug !== line.slug);
  const dot = `dotazione-${line.slug}`;           // gli id devono essere unici fra le tre viste
  return `
<!-- ============ ${line.name.toUpperCase()} ============ -->
<div id="view-${line.slug}" class="page-view mp" hidden>
  <!-- 01 · apertura: il mezzo da vicino (nero). Scambiato col banner del
       modello su indicazione, e senza sopratitolo. Il posto (altezza piena,
       h1, invito a scorrere) resta all'apertura: cambia il contenuto. -->${videoBanner({
    video: line.detail.video, poster: line.detail.poster,
    title: 'Ogni dettaglio\nè una decisione.',
    text: 'Niente è lì per caso: ogni scelta costruttiva nasce da un problema vero incontrato su strada.',
    cta: { label: 'Guarda la dotazione', target: dot },
    heading: 'h1', first: true, scrollCue: true,
  })}
  <!-- dotazione che scorre -->${marquee(line.equipment)}
  <!-- 02 · i numeri che contano (bianco): solo i punti di forza, niente testo -->${section({
    tone: 'light', body: statRow(line.stats, true),
  })}
  <!-- 03 · il modello (nero), dove prima stava il mezzo da vicino -->${videoBanner({
    video: line.hero.video, videoMobile: line.hero.videoMobile, poster: line.hero.poster,
    eyebrow: line.tagline, index: '[ 03 ]', title: line.name, text: line.intro,
    height: 'tall',
  })}
  <!-- 04 · dotazione / optionals (nero) -->${section({
    tone: 'dark', id: dot, label: "Cosa c'è a bordo", index: '[ 04 ]',
    body: specTabs(line.dotazione, line.optionals, line.gallery[2]),
  })}
  <!-- 05 · i progetti (bianco) -->${section({
    tone: 'light', label: 'Più iconici', index: '[ 05 ]',
    body: `
      <h2 class="mp-display-2 mp-gal-title" data-reveal>I progetti</h2>${gallery(line.gallery, line.captions)}`,
  })}
  <!-- 06 · clienti (grigio) -->${section({
    tone: 'surface', pad: 'tight', body: clientLogos(`Chi ha scelto ${line.name}`),
  })}
  <!-- 07 · domande frequenti (bianco) -->${section({
    tone: 'light', label: 'Domande frequenti', index: '[ 06 ]',
    body: `
      <div class="mp-faq-wrap">
        <div class="mp-faq-side">
          <h2 class="mp-display-3" data-reveal>Abbiamo già risposto</h2>
          <p class="mp-soft" data-reveal data-delay=".08s">Le domande che ci fanno più spesso. Se non trovi la tua, chiamaci: rispondiamo noi, non un centralino.</p>
        </div>${faq(line.faq ?? FAQ_DEFAULT, line.slug)}
      </div>`,
  })}
  <!-- 08 · le altre linee (grigio) -->${section({
    tone: 'surface', label: 'Le altre linee', index: '[ 07 ]', body: otherLines(others),
  })}
  <!-- 09 · contatti (nero) -->${section({
    tone: 'dark', body: contactForm(line),
  })}
</div>
<!-- ============ /${line.name.toUpperCase()} ============ -->
`;
}

// ---- scrittura --------------------------------------------------------------

const html = await fs.readFile(FILE, 'utf8');
const a = html.indexOf(START);
const b = html.indexOf(END);
if (a === -1 || b === -1 || b < a) {
  console.error('marcatori MODELLI non trovati: non tocco niente');
  process.exit(1);
}
const headEnd = html.indexOf('-->', a) + 3;       // conserva il commento d'apertura
const out = html.slice(0, headEnd) + '\n' + lines.map(page).join('') + html.slice(b);
await fs.writeFile(FILE, out);
console.log(`${lines.length} pagine modello scritte in ${FILE}`);
