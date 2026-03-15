# TODOS

## P3 — Nice to Have

### Add smoke tests for calculators

- **What:** Add Vitest with one test per calculator verifying calculation output for known inputs.
- **Why:** The Vite rewrite ported all logic 1:1 but there's no automated way to verify correctness. Manual testing is the only verification today.
- **Effort:** S (small — ~30 min)
- **Context:** Each calculator class has pure calculation methods (e.g., `calculateEMI`, `calculateFutureCost`, `calculateEVTCO`) that can be tested in isolation without DOM. Start there.
