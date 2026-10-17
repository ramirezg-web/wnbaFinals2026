/*
 * evals.js — tests for the math, plus an honest backtest. Run with:  node evals.js
 * Part 1 checks the code against answers you can verify by hand.
 * Part 2 reports how well the ratings predict held-out games, next to simple baselines.
 */
const M = require("./model.js");
const D = require("./data.js");

let failed = 0;
function check(name, ok, detail) {
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  (" + detail + ")" : ""));
  if (!ok) failed++;
}
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);

console.log("Part 1: correctness");
check("normal CDF at 0 is 0.5", near(M.normCdf(0), 0.5, 1e-6));
check("normal CDF at 1.96 is about 0.975", near(M.normCdf(1.96), 0.975, 1e-3));
check("series at 50% a game is 50%", near(M.seriesOutcome(new Array(7).fill(0.5), 0, 0).pWin, 0.5));
check("best-of-7 at 60% a game is 71.0% (known value 0.7102)", near(M.seriesOutcome(new Array(7).fill(0.6), 0, 0).pWin, 0.710208, 1e-5));
const dist = M.seriesOutcome(new Array(7).fill(0.57), 0, 0);
check("outcome probabilities sum to 1", near(dist.outcomes.reduce((s, o) => s + o.p, 0), 1));
check("up 3-0 at 50% a game is 93.75%", near(M.seriesOutcome(new Array(7).fill(0.5), 3, 0).pWin, 0.9375));
const sure = M.seriesOutcome(new Array(7).fill(1), 0, 0);
check("a sure winner sweeps 4-0", near(sure.outcomes.find((o) => o.a === 4 && o.b === 0).p, 1));
let threw = false; try { M.seriesOutcome(new Array(7).fill(0.5), 4, 1); } catch (e) { threw = true; }
check("a finished series is rejected", threw);

const ratings = M.fitRatings(D.games, { homeAdv: 2.5, lambda: 2 });
const sum = Object.values(ratings).reduce((s, v) => s + v, 0);
check("ratings sum to zero", near(sum, 0, 1e-9), "sum " + sum.toExponential(1));
check("GSV rated above LVA (swept them 3-0)", ratings.GSV > ratings.LVA);
check("ATL rated above NYL (swept them 3-0)", ratings.ATL > ratings.NYL);
check("ATL rated above WAS (swept them 2-0)", ratings.ATL > ratings.WAS);
const gp = M.gameProbs(ratings, "GSV", "ATL", 2.5, 11);
check("game probabilities are between 0 and 1", gp.every((p) => p > 0 && p < 1));
check("home court helps: GSV is likelier to win its home games than ATL's", gp[0] > gp[2]);

console.log("\nPart 2: backtest (leave one game out, n = " + D.games.length + ")");
const rows = M.backtest(D.games, { homeAdv: 2.5, sigma: 11, lambda: 2 });
const model = M.score(rows, (r) => r.p);
const coin = M.score(rows, () => 0.5);
const alwaysHome = M.score(rows, () => 0.99);
const f = (x) => x.toFixed(3);
console.log("model        accuracy " + f(model.accuracy) + "  brier " + f(model.brier) + "  logloss " + f(model.logloss));
console.log("coin flip    accuracy 0.500 (by definition)  brier " + f(coin.brier) + "  logloss " + f(coin.logloss));
console.log("pick home    accuracy " + f(alwaysHome.accuracy) + "  brier " + f(alwaysHome.brier) + "  (always picks the home team, 99% confident)");
console.log(model.accuracy > alwaysHome.accuracy ? "The model picks winners better than always picking the home team." : "The model picks winners no better than always picking the home team; its edge is in calibrated probabilities, not in picks.");
console.log(model.brier < coin.brier ? "The model beats a coin flip on Brier score." : "The model does NOT beat a coin flip on Brier score.");
console.log("Home teams won " + rows.filter((r) => r.homeWon).length + " of " + rows.length + " games.");
console.log("\nSensitivity to the home-court assumption (brier, lower is better):");
[0, 1.5, 2.5, 4].forEach((h) => {
  const s = M.score(M.backtest(D.games, { homeAdv: h, sigma: 11, lambda: 2 }), (r) => r.p);
  console.log("  home advantage " + h + " pts: brier " + f(s.brier) + ", accuracy " + f(s.accuracy));
});
console.log("\nCaution: " + D.games.length + " games is far too few to trust any of these numbers. Treat them as a demo of the method.");
process.exitCode = failed ? 1 : 0;
console.log(failed ? "\n" + failed + " check(s) failed" : "\nAll correctness checks passed");
