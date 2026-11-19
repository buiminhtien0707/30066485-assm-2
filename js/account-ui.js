window.loginModal = (function () {
  "use strict";

  var NAME_KEY = "bc_guest_name";
  var AVATAR_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="8.5" r="4" fill="#FFC93C" stroke="#141414" stroke-width="2"/><path d="M4.5 20c1.5-4 4.2-6 7.5-6s6 2 7.5 6" fill="#FAF3E7" stroke="#141414" stroke-width="2" stroke-linecap="round"/></svg>';

  function escHtml(val) {
    return String(val == null ? "" : val)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getGuestName() {
    try {
      var saved = localStorage.getItem(NAME_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
    return lang.t("acc.guest");
  }

  function setGuestName(name) {
    try {
      var clean = String(name || "").trim().slice(0, 24);
      if (clean) localStorage.setItem(NAME_KEY, clean);
      else localStorage.removeItem(NAME_KEY);
    } catch (e) {}
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
            '<h3 id="acc-modal-title" style="margin:0;font-size:20px"></h3>' +
            '<button type="button" class="icon-btn" data-act="acc-close" aria-label="Close">✕</button>' +
          "</div>" +
          '<form id="acc-profile-form" class="acct-form" novalidate autocomplete="off">' +
            "<div>" +
              '<label class="acct-label" for="acc-guest-name" id="acc-name-label"></label>' +
              '<input id="acc-guest-name" class="acct-input" type="text" maxlength="24" autocomplete="off">' +
            "</div>" +
            '<button type="submit" class="btn-bc btn-red" style="width:100%" id="acc-save-btn"></button>' +
            '<p class="acct-note mono" id="acc-local-note"></p>' +
          "</form>" +
        "</div>";
      document.body.appendChild(modalEl);
    }
  }

  function syncLabels() {
    var cur = lang.lang();
    var title = document.querySelector("#acc-modal-title");
    var label = document.querySelector("#acc-name-label");
    var input = document.querySelector("#acc-guest-name");
    var btn = document.querySelector("#acc-save-btn");
    var note = document.querySelector("#acc-local-note");
    if (title) title.textContent = cur === "vn" ? "Hồ sơ người chơi" : (cur === "zh" ? "本地玩家档案" : "Local Player Profile");
    if (label) label.textContent = cur === "vn" ? "Tên hiển thị (lưu trên máy)" : (cur === "zh" ? "显示名称（本地保存）" : "Display name (saved locally)");
    if (input) input.placeholder = lang.t("acc.guest");
    if (btn) btn.textContent = cur === "vn" ? "Lưu tên" : (cur === "zh" ? "保存名称" : "Save name");
    if (note) note.textContent = cur === "vn" ? "Dữ liệu lưu cục bộ trên trình duyệt, không cần đăng nhập." : (cur === "zh" ? "所有金币与徽章均保存在本地浏览器，无需登录。" : "Coins and badges are saved locally in your browser — no sign-in required.");
  }

  function drawNavBtn() {
    var btn = document.querySelector("[data-act=acct-btn]");
    if (!btn) return;
    var name = getGuestName();
    btn.classList.remove("is-signed");
    btn.innerHTML =
      '<span class="acct-av">' + AVATAR_SVG + "</span>" +
      '<span class="acct-name">' + escHtml(name) + "</span>";
    btn.setAttribute("aria-label", name);
  }

  function drawDrawerAcct() {
    var card = document.querySelector("#drawer-acct-card");
    if (!card) return;
    var data = saveStore.load();
    var name = getGuestName();
    card.innerHTML =
      '<div class="drawer-acct-row">' +
        '<span class="acct-av acct-av-lg">' + AVATAR_SVG + "</span>" +
        '<div class="drawer-acct-meta">' +
          "<strong>" + escHtml(name) + "</strong>" +
          '<span class="mono mut">' + escHtml(lang.t("acc.guestSub", { n: data.balance.toLocaleString("vi-VN") })) + "</span>" +
        "</div>" +
        '<button type="button" class="btn-bc btn-xs btn-gold" data-act="drawer-signin">' + escHtml(lang.lang() === "vn" ? "Đổi tên" : (lang.lang() === "zh" ? "改名" : "Rename")) + "</button>" +
      "</div>";
    card.querySelector("[data-act=drawer-signin]").addEventListener("click", function () {
      appShell.closeDrawer();
      showModal();
    });
  }

  function showModal() {
    var modalEl = document.querySelector("#modal-account");
    if (!modalEl) return;
    syncLabels();
    var input = document.querySelector("#acc-guest-name");
    if (input) {
      try { input.value = localStorage.getItem(NAME_KEY) || ""; } catch (e) { input.value = ""; }
    }
    modalEl.classList.add("show");
    if (input) input.focus();
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

  function onBadgeUnlocked() {}

  function bindEvents() {
    var navBtn = document.querySelector("[data-act=acct-btn]");
    if (navBtn) {
      navBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        showModal();
      });
    }

    var modalEl = document.querySelector("#modal-account");
    if (modalEl) {
      modalEl.addEventListener("click", function (e) {
        if (e.target === modalEl) hideModal();
      });
    }

    var closeBtn = document.querySelector("[data-act=acc-close]");
    if (closeBtn) closeBtn.addEventListener("click", hideModal);

    var form = document.querySelector("#acc-profile-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = document.querySelector("#acc-guest-name");
        setGuestName(input ? input.value : "");
        drawNavBtn();
        drawDrawerAcct();
        hideModal();
        if (window.sfx) sfx.pop();
        if (window.appShell) {
          var cur = lang.lang();
          appShell.toast(cur === "vn" ? "Đã lưu tên hiển thị!" : (cur === "zh" ? "已保存显示名称！" : "Display name saved!"));
        }
      });
    }
  }

  function boot() {
    mountShell();
    lang.apply();
    syncLabels();
    drawNavBtn();
    drawDrawerAcct();
    drawRankings();
    bindEvents();

    if (window.coinBank) {
      coinBank.onChange(function () { drawDrawerAcct(); });
    }
    lang.onLangChange(function () {
      syncLabels();
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
