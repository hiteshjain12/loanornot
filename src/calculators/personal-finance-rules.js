function formatYearsMonthsDays(decimalYears) {
  if (!decimalYears || decimalYears < 0) return "";
  const years = Math.floor(decimalYears);
  const monthsFloat = (decimalYears - years) * 12;
  const months = Math.floor(monthsFloat);
  const days = Math.round((monthsFloat - months) * 30.4375);
  let str = "";
  if (years > 0) str += `${years} year${years !== 1 ? "s" : ""}`;
  if (months > 0)
    str += `${years > 0 ? " " : ""}${months} month${months !== 1 ? "s" : ""}`;
  if (days > 0)
    str += `${years > 0 || months > 0 ? " " : ""}${days} day${days !== 1 ? "s" : ""}`;
  if (!str) str = "0 days";
  return str;
}

function bindRule(inputId, resultId, computeFn) {
  const input = document.getElementById(inputId);
  const result = document.getElementById(resultId);
  if (!input || input._listenerAttached) return;

  input.addEventListener("input", () => {
    const val = parseFloat(input.value);
    result.innerHTML = val > 0 ? computeFn(val) : "";
  });
  input._listenerAttached = true;
  input.dispatchEvent(new Event("input"));
}

const GRAY = "<span class='text-gray-400'>Result:</span>";

export function initPersonalFinanceRules() {
  bindRule("rule72Rate", "rule72Result", (rate) => {
    const years = 72 / rate;
    return `${GRAY} It will take approximately ${formatYearsMonthsDays(years)} to double your money.`;
  });

  bindRule("rule70Rate", "rule70Result", (rate) => {
    const years = 70 / rate;
    return `${GRAY} Your money's value will halve in approximately ${formatYearsMonthsDays(years)} due to inflation.`;
  });

  bindRule("rule4pctExpense", "rule4pctResult", (expense) => {
    const corpus = expense * 25;
    return `${GRAY} You need a retirement corpus of ₹${corpus.toLocaleString()} to safely withdraw 4% per year.`;
  });

  bindRule("rule100Age", "rule100AgeResult", (age) => {
    if (age >= 100) return "";
    const equity = 100 - age;
    return `${GRAY} Equity: ${equity}%, Debt: ${Math.floor(age)}%`;
  });

  bindRule("rule502030Income", "rule502030Result", (income) => {
    const needs = income * 0.5;
    const wants = income * 0.3;
    const savings = income * 0.2;
    return `${GRAY} Needs: ₹${needs.toLocaleString()}, Wants: ₹${wants.toLocaleString()}, Savings: ₹${savings.toLocaleString()}`;
  });

  bindRule("rule3xEmergencyIncome", "rule3xEmergencyResult", (income) => {
    const minFund = income * 3;
    const safeFund = income * 6;
    return `${GRAY} Minimum Emergency Fund: ₹${minFund.toLocaleString()} (Safer: ₹${safeFund.toLocaleString()})`;
  });

  bindRule("rule40emiIncome", "rule40emiResult", (income) => {
    const maxEmi = income * 0.4;
    return `${GRAY} Maximum EMI should be ₹${maxEmi.toLocaleString()}`;
  });

  bindRule("ruleInsuranceIncome", "ruleInsuranceResult", (income) => {
    const sumAssured = income * 20;
    return `${GRAY} Recommended sum assured: ₹${sumAssured.toLocaleString()}`;
  });

  bindRule("rule144Rate", "rule144Result", (rate) => {
    const years = 144 / rate;
    return `${GRAY} Your SIP corpus will double in approximately ${formatYearsMonthsDays(years)}.`;
  });

  bindRule("ruleRevolvingRate", "ruleRevolvingResult", (rate) => {
    const i = rate / 100;
    const annual = (Math.pow(1 + i, 12) - 1) * 100;
    return `${GRAY} Compound annual cost: ${annual.toFixed(2)}%`;
  });
}
