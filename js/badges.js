window.awards = (function () {
  "use strict";

  function has(id) {
    return saveStore.load().badges.indexOf(id) !== -1;
  }

  function unlock(id) {
    var data = saveStore.load();
    if (data.badges.indexOf(id) !== -1) return false;
    data.badges.push(id);
    saveStore.save();
    var meta = gameConfig.AWARDS.filter(function (b) { return b.id === id; })[0];
    if (meta) {
      appShell.toast("🏅 " + lang.t("badge.toast", { x: lang.L(meta.name) }), "gold");
      sfx.win();
      if (window.loginModal) loginModal.onBadgeUnlocked();
    }
    return true;
  }

  function check(ev) {
    var data = saveStore.load();
    switch (ev) {
      case "lixi": return unlock("khai_xuan");
      case "first_round": if (data.stats.played === 1) return unlock("lac_lu"); break;
      case "first_loss": if (data.stats.lost === 1) return unlock("thua_vui"); break;
      case "streak3": if (data.stats.streak >= 3) return unlock("het_y"); break;
      case "quiz_perfect": return unlock("hoc_ba");
      case "animal_viewed":
        if (data.seenAnimals.length >= 6) return unlock("sau_mat");
        break;
      case "lab_run": return unlock("nha_toan");
      case "return_visit":
        if (data.stats._prevVisit) return unlock("khach_quen");
        break;
    }
    return false;
  }

  return { check: check, has: has, unlock: unlock };
})();
