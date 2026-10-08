(function () {
  "use strict";

  var propertyGrid = document.querySelector("[data-property-grid]");
  if (!propertyGrid || !window.PROPERTIES) return;

  var svgHome =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';

  var cardHtml = function (p) {
    var media = p.photos && p.photos.length
      ? '<img src="' + p.photos[0] + '" alt="' + p.title + ', ' + p.locationLabel + '" loading="lazy" decoding="async">'
      : '<div class="photo-placeholder">' + svgHome + '</div>';
    return (
      '<a class="property-card reveal" href="detail.html?id=' + encodeURIComponent(p.id) + '" ' +
      'data-type="' + p.type + '" data-location="' + p.location + '" data-price="' + p.priceBand + '">' +
        '<div class="property-media">' +
          media +
          '<span class="property-tag">' + p.tag + '</span>' +
        '</div>' +
        '<div class="property-body">' +
          '<span class="eyebrow property-location">' + p.locationLabel + '</span>' +
          '<h4 class="property-title">' + p.title + '</h4>' +
          '<p class="property-price">' + p.price + '</p>' +
        '</div>' +
      '</a>'
    );
  };

  propertyGrid.innerHTML = window.PROPERTIES.map(cardHtml).join("");
  propertyGrid.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });

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
})();
