(function () {
  "use strict";

  /* =========================================================
     Hypoteční kalkulačka
     M = P × r(1+r)^n / ((1+r)^n − 1)
     P = výše úvěru, r = měsíční úroková sazba, n = počet splátek
     ========================================================= */
  /* Hodnota z pole ořezaná na min a max podle atributů pole. Prázdné nebo neplatné pole = 0 (výsledek se neukáže).
     Částky bez atributu max ořízne MAX_AMOUNT, ať nevycházejí absurdní čísla. */
  var MAX_AMOUNT = 1e10;
  var clampField = function (input) {
    var v = parseFloat(input.value);
    if (!isFinite(v)) return 0;
    var min = input.min !== "" ? parseFloat(input.min) : -Infinity;
    var max = input.max !== "" ? parseFloat(input.max) : MAX_AMOUNT;
    return Math.min(Math.max(v, min), max);
  };
  // „1 rok“, „2 roky“, „5 let“, „2,5 roku“
  var yearsLabel = function (n) {
    if (n !== Math.floor(n)) return String(n).replace(".", ",") + " roku";
    return n + " " + (n === 1 ? "rok" : n >= 2 && n <= 4 ? "roky" : "let");
  };

  var mortgageForm = document.querySelector("[data-mortgage-calc]");
  if (mortgageForm) {
    var priceInput = mortgageForm.querySelector("[data-field='price']");
    var downInput = mortgageForm.querySelector("[data-field='down']");
    var rateInput = mortgageForm.querySelector("[data-field='rate']");
    var yearsInput = mortgageForm.querySelector("[data-field='years']");

    var loanOut = mortgageForm.querySelector("[data-out='loan']");
    var paymentOut = mortgageForm.querySelector("[data-out='payment']");
    var totalOut = mortgageForm.querySelector("[data-out='total']");
    var interestOut = mortgageForm.querySelector("[data-out='interest']");

    var formatCzk = function (value) {
      return Math.round(value).toLocaleString("cs-CZ") + " Kč";
    };

    var lastResult = { loan: 0, monthly: 0, totalPaid: 0, totalInterest: 0 };

    var calculate = function () {
      var price = clampField(priceInput);
      var down = clampField(downInput);
      var annualRate = clampField(rateInput);
      var years = clampField(yearsInput);

      var loan = Math.max(price - down, 0);
      var n = years * 12;
      var r = annualRate / 100 / 12;

      var monthly = 0;
      if (loan > 0 && n > 0) {
        if (r === 0) {
          monthly = loan / n;
        } else {
          var factor = Math.pow(1 + r, n);
          monthly = (loan * r * factor) / (factor - 1);
        }
      }

      var totalPaid = monthly * n;
      var totalInterest = Math.max(totalPaid - loan, 0);
      lastResult = { loan: loan, monthly: monthly, totalPaid: totalPaid, totalInterest: totalInterest };

      if (loanOut) loanOut.textContent = formatCzk(loan);
      if (paymentOut) paymentOut.textContent = loan > 0 && n > 0 ? formatCzk(monthly) : "—";
      if (totalOut) totalOut.textContent = loan > 0 && n > 0 ? formatCzk(totalPaid) : "—";
      if (interestOut) interestOut.textContent = loan > 0 && n > 0 ? formatCzk(totalInterest) : "—";
    };

    [priceInput, downInput, rateInput, yearsInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", calculate);
      // Ořezaná hodnota se do pole vrátí až po dopsání, ať se při psaní nepřepisuje a neposouvá kurzor
      input.addEventListener("change", function () {
        if (input.value === "") return;
        var v = clampField(input);
        if (String(v) !== String(parseFloat(input.value))) input.value = String(v);
        calculate();
      });
    });
    calculate();

    /* Lead formulář pod výsledkem — pošle spočítané hodnoty Natce (odeslání v main.js) */
    var leadForm = document.getElementById("mortgage-lead-form");
    if (leadForm) {
      leadForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var kontakt = leadForm.querySelector("#lead-kontakt").value;
        window.NM.sendLead(leadForm.closest(".lead-capture"), "hypoteka-vypocet", "Hypoteční kalkulačka — žádost o výpočet", {
          "Jméno": leadForm.querySelector("#lead-jmeno").value,
          "Kontakt": kontakt,
          "Cena nemovitosti": formatCzk(clampField(priceInput)),
          "Vlastní zdroje": formatCzk(clampField(downInput)),
          "Úroková sazba": String(clampField(rateInput)).replace(".", ",") + " %",
          "Doba splácení": yearsLabel(clampField(yearsInput)),
          "Měsíční splátka": formatCzk(lastResult.monthly),
          "Výše úvěru": formatCzk(lastResult.loan),
          "Celkem zaplaceno": formatCzk(lastResult.totalPaid),
          "Z toho úroky": formatCzk(lastResult.totalInterest)
        }, kontakt.indexOf("@") !== -1 ? { _replyto: kontakt.trim() } : null);
      });
    }
  }

  /* =========================================================
     Odhad ceny nemovitosti — vícekrokový formulář
     Orientační ceny za m² dle lokality (aktualizováno 11/2026)
     ========================================================= */
  var pricePerM2 = {
    "tyniste-nad-orlici": 55000,
    "rychnov-nad-kneznou": 55000,
    "hradec-kralove": 80000,
    "pardubice": 70000,
    "jina": 50000
  };

  /* Pozemky: medián nabídkových cen stavebních pozemků v okrese, nemovitostniodhad.cz/cena-pozemku,
     data k 24. 11. 2026. Týniště nad Orlicí patří do okresu Rychnov nad Kněžnou, „jiná lokalita“ = medián za celou ČR.
     U pozemku se nepoužije koeficient typu ani stavu (Ondřej 25. 11.). */
  var landPerM2 = {
    "tyniste-nad-orlici": 1763,
    "rychnov-nad-kneznou": 1763,
    "hradec-kralove": 3300,
    "pardubice": 3311,
    "jina": 2347
  };

  var typeMultiplier = {
    "byt": 1,
    "rodinny-dum": 1.08,
    "chata-chalupa": 0.85
  };

  var conditionMultiplier = {
    "novostavba": 1.15,
    "velmi-dobry": 1,
    "k-rekonstrukci": 0.78
  };

  var estimateForm = document.querySelector("[data-estimate-calc]");
  if (estimateForm) {
    var steps = Array.prototype.slice.call(estimateForm.querySelectorAll(".calc-step"));
    var indicators = Array.prototype.slice.call(estimateForm.querySelectorAll(".step-indicator span"));
    var currentStep = 0;
    var typeSelect = estimateForm.querySelector("[name='typ']");
    var isLand = function () { return typeSelect.value === "pozemek"; };

    // U pozemku se ptáme jen na plochu pozemku, stav budovy se skryje
    var syncType = function () {
      var land = isLand();
      var heading = estimateForm.querySelector("[data-area-heading]");
      var label = estimateForm.querySelector("[data-area-label]");
      var areaField = estimateForm.querySelector("[name='plocha']");
      var conditionField = estimateForm.querySelector("[data-condition-field]");
      if (heading) heading.textContent = land ? "Plocha pozemku" : "Plocha a stav";
      if (label) label.textContent = land ? "Plocha pozemku (m²)" : "Užitná plocha (m²)";
      if (areaField) areaField.placeholder = land ? "např. 1000" : "např. 75";
      if (conditionField) conditionField.hidden = land;
    };
    typeSelect.addEventListener("change", syncType);
    syncType();

    // moveFocus: po přechodu na krok se zaměření přesune na jeho nadpis, ať čtečka ohlásí, kde uživatel je
    // (při načtení stránky se nezaměřuje nic)
    var showStep = function (index, moveFocus) {
      steps.forEach(function (step, i) { step.classList.toggle("is-active", i === index); });
      indicators.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
        dot.classList.toggle("is-done", i < index);
      });
      currentStep = index;
      if (moveFocus) {
        var heading = steps[index].querySelector("h2");
        if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
      }
    };

    estimateForm.querySelectorAll("[data-step-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (currentStep < steps.length - 1) showStep(currentStep + 1, true);
      });
    });
    estimateForm.querySelectorAll("[data-step-prev]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (currentStep > 0) showStep(currentStep - 1, true);
      });
    });

    var lastEstimate = { low: 0, high: 0 };

    estimateForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var type = typeSelect.value;
      var land = type === "pozemek";
      var location = estimateForm.querySelector("[name='lokalita']").value;
      var areaInput = estimateForm.querySelector("[name='plocha']");
      var area = clampField(areaInput); // 1 až 100 000 m² podle atributů pole
      var condition = estimateForm.querySelector("[name='stav']").value;

      // Bez plochy by vyšel odhad „0 – 0 Kč“
      var areaError = estimateForm.querySelector("[data-area-error]");
      if (!(parseFloat(areaInput.value) > 0)) {
        if (areaError) areaError.textContent = land ? "Vyplňte prosím plochu pozemku v\u00a0m²." : "Vyplňte prosím užitnou plochu v\u00a0m².";
        areaInput.focus();
        return;
      }
      if (areaError) areaError.textContent = "";
      if (String(area) !== String(parseFloat(areaInput.value))) areaInput.value = String(area);

      var estimate = land
        ? (landPerM2[location] || landPerM2["jina"]) * area
        : (pricePerM2[location] || pricePerM2["jina"]) * area * (typeMultiplier[type] || 1) * (conditionMultiplier[condition] || 1);

      var low = estimate * 0.9;
      var high = estimate * 1.1;
      lastEstimate = { low: low, high: high };

      var resultBox = estimateForm.querySelector("[data-estimate-result]");
      var resultValue = estimateForm.querySelector("[data-estimate-value]");
      if (resultValue) {
        resultValue.textContent =
          Math.round(low).toLocaleString("cs-CZ") + " – " + Math.round(high).toLocaleString("cs-CZ") + " Kč";
      }
      if (resultBox) resultBox.style.display = "block";
      estimateForm.querySelectorAll("[data-note]").forEach(function (note) {
        note.hidden = note.getAttribute("data-note") !== (land ? "pozemek" : "budova");
      });
      // výsledek se oznámí čtečce (živá oblast je mimo skrytý krok) a zaměření přejde na nadpis výsledku
      var announce = estimateForm.querySelector("[data-estimate-announce]");
      if (announce) announce.textContent = "Váš orientační odhad: " + (resultValue ? resultValue.textContent : "") + ".";
      showStep(steps.length - 1, true);
    });

    /* Lead formulář pod výsledkem — pošle odhad i zadané údaje Natce (odeslání v main.js).
       Je uvnitř formuláře odhadu, proto tlačítko a vlastní kontrola polí. */
    var estimateLead = estimateForm.querySelector(".lead-capture");
    var estimateLeadBtn = estimateForm.querySelector("[data-estimate-lead-send]");
    if (estimateLead && estimateLeadBtn) {
      estimateLeadBtn.addEventListener("click", function () {
        var jmeno = estimateForm.querySelector("#estimate-lead-jmeno");
        var kontakt = estimateForm.querySelector("#estimate-lead-kontakt");
        var status = estimateLead.querySelector("[data-form-status]");
        if (!jmeno.value.trim() || !kontakt.value.trim()) {
          if (status) status.textContent = "Vyplňte prosím jméno a telefon nebo e-mail.";
          (jmeno.value.trim() ? kontakt : jmeno).focus();
          return;
        }
        var label = function (name) {
          var field = estimateForm.querySelector("[name='" + name + "']");
          return field.tagName === "SELECT" ? field.options[field.selectedIndex].text : field.value;
        };
        var kontaktValue = kontakt.value;
        var data = {
          "Jméno": jmeno.value,
          "Kontakt": kontakt.value,
          "Typ": label("typ"),
          "Lokalita": label("lokalita"),
          "Plocha": label("plocha") + " m²"
        };
        if (!isLand()) data["Stav"] = label("stav");
        data["Orientační odhad"] = Math.round(lastEstimate.low).toLocaleString("cs-CZ") + " – " +
          Math.round(lastEstimate.high).toLocaleString("cs-CZ") + " Kč";
        window.NM.sendLead(estimateLead, "odhad-ceny", "Odhad ceny nemovitosti — žádost o přesný odhad", data,
          kontaktValue.indexOf("@") !== -1 ? { _replyto: kontaktValue.trim() } : null);
      });
    }

    showStep(0);
  }
})();
