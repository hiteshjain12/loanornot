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

class EVVsICECalculator {
    constructor() {
        this.form = document.getElementById('evVsIceCalculatorForm');
        this.loadSavedValues();
        this.initEventListeners();
    }

    saveFormValues() {
        try {
            const formData = {
                evPurchasePrice: document.getElementById('evPurchasePrice').value,
                evResaleValue: document.getElementById('evResaleValue').value,
                evEfficiency: document.getElementById('evEfficiency').value,
                electricityCost: document.getElementById('electricityCost').value,
                evMaintenanceCost: document.getElementById('evMaintenanceCost').value,
                evInsuranceCost: document.getElementById('evInsuranceCost').value,
                evIncentives: document.getElementById('evIncentives').value,
                icePurchasePrice: document.getElementById('icePurchasePrice').value,
                iceResaleValue: document.getElementById('iceResaleValue').value,
                fuelEfficiency: document.getElementById('fuelEfficiency').value,
                fuelCost: document.getElementById('fuelCost').value,
                iceMaintenanceCost: document.getElementById('iceMaintenanceCost').value,
                iceInsuranceCost: document.getElementById('iceInsuranceCost').value,
                averageDistance: document.getElementById('averageDistance').value,
                ownershipPeriod: document.getElementById('ownershipPeriod').value
            };
            localStorage.setItem('evVsIceCalculatorData', JSON.stringify(formData));
        } catch (error) {
            console.warn('Error saving EV vs ICE form values:', error);
        }
    }

