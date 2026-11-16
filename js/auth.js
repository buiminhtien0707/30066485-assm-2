/* auth.js — lightweight prototype stub (no backend database).
   Accounts & cloud sync are marked "Coming Soon" in the UI; store.js stays
   in Guest mode ("bc_state_v1") so users play immediately offline. */
window.BCAuth = (function () {
  "use strict";

  var AVATARS = ["bau", "cua", "tom", "ca", "ga", "huou"];

  function storageOk() {
    try {
      localStorage.setItem("bc_probe", "1");
      localStorage.removeItem("bc_probe");
      return true;
    } catch (e) { return false; }
  }

  function stateKey(base) { return base; }
  function users() { return []; }
  function current() { return null; }
  function currentId() { return null; }

  return {
    AVATARS: AVATARS,
    storageOk: storageOk,
    stateKey: stateKey,
    users: users,
    current: current,
    currentId: currentId
  };
})();
