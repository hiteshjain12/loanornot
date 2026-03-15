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

const STORAGE_KEY = "evVsIceCalculatorData";

const FIELD_IDS = [
  "evPurchasePrice",
  "evResaleValue",
  "evEfficiency",
  "electricityCost",
  "evMaintenanceCost",
  "evInsuranceCost",
  "evIncentives",
  "icePurchasePrice",
  "iceResaleValue",
  "fuelEfficiency",
  "fuelCost",
  "iceMaintenanceCost",
  "iceInsuranceCost",
  "averageDistance",
  "ownershipPeriod",
];

export default class EVVsICECalculator {
  constructor() {
    this.form = document.getElementById("evVsIceCalculatorForm");
    this.loadSavedValues();
    this.initEventListeners();
  }

  saveFormValues() {
    const formData = {};
    FIELD_IDS.forEach((id) => {
      formData[id] = document.getElementById(id).value;
    });
    saveForm(STORAGE_KEY, formData);
  }

  loadSavedValues() {
    const formData = loadForm(STORAGE_KEY);
    if (!formData) return;

    FIELD_IDS.forEach((id) => {
      document.getElementById(id).value = formData[id] || "";
    });

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
          setTimeout(() => {
            this.calculate();
          }, 100);
        }
      });
    });
  }

  calculate() {
    try {
      const inputs = this.getInputValues();
      this.validateInputs(inputs);

      const evTCO = this.calculateEVTCO(inputs);
      const iceTCO = this.calculateICETCO(inputs);
      const yearlyComparison = this.calculateYearlyComparison(inputs);

      this.displayResults(evTCO, iceTCO, yearlyComparison, inputs);
    } catch (error) {
      this.showError(error.message);
    }
  }

  getInputValues() {
    return {
      evPurchasePrice: parseFloat(
        document.getElementById("evPurchasePrice").value,
      ),
      evResaleValue:
        (parseFloat(document.getElementById("evResaleValue").value) || 0) / 100,
      evEfficiency: parseFloat(document.getElementById("evEfficiency").value),
      electricityCost: parseFloat(
        document.getElementById("electricityCost").value,
      ),
      evMaintenanceCost: parseFloat(
        document.getElementById("evMaintenanceCost").value,
      ),
      evInsuranceCost: parseFloat(
        document.getElementById("evInsuranceCost").value,
      ),
      evIncentives:
        parseFloat(document.getElementById("evIncentives").value) || 0,
      icePurchasePrice: parseFloat(
        document.getElementById("icePurchasePrice").value,
      ),
      iceResaleValue:
        (parseFloat(document.getElementById("iceResaleValue").value) || 0) /
        100,
      fuelEfficiency: parseFloat(
        document.getElementById("fuelEfficiency").value,
      ),
      fuelCost: parseFloat(document.getElementById("fuelCost").value),
      iceMaintenanceCost: parseFloat(
        document.getElementById("iceMaintenanceCost").value,
      ),
      iceInsuranceCost: parseFloat(
        document.getElementById("iceInsuranceCost").value,
      ),
      averageDistance: parseFloat(
        document.getElementById("averageDistance").value,
      ),
      ownershipPeriod: parseFloat(
        document.getElementById("ownershipPeriod").value,
      ),
    };
  }

  validateInputs(inputs) {
    if (inputs.evPurchasePrice <= 0 || inputs.icePurchasePrice <= 0) {
      throw new Error("Purchase prices must be positive");
    }
    if (inputs.averageDistance <= 0 || inputs.ownershipPeriod <= 0) {
      throw new Error("Distance and ownership period must be positive");
    }
    if (inputs.evEfficiency <= 0 || inputs.fuelEfficiency <= 0) {
      throw new Error("Efficiency values must be positive");
    }
  }

  calculateEVTCO(inputs) {
    const totalDistance = inputs.averageDistance * inputs.ownershipPeriod;
    const totalEnergyNeeded = totalDistance / inputs.evEfficiency; // kWh
    const totalFuelCost = totalEnergyNeeded * inputs.electricityCost;
    const totalMaintenance = inputs.evMaintenanceCost * inputs.ownershipPeriod;
    const totalInsurance = inputs.evInsuranceCost * inputs.ownershipPeriod;
    const resaleValue = inputs.evPurchasePrice * inputs.evResaleValue;

    const totalCost =
      inputs.evPurchasePrice -
      inputs.evIncentives +
      totalFuelCost +
      totalMaintenance +
      totalInsurance -
      resaleValue;

    return {
      purchasePrice: inputs.evPurchasePrice,
      incentives: inputs.evIncentives,
      totalFuelCost,
      totalMaintenance,
      totalInsurance,
      resaleValue,
      totalCost,
    };
  }

  calculateICETCO(inputs) {
    const totalDistance = inputs.averageDistance * inputs.ownershipPeriod;
    const totalFuelNeeded = totalDistance / inputs.fuelEfficiency; // liters
    const totalFuelCost = totalFuelNeeded * inputs.fuelCost;
    const totalMaintenance = inputs.iceMaintenanceCost * inputs.ownershipPeriod;
    const totalInsurance = inputs.iceInsuranceCost * inputs.ownershipPeriod;
    const resaleValue = inputs.icePurchasePrice * inputs.iceResaleValue;

    const totalCost =
      inputs.icePurchasePrice +
      totalFuelCost +
      totalMaintenance +
      totalInsurance -
      resaleValue;

    return {
      purchasePrice: inputs.icePurchasePrice,
      totalFuelCost,
      totalMaintenance,
      totalInsurance,
      resaleValue,
      totalCost,
    };
  }

  calculateYearlyComparison(inputs) {
    const yearlyData = [];
    let evCumulativeCost = inputs.evPurchasePrice - inputs.evIncentives;
    let iceCumulativeCost = inputs.icePurchasePrice;

    const evYearlyFuelCost =
      (inputs.averageDistance / inputs.evEfficiency) * inputs.electricityCost;
    const iceYearlyFuelCost =
      (inputs.averageDistance / inputs.fuelEfficiency) * inputs.fuelCost;

    for (let year = 1; year <= inputs.ownershipPeriod; year++) {
      evCumulativeCost +=
        evYearlyFuelCost + inputs.evMaintenanceCost + inputs.evInsuranceCost;
      iceCumulativeCost +=
        iceYearlyFuelCost + inputs.iceMaintenanceCost + inputs.iceInsuranceCost;

      // Subtract resale value in the final year
      const evCostWithResale =
        year === inputs.ownershipPeriod
          ? evCumulativeCost - inputs.evPurchasePrice * inputs.evResaleValue
          : evCumulativeCost;
      const iceCostWithResale =
        year === inputs.ownershipPeriod
          ? iceCumulativeCost - inputs.icePurchasePrice * inputs.iceResaleValue
          : iceCumulativeCost;

      const breakEven = evCostWithResale <= iceCostWithResale;

      yearlyData.push({
        year,
        evCost: evCostWithResale,
        iceCost: iceCostWithResale,
        breakEven,
      });
    }

    return yearlyData;
  }

  calculateBreakevenPoint(inputs) {
    const evYearlyFuelCost =
      (inputs.averageDistance / inputs.evEfficiency) * inputs.electricityCost;
    const iceYearlyFuelCost =
      (inputs.averageDistance / inputs.fuelEfficiency) * inputs.fuelCost;
    const evYearlyOperatingCost =
      evYearlyFuelCost + inputs.evMaintenanceCost + inputs.evInsuranceCost;
    const iceYearlyOperatingCost =
      iceYearlyFuelCost + inputs.iceMaintenanceCost + inputs.iceInsuranceCost;
    const evInitialCost = inputs.evPurchasePrice - inputs.evIncentives;
    const iceInitialCost = inputs.icePurchasePrice;

    // EV is always cheaper
    if (
      evInitialCost <= iceInitialCost &&
      evYearlyOperatingCost <= iceYearlyOperatingCost
    ) {
      return "ev_always_cheaper";
    }

    // Calculate when cumulative costs become equal
    const initialCostDiff = evInitialCost - iceInitialCost;
    const yearlyOperatingDiff = iceYearlyOperatingCost - evYearlyOperatingCost;

    if (yearlyOperatingDiff <= 0) {
      // ICE is always cheaper
      return null;
    }

    const breakevenYear = initialCostDiff / yearlyOperatingDiff;
    return breakevenYear > 0 ? breakevenYear : null;
  }

  drawChart(yearlyComparison, breakevenYear) {
    const chartContainer = document.getElementById("costChart");
    chartContainer.innerHTML = "";

    const width = chartContainer.offsetWidth;
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 40, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const svg = createSvg(width, height);

    // Find max cost for scaling
    const maxCost = Math.max(
      ...yearlyComparison.map((d) => Math.max(d.evCost, d.iceCost)),
    );

    // Create scales
    const xScale = (year) =>
      padding.left + (year - 1) * (chartWidth / (yearlyComparison.length - 1));
    const yScale = (cost) =>
      padding.top + chartHeight - (cost / maxCost) * chartHeight;

    // Draw grid lines
    drawGridLines(svg, padding, chartWidth, chartHeight);

    // Draw EV line (blue)
    let evPathData = `M ${xScale(1)} ${yScale(yearlyComparison[0].evCost)}`;
    for (let i = 1; i < yearlyComparison.length; i++) {
      evPathData += ` L ${xScale(i + 1)} ${yScale(yearlyComparison[i].evCost)}`;
    }
    svg.appendChild(createPath(evPathData, "#3b82f6", 3));

    // Draw ICE line (red)
    let icePathData = `M ${xScale(1)} ${yScale(yearlyComparison[0].iceCost)}`;
    for (let i = 1; i < yearlyComparison.length; i++) {
      icePathData += ` L ${xScale(i + 1)} ${yScale(yearlyComparison[i].iceCost)}`;
    }
    svg.appendChild(createPath(icePathData, "#ef4444", 3));

    // Draw breakeven point if it exists and is within the ownership period
    if (breakevenYear && breakevenYear <= yearlyComparison.length) {
      const x =
        padding.left +
        (breakevenYear - 1) * (chartWidth / (yearlyComparison.length - 1));

      // Vertical dashed line
      svg.appendChild(
        createLine(x, padding.top, x, padding.top + chartHeight, "#10b981", 2, {
          dasharray: "5,5",
        }),
      );

      // Breakeven point marker
      const breakevenIndex = Math.floor(breakevenYear) - 1;
      if (breakevenIndex >= 0 && breakevenIndex < yearlyComparison.length) {
        svg.appendChild(
          createCircle(
            x,
            yScale(yearlyComparison[breakevenIndex].evCost),
            6,
            "#10b981",
          ),
        );
      }
    }

    // Draw axes
    drawAxes(svg, padding, chartWidth, chartHeight);

    // Add year labels
    for (let i = 0; i < yearlyComparison.length; i++) {
      svg.appendChild(
        createText(
          xScale(i + 1),
          padding.top + chartHeight + 20,
          `Y${i + 1}`,
          "#9ca3af",
          12,
          { anchor: "middle" },
        ),
      );
    }

    // Add cost labels
    drawYAxisLabels(svg, padding, chartHeight, maxCost, formatCurrency);

    chartContainer.appendChild(svg);
  }

  displayResults(evTCO, iceTCO, yearlyComparison, inputs) {
    document.getElementById("evIceResults").classList.remove("hidden");
    document.getElementById("noEvIceResults").classList.add("hidden");

    // Calculate breakeven point
    const breakevenYear = this.calculateBreakevenPoint(inputs);

    // Helper to format years and months
    function formatYearsMonths(decimalYears) {
      if (!decimalYears || decimalYears < 0) return null;
      const years = Math.floor(decimalYears);
      const months = Math.round((decimalYears - years) * 12);
      let str = "";
      if (years > 0) str += `${years} year${years !== 1 ? "s" : ""}`;
      if (months > 0)
        str += `${years > 0 ? " " : ""}${months} month${months !== 1 ? "s" : ""}`;
      if (!str) str = "0 months";
      return str;
    }
    const breakevenYearMonth = formatYearsMonths(breakevenYear);

    // Update breakeven analysis
    const breakevenInfo = document.getElementById("breakevenInfo");
    if (breakevenYear === "ev_always_cheaper") {
      breakevenInfo.innerHTML = `
                <div class="text-green-400 text-xl font-semibold mb-2">✅ EV Always Cheaper</div>
                <p class="text-white">EV is more cost-effective than ICE from day 1.</p>
                <p class="text-gray-300 text-sm mt-2">Both the upfront and running costs of EV are lower than ICE for your scenario.</p>
            `;
    } else if (breakevenYear && breakevenYear <= inputs.ownershipPeriod) {
      breakevenInfo.innerHTML = `
                <div class="text-green-400 text-xl font-semibold mb-2">🎯 Breakeven Point Reached!</div>
                <p class="text-white">EV becomes cost-effective after <strong>${breakevenYearMonth}</strong></p>
                <p class="text-gray-300 text-sm mt-2">Operating costs savings will compensate for the higher upfront cost</p>
            `;
    } else if (breakevenYear && breakevenYear > inputs.ownershipPeriod) {
      breakevenInfo.innerHTML = `
                <div class="text-yellow-400 text-xl font-semibold mb-2">⏳ Breakeven Beyond Ownership</div>
                <p class="text-white">EV would become cost-effective after <strong>${breakevenYearMonth}</strong></p>
                <p class="text-gray-300 text-sm mt-2">Consider extending ownership period or current conditions favor ICE</p>
            `;
    } else {
      breakevenInfo.innerHTML = `
                <div class="text-red-400 text-xl font-semibold mb-2">❌ No Breakeven Point</div>
                <p class="text-white">ICE remains more cost-effective throughout the ownership period</p>
                <p class="text-gray-300 text-sm mt-2">Current fuel/energy costs and efficiency favor ICE vehicles</p>
            `;
    }

    // Update EV breakdown
    document.getElementById("evPurchasePriceDisplay").textContent =
      formatCurrency(evTCO.purchasePrice);
    document.getElementById("evIncentivesDisplay").textContent =
      `-${formatCurrency(evTCO.incentives)}`;
    document.getElementById("evFuelCostDisplay").textContent = formatCurrency(
      evTCO.totalFuelCost,
    );
    document.getElementById("evMaintenanceDisplay").textContent =
      formatCurrency(evTCO.totalMaintenance);
    document.getElementById("evInsuranceDisplay").textContent = formatCurrency(
      evTCO.totalInsurance,
    );
    document.getElementById("evResaleDisplay").textContent =
      `-${formatCurrency(evTCO.resaleValue)}`;
    document.getElementById("evTotalCost").textContent = formatCurrency(
      evTCO.totalCost,
    );

    // Update ICE breakdown
    document.getElementById("icePurchasePriceDisplay").textContent =
      formatCurrency(iceTCO.purchasePrice);
    document.getElementById("iceFuelCostDisplay").textContent = formatCurrency(
      iceTCO.totalFuelCost,
    );
    document.getElementById("iceMaintenanceDisplay").textContent =
      formatCurrency(iceTCO.totalMaintenance);
    document.getElementById("iceInsuranceDisplay").textContent = formatCurrency(
      iceTCO.totalInsurance,
    );
    document.getElementById("iceResaleDisplay").textContent =
      `-${formatCurrency(iceTCO.resaleValue)}`;
    document.getElementById("iceTotalCost").textContent = formatCurrency(
      iceTCO.totalCost,
    );

    // Update yearly comparison table
    const tableBody = document.getElementById("yearlyComparisonTable");
    tableBody.innerHTML = "";
    yearlyComparison.forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-gray-800";
      tr.innerHTML = `
                <td class="py-2 text-gray-300">${row.year}</td>
                <td class="py-2 text-right text-gray-300">${formatCurrency(row.evCost)}</td>
                <td class="py-2 text-right text-gray-300">${formatCurrency(row.iceCost)}</td>
                <td class="py-2 text-right ${row.breakEven ? "text-green-400" : "text-red-400"}">
                    ${row.breakEven ? "✅ Yes" : "❌ No"}
                </td>
            `;
      tableBody.appendChild(tr);
    });

    // Draw the chart
    this.drawChart(yearlyComparison, breakevenYear);

    // Update recommendation and savings
    const savings = iceTCO.totalCost - evTCO.totalCost;
    const recommendationDiv = document.getElementById("evIceRecommendation");
    const recommendationText = document.getElementById(
      "evIceRecommendationText",
    );
    const savingsElement = document.getElementById("evIceSavings");
    const savingsExplanation = document.getElementById("savingsExplanation");

    if (savings > 0) {
      recommendationDiv.className =
        "mb-6 p-4 rounded-lg backdrop-blur-sm bg-emerald-900/30 border border-emerald-500/50";
      recommendationText.innerHTML = `<span class="text-emerald-400">⚡ Choose EV! It's more cost-effective.</span>`;
      savingsElement.textContent = `+${formatCurrency(savings)}`;
      savingsElement.className = "font-bold text-xl text-emerald-400";
      savingsExplanation.textContent = `EV saves you ${formatCurrency(savings)} over ${inputs.ownershipPeriod} years compared to ICE.`;
      // Show battery caveat only if EV TCO is less
      if (evTCO.totalCost < iceTCO.totalCost) {
        savingsExplanation.innerHTML += `<div class='text-yellow-400 text-sm mt-4 italic'>Heads up: We haven't included battery replacement costs in this calculation.<br>That's because most EVs come with a battery warranty of 7–10 years or 1.5–2 lakh km, which covers most users during typical ownership. Plus, battery prices are steadily falling, and by the time a replacement is needed, the cost may be much lower - and possibly similar to major repairs that ICE vehicles often need later in life.</div>`;
      }
    } else {
      recommendationDiv.className =
        "mb-6 p-4 rounded-lg backdrop-blur-sm bg-blue-900/30 border border-blue-500/50";
      recommendationText.innerHTML = `<span class="text-blue-400">⛽ ICE is more cost-effective for your usage.</span>`;
      savingsElement.textContent = formatCurrency(savings);
      savingsElement.className = "font-bold text-xl text-blue-400";
      savingsExplanation.textContent = `ICE costs ${formatCurrency(Math.abs(savings))} less than EV over ${inputs.ownershipPeriod} years.`;
    }
  }

  showError(message) {
    document.getElementById("evIceResults").classList.add("hidden");
    document.getElementById("noEvIceResults").innerHTML = `
            <div class="text-center text-red-400 py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="font-medium">${message}</p>
                <p class="text-sm mt-2 text-gray-500">Please check your inputs and try again.</p>
            </div>
        `;
    document.getElementById("noEvIceResults").classList.remove("hidden");
  }
}
