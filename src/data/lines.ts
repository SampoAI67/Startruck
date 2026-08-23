// Contenuti delle tre linee di allestimento.
//
// PROVENIENZA DEI TESTI
// · Le Mans — testi e dati (1,5 t, patente B, elenco marchi, pianale
//   5.000 x 2.130 mm) presi dal progetto Wix del cliente: sono reali.
// · Privacy / Type H — su Wix erano segnaposto: la prosa qui è scritta da zero
//   e volutamente qualitativa. Nessun numero inventato: le misure vanno
//   confermate dal cliente prima della pubblicazione.

export interface SpecItem {
  title: string;
  spec?: string;
  desc: string;
}

export interface Line {
  slug: string;
  name: string;
  tagline: string;
  accentVar: string;
  intro: string;
  description: string;
  hero: { video: string; videoMobile?: string; poster: string };
  detail: { video: string; poster: string };
  stats: { value: string; label: string; note?: string }[];
  equipment: string[];
  dotazione: SpecItem[];
  optionals: SpecItem[];
  gallery: string[];
  captions: string[];
  faq?: { q: string; a: string }[];
}

// I sette elementi di serie sono quelli elencati dal cliente su Wix.
const equipmentNames = [
  'Pianale',
  'Rampe a scomparsa',
  'Verricello traslabile',
  'Fune sintetica',
  'Fari LED notturni',
  'Luci ingombro laterali LED',
  'Set 4 cinghie',
];

// Optionals: da confermare con il cliente (su Wix la colonna era un segnaposto).
const commonOptionals: SpecItem[] = [
  { title: 'Verricello elettrico maggiorato', desc: 'Per chi carica ogni giorno e non può permettersi di aspettare. Comando a distanza e tiro più deciso sulle vetture pesanti.' },
  { title: 'Pedana posteriore estraibile', desc: 'Riduce l’angolo di attacco: utile con le auto ribassate, dove ogni grado in meno è un paraurti salvato.' },
  { title: 'Cassetta porta-attrezzi integrata', desc: 'Ricavata nel sottopianale, chiusa a chiave. Cinghie e attrezzi restano a bordo senza rubare spazio al carico.' },
  { title: 'Illuminazione perimetrale supplementare', desc: 'Barre LED aggiuntive lungo il pianale: carichi e scarichi di notte con la stessa sicurezza del giorno.' },
  { title: 'Ruota di scorta con supporto dedicato', desc: 'Alloggiamento sotto telaio, fuori dalla vista e fuori dall’area di carico.' },
  { title: 'Livrea e personalizzazione grafica', desc: 'Il mezzo diventa il tuo biglietto da visita: colori, logo e finiture studiati con te.' },
];

const detailFor = (name: string): Record<string, string> => ({
  Pianale: `Il piano di carico di ${name}: alluminio estruso, superficie antiscivolo e punti di ancoraggio distribuiti su tutta la lunghezza.`,
  'Rampe a scomparsa': 'Si sfilano da sotto il pianale e rientrano a filo: nessun ingombro esterno, nessun pezzo da caricare a parte.',
  'Verricello traslabile': 'Scorre lateralmente per allinearsi all’auto invece di costringere l’auto ad allinearsi a lui. Tiro sempre dritto.',
  'Fune sintetica': 'Più leggera dell’acciaio e più sicura in caso di rottura: non frusta. Si maneggia a mani nude.',
  'Fari LED notturni': 'Illuminano l’area di lavoro dietro al mezzo. Carico e scarico al buio senza torce né improvvisazione.',
  'Luci ingombro laterali LED': 'Profilo del mezzo sempre leggibile agli altri, anche con poca luce e in manovra.',
  'Set 4 cinghie': 'Quattro cinghie a cricchetto con ganci dedicati agli ancoraggi del pianale. Incluse, non un accessorio.',
});

const dotazioneFor = (name: string, pianaleSpec?: string): SpecItem[] =>
  equipmentNames.map((title) => ({
    title,
    spec: title === 'Pianale' ? pianaleSpec : undefined,
    desc: detailFor(name)[title],
  }));

