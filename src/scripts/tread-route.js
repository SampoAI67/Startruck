import { base } from '../lib/base';

/* ===== Percorso a traccia di pneumatico ================================
   La striscia di battistrada e' un disegno DRITTO. Per farla curvare si
   taglia a fettine lungo il percorso: ogni fettina viene ruotata della
   tangente in quel punto, quindi i tasselli restano perpendicolari alla
   direzione di marcia invece di essere schiacciati da uno stiramento.
   Niente tassello singolo ripetuto: il battistrada e' irregolare di
   proposito, si srotola tutto e si ricomincia solo a fine striscia. */
(function () {
  var wrap = document.querySelector('.route-wrap');
  if (!wrap) return;
  var cv = wrap.querySelector('.route-canvas');
  var grid = wrap.querySelector('.process-grid');
  var ctx = cv.getContext('2d');

  var VB_W = 1098, VB_H = 477;   // riquadro del tracciato disegnato in Figma
  var STROKE = 22;               // larghezza di una gomma: con due tracce affiancate, piu' snella di una sola
  var PITCH = 2;                 // battistrada allungato 2x nel senso di marcia
  var OVER = 150;                // quanto il canvas deborda ai lati della griglia
  var STEP = 2;     // lunghezza della fettina, in pixel di destinazione

  var img = new Image();
  var ready = false;
  img.onload = function () { ready = true; draw(); };
  img.src = base('tread.png');

  function draw() {
    var path = document.getElementById('routePath');
    if (!ready || !path) return;
    var w = wrap.clientWidth, gh = grid.offsetHeight, gw = grid.offsetWidth;
    if (!w || !gh) return;

    /* Un solo tracciato, due assi.
       Schermo largo: la x del disegno corre lungo la RIGA di schede e la y e'
       lo scarto sopra/sotto. Telefono: lo stesso, ruotato di un quarto di
       giro — la x corre lungo la COLONNA e la y diventa lo scarto a destra e
       a sinistra. Le anse escono dai fianchi dello schermo come di la' escono
       sopra e sotto, e i prolungamenti entrano da sopra ed escono da sotto
       senza che una riga della loro costruzione cambi. */
    var vert = matchMedia('(max-width:860px)').matches;

    /* Il tracciato disegnato copre la RIGA di schede e non si tocca: e' la
       parte che incrocia le quattro fasi. A sinistra e a destra viene
       PROLUNGATO fino ai bordi dello schermo con due tratti calcolati qui.
       Le giunzioni sono a tangente continua (il tracciato parte e finisce
       con una pendenza nota), altrimenti si vedrebbe lo spigolo. */
    var wrapRect = wrap.getBoundingClientRect();
    var gridRect = grid.getBoundingClientRect();
    var CW = window.innerWidth;

    /* kMain scala l'asse LUNGO (quello che incrocia le schede una dopo
       l'altra), kCross l'ampiezza dell'onda. In verticale le schede devono
       occupare la stessa fetta di ampiezza che occupano in orizzontale
       (~49%), altrimenti o coprono tutto o le anse restano fuori. */
    var kMain, kCross;
    if (vert) {
      kMain = gh / VB_W;
      kCross = gw / (VB_H * 0.49);
    } else {
      kMain = w / VB_W;
      kCross = kMain;
    }
    var k = kMain;
    var THICK = STROKE * kCross;
    /* Due tracce affiancate, come le due ruote di un mezzo passato di li':
       ciascuna sta a OFF dal tracciato, misurato perpendicolare alla marcia,
       quindi nelle curve restano parallele invece di sovrapporsi. */
    // gomme gemellate: fra i bordi interni delle due tracce restano GAP px,
    // fissi, cosi' la distanza non si restringe insieme alle tracce
    var GAP = 12;
    var OFF = THICK / 2 + GAP / 2;
    var REACH = THICK / 2 + OFF;                              // ingombro dall'asse

    // quanto il tracciato entra prima della prima scheda e esce dopo l'ultima
    var beforePx, afterPx;
    if (vert) {
      beforePx = 150; afterPx = 150;
    } else {
      beforePx = Math.max(0, wrapRect.left) + 60;              // fin oltre il bordo
      afterPx = Math.max(0, CW - wrapRect.right) + 60;
    }
    var extL = beforePx / kMain, extR = afterPx / kMain;       // in unita' del tracciato
    var aniso = kCross / kMain;                               // 1 in orizzontale
    var SWING = vert ? 0.42 : 1;                              // quanto larga l'ansa di coda

    /* --- prolungamento sinistro ---------------------------------------
       Il tracciato attacca a (0,6) in orizzontale: basta un'onda intera che
       arrivi piatta su quel punto. */
    var ampL = Math.min(120, extL * 0.55) * SWING / aniso;
    var ptsL = [];
    var stepsL = Math.max(2, Math.round(extL / (STEP / k)));
    for (var i = 0; i < stepsL; i++) {
      var t1 = i / stepsL;                                     // 0 = bordo schermo
      ptsL.push({ x: -extL + extL * t1, y: 6 + ampL * (1 - Math.cos(2 * Math.PI * t1)) / 2 });
    }

    /* --- prolungamento destro -----------------------------------------
       Qui il tracciato finisce in salita ripida (pendenza -198/88): prima un
       tratto corto che raddrizza la curva, poi un'onda come le altre. */
    var END_X = 1092, END_Y = 327.48, SLOPE = (-198 / 88) * SWING / aniso;
    var turn = Math.min(110, extR * 0.42);
    var crest = END_Y - Math.min(130, turn * 1.25) * SWING / aniso;
    var ptsR = [];
    var stepsT = Math.max(2, Math.round(turn / (STEP / k)));
    for (var j = 1; j <= stepsT; j++) {
      var u = j / stepsT, u2 = u * u, u3 = u2 * u;
      // Hermite: posizione e pendenza iniziali del tracciato, arrivo in piano
      var h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2;
      ptsR.push({ x: END_X + turn * u, y: h00 * END_Y + h10 * (SLOPE * turn) + h01 * crest });
    }
    var rest = Math.max(0, extR - turn);
    var ampR = Math.min(150, rest * 0.5) * SWING / aniso;
    var stepsR = Math.max(2, Math.round(rest / (STEP / k)));
    for (var m = 1; m <= stepsR; m++) {
      var t2 = m / stepsR;
      ptsR.push({ x: END_X + turn + rest * t2, y: crest + ampR * (1 - Math.cos(2 * Math.PI * t2)) / 2 });
    }

    /* --- il tracciato disegnato, campionato a lunghezza d'arco --------- */
    var total = path.getTotalLength();
    var pathStep = STEP / k;
    var ptsM = [];
    for (var l = 0; l <= total; l += pathStep) {
      var q = path.getPointAtLength(l);
      ptsM.push({ x: q.x, y: q.y });
    }
    var pts = ptsL.concat(ptsM, ptsR);

    /* Il riquadro e' ancorato alle SCHEDE, non all'ingombro totale: cosi' i
       prolungamenti non spostano di un pixel la parte che le incrocia. */
    var half = VB_H / 2;
    var along = function (q) { return q.x * kMain; };          // lungo le schede
    var cross = function (q) { return (q.y - half) * kCross; };  // scarto dall'asse

    var padTop, padBot, h, mainOrigin, crossMid;
    if (vert) {
      var aMin = 1e9, aMax = -1e9;
      for (var n = 0; n < pts.length; n++) {
        var a = along(pts[n]);
        if (a < aMin) aMin = a;
        if (a > aMax) aMax = a;
      }
      padTop = Math.max(20, -aMin + REACH) + 2;
      padBot = Math.max(20, aMax - gh + REACH) + 2;
      h = gh + padTop + padBot;
      mainOrigin = padTop;
      crossMid = (gridRect.left - wrapRect.left) + gw / 2;     // asse della colonna
    } else {
      var cMin = 1e9, cMax = -1e9;
      for (var n2 = 0; n2 < pts.length; n2++) {
        var c = cross(pts[n2]);
        if (c < cMin) cMin = c;
        if (c > cMax) cMax = c;
      }
      var need = Math.max(-cMin, cMax) + REACH - gh / 2;
      padTop = padBot = Math.max(40, need) + 2;
      h = gh + padTop * 2;
      mainOrigin = 0;
      crossMid = padTop + gh / 2;                              // asse della riga
    }

    // il canvas copre tutta la larghezza della finestra: la sezione taglia
    cv.style.left = (-wrapRect.left) + 'px';
    cv.style.top = (-padTop) + 'px';
    cv.style.width = CW + 'px';
    cv.style.height = h + 'px';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(CW * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CW, h);
    ctx.translate(wrapRect.left, 0);   // x=0 del tracciato = bordo sinistro della griglia
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 0.92;

    var SW = img.naturalWidth, SH = img.naturalHeight;
    var scale = (THICK / SH) * PITCH;
    var map = vert
      ? function (q) { return { x: cross(q) + crossMid, y: along(q) + mainOrigin }; }
      : function (q) { return { x: along(q),            y: cross(q) + crossMid };  };

    // l'asse sullo schermo, poi le due tracce spostate lungo la normale. La
    // tangente si prende su qualche punto di distanza: sui passi da 2px la
    // normale ballerebbe e il bordo della traccia verrebbe seghettato.
    var axis = pts.map(map);
    var side = function (sign) {
      var out = [];
      for (var i = 0; i < axis.length; i++) {
        var a = axis[Math.max(0, i - 3)], b = axis[Math.min(axis.length - 1, i + 3)];
        var tx = b.x - a.x, ty = b.y - a.y, tl = Math.sqrt(tx * tx + ty * ty) || 1;
        out.push({ x: axis[i].x - (ty / tl) * OFF * sign, y: axis[i].y + (tx / tl) * OFF * sign });
      }
      /* Dove l'asse curva piu' stretto di OFF, la traccia interna torna su se
         stessa e fa un nodo. Quei punti vanno all'indietro rispetto alla
         marcia: si saltano, e la traccia taglia la curva come una gomma vera. */
      var kept = [out[0]], last = 0;
      for (var j = 1; j < out.length; j++) {
        var ox = out[j].x - kept[kept.length - 1].x, oy = out[j].y - kept[kept.length - 1].y;
        var ax = axis[j].x - axis[last].x, ay = axis[j].y - axis[last].y;
        if (ox * ax + oy * ay > 0) { kept.push(out[j]); last = j; }
      }
      return kept;
    };

    function strip(line, srcX) {
      var prev = line[0];
      for (var z = 1; z < line.length; z++) {
        var cur = line[z];
        var dx = cur.x - prev.x, dy = cur.y - prev.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0.01) {
          var ang = Math.atan2(dy, dx);
          var srcW = d / scale;

          ctx.save();
          ctx.translate(prev.x, prev.y);
          ctx.rotate(ang);
          if (srcX + srcW <= SW) {
            ctx.drawImage(img, srcX, 0, srcW, SH, 0, -THICK / 2, d + 0.6, THICK);
          } else {
            // la striscia e' finita a meta' fettina: si chiude e si riparte da capo
            var first = SW - srcX, r = first / srcW;
            ctx.drawImage(img, srcX, 0, first, SH, 0, -THICK / 2, d * r + 0.6, THICK);
            ctx.drawImage(img, 0, 0, srcW - first, SH, d * r, -THICK / 2, d * (1 - r) + 0.6, THICK);
          }
          ctx.restore();
          srcX = (srcX + srcW) % SW;
        }
        prev = cur;
      }
    }
    // la seconda ruota parte da un altro punto del battistrada: due copie in
    // fase si vedrebbero come un disegno duplicato, non come due gomme
    strip(side(1), 0);
    strip(side(-1), SW * 0.43);
  }

  var t = null;
  function redraw() { clearTimeout(t); t = setTimeout(draw, 120); }
  addEventListener('resize', redraw);
  if (window.ResizeObserver) new ResizeObserver(redraw).observe(grid);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
})();
