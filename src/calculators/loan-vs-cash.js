import { formatCurrencyDecimal } from "../utils/currency.js";
import { saveForm, loadForm } from "../utils/storage.js";

const STORAGE_KEY = "loanCalculatorData";

export default class LoanCalculator {
  constructor() {
    this.form = document.getElementById("calculatorForm");
    this.matchCheckbox = document.getElementById("matchPurchaseAmount");
    this.purchaseAmountInput = document.getElementById("purchaseAmount");
    this.availableCashInput = document.getElementById("availableCash");
    this.cashWarning = document.getElementById("cashWarning");
    this.loadSavedValues();
    this.initEventListeners();
  }

  saveFormValues() {
    saveForm(STORAGE_KEY, {
      purchaseAmount: this.purchaseAmountInput.value,
      availableCash: this.availableCashInput.value,
      matchPurchaseAmount: this.matchCheckbox.checked,
      loanRate: document.getElementById("loanRate").value,
      investmentReturn: document.getElementById("investmentReturn").value,
      taxRate: document.getElementById("taxRate").value,
      compoundingFrequency: document.getElementById("compoundingFrequency")
        .value,
      timePeriod: document.getElementById("timePeriod").value,
      timeUnit: document.getElementById("timeUnit").value,
    });
  }

  loadSavedValues() {
    const formData = loadForm(STORAGE_KEY);
    if (!formData) return;

    this.purchaseAmountInput.value = formData.purchaseAmount || "";
    this.availableCashInput.value = formData.availableCash || "";
    this.matchCheckbox.checked = formData.matchPurchaseAmount;
    document.getElementById("loanRate").value = formData.loanRate || "";
    document.getElementById("investmentReturn").value =
      formData.investmentReturn || "";
    document.getElementById("taxRate").value = formData.taxRate || "";
    document.getElementById("compoundingFrequency").value =
      formData.compoundingFrequency || "1";
    document.getElementById("timePeriod").value = formData.timePeriod || "";
    document.getElementById("timeUnit").value = formData.timeUnit || "years";

    // Handle the available cash input state based on checkbox
    this.availableCashInput.disabled = this.matchCheckbox.checked;
    if (this.matchCheckbox.checked) {
      this.availableCashInput.value = this.purchaseAmountInput.value;
    }

    // Trigger calculation if we have valid values
    if (this.isFormValid()) {
      setTimeout(() => {
        this.calculate();
      }, 100);
    }
  }

