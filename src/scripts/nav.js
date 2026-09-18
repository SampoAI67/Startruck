/* ===== Menu di telefono ================================================
   Si chiude da solo scegliendo una voce: molte sono ancore della pagina di
   casa, e restare aperti coprirebbe cio' a cui si e' appena saltati. */
(function () {
  var btn = document.getElementById('navToggle'), panel = document.getElementById('navPanel');
  if (!btn || !panel) return;
  var set = function (open) {
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '✕' : '☰';
  };
  btn.addEventListener('click', function () { set(!document.body.classList.contains('nav-open')); });
  panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
  addEventListener('resize', function () { if (innerWidth > 860) set(false); });
})();

/* ===== Menu "Modelli" =================================================
   Il passaggio del puntatore lo apre gia' via CSS; qui il clic (telefono in
   orizzontale, tastiera), Esc e il clic fuori per chiuderlo. */
(function () {
  var drop = document.getElementById('navDrop');
  if (!drop) return;
  var btn = drop.querySelector('.navdrop-btn');
  var set = function (open) {
    drop.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  btn.addEventListener('click', function () {
    drop.classList.remove('is-dismissed');
    set(!drop.classList.contains('is-open'));
  });
  document.addEventListener('click', function (e) { if (!drop.contains(e.target)) set(false); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { set(false); drop.classList.add('is-dismissed'); btn.focus(); }
  });
  // il passaggio del puntatore torna ad aprirlo appena se ne esce
  drop.addEventListener('mouseleave', function () { drop.classList.remove('is-dismissed'); });
  // uscire col tab dall'ultimo link chiude il menu
  drop.addEventListener('focusout', function (e) { if (!drop.contains(e.relatedTarget)) set(false); });
})();

/* La barra segue la direzione dello scorrimento e cambia veste passato
   l'hero. Le pagine senza hero (quelle legali) la vogliono piena da subito:
   trasparente, sopra un fondo chiaro, sparirebbe. */
(function () {
  var hero = document.querySelector('.hero, .mp-vb-first');
  var lastY = window.scrollY, ticking = false;
  function heroDepth() {
    return hero ? hero.getBoundingClientRect().height - 85 : -1;
  }
  function update() {
    var y = Math.max(window.scrollY, 0), past = y > heroDepth();
    document.body.classList.toggle('nav-solid', past);
    if (y > lastY + 6 && past) document.body.classList.add('nav-hidden');
    else if (y < lastY - 6 || y <= 0) document.body.classList.remove('nav-hidden');
    lastY = y; ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

// L'anno nel footer: un sito statico non lo aggiorna da solo fra un build e
// l'altro, e un anno vecchio scolpito nel markup invecchia male.
(function () {
  var y = document.getElementById('footYear');
  if (y) y.textContent = new Date().getFullYear();
})();
