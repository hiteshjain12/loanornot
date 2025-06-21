class LoanCalculator {
    constructor() {
        this.form = document.getElementById('calculatorForm');
        this.matchCheckbox = document.getElementById('matchPurchaseAmount');
        this.purchaseAmountInput = document.getElementById('purchaseAmount');
        this.availableCashInput = document.getElementById('availableCash');
        this.cashWarning = document.getElementById('cashWarning');
        this.loadSavedValues(); // Load saved values first
        this.initEventListeners();
    }

    // Add method to save form values
    saveFormValues() {
        try {
            const formData = {
                purchaseAmount: this.purchaseAmountInput.value,
                availableCash: this.availableCashInput.value,
                matchPurchaseAmount: this.matchCheckbox.checked,
                loanRate: document.getElementById('loanRate').value,
                investmentReturn: document.getElementById('investmentReturn').value,
                taxRate: document.getElementById('taxRate').value,
                compoundingFrequency: document.getElementById('compoundingFrequency').value,
                timePeriod: document.getElementById('timePeriod').value,
                timeUnit: document.getElementById('timeUnit').value
            };
            localStorage.setItem('loanCalculatorData', JSON.stringify(formData));
        } catch (error) {
            console.warn('Error saving form values:', error);
        }
    }

    // Add method to load saved values
    loadSavedValues() {
        const savedData = localStorage.getItem('loanCalculatorData');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                
                // Restore values to form elements
                this.purchaseAmountInput.value = formData.purchaseAmount || '';
                this.availableCashInput.value = formData.availableCash || '';
                this.matchCheckbox.checked = formData.matchPurchaseAmount;
                document.getElementById('loanRate').value = formData.loanRate || '';
                document.getElementById('investmentReturn').value = formData.investmentReturn || '';
                document.getElementById('taxRate').value = formData.taxRate || '';
                document.getElementById('compoundingFrequency').value = formData.compoundingFrequency || '1';
                document.getElementById('timePeriod').value = formData.timePeriod || '';
                document.getElementById('timeUnit').value = formData.timeUnit || 'years';

                // Handle the available cash input state based on checkbox
                this.availableCashInput.disabled = this.matchCheckbox.checked;
                if (this.matchCheckbox.checked) {
                    this.availableCashInput.value = this.purchaseAmountInput.value;
                }

                // Trigger calculation if we have valid values
                if (this.form.checkValidity()) {
                    this.calculate();
                }
            } catch (error) {
                console.warn('Error loading saved values:', error);
                localStorage.removeItem('loanCalculatorData');
            }
        }
    }

    initEventListeners() {
        // Real-time calculation and save on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.id === 'purchaseAmount') {
                    this.handlePurchaseAmountChange();
                }
                // Always save values on change
                this.saveFormValues();
                // Calculate if form is valid
                if (this.form.checkValidity()) {
                    this.calculate();
                }
            });

            // Also save on blur (when input loses focus)
            input.addEventListener('blur', () => {
                this.saveFormValues();
            });
        });

        // Handle checkbox change
        this.matchCheckbox.addEventListener('change', () => {
            this.handleCheckboxChange();
            this.saveFormValues();
        });

        // Initial setup
        this.handleCheckboxChange();
        if (this.form.checkValidity()) {
            this.calculate();
        }
    }

    handleCheckboxChange() {
        if (this.matchCheckbox.checked) {
            this.availableCashInput.value = this.purchaseAmountInput.value;
            this.availableCashInput.disabled = true;
            this.cashWarning.classList.add('hidden');
        } else {
            this.availableCashInput.disabled = false;
            this.checkCashWarning();
        }
        if (this.form.checkValidity()) {
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
            this.cashWarning.classList.remove('hidden');
        } else {
            this.cashWarning.classList.add('hidden');
        }
    }

    getInputValues() {
        const purchaseAmount = parseFloat(document.getElementById('purchaseAmount').value);
        const availableCash = parseFloat(document.getElementById('availableCash').value);
        const loanRate = parseFloat(document.getElementById('loanRate').value) / 100;
        const investmentReturn = parseFloat(document.getElementById('investmentReturn').value) / 100;
        const taxRate = parseFloat(document.getElementById('taxRate').value || 0) / 100;
        const compoundingFrequency = parseInt(document.getElementById('compoundingFrequency').value);
        const timePeriod = parseFloat(document.getElementById('timePeriod').value);
        const timeUnit = document.getElementById('timeUnit').value;

        // Convert time to years
        const timeInYears = timeUnit === 'months' ? timePeriod / 12 : timePeriod;

        return {
            purchaseAmount,
            availableCash,
            loanRate,
            investmentReturn,
            taxRate,
            compoundingFrequency,
            timeInYears,
            timePeriod,
            timeUnit
        };
    }

    validateInputs(inputs) {
        const { purchaseAmount, availableCash } = inputs;
        
        if (purchaseAmount <= 0) {
            throw new Error('Purchase amount must be positive');
        }
        
        if (availableCash < 0) {
            throw new Error('Available cash cannot be negative');
        }
    }

    calculateCompoundInterest(principal, rate, time, compoundingFrequency = 1) {
        // A = P(1 + r/n)^(nt)
        // where: A = final amount, P = principal, r = annual rate, n = compounding frequency, t = time in years
        return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time);
    }

    calculateInvestmentWithTax(principal, rate, time, compoundingFrequency, taxRate) {
        // Calculate total investment value
        const totalValue = this.calculateCompoundInterest(principal, rate, time, compoundingFrequency);
        
        // Calculate gains
        const gains = totalValue - principal;
        
        // Calculate tax on gains
        const taxOnGains = gains * taxRate;
        
        // Return total value after tax
        return totalValue - taxOnGains;
    }

    calculateLoanInterest(principal, rate, time) {
        // Simple interest calculation for total interest paid
        // In reality, you'd use loan payment formulas, but this gives a good approximation
        const monthlyRate = rate / 12;
        const numberOfPayments = time * 12;
        const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                              (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        const totalPaid = monthlyPayment * numberOfPayments;
        return totalPaid - principal;
    }

    calculate() {
        try {
            const inputs = this.getInputValues();
            this.validateInputs(inputs);

            const { purchaseAmount, availableCash, loanRate, investmentReturn, taxRate, compoundingFrequency, timeInYears } = inputs;

            // Option 1: Pay with Available Cash + Take Loan for Remainder
            const loanAmountNeeded = Math.max(0, purchaseAmount - availableCash);
            const remainingCashAfterPurchase = Math.max(0, availableCash - purchaseAmount);
            const cashInvestmentValueAfterTax = this.calculateInvestmentWithTax(
                remainingCashAfterPurchase, 
                investmentReturn, 
                timeInYears,
                compoundingFrequency,
                taxRate
            );
            const cashInvestmentReturns = cashInvestmentValueAfterTax - remainingCashAfterPurchase;
            const totalInterestForRemainder = loanAmountNeeded > 0 ? this.calculateLoanInterest(loanAmountNeeded, loanRate, timeInYears) : 0;
            // Net position = remaining cash after tax and growth - loan costs
            const cashNetPosition = cashInvestmentValueAfterTax - (loanAmountNeeded + totalInterestForRemainder);

            // Option 2: Take Full Loan and Invest All Cash
            const fullLoanAmount = purchaseAmount;
            const totalInterest = this.calculateLoanInterest(fullLoanAmount, loanRate, timeInYears);
            const loanInvestmentValueAfterTax = this.calculateInvestmentWithTax(
                availableCash, 
                investmentReturn, 
                timeInYears,
                compoundingFrequency,
                taxRate
            );
            const loanInvestmentReturns = loanInvestmentValueAfterTax - availableCash;
            // Net position = investment value after tax - loan total cost
            const totalLoanCost = fullLoanAmount + totalInterest;
            const loanNetPosition = loanInvestmentValueAfterTax - totalLoanCost;

            // Net benefit calculation - difference between the two net positions
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
                totalInterestForRemainder
            });

        } catch (error) {
            this.showError(error.message);
        }
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            return '₹0.00';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
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
            totalInterestForRemainder
        } = data;

        // Show results section
        document.getElementById('results').classList.remove('hidden');
        document.getElementById('noResults').classList.add('hidden');

        // Update recommendation
        const recommendationDiv = document.getElementById('recommendation');
        const recommendationText = document.getElementById('recommendationText');
        
        if (netBenefit > 0) {
            recommendationDiv.className = 'mb-6 p-4 rounded-lg backdrop-blur-sm bg-emerald-900/30 border border-emerald-500/50';
            recommendationText.innerHTML = `<span class="text-emerald-400">💡 Take a full loan and invest your cash!</span>`;
        } else {
            recommendationDiv.className = 'mb-6 p-4 rounded-lg backdrop-blur-sm bg-blue-900/30 border border-blue-500/50';
            recommendationText.innerHTML = `<span class="text-blue-400">💡 Use available cash${loanAmountNeeded > 0 ? ' with a smaller loan' : ''}!</span>`;
        }

        // Update cash + partial loan option details
        document.getElementById('cashPayment').textContent = this.formatCurrency(Math.min(availableCash, purchaseAmount));
        
        // Show/hide and update partial loan details
        const partialLoanDetails = document.getElementById('partialLoanDetails');
        const remainingCashSection = document.getElementById('remainingCashSection');

        if (loanAmountNeeded > 0) {
            // Show partial loan details
            partialLoanDetails.classList.remove('hidden');
            document.getElementById('partialLoanAmount').textContent = this.formatCurrency(loanAmountNeeded);
            document.getElementById('partialLoanInterest').textContent = this.formatCurrency(totalInterestForRemainder);
            
            // Hide remaining cash section if no cash left to invest
            if (remainingCashAfterPurchase <= 0) {
                remainingCashSection.classList.add('hidden');
            } else {
                remainingCashSection.classList.remove('hidden');
            }
        } else {
            // Hide partial loan details and show remaining cash section
            partialLoanDetails.classList.add('hidden');
            remainingCashSection.classList.remove('hidden');
        }

        // Update remaining cash details if visible
        if (remainingCashAfterPurchase > 0) {
            document.getElementById('remainingCash').textContent = this.formatCurrency(remainingCashAfterPurchase);
            document.getElementById('cashInvestmentReturns').textContent = this.formatCurrency(cashInvestmentReturns);
        }
        
        document.getElementById('cashNetPosition').textContent = this.formatCurrency(cashNetPosition);

        // Update full loan option details
        document.getElementById('loanAmount').textContent = this.formatCurrency(loanAmount);
        document.getElementById('totalInterest').textContent = this.formatCurrency(totalInterest);
        document.getElementById('fullLoanCashToInvest').textContent = this.formatCurrency(availableCash);
        document.getElementById('loanInvestmentReturns').textContent = this.formatCurrency(loanInvestmentReturns);
        document.getElementById('loanNetPosition').textContent = this.formatCurrency(loanNetPosition);

        // Update net benefit
        const netBenefitElement = document.getElementById('netBenefit');
        const benefitExplanationElement = document.getElementById('benefitExplanation');
        
        if (netBenefit > 0) {
            netBenefitElement.textContent = `+${this.formatCurrency(netBenefit)}`;
            netBenefitElement.className = 'font-bold text-xl text-emerald-400';
            benefitExplanationElement.textContent = `Taking a full loan and investing your ${this.formatCurrency(availableCash)} cash provides ${this.formatCurrency(netBenefit)} more after ${inputs.timePeriod} ${inputs.timeUnit}.`;
        } else {
            netBenefitElement.textContent = this.formatCurrency(netBenefit);
            netBenefitElement.className = 'font-bold text-xl text-blue-400';
            const explanation = loanAmountNeeded > 0 
                ? `Using ${this.formatCurrency(availableCash)} cash with a ${this.formatCurrency(loanAmountNeeded)} loan saves you ${this.formatCurrency(Math.abs(netBenefit))}`
                : `Using only cash saves you ${this.formatCurrency(Math.abs(netBenefit))}`;
            benefitExplanationElement.textContent = `${explanation} after ${inputs.timePeriod} ${inputs.timeUnit}.`;
        }

        // Update net benefit section border
        const netBenefitSection = netBenefitElement.closest('.p-4');
        if (netBenefit > 0) {
            netBenefitSection.className = 'p-4 rounded-lg border border-emerald-500/50 bg-emerald-900/30 backdrop-blur-sm';
        } else {
            netBenefitSection.className = 'p-4 rounded-lg border border-blue-500/50 bg-blue-900/30 backdrop-blur-sm';
        }
    }

    showError(message) {
        // Hide results and show error
        document.getElementById('results').classList.add('hidden');
        document.getElementById('noResults').innerHTML = `
            <div class="text-center text-red-400 py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="font-medium">${message}</p>
                <p class="text-sm mt-2 text-gray-500">Please check your inputs and try again.</p>
            </div>
        `;
        document.getElementById('noResults').classList.remove('hidden');
    }
}

