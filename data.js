/*
 * data.js — completed 2026 WNBA playoff games used by the model.
 *
 * Source: final scores from the league's public playoff results (via a sports data feed),
 * collected on 2026-10-17. Dates are US local. This is a hand-checked snapshot, not a live feed.
 * Series results were cross-checked against the games below (for example GSV beat LVA 3-0).
 * Add new games to the end of `games` and rerun `node evals.js`.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WNBA26 = factory();
})(typeof self !== "undefined" ? self : this, function () {
  return {
    asOf: "2026-10-17",
    teams: {
      ATL: { name: "Atlanta Dream", seed: 4 },
      GSV: { name: "Golden State Valkyries", seed: 2 },
      LVA: { name: "Las Vegas Aces", seed: 3 },
      NYL: { name: "New York Liberty", seed: 8 },
      MIN: { name: "Minnesota Lynx", seed: 1 },
      IND: { name: "Indiana Fever", seed: 6 },
      WAS: { name: "Washington Mystics", seed: 5 },
      DAL: { name: "Dallas Wings", seed: 7 }
    },
    games: [
      { date: "2026-09-27", round: "First round, G1", home: "MIN", away: "NYL", hs: 75, as: 91 },
      { date: "2026-09-27", round: "First round, G1", home: "LVA", away: "IND", hs: 102, as: 85 },
      { date: "2026-09-27", round: "First round, G1", home: "ATL", away: "WAS", hs: 92, as: 77 },
      { date: "2026-09-27", round: "First round, G1", home: "GSV", away: "DAL", hs: 104, as: 80 },
      { date: "2026-09-29", round: "First round, G2", home: "IND", away: "LVA", hs: 99, as: 89 },
      { date: "2026-09-29", round: "First round, G2", home: "NYL", away: "MIN", hs: 87, as: 71 },
      { date: "2026-09-30", round: "First round, G2", home: "WAS", away: "ATL", hs: 75, as: 93 },
      { date: "2026-09-30", round: "First round, G2", home: "DAL", away: "GSV", hs: 108, as: 100 },
      { date: "2026-10-01", round: "First round, G3", home: "LVA", away: "IND", hs: 94, as: 83 },
      { date: "2026-10-02", round: "First round, G3", home: "GSV", away: "DAL", hs: 77, as: 73 },
      { date: "2026-10-04", round: "Semifinal, G1", home: "ATL", away: "NYL", hs: 92, as: 82 },
      { date: "2026-10-04", round: "Semifinal, G1", home: "GSV", away: "LVA", hs: 71, as: 60 },
      { date: "2026-10-07", round: "Semifinal, G2", home: "ATL", away: "NYL", hs: 101, as: 98 },
      { date: "2026-10-07", round: "Semifinal, G2", home: "GSV", away: "LVA", hs: 83, as: 81 },
      { date: "2026-10-09", round: "Semifinal, G3", home: "NYL", away: "ATL", hs: 83, as: 85 },
      { date: "2026-10-09", round: "Semifinal, G3", home: "LVA", away: "GSV", hs: 77, as: 87 }
    ]
  };
});
