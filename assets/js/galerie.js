// Galerie fotek u zahraničních nemovitostí (nemovitosti/zahranicni.html).
// Pás fotek se posouvá prstem, šipkami na fotce nebo klávesnicí. Prohlížeč stáhne jen první fotku.
// Druhou stáhne, až je galerie skoro na obrazovce, další až při posunu, aby telefon nestahoval všechno najednou.
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-gallery]").forEach(function (g) {
    var track = g.querySelector(".dg-track");
    var imgs = track.querySelectorAll("img");
    var prev = g.querySelector("[data-gallery-prev]");
    var next = g.querySelector("[data-gallery-next]");
    var count = g.querySelector("[data-gallery-count]");
    var dotsBox = g.querySelector(".dg-dots");
    var n = imgs.length;
    if (n < 2) return;

    var dots = [];
    for (var k = 0; k < n; k++) dots.push(dotsBox.appendChild(document.createElement("span")));

    function current() {
      return Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / track.clientWidth)));
    }
    // Fotky 2 a dál mají adresu v data-src a data-srcset, prohlížeč je sám nestáhne
    function load(i) {
      var img = imgs[i];
      if (!img || !img.dataset.src) return;
      img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      delete img.dataset.srcset;
      delete img.dataset.src;
    }
    // Šipka na kraji pásu je aria-disabled, ne disabled: zaměření z ní nespadne na body
    function setDisabled(btn, off) { btn.setAttribute("aria-disabled", off ? "true" : "false"); }
    var shown = -1;
    function update() {
      var i = current();
      if (i === shown) return;
      shown = i;
      load(i);
      load(i + 1);
      count.textContent = "Fotka " + (i + 1) + " z " + n;
      setDisabled(prev, i === 0);
      setDisabled(next, i === n - 1);
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i); });
    }
    function go(step) {
      var i = Math.max(0, Math.min(n - 1, current() + step));
      load(i);
      load(i + 1);
      track.scrollTo({ left: i * track.clientWidth, behavior: reduce.matches ? "auto" : "smooth" });
    }

    prev.addEventListener("click", function () { if (prev.getAttribute("aria-disabled") !== "true") go(-1); });
    next.addEventListener("click", function () { if (next.getAttribute("aria-disabled") !== "true") go(1); });
    track.addEventListener("scroll", update, { passive: true });
    // Jen při změně šířky (otočení, okno): iPhone mění výšku při každém posunu stránky (lišta Safari)
    // a kvůli tomu se další fotky stahovat nemají.
    var lastW = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      shown = -1;
      update();
    });

    // Druhá fotka se stáhne, až se galerie blíží na obrazovku, ať při prvním posunu není prázdné místo.
    // Vždy až po první fotce: u Dubaje je galerie vidět hned a na pomalém mobilu by si o připojení přetahovaly.
    function afterFirst(fn) {
      var first = imgs[0];
      if (first.complete) { fn(); return; }
      first.addEventListener("load", fn, { once: true });
      first.addEventListener("error", fn, { once: true });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); afterFirst(function () { load(1); }); }
      }, { rootMargin: "200px 0px" });
      io.observe(g);
    }

    g.classList.add("is-ready");
    prev.hidden = false;
    next.hidden = false;
    shown = -1;
    // první update nesmí stáhnout druhou fotku dřív, než je galerie blízko
    var i0 = current();
    count.textContent = "Fotka " + (i0 + 1) + " z " + n;
    setDisabled(prev, i0 === 0);
    setDisabled(next, i0 === n - 1);
    dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i0); });
    shown = i0;
  });
})();
