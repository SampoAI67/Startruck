/* Le card modello: il video parte quando il puntatore entra e torna al poster
   quando esce. play() puo' essere rifiutato (dati non pronti, risparmio
   energetico): in quel caso resta il poster, non un buco nero. */
document.querySelectorAll('.model-grid .model-card').forEach(function (card) {
  var v = card.querySelector('video');
  if (!v) return;
  var start = parseFloat(v.dataset.start || '0');
  var play = function () {
    // parti dal fotogramma del poster: senza questo il video stacca
    // sull'apertura al buio della ripresa e sembra uno sfarfallio.
    if (start && Math.abs(v.currentTime - start) > 0.05 && v.currentTime < start) {
      try { v.currentTime = start; } catch (e) {}
    }
    var p = v.play(); if (p) p.catch(function () {});
  };
  var stop = function () { v.pause(); try { v.currentTime = start; } catch (e) {} };
  card.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') play(); });
  card.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') stop(); });
  card.addEventListener('focusin', play);
  card.addEventListener('focusout', stop);
});
