window.playTable = (function () {
  "use strict";

  var phase = "IDLE";
  var chipVal = 100;
  var shakeTimer = null;
  var prevBalance = 0;

  function $(sel) { return document.querySelector(sel); }
  function findMascot(id) {
    return gameConfig.MASCOTS.filter(function (a) { return a.id === id; })[0];
  }

  function drawGrid() {
    var grid = $(".board");
    grid.innerHTML = "";
    gameConfig.MASCOTS.forEach(function (a, idx) {
      var cell = document.createElement("button");
      cell.className = "cell";
      cell.dataset.animal = a.id;
      cell.setAttribute("aria-label", lang.L(a.name));
      cell.setAttribute("aria-keyshortcuts", String(idx + 1));
      cell.innerHTML =
        '<span class="name">' + lang.L(a.name) + "</span>" +
        '<span class="key-hint" aria-hidden="true">[' + (idx + 1) + "]</span>" +
        '<img src="' + a.img + '" alt="">' +
        '<span class="amt"></span>';
      cell.addEventListener("click", function (e) {
        if (e.target.closest(".amt-del")) {
          e.stopPropagation();
          e.preventDefault();
          dropAnimal(a.id);
          return;
        }
        tapCell(a.id);
      });
      cell.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        dropAnimal(a.id);
      });
      grid.appendChild(cell);
    });
  }

  function drawChips() {
    var tray = $(".chip-tray");
    tray.innerHTML = "";
    [10, 50, 100, 500].forEach(function (val) {
      var chip = document.createElement("button");
      chip.className = "chip" + (val === chipVal ? " selected" : "");
      chip.dataset.value = val;
      chip.textContent = val;
      chip.setAttribute("aria-label", val + " xu");
      chip.addEventListener("click", function () {
        chipVal = val;
        document.querySelectorAll(".chip").forEach(function (c) {
          c.classList.toggle("selected", c === chip);
        });
        sfx.chip();
      });
      tray.appendChild(chip);
    });
    syncChips();
  }

  function syncChips() {
    var cashLeft = coinBank.balance() - coinBank.holdTotal();
    document.querySelectorAll(".chip").forEach(function (c) {
      c.disabled = Number(c.dataset.value) > cashLeft;
    });
    var usableChip = document.querySelector(".chip:not(:disabled)");
    var pickedEl = document.querySelector(".chip.selected");
    if (usableChip && pickedEl && Number(pickedEl.dataset.value) > cashLeft) {
      document.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
      usableChip.classList.add("selected");
      chipVal = Number(usableChip.dataset.value);
    }
    var undoBtn = $("[data-act=undo]");
    if (undoBtn) undoBtn.disabled = coinBank.holdTotal() === 0;
    var clearBtn = $("[data-act=clear]");
    if (clearBtn) clearBtn.disabled = coinBank.holdTotal() === 0;
    var rebetBtn = $("[data-act=rebet]");
    if (rebetBtn) rebetBtn.disabled = !coinBank.hasLastBets();
  }

  function paintBets() {
    var staged = coinBank.holds();
    var grid = document.querySelector(".board");
    var hasAny = false;
    document.querySelectorAll(".cell").forEach(function (cell) {
      var id = cell.dataset.animal;
      var amt = staged[id] || 0;
      var hitCap = amt >= coinBank.MAX_PER_ANIMAL;
      var active = amt > 0;
      if (active) hasAny = true;
      cell.classList.toggle("selected", active);
      cell.setAttribute("aria-pressed", active ? "true" : "false");
      cell.classList.toggle("has-bet", amt > 0);
      cell.classList.toggle("is-max-bet", hitCap);
      var amtEl = cell.querySelector(".amt");
      if (amt > 0) {
        amtEl.innerHTML =
          '<span class="amt-val">' + amt.toLocaleString("vi-VN") + (hitCap ? ' <span class="amt-max">MAX</span>' : "") + "</span>" +
          '<button type="button" class="amt-del" title="' + lang.t("play.clearAnimalTip") + '" aria-label="' + lang.t("play.clearAnimalTip") + '">✕</button>';
        amtEl.classList.remove("pop");
        void amtEl.offsetWidth;
        amtEl.classList.add("pop");
      } else {
        amtEl.innerHTML = "";
      }
    });
    if (grid) grid.classList.toggle("has-selection", hasAny);
    syncChips();
  }

  function dropAnimal(id) {
    if (phase !== "IDLE") return;
    var freed = coinBank.removeAnimalHold(id);
    if (freed > 0) {
      sfx.pop();
      var mascot = findMascot(id);
      appShell.toast(lang.t("play.clearedAnimal", { name: lang.L(mascot.name), n: freed.toLocaleString("vi-VN") }));
      paintBets();
    }
  }

  function tapCell(id) {
    if (phase !== "IDLE") return;
    var res = coinBank.addHold(id, chipVal);
    if (!res.ok) {
      if (res.reason === "max_bet") {
        appShell.toast(lang.t("play.maxBet", { n: coinBank.MAX_PER_ANIMAL }), "lose");
        sfx.thud();
      } else {
        appShell.toast(lang.t("play.broke"), "lose");
      }
      return;
    }
    sfx.chip();
    paintBets();
  }

  function rollBowl() {
    if (phase !== "IDLE") return;
    if (coinBank.holdTotal() === 0) {
      appShell.toast(lang.t("play.needBet"), "lose");
      return;
    }
    phase = "SHAKING";
    var staticMode = appShell.reducedMotion();
    prevBalance = coinBank.balance();
    coinBank.commit();
    setBusy(true);
    setStatus(lang.t("play.statusShake"));
    $("[data-act=shake]").disabled = true;
    $("[data-act=rebet]").disabled = true;

    var secs = staticMode ? 0.4 : 1.5;
    sfx.rattle(secs);
    if (!staticMode && "vibrate" in navigator) {
      try { navigator.vibrate([25, 40, 30, 40, 35]); } catch (e) {}
    }
    var bowlEl = $(".bowl");
    bowlEl.classList.remove("lifted");
    bowlEl.classList.add("shaking");
    shakeTimer = setTimeout(revealBowl, secs * 1000);
  }

  function revealBowl() {
    shakeTimer = null;
    var dice = diceMath.rollDice();
    var res = coinBank.settle(dice);
    var staticMode = appShell.reducedMotion();

    var bowlEl = $(".bowl");
    bowlEl.classList.remove("shaking");
    bowlEl.classList.add("lifted");
    showDice(dice, staticMode ? 0 : 260);
    flashMatched(res.perCell, staticMode ? 0 : 500);

    var msgKey = res.net > 0
      ? (res.matches > 1 ? "play.statusWin" : "play.statusWinOnly")
      : (res.net === 0 ? "play.statusBreak" : "play.statusLose");
    var msg = lang.t(msgKey, { x: res.matches, n: Math.abs(res.net) });
    setStatus(msg);
    floatDelta(res.net);
    pulseCoins();
    if (!staticMode && "vibrate" in navigator) {
      try {
        if (res.net > 0) navigator.vibrate(res.matches >= 2 ? [60, 80, 100, 80, 120] : [40, 60, 40]);
      } catch (e) {}
    }
    if (res.net > 0) anim.confetti(res.matches >= 2 || res.net >= 200);
    else if (res.net < 0) anim.shake(document.querySelector(".board"), "lose-shake");

    appShell.toast(msg, res.net > 0 ? "win" : (res.net === 0 ? "gold" : "lose"));
    tweenCoinPill();
    paintHistory();
    paintBets();

    $("[data-act=shake]").disabled = false;
    setBusy(false);

    awards.check("first_round");
    awards.check("first_loss");
    awards.check("streak3");
    resetStatusSoon(2.6);
  }

  function tweenCoinPill() {
    anim.countUp(document.querySelector(".coin-pill span"), prevBalance, coinBank.balance(), 700, lang.t("unit.xu"));
  }

  function resetStatusSoon(secs) {
    setTimeout(function () {
      if (phase === "IDLE") setStatus(lang.t("play.statusIdle"));
    }, secs * 1000);
  }

  function showDice(dice, staggerMs) {
    var row = $(".dice-row");
    row.innerHTML = "";
    dice.forEach(function (id, idx) {
      var die = document.createElement("div");
      die.className = "die";
      var img = document.createElement("img");
      img.src = "assets/img/animals/" + id + ".svg";
      img.alt = lang.L(findMascot(id).name);
      img.width = 42;
      img.height = 42;
      img.style.imageRendering = "pixelated";
      die.appendChild(img);
      var lbl = document.createElement("span");
      lbl.className = "die-name";
      lbl.textContent = lang.L(findMascot(id).name);
      die.appendChild(lbl);
      die.setAttribute("aria-label", lang.L(findMascot(id).name));
      if (staggerMs) {
        setTimeout(function () {
          row.appendChild(die);
          sfx.clack(520 + idx * 140);
        }, staggerMs * idx);
      } else {
        row.appendChild(die);
      }
    });
  }

  function flashMatched(hitsMap, delayMs) {
    setTimeout(function () {
      document.querySelectorAll(".cell").forEach(function (c) {
        var k = hitsMap[c.dataset.animal] || 0;
        c.classList.toggle("win-flash", k > 0);
      });
      setTimeout(function () {
        document.querySelectorAll(".cell").forEach(function (c) { c.classList.remove("win-flash"); });
      }, 2200);
    }, delayMs);
  }

  function paintHistory() {
    var data = saveStore.load();
    var strip = $(".history-strip");
    strip.innerHTML = "";
    if (!data.rounds.length) {
      strip.innerHTML = '<span class="mut">' + lang.t("play.historyEmpty") + "</span>";
      return;
    }
    data.rounds.forEach(function (r) {
      var card = document.createElement("div");
      card.className = "hist-round";
      card.innerHTML = r.dice.map(function (id) {
        return '<img src="assets/img/animals/' + id + '.svg" width="22" height="22" alt="" style="image-rendering:pixelated;vertical-align:middle;margin:0 2px">';
      }).join("") +
        '<span class="net ' + (r.net > 0 ? "pos" : "neg") + '">' +
        (r.net > 0 ? "+" : "") + r.net + "</span>";
      strip.appendChild(card);
    });
  }

  function floatDelta(net) {
    var zone = document.querySelector(".bowl-zone");
    if (!zone) return;
    var el = document.createElement("div");
    var cls = net > 0 ? "plus" : (net === 0 ? "zero" : "minus");
    el.className = "float-xu " + cls;
    var key = net > 0 ? "float.plus" : (net === 0 ? "float.zero" : "float.minus");
    el.textContent = net === 0 ? lang.t(key) : lang.t(key, { n: Math.abs(net).toLocaleString("vi-VN") });
    zone.appendChild(el);
    setTimeout(function () { el.remove(); }, 1500);
  }

  function pulseCoins() {
    var pill = document.querySelector(".coin-pill");
    if (!pill) return;
    pill.classList.remove("bump");
    void pill.offsetWidth;
    pill.classList.add("bump");
    setTimeout(function () { pill.classList.remove("bump"); }, 500);
  }

  function setStatus(txt) { $(".status-line").textContent = txt; }

  function setBusy(busy) {
    phase = busy ? "SHAKING" : "IDLE";
    $(".board").classList.toggle("locked", busy);
  }

  function boot() {
    drawGrid(); drawChips(); paintHistory();
    setStatus(lang.t("play.statusIdle"));
    $("[data-act=shake]").addEventListener("click", rollBowl);
    $("[data-act=undo]").addEventListener("click", function () {
      if (phase !== "IDLE") return;
      coinBank.undoHold();
      paintBets();
      sfx.chip();
    });
    $("[data-act=clear]").addEventListener("click", function () {
      if (phase !== "IDLE") return;
      coinBank.clearHolds();
      paintBets();
    });
    $("[data-act=rebet]").addEventListener("click", function () {
      if (phase !== "IDLE") return;
      if (coinBank.rebet()) { paintBets(); sfx.chip(); }
      else appShell.toast(lang.t("play.broke"), "lose");
    });

    // tap bowl stage to skip shake wait time
    $(".bowl-zone").addEventListener("click", function () {
      if (shakeTimer) { clearTimeout(shakeTimer); revealBowl(); }
    });

    document.addEventListener("keydown", function (e) {
      if (e.target && e.target.matches && (e.target.matches("input, textarea, select") || e.target.isContentEditable)) return;
      var k = (e.key || "").toLowerCase();
      if ((e.key === "Enter" || e.code === "Space") && phase === "IDLE") {
        e.preventDefault();
        rollBowl();
        return;
      }
      if (phase === "IDLE" && e.key >= "1" && e.key <= "6") {
        var idx = parseInt(e.key, 10);
        if (idx >= 1 && idx <= gameConfig.MASCOTS.length) {
          e.preventDefault();
          tapCell(gameConfig.MASCOTS[idx - 1].id);
        }
        return;
      }
      if (phase === "IDLE" && (k === "u" || ((e.ctrlKey || e.metaKey) && k === "z"))) {
        var uBtn = $("[data-act=undo]");
        if (uBtn && !uBtn.disabled) { e.preventDefault(); uBtn.click(); }
        return;
      }
      if (phase === "IDLE" && k === "c") {
        var cBtn = $("[data-act=clear]");
        if (cBtn && !cBtn.disabled) { e.preventDefault(); cBtn.click(); }
        return;
      }
      if (phase === "IDLE" && k === "r") {
        var rBtn = $("[data-act=rebet]");
        if (rBtn && !rBtn.disabled) { e.preventDefault(); rBtn.click(); }
        return;
      }
      if (phase === "IDLE" && k === "l") {
        e.preventDefault();
        var qBtn = document.querySelector("[data-act=quick-lixi]");
        if (qBtn) qBtn.click();
      }
    });

    coinBank.onChange(syncChips);
    lang.onLangChange(function () {
      document.querySelectorAll(".cell .name").forEach(function (el, i) {
        el.textContent = lang.L(gameConfig.MASCOTS[i].name);
      });
      if (phase === "IDLE") setStatus(lang.t("play.statusIdle"));
    });

    var helpBtn = document.querySelector("[data-act=help]");
    if (helpBtn) helpBtn.addEventListener("click", openRules);

    if (!saveStore.load().coachDone) openGuide();
  }

  function stepRow(n, key) {
    return '<div class="step-row"><span class="n">' + n + "</span><span>" + lang.t(key) + "</span></div>";
  }

  function openRules() {
    var modal = document.querySelector("#modal-help");
    modal.querySelector("#help-box").innerHTML =
      '<div class="close-row"><button class="icon-btn" data-act="help-close">✕</button></div>' +
      "<h3>" + lang.t("help.title") + "</h3>" +
      '<div class="steps">' + stepRow(1, "coach.1") + stepRow(2, "coach.2") + stepRow(3, "coach.3") + "</div>" +
      "<p><strong>" + lang.t("help.payout") + "</strong></p>" +
      "<ul>" +
      "<li>" + lang.t("learn.rule.0") + "</li>" +
      "<li>" + lang.t("learn.rule.1") + "</li>" +
      "<li>" + lang.t("learn.rule.2") + "</li>" +
      "<li>" + lang.t("learn.rule.3") + "</li>" +
      "</ul>" +
      '<a class="btn-bc btn-sm" href="learn.html">' + lang.t("help.link") + "</a>";
    modal.classList.add("show");
    modal.onclick = function (e) { if (e.target === modal) modal.classList.remove("show"); };
    modal.querySelector("[data-act=help-close]").addEventListener("click", function () {
      modal.classList.remove("show");
    });
  }

  function openGuide() {
    var wrap = document.createElement("div");
    wrap.className = "coach";
    wrap.innerHTML =
      '<div class="box card-bc">' +
      "<h3>" + lang.t("coach.t") + "</h3>" +
      '<div class="steps">' +
      stepRow(1, "coach.1") + stepRow(2, "coach.2") + stepRow(3, "coach.3") +
      "</div>" +
      '<button class="btn-bc btn-gold" data-act="coach-ok">' + lang.t("coach.btn") + "</button>" +
      "</div>";
    document.body.appendChild(wrap);
    wrap.querySelector("[data-act=coach-ok]").addEventListener("click", function () {
      saveStore.load().coachDone = true;
      saveStore.save();
      wrap.remove();
      sfx.pop();
    });
  }

  return { boot: boot };
})();
