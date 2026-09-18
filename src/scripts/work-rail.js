/* ===== Rotaia dei lavori ==============================================
   Trascinamento col mouse: il dito sul telefono scorre gia' da solo. Si
   distingue il trascinamento dal clic con una soglia di pochi pixel,
   altrimenti tirare la striscia aprirebbe un post di Instagram.

   Rotaia infinita: la striscia c'e' tre volte (Works.astro). Si parte
   dall'inizio della copia centrale, e quando lo scorrimento si allontana di
   mezza copia si salta indietro o avanti di una copia intera: le copie sono
   identiche, quindi il salto non si vede e non si arriva mai a un bordo. */
(function () {
  var rail = document.getElementById('workRail');
  if (!rail) return;
  var strip = rail.querySelector('.work-strip');
  var down = false, moved = false, startX = 0, startLeft = 0;
  var copyW = 0;

  function measure() {
    copyW = strip.offsetWidth + 2;                    // 2px = il filo fra le copie
  }
  function wrap() {
    if (!copyW) return;
    var shift = 0;
    if (rail.scrollLeft < copyW * 0.5) shift = copyW;
    else if (rail.scrollLeft > copyW * 1.5) shift = -copyW;
    if (!shift) return;
    rail.scrollLeft += shift;
    startLeft += shift;                               // il trascinamento in corso non sobbalza
  }
  function center() {
    var offset = copyW ? (rail.scrollLeft % copyW) : 0;
    measure();
    rail.scrollLeft = copyW + offset;
  }
  center();
  rail.addEventListener('scroll', wrap, { passive: true });
  addEventListener('resize', center);

  rail.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;             // lo scorrimento nativo fa meglio
    down = true; moved = false;
    startX = e.clientX; startLeft = rail.scrollLeft;
  });
  rail.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    // la cattura parte solo quando e' davvero un trascinamento: presa subito,
    // dirotterebbe anche il semplice clic sulla rotaia e il post non si aprirebbe
    if (!moved && Math.abs(dx) > 4) { moved = true; rail.classList.add('is-dragging'); rail.setPointerCapture(e.pointerId); }
    if (moved) { rail.scrollLeft = startLeft - dx; wrap(); }
  });
  var end = function (e) {
    if (!down) return;
    down = false;
    rail.classList.remove('is-dragging');
    if (rail.releasePointerCapture) try { rail.releasePointerCapture(e.pointerId); } catch (x) {}
  };
  rail.addEventListener('pointerup', end);
  rail.addEventListener('pointercancel', end);
  rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
  // Il clic col mouse non sposta il focus: nelle copie laterali (aria-hidden)
  // un link a fuoco sarebbe nascosto a chi usa un lettore di schermo. Il link
  // si apre lo stesso, e da tastiera si passa solo per la copia vera.
  rail.addEventListener('mousedown', function (e) { e.preventDefault(); });
})();
