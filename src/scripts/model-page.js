/* ===== Pagine modello ==================================================
   Comparsa allo scroll, video, parallasse, schede della dotazione, galleria,
   domande e modulo contatti di /allestimenti/<slug>/. */
(function () {
  if (!document.querySelector('.mp')) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- comparsa allo scroll ------------------------------------------- */
  var countUp = function (el) {
    var raw = el.getAttribute('data-count') || '';
    var m = raw.match(/([\d.,]+)/);
    if (!m || reduce) return;
    var numText = m[1];
    var decimals = (numText.split(',')[1] || '').length;
    var target = parseFloat(numText.replace(/\./g, '').replace(',', '.'));
    if (!isFinite(target)) return;
    var parts = raw.split(numText), pre = parts[0], post = parts[1];
    var fmt = function (v) {
      return v.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };
    var t0 = performance.now(), DUR = 1100;
    el.textContent = pre + fmt(0) + post;
    var tick = function (now) {
      var p = Math.min((now - t0) / DUR, 1);
      el.textContent = pre + fmt(target * (1 - Math.pow(1 - p, 3))) + post;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.dataset.delay) el.style.animationDelay = el.dataset.delay;
      el.classList.add('is-in');
      el.addEventListener('animationend', function () { el.classList.add('is-done'); }, { once: true });
      revealer.unobserve(el);
      var n = el.querySelector('.mp-sr-value[data-count]');
      if (n) countUp(n);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.mp [data-reveal]').forEach(function (el) {
    if (reduce) el.classList.add('is-in');
    else revealer.observe(el);
  });

  /* --- video: partono solo quando si vedono --------------------------- */
  // Due video per pagina, nessuno in autoplay/preload: il secondo banner sta
  // molto piu' in basso e non si scarica finche' non ci si arriva.
  var player = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
        var p = v.play(); if (p) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.mp-vb-video').forEach(function (v) { player.observe(v); });

  /* --- parallasse dello sfondo dei banner ----------------------------- */
  if (!reduce) {
    var ticking = false;
    var parallax = function () {
      ticking = false;
      var vh = innerHeight;
      document.querySelectorAll('.mp [data-parallax]').forEach(function (l) {
        var r = l.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var progress = (r.top + r.height / 2 - vh / 2) / vh;
        l.style.transform = 'translate3d(0,' + (progress * 7).toFixed(2) + '%,0)';
      });
    };
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    addEventListener('resize', parallax, { passive: true });
    parallax();
  }

  /* --- dotazione / optionals ------------------------------------------ */
  document.querySelectorAll('.mp-st').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('.mp-st-tab'));
    var lists = Array.prototype.slice.call(root.querySelectorAll('.mp-st-list'));
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var id = tab.getAttribute('data-tab');
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', String(on));
        });
        lists.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-panel') === id); });
      });
    });
    lists.forEach(function (list) {
      var rows = Array.prototype.slice.call(list.querySelectorAll('.mp-st-row'));
      rows.forEach(function (row) {
        row.addEventListener('click', function () {
          var open = row.classList.contains('is-open');
          rows.forEach(function (r) { r.classList.remove('is-open'); });
          row.classList.toggle('is-open', !open);
        });
      });
    });
  });

  /* --- galleria: la foto scelta passa nel riquadro grande -------------- */
  // Lo scambio e' uno scambio di posto nel DOM: il riquadro grande e' sempre
  // il primo figlio, quindi il CSS non deve sapere niente di cosa e' stato
  // scelto. La dissolvenza usa animate() e non una classe, perche' la
  // comparsa allo scroll lascia gia' un'animazione CSS sull'opacita' e una
  // regola normale non la batterebbe.
  document.querySelectorAll('.mp-gal.mp-gal-feature').forEach(function (gal) {
    var wide = matchMedia('(min-width: 640px)');
    var busy = false;
    var sync = function () {
      Array.prototype.forEach.call(gal.children, function (it, i) {
        it.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      });
    };
    var swap = function (a, b) {
      var mark = document.createComment('');
      gal.replaceChild(mark, a);
      gal.replaceChild(a, b);
      gal.replaceChild(b, mark);
      sync();
    };
    var fade = function (el, from, to) {
      return el.animate([{ opacity: from }, { opacity: to }], { duration: 220, easing: 'ease', fill: 'forwards' });
    };
    var promote = function (item) {
      var big = gal.firstElementChild;
      if (busy || item === big || !wide.matches) return;
      // se si clicca prima che la comparsa sia finita, la si chiude qui
      big.classList.add('is-done'); item.classList.add('is-done');
      if (reduce) { swap(big, item); return; }
      busy = true;
      var out = [fade(big, 1, 0), fade(item, 1, 0)];
      Promise.all(out.map(function (a) { return a.finished; })).then(function () {
        swap(big, item);
        var back = [fade(big, 0, 1), fade(item, 0, 1)];
        return Promise.all(back.map(function (a) { return a.finished; })).then(function () {
          out.concat(back).forEach(function (a) { a.cancel(); });
        });
      }).then(function () { busy = false; }, function () { busy = false; });
    };
    gal.addEventListener('click', function (e) {
      var it = e.target.closest('.mp-gal-item');
      if (it) promote(it);
    });
    gal.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var it = e.target.closest('.mp-gal-item');
      if (!it) return;
      e.preventDefault();
      promote(it);
    });
    sync();
  });

  /* --- domande: una aperta per volta dove details[name] non c'e' ------- */
  if (!('name' in document.createElement('details'))) {
    document.querySelectorAll('.mp-faq').forEach(function (faq) {
      var all = Array.prototype.slice.call(faq.querySelectorAll('details'));
      all.forEach(function (d) {
        d.addEventListener('toggle', function () {
          if (d.open) all.forEach(function (o) { if (o !== d) o.open = false; });
        });
      });
    });
  }

  /* --- modulo contatti (ContactForm) ---------------------------------- */
  // Sito statico: niente endpoint, quindi il modulo apre la mail gia'
  // compilata invece di fingere di aver inviato.
  document.querySelectorAll('.mp-cf-form').forEach(function (form) {
    var status = form.querySelector('.mp-cf-status');
    var markInvalid = function () {
      var first = null;
      form.querySelectorAll('input, textarea').forEach(function (el) {
        var ok = el.checkValidity();
        el.closest('.mp-cf-field').classList.toggle('is-invalid', !ok);
        if (!ok && !first) first = el;
      });
      return first;
    };
    form.addEventListener('input', function (e) {
      if (e.target.checkValidity()) e.target.closest('.mp-cf-field').classList.remove('is-invalid');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = markInvalid();
      if (bad) { status.textContent = 'Controlla i campi evidenziati.'; bad.focus(); return; }
      var data = new FormData(form);
      var get = function (k) { return String(data.get(k) || ''); };
      var body = [
        'Nome: ' + get('name'),
        'Email: ' + get('email'),
        'Telefono: ' + (get('phone') || '—'),
        'Allestimento: ' + form.getAttribute('data-model'),
        '',
        get('message')
      ].join('\n');
      location.href = 'mailto:' + form.getAttribute('data-mailto')
        + '?subject=' + encodeURIComponent('Richiesta preventivo — ' + form.getAttribute('data-model') + ' — ' + get('name'))
        + '&body=' + encodeURIComponent(body);
      status.textContent = 'Ti apriamo il client di posta con il messaggio già pronto.';
    });
  });
})();
