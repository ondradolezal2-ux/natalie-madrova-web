(function () {
  "use strict";

  /* ---------- Navigace: změna vzhledu po scrollu ---------- */
  var header = document.querySelector(".site-header");
  if (header && !header.classList.contains("no-hero")) {
    var onScroll = function () {
      if (window.scrollY > 80) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobilní menu ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      navToggle.classList.toggle("is-active", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("is-open");
        navToggle.classList.remove("is-active");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Google Analytics (GA4) — načte se až po souhlasu s cookies ---------- */
  var GA4_ID = "G-XXXXXXXXXX"; // TODO: nahradit reálným GA4 Measurement ID od Natky
  var gaLoaded = false;
  var loadAnalytics = function () {
    if (gaLoaded) return;
    gaLoaded = true;
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(script);
    gtag("js", new Date());
    gtag("config", GA4_ID);
  };

  /* ---------- Cookie lišta ---------- */
  var cookieBar = document.querySelector(".cookie-bar");
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

  /* ---------- Scroll reveal animace ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var groups = {};
    revealEls.forEach(function (el) {
      var group = el.getAttribute("data-reveal-group") || "default";
      groups[group] = groups[group] || [];
      groups[group].push(el);
    });
    Object.keys(groups).forEach(function (key) {
      groups[key].forEach(function (el, index) {
        el.style.transitionDelay = (index % 6) * 80 + "ms";
      });
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Rok v patičce ---------- */
  var yearEl = document.querySelector("[data-current-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- WhatsApp bublina — nápověda u plovoucího tlačítka ---------- */
  var waTooltip = document.querySelector("[data-whatsapp-tooltip]");
  if (waTooltip) {
    var WA_TOOLTIP_KEY = "nm-whatsapp-tooltip-dismissed";
    var waDismissed = false;
    try { waDismissed = localStorage.getItem(WA_TOOLTIP_KEY) === "1"; } catch (e) {}
    if (!waDismissed) waTooltip.hidden = false;
    var waCloseBtn = waTooltip.querySelector("[data-whatsapp-tooltip-close]");
    if (waCloseBtn) {
      waCloseBtn.addEventListener("click", function () {
        waTooltip.hidden = true;
        try { localStorage.setItem(WA_TOOLTIP_KEY, "1"); } catch (e) {}
      });
    }
  }

  /* ---------- GA4 eventy: klik na telefon / WhatsApp / odeslání formuláře ---------- */
  var trackEvent = function (name, params) {
    if (typeof gtag === "function") gtag("event", name, params || {});
  };
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener("click", function () { trackEvent("click_call"); });
  });
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
    link.addEventListener("click", function () { trackEvent("click_whatsapp"); });
  });
  document.querySelectorAll("[data-lead-form]").forEach(function (form) {
    form.addEventListener("submit", function () {
      trackEvent("lead_form_submit", { form_id: form.getAttribute("data-lead-form") });
    });
  });

  /* ---------- Kontaktní formulář — otevře e-mail klienta (dočasné řešení) ---------- */
  var kontaktForm = document.getElementById("kontakt-form");
  if (kontaktForm) {
    kontaktForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var jmeno = kontaktForm.querySelector("#jmeno").value;
      var email = kontaktForm.querySelector("#email").value;
      var telefon = kontaktForm.querySelector("#telefon").value;
      var tema = kontaktForm.querySelector("#tema").value;
      var zprava = kontaktForm.querySelector("#zprava").value;
      var subject = "Poptávka z webu — " + (tema || "kontaktní formulář");
      var body =
        "Jméno: " + jmeno + "\n" +
        "E-mail: " + email + "\n" +
        "Telefon: " + telefon + "\n" +
        "Téma: " + tema + "\n\n" +
        "Zpráva:\n" + zprava;
      window.location.href =
        "mailto:natalie.madrova@bcas.cz?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Lead magnet formulář (Španělsko) — otevře e-mail klienta ---------- */
  var leadMagnetForm = document.getElementById("lead-magnet-form");
  if (leadMagnetForm) {
    leadMagnetForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var jmeno = leadMagnetForm.querySelector("#magnet-jmeno").value;
      var telefon = leadMagnetForm.querySelector("#magnet-telefon").value;
      var email = leadMagnetForm.querySelector("#magnet-email").value;
      var subject = "Průvodce nemovitostmi ve Španělsku";
      var body = "Jméno: " + jmeno + "\nTelefon: " + telefon + "\nE-mail: " + email;
      window.location.href =
        "mailto:natalie.madrova@bcas.cz?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- FAQ akordeon ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    if (!question) return;
    question.addEventListener("click", function () {
      var isOpen = item.classList.toggle("is-open");
      question.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  /* ---------- Mapa na kontaktu — načte se z Googlu až po kliknutí ---------- */
  document.querySelectorAll("[data-map-consent]").forEach(function (box) {
    var btn = box.querySelector("[data-map-load]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = box.getAttribute("data-map-src");
      iframe.title = box.getAttribute("data-map-title") || "Mapa";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      box.innerHTML = "";
      box.appendChild(iframe);
      box.classList.add("is-loaded");
    });
  });

  /* ---------- Lead magnet popup (Španělsko) — vyskočí po pár vteřinách na webu ---------- */
  (function () {
    var STORAGE_KEY = "nm-lead-popup-dismissed";
    // Na kontaktu už je jasná výzva k akci, popup by tam byl rušivý
    if (window.location.pathname.indexOf("kontakt.html") !== -1) return;
    var already = false;
    try { already = sessionStorage.getItem(STORAGE_KEY) === "1"; } catch (e) {}
    if (already) return;

    var timer = window.setTimeout(function () {
      var openMobileMenu = document.querySelector(".mobile-menu.is-open");
      if (openMobileMenu) return; // nezobrazovat přes otevřené mobilní menu
      var overlay = document.createElement("div");
      overlay.className = "lead-popup-overlay";
      overlay.innerHTML =
        '<div class="lead-popup" role="dialog" aria-modal="true" aria-labelledby="lead-popup-heading">' +
          '<button type="button" class="lead-popup-close" data-lead-popup-close aria-label="Zavřít">&times;</button>' +
          '<span class="eyebrow">Zdarma</span>' +
          '<h3 id="lead-popup-heading" class="mb-1">Průvodce nemovitostmi ve Španělsku</h3>' +
          '<p class="lead-note">Připravuji stručný přehled, jak z pohledu českého klienta funguje nákup nemovitosti ve Španělsku — financování, daně i časté chyby. Nechte mi telefon a e-mail, pošlu vám ho, jakmile bude hotový.</p>' +
          '<form data-lead-form="lead-magnet-popup">' +
            '<div class="form-field"><label for="popup-jmeno">Jméno</label><input type="text" id="popup-jmeno" name="jmeno" required autocomplete="name"></div>' +
            '<div class="form-row cols-2">' +
              '<div class="form-field"><label for="popup-telefon">Telefon</label><input type="tel" id="popup-telefon" name="telefon" required autocomplete="tel"></div>' +
              '<div class="form-field"><label for="popup-email">E-mail</label><input type="email" id="popup-email" name="email" required autocomplete="email"></div>' +
            '</div>' +
            '<button type="submit" class="btn-primary" style="width:100%;">Chci ho dostat</button>' +
          '</form>' +
        '</div>';
      document.body.appendChild(overlay);
      window.requestAnimationFrame(function () { overlay.classList.add("is-visible"); });

      var close = function (persist) {
        overlay.classList.remove("is-visible");
        if (persist) { try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (e) {} }
        window.setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
      };
      overlay.querySelector("[data-lead-popup-close]").addEventListener("click", function () { close(true); });
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(true); });
      document.addEventListener("keydown", function onKey(e) {
        if (e.key === "Escape") { close(true); document.removeEventListener("keydown", onKey); }
      });
      overlay.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var jmeno = overlay.querySelector("#popup-jmeno").value;
        var telefon = overlay.querySelector("#popup-telefon").value;
        var email = overlay.querySelector("#popup-email").value;
        var subject = "Průvodce nemovitostmi ve Španělsku";
        var body = "Jméno: " + jmeno + "\nTelefon: " + telefon + "\nE-mail: " + email;
        trackEvent("lead_form_submit", { form_id: "lead-magnet-popup" });
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (err) {}
        window.setTimeout(function () { close(false); }, 400);
        window.location.href =
          "mailto:natalie.madrova@bcas.cz?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      });
    }, 9000);
  })();
})();
