(function () {
  "use strict";

  /* ---------- Čistá adresa: /index.html → / (Ondřej 24. 11.) ----------
     GitHub Pages neumí přesměrovat, tak adresu v řádku přepíše prohlížeč, stránka se znovu nenačítá. */
  if (/\/index\.html$/.test(window.location.pathname) && window.history && window.history.replaceState) {
    window.history.replaceState(null, "", window.location.pathname.replace(/index\.html$/, "") + window.location.search + window.location.hash);
  }

  /* =========================================================
     NASTAVENÍ WEBU — jediné místo, kde se mění
     ========================================================= */
  var CONFIG = {
    // Adresa formuláře na Formspree, ten zprávy doručí Natce e-mailem.
    // Kdyby byla prázdná, formuláře otevřou e-mailový program s předvyplněnou zprávou.
    formEndpoint: "https://formspree.io/f/mljbaoal",
    // Měření návštěvnosti:
    //   "ga4"       = Google Analytics, potřebuje cookie lištu se souhlasem
    //   "plausible" = měření bez cookies, cookie lišta se nezobrazí
    analytics: "ga4",
    ga4Id: "G-XXXXXXXXXX", // TODO: reálné GA4 Measurement ID od Natky
    plausibleDomain: "madrovafinreal.cz" // doména webu, platí jen pro analytics: "plausible"
  };
  var LEAD_EMAIL = "natalie.madrova@bcas.cz";
  var PHONE = "+420 604 306 514";

  /* ---------- Mobilní menu ---------- */
  var menuBtn = document.querySelector(".menu");
  var drawer = document.getElementById("drawer");
  if (menuBtn && drawer) {
    var setMenu = function (open) {
      drawer.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Zavřít menu" : "Otevřít menu");
    };
    menuBtn.addEventListener("click", function () { setMenu(drawer.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------- Google Analytics (GA4) — načte se až po souhlasu s cookies ---------- */
  var gaLoaded = false;
  var loadAnalytics = function () {
    if (gaLoaded) return;
    gaLoaded = true;
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + CONFIG.ga4Id;
    document.head.appendChild(script);
    gtag("js", new Date());
    gtag("config", CONFIG.ga4Id);
  };

  /* ---------- Plausible — měření bez cookies, bez lišty ---------- */
  var cookieBar = document.querySelector(".cookie-bar");
  if (CONFIG.analytics === "plausible") {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    var plausibleScript = document.createElement("script");
    plausibleScript.defer = true;
    plausibleScript.setAttribute("data-domain", CONFIG.plausibleDomain);
    plausibleScript.src = "https://plausible.io/js/script.js";
    document.head.appendChild(plausibleScript);
    if (cookieBar) cookieBar.parentNode.removeChild(cookieBar);
    cookieBar = null;
    document.querySelectorAll("[data-cookie-settings]").forEach(function (link) { link.hidden = true; });
  }

  /* ---------- Cookie lišta ---------- */
  if (cookieBar) {
    var CONSENT_KEY = "nm-cookie-consent";
    var stored = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch (e) {}
    if (stored === "accepted") {
      loadAnalytics();
    } else if (!stored) {
      window.setTimeout(function () { cookieBar.classList.add("is-visible"); }, 600);
    }
    var acceptBtn = cookieBar.querySelector("[data-cookie-accept]");
    var declineBtn = cookieBar.querySelector("[data-cookie-decline]");
    var hide = function (value) {
      cookieBar.classList.remove("is-visible");
      try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    };
    if (acceptBtn) acceptBtn.addEventListener("click", function () { loadAnalytics(); hide("accepted"); });
    if (declineBtn) declineBtn.addEventListener("click", function () { hide("declined"); });

    document.querySelectorAll("[data-cookie-settings]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        cookieBar.classList.add("is-visible");
      });
    });
  }

  /* ---------- Aktuální nabídka na hlavní stránce (data z assets/js/properties-data.js) ---------- */
  document.querySelectorAll("[data-listing]").forEach(function (box) {
    var limit = parseInt(box.getAttribute("data-limit"), 10) || 3;
    var list = (window.PROPERTIES || []).slice(0, limit);
    var card = box.querySelector("template[data-card]");
    var fill = box.querySelector("template[data-fill]");
    var frag = document.createDocumentFragment();
    list.forEach(function (p) {
      var n = card.content.cloneNode(true);
      var put = function (slot, value) {
        n.querySelectorAll('[data-slot="' + slot + '"]').forEach(function (el) { el.textContent = value; });
      };
      put("title", p.title);
      put("place", p.locationLabel);
      put("price", p.price);
      n.querySelectorAll('img[data-slot="photo"]').forEach(function (img) {
        img.src = (p.photos && p.photos[0]) || "";
        img.alt = p.title + ", " + p.locationLabel;
      });
      n.querySelectorAll('a[data-slot="link"]').forEach(function (a) {
        a.href = box.getAttribute("data-detail") + "?id=" + encodeURIComponent(p.id);
      });
      frag.appendChild(n);
    });
    // Volné místo v řadě zaplní pozvánka k prodeji
    if (fill && list.length < limit) frag.appendChild(fill.content.cloneNode(true));
    box.appendChild(frag);
  });

  /* ---------- Rok v patičce ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Měření: klik na telefon / WhatsApp, odeslaný formulář ---------- */
  var trackEvent = function (name, params) {
    if (CONFIG.analytics === "plausible") {
      if (typeof window.plausible === "function") window.plausible(name, { props: params || {} });
    } else if (typeof gtag === "function") {
      gtag("event", name, params || {});
    }
  };
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener("click", function () { trackEvent("click_call"); });
  });
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
    link.addEventListener("click", function () { trackEvent("click_whatsapp"); });
  });

  /* ---------- Odeslání formulářů ----------
     box    = prvek, který se po odeslání nahradí potvrzením
     formId = název formuláře pro měření a pro Natku v e-mailu
     data   = { "Popisek": hodnota } */
  var sendLead = function (box, formId, subject, data) {
    var lines = Object.keys(data).map(function (key) { return key + ": " + data[key]; });

    // Bez nastaveného endpointu zůstává dočasné řešení přes e-mailový program
    if (!CONFIG.formEndpoint) {
      window.location.href = "mailto:" + LEAD_EMAIL + "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      return;
    }

    var button = box.querySelector("[data-form-submit]");
    var status = box.querySelector("[data-form-status]");
    if (button) button.disabled = true;
    if (status) status.textContent = "Odesílám…";

    var payload = { _subject: subject, formular: formId };
    Object.keys(data).forEach(function (key) { payload[key] = data[key]; });
    if (data["E-mail"]) payload._replyto = data["E-mail"]; // Natka může odpovědět rovnou z e-mailu

    fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      // Událost se počítá až po skutečném odeslání
      trackEvent("lead_form_submit", { form_id: formId });
      box.innerHTML =
        '<div class="form-success" role="status" tabindex="-1">' +
          "<h3>Děkuji, zpráva dorazila.</h3>" +
          '<p>Ozvu se vám co nejdřív. Když to spěchá, zavolejte mi na <a href="tel:' + PHONE.replace(/\s/g, "") + '">' + PHONE + "</a>.</p>" +
        "</div>";
      box.querySelector(".form-success").focus();
    }).catch(function () {
      if (button) button.disabled = false;
      if (status) status.textContent = "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo mi zavolejte na " + PHONE + ".";
    });
  };
  window.NM = { sendLead: sendLead, track: trackEvent };

  // Upozornění „otevře se e-mail“ má smysl jen bez endpointu
  if (!CONFIG.formEndpoint) {
    document.querySelectorAll("[data-form-hint]").forEach(function (hint) {
      hint.textContent = "Otevře se e-mail s předvyplněnou zprávou.";
    });
  }

  /* ---------- Kontaktní formulář ---------- */
  var kontaktForm = document.getElementById("kontakt-form");
  if (kontaktForm) {
    // Tlačítka z jiných stránek posílají téma předem: kontakt.html?tema=zahranicni&zajem=Dubaj#kontakt-form
    // Návštěvník pak vyplní jen jméno a telefon.
    var params = new URLSearchParams(window.location.search);
    var preset = params.get("tema");
    if (preset) {
      var chip = kontaktForm.querySelector('input[name="tema"][data-tema="' + preset.replace(/[^a-z]/g, "") + '"]');
      if (chip) chip.checked = true;
    }
    var zajem = (params.get("zajem") || "").slice(0, 160);
    var zprava = kontaktForm.querySelector("#zprava");
    if (zajem && zprava && !zprava.value) zprava.value = "Zajímá mě: " + zajem;

    kontaktForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var picked = kontaktForm.querySelector('input[name="tema"]:checked');
      var tema = picked ? picked.value : "";
      sendLead(kontaktForm, "kontakt", "Poptávka z webu — " + tema, {
        "Jméno": kontaktForm.querySelector("#jmeno").value,
        "Telefon": kontaktForm.querySelector("#telefon").value,
        "E-mail": kontaktForm.querySelector("#email").value,
        "Téma": tema,
        "Zpráva": kontaktForm.querySelector("#zprava").value
      });
    });
  }

  /* ---------- Průvodce Španělskem — jen e-mail ---------- */
  var leadMagnetForm = document.getElementById("lead-magnet-form");
  if (leadMagnetForm) {
    leadMagnetForm.addEventListener("submit", function (e) {
      e.preventDefault();
      sendLead(leadMagnetForm, "pruvodce-spanelsko", "Průvodce nemovitostmi ve Španělsku", {
        "E-mail": leadMagnetForm.querySelector("#magnet-email").value
      });
    });
  }

  /* ---------- „S čím vám pomůžu“ se při posunu zaostří (Ondřej 24. 11.) ----------
     Blok přijede rozmazaný a ostrý je, když projede asi 85 % své cesty do obrazovky.
     Řídí to skript, ne časová osa CSS: Safari rozmazání z časové osy spolehlivě nevykreslí. */
  (function () {
    var svc = document.querySelector("main > section.svc");
    if (!svc || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var MAX = 36, ticking = false, last = "";
    var update = function () {
      ticking = false;
      var r = svc.getBoundingClientRect(), vh = window.innerHeight;
      var t = (vh - r.top) / (Math.min(r.height, vh) * 0.85);
      t = Math.max(0, Math.min(1, t));
      var f = t >= 1 ? "" : "blur(" + (MAX * (1 - t)).toFixed(1) + "px)";
      if (f !== last) { svc.style.filter = f; last = f; }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  })();

  /* ---------- Tři služby naskočí (Ondřej 24. 11., varianta E „linka a obsah“) ----------
     Vedle sebe (počítač) naskočí všechny tři po sobě, až je řada skoro celá vidět a blok je ostrý.
     Pod sebou (mobil, tablet) naskočí každá, až k ní člověk dojede. Co už je nad obrazovkou, ukáže se hned. */
  (function () {
    var trio = document.querySelector("main > section.svc .trio");
    if (!trio || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var tiles = Array.prototype.slice.call(trio.children);
    if (!tiles.length) return;
    var inRow = tiles.length > 1 && tiles[0].offsetTop === tiles[1].offsetTop;
    var go = function (li, i) { li.style.setProperty("--i", i); li.classList.add("go"); };
    trio.classList.add("nm-pop");
    if (inRow) {
      var io = new IntersectionObserver(function (entries) {
        var e = entries[0];
        if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
        tiles.forEach(go);
        io.disconnect();
      }, { threshold: 0.9 });
      io.observe(trio);
    } else {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
          go(e.target, 0);
          io2.unobserve(e.target);
        });
      }, { threshold: 0.5 });
      tiles.forEach(function (li) { io2.observe(li); });
    }
  })();

  /* ---------- Vynoření obsahu bloků při posunu ----------
     Spouští se až po ostatních skriptech (nabídka, detail), aby zahrnulo i jimi vložený obsah.
     Bez JavaScriptu nebo s omezeným pohybem se nic neskrývá. Úvod stránky (hero, page-head) je vidět hned. */
  var revealBlocks = function () {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var pick = ".dest-cards, h2, h3, h4, p, figure, ul, ol, dl, form, details, blockquote, .actions, .sell, .l-card";
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll("main > section:not(.hero):not(.page-head)").forEach(function (section) {
      var chosen = [];
      section.querySelectorAll(pick).forEach(function (el) {
        if (el.closest("template")) return;
        for (var i = 0; i < chosen.length; i++) { if (chosen[i].contains(el)) return; }
        chosen.push(el);
      });
      chosen.forEach(function (el, i) {
        el.classList.add("rv");
        el.style.setProperty("--d", (Math.min(i, 6) * 0.08) + "s");
        io.observe(el);
      });
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", revealBlocks);
  else revealBlocks();
})();
