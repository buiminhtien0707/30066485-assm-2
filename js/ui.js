window.appShell = (function () {
  "use strict";

  var ICON_COIN = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#B8860B" stroke="#141414" stroke-width="2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#141414" stroke-width="1.6"/></svg>';

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function toast(msg, kind) {
    var zone = document.querySelector(".toast-zone");
    if (!zone) return;
    var el = document.createElement("div");
    el.className = "toast-bc" + (kind ? " " + kind : "");
    el.setAttribute("role", "status");
    el.textContent = msg;
    zone.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 250);
    }, 2600);
  }

  function getDrawerEls() {
    return {
      backdrop: document.querySelector(".drawer-backdrop"),
      drawer: document.querySelector(".drawer")
    };
  }

  function openDrawer() {
    var els = getDrawerEls();
    els.backdrop.classList.add("show");
    els.drawer.classList.add("show");
    paintDrawer();
    sfx.pop();
  }

  function closeDrawer() {
    var els = getDrawerEls();
    els.backdrop.classList.remove("show");
    els.drawer.classList.remove("show");
  }

  function setupWalletZones() {
    var demoBtn = document.querySelector(".drawer [data-act=lixi]");
    if (!demoBtn) return;
    if (!document.querySelector("#drawer-daily-zone")) {
      var slot = document.createElement("div");
      slot.id = "drawer-daily-zone";
      demoBtn.parentNode.insertBefore(slot, demoBtn);
    }
    if (!demoBtn.closest(".demo-topup-card")) {
      var box = document.createElement("div");
      box.className = "demo-topup-card";
      box.innerHTML = '<p class="demo-topup-note" data-i18n="demo.note"></p>';
      demoBtn.parentNode.insertBefore(box, demoBtn);
      box.appendChild(demoBtn);
      if (window.lang) {
        box.querySelector(".demo-topup-note").textContent = lang.t("demo.note");
      }
    }
  }

  function pulseCoinPill() {
    var pill = document.querySelector(".coin-pill");
    if (!pill) return;
    pill.classList.remove("bump");
    void pill.offsetWidth;
    pill.classList.add("bump");
  }

  function onDailyClick(e) {
    if (e) e.stopPropagation();
    var out = coinBank.claimDaily();
    if (out && out.ok) {
      awards.check("lixi");
      sfx.drum();
      appShell.toast(lang.t("daily.toast", { d: out.day, n: out.amount.toLocaleString("vi-VN") }), "win");
      renderCoins();
      pulseCoinPill();
      paintDrawer();
    }
  }

  function onDemoRefill(e) {
    if (e) e.stopPropagation();
    if (coinBank.claimLiXi()) {
      awards.check("lixi");
      sfx.drum();
      appShell.toast(lang.t("drawer.lixiGot"), "gold");
      renderCoins();
      pulseCoinPill();
      paintDrawer();
    }
  }

  function paintDailyCard() {
    var info = coinBank.dailyStatus();
    document.querySelectorAll(".coin-pill, .fab").forEach(function (el) {
      el.classList.toggle("has-daily", !info.claimedToday);
    });
    var playDaily = document.querySelector("#play-daily-btn");
    if (playDaily) {
      playDaily.disabled = info.claimedToday;
      playDaily.textContent = info.claimedToday
        ? lang.t("daily.playDone")
        : lang.t("daily.playBtn", { n: info.todayAmount.toLocaleString("vi-VN") });
    }
    var zone = document.querySelector("#drawer-daily-zone");
    if (zone) {
      var daysMarkup = info.days.map(function (d) {
        var cls = "daily-day" + (d.isSeventh ? " day-7" : "");
        if (d.done) cls += " done";
        else if (d.ready) cls += " ready";
        var tick = d.done ? "✓ " : "";
        return '<div class="' + cls + '">' +
          '<span class="dd-lbl">' + tick + lang.t("daily.day", { n: d.day }) + "</span>" +
          '<span class="dd-amt">+' + d.amount.toLocaleString("vi-VN") + "</span>" +
        "</div>";
      }).join("");
      var label = info.claimedToday
        ? lang.t("daily.done", { n: info.nextAmount.toLocaleString("vi-VN") })
        : lang.t("daily.btn", { d: info.todayDay, n: info.todayAmount.toLocaleString("vi-VN") });
      zone.innerHTML =
        '<div class="daily-card">' +
          '<div class="daily-head">' +
            '<span class="daily-title">🎁 ' + lang.t("daily.title") + "</span>" +
            '<span class="daily-streak-pill">' + lang.t("daily.streak", { n: info.completed }) + "</span>" +
          "</div>" +
          '<p class="daily-sub">' + lang.t("daily.sub") + "</p>" +
          '<div class="daily-grid">' + daysMarkup + "</div>" +
          '<button type="button" class="btn-bc btn-sm btn-accent" data-act="daily-claim" style="width:100%"' +
            (info.claimedToday ? " disabled" : "") + ">" + label + "</button>" +
        "</div>";
      var btn = zone.querySelector("[data-act=daily-claim]");
      if (btn) btn.addEventListener("click", onDailyClick);
    }
  }

  function statHtml(k, v) {
    return '<div><span class="mut">' + lang.t(k) + ":</span> <strong>" + v + "</strong></div>";
  }

  function paintDrawer() {
    setupWalletZones();
    paintDailyCard();
    var data = saveStore.load();
    var demoBtn = document.querySelector("[data-act=lixi]");
    if (demoBtn) {
      demoBtn.disabled = false;
      demoBtn.textContent = lang.t("drawer.lixi");
    }
    var demoNote = document.querySelector(".demo-topup-note");
    if (demoNote) demoNote.textContent = lang.t("demo.note");

    var badgeGrid = document.querySelector("#badge-grid");
    if (badgeGrid) {
      badgeGrid.innerHTML = "";
      gameConfig.AWARDS.forEach(function (b) {
        var unlocked = data.badges.indexOf(b.id) !== -1;
        var cell = document.createElement("div");
        cell.className = "badge-cell " + (unlocked ? "unlocked" : "locked");
        cell.textContent = lang.L(b.name);
        var ic = document.createElement("span");
        ic.className = "ic"; ic.textContent = b.icon;
        cell.prepend(ic);
        cell.title = lang.L(b.desc);
        badgeGrid.appendChild(cell);
      });
    }

    var statsEl = document.querySelector("#drawer-stats");
    if (statsEl) {
      statsEl.innerHTML =
        statHtml("drawer.played", data.stats.played) +
        statHtml("drawer.streak", data.stats.streak) +
        statHtml("drawer.best", data.stats.bestStreak) +
        statHtml("drawer.peak", data.stats.peak);
    }
  }

  function renderCoins() {
    var pill = document.querySelector(".coin-pill");
    if (pill) pill.innerHTML = ICON_COIN + "<span>" + coinBank.balance().toLocaleString("vi-VN") + " " + lang.t("unit.xu") + "</span>";
  }

  function bindLangButtons() {
    document.querySelectorAll(".lang-group button").forEach(function (b) {
      b.addEventListener("click", function () {
        lang.setLang(b.dataset.lang);
        sfx.pop();
      });
    });
  }

  function bindMuteButtons() {
    var btns = document.querySelectorAll("[data-act=sound]");
    if (!btns.length) return;
    function syncIcon() {
      var muted = saveStore.load().muted;
      btns.forEach(function (btn) { btn.classList.toggle("muted", muted); });
    }
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var data = saveStore.load();
        data.muted = !data.muted;
        saveStore.save();
        syncIcon();
        sfx.pop();
      });
    });
    syncIcon();
  }

  function boot() {
    coinBank.touchVisit();
    awards.check("return_visit");

    var navLinks = document.querySelector(".bc-links");
    if (navLinks && !navLinks.querySelector(".mobile-menu-tools")) {
      var bar = document.createElement("div");
      bar.className = "mobile-menu-tools";
      bar.innerHTML =
        '<div class="lang-group" role="group" aria-label="Language">' +
        '<button data-lang="vn">VN</button>' +
        '<button data-lang="en">EN</button>' +
        '<button data-lang="zh">ZH</button>' +
        "</div>" +
        '<button class="icon-btn" data-act="sound" aria-label="Sound">' +
        '<svg class="ic-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>' +
        '<svg class="ic-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/></svg>' +
        "</button>";
      navLinks.appendChild(bar);
    }

    if (window.loginModal) loginModal.boot();
    lang.apply();
    bindLangButtons();
    bindMuteButtons();
    renderCoins();

    document.querySelectorAll("[data-act=drawer-open]").forEach(function (b) {
      b.addEventListener("click", openDrawer);
    });
    document.querySelector("[data-act=drawer-close]").addEventListener("click", closeDrawer);
    document.querySelector(".drawer-backdrop").addEventListener("click", closeDrawer);

    document.querySelectorAll(".modal-bc").forEach(function (m) {
      m.addEventListener("click", function (e) {
        if (e.target === m) m.classList.remove("show");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeDrawer();
        document.querySelectorAll(".modal-bc.show").forEach(function (m) {
          m.classList.remove("show");
        });
      }
    });

    setupWalletZones();
    paintDailyCard();

    var playDaily = document.querySelector("#play-daily-btn");
    if (playDaily) playDaily.addEventListener("click", onDailyClick);

    var demoBtn = document.querySelector("[data-act=lixi]");
    if (demoBtn) demoBtn.addEventListener("click", onDemoRefill);
    document.querySelectorAll("[data-act=quick-lixi]").forEach(function (btn) {
      btn.addEventListener("click", onDemoRefill);
    });

    var curPage = document.body.dataset.page;
    document.querySelectorAll(".bc-links a").forEach(function (a) {
      a.classList.toggle("active", a.dataset.page === curPage);
    });

    var menuBtn = document.querySelector(".nav-toggle");
    var MENU_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.6"/></svg>';
    var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" stroke-width="2.6"/></svg>';

    function closeMenu() {
      if (!navLinks || !navLinks.classList.contains("open")) return;
      navLinks.classList.remove("open");
      if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.innerHTML = MENU_SVG;
      }
    }

    if (menuBtn && navLinks) {
      menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = navLinks.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.innerHTML = open ? CLOSE_SVG : MENU_SVG;
      });

      document.addEventListener("click", function (e) {
        if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) closeMenu();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMenu();
      });

      navLinks.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
    }

    coinBank.onChange(function () { renderCoins(); paintDrawer(); });
    lang.onLangChange(function () { renderCoins(); paintDrawer(); });
    paintDrawer();
  }

  return {
    boot: boot,
    toast: toast,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    renderCoins: renderCoins,
    renderDrawer: paintDrawer,
    reducedMotion: reducedMotion
  };
})();
