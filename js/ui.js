/* ui.js - global chrome: nav, drawer, toasts, lang, sound, coin pill, stats */
window.BCUI = (function () {
  "use strict";

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- toast ---------- */
  function toast(msg, cls) {
    var zone = document.querySelector(".toast-zone");
    if (!zone) return;
    var el = document.createElement("div");
    el.className = "toast-bc" + (cls ? " " + cls : "");
    el.setAttribute("role", "status");
    el.textContent = msg;
    zone.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 250);
    }, 2600);
  }

  /* ---------- drawer ---------- */
  function drawerEls() {
    return {
      backdrop: document.querySelector(".drawer-backdrop"),
      drawer: document.querySelector(".drawer")
    };
  }
  function openDrawer() {
    var d = drawerEls();
    d.backdrop.classList.add("show");
    d.drawer.classList.add("show");
    renderDrawer();
    BCAudio.pop();
  }
  function closeDrawer() {
    var d = drawerEls();
    d.backdrop.classList.remove("show");
    d.drawer.classList.remove("show");
  }

  function ensureEconomyContainers() {
    var lixiBtn = document.querySelector(".drawer [data-act=lixi]");
    if (!lixiBtn) return;
    if (!document.querySelector("#drawer-daily-zone")) {
      var dz = document.createElement("div");
      dz.id = "drawer-daily-zone";
      lixiBtn.parentNode.insertBefore(dz, lixiBtn);
    }
    if (!lixiBtn.closest(".demo-topup-card")) {
      var demoWrap = document.createElement("div");
      demoWrap.className = "demo-topup-card";
      demoWrap.innerHTML = '<p class="demo-topup-note" data-i18n="demo.note"></p>';
      lixiBtn.parentNode.insertBefore(demoWrap, lixiBtn);
      demoWrap.appendChild(lixiBtn);
      if (window.BCi18n) {
        demoWrap.querySelector(".demo-topup-note").textContent = BCi18n.t("demo.note");
      }
    }
  }

  function bumpCoinPill() {
    var pill = document.querySelector(".coin-pill");
    if (pill) {
      pill.classList.remove("bump");
      void pill.offsetWidth;
      pill.classList.add("bump");
    }
  }

  function handleDailyClaim(e) {
    if (e) e.stopPropagation();
    var res = BCWallet.claimDaily();
    if (res && res.ok) {
      BCBadges.check("lixi");
      BCAudio.drum();
      BCUI.toast(BCi18n.t("daily.toast", { d: res.day, n: res.amount.toLocaleString("vi-VN") }), "win");
      renderCoins();
      bumpCoinPill();
      renderDrawer();
    }
  }

  function handleClaim(e) {
    if (e) e.stopPropagation();
    if (BCWallet.claimLiXi()) {
      BCBadges.check("lixi");
      BCAudio.drum();
      BCUI.toast(BCi18n.t("drawer.lixiGot"), "gold");
      renderCoins();
      bumpCoinPill();
      renderDrawer();
    }
  }

  function renderDailyUI() {
    var info = BCWallet.dailyStatus();
    document.querySelectorAll(".coin-pill, .fab").forEach(function (el) {
      el.classList.toggle("has-daily", !info.claimedToday);
    });
    var playDaily = document.querySelector("#play-daily-btn");
    if (playDaily) {
      playDaily.disabled = info.claimedToday;
      playDaily.textContent = info.claimedToday
        ? BCi18n.t("daily.playDone")
        : BCi18n.t("daily.playBtn", { n: info.todayAmount.toLocaleString("vi-VN") });
    }
    var dz = document.querySelector("#drawer-daily-zone");
    if (dz) {
      var daysHtml = info.days.map(function (item) {
        var cls = "daily-day" + (item.isSeventh ? " day-7" : "");
        if (item.done) cls += " done";
        else if (item.ready) cls += " ready";
        var prefix = item.done ? "✓ " : "";
        return '<div class="' + cls + '">' +
          '<span class="dd-lbl">' + prefix + BCi18n.t("daily.day", { n: item.day }) + '</span>' +
          '<span class="dd-amt">+' + item.amount.toLocaleString("vi-VN") + '</span>' +
        '</div>';
      }).join("");
      var ctaLabel = info.claimedToday
        ? BCi18n.t("daily.done", { n: info.nextAmount.toLocaleString("vi-VN") })
        : BCi18n.t("daily.btn", { d: info.todayDay, n: info.todayAmount.toLocaleString("vi-VN") });
      dz.innerHTML =
        '<div class="daily-card">' +
          '<div class="daily-head">' +
            '<span class="daily-title">🎁 ' + BCi18n.t("daily.title") + '</span>' +
            '<span class="daily-streak-pill">' + BCi18n.t("daily.streak", { n: info.completed }) + '</span>' +
          '</div>' +
          '<p class="daily-sub">' + BCi18n.t("daily.sub") + '</p>' +
          '<div class="daily-grid">' + daysHtml + '</div>' +
          '<button type="button" class="btn-bc btn-sm btn-jade" data-act="daily-claim" style="width:100%"' +
            (info.claimedToday ? ' disabled' : '') + '>' + ctaLabel + '</button>' +
        '</div>';
      var btn = dz.querySelector("[data-act=daily-claim]");
      if (btn) btn.addEventListener("click", handleDailyClaim);
    }
  }

  function renderDrawer() {
    ensureEconomyContainers();
    renderDailyUI();
    var st = BCStore.load();
    var lixiBtn = document.querySelector("[data-act=lixi]");
    if (lixiBtn) {
      lixiBtn.disabled = false;
      lixiBtn.textContent = BCi18n.t("drawer.lixi");
    }
    var demoNote = document.querySelector(".demo-topup-note");
    if (demoNote) demoNote.textContent = BCi18n.t("demo.note");
    var list = document.querySelector("#badge-grid");
    if (list) {
      list.innerHTML = "";
      BC_DATA.BADGES.forEach(function (b) {
        var unlocked = st.badges.indexOf(b.id) !== -1;
        var div = document.createElement("div");
        div.className = "badge-cell " + (unlocked ? "unlocked" : "locked");
        div.textContent = BCi18n.L(b.name);
        var ic = document.createElement("span");
        ic.className = "ic"; ic.textContent = b.icon;
        div.prepend(ic);
        div.title = BCi18n.L(b.desc);
        list.appendChild(div);
      });
    }
    var stats = document.querySelector("#drawer-stats");
    if (stats) {
      stats.innerHTML =
        stat("drawer.played", st.stats.played) +
        stat("drawer.streak", st.stats.streak) +
        stat("drawer.best", st.stats.bestStreak) +
        stat("drawer.peak", st.stats.peak);
    }
  }
  function stat(k, v) {
    return "<div><span class=\"mut\">" + BCi18n.t(k) + ":</span> <strong>" + v + "</strong></div>";
  }

  /* ---------- coin pill ---------- */
  var ICON_COIN = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#B8860B" stroke="#141414" stroke-width="2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#141414" stroke-width="1.6"/></svg>';
  function renderCoins() {
    var pill = document.querySelector(".coin-pill");
    if (pill) pill.innerHTML = ICON_COIN + "<span>" + BCWallet.balance().toLocaleString("vi-VN") + " " + BCi18n.t("unit.xu") + "</span>";
  }

  /* ---------- lang + sound ---------- */
  function wireLang() {
    document.querySelectorAll(".lang-group button").forEach(function (b) {
      b.addEventListener("click", function () {
        BCi18n.setLang(b.dataset.lang);
        BCAudio.pop();
      });
    });
  }
  function wireSound() {
    var btns = document.querySelectorAll("[data-act=sound]");
    if (!btns.length) return;
    function paint() {
      var muted = BCStore.load().muted;
      btns.forEach(function (btn) { btn.classList.toggle("muted", muted); });
    }
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var s = BCStore.load();
        s.muted = !s.muted;
        BCStore.save();
        paint();
        BCAudio.pop();
      });
    });
    paint();
  }

  /* ---------- boot (every page) ---------- */
  function boot() {
    BCWallet.touchVisit();
    BCBadges.check("return_visit");

    // inject mobile menu tools if not present
    var links = document.querySelector(".bc-links");
    if (links && !links.querySelector(".mobile-menu-tools")) {
      var mobileTools = document.createElement("div");
      mobileTools.className = "mobile-menu-tools";
      mobileTools.innerHTML =
        '<div class="lang-group" role="group" aria-label="Language">' +
        '<button data-lang="vn">VN</button>' +
        '<button data-lang="en">EN</button>' +
        '<button data-lang="zh">ZH</button>' +
        '</div>' +
        '<button class="icon-btn" data-act="sound" aria-label="Sound">' +
        '<svg class="ic-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>' +
        '<svg class="ic-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/></svg>' +
        '</button>';
      links.appendChild(mobileTools);
    }

    if (window.BCAccountUI) BCAccountUI.boot();
    BCi18n.apply();
    wireLang();
    wireSound();
    renderCoins();

    document.querySelectorAll("[data-act=drawer-open]").forEach(function (b) {
      b.addEventListener("click", openDrawer);
    });
    document.querySelector("[data-act=drawer-close]").addEventListener("click", closeDrawer);
    document.querySelector(".drawer-backdrop").addEventListener("click", closeDrawer);

    // Close any modal when clicking backdrop outside .box
    document.querySelectorAll(".modal-bc").forEach(function (m) {
      m.addEventListener("click", function (e) {
        if (e.target === m) {
          m.classList.remove("show");
        }
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

    ensureEconomyContainers();
    renderDailyUI();

    var playDaily = document.querySelector("#play-daily-btn");
    if (playDaily) playDaily.addEventListener("click", handleDailyClaim);

    var lixiBtn = document.querySelector("[data-act=lixi]");
    if (lixiBtn) {
      lixiBtn.addEventListener("click", handleClaim);
    }
    document.querySelectorAll("[data-act=quick-lixi]").forEach(function (btn) {
      btn.addEventListener("click", handleClaim);
    });
    BCWallet.onChange(function () {
      renderCoins();
      renderDrawer();
    });
    BCi18n.onLangChange(function () {
      renderCoins();
      renderDrawer();
    });

    // active nav link
    var page = document.body.dataset.page;
    document.querySelectorAll(".bc-links a").forEach(function (a) {
      a.classList.toggle("active", a.dataset.page === page);
    });
    // mobile menu
    var tg = document.querySelector(".nav-toggle");
    var links = document.querySelector(".bc-links");
    var HAMBURGER_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.6"/></svg>';
    var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" stroke-width="2.6"/></svg>';

    function closeNav() {
      if (!links || !links.classList.contains("open")) return;
      links.classList.remove("open");
      if (tg) {
        tg.setAttribute("aria-expanded", "false");
        tg.innerHTML = HAMBURGER_SVG;
      }
    }

    if (tg && links) {
      tg.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = links.classList.toggle("open");
        tg.setAttribute("aria-expanded", String(isOpen));
        tg.innerHTML = isOpen ? CLOSE_SVG : HAMBURGER_SVG;
      });

      document.addEventListener("click", function (e) {
        if (!tg.contains(e.target) && !links.contains(e.target)) {
          closeNav();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeNav();
      });

      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", closeNav);
      });
    }

    BCWallet.onChange(function () { renderCoins(); renderDrawer(); });
    BCi18n.onLangChange(function () { renderCoins(); renderDrawer(); });
    renderDrawer();
  }

  return {
    boot: boot, toast: toast, openDrawer: openDrawer, closeDrawer: closeDrawer,
    renderCoins: renderCoins, renderDrawer: renderDrawer, reducedMotion: reducedMotion
  };
})();
