(function () {
  "use strict";

  var svgHome =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var property = (window.PROPERTIES || []).filter(function (p) { return p.id === id; })[0];

  // Obsah detailu (a závěrečná výzva pod ním) se ukáže, jen když je nemovitost nalezena
  var contentEls = document.querySelectorAll("[data-detail-content]");
  var notFoundEl = document.querySelector("[data-detail-not-found]");

  if (!property) {
    if (notFoundEl) notFoundEl.hidden = false;
    return;
  }

  contentEls.forEach(function (el) { el.hidden = false; });
  document.title = property.title + " | Natálie Mádrová";

  var titleEl = document.querySelector("[data-detail-title]");
  if (titleEl) titleEl.textContent = property.title;

  var locationEl = document.querySelector("[data-detail-location]");
  if (locationEl) locationEl.textContent = property.locationLabel;

  var tagEl = document.querySelector("[data-detail-tag]");
  if (tagEl) tagEl.textContent = property.tag;

  var priceEl = document.querySelector("[data-detail-price]");
  if (priceEl) priceEl.textContent = property.price;

  // „Domluvit prohlídku“ otevře formulář s vybraným tématem a názvem nemovitosti ve zprávě
  var ctaEl = document.querySelector("[data-detail-cta]");
  if (ctaEl) {
    var tema = /pron/i.test(property.tag || "") ? "pronajem" : "koupe";
    ctaEl.href = "../kontakt.html?tema=" + tema + "&zajem=" +
      encodeURIComponent(property.title + ", " + property.locationLabel) + "#kontakt-form";
  }

  var summaryEl = document.querySelector("[data-detail-summary]");
  if (summaryEl) summaryEl.textContent = property.summary;

  // Texty z dat se vkládají jen jako text (textContent), nikdy jako HTML
  var asList = function (value) { return Array.isArray(value) ? value : (value ? [value] : []); };

  var descriptionEl = document.querySelector("[data-detail-description]");
  if (descriptionEl && property.description) {
    descriptionEl.textContent = "";
    asList(property.description).forEach(function (para) {
      var p = document.createElement("p");
      p.textContent = para;
      descriptionEl.appendChild(p);
    });
  }

  var featuresEl = document.querySelector("[data-detail-features]");
  if (featuresEl) {
    featuresEl.textContent = "";
    asList(property.features).forEach(function (f) {
      var li = document.createElement("li");
      li.textContent = f;
      featuresEl.appendChild(li);
    });
  }

  // Odkaz na původní inzerát jen s adresou http(s), ne třeba javascript:
  var sourceEl = document.querySelector("[data-detail-source]");
  if (sourceEl && /^https?:\/\//i.test(property.sourceUrl || "")) {
    sourceEl.href = property.sourceUrl;
    sourceEl.hidden = false;
  }

  var photoEl = document.querySelector("[data-detail-photo]");
  var galleryEl = document.querySelector("[data-detail-gallery]");
  var photos = property.photos || [];
  if (!photoEl) return;

  if (!photos.length) {
    photoEl.innerHTML = '<div class="photo-placeholder">' + svgHome + "</div>";
    return;
  }

  var mainImg = document.createElement("img");
  mainImg.src = photos[0];
  mainImg.alt = property.title + ", " + property.locationLabel;
  mainImg.decoding = "async";
  photoEl.textContent = "";
  photoEl.appendChild(mainImg);

  var thumbs = property.thumbs || photos;
  if (galleryEl && photos.length > 1) {
    galleryEl.textContent = "";
    photos.forEach(function (src, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = i === 0 ? "is-active" : "";
      btn.setAttribute("data-index", String(i));
      btn.setAttribute("aria-label", "Fotka " + (i + 1) + " z " + photos.length);
      btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      var thumb = document.createElement("img");
      thumb.src = thumbs[i] || src;
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.decoding = "async";
      btn.appendChild(thumb);
      galleryEl.appendChild(btn);
    });
    galleryEl.hidden = false;
    galleryEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      mainImg.src = photos[Number(btn.getAttribute("data-index"))];
      galleryEl.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
    });
  }
})();
