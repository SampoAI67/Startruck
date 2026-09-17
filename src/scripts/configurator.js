import { base } from '../lib/base';

/* ===== Configuratore ===== */
const steps = Array.from(document.querySelectorAll('.step'));
let current = 1;
const state = { categoria:null, marca:null, marcaAltro:'', allestimento:null, accessori:[], nome:'', azienda:'', telefono:'', email:'', note:'' };

const stepCounter = document.getElementById('stepCounter');
const stepLabel = document.getElementById('stepLabel');
const rampFill = document.getElementById('rampFill');
const btnNext = document.getElementById('btnNext');
const btnBack = document.getElementById('btnBack');
const gateNext = document.getElementById('gateNext');
const labels = {1:'Categoria veicolo',2:'Autocarro base',3:'Allestimento',4:'Accessori',5:'I tuoi dati',6:'Riepilogo'};

function selectCard(group, value, el){
  document.querySelectorAll(`.opt-card[data-group="${group}"]`).forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  state[group] = value;
  validateStep();
  refresh();
}

document.querySelectorAll('.opt-card').forEach(card=>{
  card.addEventListener('click', ()=> selectCard(card.dataset.group, card.dataset.value, card));
  card.setAttribute('tabindex','0');
  card.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); card.click(); } });
});

document.getElementById('marcaAltro').addEventListener('input', e=>{ state.marcaAltro = e.target.value; validateStep(); refresh(); });

document.querySelectorAll('#grid-accessori .acc-item input').forEach(chk=>{
  chk.addEventListener('change', ()=>{
    chk.closest('.acc-item').classList.toggle('selected', chk.checked);
    state.accessori = Array.from(document.querySelectorAll('#grid-accessori input:checked')).map(i=>i.value);
    refresh();
  });
});

['nome','azienda','telefono','email','note'].forEach(id=>{
  document.getElementById(id).addEventListener('input', e=>{ state[id]=e.target.value; validateStep(); });
});

// Ridisegna cio' che dipende dallo stato ma non dal passo (riepilogo in
// barra, mezzo mostrato). Il corpo vero e' in coda allo script.
function refresh(){}

function validateStep(){
  let ok = true;
  if(current===1) ok = !!state.categoria;
  if(current===2) ok = !!state.marca || state.marcaAltro.trim().length>0;
  if(current===3) ok = !!state.allestimento;
  if(current===4) ok = true;
  if(current===5) ok = state.nome.trim() && state.telefono.trim() && state.email.trim();
  btnNext.disabled = !ok;
  // Il pulsante della soglia guarda solo la categoria: e' l'unica scelta li'.
  if(gateNext) gateNext.disabled = !state.categoria;
}

function buildSummary(){
  const marcaFinale = state.marcaAltro.trim() ? state.marcaAltro.trim() : (state.marca || '—');
  // marcaFinale e' testo scritto da chi compila: ripulito prima di finire in HTML
  const html = `
    <h4>Riepilogo configurazione</h4>
    <div class="summary-row"><span class="k">Categoria</span><span class="v">${esc(state.categoria || '—')}</span></div>
    <div class="summary-row"><span class="k">Autocarro</span><span class="v">${esc(marcaFinale)}</span></div>
    <div class="summary-row"><span class="k">Allestimento</span><span class="v">${esc(state.allestimento || '—')}</span></div>
    <div class="summary-row"><span class="k">Accessori</span><span class="v">${state.accessori.length ? esc(state.accessori.join(', ')) : 'Nessuno selezionato'}</span></div>
  `;
  ['summaryBox','summaryBox2'].forEach(function(id){
    const box = document.getElementById(id);
    if(box) box.innerHTML = html;
  });
}

