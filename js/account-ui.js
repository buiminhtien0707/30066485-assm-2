window.loginModal = (function () {
  "use strict";

  var tipShown = false;
  var AVATAR_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="8.5" r="4" fill="#FFC93C" stroke="#141414" stroke-width="2"/><path d="M4.5 20c1.5-4 4.2-6 7.5-6s6 2 7.5 6" fill="#FAF3E7" stroke="#141414" stroke-width="2" stroke-linecap="round"/></svg>';

  function escHtml(val) {
    return String(val == null ? "" : val)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function demoBoxHtml() {
    return (
      '<div class="acct-soon-head">' +
        '<span class="acct-soon-badge">' + escHtml(lang.t("acc.soonBadge")) + "</span>" +
        "<strong>" + escHtml(lang.t("acc.soonTitle")) + "</strong>" +
      "</div>" +
      '<p class="acct-soon-body">' + escHtml(lang.t("acc.soonBody")) + "</p>"
    );
  }

  function mountShell() {
    var tools = document.querySelector(".nav-tools");
    if (tools && !tools.querySelector("[data-act=acct-btn]")) {
      var wrap = document.createElement("div");
      wrap.className = "acct-wrap";
      wrap.innerHTML = '<button type="button" class="acct-chip" data-act="acct-btn" aria-haspopup="dialog"></button>';
      tools.appendChild(wrap);
    }

    var drawer = document.querySelector(".drawer");
    if (drawer && !drawer.querySelector("#drawer-acct-card")) {
      var closeRow = drawer.querySelector(".close-row");
      var card = document.createElement("div");
      card.id = "drawer-acct-card";
      card.className = "drawer-acct-card";
      if (closeRow && closeRow.nextSibling) drawer.insertBefore(card, closeRow.nextSibling);
      else drawer.prepend(card);
    }

    if (!document.querySelector("#modal-account")) {
      var modalEl = document.createElement("div");
      modalEl.className = "modal-bc";
      modalEl.id = "modal-account";
      modalEl.setAttribute("role", "dialog");
      modalEl.setAttribute("aria-modal", "true");
      modalEl.setAttribute("aria-labelledby", "acc-modal-title");
      modalEl.innerHTML =
        '<div class="box acct-modal-box">' +
          '<div class="acct-modal-head">' +
            '<div class="acct-tabs" role="tablist">' +
              '<button type="button" class="acct-tab active" data-acc-tab="login" role="tab" id="acc-modal-title"></button>' +
              '<button type="button" class="acct-tab" data-acc-tab="register" role="tab"></button>' +
            "</div>" +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span class="acct-soon-badge" data-i18n="acc.soonBadge">COMING SOON</span>' +
              '<button type="button" class="icon-btn" data-act="acc-close" aria-label="Close">✕</button>' +
            "</div>" +
          "</div>" +
          '<section id="acc-pane-login" class="acct-pane">' +
            '<form id="acc-login-form" class="acct-form" novalidate autocomplete="off">' +
              "<div>" +
                '<label class="acct-label" for="acc-login-id" data-i18n="acc.loginIdLabel"></label>' +
                '<input id="acc-login-id" class="acct-input" type="text" data-i18n-ph="acc.loginIdPh" autocomplete="off">' +
              "</div>" +
              "<div>" +
                '<label class="acct-label" for="acc-login-pw" data-i18n="acc.pwLabel"></label>' +
                '<input id="acc-login-pw" class="acct-input" type="password" data-i18n-ph="acc.pwPh" autocomplete="off">' +
              "</div>" +
              '<div class="acct-row-between">' +
                '<label class="acct-check"><input type="checkbox" id="acc-login-rem" checked> <span data-i18n="acc.remember"></span></label>' +
                '<button type="button" class="acct-link-btn" data-act="acc-soon-trigger" data-i18n="acc.forgot"></button>' +
              "</div>" +
              '<div class="acct-soon-box" id="acc-login-soon" role="status" hidden></div>' +
              '<button type="submit" class="btn-bc btn-red" style="width:100%" data-i18n="acc.enterBtn"></button>' +
              '<p class="acct-note mono" data-i18n="acc.previewNote"></p>' +
            "</form>" +
          "</section>" +
          '<section id="acc-pane-register" class="acct-pane" hidden>' +
            '<form id="acc-reg-form" class="acct-form" novalidate autocomplete="off">' +
              "<div>" +
                '<label class="acct-label" for="acc-reg-name" data-i18n="acc.fullNameLabel"></label>' +
                '<input id="acc-reg-name" class="acct-input" type="text" data-i18n-ph="acc.fullNamePh" autocomplete="off">' +
              "</div>" +
              '<div class="acct-two-col">' +
                "<div>" +
                  '<label class="acct-label" for="acc-reg-email" data-i18n="acc.emailLabel"></label>' +
                  '<input id="acc-reg-email" class="acct-input" type="email" data-i18n-ph="acc.emailPh" autocomplete="off">' +
                "</div>" +
                "<div>" +
                  '<label class="acct-label" for="acc-reg-phone" data-i18n="acc.phoneLabel"></label>' +
                  '<input id="acc-reg-phone" class="acct-input" type="tel" data-i18n-ph="acc.phonePh" autocomplete="off">' +
                "</div>" +
              "</div>" +
              "<div>" +
                '<label class="acct-label" for="acc-reg-pw" data-i18n="acc.pwLabel"></label>' +
                '<input id="acc-reg-pw" class="acct-input" type="password" data-i18n-ph="acc.pwPh" autocomplete="off">' +
              "</div>" +
              '<div class="acct-soon-box" id="acc-reg-soon" role="status" hidden></div>' +
              '<button type="submit" class="btn-bc btn-red" style="width:100%" data-i18n="acc.createBtn"></button>' +
              '<p class="acct-note mono" data-i18n="acc.previewNote"></p>' +
            "</form>" +
          "</section>" +
        "</div>";
      document.body.appendChild(modalEl);
    }
  }

  function drawNavBtn() {
    var btn = document.querySelector("[data-act=acct-btn]");
    if (!btn) return;
    btn.classList.remove("is-signed");
    btn.innerHTML =
      '<span class="acct-av">' + AVATAR_SVG + "</span>" +
      '<span class="acct-name">' + escHtml(lang.t("acc.signIn")) + "</span>";
    btn.setAttribute("aria-label", lang.t("acc.signIn"));
  }

  function drawDrawerAcct() {
    var card = document.querySelector("#drawer-acct-card");
    if (!card) return;
    var data = saveStore.load();
    card.innerHTML =
      '<div class="drawer-acct-row">' +
        '<span class="acct-av acct-av-lg">' + AVATAR_SVG + "</span>" +
        '<div class="drawer-acct-meta">' +
          "<strong>" + escHtml(lang.t("acc.guest")) + "</strong>" +
          '<span class="mono mut">' + escHtml(lang.t("acc.guestSub", { n: data.balance.toLocaleString("vi-VN") })) + "</span>" +
        "</div>" +
        '<button type="button" class="btn-bc btn-xs btn-gold" data-act="drawer-signin">' + escHtml(lang.t("acc.signIn")) + "</button>" +
      "</div>";
    card.querySelector("[data-act=drawer-signin]").addEventListener("click", function () {
      appShell.closeDrawer();
      showModal("login");
    });
  }

  function syncTabLabels() {
    var loginTab = document.querySelector("[data-acc-tab=login]");
    var regTab = document.querySelector("[data-acc-tab=register]");
    if (loginTab) loginTab.textContent = lang.t("acc.tabLogin");
    if (regTab) regTab.textContent = lang.t("acc.tabRegister");
  }

  function clearNotices() {
    ["#acc-login-soon", "#acc-reg-soon"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.hidden = true;
    });
  }

  function showDemoNotice(selector) {
    var el = document.querySelector(selector);
    if (el) {
      el.innerHTML = demoBoxHtml();
      el.hidden = false;
    }
    if (window.sfx) sfx.pop();
    if (window.appShell) appShell.toast(lang.t("acc.soonToast"), "gold");
  }

  function switchTab(tabName) {
    var target = tabName === "register" ? "register" : "login";
    document.querySelectorAll("[data-acc-tab]").forEach(function (b) {
      var on = b.getAttribute("data-acc-tab") === target;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.querySelector("#acc-pane-login").hidden = target !== "login";
    document.querySelector("#acc-pane-register").hidden = target !== "register";
    clearNotices();
  }

  function showModal(tabName) {
    var modalEl = document.querySelector("#modal-account");
    if (!modalEl) return;
    syncTabLabels();
    lang.apply();
    switchTab(tabName || "login");
    modalEl.classList.add("show");
    if (window.sfx) sfx.pop();
  }

  function hideModal() {
    var modalEl = document.querySelector("#modal-account");
    if (modalEl) modalEl.classList.remove("show");
  }

  function drawRankings() {
    var tbody = document.querySelector("#lb-body");
    if (!tbody || !window.gameConfig) return;
    var rows = (gameConfig.LEADERBOARD || []).slice().sort(function (a, b) {
      return b.xu - a.xu;
    }).slice(0, 7);

    var p1 = document.querySelector(".podium .p1");
    var p2 = document.querySelector(".podium .p2");
    var p3 = document.querySelector(".podium .p3");
    if (p1 && rows[0]) p1.innerHTML = "<strong>1</strong><br>" + escHtml(rows[0].name);
    if (p2 && rows[1]) p2.innerHTML = "<strong>2</strong><br>" + escHtml(rows[1].name);
    if (p3 && rows[2]) p3.innerHTML = "<strong>3</strong><br>" + escHtml(rows[2].name);

    tbody.innerHTML = rows.map(function (r, idx) {
      return "<tr>" +
        "<td>" + (idx + 1) + "</td>" +
        "<td>" + escHtml(r.name) + "</td>" +
        '<td class="mono">' + r.xu.toLocaleString("vi-VN") + "</td>" +
      "</tr>";
    }).join("");
  }

  function onBadgeUnlocked() {
    if (tipShown) return;
    tipShown = true;
    var zone = document.querySelector(".toast-zone");
    if (!zone) return;
    var row = document.createElement("div");
    row.className = "toast-bc acct-nudge-toast";
    row.innerHTML =
      "<span>" + escHtml(lang.t("acc.nudge")) + "</span> " +
      '<button type="button" class="btn-bc btn-xs btn-gold" data-act="nudge-reg">' +
        escHtml(lang.t("acc.soonBadge")) +
      "</button>";
    zone.appendChild(row);
    row.querySelector("[data-act=nudge-reg]").addEventListener("click", function () {
      row.remove();
      showModal("register");
    });
    setTimeout(function () {
      if (row.parentNode) {
        row.style.opacity = "0";
        setTimeout(function () { row.remove(); }, 250);
      }
    }, 6500);
  }

  function bindEvents() {
    var navBtn = document.querySelector("[data-act=acct-btn]");
    if (navBtn) {
      navBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        showModal("login");
      });
    }

    var modalEl = document.querySelector("#modal-account");
    if (modalEl) {
      modalEl.addEventListener("click", function (e) {
        if (e.target === modalEl) hideModal();
      });
    }

    document.querySelectorAll("[data-acc-tab]").forEach(function (b) {
      b.addEventListener("click", function () {
        switchTab(b.getAttribute("data-acc-tab"));
      });
    });

    var closeBtn = document.querySelector("[data-act=acc-close]");
    if (closeBtn) closeBtn.addEventListener("click", hideModal);

    var soonLink = document.querySelector("[data-act=acc-soon-trigger]");
    if (soonLink) {
      soonLink.addEventListener("click", function () {
        showDemoNotice("#acc-login-soon");
      });
    }

    var loginForm = document.querySelector("#acc-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        showDemoNotice("#acc-login-soon");
      });
    }

    var regForm = document.querySelector("#acc-reg-form");
    if (regForm) {
      regForm.addEventListener("submit", function (e) {
        e.preventDefault();
        showDemoNotice("#acc-reg-soon");
      });
    }
  }

  function boot() {
    mountShell();
    lang.apply();
    syncTabLabels();
    drawNavBtn();
    drawDrawerAcct();
    drawRankings();
    bindEvents();

    if (window.coinBank) {
      coinBank.onChange(function () { drawDrawerAcct(); });
    }
    lang.onLangChange(function () {
      syncTabLabels();
      drawNavBtn();
      drawDrawerAcct();
    });
  }

  return {
    boot: boot,
    openModal: showModal,
    onBadgeUnlocked: onBadgeUnlocked,
    renderLeaderboard: drawRankings
  };
})();
