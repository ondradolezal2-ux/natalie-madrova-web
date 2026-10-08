(function () {
  "use strict";

  var svgHome =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var property = (window.PROPERTIES || []).filter(function (p) { return p.id === id; })[0];

  var contentEl = document.querySelector("[data-detail-content]");
  var notFoundEl = document.querySelector("[data-detail-not-found]");

  if (!property) {
    if (notFoundEl) notFoundEl.hidden = false;
    return;
  }

  if (contentEl) contentEl.hidden = false;
  document.title = property.title + " | Natálie Mádrová";

  var titleEl = document.querySelector("[data-detail-title]");
  if (titleEl) titleEl.textContent = property.title;

  var locationEl = document.querySelector("[data-detail-location]");
  if (locationEl) locationEl.textContent = property.locationLabel;

  var tagEl = document.querySelector("[data-detail-tag]");
  if (tagEl) tagEl.textContent = property.tag;

  var priceEl = document.querySelector("[data-detail-price]");
  if (priceEl) priceEl.textContent = property.price;

  var summaryEl = document.querySelector("[data-detail-summary]");
  if (summaryEl) summaryEl.textContent = property.summary;

  var descriptionEl = document.querySelector("[data-detail-description]");
  if (descriptionEl && property.description) {
    descriptionEl.innerHTML = property.description
      .map(function (para) { return "<p>" + para + "</p>"; })
      .join("");
  }

  var featuresEl = document.querySelector("[data-detail-features]");
  if (featuresEl) {
    featuresEl.innerHTML = property.features
      .map(function (f) { return "<li>" + f + "</li>"; })
      .join("");
  }

  var sourceEl = document.querySelector("[data-detail-source]");
  if (sourceEl && property.sourceUrl) {
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

  var alt = property.title + ", " + property.locationLabel;
  photoEl.innerHTML = '<img src="' + photos[0] + '" alt="' + alt + '" decoding="async">';
  var mainImg = photoEl.querySelector("img");

  var thumbs = property.thumbs || photos;
  if (galleryEl && photos.length > 1) {
    galleryEl.innerHTML = photos
      .map(function (src, i) {
        return (
          '<button type="button" class="' + (i === 0 ? "is-active" : "") + '" data-index="' + i + '" ' +
          'aria-label="Fotka ' + (i + 1) + ' z ' + photos.length + '">' +
            '<img src="' + (thumbs[i] || src) + '" alt="" loading="lazy" decoding="async">' +
          "</button>"
        );
      })
      .join("");
    galleryEl.hidden = false;
    galleryEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      mainImg.src = photos[Number(btn.getAttribute("data-index"))];
      galleryEl.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
    });
  }
})();