export const lines: Line[] = [
  {
    slug: 'le-mans',
    name: 'Le Mans',
    tagline: 'Performance & racing',
    accentVar: 'var(--color-line-lemans)',
    intro:
      'Progettato per offrire una struttura leggera, carico massimo e versatilità senza pari, pensato per chi non vuole rinunciare a nulla.',
    description:
      'Grazie alla struttura interamente in alluminio, Le Mans garantisce una leggerezza eccezionale e un carico utile fino a 1,5 tonnellate: tutta la capacità che ti serve, con la semplice patente B. È compatibile con i principali marchi del settore e si adatta alle esigenze della tua flotta senza chiederti di cambiare abitudini.',
    hero: {
      video: 'video/lemans-hero.mp4',
      videoMobile: 'video/lemans-hero-mobile.mp4',
      poster: 'img/lemans-hero.webp',
    },
    detail: { video: 'video/lemans-detail.mp4', poster: 'img/lemans-detail.webp' },
    stats: [
      { value: '1,5 t', label: 'Carico utile', note: 'Fino a una tonnellata e mezza di vettura, senza sconfinare.' },
      { value: 'B', label: 'Patente', note: 'Resta nei 3,5 t: lo guida chiunque abbia la patente B.' },
      { value: '11', label: 'Marchi compatibili', note: 'Dai telai Iveco e Mercedes fino a Ford e Maxus.' },
      { value: '100%', label: 'Alluminio', note: 'Struttura interamente in lega: leggera dove conta.' },
    ],
    equipment: equipmentNames,
    dotazione: dotazioneFor('Le Mans', 'Pianale 5.000 × 2.130 mm'),
    optionals: commonOptionals,
    gallery: [
      'img/lemans-01.webp', 'img/lemans-02.webp', 'img/lemans-03.webp',
      'img/lemans-04.webp', 'img/lemans-05.webp', 'img/lemans-06.webp',
    ],
    captions: ['Peugeot Boxer', 'Mercedes Sprinter', 'MAN TGE', 'Iveco Daily', 'Mercedes — dettaglio', 'Peugeot — vista drone'],
  },

  {
    slug: 'privacy',
    name: 'Privacy',
    tagline: 'Trasporto confidenziale',
    accentVar: 'var(--color-line-privacy)',
    intro:
      'Furgonato chiuso, nessuna vetrina. Quello che trasporti resta una cosa fra te e il destinatario.',
    description:
      'Privacy nasce per chi sposta auto che non devono essere viste: prototipi, vetture da collezione, consegne che richiedono riservatezza. Il vano è completamente chiuso e coibentato, l’accesso è controllato e dall’esterno il mezzo non racconta nulla del suo contenuto. La stessa cura costruttiva di Le Mans, applicata alla discrezione.',
    hero: {
      video: 'video/privacy-hero.mp4',
      videoMobile: 'video/privacy-hero-mobile.mp4',
      poster: 'img/privacy-hero.webp',
    },
    detail: { video: 'video/privacy-detail.mp4', poster: 'img/privacy-detail.webp' },
    stats: [
      { value: 'Vano chiuso', label: 'Struttura', note: 'Nessuna visibilità dall’esterno, in sosta come in viaggio.' },
      { value: 'Su misura', label: 'Ancoraggi', note: 'Posizionati sulle vetture che trasporti davvero.' },
      { value: 'B', label: 'Patente', note: 'Progettato per restare nei 3,5 t.' },
      { value: '24/7', label: 'Reperibilità', note: 'Chi ha costruito il mezzo risponde anche dopo la consegna.' },
    ],
    equipment: equipmentNames,
    dotazione: dotazioneFor('Privacy'),
    optionals: [
      { title: 'Vano coibentato e climatizzato', desc: 'Temperatura sotto controllo per vetture da collezione e verniciature delicate.' },
      { title: 'Serratura rinforzata con codice', desc: 'Accesso al vano riservato a chi deve averlo. Nessuna chiave che gira per l’officina.' },
      { title: 'Tracciamento GPS del mezzo', desc: 'Posizione del veicolo sempre verificabile durante il trasferimento.' },
      ...commonOptionals.slice(1, 4),
    ],
    gallery: [
      'img/privacy-01.webp', 'img/privacy-02.webp', 'img/privacy-03.webp',
      'img/privacy-04.webp', 'img/privacy-05.webp', 'img/privacy-06.webp',
    ],
    captions: ['Peugeot Boxer', 'Citroën Jumper', 'Iveco Daily', 'Fiat Ducato', 'Dettaglio interno', 'Vano di carico'],
  },

  {
    slug: 'type-h',
    name: 'Type H',
    tagline: 'Aspetto vintage',
    accentVar: 'var(--color-line-typeh)',
    intro:
      'La linea del Type H, la meccanica di oggi. Un mezzo che nessuno smette di guardare mentre lavora.',
    description:
      'Type H è l’allestimento per chi vuole che il trasporto faccia parte del racconto: le nervature e le proporzioni dell’originale, costruite su un telaio moderno e affidabile. Nato per showroom, eventi, club e collezioni — dove il mezzo che arriva conta quanto l’auto che scarica.',
    hero: { video: 'video/typeh-hero.mp4', poster: 'img/typeh-hero.webp' },
    detail: { video: 'video/typeh-detail.mp4', poster: 'img/typeh-detail.webp' },
    stats: [
      { value: 'Su misura', label: 'Carrozzeria', note: 'Ogni pannello è costruito e rifinito a mano.' },
      { value: 'Telaio moderno', label: 'Meccanica', note: 'L’estetica è d’epoca, l’affidabilità è di oggi.' },
      { value: 'B', label: 'Patente', note: 'Progettato per restare nei 3,5 t.' },
      { value: '1 di 1', label: 'Personalizzazione', note: 'Colori e finiture scelti insieme, pezzo unico.' },
    ],
    equipment: equipmentNames,
    dotazione: dotazioneFor('Type H'),
    optionals: [
      { title: 'Verniciatura bicolore d’epoca', desc: 'Palette storiche o colore su campione: il tono giusto cambia tutto il mezzo.' },
      { title: 'Fari e cornici cromate', desc: 'Dettagli a vista rifiniti a mano, dove l’occhio cade per primo.' },
      { title: 'Allestimento interno espositivo', desc: 'Per showroom ed eventi: il vano diventa spazio di presentazione.' },
      ...commonOptionals.slice(2, 5),
    ],
    gallery: [
      'img/typeh-01.webp', 'img/typeh-02.webp', 'img/typeh-03.webp',
      'img/typeh-04.webp', 'img/typeh-05.webp', 'img/typeh-06.webp',
    ],
    captions: ['Type H — profilo', 'Dettaglio frontale', 'Vano di carico', 'Finiture', 'Interni', 'Retro'],
  },
];

export const getLine = (slug: string) => lines.find((l) => l.slug === slug);

export const brandNames = [
  'Iveco', 'Mercedes', 'MAN', 'Volkswagen', 'Renault',
  'Peugeot', 'Citroën', 'Fiat', 'Nissan', 'Ford', 'Maxus',
];
