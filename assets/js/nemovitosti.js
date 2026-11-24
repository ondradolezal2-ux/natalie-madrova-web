(function () {
  "use strict";

  var propertyGrid = document.querySelector("[data-property-grid]");
  if (!propertyGrid || !window.PROPERTIES) return;

  var detailBase = propertyGrid.getAttribute("data-detail-base") || "detail.html";
  var properties = window.PROPERTIES;

  var svgHome =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';

  var esc = function (s) {
    return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };

  // Velká fotka bez rámečku, pod ní název, cena a místo
  var cardHtml = function (p) {
    var cover = p.photos && p.photos[0];
    var media = cover
      ? '<img src="' + esc(cover) + '" alt="' + esc(p.title + ", " + p.locationLabel) + '" loading="lazy" decoding="async">'
      : '<span class="photo-placeholder">' + svgHome + "</span>";
    return (
      '<a class="l-card" href="' + detailBase + "?id=" + encodeURIComponent(p.id) + '" ' +
      'data-type="' + esc(p.type) + '" data-location="' + esc(p.location) + '" data-price="' + esc(p.priceBand) + '">' +
        media +
        '<span class="l-meta"><span class="l-title">' + esc(p.title) + '</span><span class="l-price">' + esc(p.price) + "</span></span>" +
        '<span class="l-place">' + esc(p.tag) + " · " + esc(p.locationLabel) + "</span>" +
      "</a>"
    );
  };

  propertyGrid.innerHTML = properties.map(cardHtml).join("");

  // Lichý počet nabídek: volné místo v řadě zaplní pozvánka k prodeji z <template data-property-fill>
  var fill = document.querySelector("template[data-property-fill]");
  if (fill && properties.length % 2 === 1) {
    propertyGrid.appendChild(fill.content.firstElementChild.cloneNode(true));
  }

  var filterSelects = document.querySelectorAll("[data-property-filter]");
  var propertyCards = Array.prototype.slice.call(propertyGrid.querySelectorAll(".l-card"));
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
  if (emptyMsg) emptyMsg.hidden = properties.length > 0;
})();
