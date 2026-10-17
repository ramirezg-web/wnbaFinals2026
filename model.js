/*
 * model.js — a small, transparent forecasting model. No dependencies; works in the browser and Node.
 *
 * 1. Ratings: ridge-regularized point-margin ratings (Massey-style). For each game,
 *    margin = homeAdv + rating(home) - rating(away) + noise. Ridge pulls ratings toward 0,
 *    which matters because there are only a handful of games per team.
 * 2. Game win probability: normal approximation, P(win) = Phi(expected margin / sigma).
 * 3. Series: exact dynamic programming over the 2-2-1-1-1 Finals format.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WNBAModel = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var HOME_PATTERN = [true, true, false, false, true, false, true]; // true = higher-seed team hosts

  function erf(x) {
    var s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function normCdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

  function solve(A, b) {
    var n = b.length, i, j, k;
    var M = A.map(function (row, r) { return row.slice().concat([b[r]]); });
    for (i = 0; i < n; i++) {
      var p = i;
      for (j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[p][i])) p = j;
      var tmp = M[i]; M[i] = M[p]; M[p] = tmp;
      for (j = i + 1; j < n; j++) {
        var f = M[j][i] / M[i][i];
        for (k = i; k <= n; k++) M[j][k] -= f * M[i][k];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  }

  function teamList(games) {
    var seen = {}, out = [];
    games.forEach(function (g) {
      [g.home, g.away].forEach(function (t) { if (!seen[t]) { seen[t] = true; out.push(t); } });
    });
    return out.sort();
  }

  function fitRatings(games, opts) {
    opts = opts || {};
    var homeAdv = opts.homeAdv == null ? 2.5 : opts.homeAdv;
    var lambda = opts.lambda == null ? 2 : opts.lambda;
    var teams = opts.teams || teamList(games);
    var idx = {}; teams.forEach(function (t, i) { idx[t] = i; });
    var n = teams.length, i, j;
    var A = [], b = [];
    for (i = 0; i < n; i++) { A.push(new Array(n).fill(0)); A[i][i] = lambda; b.push(0); }
    games.forEach(function (g) {
      var h = idx[g.home], a = idx[g.away];
      var y = (g.hs - g.as) - homeAdv;
      A[h][h] += 1; A[a][a] += 1; A[h][a] -= 1; A[a][h] -= 1;
      b[h] += y; b[a] -= y;
    });
    var r = solve(A, b), out = {};
    teams.forEach(function (t, k) { out[t] = r[k]; });
    return out;
  }

  function winProb(margin, sigma) { return normCdf(margin / sigma); }

  function gameProbs(ratings, A, B, homeAdv, sigma, pattern) {
    pattern = pattern || HOME_PATTERN;
    return pattern.map(function (aHome) {
      var m = ratings[A] - ratings[B] + (aHome ? homeAdv : -homeAdv);
      return winProb(m, sigma);
    });
  }

  // pA[k] = chance team A wins game k (k = 0-based game number). Returns P(A wins) and the outcome table.
  function seriesOutcome(pA, startA, startB, need) {
    need = need || 4; startA = startA || 0; startB = startB || 0;
    if (startA >= need || startB >= need) throw new Error("series already decided");
    if (pA.length < 2 * need - 1) throw new Error("need a probability for every possible game");
    var reach = [], a, b;
    for (a = 0; a <= need; a++) { reach.push(new Array(need + 1).fill(0)); }
    reach[startA][startB] = 1;
    for (var total = startA + startB; total < 2 * need - 1; total++) {
      for (a = 0; a < need; a++) {
        b = total - a;
        if (b < 0 || b >= need) continue;
        var p = pA[total], here = reach[a][b];
        reach[a + 1][b] += here * p;
        reach[a][b + 1] += here * (1 - p);
      }
    }
    var outcomes = [], pWin = 0, expGames = 0;
    for (b = 0; b < need; b++) { outcomes.push({ a: need, b: b, p: reach[need][b] }); pWin += reach[need][b]; expGames += reach[need][b] * (need + b); }
    for (a = 0; a < need; a++) { outcomes.push({ a: a, b: need, p: reach[a][need] }); expGames += reach[a][need] * (need + a); }
    return { pWin: pWin, outcomes: outcomes, expectedGames: expGames };
  }

  // Leave-one-game-out backtest: fit on every other game, predict the held-out game.
  function backtest(games, opts) {
    opts = opts || {};
    var sigma = opts.sigma == null ? 11 : opts.sigma;
    var homeAdv = opts.homeAdv == null ? 2.5 : opts.homeAdv;
    var teams = teamList(games);
    var rows = games.map(function (g, i) {
      var rest = games.filter(function (_, k) { return k !== i; });
      var r = fitRatings(rest, { homeAdv: homeAdv, lambda: opts.lambda, teams: teams });
      var p = winProb(r[g.home] - r[g.away] + homeAdv, sigma);
      return { game: g, p: p, homeWon: g.hs > g.as ? 1 : 0 };
    });
    return rows;
  }

  function score(rows, pFn) {
    var n = rows.length, correct = 0, brier = 0, ll = 0;
    rows.forEach(function (r) {
      var p = pFn(r);
      var pc = Math.min(1 - 1e-9, Math.max(1e-9, p));
      correct += ((p >= 0.5) === (r.homeWon === 1)) ? 1 : 0;
      brier += Math.pow(p - r.homeWon, 2);
      ll += -(r.homeWon * Math.log(pc) + (1 - r.homeWon) * Math.log(1 - pc));
    });
    return { n: n, accuracy: correct / n, brier: brier / n, logloss: ll / n };
  }

  return { HOME_PATTERN: HOME_PATTERN, normCdf: normCdf, fitRatings: fitRatings, winProb: winProb, gameProbs: gameProbs,
           seriesOutcome: seriesOutcome, backtest: backtest, score: score, teamList: teamList };
});
