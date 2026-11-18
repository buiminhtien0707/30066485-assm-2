window.tetPage = (function () {
  "use strict";

  function boot() {
    if (!document.querySelector("#tet-root")) return;
    var clip = window.gameConfig && window.gameConfig.VIDEO_ID;
    var slot = document.querySelector("#video-slot");
    if (clip && slot) {
      document.querySelector("#tet-video").src = "https://www.youtube.com/embed/" + clip;
      slot.style.display = "block";
    }
    drawTimeline();
    bindForm();
    lang.onLangChange(drawTimeline);
  }
  document.addEventListener("DOMContentLoaded", boot);

  function refreshCount() {
    var msgEl = document.querySelector("#fb-msg");
    var cntEl = document.querySelector("#fb-count");
    if (msgEl && cntEl) {
      cntEl.textContent = lang.t("tet.counter", { n: msgEl.value.length });
    }
  }

  function drawTimeline() {
    var list = document.querySelector("#tet-timeline");
    list.innerHTML = "";
    studyData.TIMELINE.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "tl-item";
      row.innerHTML = "<h4>" + lang.L(item.t) + "</h4><p>" + lang.L(item.d) + "</p>";
      list.appendChild(row);
    });
    refreshCount();
  }

  function bindForm() {
    var form = document.querySelector("#fb-form");
    var msgEl = document.querySelector("#fb-msg");
    var cntEl = document.querySelector("#fb-count");

    msgEl.addEventListener("input", function () {
      cntEl.textContent = lang.t("tet.counter", { n: msgEl.value.length });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var email = form.email.value.trim();
      var body = msgEl.value.trim();

      var emailWrap = form.email.closest(".field");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        emailWrap.classList.add("invalid");
        valid = false;
      } else {
        emailWrap.classList.remove("invalid");
      }

      var msgWrap = msgEl.closest(".field");
      if (body.length < 10) {
        msgWrap.classList.add("invalid");
        valid = false;
      } else {
        msgWrap.classList.remove("invalid");
      }

      if (!valid) { sfx.lose(); return; }

      var data = saveStore.load();
      data.letters.push({ email: email, body: body, when: new Date().toISOString() });
      saveStore.save();
      appShell.toast(lang.t("tet.ok"), "win");
      sfx.win();
      form.reset();
      cntEl.textContent = lang.t("tet.counter", { n: 0 });
    });
  }

  return { boot: boot };
})();
