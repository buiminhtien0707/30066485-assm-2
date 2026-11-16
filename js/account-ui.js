/* account-ui.js - UI-only Sign in / Register preview modal (no backend DB).
   Collects standard fields (Full Name, Email, Phone Number, Password) and
   clearly signals "Coming soon" when submitted, while keeping Guest play instant. */
window.BCAccountUI = (function () {
  "use strict";

  var nudgeShown = false;

  var USER_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="8.5" r="4" fill="#FFC93C" stroke="#141414" stroke-width="2"/><path d="M4.5 20c1.5-4 4.2-6 7.5-6s6 2 7.5 6" fill="#FAF3E7" stroke="#141414" stroke-width="2" stroke-linecap="round"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function comingSoonHtml() {
    return (
      '<div class="acct-soon-head">' +
        '<span class="acct-soon-badge">' + esc(BCi18n.t("acc.soonBadge")) + "</span>" +
        '<strong>' + esc(BCi18n.t("acc.soonTitle")) + "</strong>" +
      "</div>" +
      '<p class="acct-soon-body">' + esc(BCi18n.t("acc.soonBody")) + "</p>"
    );
  }

  /* ---------- inject DOM chrome once per page ---------- */
  function injectChrome() {
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
      if (closeRow && closeRow.nextSibling) {
        drawer.insertBefore(card, closeRow.nextSibling);
      } else {
        drawer.prepend(card);
      }
    }

    if (!document.querySelector("#modal-account")) {
      var m = document.createElement("div");
      m.className = "modal-bc";
      m.id = "modal-account";
      m.setAttribute("role", "dialog");
      m.setAttribute("aria-modal", "true");
      m.setAttribute("aria-labelledby", "acc-modal-title");
      m.innerHTML =
        '<div class="box acct-modal-box">' +
          '<div class="acct-modal-head">' +
            '<div class="acct-tabs" role="tablist">' +
              '<button type="button" class="acct-tab active" data-acc-tab="login" role="tab" id="acc-modal-title"></button>' +
              '<button type="button" class="acct-tab" data-acc-tab="register" role="tab"></button>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span class="acct-soon-badge" data-i18n="acc.soonBadge">COMING SOON</span>' +
              '<button type="button" class="icon-btn" data-act="acc-close" aria-label="Close">✕</button>' +
            '</div>' +
          '</div>' +

          /* TAB 1: SIGN IN */
          '<section id="acc-pane-login" class="acct-pane">' +
            '<form id="acc-login-form" class="acct-form" novalidate autocomplete="off">' +
              '<div>' +
                '<label class="acct-label" for="acc-login-id" data-i18n="acc.loginIdLabel"></label>' +
                '<input id="acc-login-id" class="acct-input" type="text" data-i18n-ph="acc.loginIdPh" autocomplete="off">' +
              '</div>' +
              '<div>' +
                '<label class="acct-label" for="acc-login-pw" data-i18n="acc.pwLabel"></label>' +
                '<input id="acc-login-pw" class="acct-input" type="password" data-i18n-ph="acc.pwPh" autocomplete="off">' +
              '</div>' +
              '<div class="acct-row-between">' +
                '<label class="acct-check"><input type="checkbox" id="acc-login-rem" checked> <span data-i18n="acc.remember"></span></label>' +
                '<button type="button" class="acct-link-btn" data-act="acc-soon-trigger" data-i18n="acc.forgot"></button>' +
              '</div>' +
              '<div class="acct-soon-box" id="acc-login-soon" role="status" hidden></div>' +
              '<button type="submit" class="btn-bc btn-red" style="width:100%" data-i18n="acc.enterBtn"></button>' +
              '<p class="acct-note mono" data-i18n="acc.previewNote"></p>' +
            '</form>' +
          '</section>' +

          /* TAB 2: REGISTER */
          '<section id="acc-pane-register" class="acct-pane" hidden>' +
            '<form id="acc-reg-form" class="acct-form" novalidate autocomplete="off">' +
              '<div>' +
                '<label class="acct-label" for="acc-reg-name" data-i18n="acc.fullNameLabel"></label>' +
                '<input id="acc-reg-name" class="acct-input" type="text" data-i18n-ph="acc.fullNamePh" autocomplete="off">' +
              '</div>' +
              '<div class="acct-two-col">' +
                '<div>' +
                  '<label class="acct-label" for="acc-reg-email" data-i18n="acc.emailLabel"></label>' +
                  '<input id="acc-reg-email" class="acct-input" type="email" data-i18n-ph="acc.emailPh" autocomplete="off">' +
                '</div>' +
                '<div>' +
                  '<label class="acct-label" for="acc-reg-phone" data-i18n="acc.phoneLabel"></label>' +
                  '<input id="acc-reg-phone" class="acct-input" type="tel" data-i18n-ph="acc.phonePh" autocomplete="off">' +
                '</div>' +
              '</div>' +
              '<div>' +
                '<label class="acct-label" for="acc-reg-pw" data-i18n="acc.pwLabel"></label>' +
                '<input id="acc-reg-pw" class="acct-input" type="password" data-i18n-ph="acc.pwPh" autocomplete="off">' +
              '</div>' +
              '<div class="acct-soon-box" id="acc-reg-soon" role="status" hidden></div>' +
              '<button type="submit" class="btn-bc btn-red" style="width:100%" data-i18n="acc.createBtn"></button>' +
              '<p class="acct-note mono" data-i18n="acc.previewNote"></p>' +
            '</form>' +
          '</section>' +
        '</div>';
      document.body.appendChild(m);
    }
  }

  /* ---------- render nav button & drawer card ---------- */
  function renderNavChip() {
    var btn = document.querySelector("[data-act=acct-btn]");
    if (!btn) return;
    btn.classList.remove("is-signed");
    btn.innerHTML =
      '<span class="acct-av">' + USER_SVG + "</span>" +
      '<span class="acct-name">' + esc(BCi18n.t("acc.signIn")) + "</span>";
    btn.setAttribute("aria-label", BCi18n.t("acc.signIn"));
  }

  function renderDrawerCard() {
    var card = document.querySelector("#drawer-acct-card");
    if (!card) return;
    var st = BCStore.load();
    card.innerHTML =
      '<div class="drawer-acct-row">' +
        '<span class="acct-av acct-av-lg">' + USER_SVG + "</span>" +
        '<div class="drawer-acct-meta">' +
          '<strong>' + esc(BCi18n.t("acc.guest")) + "</strong>" +
          '<span class="mono mut">' + esc(BCi18n.t("acc.guestSub", { n: st.balance.toLocaleString("vi-VN") })) + "</span>" +
        "</div>" +
        '<button type="button" class="btn-bc btn-xs btn-gold" data-act="drawer-signin">' + esc(BCi18n.t("acc.signIn")) + "</button>" +
      "</div>";
    card.querySelector("[data-act=drawer-signin]").addEventListener("click", function () {
      BCUI.closeDrawer();
      openModal("login");
    });
  }

  /* ---------- modal helpers ---------- */
  function updateModalLabels() {
    var tLogin = document.querySelector("[data-acc-tab=login]");
    var tReg = document.querySelector("[data-acc-tab=register]");
    if (tLogin) tLogin.textContent = BCi18n.t("acc.tabLogin");
    if (tReg) tReg.textContent = BCi18n.t("acc.tabRegister");
  }

  function hideSoonBoxes() {
    ["#acc-login-soon", "#acc-reg-soon"].forEach(function (sel) {
      var box = document.querySelector(sel);
      if (box) box.hidden = true;
    });
  }

  function showComingSoon(boxSelector) {
    var box = document.querySelector(boxSelector);
    if (box) {
      box.innerHTML = comingSoonHtml();
      box.hidden = false;
    }
    if (window.BCAudio) BCAudio.pop();
    if (window.BCUI) BCUI.toast(BCi18n.t("acc.soonToast"), "gold");
  }

  function setTab(tab) {
    var activeTab = tab === "register" ? "register" : "login";
    document.querySelectorAll("[data-acc-tab]").forEach(function (b) {
      var isActive = b.getAttribute("data-acc-tab") === activeTab;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", String(isActive));
    });
    document.querySelector("#acc-pane-login").hidden = activeTab !== "login";
    document.querySelector("#acc-pane-register").hidden = activeTab !== "register";
    hideSoonBoxes();
  }

  function openModal(tab) {
    var m = document.querySelector("#modal-account");
    if (!m) return;
    updateModalLabels();
    BCi18n.apply();
    setTab(tab || "login");
    m.classList.add("show");
    if (window.BCAudio) BCAudio.pop();
  }

  function closeModal() {
    var m = document.querySelector("#modal-account");
    if (m) m.classList.remove("show");
  }

  /* ---------- leaderboard on play.html (sample NPCs) ---------- */
  function renderLeaderboard() {
    var tbody = document.querySelector("#lb-body");
    if (!tbody || !window.BC_DATA) return;
    var rows = (BC_DATA.LEADER_SAMPLE || []).slice().sort(function (a, b) {
      return b.xu - a.xu;
    }).slice(0, 7);

    var p1 = document.querySelector(".podium .p1");
    var p2 = document.querySelector(".podium .p2");
    var p3 = document.querySelector(".podium .p3");
    if (p1 && rows[0]) p1.innerHTML = "<strong>1</strong><br>" + esc(rows[0].name);
    if (p2 && rows[1]) p2.innerHTML = "<strong>2</strong><br>" + esc(rows[1].name);
    if (p3 && rows[2]) p3.innerHTML = "<strong>3</strong><br>" + esc(rows[2].name);

    tbody.innerHTML = rows.map(function (r, idx) {
      return "<tr>" +
        "<td>" + (idx + 1) + "</td>" +
        "<td>" + esc(r.name) + "</td>" +
        '<td class="mono">' + r.xu.toLocaleString("vi-VN") + "</td>" +
      "</tr>";
    }).join("");
  }

  /* ---------- gentle nudge when Guest unlocks first badge ---------- */
  function onBadgeUnlocked() {
    if (nudgeShown) return;
    nudgeShown = true;
    var zone = document.querySelector(".toast-zone");
    if (!zone) return;
    var el = document.createElement("div");
    el.className = "toast-bc acct-nudge-toast";
    el.innerHTML =
      '<span>' + esc(BCi18n.t("acc.nudge")) + "</span> " +
      '<button type="button" class="btn-bc btn-xs btn-gold" data-act="nudge-reg">' +
        esc(BCi18n.t("acc.soonBadge")) +
      "</button>";
    zone.appendChild(el);
    el.querySelector("[data-act=nudge-reg]").addEventListener("click", function () {
      el.remove();
      openModal("register");
    });
    setTimeout(function () {
      if (el.parentNode) {
        el.style.opacity = "0";
        setTimeout(function () { el.remove(); }, 250);
      }
    }, 6500);
  }

  /* ---------- wire events ---------- */
  function wireEvents() {
    var navBtn = document.querySelector("[data-act=acct-btn]");
    if (navBtn) {
      navBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        openModal("login");
      });
    }

    var modal = document.querySelector("#modal-account");
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }

    document.querySelectorAll("[data-acc-tab]").forEach(function (b) {
      b.addEventListener("click", function () {
        setTab(b.getAttribute("data-acc-tab"));
      });
    });

    var closeBtn = document.querySelector("[data-act=acc-close]");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    var soonLink = document.querySelector("[data-act=acc-soon-trigger]");
    if (soonLink) {
      soonLink.addEventListener("click", function () {
        showComingSoon("#acc-login-soon");
      });
    }

    var loginForm = document.querySelector("#acc-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        showComingSoon("#acc-login-soon");
      });
    }

    var regForm = document.querySelector("#acc-reg-form");
    if (regForm) {
      regForm.addEventListener("submit", function (e) {
        e.preventDefault();
        showComingSoon("#acc-reg-soon");
      });
    }
  }

  function boot() {
    injectChrome();
    BCi18n.apply();
    updateModalLabels();
    renderNavChip();
    renderDrawerCard();
    renderLeaderboard();
    wireEvents();

    if (window.BCWallet) {
      BCWallet.onChange(function () {
        renderDrawerCard();
      });
    }
    BCi18n.onLangChange(function () {
      updateModalLabels();
      renderNavChip();
      renderDrawerCard();
    });
  }

  return {
    boot: boot,
    openModal: openModal,
    onBadgeUnlocked: onBadgeUnlocked,
    renderLeaderboard: renderLeaderboard
  };
})();
