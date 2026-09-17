/* ===== Rotaia dei lavori ==============================================
   Trascinamento col mouse: il dito sul telefono scorre gia' da solo. Si
   distingue il trascinamento dal clic con una soglia di pochi pixel,
   altrimenti tirare la striscia aprirebbe un post di Instagram. */
(function () {
  var rail = document.getElementById('workRail');
  if (!rail) return;
  var down = false, moved = false, startX = 0, startLeft = 0;

  rail.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;             // lo scorrimento nativo fa meglio
    down = true; moved = false;
    startX = e.clientX; startLeft = rail.scrollLeft;
    rail.setPointerCapture(e.pointerId);
  });
  rail.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) { moved = true; rail.classList.add('is-dragging'); }
    if (moved) rail.scrollLeft = startLeft - dx;
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
})();
