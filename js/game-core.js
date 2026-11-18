window.diceMath = (function () {
  "use strict";

  var EMOJI = { bau: "🍈", cua: "🦀", tom: "🦐", ca: "🐟", ga: "🐔", huou: "🦌" };

  function rollDice() {
    var faces = ["bau", "cua", "tom", "ca", "ga", "huou"];
    var out = [];
    for (var i = 0; i < 3; i++) {
      if (window.crypto && crypto.getRandomValues) {
        out.push(faces[crypto.getRandomValues(new Uint32Array(1))[0] % 6]);
      } else {
        out.push(faces[Math.floor(Math.random() * 6)]);
      }
    }
    return out;
  }

  // 0 matches loses stake; 1/2/3 matches returns stake plus k*bet
  function evaluate(bets, dice) {
    var totalBet = 0, totalPay = 0, topMatches = 0;
    var hitsById = {};
    Object.keys(bets).forEach(function (id) {
      var amt = bets[id] || 0;
      totalBet += amt;
      var k = dice.filter(function (d) { return d === id; }).length;
      hitsById[id] = k;
      topMatches = Math.max(topMatches, k);
      totalPay += k === 0 ? 0 : amt * (k + 1);
    });
    return { staked: totalBet, payout: totalPay, net: totalPay - totalBet, perCell: hitsById, matches: topMatches };
  }

  return { EMOJI: EMOJI, rollDice: rollDice, evaluate: evaluate };
})();