function showStep(n){
  steps.forEach(s=> s.classList.toggle('active', Number(s.dataset.step)===n));
  if(n<=5){
    stepCounter.textContent = `STEP ${n} / 5`;
    stepLabel.textContent = labels[n];
    rampFill.style.left = ((n-1)/4*100)+'%';
    for(let i=1;i<=5;i++){
      document.getElementById('tick'+i).classList.toggle('done', i<=n);
    }
  }
  if(n>=5) buildSummary();
  btnBack.style.visibility = (n===1) ? 'hidden' : 'visible';
  btnNext.textContent = n===5 ? 'Vai al riepilogo →' : (n===6 ? 'Invia configurazione' : 'Continua →');
  btnNext.classList.toggle('btn-submit', n>=5);
  // Al riepilogo la scala resta in barra, tutta percorsa: toglierla farebbe
  // saltare il pulsante di uscita dall'altra parte dello schermo.
  if(n===6){
    rampFill.style.left = '100%';
    for(let i=1;i<=5;i++) document.getElementById('tick'+i).classList.add('done');
    btnBack.textContent = '← Modifica dati';
  } else if(n===5){
    btnBack.textContent = '← Indietro';
  }
  validateStep();
  if(n===6) btnNext.disabled = false;
}

btnNext.addEventListener('click', ()=>{
  if(current===5){ current = 6; showStep(6); return; }
  if(current===6){ sendMail(); setTimeout(CFG.leave, 400); return; }
  current++;
  showStep(current);
});

btnBack.addEventListener('click', ()=>{
  if(current>1){ current--; showStep(current); }
});

