window.simLab = (function () {
  "use strict";

  var pickMode = 1, totalRuns = 100, pace = "slow", busy = false;
  var hitBins = [0, 0, 0, 0];
  var bankSeries = [1000];
  var wagerSum = 0;

  function boot() {
    if (!document.querySelector("#lab-root")) return;
    document.querySelectorAll('input[name="cells"]').forEach(function (inp) {
      inp.addEventListener("change", function () { pickMode = Number(inp.value); });
    });
    document.querySelectorAll('input[name="rounds"]').forEach(function (inp) {
      inp.addEventListener("change", function () { totalRuns = Number(inp.value); });
    });
    document.querySelectorAll('input[name="speed"]').forEach(function (inp) {
      inp.addEventListener("change", function () { pace = inp.value; });
      if (inp.checked) pace = inp.value;
    });
    document.querySelector("[data-act=lab-run]").addEventListener("click", startSim);
    lang.onLangChange(function () { simCanvas.draw(hitBins, bankSeries); });
    runPreview(100);
  }
  document.addEventListener("DOMContentLoaded", boot);

  function runPreview(rounds) {
    hitBins = [0, 0, 0, 0];
    bankSeries = [1000];
    wagerSum = 0;
    var coins = 1000;
    for (var i = 0; i < rounds; i++) {
      var dice = diceMath.rollDice();
      var bets = pickMode === 1 ? { bau: 100 } : { bau: 100, cua: 100, tom: 100 };
      var res = diceMath.evaluate(bets, dice);
      coins += res.payout - res.staked;
      bankSeries.push(coins);
      hitBins[res.matches] += 1;
      wagerSum += res.staked;
    }
    simCanvas.draw(hitBins, bankSeries);
    if (statusEl()) statusEl().textContent = lang.t("lab.done", { x: rounds });
  }

  function startSim() {
    if (busy) return;
    busy = true;
    var done = 0;
    hitBins = [0, 0, 0, 0];
    bankSeries = [1000];
    wagerSum = 0;
    var coins = 1000;
    var btn = document.querySelector("[data-act=lab-run]");
    if (btn) btn.disabled = true;

    function playOneRound() {
      var dice = diceMath.rollDice();
      var bets = pickMode === 1 ? { bau: 100 } : { bau: 100, cua: 100, tom: 100 };
      var res = diceMath.evaluate(bets, dice);
      coins += res.payout - res.staked;
      bankSeries.push(coins);
      hitBins[res.matches] += 1;
      wagerSum += res.staked;
      done++;
    }

    function tickOne() {
      playOneRound();
      simCanvas.draw(hitBins, bankSeries);
      var pct = Math.floor((done / totalRuns) * 100);
      statusEl().textContent = lang.t("lab.progress", { x: pct, d: done, r: totalRuns, c: coins.toLocaleString("vi-VN") });

      if (done < totalRuns) setTimeout(tickOne, 75);
      else finish();
    }

    function runBatch() {
      var target = Math.min(done + 25, totalRuns);
      for (; done < target; done++) playOneRound();
      simCanvas.draw(hitBins, bankSeries);
      var pct = Math.floor((done / totalRuns) * 100);
      statusEl().textContent = lang.t("lab.progress", { x: pct, d: done, r: totalRuns, c: coins.toLocaleString("vi-VN") });
      if (done < totalRuns) requestAnimationFrame(runBatch);
      else finish();
    }

    function finish() {
      statusEl().textContent = lang.t("lab.done", { x: totalRuns });
      busy = false;
      if (btn) btn.disabled = false;
      awards.check("lab_run");
      sfx.pop();
    }

    if (pace === "slow") tickOne();
    else requestAnimationFrame(runBatch);
  }

  function statusEl() { return document.querySelector("#lab-live"); }

  return { boot: boot, run: startSim };
})();
