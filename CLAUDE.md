# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Financial calculator web app hosted at `fin-calculators.vercel.app`. Built with Vite + vanilla JS + Tailwind CSS v4. Zero runtime dependencies.

## Development

```bash
npm install        # Install dev dependencies (vite, tailwindcss)
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Build to dist/
npm run preview    # Preview production build
```

Deploy is handled via Vercel (auto-detects Vite).

## Architecture

```
src/
  index.html                    # Single-page HTML with all calculator markup
  main.js                       # Entry point: tab navigation, calculator init
  styles.css                    # Tailwind CSS v4 directives + custom styles
  calculators/
    home-loan.js                # Home loan amortization with prepayment strategies
    loan-vs-cash.js             # Loan-vs-cash investment comparison
    ev-vs-ice.js                # EV vs ICE total cost of ownership
    goal.js                     # Savings goal planning with inflation
    personal-finance-rules.js   # Rule of 72, 50-30-20, etc.
  utils/
    currency.js                 # formatCurrency, formatCurrencyDecimal, formatCurrencyShort
    storage.js                  # saveForm/loadForm localStorage helpers
    charts.js                   # SVG chart primitives (createSvg, createPath, etc.)
public/
  robots.txt, sitemap.xml       # Static assets served as-is
```

### Calculator Pattern

Each calculator is an ES module exporting a class. All follow the same pattern:
`constructor` → `loadSavedValues()` → `initEventListeners()` → `calculate()` on valid input

### Key Patterns

- All currency is INR (₹)
- Charts are inline SVG generated via shared utils in `charts.js`
- Tailwind CSS v4 compiled at build time (no CDN)
- Tab system uses `data-tab` attributes; last active tab persisted in localStorage
- Form state persisted per-calculator in localStorage via `storage.js`