function sendMail(){
  const marcaFinale = state.marcaAltro.trim() ? state.marcaAltro.trim() : (state.marca || '—');
  const subject = `Richiesta preventivo — ${state.allestimento || 'Allestimento'} su ${marcaFinale}`;
  const body = [
    `Nome: ${state.nome}`,
    `Azienda: ${state.azienda || '-'}`,
    `Telefono: ${state.telefono}`,
    `Email: ${state.email}`,
    ``,
    `Categoria: ${state.categoria}`,
    `Autocarro: ${marcaFinale}`,
    `Allestimento: ${state.allestimento}`,
    `Accessori: ${state.accessori.length ? state.accessori.join(', ') : 'Nessuno'}`,
    ``,
    `Note: ${state.note || '-'}`
  ].join('\n');
  window.location.href = `mailto:startruck@outlook.it?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

showStep(1);

function prefillModel(modello){
  const card = document.querySelector(`.opt-card[data-group="allestimento"][data-value="${modello}"]`);
  if(card){ selectCard('allestimento', modello, card); }
}

/* ===== Visore accessori ================================================
   Il mezzo e' un
   video da 10 s che copre 360 gradi: ruotare = spostare currentTime.
   I punti sono ancorati ad ANGOLI, non a numeri di fotogramma, cosi' un
   re-encode del video non obbliga a ritarare tutto da capo. */
var TT = (function () {
  var HOT = {
    pianale:    { titolo: 'Pianale in alluminio',    angle: 150, x: 0.34,  y: 0.60,  zoom: 2.0 },
    rampe:      { titolo: 'Rampe, sotto il pianale', angle: 201, x: 0.565, y: 0.638, zoom: 3.0 },
    verricello: { titolo: 'Verricello, lato guida',  angle: 291, x: 0.385, y: 0.51,  zoom: 3.2 },
    fari:       { titolo: 'Fari sulla paratia',      angle: 201, x: 0.524, y: 0.466, zoom: 3.2 },
    cinghie:    { titolo: 'Ancoraggi sul pianale',   angle: 201, x: 0.58,  y: 0.527, zoom: 4.0 },
    full:       { titolo: 'Vista completa',          angle: 150, x: 0.5,   y: 0.5,   zoom: 1 }
  };
  var HI = { '150': 1, '201': 1, '291': 1 };
  var HI_BASE = base('orbit/lemans/hi/');

  var root, viewport, plate, video, still, markerLayer, loading, bar, pct, what;
  var duration = 10, ready = false, booted = false, anim = null, active = null;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var drag = false, startX = 0, startT = 0;

  function mod(a, n) { return ((a % n) + n) % n; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function timeOf(deg) { return (mod(deg, 360) / 360) * duration; }

  /* --- ricerca: una sola in volo -------------------------------------
     Assegnare currentTime a ogni pointermove intasa il decoder (su iOS in
     particolare). Si tiene solo l'ultima posizione voluta e si ricerca di
     nuovo appena la precedente e' finita. */
  var wanted = null, seeking = false;
  function flushSeek() {
    if (seeking || wanted === null) return;
    var t = wanted; wanted = null; seeking = true;
    try { video.currentTime = t; } catch (e) { seeking = false; }
  }
  function seekTo(t) { wanted = mod(t, duration); flushSeek(); }

  function startSpin() { if (!reduce) { var pl = video.play(); if (pl) pl.catch(function () {}); } }
  function stopSpin() { video.pause(); }

  function rotateTo(deg, then) {
    if (anim) cancelAnimationFrame(anim);
    stopSpin();
    var from = video.currentTime, target = timeOf(deg), delta = target - from;
    if (delta > duration / 2) delta -= duration;          // sempre per la via piu' corta
    if (delta < -duration / 2) delta += duration;
    if (reduce) { seekTo(target); if (then) then(); return; }
    var dur = Math.min(280 + Math.abs(delta / duration) * 360 * 5.2, 1500);
    var t0 = performance.now();
    var step = function (now) {
      var pr = Math.min((now - t0) / dur, 1);
      seekTo(from + delta * easeOutCubic(pr));
      if (pr < 1) anim = requestAnimationFrame(step);
      else { anim = null; seekTo(target); if (then) then(); }
    };
    anim = requestAnimationFrame(step);
  }

  function zoomTo(h, id) {
    var sc = h.zoom || 2.4;
    if (sc === 1) { clearZoom(); return; }
    var t = 'scale(' + sc + ') translate(' + ((0.5 - h.x) * 100).toFixed(2) + '%,' + ((0.5 - h.y) * 100).toFixed(2) + '%)';
    plate.style.transform = t;
    markerLayer.style.transform = t;
    root.style.setProperty('--tt-s', String(sc));
    Array.prototype.forEach.call(markerLayer.children, function (m) {
      m.classList.toggle('is-shown', m.getAttribute('data-for') === id);
    });
    // il video e' a 1280 px: a 4x non regge, si sovrappone il fermo-immagine
    // grande, ma solo quando e' arrivato, per non far lampeggiare il riquadro.
    if (HI[String(h.angle)]) {
      var url = HI_BASE + h.angle + '.webp', pre = new Image();
      pre.onload = function () { if (active !== id) return; still.src = url; still.classList.add('is-shown'); };
      pre.src = url;
    }
  }

  function clearZoom(instant) {
    if (instant) { plate.style.transition = 'none'; markerLayer.style.transition = 'none'; still.style.transition = 'none'; }
    plate.style.transform = '';
    markerLayer.style.transform = '';
    root.style.setProperty('--tt-s', '1');
    still.classList.remove('is-shown');
    Array.prototype.forEach.call(markerLayer.children, function (m) { m.classList.remove('is-shown'); });
    if (instant) { void plate.offsetWidth; plate.style.transition = ''; markerLayer.style.transition = ''; still.style.transition = ''; }
  }

  function say(text, muted) {
    if (!what) return;
    what.textContent = text;
    what.classList.toggle('is-muted', !!muted);
  }

  function look(id, label) {
    var h = HOT[id];
    if (!h) return;
    if (!booted) boot();
    active = id;
    if (!ready) { say(label || h.titolo); return; }
    say(label || h.titolo, !!label);
    clearZoom();
    rotateTo(h.angle, function () { zoomTo(h, id); });
  }

  function boot() {
    if (booted) return;
    booted = true;
    root = document.getElementById('accViewer');
    if (!root) return;
    viewport = root.querySelector('.tt-viewport');
    plate = root.querySelector('.tt-plate');
    video = root.querySelector('.tt-video');
    still = root.querySelector('.tt-still');
    markerLayer = root.querySelector('.tt-markers');
    loading = root.querySelector('.tt-loading');
    bar = root.querySelector('.tt-bar i');
    pct = root.querySelector('.tt-pct');
    what = root.querySelector('.tt-what');
    duration = Number(root.getAttribute('data-duration') || 10);

    Object.keys(HOT).forEach(function (id) {
      if (id === 'full') return;
      var m = document.createElement('span');
      m.className = 'tt-marker';
      m.setAttribute('data-for', id);
      m.style.left = (HOT[id].x * 100).toFixed(2) + '%';
      m.style.top = (HOT[id].y * 100).toFixed(2) + '%';
      m.innerHTML = '<span class="tt-ping"></span><span class="tt-dot"></span>';
      markerLayer.appendChild(m);
    });

    video.addEventListener('seeked', function () { seeking = false; flushSeek(); });

    viewport.addEventListener('pointerdown', function (e) {
      if (!ready) return;
      drag = true; startX = e.clientX; startT = video.currentTime;
      stopSpin();
      if (anim) { cancelAnimationFrame(anim); anim = null; }   // il dito ha priorita'
      if (active) { clearZoom(true); active = null; say('Vista completa'); }
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!drag) return;
      seekTo(startT - ((e.clientX - startX) / viewport.clientWidth) * duration);
    });
    var endDrag = function (e) {
      if (!drag) return;
      drag = false;
      viewport.classList.remove('is-dragging');
      if (viewport.releasePointerCapture) viewport.releasePointerCapture(e.pointerId);
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    var setProgress = function (pr) { bar.style.width = Math.round(pr * 100) + '%'; pct.textContent = Math.round(pr * 100) + '%'; };
    video.addEventListener('progress', function () {
      if (!video.duration) return;
      var end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
      setProgress(Math.min(end / video.duration, 1));
    });
    var go = function () {
      if (ready) return;
      ready = true; setProgress(1);
      loading.classList.add('is-done');
      if (active && active !== 'full') look(active); else startSpin();
    };
    video.addEventListener('canplaythrough', go);
    // su alcuni browser canplaythrough non arriva mai se il video e' in cache
    video.addEventListener('loadeddata', function () { setTimeout(go, 400); });

    video.preload = 'auto';
    video.load();
  }

  return { boot: boot, look: look, has: function (id) { return !!HOT[id]; } };
})();

/* Spuntare un accessorio muove il mezzo: chi configura vede DOVE finisce il
   pezzo che ha appena scelto. Gli optional senza un bersaglio reale nel
   girato non fingono una posizione, lo dicono. */
document.querySelectorAll('#grid-accessori .acc-item').forEach(function (item) {
  item.addEventListener('click', function () {
    document.querySelectorAll('#grid-accessori .acc-item').forEach(function (o) { o.classList.remove('is-looking'); });
    item.classList.add('is-looking');
    var spot = item.getAttribute('data-spot');
    if (spot && TT.has(spot)) {
      TT.look(spot);
    } else {
      var name = item.textContent.replace('proposta', '').trim();
      TT.look('full', name + ' \u2014 non visibile su questo mezzo');
    }
  });
});

/* ===== Palco del configuratore =========================================
   La categoria del veicolo e' la soglia: sceglierla porta dentro, e da li'
   si esce solo con "Esci dalla configurazione" o inviando. Niente uscita
   con lo scroll e niente uscita con Esc, per richiesta esplicita: e' anche
   cio' che permette al passo "indietro" di tornare alla categoria senza
   sbattere fuori chi sta configurando.
   La scheda del passo 1 non e' duplicata: e' lo STESSO nodo, spostato fra
   la soglia e il pannello, cosi' non esistono due stati da tenere allineati. */
var CFG = (function () {
  var stage = document.getElementById('cfgStage');
  var gate = document.getElementById('cfgGate');
  var panel = document.getElementById('cfgPanel');
  var step1 = document.querySelector('.step[data-step="1"]');
  // da dove viene, per rimetterlo al suo posto e non in fondo alla scheda
  var casa = step1.parentNode, dopo = step1.nextSibling;
  var savedY = 0, open = false;

  /* lo scroll della pagina e' "smooth": rimetterlo a mano lo farebbe volare */
  function jumpTo(y) {
    var h = document.documentElement, prev = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    h.style.scrollBehavior = prev;
  }

  function enter() {
    if (open) return;
    open = true;
    savedY = window.pageYOffset || document.documentElement.scrollTop || 0;
    panel.insertBefore(step1, panel.firstChild);
    document.body.style.top = (-savedY) + 'px';
    document.body.classList.add('cfg-locked');
    TT.boot();
    cercaFoto();
    document.getElementById('btnExit').focus();
  }

  function leave() {
    if (!open) return;
    open = false;
    casa.insertBefore(step1, dopo);          // torna sopra al pulsante, non sotto
    document.body.classList.remove('cfg-locked');
    document.body.style.top = '';
    jumpTo(savedY);
  }

  return { enter: enter, leave: leave, isOpen: function () { return open; } };
})();

document.getElementById('btnExit').addEventListener('click', CFG.leave);

// "Continua" della soglia: da qui in poi si e' dentro al palco bloccato.
if (gateNext) gateNext.addEventListener('click', function () {
  if (!state.categoria) return;
  CFG.enter();
  current = 2;
  showStep(2);
});

/* ===== Fototessere degli optional ======================================
   Il nome del file si ricava dall'etichetta: minuscolo, senza accenti,
   spazi e simboli in trattini. Il riquadro compare SOLO se il file esiste
   (l'elenco lo scrive il build in data-photos), quindi finche' le foto non
   ci sono non resta un rettangolo grigio.
   Per aggiungerne una basta lasciar cadere il file in
      public/optionals/<slug>.webp
   e ripubblicare, senza toccare una riga di HTML. */
function slugify(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
var cercaFoto = function () {
  cercaFoto = function () {};                 // una volta sola per sessione
  var grid = document.getElementById('grid-accessori');
  var photos = JSON.parse(grid.getAttribute('data-photos') || '[]');
  grid.querySelectorAll('.acc-item').forEach(function (item) {
    var chk = item.querySelector('input');
    if (!chk) return;
    var slug = slugify(chk.value);
    if (photos.indexOf(slug) === -1) return;
    var t = document.createElement('span');
    t.className = 'acc-thumb';
    t.style.backgroundImage = 'url("' + base('optionals/' + slug + '.webp') + '")';
    item.insertBefore(t, chk.nextSibling);
  });
};

/* ===== Riepilogo in barra e mezzo mostrato ============================= */
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function renderRecap() {
  var box = document.getElementById('cfgRecap');
  if (!box) return;
  var marca = state.marcaAltro.trim() || state.marca;
  var bits = [
    ['Categoria', state.categoria ? state.categoria.split('—')[0].trim() : null],
    ['Autocarro', marca],
    ['Allestimento', state.allestimento],
    ['Accessori', state.accessori.length ? String(state.accessori.length) : null]
  ];
  box.innerHTML = bits.map(function (b) {
    return '<span>' + b[0] + ' <b>' + (b[1] ? esc(b[1]) : '—') + '</b></span>';
  }).join('');
}

/* Il girato a 360 esiste solo per il Le Mans. Sugli altri allestimenti si
   mostra la foto di studio e lo si dice, invece di far ruotare il mezzo
   sbagliato. Al passo degli accessori il visore torna comunque: li' serve
   a indicare DOVE finisce il pezzo, e il riferimento e' dichiarato. */
var ALT = {
  'Privacy': 'https://static.wixstatic.com/media/d56fb4_9a8c5dbce5944d9599f9adf6665a5954~mv2.jpg/v1/fill/w_1024,h_580,q_90,enc_avif,quality_auto/d56fb4_9a8c5dbce5944d9599f9adf6665a5954~mv2.jpg',
  'Type H': 'https://static.wixstatic.com/media/d56fb4_272e847b30894699b412d3ce24f79a13~mv2.jpg/v1/crop/x_0,y_66,w_1600,h_920/fill/w_980,h_564,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/typeh_industrial.jpg'
};
function syncVisual(n) {
  var alt = document.getElementById('cfgAlt');
  if (!alt) return;
  var src = (n !== 4) && state.allestimento && ALT[state.allestimento];
  if (src) {
    alt.querySelector('img').src = src;
    alt.querySelector('span').textContent = state.allestimento + ' — foto di studio. La vista a 360° è girata sul Le Mans.';
    alt.classList.add('is-shown');
  } else {
    alt.classList.remove('is-shown');
    if (n === 4 && state.allestimento && ALT[state.allestimento]) {
      TT.look('full', 'Riferimento a 360°: Le Mans');
    }
  }
}

refresh = function () { renderRecap(); syncVisual(current); };

var _showStep = showStep;
showStep = function (n) {
  _showStep(n);
  if (n === 4) TT.boot();
  renderRecap();
  syncVisual(n);
  var panel = document.getElementById('cfgPanel');
  if (panel) panel.scrollTop = 0;
};

/* Le pagine modello portano qui con ?modello=<nome>#configuratore: il
   modello arriva gia' scelto al passo 3. Il parametro poi si toglie
   dall'indirizzo, cosi' ricaricare o condividere non lo ripete. */
(function () {
  var params = new URLSearchParams(location.search);
  var modello = params.get('modello');
  if (!modello) return;
  prefillModel(modello);
  params.delete('modello');
  var q = params.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
})();
