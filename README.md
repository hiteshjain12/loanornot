# Financial Calculators 💰

A smart suite of financial decision tools to help you make better money choices. Includes:
- **LoanOrNot**: Decide whether to take a loan and invest your cash, or pay upfront for a purchase.
- **Goal Calculator**: Find out how much you need to save each month to reach a future financial goal, accounting for inflation and your existing investments.
- **EV vs ICE Calculator**: Compare the Total Cost of Ownership (TCO) between Electric Vehicles and Internal Combustion Engine vehicles with breakeven analysis.

## 🎯 Purpose

This app helps you answer three key questions:
- Should you take a loan and invest your cash, or pay upfront?
- How much should you save each month to reach a goal in X years, given inflation and your current savings?
- Should you buy an Electric Vehicle or stick with an Internal Combustion Engine vehicle based on your usage and costs?

## 🚀 Features

- **Multi-tab UI**: Switch between different calculators (LoanOrNot, Goal Calculator, EV vs ICE Calculator)
- **Real-time calculations** as you type
- **Remembers your data**: All form values and last visited tab are saved and restored on page refresh
- **Visual recommendations** with color-coded results
- **Detailed breakdown** of all scenarios
- **Net benefit analysis** showing the financial difference
- **Responsive design** works on desktop and mobile
- **Input validation** with helpful error messages

## 🛠️ Technology Stack

- **HTML5** - Structure and semantics
- **Tailwind CSS** - Modern styling and responsive design
- **Vanilla JavaScript** - Financial calculations and interactivity
- **No dependencies** - Runs entirely in the browser

## 📊 How It Works

### LoanOrNot Calculator

**Option 1: Pay Cash**
- Remaining cash after purchase gets invested
- Returns calculated using compound interest formula
- Net position = remaining cash + investment returns

**Option 2: Take Loan**
- All available cash gets invested
- Loan interest calculated using standard loan payment formula
- Net position = total investment returns - total loan interest

**Recommendation**
- Compares net positions of both options
- Shows which option provides better financial outcome
- Displays the monetary difference over the specified time period

### Goal Calculator

**Purpose:**
- Find out how much you need to save each month to reach a future goal, given the cost today, years to achieve, expected investment return, inflation, and your existing investment for the goal.

**Inputs:**
- Goal name (optional)
- Cost today (₹)
- Existing investment for this goal (₹)
- Years to achieve
- Expected investment return (% annually)
- Inflation rate (% annually, default 6%)

**Outputs:**
- Future cost of your goal (adjusted for inflation)
- Future value of your existing investment
- Required monthly investment (if needed)
- If your existing investment is already enough, you'll be congratulated!

**Key Formulas:**
- **Future Cost:** `Future Cost = Cost Today × (1 + Inflation Rate)^Years`
- **Future Value of Existing Investment:** `FV = Existing Investment × (1 + Investment Return)^Years`
- **Monthly Investment Needed:**
  - If more is needed: `PMT = (Future Cost - FV) × r / ((1 + r)^n - 1)`
    - where r = monthly investment return, n = total months

### EV vs ICE Calculator

**Purpose:**
- Compare the Total Cost of Ownership (TCO) between Electric Vehicles and Internal Combustion Engine vehicles
- Calculate breakeven point when EV becomes cost-effective
- Provide year-by-year cost analysis with visual chart

**Inputs:**

*EV Details:*
- Purchase Price (₹)
- Expected Resale Value (% of purchase price)
- Efficiency (km/kWh, default: 5)
- Electricity Cost (₹/kWh, default: 8)
- Annual Maintenance (₹)
- Insurance per Year (₹)
- Government Incentives (₹)

*ICE Details:*
- Purchase Price (₹)
- Expected Resale Value (% of purchase price)
- Fuel Efficiency (km/l, default: 15)
- Fuel Cost (₹/l, default: 100)
- Annual Maintenance (₹)
- Insurance per Year (₹)

*Usage:*
- Average Distance per Year (km)
- Ownership Period (years)

**Outputs:**
- **Smart Recommendation** with color-coded results
- **Breakeven Analysis** - When EV becomes cost-effective
- **EV and ICE Breakdowns** - Complete cost analysis for both
- **Year-by-Year Comparison Table** - Shows break-even status each year
- **Interactive Visual Chart** - Cost progression with breakeven point marked
- **Total Savings** calculation and explanation