class GoalCalculator {
    constructor() {
        this.form = document.getElementById('goalCalculatorForm');
        this.goalNameInput = document.getElementById('goalName');
        this.currentCostInput = document.getElementById('currentCost');
        this.existingInvestmentInput = document.getElementById('existingInvestment');
        this.yearsToAchieveInput = document.getElementById('yearsToAchieve');
        this.goalInvestmentReturnInput = document.getElementById('goalInvestmentReturn');
        this.inflationRateInput = document.getElementById('inflationRate');
        
        this.loadSavedValues();
        this.initEventListeners();
    }

    saveFormValues() {
        try {
            const formData = {
                goalName: this.goalNameInput.value,
                currentCost: this.currentCostInput.value,
                existingInvestment: this.existingInvestmentInput.value,
                yearsToAchieve: this.yearsToAchieveInput.value,
                goalInvestmentReturn: this.goalInvestmentReturnInput.value,
                inflationRate: this.inflationRateInput.value
            };
            localStorage.setItem('goalCalculatorData', JSON.stringify(formData));
        } catch (error) {
            console.warn('Error saving goal form values:', error);
        }
    }

    loadSavedValues() {
        const savedData = localStorage.getItem('goalCalculatorData');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                this.goalNameInput.value = formData.goalName || '';
                this.currentCostInput.value = formData.currentCost || '';
                this.existingInvestmentInput.value = formData.existingInvestment || '';
                this.yearsToAchieveInput.value = formData.yearsToAchieve || '';
                this.goalInvestmentReturnInput.value = formData.goalInvestmentReturn || '';
                this.inflationRateInput.value = formData.inflationRate || '6.0';

                if (this.form.checkValidity()) {
                    this.calculate();
                }
            } catch (error) {
                console.warn('Error loading goal form values:', error);
                localStorage.removeItem('goalCalculatorData');
            }
        }
    }

    initEventListeners() {
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormValues();
                if (this.form.checkValidity()) {
                    this.calculate();
                }
            });
        });
    }

    calculate() {
        const currentCost = parseFloat(this.currentCostInput.value);
        const existingInvestment = parseFloat(this.existingInvestmentInput.value) || 0;
        const yearsToAchieve = parseFloat(this.yearsToAchieveInput.value);
        const investmentReturn = parseFloat(this.goalInvestmentReturnInput.value) / 100;
        const inflationRate = parseFloat(this.inflationRateInput.value) / 100;

        if (isNaN(currentCost) || isNaN(yearsToAchieve) || isNaN(investmentReturn) || isNaN(inflationRate)) {
            return;
        }

        const futureCost = currentCost * Math.pow(1 + inflationRate, yearsToAchieve);
        const futureValueOfExisting = existingInvestment * Math.pow(1 + investmentReturn, yearsToAchieve);
        const remainingAmountNeeded = futureCost - futureValueOfExisting;

        let monthlyInvestment = 0;
        if (remainingAmountNeeded > 0) {
            const monthlyInvestmentRate = investmentReturn / 12;
            const numberOfMonths = yearsToAchieve * 12;
            monthlyInvestment = (remainingAmountNeeded * monthlyInvestmentRate) / (Math.pow(1 + monthlyInvestmentRate, numberOfMonths) - 1);
        }

        this.displayResults(futureCost, futureValueOfExisting, monthlyInvestment, remainingAmountNeeded);
    }

    displayResults(futureCost, futureValueOfExisting, monthlyInvestment, remainingAmountNeeded) {
        document.getElementById('goalResults').classList.remove('hidden');
        document.getElementById('noGoalResults').classList.add('hidden');
        
        document.getElementById('futureCost').textContent = this.formatCurrency(futureCost);
        document.getElementById('futureExistingInvestment').textContent = this.formatCurrency(futureValueOfExisting);
        
        const monthlyInvestmentElement = document.getElementById('monthlyInvestment');
        const monthlyInvestmentTitle = monthlyInvestmentElement.parentElement.querySelector('h3');
        
        if (remainingAmountNeeded > 0) {
            monthlyInvestmentTitle.textContent = 'Required Monthly Investment';
            monthlyInvestmentElement.textContent = this.formatCurrency(monthlyInvestment);
        } else {
            monthlyInvestmentTitle.textContent = 'Congratulations!';
            monthlyInvestmentElement.textContent = "You've already met your goal!";
        }
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            return '₹0.00';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoanCalculator();
    new GoalCalculator();

    const tabs = document.querySelectorAll('.tab-btn');
    const calculators = document.querySelectorAll('.calculator-content');

    const switchTab = (tab) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabId = tab.dataset.tab;
        localStorage.setItem('lastActiveTab', tabId); // Save active tab
        calculators.forEach(calc => {
            if (calc.id === tabId) {
                calc.classList.remove('hidden');
            } else {
                calc.classList.add('hidden');
            }
        });
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab));
    });

    // Set initial tab
    const lastTab = localStorage.getItem('lastActiveTab');
    const tabToActivate = document.querySelector(`.tab-btn[data-tab="${lastTab}"]`) || tabs[0];
    switchTab(tabToActivate);

    // Add some example scenarios as placeholders or help text
    const scenarios = {
        conservative: {
            purchaseAmount: 50000,
            availableCash: 60000,
            loanRate: 6.5,
            investmentReturn: 7.0,
            timePeriod: 5
        },
        aggressive: {
            purchaseAmount: 100000,
            availableCash: 120000,
            loanRate: 4.5,
            investmentReturn: 10.0,
            timePeriod: 10
        }
    };

    // You could add buttons to load these scenarios if desired
    console.log('Example scenarios available:', scenarios);
});

