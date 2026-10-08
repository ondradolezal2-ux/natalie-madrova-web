(function () {
  "use strict";

  /* =========================================================
     Hypoteční kalkulačka
     M = P × r(1+r)^n / ((1+r)^n − 1)
     P = výše úvěru, r = měsíční úroková sazba, n = počet splátek
     ========================================================= */
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
      var price = parseFloat(priceInput.value) || 0;
      var down = parseFloat(downInput.value) || 0;
      var annualRate = parseFloat(rateInput.value) || 0;
      var years = parseFloat(yearsInput.value) || 0;

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
      if (input) input.addEventListener("input", calculate);
    });
    calculate();

    /* Lead formulář pod výsledkem — odešle spočítané hodnoty e-mailem (TODO: napojit na reálný backend) */
    var leadForm = document.getElementById("mortgage-lead-form");
    if (leadForm) {
      leadForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var jmeno = leadForm.querySelector("#lead-jmeno").value;
        var kontakt = leadForm.querySelector("#lead-kontakt").value;
        var subject = "Hypoteční kalkulačka — žádost o výpočet";
        var body =
          "Jméno: " + jmeno + "\n" +
          "Kontakt: " + kontakt + "\n\n" +
          "Spočítaná měsíční splátka: " + formatCzk(lastResult.monthly) + "\n" +
          "Výše úvěru: " + formatCzk(lastResult.loan) + "\n" +
          "Celkem zaplaceno: " + formatCzk(lastResult.totalPaid) + "\n" +
          "Z toho úroky: " + formatCzk(lastResult.totalInterest);
        window.location.href =
          "mailto:natalie.madrova@bcas.cz?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      });
    }
  }

  /* =========================================================
     Odhad ceny nemovitosti — vícekrokový formulář
     Orientační ceny za m² dle lokality (TODO: ověřit reálnými daty)
     ========================================================= */
  var pricePerM2 = {
    "tyniste-nad-orlici": 55000,
    "rychnov-nad-kneznou": 58000,
    "hradec-kralove": 72000,
    "pardubice": 70000,
    "jina": 50000
  };

  var typeMultiplier = {
    "byt": 1,
    "rodinny-dum": 1.08,
    "pozemek": 0.35,
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

    var showStep = function (index) {
      steps.forEach(function (step, i) { step.classList.toggle("is-active", i === index); });
      indicators.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
        dot.classList.toggle("is-done", i < index);
      });
      currentStep = index;
    };

    estimateForm.querySelectorAll("[data-step-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (currentStep < steps.length - 1) showStep(currentStep + 1);
      });
    });
    estimateForm.querySelectorAll("[data-step-prev]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (currentStep > 0) showStep(currentStep - 1);
      });
    });

    var lastEstimate = { low: 0, high: 0 };

    estimateForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var type = estimateForm.querySelector("[name='typ']").value;
      var location = estimateForm.querySelector("[name='lokalita']").value;
      var area = parseFloat(estimateForm.querySelector("[name='plocha']").value) || 0;
      var condition = estimateForm.querySelector("[name='stav']").value;

      var base = pricePerM2[location] || pricePerM2["jina"];
      var estimate = base * area * (typeMultiplier[type] || 1) * (conditionMultiplier[condition] || 1);

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
      showStep(steps.length - 1);
    });

    /* Lead formulář pod výsledkem — odešle spočítaný odhad e-mailem (TODO: napojit na reálný backend) */
    var estimateLeadBtn = estimateForm.querySelector("[data-estimate-lead-send]");
    if (estimateLeadBtn) {
      estimateLeadBtn.addEventListener("click", function () {
        var jmeno = estimateForm.querySelector("#estimate-lead-jmeno").value;
        var kontakt = estimateForm.querySelector("#estimate-lead-kontakt").value;
        var subject = "Odhad ceny nemovitosti — žádost o přesný odhad";
        var body =
          "Jméno: " + jmeno + "\n" +
          "Kontakt: " + kontakt + "\n\n" +
          "Orientační odhad z kalkulačky: " +
          Math.round(lastEstimate.low).toLocaleString("cs-CZ") + " – " +
          Math.round(lastEstimate.high).toLocaleString("cs-CZ") + " Kč";
        if (typeof gtag === "function") {
          gtag("event", "lead_form_submit", { form_id: "odhad-ceny" });
        }
        window.location.href =
          "mailto:natalie.madrova@bcas.cz?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      });
    }

    showStep(0);
  }
})();