  initEventListeners() {
    // Real-time calculation and save on input change
    const inputs = this.form.querySelectorAll("input, select");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        if (input.id === "purchaseAmount") {
          this.handlePurchaseAmountChange();
        }
        this.saveFormValues();
        if (this.isFormValid()) {
          this.calculate();
        }
      });

      // Also save on blur
      input.addEventListener("blur", () => {
        this.saveFormValues();
      });
    });

    // Handle checkbox change
    this.matchCheckbox.addEventListener("change", () => {
      this.handleCheckboxChange();
      this.saveFormValues();
    });

    // Initial setup
    this.handleCheckboxChange();
    if (this.isFormValid()) {
      this.calculate();
    }
  }

  handleCheckboxChange() {
    if (this.matchCheckbox.checked) {
      this.availableCashInput.value = this.purchaseAmountInput.value;
      this.availableCashInput.disabled = true;
      this.cashWarning.classList.add("hidden");
    } else {
      this.availableCashInput.disabled = false;
      this.checkCashWarning();
    }
    if (this.isFormValid()) {
      this.calculate();
    }
  }

  handlePurchaseAmountChange() {
    if (this.matchCheckbox.checked) {
      this.availableCashInput.value = this.purchaseAmountInput.value;
    }
    this.checkCashWarning();
  }

  checkCashWarning() {
    const purchaseAmount = parseFloat(this.purchaseAmountInput.value) || 0;
    const availableCash = parseFloat(this.availableCashInput.value) || 0;

    if (availableCash < purchaseAmount) {
      this.cashWarning.classList.remove("hidden");
    } else {
      this.cashWarning.classList.add("hidden");
    }
  }

  isFormValid() {
    const requiredInputs = this.form.querySelectorAll(
      "input[required], select[required]",
    );

    for (let input of requiredInputs) {
      if (input.disabled) continue;
      if (!input.value || input.value.trim() === "") return false;
      if (input.type === "number" && isNaN(parseFloat(input.value)))
        return false;
    }

    return true;
  }

  getInputValues() {
    const purchaseAmount = parseFloat(
      document.getElementById("purchaseAmount").value,
    );
    const availableCash = parseFloat(
      document.getElementById("availableCash").value,
    );
    const loanRate =
      parseFloat(document.getElementById("loanRate").value) / 100;
    const investmentReturn =
      parseFloat(document.getElementById("investmentReturn").value) / 100;
    const taxRate =
      parseFloat(document.getElementById("taxRate").value || 0) / 100;
    const compoundingFrequency = parseInt(
      document.getElementById("compoundingFrequency").value,
    );
    const timePeriod = parseFloat(document.getElementById("timePeriod").value);
    const timeUnit = document.getElementById("timeUnit").value;

    const timeInYears = timeUnit === "months" ? timePeriod / 12 : timePeriod;

    return {
      purchaseAmount,
      availableCash,
      loanRate,
      investmentReturn,
      taxRate,
      compoundingFrequency,
      timeInYears,
      timePeriod,
      timeUnit,
    };
  }

  validateInputs(inputs) {
    const { purchaseAmount, availableCash } = inputs;

    if (purchaseAmount <= 0) {
      throw new Error("Purchase amount must be positive");
    }

    if (availableCash < 0) {
      throw new Error("Available cash cannot be negative");
    }
  }

  calculateCompoundInterest(principal, rate, time, compoundingFrequency = 1) {
    return (
      principal *
      Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time)
    );
  }

  calculateInvestmentWithTax(
    principal,
    rate,
    time,
    compoundingFrequency,
    taxRate,
  ) {
    const totalValue = this.calculateCompoundInterest(
      principal,
      rate,
      time,
      compoundingFrequency,
    );
    const gains = totalValue - principal;
    const taxOnGains = gains * taxRate;
    return totalValue - taxOnGains;
  }

  calculateLoanInterest(principal, rate, time) {
    const monthlyRate = rate / 12;
    const numberOfPayments = time * 12;
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const totalPaid = monthlyPayment * numberOfPayments;
    return totalPaid - principal;
  }

  calculate() {
    try {
      const inputs = this.getInputValues();
      this.validateInputs(inputs);

      const {
        purchaseAmount,
        availableCash,
        loanRate,
        investmentReturn,
        taxRate,
        compoundingFrequency,
        timeInYears,
      } = inputs;

      // Option 1: Pay with Available Cash + Take Loan for Remainder
      const loanAmountNeeded = Math.max(0, purchaseAmount - availableCash);
      const remainingCashAfterPurchase = Math.max(
        0,
        availableCash - purchaseAmount,
      );
      const cashInvestmentValueAfterTax = this.calculateInvestmentWithTax(
        remainingCashAfterPurchase,
        investmentReturn,
        timeInYears,
        compoundingFrequency,
        taxRate,
      );
      const cashInvestmentReturns =
        cashInvestmentValueAfterTax - remainingCashAfterPurchase;
      const totalInterestForRemainder =
        loanAmountNeeded > 0
          ? this.calculateLoanInterest(loanAmountNeeded, loanRate, timeInYears)
          : 0;
      const cashNetPosition =
        cashInvestmentValueAfterTax -
        (loanAmountNeeded + totalInterestForRemainder);

      // Option 2: Take Full Loan and Invest All Cash
      const fullLoanAmount = purchaseAmount;
      const totalInterest = this.calculateLoanInterest(
        fullLoanAmount,
        loanRate,
        timeInYears,
      );
      const loanInvestmentValueAfterTax = this.calculateInvestmentWithTax(
        availableCash,
        investmentReturn,
        timeInYears,
        compoundingFrequency,
        taxRate,
      );
      const loanInvestmentReturns = loanInvestmentValueAfterTax - availableCash;
      const totalLoanCost = fullLoanAmount + totalInterest;
      const loanNetPosition = loanInvestmentValueAfterTax - totalLoanCost;

      const netBenefit = loanNetPosition - cashNetPosition;
      this.displayResults({
        purchaseAmount,
        availableCash,
        remainingCashAfterPurchase,
        cashInvestmentReturns,
        cashNetPosition,
        loanAmount: fullLoanAmount,
        totalInterest,
        loanInvestmentReturns,
        loanNetPosition,
        netBenefit,
        timeInYears,
        inputs,
        loanAmountNeeded,
        totalInterestForRemainder,
      });
    } catch (error) {
      this.showError(error.message);
    }
  }

  displayResults(data) {
    const {
      purchaseAmount,
      availableCash,
      remainingCashAfterPurchase,
      cashInvestmentReturns,
      cashNetPosition,
      loanAmount,
      totalInterest,
      loanInvestmentReturns,
      loanNetPosition,
      netBenefit,
      timeInYears,
      inputs,
      loanAmountNeeded,
      totalInterestForRemainder,
    } = data;

    const fmt = formatCurrencyDecimal;

    // Show results section
    document.getElementById("results").classList.remove("hidden");
    document.getElementById("noResults").classList.add("hidden");

    // Update recommendation
    const recommendationDiv = document.getElementById("recommendation");
    const recommendationText = document.getElementById("recommendationText");

    if (netBenefit > 0) {
      recommendationDiv.className =
        "mb-6 p-4 rounded-lg backdrop-blur-sm bg-emerald-900/30 border border-emerald-500/50";
      recommendationText.innerHTML = `<span class="text-emerald-400">💡 Take a full loan and invest your cash!</span>`;
    } else {
      recommendationDiv.className =
        "mb-6 p-4 rounded-lg backdrop-blur-sm bg-blue-900/30 border border-blue-500/50";
      recommendationText.innerHTML = `<span class="text-blue-400">💡 Use available cash${loanAmountNeeded > 0 ? " with a smaller loan" : ""}!</span>`;
    }

    // Update cash + partial loan option details
    document.getElementById("cashPayment").textContent = fmt(
      Math.min(availableCash, purchaseAmount),
    );

    // Show/hide and update partial loan details
    const partialLoanDetails = document.getElementById("partialLoanDetails");
    const remainingCashSection = document.getElementById(
      "remainingCashSection",
    );

    if (loanAmountNeeded > 0) {
      partialLoanDetails.classList.remove("hidden");
      document.getElementById("partialLoanAmount").textContent =
        fmt(loanAmountNeeded);
      document.getElementById("partialLoanInterest").textContent = fmt(
        totalInterestForRemainder,
      );

      if (remainingCashAfterPurchase <= 0) {
        remainingCashSection.classList.add("hidden");
      } else {
        remainingCashSection.classList.remove("hidden");
      }
    } else {
      partialLoanDetails.classList.add("hidden");
      remainingCashSection.classList.remove("hidden");
    }

    // Update remaining cash details if visible
    if (remainingCashAfterPurchase > 0) {
      document.getElementById("remainingCash").textContent = fmt(
        remainingCashAfterPurchase,
      );
      document.getElementById("cashInvestmentReturns").textContent = fmt(
        cashInvestmentReturns,
      );
    }

    document.getElementById("cashNetPosition").textContent =
      fmt(cashNetPosition);

    // Update full loan option details
    document.getElementById("loanAmount").textContent = fmt(loanAmount);
    document.getElementById("totalInterest").textContent = fmt(totalInterest);
    document.getElementById("fullLoanCashToInvest").textContent =
      fmt(availableCash);
    document.getElementById("loanInvestmentReturns").textContent = fmt(
      loanInvestmentReturns,
    );
    document.getElementById("loanNetPosition").textContent =
      fmt(loanNetPosition);

    // Update net benefit
    const netBenefitElement = document.getElementById("netBenefit");
    const benefitExplanationElement =
      document.getElementById("benefitExplanation");

    if (netBenefit > 0) {
      netBenefitElement.textContent = `+${fmt(netBenefit)}`;
      netBenefitElement.className = "font-bold text-xl text-emerald-400";
      benefitExplanationElement.textContent = `Taking a full loan and investing your ${fmt(availableCash)} cash provides ${fmt(netBenefit)} more after ${inputs.timePeriod} ${inputs.timeUnit}.`;
    } else {
      netBenefitElement.textContent = fmt(netBenefit);
      netBenefitElement.className = "font-bold text-xl text-blue-400";
      const explanation =
        loanAmountNeeded > 0
          ? `Using ${fmt(availableCash)} cash with a ${fmt(loanAmountNeeded)} loan saves you ${fmt(Math.abs(netBenefit))}`
          : `Using only cash saves you ${fmt(Math.abs(netBenefit))}`;
      benefitExplanationElement.textContent = `${explanation} after ${inputs.timePeriod} ${inputs.timeUnit}.`;
    }

    // Update net benefit section border
    const netBenefitSection = netBenefitElement.closest(".p-4");
    if (netBenefit > 0) {
      netBenefitSection.className =
        "p-4 rounded-lg border border-emerald-500/50 bg-emerald-900/30 backdrop-blur-sm";
    } else {
      netBenefitSection.className =
        "p-4 rounded-lg border border-blue-500/50 bg-blue-900/30 backdrop-blur-sm";
    }
  }

  showError(message) {
    document.getElementById("results").classList.add("hidden");
    document.getElementById("noResults").innerHTML = `
            <div class="text-center text-red-400 py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="font-medium">${message}</p>
                <p class="text-sm mt-2 text-gray-500">Please check your inputs and try again.</p>
            </div>
        `;
    document.getElementById("noResults").classList.remove("hidden");
  }
}
