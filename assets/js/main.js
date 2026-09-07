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

  /* ---------- Cookie lišta ---------- */
  var cookieBar = document.querySelector(".cookie-bar");
  if (cookieBar) {
    var CONSENT_KEY = "nm-cookie-consent";
    var stored = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch (e) {}
    if (!stored) {
      window.setTimeout(function () { cookieBar.classList.add("is-visible"); }, 600);
    }
    var acceptBtn = cookieBar.querySelector("[data-cookie-accept]");
    var declineBtn = cookieBar.querySelector("[data-cookie-decline]");
    var hide = function (value) {
      cookieBar.classList.remove("is-visible");
      try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    };
    if (acceptBtn) acceptBtn.addEventListener("click", function () { hide("accepted"); });
    if (declineBtn) declineBtn.addEventListener("click", function () { hide("declined"); });
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

  /* ---------- FAQ akordeon ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    if (!question) return;
    question.addEventListener("click", function () {
      var isOpen = item.classList.toggle("is-open");
      question.setAttribute("aria-expanded", isOpen ? "true" : "false");
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
          '<form data-lead-form="lead-magnet-popup" action="mailto:info@natalie-madrova.cz" method="post" enctype="text/plain">' +
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
        trackEvent("lead_form_submit", { form_id: "lead-magnet-popup" });
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (err) {}
        window.setTimeout(function () { close(false); }, 400);
      });
    }, 9000);
  })();
})();
