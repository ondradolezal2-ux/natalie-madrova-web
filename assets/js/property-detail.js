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

  var featuresEl = document.querySelector("[data-detail-features]");
  if (featuresEl) {
    featuresEl.innerHTML = property.features
      .map(function (f) { return "<li>" + f + "</li>"; })
      .join("");
  }

  var photoEl = document.querySelector("[data-detail-photo]");
  if (photoEl) {
    photoEl.title = "TODO: nahradit reálnou fotkou — " + property.title;
    photoEl.innerHTML = svgHome;
  }
})();
