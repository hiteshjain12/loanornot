import { formatCurrency, formatCurrencyShort } from "../utils/currency.js";
import { saveForm, loadForm } from "../utils/storage.js";
import {
  createSvg,
  createLine,
  createPath,
  createRect,
  createCircle,
  createText,
  drawAxes as drawAxesUtil,
  drawGridLines,
  drawYAxisLabels,
  addLegend,
} from "../utils/charts.js";

const STORAGE_KEY = "homeLoanCalculatorData";

export default class HomeLoanCalculator {
  constructor() {
    this.form = document.getElementById("homeLoanCalculatorForm");
    this.isMonthlyView = false;
    this.amortizationData = null;
    this.amortizationDataNoPrepay = null;
    this.loadSavedValues();
    this.initEventListeners();
  }

  saveFormValues() {
    const formData = {
      homeLoanAmount: document.getElementById("homeLoanAmount").value,
      homeLoanInterestRate: document.getElementById("homeLoanInterestRate")
        .value,
      homeLoanProcessingFees: document.getElementById("homeLoanProcessingFees")
        .value,
      homeLoanTenureYears: document.getElementById("homeLoanTenureYears").value,
      homeLoanStepUp: document.getElementById("homeLoanStepUp").value,
      homeLoanMonthlyPrepayment: document.getElementById(
        "homeLoanMonthlyPrepayment",
      ).value,
      homeLoanAnnualPrepayment: document.getElementById(
        "homeLoanAnnualPrepayment",
      ).value,
      homeLoanOneTimePrepayment: document.getElementById(
        "homeLoanOneTimePrepayment",
      ).value,
      homeLoanOneTimePrepaymentYear: document.getElementById(
        "homeLoanOneTimePrepaymentYear",
      ).value,
      homeLoanPrepaymentStrategy: document.querySelector(
        'input[name="homeLoanPrepaymentStrategy"]:checked',
      ).value,
      homeLoanInvestmentReturn: document.getElementById(
        "homeLoanInvestmentReturn",
      ).value,
      homeLoanTaxRate: document.getElementById("homeLoanTaxRate").value,
    };
    saveForm(STORAGE_KEY, formData);
  }

  loadSavedValues() {
    const formData = loadForm(STORAGE_KEY);
    if (formData) {
      document.getElementById("homeLoanAmount").value =
        formData.homeLoanAmount || "";
      document.getElementById("homeLoanInterestRate").value =
        formData.homeLoanInterestRate || "";
      document.getElementById("homeLoanProcessingFees").value =
        formData.homeLoanProcessingFees || "0";
      document.getElementById("homeLoanTenureYears").value =
        formData.homeLoanTenureYears || "";
      document.getElementById("homeLoanStepUp").value =
        formData.homeLoanStepUp || "0";
      document.getElementById("homeLoanMonthlyPrepayment").value =
        formData.homeLoanMonthlyPrepayment || "0";
      document.getElementById("homeLoanAnnualPrepayment").value =
        formData.homeLoanAnnualPrepayment || "0";
      document.getElementById("homeLoanOneTimePrepayment").value =
        formData.homeLoanOneTimePrepayment || "0";
      document.getElementById("homeLoanOneTimePrepaymentYear").value =
        formData.homeLoanOneTimePrepaymentYear || "1";

      const strategy = formData.homeLoanPrepaymentStrategy || "reduceTenure";
      document.querySelector(
        `input[name="homeLoanPrepaymentStrategy"][value="${strategy}"]`,
      ).checked = true;

      document.getElementById("homeLoanInvestmentReturn").value =
        formData.homeLoanInvestmentReturn || "12";
      document.getElementById("homeLoanTaxRate").value =
        formData.homeLoanTaxRate || "10";

      if (this.form.checkValidity()) {
        setTimeout(() => {
          this.calculate();
        }, 100);
      }
    }
  }

