window.homePage = (function () {
  "use strict";

  var syncDemoLang = null;

  function pushMascotCard(track, item) {
    var card = document.createElement("button");
    card.className = "animal-card";
    card.innerHTML =
      '<img src="' + item.img + '" alt="' + lang.L(item.name) + '">' +
      '<div class="pad"><h3>' + lang.L(item.name) + "</h3>" +
      '<span class="en">' + lang.L(item.line) + "</span></div>";
    card.addEventListener("click", function () { showMascot(item.id); });
    track.appendChild(card);
  }

  function boot() {
    var track = document.querySelector("#animal-track");
    if (!track) return;

    gameConfig.MASCOTS.forEach(function (a) { pushMascotCard(track, a); });

    var prevBtn = document.querySelector("[data-act=car-prev]");
    var nextBtn = document.querySelector("[data-act=car-next]");
    if (prevBtn) prevBtn.addEventListener("click", function () { track.scrollBy({ left: -280, behavior: "smooth" }); });
    if (nextBtn) nextBtn.addEventListener("click", function () { track.scrollBy({ left: 280, behavior: "smooth" }); });

    paintFaq();
    setupDemo();
    lang.onLangChange(function () {
      track.innerHTML = "";
      gameConfig.MASCOTS.forEach(function (a) { pushMascotCard(track, a); });
      paintFaq();
      if (syncDemoLang) syncDemoLang();
    });
  }

  function setupDemo() {
    var sec = document.querySelector("#how-to-play");
    if (!sec) return;

    var demoChip = 100;
    var demoAnimal = 1;
    var spinning = false;
    var demoDice = [1, 1, 3];

    var chipBtns = sec.querySelectorAll(".demo-chip");
    var cellCard = sec.querySelector(".how-cell-demo");
    var betBadge = sec.querySelector(".cell-bet-pill");
    var cellImg = sec.querySelector(".cell-info img");
    var cellTxt = sec.querySelector(".cell-info .cell-label");
    var diceBox = sec.querySelector(".how-dice-demo");
    var payBadge = sec.querySelector(".demo-payout-pill");
    var dieEls = sec.querySelectorAll(".demo-die");

    function curLang() {
      return (window.saveStore && saveStore.load().lang) || "en";
    }

    function upperName(a) {
      var l = curLang();
      if (l === "vn") return a.name.vn.toUpperCase();
      if (l === "zh") return a.name.zh;
      return a.name.en.toUpperCase();
    }

    function dotRipple(el, ev) {
      if (!el) return;
      var box = el.getBoundingClientRect();
      var x = (ev && ev.clientX) ? (ev.clientX - box.left) : (box.width / 2);
      var y = (ev && ev.clientY) ? (ev.clientY - box.top) : (box.height / 2);
      var dot = document.createElement("span");
      dot.className = "how-click-burst";
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      el.appendChild(dot);
      setTimeout(function () { dot.remove(); }, 500);
    }

    function syncDemoPay(hits) {
      if (!payBadge) return;
      var mascotName = upperName(gameConfig.MASCOTS[demoAnimal]);
      var l = curLang();

      if (hits > 0) {
        if (l === "vn") payBadge.textContent = "Khớp " + hits + " " + mascotName + ": Hoàn gốc + Ăn ×" + hits + "!";
        else if (l === "zh") payBadge.textContent = "中 " + hits + " 个" + mascotName + "：返还本金 + 赔 " + hits + "×！";
        else payBadge.textContent = hits + " " + mascotName + " matched: Stake back + Win ×" + hits + "!";
        payBadge.style.background = hits === 3 ? "var(--red)" : "var(--gold)";
        payBadge.style.color = hits === 3 ? "var(--ink-on-dark)" : "var(--ink)";
      } else {
        if (l === "vn") payBadge.textContent = "Chưa trúng " + mascotName + ": Nhấn để lắc lại! 🎲";
        else if (l === "zh") payBadge.textContent = "未中 " + mascotName + ": 点击再试一次！🎲";
        else payBadge.textContent = "No " + mascotName + " matched: Tap to roll again! 🎲";
        payBadge.style.background = "var(--cream)";
        payBadge.style.color = "var(--mut-ink)";
      }
    }

    syncDemoLang = function () {
      var cur = gameConfig.MASCOTS[demoAnimal];
      if (cellTxt) cellTxt.textContent = upperName(cur);
      if (betBadge) betBadge.textContent = "+" + demoChip + " " + lang.t("unit.xu");
      var hits = demoDice.filter(function (i) { return i === demoAnimal; }).length;
      syncDemoPay(hits);
    };

    chipBtns.forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        e.stopPropagation();
        var v = parseInt(chip.getAttribute("data-val") || chip.textContent, 10);
        if (!v) return;
        demoChip = v;
        chipBtns.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        chip.classList.remove("pop-anim");
        void chip.offsetWidth;
        chip.classList.add("pop-anim");
        if (window.sfx) sfx.chip();

        if (betBadge) {
          betBadge.textContent = "+" + demoChip + " " + lang.t("unit.xu");
          betBadge.classList.remove("pop-anim");
          void betBadge.offsetWidth;
          betBadge.classList.add("pop-anim");
        }
        dotRipple(chip, e);
      });
    });

    function nextAnimal(e) {
      demoAnimal = (demoAnimal + 1) % gameConfig.MASCOTS.length;
      var a = gameConfig.MASCOTS[demoAnimal];
      if (cellImg) { cellImg.src = a.img; cellImg.alt = upperName(a); }
      if (cellTxt) cellTxt.textContent = upperName(a);
      if (betBadge) {
        betBadge.textContent = "+" + demoChip + " " + lang.t("unit.xu");
        betBadge.classList.remove("pop-anim");
        void betBadge.offsetWidth;
        betBadge.classList.add("pop-anim");
      }
      if (cellCard) {
        cellCard.classList.remove("cell-pulse");
        void cellCard.offsetWidth;
        cellCard.classList.add("cell-pulse");
      }
      if (window.sfx) sfx.chip();
      dotRipple(cellCard || sec.querySelector('.how-card[data-step="2"]'), e);

      var hits = demoDice.filter(function (i) { return i === demoAnimal; }).length;
      dieEls.forEach(function (dEl, idx) {
        dEl.classList.toggle("winner", demoDice[idx] === demoAnimal);
      });
      syncDemoPay(hits);
    }

    if (cellCard) {
      cellCard.addEventListener("click", function (e) {
        e.stopPropagation();
        nextAnimal(e);
      });
    }

    function rollDemo(e) {
      if (spinning) return;
      spinning = true;
      if (window.sfx) sfx.rattle(0.4);

      dieEls.forEach(function (d) { d.classList.add("rolling"); d.classList.remove("winner"); });
      dotRipple(diceBox || sec.querySelector('.how-card[data-step="3"]'), e);

      setTimeout(function () {
        dieEls.forEach(function (d) { d.classList.remove("rolling"); });
        var nFaces = gameConfig.MASCOTS.length;
        var rnd = Math.random();
        var picks;
        // bias demo roll slightly toward wins so new visitors see payout rules right away
        if (rnd < 0.45) picks = [demoAnimal, demoAnimal, Math.floor(Math.random() * nFaces)];
        else if (rnd < 0.75) picks = [demoAnimal, Math.floor(Math.random() * nFaces), Math.floor(Math.random() * nFaces)];
        else if (rnd < 0.85) picks = [demoAnimal, demoAnimal, demoAnimal];
        else picks = [Math.floor(Math.random() * nFaces), Math.floor(Math.random() * nFaces), Math.floor(Math.random() * nFaces)];
        picks.sort(function () { return 0.5 - Math.random(); });
        demoDice = picks;

        var hits = 0;
        dieEls.forEach(function (dEl, idx) {
          var a = gameConfig.MASCOTS[picks[idx]];
          var img = dEl.querySelector("img");
          if (img) { img.src = a.img; img.alt = upperName(a); }
          if (picks[idx] === demoAnimal) {
            hits++;
            dEl.classList.add("winner");
          }
        });

        if (hits > 0) {
          if (window.sfx) sfx.win();
          if (hits === 3 && window.anim) anim.confetti(true);
        } else if (window.sfx) {
          sfx.pop();
        }

        syncDemoPay(hits);
        if (payBadge) {
          payBadge.classList.remove("pop-anim");
          void payBadge.offsetWidth;
          payBadge.classList.add("pop-anim");
        }
        spinning = false;
      }, 400);
    }

    if (diceBox) {
      diceBox.addEventListener("click", function (e) {
        e.stopPropagation();
        rollDemo(e);
      });
    }

    var card1 = sec.querySelector('.how-card[data-step="1"]');
    if (card1) {
      card1.addEventListener("click", function (e) {
        if (e.target.closest(".demo-chip")) return;
        var vals = [10, 50, 100, 500];
        var next = vals[(vals.indexOf(demoChip) + 1) % vals.length];
        var btn = sec.querySelector('.demo-chip[data-val="' + next + '"]');
        if (btn) btn.click();
      });
    }

    var card2 = sec.querySelector('.how-card[data-step="2"]');
    if (card2) {
      card2.addEventListener("click", function (e) {
        if (e.target.closest(".how-cell-demo")) return;
        nextAnimal(e);
      });
    }

    var card3 = sec.querySelector('.how-card[data-step="3"]');
    if (card3) {
      card3.addEventListener("click", function (e) {
        if (e.target.closest(".how-dice-demo")) return;
        rollDemo(e);
      });
    }

    syncDemoLang();
  }

  function showMascot(id) {
    var a = gameConfig.MASCOTS.filter(function (x) { return x.id === id; })[0];
    var data = saveStore.load();
    if (data.seenAnimals.indexOf(id) === -1) {
      data.seenAnimals.push(id);
      saveStore.save();
    }
    awards.check("animal_viewed");
    var modal = document.querySelector("#modal-animal");
    var cur = (saveStore.load && saveStore.load().lang) || "en";
    var others = [];
    if (cur !== "vn") others.push(a.name.vn);
    if (cur !== "en") others.push(a.name.en);
    if (cur !== "zh") others.push(a.name.zh);
    var subTag = others.length ? ' <span class="mono mut">(' + others.join(" · ") + ")</span>" : "";

    modal.querySelector(".box").innerHTML =
      '<div class="close-row"><button class="icon-btn" data-act="modal-close" aria-label="Close">✕</button></div>' +
      '<img src="' + a.img + '" alt="' + lang.L(a.name) + '" style="width:100%;border:3px solid var(--ink);border-radius:12px;display:block;">' +
      '<h3 style="margin:14px 0 6px">' + lang.L(a.name) + subTag + "</h3>" +
      "<p><strong>" + lang.L(a.line) + "</strong></p>" +
      '<p style="margin:0">' + lang.L(a.fact) + "</p>";
    modal.classList.add("show");
    modal.onclick = function (e) { if (e.target === modal) modal.classList.remove("show"); };
    modal.querySelector("[data-act=modal-close]").addEventListener("click", function () {
      modal.classList.remove("show");
    });
    sfx.pop();
  }

  function paintFaq() {
    var zone = document.querySelector("#faq-zone");
    if (!zone) return;
    zone.innerHTML = "";
    studyData.FAQ.forEach(function (item) {
      var d = document.createElement("details");
      d.className = "faq";
      d.innerHTML = "<summary>" + lang.L(item.q) + '</summary><div class="a">' + lang.L(item.a) + "</div>";
      zone.appendChild(d);
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
  return { boot: boot };
})();
