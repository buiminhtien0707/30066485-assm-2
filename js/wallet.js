window.coinBank = (function () {
  "use strict";

  var subs = [];
  var staged = {};
  var stack = [];
  var prevBets = {};
  var prevStake = 0;
  var CELL_LIMIT = 500;
  var DAILY_BASE = 2000;
  var DAILY_STEP = 100;

  function st() { return saveStore.load(); }
  function notify() { subs.forEach(function (fn) { fn(); }); }
  function onChange(fn) { subs.push(fn); }

  function holdTotal() {
    return Object.keys(staged).reduce(function (sum, id) { return sum + staged[id]; }, 0);
  }

  function addHold(id, amt) {
    if ((staged[id] || 0) + amt > CELL_LIMIT) {
      return { ok: false, reason: "max_bet", max: CELL_LIMIT };
    }
    if (holdTotal() + amt > st().balance) {
      return { ok: false, reason: "broke" };
    }
    staged[id] = (staged[id] || 0) + amt;
    stack.push({ id: id, amt: amt });
    return { ok: true };
  }

  function removeAnimalHold(id) {
    if (!staged[id]) return 0;
    var amt = staged[id];
    delete staged[id];
    stack = stack.filter(function (item) { return item.id !== id; });
    return amt;
  }

  function undoHold() {
    var top = stack.pop();
    if (!top) return false;
    staged[top.id] -= top.amt;
    if (staged[top.id] <= 0) delete staged[top.id];
    return true;
  }

  function clearHolds() { staged = {}; stack = []; }
  function saveBets() { prevBets = JSON.parse(JSON.stringify(staged)); }

  function rebet() {
    if (!Object.keys(prevBets).length) return false;
    var sum = Object.keys(prevBets).reduce(function (acc, id) { return acc + prevBets[id]; }, 0);
    if (sum > st().balance) return false;
    staged = JSON.parse(JSON.stringify(prevBets));
    return true;
  }

  function commit() {
    var total = holdTotal();
    prevStake = total;
    st().balance -= total;
    saveBets();
    clearHolds();
    saveStore.save();
    notify();
    return total;
  }

  function settle(dice) {
    var data = st();
    var payout = 0, topHits = 0;
    var hitsMap = {};
    Object.keys(prevBets).forEach(function (id) {
      var bet = prevBets[id] || 0;
      if (!bet) return;
      var k = dice.filter(function (d) { return d === id; }).length;
      hitsMap[id] = k;
      topHits = Math.max(topHits, k);
      payout += k === 0 ? 0 : bet * (k + 1);
    });
    data.balance += payout;
    var net = payout - prevStake;
    data.stats.played += 1;
    if (net > 0) {
      data.stats.won += 1;
      data.stats.streak += 1;
      data.stats.bestStreak = Math.max(data.stats.bestStreak, data.stats.streak);
    } else if (net < 0) {
      data.stats.lost += 1;
      data.stats.streak = 0;
    }
    data.rounds.unshift({ dice: dice, net: net });
    data.rounds = data.rounds.slice(0, 10);
    data.stats.peak = Math.max(data.stats.peak, data.balance);
    saveStore.save();
    notify();
    return { net: net, perCell: hitsMap, matches: topHits };
  }

  function dayReward(dayNum) {
    return DAILY_BASE + Math.max(0, dayNum - 1) * DAILY_STEP;
  }

  function dayKey(d) {
    var dt = d || new Date();
    var y = dt.getFullYear();
    var m = String(dt.getMonth() + 1).padStart(2, "0");
    var dd = String(dt.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + dd;
  }

  function today() { return dayKey(new Date()); }
  function yesterday() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return dayKey(d);
  }

  function dailyStatus() {
    var data = st();
    var t = today();
    var y = yesterday();
    var doneToday = data.dailyLast === t;
    var streakRaw = Number(data.dailyStreak) || 0;
    var completed = 0;
    if (doneToday) completed = Math.max(streakRaw, 1);
    else if (data.dailyLast === y) completed = Math.max(streakRaw, 0);

    var curDay = doneToday ? completed : completed + 1;
    var todayAmt = dayReward(curDay);
    var nextAmt = doneToday ? dayReward(completed + 1) : todayAmt;
    var blockStart = Math.floor((curDay - 1) / 7) * 7 + 1;
    var days = [];
    for (var i = 0; i < 7; i++) {
      var dNum = blockStart + i;
      days.push({
        day: dNum,
        amount: dayReward(dNum),
        done: dNum <= completed,
        ready: !doneToday && dNum === curDay,
        isSeventh: i === 6
      });
    }
    return {
      days: days,
      claimedToday: doneToday,
      completed: completed,
      todayDay: curDay,
      todayAmount: todayAmt,
      nextAmount: nextAmt
    };
  }

  function claimDaily() {
    var info = dailyStatus();
    if (info.claimedToday) return { ok: false, amount: 0, day: info.todayDay };
    var data = st();
    var nextDay = info.completed + 1;
    var amt = dayReward(nextDay);
    data.balance += amt;
    data.stats.peak = Math.max(data.stats.peak, data.balance);
    data.dailyStreak = nextDay;
    data.dailyLast = today();
    saveStore.save();
    notify();
    return { ok: true, amount: amt, day: data.dailyStreak };
  }

  function canClaimLiXi() { return true; }

  function claimLiXi() {
    var data = st();
    data.balance += 500;
    data.lastLiXi = today();
    data.stats.peak = Math.max(data.stats.peak, data.balance);
    saveStore.save();
    notify();
    return true;
  }

  function touchVisit() {
    var data = st();
    var t = today();
    if (data.lastVisit && data.lastVisit !== t) data.stats._prevVisit = data.lastVisit;
    data.lastVisit = t;
    saveStore.save();
  }

  return {
    onChange: onChange,
    balance: function () { return st().balance; },
    holdTotal: holdTotal,
    addHold: addHold,
    removeAnimalHold: removeAnimalHold,
    undoHold: undoHold,
    clearHolds: clearHolds,
    commit: commit,
    settle: settle,
    rebet: rebet,
    hasLastBets: function () { return Object.keys(prevBets).length > 0; },
    canClaimLiXi: canClaimLiXi,
    claimLiXi: claimLiXi,
    dailyStatus: dailyStatus,
    claimDaily: claimDaily,
    touchVisit: touchVisit,
    lastBets: function () { return prevBets; },
    holds: function () { return JSON.parse(JSON.stringify(staged)); },
    MAX_PER_ANIMAL: CELL_LIMIT
  };
})();
