# WNBA Finals Series Forecaster

A small, transparent model that turns 2026 WNBA playoff scores into team ratings and an exact best-of-7 series forecast. Static site: no backend, no accounts, no tracking.

## How it works
1. **Ratings** (`model.js`): ridge-regularized Massey ratings from the margins of the 16 completed 2026 playoff games, with a home-court adjustment.
2. **One game**: win probability = normal CDF of (rating gap ± home advantage) / noise.
3. **Series**: exact dynamic programming over the 2-2-1-1-1 format from the current series score.

## Run it
Open `index.html`. Nothing to install.
Tests: `node evals.js` (14 correctness checks, leave-one-game-out backtest, home-advantage sensitivity).

## Deploy
Drag this folder onto https://app.netlify.com/drop, or push it to a GitHub repo and enable Pages.

## Honest limits
- 16 games is a tiny sample. The backtest (accuracy 0.75, Brier 0.159 vs 0.250 for a coin flip) shows the method works, not that it is a strong predictor. Always picking the home team is equally accurate here.
- Ignores injuries, rest, matchups and lineups.
- Home advantage and noise are assumptions exposed as sliders.
- Scores are a hand-checked snapshot (see `data.js`); update `data.js` to refresh.
- Educational only. Not betting advice. Not affiliated with the WNBA or any team.

Built with the help of Claude.
