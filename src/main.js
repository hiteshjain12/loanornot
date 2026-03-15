import "./styles.css";
import HomeLoanCalculator from "./calculators/home-loan.js";
import LoanCalculator from "./calculators/loan-vs-cash.js";
import EVVsICECalculator from "./calculators/ev-vs-ice.js";
import GoalCalculator from "./calculators/goal.js";
import { initPersonalFinanceRules } from "./calculators/personal-finance-rules.js";

document.addEventListener("DOMContentLoaded", () => {
  new LoanCalculator();
  const homeLoanInstance = new HomeLoanCalculator();
  const evIceInstance = new EVVsICECalculator();
  const goalInstance = new GoalCalculator();

  const tabs = document.querySelectorAll(".tab-btn");
  const calculators = document.querySelectorAll(".calculator-content");

  const switchTab = (tab) => {
    tabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    const tabId = tab.dataset.tab;
    localStorage.setItem("lastActiveTab", tabId);

    calculators.forEach((calc) => {
      calc.classList.toggle("hidden", calc.id !== tabId);
    });

    // Recalculate on tab switch for chart sizing
    if (tabId === "goalCalculator") {
      const form = document.getElementById("goalCalculatorForm");
      if (form?.checkValidity()) {
        setTimeout(() => goalInstance.calculate(), 100);
      }
    }
    if (tabId === "homeLoanCalculator") {
      const form = document.getElementById("homeLoanCalculatorForm");
      if (form?.checkValidity()) {
        setTimeout(() => homeLoanInstance.calculate(), 100);
      }
    }
    if (tabId === "evVsIceCalculator") {
      const form = document.getElementById("evVsIceCalculatorForm");
      if (form?.checkValidity()) {
        setTimeout(() => evIceInstance.calculate(), 100);
      }
    }
    if (tabId === "personalFinanceRules") {
      setTimeout(initPersonalFinanceRules, 0);
    }
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => switchTab(tab)));

  // Restore last active tab
  const lastTab = localStorage.getItem("lastActiveTab");
  const tabToActivate =
    document.querySelector(`.tab-btn[data-tab="${lastTab}"]`) || tabs[0];
  switchTab(tabToActivate);
});
