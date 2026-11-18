window.saveStore = (function () {
  "use strict";
  var SAVE_KEY = "bc_state_v1";

  var baseState = {
    v: 1, lang: "en", muted: false,
    balance: 1000, lastLiXi: "", lastVisit: "",
    dailyStreak: 0, dailyLast: "",
    rounds: [],
    stats: { played: 0, won: 0, lost: 0, streak: 0, bestStreak: 0, peak: 1000 },
    badges: [], bestQuiz: 0, seenAnimals: [],
    coachDone: false, letters: []
  };

  var cache = null;
  var activeKey = null;

  function resolveKey() {
    return window.guestSession ? guestSession.stateKey(SAVE_KEY) : SAVE_KEY;
  }

  function makeEmpty() {
    return JSON.parse(JSON.stringify(baseState));
  }

  function readStorage(k) {
    var parsed = null;
    try {
      var raw = localStorage.getItem(k);
      parsed = raw ? JSON.parse(raw) : null;
    } catch (e) {
      parsed = null;
    }
    if (!parsed || parsed.v !== baseState.v) parsed = makeEmpty();
    // backfill fields added in later prototype updates
    Object.keys(baseState).forEach(function (field) {
      if (parsed[field] === undefined) {
        parsed[field] = JSON.parse(JSON.stringify(baseState[field]));
      }
    });
    return parsed;
  }

  function load() {
    var k = resolveKey();
    if (cache && activeKey === k) return cache;
    activeKey = k;
    cache = readStorage(k);
    var pickedLang = false;
    try { pickedLang = localStorage.getItem("bc_lang_user_chosen") === "true"; } catch (e) {}
    if (!pickedLang) cache.lang = "en";
    return cache;
  }

  function save() {
    if (!cache) load();
    try {
      localStorage.setItem(resolveKey(), JSON.stringify(cache));
    } catch (e) {
      // private browsing can block localStorage, keep playing in memory
    }
  }

  function reload() {
    cache = null;
    activeKey = null;
    return load();
  }

  function reset() {
    try { localStorage.removeItem(resolveKey()); } catch (e) {}
    cache = null;
    activeKey = null;
    load();
  }

  return {
    BASE: SAVE_KEY,
    load: load,
    save: save,
    reload: reload,
    reset: reset
  };
})();
