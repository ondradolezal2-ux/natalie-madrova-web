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

  /* ---------- Filtrování nemovitostí ---------- */
  var propertyGrid = document.querySelector("[data-property-grid]");
  if (propertyGrid) {
    var filterSelects = document.querySelectorAll("[data-property-filter]");
    var propertyCards = Array.prototype.slice.call(propertyGrid.querySelectorAll(".property-card"));
    var emptyMsg = document.querySelector("[data-property-empty]");

    var applyPropertyFilters = function () {
      var values = {};
      filterSelects.forEach(function (select) {
        values[select.getAttribute("data-property-filter")] = select.value;
      });
      var visibleCount = 0;
      propertyCards.forEach(function (card) {
        var matches =
          (!values.type || card.getAttribute("data-type") === values.type) &&
          (!values.location || card.getAttribute("data-location") === values.location) &&
          (!values.price || card.getAttribute("data-price") === values.price);
        card.hidden = !matches;
        if (matches) visibleCount++;
      });
      if (emptyMsg) emptyMsg.hidden = visibleCount > 0;
    };

    filterSelects.forEach(function (select) {
      select.addEventListener("change", applyPropertyFilters);
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
})();