**Key Formula:**
- **TCO = Upfront Cost + Recurring Cost (years 2 to N) + End-of-life Adjustment (resale value)**
- **Breakeven Year:** Calculated when cumulative EV costs equal cumulative ICE costs
- **Operating Costs:** Fuel/Energy + Maintenance + Insurance per year

## 🏃‍♂️ Getting Started

1. **Clone or download** the project files
2. **Open `index.html`** in any modern web browser
3. **Choose a calculator tab** (LoanOrNot, Goal Calculator, or EV vs ICE Calculator)
4. **Enter your details**
5. **View results instantly**
6. **Your data and last visited tab are saved automatically**

## 📁 Project Structure

```
loanornot/
├── index.html          # Main HTML file with UI
├── script.js           # JavaScript for calculations
└── README.md           # Project documentation
```

## 💡 Example Scenarios

### LoanOrNot: Conservative Investment
- Purchase: ₹50,000
- Available Cash: ₹60,000
- Loan Rate: 6.5%
- Investment Return: 7.0%
- Period: 5 years
- **Result**: Small benefit to taking loan due to higher investment returns

### LoanOrNot: Aggressive Investment
- Purchase: ₹100,000
- Available Cash: ₹120,000
- Loan Rate: 4.5%
- Investment Return: 10.0%
- Period: 10 years
- **Result**: Significant benefit to taking loan due to much higher investment returns

### Goal Calculator: Dream Vacation
- Goal: Dream Vacation
- Cost Today: ₹2,00,000
- Existing Investment: ₹50,000
- Years to Achieve: 5
- Expected Investment Return: 8%
- Inflation Rate: 6%
- **Result**: Future cost is ₹2,67,646. You need to invest ₹2,500/month (example) to reach your goal.

### EV vs ICE: Urban Commuter
- EV: ₹15,00,000 purchase, 5 km/kWh efficiency, ₹15,000 maintenance
- ICE: ₹12,00,000 purchase, 15 km/l efficiency, ₹25,000 maintenance
- Usage: 12,000 km/year for 8 years
- Electricity: ₹8/kWh, Fuel: ₹100/l
- **Result**: EV breaks even after 4.2 years, saves ₹2,50,000 over 8 years

### EV vs ICE: Highway Driver
- EV: ₹20,00,000 purchase, 4 km/kWh efficiency (highway)
- ICE: ₹15,00,000 purchase, 18 km/l efficiency (highway)
- Usage: 25,000 km/year for 5 years
- **Result**: ICE remains cost-effective due to high usage and lower highway EV efficiency

## ⚠️ Important Considerations

### What This Tool Does
- Provides mathematical comparison of two financial strategies
- Shows potential outcomes based on your inputs
- Helps visualize the financial impact of each decision

### What This Tool Doesn't Account For
- **Risk factors** - Investment returns are not guaranteed
- **Tax implications** - Loan interest deductions, capital gains taxes
- **Market volatility** - Investment returns can fluctuate
- **Personal cash flow** - Your ability to service loan payments
- **Emergency funds** - Need for liquid cash reserves
- **Credit score impact** - Taking loans affects credit utilization
- **EV/ICE specific factors** - Charging infrastructure, battery degradation, fuel price volatility
- **Regional variations** - Different electricity rates, fuel costs, and incentives by location
- **Technology changes** - Rapidly evolving EV technology and costs

### Recommendation
**Always consult with a qualified financial advisor** before making major financial decisions. This tool is for educational and estimation purposes only.

## 🎨 Customization

The app uses Tailwind CSS and is easily customizable:

- **Colors**: Modify the color scheme in the Tailwind config
- **Layout**: Adjust the grid system and spacing
- **Calculations**: Update formulas in `script.js` for different scenarios
- **Validation**: Add more sophisticated input validation

## 🔧 Potential Enhancements

- **Tax calculations** - Include tax implications
- **Risk assessment** - Factor in investment risk levels
- **Multiple investment options** - Compare different investment vehicles
- **Loan comparison** - Compare multiple loan offers
- **Sensitivity analysis** - Show how results change with different assumptions
- **Historical data** - Use real market data for projections
- **Export functionality** - Save results as PDF or share via email
- **EV enhancements** - Battery degradation modeling, charging cost variations, home solar integration
- **Regional data** - Location-based fuel costs, electricity rates, and incentives
- **More calculators** - Add SIP, retirement, insurance, and other financial tools

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements or additional features!

---

**Disclaimer**: This tool provides estimates for educational purposes only. Investment returns are not guaranteed, and past performance does not predict future results. Always consult with qualified financial professionals before making investment or borrowing decisions.