    loadSavedValues() {
        const savedData = localStorage.getItem('evVsIceCalculatorData');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                document.getElementById('evPurchasePrice').value = formData.evPurchasePrice || '';
                document.getElementById('evResaleValue').value = formData.evResaleValue || '';
                document.getElementById('evEfficiency').value = formData.evEfficiency || '';
                document.getElementById('electricityCost').value = formData.electricityCost || '';
                document.getElementById('evMaintenanceCost').value = formData.evMaintenanceCost || '';
                document.getElementById('evInsuranceCost').value = formData.evInsuranceCost || '';
                document.getElementById('evIncentives').value = formData.evIncentives || '';
                document.getElementById('icePurchasePrice').value = formData.icePurchasePrice || '';
                document.getElementById('iceResaleValue').value = formData.iceResaleValue || '';
                document.getElementById('fuelEfficiency').value = formData.fuelEfficiency || '';
                document.getElementById('fuelCost').value = formData.fuelCost || '';
                document.getElementById('iceMaintenanceCost').value = formData.iceMaintenanceCost || '';
                document.getElementById('iceInsuranceCost').value = formData.iceInsuranceCost || '';
                document.getElementById('averageDistance').value = formData.averageDistance || '';
                document.getElementById('ownershipPeriod').value = formData.ownershipPeriod || '';

                if (this.form.checkValidity()) {
                    this.calculate();
                }
            } catch (error) {
                console.warn('Error loading EV vs ICE saved values:', error);
                localStorage.removeItem('evVsIceCalculatorData');
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
            evPurchasePrice: parseFloat(document.getElementById('evPurchasePrice').value),
            evResaleValue: (parseFloat(document.getElementById('evResaleValue').value) || 0) / 100,
            evEfficiency: parseFloat(document.getElementById('evEfficiency').value),
            electricityCost: parseFloat(document.getElementById('electricityCost').value),
            evMaintenanceCost: parseFloat(document.getElementById('evMaintenanceCost').value),
            evInsuranceCost: parseFloat(document.getElementById('evInsuranceCost').value),
            evIncentives: parseFloat(document.getElementById('evIncentives').value) || 0,
            icePurchasePrice: parseFloat(document.getElementById('icePurchasePrice').value),
            iceResaleValue: (parseFloat(document.getElementById('iceResaleValue').value) || 0) / 100,
            fuelEfficiency: parseFloat(document.getElementById('fuelEfficiency').value),
            fuelCost: parseFloat(document.getElementById('fuelCost').value),
            iceMaintenanceCost: parseFloat(document.getElementById('iceMaintenanceCost').value),
            iceInsuranceCost: parseFloat(document.getElementById('iceInsuranceCost').value),
            averageDistance: parseFloat(document.getElementById('averageDistance').value),
            ownershipPeriod: parseFloat(document.getElementById('ownershipPeriod').value)
        };
    }

    validateInputs(inputs) {
        if (inputs.evPurchasePrice <= 0 || inputs.icePurchasePrice <= 0) {
            throw new Error('Purchase prices must be positive');
        }
        if (inputs.averageDistance <= 0 || inputs.ownershipPeriod <= 0) {
            throw new Error('Distance and ownership period must be positive');
        }
        if (inputs.evEfficiency <= 0 || inputs.fuelEfficiency <= 0) {
            throw new Error('Efficiency values must be positive');
        }
    }

    calculateEVTCO(inputs) {
        const totalDistance = inputs.averageDistance * inputs.ownershipPeriod;
        const totalEnergyNeeded = totalDistance / inputs.evEfficiency; // kWh
        const totalFuelCost = totalEnergyNeeded * inputs.electricityCost;
        const totalMaintenance = inputs.evMaintenanceCost * inputs.ownershipPeriod;
        const totalInsurance = inputs.evInsuranceCost * inputs.ownershipPeriod;
        const resaleValue = inputs.evPurchasePrice * inputs.evResaleValue;
        
        const totalCost = inputs.evPurchasePrice - inputs.evIncentives + totalFuelCost + totalMaintenance + totalInsurance - resaleValue;
        
        return {
            purchasePrice: inputs.evPurchasePrice,
            incentives: inputs.evIncentives,
            totalFuelCost,
            totalMaintenance,
            totalInsurance,
            resaleValue,
            totalCost
        };
    }

    calculateICETCO(inputs) {
        const totalDistance = inputs.averageDistance * inputs.ownershipPeriod;
        const totalFuelNeeded = totalDistance / inputs.fuelEfficiency; // liters
        const totalFuelCost = totalFuelNeeded * inputs.fuelCost;
        const totalMaintenance = inputs.iceMaintenanceCost * inputs.ownershipPeriod;
        const totalInsurance = inputs.iceInsuranceCost * inputs.ownershipPeriod;
        const resaleValue = inputs.icePurchasePrice * inputs.iceResaleValue;
        
        const totalCost = inputs.icePurchasePrice + totalFuelCost + totalMaintenance + totalInsurance - resaleValue;
        
        return {
            purchasePrice: inputs.icePurchasePrice,
            totalFuelCost,
            totalMaintenance,
            totalInsurance,
            resaleValue,
            totalCost
        };
    }

    calculateYearlyComparison(inputs) {
        const yearlyData = [];
        let evCumulativeCost = inputs.evPurchasePrice - inputs.evIncentives;
        let iceCumulativeCost = inputs.icePurchasePrice;
        
        const evYearlyFuelCost = (inputs.averageDistance / inputs.evEfficiency) * inputs.electricityCost;
        const iceYearlyFuelCost = (inputs.averageDistance / inputs.fuelEfficiency) * inputs.fuelCost;
        
        for (let year = 1; year <= inputs.ownershipPeriod; year++) {
            evCumulativeCost += evYearlyFuelCost + inputs.evMaintenanceCost + inputs.evInsuranceCost;
            iceCumulativeCost += iceYearlyFuelCost + inputs.iceMaintenanceCost + inputs.iceInsuranceCost;
            
            // Subtract resale value in the final year
            const evCostWithResale = year === inputs.ownershipPeriod ? 
                evCumulativeCost - (inputs.evPurchasePrice * inputs.evResaleValue) : evCumulativeCost;
            const iceCostWithResale = year === inputs.ownershipPeriod ? 
                iceCumulativeCost - (inputs.icePurchasePrice * inputs.iceResaleValue) : iceCumulativeCost;
            
            const breakEven = evCostWithResale <= iceCostWithResale;
            
            yearlyData.push({
                year,
                evCost: evCostWithResale,
                iceCost: iceCostWithResale,
                breakEven
            });
        }
        
        return yearlyData;
    }

    calculateBreakevenPoint(inputs) {
        const evYearlyFuelCost = (inputs.averageDistance / inputs.evEfficiency) * inputs.electricityCost;
        const iceYearlyFuelCost = (inputs.averageDistance / inputs.fuelEfficiency) * inputs.fuelCost;
        const evYearlyOperatingCost = evYearlyFuelCost + inputs.evMaintenanceCost + inputs.evInsuranceCost;
        const iceYearlyOperatingCost = iceYearlyFuelCost + inputs.iceMaintenanceCost + inputs.iceInsuranceCost;
        
        const evInitialCost = inputs.evPurchasePrice - inputs.evIncentives;
        const iceInitialCost = inputs.icePurchasePrice;
        
        // Calculate when cumulative costs become equal
        // evInitialCost + evYearlyOperatingCost * year = iceInitialCost + iceYearlyOperatingCost * year
        // Solving for year: (evInitialCost - iceInitialCost) = (iceYearlyOperatingCost - evYearlyOperatingCost) * year
        
        const initialCostDiff = evInitialCost - iceInitialCost;
        const yearlyOperatingDiff = iceYearlyOperatingCost - evYearlyOperatingCost;
        
        if (yearlyOperatingDiff <= 0) {
            // EV never breaks even (ICE is always cheaper in operating costs too)
            return null;
        }
        
        const breakevenYear = initialCostDiff / yearlyOperatingDiff;
        return breakevenYear > 0 ? breakevenYear : null;
    }

    drawChart(yearlyComparison, breakevenYear) {
        const chartContainer = document.getElementById('costChart');
        chartContainer.innerHTML = ''; // Clear existing chart
        
        const width = chartContainer.offsetWidth;
        const height = 320;
        const padding = { top: 20, right: 20, bottom: 40, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Find max cost for scaling
        const maxCost = Math.max(
            ...yearlyComparison.map(d => Math.max(d.evCost, d.iceCost))
        );
        
        // Create scales
        const xScale = (year) => padding.left + (year - 1) * (chartWidth / (yearlyComparison.length - 1));
        const yScale = (cost) => padding.top + chartHeight - (cost / maxCost) * chartHeight;
        
        // Draw grid lines
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i * chartHeight / 5);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', padding.left + chartWidth);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#374151');
            line.setAttribute('stroke-width', '1');
            line.setAttribute('opacity', '0.3');
            gridGroup.appendChild(line);
        }
        svg.appendChild(gridGroup);
        
        // Draw EV line
        const evPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let evPathData = `M ${xScale(1)} ${yScale(yearlyComparison[0].evCost)}`;
        for (let i = 1; i < yearlyComparison.length; i++) {
            evPathData += ` L ${xScale(i + 1)} ${yScale(yearlyComparison[i].evCost)}`;
        }
        evPath.setAttribute('d', evPathData);
        evPath.setAttribute('stroke', '#3b82f6');
        evPath.setAttribute('stroke-width', '3');
        evPath.setAttribute('fill', 'none');
        svg.appendChild(evPath);
        
        // Draw ICE line
        const icePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let icePathData = `M ${xScale(1)} ${yScale(yearlyComparison[0].iceCost)}`;
        for (let i = 1; i < yearlyComparison.length; i++) {
            icePathData += ` L ${xScale(i + 1)} ${yScale(yearlyComparison[i].iceCost)}`;
        }
        icePath.setAttribute('d', icePathData);
        icePath.setAttribute('stroke', '#ef4444');
        icePath.setAttribute('stroke-width', '3');
        icePath.setAttribute('fill', 'none');
        svg.appendChild(icePath);
        
        // Draw breakeven point if it exists and is within the ownership period
        if (breakevenYear && breakevenYear <= yearlyComparison.length) {
            const x = padding.left + (breakevenYear - 1) * (chartWidth / (yearlyComparison.length - 1));
            
            // Vertical line
            const breakevenLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            breakevenLine.setAttribute('x1', x);
            breakevenLine.setAttribute('y1', padding.top);
            breakevenLine.setAttribute('x2', x);
            breakevenLine.setAttribute('y2', padding.top + chartHeight);
            breakevenLine.setAttribute('stroke', '#10b981');
            breakevenLine.setAttribute('stroke-width', '2');
            breakevenLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(breakevenLine);
            
            // Breakeven point marker
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', yScale(yearlyComparison[Math.floor(breakevenYear) - 1].evCost));
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', '#10b981');
            svg.appendChild(circle);
        }
        
        // Draw axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding.left);
        xAxis.setAttribute('y1', padding.top + chartHeight);
        xAxis.setAttribute('x2', padding.left + chartWidth);
        xAxis.setAttribute('y2', padding.top + chartHeight);
        xAxis.setAttribute('stroke', '#9ca3af');
        xAxis.setAttribute('stroke-width', '2');
        svg.appendChild(xAxis);
        
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding.left);
        yAxis.setAttribute('y1', padding.top);
        yAxis.setAttribute('x2', padding.left);
        yAxis.setAttribute('y2', padding.top + chartHeight);
        yAxis.setAttribute('stroke', '#9ca3af');
        yAxis.setAttribute('stroke-width', '2');
        svg.appendChild(yAxis);
        
        // Add year labels
        for (let i = 0; i < yearlyComparison.length; i++) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', xScale(i + 1));
            text.setAttribute('y', padding.top + chartHeight + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#9ca3af');
            text.setAttribute('font-size', '12');
            text.textContent = `Y${i + 1}`;
            svg.appendChild(text);
        }
        
        // Add cost labels
        for (let i = 0; i <= 5; i++) {
            const cost = (maxCost / 5) * (5 - i);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', padding.top + (i * chartHeight / 5) + 5);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#9ca3af');
            text.setAttribute('font-size', '10');
            text.textContent = this.formatCurrency(cost).replace('₹', '₹');
            svg.appendChild(text);
        }
        
        chartContainer.appendChild(svg);
    }

    displayResults(evTCO, iceTCO, yearlyComparison, inputs) {
        document.getElementById('evIceResults').classList.remove('hidden');
        document.getElementById('noEvIceResults').classList.add('hidden');

        // Calculate breakeven point
        const breakevenYear = this.calculateBreakevenPoint(inputs);

        // Update breakeven analysis
        const breakevenInfo = document.getElementById('breakevenInfo');
        if (breakevenYear && breakevenYear <= inputs.ownershipPeriod) {
            breakevenInfo.innerHTML = `
                <div class="text-green-400 text-xl font-semibold mb-2">🎯 Breakeven Point Reached!</div>
                <p class="text-white">EV becomes cost-effective after <strong>${breakevenYear.toFixed(1)} years</strong></p>
                <p class="text-gray-300 text-sm mt-2">Operating costs savings will compensate for the higher upfront cost</p>
            `;
        } else if (breakevenYear && breakevenYear > inputs.ownershipPeriod) {
            breakevenInfo.innerHTML = `
                <div class="text-yellow-400 text-xl font-semibold mb-2">⏳ Breakeven Beyond Ownership</div>
                <p class="text-white">EV would become cost-effective after <strong>${breakevenYear.toFixed(1)} years</strong></p>
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
        document.getElementById('evPurchasePriceDisplay').textContent = this.formatCurrency(evTCO.purchasePrice);
        document.getElementById('evIncentivesDisplay').textContent = `-${this.formatCurrency(evTCO.incentives)}`;
        document.getElementById('evFuelCostDisplay').textContent = this.formatCurrency(evTCO.totalFuelCost);
        document.getElementById('evMaintenanceDisplay').textContent = this.formatCurrency(evTCO.totalMaintenance);
        document.getElementById('evInsuranceDisplay').textContent = this.formatCurrency(evTCO.totalInsurance);
        document.getElementById('evResaleDisplay').textContent = `-${this.formatCurrency(evTCO.resaleValue)}`;
        document.getElementById('evTotalCost').textContent = this.formatCurrency(evTCO.totalCost);

        // Update ICE breakdown
        document.getElementById('icePurchasePriceDisplay').textContent = this.formatCurrency(iceTCO.purchasePrice);
        document.getElementById('iceFuelCostDisplay').textContent = this.formatCurrency(iceTCO.totalFuelCost);
        document.getElementById('iceMaintenanceDisplay').textContent = this.formatCurrency(iceTCO.totalMaintenance);
        document.getElementById('iceInsuranceDisplay').textContent = this.formatCurrency(iceTCO.totalInsurance);
        document.getElementById('iceResaleDisplay').textContent = `-${this.formatCurrency(iceTCO.resaleValue)}`;
        document.getElementById('iceTotalCost').textContent = this.formatCurrency(iceTCO.totalCost);

        // Update yearly comparison table
        const tableBody = document.getElementById('yearlyComparisonTable');
        tableBody.innerHTML = '';
        yearlyComparison.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-800';
            tr.innerHTML = `
                <td class="py-2 text-gray-300">${row.year}</td>
                <td class="py-2 text-right text-gray-300">${this.formatCurrency(row.evCost)}</td>
                <td class="py-2 text-right text-gray-300">${this.formatCurrency(row.iceCost)}</td>
                <td class="py-2 text-right ${row.breakEven ? 'text-green-400' : 'text-red-400'}">
                    ${row.breakEven ? '✅ Yes' : '❌ No'}
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Draw the chart
        this.drawChart(yearlyComparison, breakevenYear);

        // Update recommendation and savings
        const savings = iceTCO.totalCost - evTCO.totalCost;
        const recommendationDiv = document.getElementById('evIceRecommendation');
        const recommendationText = document.getElementById('evIceRecommendationText');
        const savingsElement = document.getElementById('evIceSavings');
        const savingsExplanation = document.getElementById('savingsExplanation');
        
        if (savings > 0) {
            recommendationDiv.className = 'mb-6 p-4 rounded-lg backdrop-blur-sm bg-emerald-900/30 border border-emerald-500/50';
            recommendationText.innerHTML = `<span class="text-emerald-400">⚡ Choose EV! It's more cost-effective.</span>`;
            savingsElement.textContent = `+${this.formatCurrency(savings)}`;
            savingsElement.className = 'font-bold text-xl text-emerald-400';
            savingsExplanation.textContent = `EV saves you ${this.formatCurrency(savings)} over ${inputs.ownershipPeriod} years compared to ICE.`;
        } else {
            recommendationDiv.className = 'mb-6 p-4 rounded-lg backdrop-blur-sm bg-blue-900/30 border border-blue-500/50';
            recommendationText.innerHTML = `<span class="text-blue-400">⛽ ICE is more cost-effective for your usage.</span>`;
            savingsElement.textContent = this.formatCurrency(savings);
            savingsElement.className = 'font-bold text-xl text-blue-400';
            savingsExplanation.textContent = `ICE costs ${this.formatCurrency(Math.abs(savings))} less than EV over ${inputs.ownershipPeriod} years.`;
        }
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            return '₹0.00';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    showError(message) {
        document.getElementById('evIceResults').classList.add('hidden');
        document.getElementById('noEvIceResults').innerHTML = `
            <div class="text-center text-red-400 py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="font-medium">${message}</p>
                <p class="text-sm mt-2 text-gray-500">Please check your inputs and try again.</p>
            </div>
        `;
        document.getElementById('noEvIceResults').classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoanCalculator();
    new GoalCalculator();
    new EVVsICECalculator();

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

