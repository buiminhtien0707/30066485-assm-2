// offline guest session helper until real accounts exist
window.guestSession = (function () {
  "use strict";

  function storageKey(baseKey) { return baseKey; }

  return {
    stateKey: storageKey
  };
})();
