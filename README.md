# Financial Calculators 💰

A smart suite of financial decision tools to help you make better money choices. Includes:
- **LoanOrNot**: Decide whether to take a loan and invest your cash, or pay upfront for a purchase.
- **Goal Calculator**: Find out how much you need to save each month to reach a future financial goal, accounting for inflation and your existing investments.

## 🎯 Purpose

This app helps you answer two key questions:
- Should you take a loan and invest your cash, or pay upfront?
- How much should you save each month to reach a goal in X years, given inflation and your current savings?

## 🚀 Features

- **Multi-tab UI**: Switch between different calculators (LoanOrNot, Goal Calculator, more coming soon)
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

## 🏃‍♂️ Getting Started

1. **Clone or download** the project files
2. **Open `index.html`** in any modern web browser
3. **Choose a calculator tab** (LoanOrNot or Goal Calculator)
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
- **More calculators** - Add SIP, retirement, and other financial tools

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements or additional features!

---

**Disclaimer**: This tool provides estimates for educational purposes only. Investment returns are not guaranteed, and past performance does not predict future results. Always consult with qualified financial professionals before making investment or borrowing decisions.

