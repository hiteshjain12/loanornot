class LoanCalculator {
    constructor() {
        this.form = document.getElementById('calculatorForm');
        this.matchCheckbox = document.getElementById('matchPurchaseAmount');
        this.purchaseAmountInput = document.getElementById('purchaseAmount');
        this.availableCashInput = document.getElementById('availableCash');
        this.cashWarning = document.getElementById('cashWarning');
        this.initEventListeners();
    }

    initEventListeners() {
        // Real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.id === 'purchaseAmount') {
                    this.handlePurchaseAmountChange();
                }
                if (this.form.checkValidity()) {
                    this.calculate();
                }
            });
        });

        // Handle checkbox change
        this.matchCheckbox.addEventListener('change', () => {
            this.handleCheckboxChange();
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
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
        if (loanAmountNeeded > 0) {
            partialLoanDetails.classList.remove('hidden');
            document.getElementById('partialLoanAmount').textContent = this.formatCurrency(loanAmountNeeded);
            document.getElementById('partialLoanInterest').textContent = this.formatCurrency(totalInterestForRemainder);
        } else {
            partialLoanDetails.classList.add('hidden');
        }

        document.getElementById('remainingCash').textContent = this.formatCurrency(remainingCashAfterPurchase);
        document.getElementById('cashInvestmentReturns').textContent = this.formatCurrency(cashInvestmentReturns);
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

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LoanCalculator();
});

// Add some helpful tooltips and explanations
document.addEventListener('DOMContentLoaded', () => {
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

