class LoanCalculator {
    constructor() {
        this.form = document.getElementById('calculatorForm');
        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculate();
        });

        // Real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (this.form.checkValidity()) {
                    this.calculate();
                }
            });
        });
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
        
        if (purchaseAmount <= 0 || availableCash <= 0) {
            throw new Error('Purchase amount and available cash must be positive');
        }
        
        if (availableCash < purchaseAmount) {
            throw new Error('Available cash must be at least equal to purchase amount');
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

            // Option 1: Pay Cash
            const remainingCashAfterPurchase = availableCash - purchaseAmount;
            const cashInvestmentValueAfterTax = this.calculateInvestmentWithTax(
                remainingCashAfterPurchase, 
                investmentReturn, 
                timeInYears,
                compoundingFrequency,
                taxRate
            );
            const cashInvestmentReturns = cashInvestmentValueAfterTax - remainingCashAfterPurchase;
            // Net position = remaining cash after tax and growth
            const cashNetPosition = cashInvestmentValueAfterTax;

            // Option 2: Take Loan and Invest All Cash
            const loanAmount = purchaseAmount;
            const totalInterest = this.calculateLoanInterest(loanAmount, loanRate, timeInYears);
            const loanInvestmentValueAfterTax = this.calculateInvestmentWithTax(
                availableCash, 
                investmentReturn, 
                timeInYears,
                compoundingFrequency,
                taxRate
            );
            const loanInvestmentReturns = loanInvestmentValueAfterTax - availableCash;
            // Net position = investment value after tax - loan total cost
            const totalLoanCost = loanAmount + totalInterest;
            const loanNetPosition = loanInvestmentValueAfterTax - totalLoanCost;

            // Net benefit calculation - difference between the two net positions
            const netBenefit = loanNetPosition - cashNetPosition;
            this.displayResults({
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
                inputs
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
            inputs
        } = data;

        // Show results section
        document.getElementById('results').classList.remove('hidden');
        document.getElementById('noResults').classList.add('hidden');

        // Update recommendation
        const recommendationDiv = document.getElementById('recommendation');
        const recommendationText = document.getElementById('recommendationText');
        
        if (netBenefit > 0) {
            recommendationDiv.className = 'mb-6 p-4 rounded-lg bg-green-100 border border-green-300';
            recommendationText.innerHTML = `<span class=\"text-green-800\">💡 Take a loan and invest your cash!</span>`;
        } else {
            recommendationDiv.className = 'mb-6 p-4 rounded-lg bg-blue-100 border border-blue-300';
            recommendationText.innerHTML = `<span class=\"text-blue-800\">💡 Pay with cash!</span>`;
        }

        // Update cash option details
        document.getElementById('cashPayment').textContent = this.formatCurrency(purchaseAmount);
        document.getElementById('remainingCash').textContent = this.formatCurrency(remainingCashAfterPurchase);
        document.getElementById('cashInvestmentReturns').textContent = this.formatCurrency(cashInvestmentReturns);
        document.getElementById('cashNetPosition').textContent = this.formatCurrency(cashNetPosition);

        // Update loan option details
        document.getElementById('loanAmount').textContent = this.formatCurrency(loanAmount);
        document.getElementById('totalInterest').textContent = this.formatCurrency(totalInterest);
        document.getElementById('loanInvestmentReturns').textContent = this.formatCurrency(loanInvestmentReturns);
        document.getElementById('loanNetPosition').textContent = this.formatCurrency(loanNetPosition);

        // Update net benefit
        const netBenefitElement = document.getElementById('netBenefit');
        const benefitExplanationElement = document.getElementById('benefitExplanation');
        
        if (netBenefit > 0) {
            netBenefitElement.textContent = `+${this.formatCurrency(netBenefit)}`;
            netBenefitElement.className = 'font-bold text-xl text-green-600';
            benefitExplanationElement.textContent = `Taking a loan and investing provides ${this.formatCurrency(netBenefit)} more after ${inputs.timePeriod} ${inputs.timeUnit}.`;
        } else {
            netBenefitElement.textContent = this.formatCurrency(netBenefit);
            netBenefitElement.className = 'font-bold text-xl text-red-600';
            benefitExplanationElement.textContent = `Paying cash saves you ${this.formatCurrency(Math.abs(netBenefit))} compared to taking a loan after ${inputs.timePeriod} ${inputs.timeUnit}.`;
        }

        // Update net benefit section border
        const netBenefitSection = netBenefitElement.closest('.p-4');
        if (netBenefit > 0) {
            netBenefitSection.className = 'p-4 rounded-lg border-2 border-green-300 bg-green-50';
        } else {
            netBenefitSection.className = 'p-4 rounded-lg border-2 border-blue-300 bg-blue-50';
        }
    }

    showError(message) {
        // Hide results and show error
        document.getElementById('results').classList.add('hidden');
        document.getElementById('noResults').innerHTML = `
            <div class=\"text-center text-red-500 py-8\">
                <div class=\"text-6xl mb-4\">⚠️</div>
                <p class=\"font-medium\">${message}</p>
                <p class=\"text-sm mt-2\">Please check your inputs and try again.</p>
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