  initEventListeners() {
    const inputs = this.form.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        this.saveFormValues();
        if (this.form.checkValidity()) {
          this.calculate();
        }
      });
    });

    // Toggle view button
    const toggleBtn = document.getElementById("homeLoanToggleView");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.isMonthlyView = !this.isMonthlyView;
        toggleBtn.textContent = this.isMonthlyView
          ? "Switch to Yearly View"
          : "Switch to Monthly View";
        if (this.amortizationData) {
          this.displayAmortizationTable(this.amortizationData);
        }
      });
    }

    // Download CSV button
    const downloadBtn = document.getElementById("homeLoanDownloadCSV");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        this.downloadCSV();
      });
    }

    // Toggle detailed calculations
    const toggleDetailsBtn = document.getElementById("homeLoanToggleDetails");
    if (toggleDetailsBtn) {
      toggleDetailsBtn.addEventListener("click", () => {
        const detailsSection = document.getElementById(
          "homeLoanDetailedCalculations",
        );
        const chevron = document.getElementById("homeLoanDetailsChevron");

        if (detailsSection.classList.contains("hidden")) {
          detailsSection.classList.remove("hidden");
          chevron.style.transform = "rotate(180deg)";
        } else {
          detailsSection.classList.add("hidden");
          chevron.style.transform = "rotate(0deg)";
        }
      });
    }
  }

  getInputValues() {
    const years =
      parseInt(document.getElementById("homeLoanTenureYears").value) || 0;

    return {
      loanAmount: parseFloat(document.getElementById("homeLoanAmount").value),
      interestRate:
        parseFloat(document.getElementById("homeLoanInterestRate").value) / 100,
      processingFees:
        parseFloat(document.getElementById("homeLoanProcessingFees").value) ||
        0,
      tenureMonths: years * 12,
      stepUpRate:
        parseFloat(document.getElementById("homeLoanStepUp").value) / 100 || 0,
      monthlyPrepayment:
        parseFloat(
          document.getElementById("homeLoanMonthlyPrepayment").value,
        ) || 0,
      annualPrepayment:
        parseFloat(document.getElementById("homeLoanAnnualPrepayment").value) ||
        0,
      oneTimePrepayment:
        parseFloat(
          document.getElementById("homeLoanOneTimePrepayment").value,
        ) || 0,
      oneTimePrepaymentYear:
        parseInt(
          document.getElementById("homeLoanOneTimePrepaymentYear").value,
        ) || 1,
      prepaymentStrategy: document.querySelector(
        'input[name="homeLoanPrepaymentStrategy"]:checked',
      ).value,
      investmentReturn:
        parseFloat(document.getElementById("homeLoanInvestmentReturn").value) /
        100,
      taxRate:
        parseFloat(document.getElementById("homeLoanTaxRate").value) / 100,
    };
  }

  validateInputs(inputs) {
    if (inputs.loanAmount <= 0) {
      throw new Error("Loan amount must be positive");
    }
    if (inputs.interestRate <= 0) {
      throw new Error("Interest rate must be positive");
    }
    if (inputs.tenureMonths <= 0) {
      throw new Error("Loan tenure must be at least 1 month");
    }
  }

  calculateEMI(principal, monthlyRate, months) {
    if (monthlyRate === 0) {
      return principal / months;
    }
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  }

  generateAmortizationSchedule(inputs, withPrepayment = true) {
    const monthlyRate = inputs.interestRate / 12;
    let balance = inputs.loanAmount;
    let month = 0;
    const schedule = [];
    let totalInterest = 0;
    let totalPrepayment = 0;
    let totalPrincipal = 0;

    // Calculate initial EMI
    let currentEMI = this.calculateEMI(
      balance,
      monthlyRate,
      inputs.tenureMonths,
    );
    const baseEMI = currentEMI;
    let remainingMonths = inputs.tenureMonths;

    while (balance > 0.01 && month < inputs.tenureMonths * 3) {
      // Safety limit
      month++;
      const currentYear = Math.ceil(month / 12);

      // Apply step-up annually (only for "Reduce Tenure" strategy)
      if (
        withPrepayment &&
        inputs.stepUpRate > 0 &&
        inputs.prepaymentStrategy === "reduceTenure" &&
        month > 1 &&
        (month - 1) % 12 === 0
      ) {
        currentEMI = currentEMI * (1 + inputs.stepUpRate);
      }

      const interest = balance * monthlyRate;
      let principal = Math.min(currentEMI - interest, balance);
      let prepayment = 0;

      // Apply monthly prepayment
      if (withPrepayment && inputs.monthlyPrepayment > 0) {
        prepayment += inputs.monthlyPrepayment;
      }

      // Apply annual prepayment (at the end of each year)
      if (withPrepayment && inputs.annualPrepayment > 0 && month % 12 === 0) {
        prepayment += inputs.annualPrepayment;
      }

      // Apply one-time prepayment (at the end of the specified year)
      if (
        withPrepayment &&
        inputs.oneTimePrepayment > 0 &&
        currentYear === inputs.oneTimePrepaymentYear &&
        month % 12 === 0
      ) {
        prepayment += inputs.oneTimePrepayment;
      }

      // Ensure we don't overpay
      if (principal + prepayment > balance) {
        prepayment = Math.max(0, balance - principal);
        principal = balance - prepayment;
      }

      const totalPayment = principal + prepayment;
      const closingBalance = Math.max(0, balance - totalPayment);

      totalInterest += interest;
      totalPrepayment += prepayment;
      totalPrincipal += principal;

      schedule.push({
        month,
        year: currentYear,
        openingBalance: balance,
        emi: currentEMI,
        principal,
        interest,
        prepayment,
        closingBalance,
        cumulativeInterest: totalInterest,
      });

      balance = closingBalance;

      // For "Reduce EMI" strategy, recalculate EMI after prepayment
      if (
        withPrepayment &&
        prepayment > 0 &&
        inputs.prepaymentStrategy === "reduceEMI" &&
        balance > 0.01
      ) {
        remainingMonths = inputs.tenureMonths - month;
        if (remainingMonths > 0) {
          currentEMI = this.calculateEMI(balance, monthlyRate, remainingMonths);
        }
      }

      if (balance <= 0.01) {
        break;
      }
    }

    return {
      schedule,
      totalInterest,
      totalPrepayment,
      totalPrincipal,
      actualMonths: month,
      baseEMI,
    };
  }

  aggregateToYearly(schedule) {
    const yearlyData = [];
    let currentYear = null;
    let yearData = null;

    schedule.forEach((row) => {
      if (row.year !== currentYear) {
        if (yearData) {
          yearlyData.push(yearData);
        }
        currentYear = row.year;
        yearData = {
          year: currentYear,
          openingBalance: row.openingBalance,
          totalEMI: 0,
          totalPrincipal: 0,
          totalInterest: 0,
          totalPrepayment: 0,
          closingBalance: row.closingBalance,
          cumulativeInterest: row.cumulativeInterest,
        };
      }

      yearData.totalEMI += row.emi;
      yearData.totalPrincipal += row.principal;
      yearData.totalInterest += row.interest;
      yearData.totalPrepayment += row.prepayment;
      yearData.closingBalance = row.closingBalance;
      yearData.cumulativeInterest = row.cumulativeInterest;
    });

    if (yearData) {
      yearlyData.push(yearData);
    }

    return yearlyData;
  }

  compareWithInvestment(inputs, amortizationWithPrepay) {
    const totalPrepaid = amortizationWithPrepay.totalPrepayment;
    const interestSaved =
      this.amortizationDataNoPrepay.totalInterest -
      amortizationWithPrepay.totalInterest;

    // Calculate investment returns if prepayment amount was invested instead
    const yearsToMaturity = amortizationWithPrepay.actualMonths / 12;
    const monthlyInvestmentAmount = inputs.monthlyPrepayment;
    const annualInvestmentAmount = inputs.annualPrepayment;
    const oneTimeInvestment = inputs.oneTimePrepayment;

    // Calculate future value of monthly investments (SIP)
    const monthlyReturnRate = inputs.investmentReturn / 12;
    let investmentValue = 0;

    // Monthly SIP
    if (monthlyInvestmentAmount > 0) {
      const months = amortizationWithPrepay.actualMonths;
      investmentValue =
        monthlyInvestmentAmount *
        ((Math.pow(1 + monthlyReturnRate, months) - 1) / monthlyReturnRate) *
        (1 + monthlyReturnRate);
    }

    // Annual investments
    if (annualInvestmentAmount > 0) {
      const years = Math.floor(amortizationWithPrepay.actualMonths / 12);
      for (let year = 1; year <= years; year++) {
        const yearsRemaining = yearsToMaturity - year;
        const futureValue =
          annualInvestmentAmount *
          Math.pow(1 + inputs.investmentReturn, yearsRemaining);
        investmentValue += futureValue;
      }
    }

    // Add one-time investment
    if (oneTimeInvestment > 0) {
      const yearsRemaining = yearsToMaturity - inputs.oneTimePrepaymentYear;
      const oneTimeValue =
        oneTimeInvestment *
        Math.pow(1 + inputs.investmentReturn, yearsRemaining);
      investmentValue += oneTimeValue;
    }

    const investmentGains = investmentValue - totalPrepaid;
    const taxOnGains =
      investmentGains > 0 ? investmentGains * inputs.taxRate : 0;
    const netInvestmentBenefit = investmentGains - taxOnGains;

    return {
      interestSaved,
      totalPrepaid,
      investmentValue,
      investmentGains,
      taxOnGains,
      netInvestmentBenefit,
      prepaymentBenefit: interestSaved,
      recommendation:
        interestSaved > netInvestmentBenefit ? "prepay" : "invest",
    };
  }

  calculate() {
    try {
      const inputs = this.getInputValues();
      this.validateInputs(inputs);

      // Generate schedules
      const hasPrepayment =
        inputs.stepUpRate > 0 ||
        inputs.monthlyPrepayment > 0 ||
        inputs.annualPrepayment > 0 ||
        inputs.oneTimePrepayment > 0;

      this.amortizationDataNoPrepay = this.generateAmortizationSchedule(
        inputs,
        false,
      );
      this.amortizationData = hasPrepayment
        ? this.generateAmortizationSchedule(inputs, true)
        : this.amortizationDataNoPrepay;

      // Calculate investment comparison if there's prepayment
      let investmentComparison = null;
      if (hasPrepayment) {
        investmentComparison = this.compareWithInvestment(
          inputs,
          this.amortizationData,
        );
      }

      this.displayResults(
        inputs,
        this.amortizationData,
        this.amortizationDataNoPrepay,
        investmentComparison,
      );
    } catch (error) {
      this.showError(error.message);
    }
  }

  displayResults(
    inputs,
    amortizationData,
    amortizationDataNoPrepay,
    investmentComparison,
  ) {
    // Show results, hide placeholder
    document.getElementById("homeLoanResults").classList.remove("hidden");
    document.getElementById("noHomeLoanResults").classList.add("hidden");

    // Update loan summary
    document.getElementById("homeLoanEMI").textContent = formatCurrency(
      amortizationData.baseEMI,
    );
    document.getElementById("homeLoanTotalPrincipal").textContent =
      formatCurrency(amortizationData.totalPrincipal);
    document.getElementById("homeLoanTotalInterest").textContent =
      formatCurrency(amortizationData.totalInterest);
    document.getElementById("homeLoanTotalAmount").textContent = formatCurrency(
      inputs.loanAmount +
        amortizationData.totalInterest +
        inputs.processingFees,
    );

    const years = Math.floor(amortizationData.actualMonths / 12);
    const months = amortizationData.actualMonths % 12;
    let tenureText = "";
    if (years > 0) tenureText += `${years}y `;
    if (months > 0) tenureText += `${months}m`;
    document.getElementById("homeLoanActualTenure").textContent =
      tenureText.trim();

    // Show savings section if there's prepayment
    const hasPrepayment = amortizationData.totalPrepayment > 0;
    const savingsSection = document.getElementById("homeLoanSavingsSection");

    if (hasPrepayment) {
      savingsSection.classList.remove("hidden");
      const interestSaved =
        amortizationDataNoPrepay.totalInterest - amortizationData.totalInterest;
      const timeSaved =
        amortizationDataNoPrepay.actualMonths - amortizationData.actualMonths;
      const yearsSaved = Math.floor(timeSaved / 12);
      const monthsSaved = timeSaved % 12;
      let timeSavedText = "";
      if (yearsSaved > 0) timeSavedText += `${yearsSaved}y `;
      if (monthsSaved > 0) timeSavedText += `${monthsSaved}m`;

      document.getElementById("homeLoanInterestSaved").textContent =
        formatCurrency(interestSaved);
      document.getElementById("homeLoanTimeSaved").textContent =
        timeSavedText.trim();
      document.getElementById("homeLoanTotalPrepaid").textContent =
        formatCurrency(amortizationData.totalPrepayment);
    } else {
      savingsSection.classList.add("hidden");
    }

    // Show investment analysis if there's prepayment
    const analysisSection = document.getElementById(
      "homeLoanInvestmentAnalysis",
    );
    if (hasPrepayment && investmentComparison) {
      analysisSection.classList.remove("hidden");

      const recommendationDiv = document.getElementById(
        "homeLoanRecommendation",
      );
      const recommendationText = document.getElementById(
        "homeLoanRecommendationText",
      );

      if (investmentComparison.recommendation === "prepay") {
        recommendationDiv.className =
          "mb-6 p-4 rounded-lg backdrop-blur-sm bg-emerald-900/30 border border-emerald-500/50";
        recommendationText.innerHTML = `<span class="text-emerald-400">\u{1F4B0} Prepaying your loan is the better option!</span>`;
      } else {
        recommendationDiv.className =
          "mb-6 p-4 rounded-lg backdrop-blur-sm bg-blue-900/30 border border-blue-500/50";
        recommendationText.innerHTML = `<span class="text-blue-400">\u{1F4C8} Investing your money would be more beneficial!</span>`;
      }

      // Update prepayment option
      document.getElementById("homeLoanPrepayInterestSaved").textContent =
        formatCurrency(investmentComparison.interestSaved);
      document.getElementById("homeLoanPrepayTotalPrepaid").textContent =
        formatCurrency(investmentComparison.totalPrepaid);
      document.getElementById("homeLoanPrepayNetBenefit").textContent =
        formatCurrency(investmentComparison.prepaymentBenefit);

      // Update investment option
      document.getElementById("homeLoanInvestReturns").textContent =
        formatCurrency(investmentComparison.investmentGains);
      document.getElementById("homeLoanInvestTax").textContent = formatCurrency(
        investmentComparison.taxOnGains,
      );
      document.getElementById("homeLoanInvestNetBenefit").textContent =
        formatCurrency(investmentComparison.netInvestmentBenefit);

      // Update better option
      const difference = Math.abs(
        investmentComparison.prepaymentBenefit -
          investmentComparison.netInvestmentBenefit,
      );
      const betterOptionText =
        investmentComparison.recommendation === "prepay"
          ? `Prepayment (${formatCurrency(difference)} better)`
          : `Investment (${formatCurrency(difference)} better)`;

      document.getElementById("homeLoanBetterOption").textContent =
        betterOptionText;
      document.getElementById("homeLoanBetterOption").className =
        investmentComparison.recommendation === "prepay"
          ? "text-2xl font-bold text-emerald-400"
          : "text-2xl font-bold text-blue-400";

      const diffText =
        investmentComparison.recommendation === "prepay"
          ? `Prepaying saves you ${formatCurrency(difference)} more than investing over the loan tenure.`
          : `Investing earns you ${formatCurrency(difference)} more than prepaying over the loan tenure.`;
      document.getElementById("homeLoanDifference").textContent = diffText;

      // Populate detailed calculations
      this.populateDetailedCalculations(
        investmentComparison,
        amortizationData,
        amortizationDataNoPrepay,
      );
    } else {
      analysisSection.classList.add("hidden");
    }

    // Display amortization table
    this.displayAmortizationTable(amortizationData);

    // Draw charts
    this.drawPrincipalInterestChart(amortizationData);
    this.drawBalanceChart(amortizationData);

    if (hasPrepayment) {
      document
        .getElementById("homeLoanComparisonChartSection")
        .classList.remove("hidden");
      this.drawComparisonChart(amortizationData, amortizationDataNoPrepay);
    } else {
      document
        .getElementById("homeLoanComparisonChartSection")
        .classList.add("hidden");
    }
  }

  populateDetailedCalculations(
    investmentComparison,
    amortizationData,
    amortizationDataNoPrepay,
  ) {
    // Prepayment breakdown
    document.getElementById("detailPrepayTotalPrepaid").textContent =
      formatCurrency(investmentComparison.totalPrepaid);
    document.getElementById("detailInterestWithoutPrepay").textContent =
      formatCurrency(amortizationDataNoPrepay.totalInterest);
    document.getElementById("detailInterestWithPrepay").textContent =
      formatCurrency(amortizationData.totalInterest);
    document.getElementById("detailInterestSaved").textContent = formatCurrency(
      investmentComparison.interestSaved,
    );

    // Net benefit for prepayment = Interest Saved
    const prepayNetBenefit = investmentComparison.interestSaved;
    document.getElementById("detailPrepayNetBenefit").textContent =
      formatCurrency(prepayNetBenefit);

    // Investment breakdown
    document.getElementById("detailInvestAmount").textContent = formatCurrency(
      investmentComparison.totalPrepaid,
    );
    document.getElementById("detailInvestFutureValue").textContent =
      formatCurrency(investmentComparison.investmentValue);
    document.getElementById("detailInvestGrossReturns").textContent =
      formatCurrency(investmentComparison.investmentGains);
    document.getElementById("detailInvestTaxAmount").textContent =
      formatCurrency(investmentComparison.taxOnGains);

    const netReturnsAfterTax =
      investmentComparison.investmentGains - investmentComparison.taxOnGains;
    document.getElementById("detailInvestNetReturns").textContent =
      formatCurrency(netReturnsAfterTax);

    // Extra interest paid = Interest without prepay - Interest with prepay (but without using prepayment money)
    const extraInterestPaid = investmentComparison.interestSaved;
    document.getElementById("detailExtraInterest").textContent =
      formatCurrency(extraInterestPaid);

    // Net benefit for investment = Net Returns - Extra Interest Paid
    const investNetBenefit = netReturnsAfterTax - extraInterestPaid;
    document.getElementById("detailInvestNetBenefit").textContent =
      formatCurrency(investNetBenefit);

    // Summary
    document.getElementById("detailSummaryPrepay").textContent =
      formatCurrency(prepayNetBenefit);
    document.getElementById("detailSummaryInvest").textContent =
      formatCurrency(investNetBenefit);

    const summaryDifference = Math.abs(prepayNetBenefit - investNetBenefit);
    const summaryDiffElement = document.getElementById(
      "detailSummaryDifference",
    );

    if (prepayNetBenefit > investNetBenefit) {
      summaryDiffElement.textContent = `+${formatCurrency(summaryDifference)}`;
      summaryDiffElement.className = "font-bold text-lg text-emerald-400";
      document.getElementById("detailSummaryExplanation").textContent =
        `Prepayment provides ${formatCurrency(summaryDifference)} more benefit than investing.`;
    } else {
      summaryDiffElement.textContent = `+${formatCurrency(summaryDifference)}`;
      summaryDiffElement.className = "font-bold text-lg text-blue-400";
      document.getElementById("detailSummaryExplanation").textContent =
        `Investment provides ${formatCurrency(summaryDifference)} more benefit than prepaying.`;
    }
  }

  displayAmortizationTable(amortizationData) {
    const tableBody = document.getElementById("homeLoanAmortizationTable");
    tableBody.innerHTML = "";

    const data = this.isMonthlyView
      ? amortizationData.schedule
      : this.aggregateToYearly(amortizationData.schedule);

    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-800/30";

      const period = this.isMonthlyView ? `M${row.month}` : `Y${row.year}`;
      const emi = this.isMonthlyView ? row.emi : row.totalEMI;
      const principal = this.isMonthlyView ? row.principal : row.totalPrincipal;
      const interest = this.isMonthlyView ? row.interest : row.totalInterest;
      const prepayment = this.isMonthlyView
        ? row.prepayment
        : row.totalPrepayment;

      tr.innerHTML = `
                <td class="py-2 px-4 text-gray-300">${period}</td>
                <td class="py-2 px-4 text-right text-gray-300">${formatCurrency(row.openingBalance)}</td>
                <td class="py-2 px-4 text-right text-blue-400">${formatCurrency(emi)}</td>
                <td class="py-2 px-4 text-right text-emerald-400">${formatCurrency(principal)}</td>
                <td class="py-2 px-4 text-right text-red-400">${formatCurrency(interest)}</td>
                <td class="py-2 px-4 text-right text-yellow-400">${prepayment > 0 ? formatCurrency(prepayment) : "-"}</td>
                <td class="py-2 px-4 text-right text-gray-300">${formatCurrency(row.closingBalance)}</td>
                <td class="py-2 px-4 text-right text-red-300">${formatCurrency(row.cumulativeInterest)}</td>
            `;
      tableBody.appendChild(tr);
    });
  }

  drawPrincipalInterestChart(amortizationData) {
    const chartContainer = document.getElementById(
      "homeLoanPrincipalInterestChart",
    );
    chartContainer.innerHTML = "";

    const yearlyData = this.aggregateToYearly(amortizationData.schedule);

    const width = chartContainer.offsetWidth;
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const svg = createSvg(width, height);

    // Find max value
    const maxValue = Math.max(
      ...yearlyData.map((d) => d.totalPrincipal + d.totalInterest),
    );

    // Scales
    const xScale = (index) =>
      padding.left + (index / (yearlyData.length - 1)) * chartWidth;
    const yScale = (value) =>
      padding.top + chartHeight - (value / maxValue) * chartHeight;

    // Draw stacked bars
    const barWidth = (chartWidth / yearlyData.length) * 0.7;

    yearlyData.forEach((data, index) => {
      const x = xScale(index) - barWidth / 2;
      const interestHeight = (data.totalInterest / maxValue) * chartHeight;
      const principalHeight = (data.totalPrincipal / maxValue) * chartHeight;

      // Interest bar (bottom)
      svg.appendChild(
        createRect(
          x,
          padding.top + chartHeight - interestHeight,
          barWidth,
          interestHeight,
          "#ef4444",
          { opacity: "0.8" },
        ),
      );

      // Principal bar (top)
      svg.appendChild(
        createRect(
          x,
          padding.top + chartHeight - interestHeight - principalHeight,
          barWidth,
          principalHeight,
          "#10b981",
          { opacity: "0.8" },
        ),
      );
    });

    // Draw axes
    drawAxesUtil(svg, padding, chartWidth, chartHeight);

    // Draw Y-axis labels
    drawYAxisLabels(svg, padding, chartHeight, maxValue, formatCurrencyShort);

    // Add X-axis labels (years)
    yearlyData.forEach((data, index) => {
      const x = xScale(index);
      svg.appendChild(
        createText(
          x,
          padding.top + chartHeight + 20,
          `Y${data.year}`,
          "#9ca3af",
          11,
          {
            anchor: "middle",
          },
        ),
      );
    });

    // Add X-axis title
    svg.appendChild(
      createText(
        padding.left + chartWidth / 2,
        height - 10,
        "Year",
        "#9ca3af",
        12,
        { anchor: "middle", weight: "bold" },
      ),
    );

    // Add Y-axis title
    svg.appendChild(
      createText(
        -(padding.top + chartHeight / 2),
        15,
        "Amount (\u20B9)",
        "#9ca3af",
        12,
        { anchor: "middle", weight: "bold", transform: "rotate(-90)" },
      ),
    );

    // Add legend
    addLegend(svg, padding, height, [
      { label: "Principal", color: "#10b981" },
      { label: "Interest", color: "#ef4444" },
    ]);

    chartContainer.appendChild(svg);
  }

  drawBalanceChart(amortizationData) {
    const chartContainer = document.getElementById("homeLoanBalanceChart");
    chartContainer.innerHTML = "";

    const yearlyData = this.aggregateToYearly(amortizationData.schedule);

    const width = chartContainer.offsetWidth;
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const svg = createSvg(width, height);

    const maxBalance = yearlyData[0].openingBalance;

    // Scales
    const xScale = (index) =>
      padding.left + (index / yearlyData.length) * chartWidth;
    const yScale = (balance) =>
      padding.top + chartHeight - (balance / maxBalance) * chartHeight;

    // Draw line
    let pathData = `M ${xScale(0)} ${yScale(yearlyData[0].openingBalance)}`;
    yearlyData.forEach((data, index) => {
      pathData += ` L ${xScale(index + 1)} ${yScale(data.closingBalance)}`;
    });

    svg.appendChild(createPath(pathData, "#3b82f6", 3));

    // Draw area under the line
    let areaData = `M ${xScale(0)} ${padding.top + chartHeight}`;
    areaData += ` L ${xScale(0)} ${yScale(yearlyData[0].openingBalance)}`;
    yearlyData.forEach((data, index) => {
      areaData += ` L ${xScale(index + 1)} ${yScale(data.closingBalance)}`;
    });
    areaData += ` L ${xScale(yearlyData.length)} ${padding.top + chartHeight} Z`;

    svg.appendChild(
      createPath(areaData, "none", 0, "#3b82f6", { opacity: "0.2" }),
    );

    // Draw axes
    drawAxesUtil(svg, padding, chartWidth, chartHeight);

    // Draw Y-axis labels
    drawYAxisLabels(svg, padding, chartHeight, maxBalance, formatCurrencyShort);

    // Add X-axis labels (years)
    yearlyData.forEach((data, index) => {
      const x = xScale(index);
      svg.appendChild(
        createText(
          x,
          padding.top + chartHeight + 20,
          `Y${data.year}`,
          "#9ca3af",
          11,
          {
            anchor: "middle",
          },
        ),
      );
    });

    // Add X-axis title
    svg.appendChild(
      createText(
        padding.left + chartWidth / 2,
        height - 10,
        "Year",
        "#9ca3af",
        12,
        { anchor: "middle", weight: "bold" },
      ),
    );

    // Add Y-axis title
    svg.appendChild(
      createText(
        -(padding.top + chartHeight / 2),
        15,
        "Outstanding Balance (\u20B9)",
        "#9ca3af",
        12,
        { anchor: "middle", weight: "bold", transform: "rotate(-90)" },
      ),
    );

    chartContainer.appendChild(svg);
  }

  drawComparisonChart(withPrepay, withoutPrepay) {
    const chartContainer = document.getElementById("homeLoanComparisonChart");
    chartContainer.innerHTML = "";

    const yearlyWithPrepay = this.aggregateToYearly(withPrepay.schedule);
    const yearlyWithoutPrepay = this.aggregateToYearly(withoutPrepay.schedule);

    const width = chartContainer.offsetWidth;
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const svg = createSvg(width, height);

    const maxYears = Math.max(
      yearlyWithPrepay.length,
      yearlyWithoutPrepay.length,
    );
    const maxBalance = yearlyWithoutPrepay[0].openingBalance;

    // Scales
    const xScale = (index) => padding.left + (index / maxYears) * chartWidth;
    const yScale = (balance) =>
      padding.top + chartHeight - (balance / maxBalance) * chartHeight;

    // Draw without prepayment line
    let pathWithout = `M ${xScale(0)} ${yScale(yearlyWithoutPrepay[0].openingBalance)}`;
    yearlyWithoutPrepay.forEach((data, index) => {
      pathWithout += ` L ${xScale(index + 1)} ${yScale(data.closingBalance)}`;
    });

    svg.appendChild(
      createPath(pathWithout, "#ef4444", 3, "none", { dasharray: "5,5" }),
    );

    // Draw with prepayment line
    let pathWith = `M ${xScale(0)} ${yScale(yearlyWithPrepay[0].openingBalance)}`;
    yearlyWithPrepay.forEach((data, index) => {
      pathWith += ` L ${xScale(index + 1)} ${yScale(data.closingBalance)}`;
    });

    svg.appendChild(createPath(pathWith, "#10b981", 3));

    // Draw axes
    drawAxesUtil(svg, padding, chartWidth, chartHeight);

    // Draw Y-axis labels
    drawYAxisLabels(svg, padding, chartHeight, maxBalance, formatCurrencyShort);

    // Add X-axis labels (years)
    const labelsToShow = Math.min(maxYears, 20);
    const labelStep = Math.ceil(maxYears / labelsToShow);
    for (let year = 0; year <= maxYears; year += labelStep) {
      const x = xScale(year);
      svg.appendChild(
        createText(
          x,
          padding.top + chartHeight + 20,
          `Y${year}`,
          "#9ca3af",
          11,
          {
            anchor: "middle",
          },
        ),
      );
    }

    // Add X-axis title
    svg.appendChild(
      createText(
        padding.left + chartWidth / 2,
        height - 10,
        "Year",
        "#9ca3af",
        12,
        { anchor: "middle", weight: "bold" },
      ),
    );

    // Add Y-axis title
    svg.appendChild(
      createText(
        -(padding.top + chartHeight / 2),
        15,
        "Outstanding Balance (\u20B9)",
        "#9ca3af",
        12,
        { anchor: "middle", weight: "bold", transform: "rotate(-90)" },
      ),
    );

    // Add legend
    addLegend(svg, padding, height, [
      { label: "With Prepayment", color: "#10b981" },
      { label: "Without Prepayment", color: "#ef4444", dashed: true },
    ]);

    chartContainer.appendChild(svg);
  }

  downloadCSV() {
    if (!this.amortizationData) return;

    const data = this.isMonthlyView
      ? this.amortizationData.schedule
      : this.aggregateToYearly(this.amortizationData.schedule);

    let csv =
      "Period,Opening Balance,EMI,Principal,Interest,Prepayment,Closing Balance,Cumulative Interest\n";

    data.forEach((row) => {
      const period = this.isMonthlyView
        ? `Month ${row.month}`
        : `Year ${row.year}`;
      const emi = this.isMonthlyView ? row.emi : row.totalEMI;
      const principal = this.isMonthlyView ? row.principal : row.totalPrincipal;
      const interest = this.isMonthlyView ? row.interest : row.totalInterest;
      const prepayment = this.isMonthlyView
        ? row.prepayment
        : row.totalPrepayment;

      csv += `${period},${row.openingBalance.toFixed(2)},${emi.toFixed(2)},${principal.toFixed(2)},${interest.toFixed(2)},${prepayment.toFixed(2)},${row.closingBalance.toFixed(2)},${row.cumulativeInterest.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `home_loan_amortization_${this.isMonthlyView ? "monthly" : "yearly"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  showError(message) {
    document.getElementById("homeLoanResults").classList.add("hidden");
    document.getElementById("noHomeLoanResults").innerHTML = `
            <div class="text-center text-red-400 py-8">
                <div class="text-6xl mb-4">\u26A0\uFE0F</div>
                <p class="font-medium">${message}</p>
                <p class="text-sm mt-2 text-gray-500">Please check your inputs and try again.</p>
            </div>
        `;
    document.getElementById("noHomeLoanResults").classList.remove("hidden");
  }
}
