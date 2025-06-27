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
                if (this.isFormValid()) {
                    // Add a small delay to ensure DOM is fully rendered
                    setTimeout(() => {
                        this.calculate();
                    }, 100);
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
                if (this.isFormValid()) {
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
        if (this.isFormValid()) {
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
            this.cashWarning.classList.remove('hidden');
        } else {
            this.cashWarning.classList.add('hidden');
        }
    }

    isFormValid() {
        // Get all required inputs that are not disabled
        const requiredInputs = this.form.querySelectorAll('input[required], select[required]');
        
        for (let input of requiredInputs) {
            // Skip validation for disabled inputs
            if (input.disabled) continue;
            
            // Check if the input has a value
            if (!input.value || input.value.trim() === '') {
                return false;
            }
            
            // For number inputs, check if the value is a valid number
            if (input.type === 'number' && isNaN(parseFloat(input.value))) {
                return false;
            }
        }
        
        return true;
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
                    setTimeout(() => {
                        this.calculate();
                    }, 100);
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

        // New logic: EV is always cheaper
        if (evInitialCost <= iceInitialCost && evYearlyOperatingCost <= iceYearlyOperatingCost) {
            return 'ev_always_cheaper';
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
            // Only set 'cy' if index is valid
            const breakevenIndex = Math.floor(breakevenYear) - 1;
            if (breakevenIndex >= 0 && breakevenIndex < yearlyComparison.length) {
                circle.setAttribute('cy', yScale(yearlyComparison[breakevenIndex].evCost));
            }
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

        // Helper to format years and months
        function formatYearsMonths(decimalYears) {
            if (!decimalYears || decimalYears < 0) return null;
            const years = Math.floor(decimalYears);
            const months = Math.round((decimalYears - years) * 12);
            let str = '';
            if (years > 0) str += `${years} year${years !== 1 ? 's' : ''}`;
            if (months > 0) str += `${years > 0 ? ' ' : ''}${months} month${months !== 1 ? 's' : ''}`;
            if (!str) str = '0 months';
            return str;
        }
        const breakevenYearMonth = formatYearsMonths(breakevenYear);

        // Update breakeven analysis
        const breakevenInfo = document.getElementById('breakevenInfo');
        if (breakevenYear === 'ev_always_cheaper') {
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
            // Show battery caveat only if EV TCO is less
            if (evTCO.totalCost < iceTCO.totalCost) {
                savingsExplanation.innerHTML += `<div class='text-yellow-400 text-sm mt-4 italic'>Heads up: We haven't included battery replacement costs in this calculation.<br>That's because most EVs come with a battery warranty of 7–10 years or 1.5–2 lakh km, which covers most users during typical ownership. Plus, battery prices are steadily falling, and by the time a replacement is needed, the cost may be much lower - and possibly similar to major repairs that ICE vehicles often need later in life.</div>`;
            }
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

class GoalCalculator {
    constructor() {
        this.form = document.getElementById('goalCalculatorForm');
        this.loadSavedValues();
        this.initEventListeners();
    }

    saveFormValues() {
        try {
            const formData = {
                goalName: document.getElementById('goalName').value,
                existingInvestment: document.getElementById('existingInvestment').value,
                costToday: document.getElementById('costToday').value,
                yearsToAchieve: document.getElementById('yearsToAchieve').value,
                expectedReturn: document.getElementById('expectedReturn').value,
                inflationRate: document.getElementById('inflationRate').value
            };
            localStorage.setItem('goalCalculatorData', JSON.stringify(formData));
        } catch (error) {
            console.warn('Error saving Goal Calculator form values:', error);
        }
    }

    loadSavedValues() {
        const savedData = localStorage.getItem('goalCalculatorData');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                document.getElementById('goalName').value = formData.goalName || '';
                document.getElementById('existingInvestment').value = formData.existingInvestment || '';
                document.getElementById('costToday').value = formData.costToday || '';
                document.getElementById('yearsToAchieve').value = formData.yearsToAchieve || '';
                document.getElementById('expectedReturn').value = formData.expectedReturn || '';
                document.getElementById('inflationRate').value = formData.inflationRate || '';

                if (this.form.checkValidity()) {
                    setTimeout(() => {
                        this.calculate();
                    }, 100);
                }
            } catch (error) {
                console.warn('Error loading Goal Calculator saved values:', error);
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

    getInputValues() {
        return {
            goalName: document.getElementById('goalName').value.trim(),
            existingInvestment: parseFloat(document.getElementById('existingInvestment').value) || 0,
            costToday: parseFloat(document.getElementById('costToday').value),
            yearsToAchieve: parseFloat(document.getElementById('yearsToAchieve').value),
            expectedReturn: parseFloat(document.getElementById('expectedReturn').value) / 100,
            inflationRate: parseFloat(document.getElementById('inflationRate').value) / 100
        };
    }

    validateInputs(inputs) {
        if (!inputs.goalName) {
            throw new Error('Goal name is required');
        }
        if (inputs.costToday <= 0) {
            throw new Error('Cost today must be positive');
        }
        if (inputs.yearsToAchieve <= 0) {
            throw new Error('Years to achieve must be positive');
        }
        if (inputs.expectedReturn < 0) {
            throw new Error('Expected return cannot be negative');
        }
        if (inputs.inflationRate < 0) {
            throw new Error('Inflation rate cannot be negative');
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
        
        // PMT formula: FV = PMT * [((1 + r)^n - 1) / r]
        // Solving for PMT: PMT = FV * r / ((1 + r)^n - 1)
        return futureValue * monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    calculateYearlyBreakdown(inputs, futureCost, monthlyInvestment) {
        const breakdown = [];
        let cumulativeInvestment = inputs.existingInvestment;
        let totalInvested = inputs.existingInvestment;
        
        for (let year = 1; year <= inputs.yearsToAchieve; year++) {
            // Add monthly investments for this year
            const yearlyInvestment = monthlyInvestment * 12;
            totalInvested += yearlyInvestment;
            
            // Calculate investment value at end of year
            cumulativeInvestment = (cumulativeInvestment + yearlyInvestment) * (1 + inputs.expectedReturn);
            
            // Calculate investment returns earned this year
            const investmentReturn = cumulativeInvestment - totalInvested;
            
            // Calculate percentage of goal achieved
            const percentageAchieved = (cumulativeInvestment / futureCost) * 100;
            
            breakdown.push({
                year,
                totalInvested: totalInvested,
                investmentValue: cumulativeInvestment,
                investmentReturn: investmentReturn,
                percentageAchieved: Math.min(percentageAchieved, 100)
            });
        }
        
        return breakdown;
    }

    drawProgressChart(yearlyBreakdown, futureCost, goalName) {
        const chartContainer = document.getElementById('progressChart');
        chartContainer.innerHTML = '';
        
        const width = chartContainer.offsetWidth;
        const height = 320;
        const padding = { top: 40, right: 20, bottom: 60, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Find max value for scaling
        const maxValue = Math.max(futureCost, ...yearlyBreakdown.map(d => d.investmentValue));
        
        // Create scales
        const xScale = (year) => padding.left + (year / yearlyBreakdown.length) * chartWidth;
        const yScale = (value) => padding.top + chartHeight - (value / maxValue) * chartHeight;
        
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
        
        // Draw goal target line
        const goalY = yScale(futureCost);
        const goalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        goalLine.setAttribute('x1', padding.left);
        goalLine.setAttribute('y1', goalY);
        goalLine.setAttribute('x2', padding.left + chartWidth);
        goalLine.setAttribute('y2', goalY);
        goalLine.setAttribute('stroke', '#f59e0b');
        goalLine.setAttribute('stroke-width', '2');
        goalLine.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(goalLine);
        
        // Draw investment progress line
        const progressPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathData = `M ${xScale(0)} ${yScale(yearlyBreakdown[0] ? yearlyBreakdown[0].totalInvested - (yearlyBreakdown[0].totalInvested - (yearlyBreakdown[0].investmentValue - yearlyBreakdown[0].investmentReturn)) : 0)}`;
        
        yearlyBreakdown.forEach((data, index) => {
            pathData += ` L ${xScale(index + 1)} ${yScale(data.investmentValue)}`;
        });
        
        progressPath.setAttribute('d', pathData);
        progressPath.setAttribute('stroke', '#10b981');
        progressPath.setAttribute('stroke-width', '3');
        progressPath.setAttribute('fill', 'none');
        svg.appendChild(progressPath);
        
        // Add data points
        yearlyBreakdown.forEach((data, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', xScale(index + 1));
            circle.setAttribute('cy', yScale(data.investmentValue));
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#10b981');
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', '2');
            svg.appendChild(circle);
        });
        
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
        for (let i = 0; i <= yearlyBreakdown.length; i++) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', xScale(i));
            text.setAttribute('y', padding.top + chartHeight + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#9ca3af');
            text.setAttribute('font-size', '12');
            text.textContent = `Y${i}`;
            svg.appendChild(text);
        }
        
        // Add value labels
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * (5 - i);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', padding.top + (i * chartHeight / 5) + 5);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#9ca3af');
            text.setAttribute('font-size', '10');
            text.textContent = this.formatCurrency(value).replace('₹', '₹');
            svg.appendChild(text);
        }
        
        // Add chart title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('x', width / 2);
        title.setAttribute('y', 25);
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('fill', '#ffffff');
        title.setAttribute('font-size', '14');
        title.setAttribute('font-weight', 'bold');
        title.textContent = `${goalName} - Investment Progress`;
        svg.appendChild(title);
        
        // Add legend
        const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Investment progress legend
        const progressLegendLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        progressLegendLine.setAttribute('x1', padding.left);
        progressLegendLine.setAttribute('y1', height - 35);
        progressLegendLine.setAttribute('x2', padding.left + 20);
        progressLegendLine.setAttribute('y2', height - 35);
        progressLegendLine.setAttribute('stroke', '#10b981');
        progressLegendLine.setAttribute('stroke-width', '3');
        legendGroup.appendChild(progressLegendLine);
        
        const progressLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        progressLegendText.setAttribute('x', padding.left + 25);
        progressLegendText.setAttribute('y', height - 31);
        progressLegendText.setAttribute('fill', '#9ca3af');
        progressLegendText.setAttribute('font-size', '12');
        progressLegendText.textContent = 'Investment Value';
        legendGroup.appendChild(progressLegendText);
        
        // Goal target legend
        const goalLegendLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        goalLegendLine.setAttribute('x1', padding.left + 150);
        goalLegendLine.setAttribute('y1', height - 35);
        goalLegendLine.setAttribute('x2', padding.left + 170);
        goalLegendLine.setAttribute('y2', height - 35);
        goalLegendLine.setAttribute('stroke', '#f59e0b');
        goalLegendLine.setAttribute('stroke-width', '2');
        goalLegendLine.setAttribute('stroke-dasharray', '5,5');
        legendGroup.appendChild(goalLegendLine);
        
        const goalLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        goalLegendText.setAttribute('x', padding.left + 175);
        goalLegendText.setAttribute('y', height - 31);
        goalLegendText.setAttribute('fill', '#9ca3af');
        goalLegendText.setAttribute('font-size', '12');
        goalLegendText.textContent = 'Goal Target';
        legendGroup.appendChild(goalLegendText);
        
        svg.appendChild(legendGroup);
        chartContainer.appendChild(svg);
    }

    calculate() {
        try {
            const inputs = this.getInputValues();
            this.validateInputs(inputs);
            
            // Calculate future cost with inflation
            const futureCost = this.calculateFutureCost(inputs.costToday, inputs.inflationRate, inputs.yearsToAchieve);
            
            // Calculate future value of existing investment
            const futureValueOfExisting = this.calculateFutureValueOfExisting(
                inputs.existingInvestment, 
                inputs.expectedReturn, 
                inputs.yearsToAchieve
            );
            
            // Calculate remaining amount needed
            const remainingAmountNeeded = Math.max(0, futureCost - futureValueOfExisting);
            
            // Calculate required monthly investment
            const monthlyInvestment = remainingAmountNeeded > 0 ? 
                this.calculateMonthlyInvestment(remainingAmountNeeded, inputs.expectedReturn, inputs.yearsToAchieve) : 0;
            
            // Calculate yearly breakdown
            const yearlyBreakdown = this.calculateYearlyBreakdown(inputs, futureCost, monthlyInvestment);
            
            this.displayResults({
                inputs,
                futureCost,
                monthlyInvestment,
                yearlyBreakdown,
                futureValueOfExisting,
                remainingAmountNeeded
            });
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    displayResults(data) {
        const { inputs, futureCost, monthlyInvestment, yearlyBreakdown, futureValueOfExisting, remainingAmountNeeded } = data;
        
        // Show all results sections
        document.getElementById('goalResults').classList.remove('hidden');
        document.getElementById('goalResults2').classList.remove('hidden');
        document.getElementById('goalResults3').classList.remove('hidden');
        document.getElementById('noGoalResults').classList.add('hidden');
        
        // Update future cost
        document.getElementById('futureCost').innerHTML = `
            <span class="text-2xl font-bold text-yellow-400">${this.formatCurrency(futureCost)}</span>
            <p class="text-sm text-gray-400 mt-1">
                Today's cost: ${this.formatCurrency(inputs.costToday)} | 
                Inflation impact: ${this.formatCurrency(futureCost - inputs.costToday)}
            </p>
        `;
        
        // Update monthly investment
        const monthlyInvestmentElement = document.getElementById('monthlyInvestment');
        if (monthlyInvestment > 0) {
            monthlyInvestmentElement.innerHTML = `
                <span class="text-2xl font-bold text-emerald-400">${this.formatCurrency(monthlyInvestment)}</span>
                <p class="text-sm text-gray-400 mt-1">
                    Total monthly: ${this.formatCurrency(monthlyInvestment)} | 
                    Existing investment will grow to: ${this.formatCurrency(futureValueOfExisting)}
                </p>
            `;
        } else {
            monthlyInvestmentElement.innerHTML = `
                <span class="text-2xl font-bold text-emerald-400">₹0</span>
                <p class="text-sm text-emerald-400 mt-1">
                    🎉 Your existing investment of ${this.formatCurrency(inputs.existingInvestment)} 
                    will grow to ${this.formatCurrency(futureValueOfExisting)}, which exceeds your goal!
                </p>
            `;
        }
        
        // Update yearly breakdown table
        const tableBody = document.getElementById('goalYearlyBreakdown');
        tableBody.innerHTML = '';
        
        yearlyBreakdown.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-800/30';
            
            const percentageClass = row.percentageAchieved >= 100 ? 'text-emerald-400' : 
                                  row.percentageAchieved >= 75 ? 'text-yellow-400' : 'text-gray-300';
            
            tr.innerHTML = `
                <td class="py-3 text-gray-300">${row.year}</td>
                <td class="py-3 text-right text-gray-300">${this.formatCurrency(row.totalInvested)}</td>
                <td class="py-3 text-right text-emerald-400">${this.formatCurrency(row.investmentReturn)}</td>
                <td class="py-3 text-right text-blue-400 font-medium">${this.formatCurrency(row.investmentValue)}</td>
                <td class="py-3 text-right ${percentageClass} font-medium">
                    ${row.percentageAchieved.toFixed(1)}%
                    ${row.percentageAchieved >= 100 ? ' 🎯' : ''}
                </td>
            `;
            tableBody.appendChild(tr);
        });
        
        // Draw progress chart
        this.drawProgressChart(yearlyBreakdown, futureCost, inputs.goalName);
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            return '₹0';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    showError(message) {
        document.getElementById('goalResults').classList.add('hidden');
        // You could add error display logic here if needed
        console.error('Goal Calculator Error:', message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoanCalculator();
    new EVVsICECalculator();
    window.goalCalculatorInstance = new GoalCalculator();

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
        // Trigger Goal Calculator calculation on tab switch if needed
        if (tabId === 'goalCalculator' && window.goalCalculatorInstance) {
            const form = document.getElementById('goalCalculatorForm');
            if (form && form.checkValidity()) {
                setTimeout(() => {
                    window.goalCalculatorInstance.calculate();
                }, 100);
            }
        }
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
