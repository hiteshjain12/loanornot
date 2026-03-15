import { formatCurrency } from "../utils/currency.js";
import { saveForm, loadForm } from "../utils/storage.js";
import {
  createSvg,
  createLine,
  createPath,
  createCircle,
  createText,
  drawAxes,
  drawGridLines,
  drawYAxisLabels,
} from "../utils/charts.js";

const STORAGE_KEY = "goalCalculatorData";

export default class GoalCalculator {
  constructor() {
    this.form = document.getElementById("goalCalculatorForm");
    this.loadSavedValues();
    this.initEventListeners();
  }

  saveFormValues() {
    saveForm(STORAGE_KEY, {
      goalName: document.getElementById("goalName").value,
      existingInvestment: document.getElementById("existingInvestment").value,
      costToday: document.getElementById("costToday").value,
      yearsToAchieve: document.getElementById("yearsToAchieve").value,
      expectedReturn: document.getElementById("expectedReturn").value,
      inflationRate: document.getElementById("inflationRate").value,
    });
  }

  loadSavedValues() {
    const formData = loadForm(STORAGE_KEY);
    if (!formData) return;

    document.getElementById("goalName").value = formData.goalName || "";
    document.getElementById("existingInvestment").value =
      formData.existingInvestment || "";
    document.getElementById("costToday").value = formData.costToday || "";
    document.getElementById("yearsToAchieve").value =
      formData.yearsToAchieve || "";
    document.getElementById("expectedReturn").value =
      formData.expectedReturn || "";
    document.getElementById("inflationRate").value =
      formData.inflationRate || "";

    if (this.form.checkValidity()) {
      setTimeout(() => {
        this.calculate();
      }, 100);
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
  }

  getInputValues() {
    return {
      goalName: document.getElementById("goalName").value.trim(),
      existingInvestment:
        parseFloat(document.getElementById("existingInvestment").value) || 0,
      costToday: parseFloat(document.getElementById("costToday").value),
      yearsToAchieve: parseFloat(
        document.getElementById("yearsToAchieve").value,
      ),
      expectedReturn:
        parseFloat(document.getElementById("expectedReturn").value) / 100,
      inflationRate:
        parseFloat(document.getElementById("inflationRate").value) / 100,
    };
  }

  validateInputs(inputs) {
    if (!inputs.goalName) {
      throw new Error("Goal name is required");
    }
    if (inputs.costToday <= 0) {
      throw new Error("Cost today must be positive");
    }
    if (inputs.yearsToAchieve <= 0) {
      throw new Error("Years to achieve must be positive");
    }
    if (inputs.expectedReturn < 0) {
      throw new Error("Expected return cannot be negative");
    }
    if (inputs.inflationRate < 0) {
      throw new Error("Inflation rate cannot be negative");
    }
  }

  calculateFutureCost(costToday, inflationRate, years) {
    return costToday * Math.pow(1 + inflationRate, years);
  }

  calculateFutureValueOfExisting(existingInvestment, returnRate, years) {
    return existingInvestment * Math.pow(1 + returnRate, years);
  }

  calculateMonthlyInvestment(futureValue, returnRate, years) {
    if (returnRate === 0) {
      return futureValue / (years * 12);
    }

    const monthlyRate = returnRate / 12;
    const totalMonths = years * 12;

    return (
      (futureValue * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );
  }

  calculateYearlyBreakdown(inputs, futureCost, monthlyInvestment) {
    const breakdown = [];
    let cumulativeInvestment = inputs.existingInvestment;
    let totalInvested = inputs.existingInvestment;

    for (let year = 1; year <= inputs.yearsToAchieve; year++) {
      const yearlyInvestment = monthlyInvestment * 12;
      totalInvested += yearlyInvestment;

      cumulativeInvestment =
        (cumulativeInvestment + yearlyInvestment) * (1 + inputs.expectedReturn);

      const investmentReturn = cumulativeInvestment - totalInvested;

      const percentageAchieved = (cumulativeInvestment / futureCost) * 100;

      breakdown.push({
        year,
        totalInvested,
        investmentValue: cumulativeInvestment,
        investmentReturn,
        percentageAchieved: Math.min(percentageAchieved, 100),
      });
    }

    return breakdown;
  }

  drawProgressChart(yearlyBreakdown, futureCost, goalName) {
    const chartContainer = document.getElementById("progressChart");
    chartContainer.innerHTML = "";

    const width = chartContainer.offsetWidth;
    const height = 320;
    const padding = { top: 40, right: 20, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const svg = createSvg(width, height);

    const maxValue = Math.max(
      futureCost,
      ...yearlyBreakdown.map((d) => d.investmentValue),
    );

    const xScale = (year) =>
      padding.left + (year / yearlyBreakdown.length) * chartWidth;
    const yScale = (value) =>
      padding.top + chartHeight - (value / maxValue) * chartHeight;

    // Grid lines
    drawGridLines(svg, padding, chartWidth, chartHeight);

    // Goal target line (dashed yellow)
    const goalY = yScale(futureCost);
    svg.appendChild(
      createLine(
        padding.left,
        goalY,
        padding.left + chartWidth,
        goalY,
        "#f59e0b",
        2,
        { dasharray: "5,5" },
      ),
    );

    // Investment progress line (green)
    let pathData = `M ${xScale(0)} ${yScale(yearlyBreakdown[0] ? yearlyBreakdown[0].totalInvested - (yearlyBreakdown[0].totalInvested - (yearlyBreakdown[0].investmentValue - yearlyBreakdown[0].investmentReturn)) : 0)}`;
    yearlyBreakdown.forEach((data, index) => {
      pathData += ` L ${xScale(index + 1)} ${yScale(data.investmentValue)}`;
    });
    svg.appendChild(createPath(pathData, "#10b981", 3));

    // Data point circles
    yearlyBreakdown.forEach((data, index) => {
      svg.appendChild(
        createCircle(
          xScale(index + 1),
          yScale(data.investmentValue),
          4,
          "#10b981",
          { stroke: "#ffffff", strokeWidth: 2 },
        ),
      );
    });

    // Axes
    drawAxes(svg, padding, chartWidth, chartHeight);

    // Year labels
    for (let i = 0; i <= yearlyBreakdown.length; i++) {
      svg.appendChild(
        createText(
          xScale(i),
          padding.top + chartHeight + 20,
          `Y${i}`,
          "#9ca3af",
          12,
          { anchor: "middle" },
        ),
      );
    }

    // Value labels
    drawYAxisLabels(svg, padding, chartHeight, maxValue, (v) =>
      formatCurrency(v).replace("₹", "₹"),
    );

    // Title
    svg.appendChild(
      createText(
        width / 2,
        25,
        `${goalName} - Investment Progress`,
        "#ffffff",
        14,
        { anchor: "middle", weight: "bold" },
      ),
    );

    // Legend
    // Investment Value (green solid)
    svg.appendChild(
      createLine(
        padding.left,
        height - 35,
        padding.left + 20,
        height - 35,
        "#10b981",
        3,
      ),
    );
    svg.appendChild(
      createText(
        padding.left + 25,
        height - 31,
        "Investment Value",
        "#9ca3af",
        12,
      ),
    );

    // Goal Target (yellow dashed)
    svg.appendChild(
      createLine(
        padding.left + 150,
        height - 35,
        padding.left + 170,
        height - 35,
        "#f59e0b",
        2,
        { dasharray: "5,5" },
      ),
    );
    svg.appendChild(
      createText(padding.left + 175, height - 31, "Goal Target", "#9ca3af", 12),
    );

    chartContainer.appendChild(svg);
  }

  calculate() {
    try {
      const inputs = this.getInputValues();
      this.validateInputs(inputs);

      const futureCost = this.calculateFutureCost(
        inputs.costToday,
        inputs.inflationRate,
        inputs.yearsToAchieve,
      );

      const futureValueOfExisting = this.calculateFutureValueOfExisting(
        inputs.existingInvestment,
        inputs.expectedReturn,
        inputs.yearsToAchieve,
      );

      const remainingAmountNeeded = Math.max(
        0,
        futureCost - futureValueOfExisting,
      );

      const monthlyInvestment =
        remainingAmountNeeded > 0
          ? this.calculateMonthlyInvestment(
              remainingAmountNeeded,
              inputs.expectedReturn,
              inputs.yearsToAchieve,
            )
          : 0;

      const yearlyBreakdown = this.calculateYearlyBreakdown(
        inputs,
        futureCost,
        monthlyInvestment,
      );

      this.displayResults({
        inputs,
        futureCost,
        monthlyInvestment,
        yearlyBreakdown,
        futureValueOfExisting,
        remainingAmountNeeded,
      });
    } catch (error) {
      this.showError(error.message);
    }
  }

  displayResults(data) {
    const {
      inputs,
      futureCost,
      monthlyInvestment,
      yearlyBreakdown,
      futureValueOfExisting,
    } = data;

    document.getElementById("goalResults").classList.remove("hidden");
    document.getElementById("goalResults2").classList.remove("hidden");
    document.getElementById("goalResults3").classList.remove("hidden");
    document.getElementById("noGoalResults").classList.add("hidden");

    // Future cost
    document.getElementById("futureCost").innerHTML = `
            <span class="text-2xl font-bold text-yellow-400">${formatCurrency(futureCost)}</span>
            <p class="text-sm text-gray-400 mt-1">
                Today's cost: ${formatCurrency(inputs.costToday)} |
                Inflation impact: ${formatCurrency(futureCost - inputs.costToday)}
            </p>
        `;

    // Monthly investment
    const monthlyInvestmentElement =
      document.getElementById("monthlyInvestment");
    if (monthlyInvestment > 0) {
      monthlyInvestmentElement.innerHTML = `
                <span class="text-2xl font-bold text-emerald-400">${formatCurrency(monthlyInvestment)}</span>
                <p class="text-sm text-gray-400 mt-1">
                    Total monthly: ${formatCurrency(monthlyInvestment)} |
                    Existing investment will grow to: ${formatCurrency(futureValueOfExisting)}
                </p>
            `;
    } else {
      monthlyInvestmentElement.innerHTML = `
                <span class="text-2xl font-bold text-emerald-400">₹0</span>
                <p class="text-sm text-emerald-400 mt-1">
                    🎉 Your existing investment of ${formatCurrency(inputs.existingInvestment)}
                    will grow to ${formatCurrency(futureValueOfExisting)}, which exceeds your goal!
                </p>
            `;
    }

    // Yearly breakdown table
    const tableBody = document.getElementById("goalYearlyBreakdown");
    tableBody.innerHTML = "";

    yearlyBreakdown.forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-gray-700 hover:bg-gray-800/30";

      const percentageClass =
        row.percentageAchieved >= 100
          ? "text-emerald-400"
          : row.percentageAchieved >= 75
            ? "text-yellow-400"
            : "text-gray-300";

      tr.innerHTML = `
                <td class="py-3 text-gray-300">${row.year}</td>
                <td class="py-3 text-right text-gray-300">${formatCurrency(row.totalInvested)}</td>
                <td class="py-3 text-right text-emerald-400">${formatCurrency(row.investmentReturn)}</td>
                <td class="py-3 text-right text-blue-400 font-medium">${formatCurrency(row.investmentValue)}</td>
                <td class="py-3 text-right ${percentageClass} font-medium">
                    ${row.percentageAchieved.toFixed(1)}%
                    ${row.percentageAchieved >= 100 ? " 🎯" : ""}
                </td>
            `;
      tableBody.appendChild(tr);
    });

    // Draw progress chart
    this.drawProgressChart(yearlyBreakdown, futureCost, inputs.goalName);
  }

  showError(message) {
    document.getElementById("goalResults").classList.add("hidden");
    console.error("Goal Calculator Error:", message);
  }
}
