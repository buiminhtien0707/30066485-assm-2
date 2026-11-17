/* page-learn.js - mastery bar + rules sandbox + filtered mascots + comparison origins + compact modal */
window.BCPageLearn = (function () {
  "use strict";

  var tab = "rules";
  var calcStake = 100;
  var calcMatches = 2;
  var animalFilter = "all";
  var CATS = { bau: "garden", cua: "water", tom: "water", ca: "water", ga: "garden", huou: "swap" };

  function getInitialTab() {
    var hash = (location.hash || "").replace("#", "").toLowerCase();
    var search = new URLSearchParams(location.search).get("tab");
    var valid = ["rules", "animal", "history", "tet"];
    if (valid.indexOf(hash) !== -1) return hash;
    if (valid.indexOf(search) !== -1) return search;
    return "rules";
  }

  function setTab(t) {
    tab = t;
    document.querySelectorAll(".tab").forEach(function (x) {
      x.classList.toggle("active", x.dataset.tab === tab);
    });
    render();
  }

  function boot() {
    if (!document.querySelector("#learn-root")) return;
    tab = getInitialTab();
    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { setTab(b.dataset.tab); });
    });
    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace("#", "").toLowerCase();
      if (["rules", "animal", "history", "tet"].indexOf(h) !== -1) setTab(h);
    });
    setTab(tab);
    BCi18n.onLangChange(render);
  }

  function renderProgress() {
    var el = document.querySelector("#learn-progress");
    if (!el) return;
    var st = BCStore.load();
    var seen = (st.seenAnimals || []).length;
    var best = st.bestQuiz || 0;
    var pct = Math.round(((seen / 6 + best / 8) / 2) * 100);
    el.innerHTML =
      '<div class="learn-mastery">' +
        '<div class="learn-mastery-track">' +
          '<div class="learn-mastery-head"><span>' + BCi18n.t("learn.progressLabel") + '</span><span class="learn-mastery-pct">' + pct + '%</span></div>' +
          '<div class="learn-prog-rail"><div class="learn-prog-fill" style="width:' + pct + '%"></div></div>' +
          '<p class="learn-mastery-hint">' + BCi18n.t("learn.progressHint") + '</p>' +
        '</div>' +
        '<div class="learn-mastery-stats">' +
          '<div class="mastery-stat-pill"><div class="num">' + seen + '/6</div><div class="lbl">' + BCi18n.t("learn.mascotsSeen") + '</div></div>' +
          '<div class="mastery-stat-pill"><div class="num">' + best + '/8</div><div class="lbl">' + BCi18n.t("learn.quizBest") + '</div></div>' +
        '</div>' +
      '</div>';
  }

  function render() {
    renderProgress();
    var zone = document.querySelector("#learn-zone");
    if (!zone) return;
    zone.innerHTML = "";
    if (tab === "animal") {
      zone.className = "learn-full";
      return renderAnimals(zone);
    }
    zone.className = "learn-full";
    if (tab === "history") return renderOrigins(zone);
    if (tab === "rules") return renderRules(zone);
    if (tab === "tet") return renderTet(zone);
  }

  function byId(id) {
    return BC_DATA.ANIMALS.filter(function (a) { return a.id === id; })[0];
  }

  function renderAnimals(zone) {
    var st = BCStore.load();
    var seenList = st.seenAnimals || [];
    var filters = [
      { id: "all", key: "learn.filterAll" },
      { id: "water", key: "learn.filterWater" },
      { id: "garden", key: "learn.filterGarden" },
      { id: "swap", key: "learn.filterSwap" }
    ];

    var bar = document.createElement("div");
    bar.className = "animal-filter-bar";
    bar.innerHTML = filters.map(function (f) {
      return '<button class="animal-filter-btn ' + (animalFilter === f.id ? "active" : "") + '" data-filter="' + f.id + '">' + BCi18n.t(f.key) + "</button>";
    }).join("");
    bar.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () {
        animalFilter = b.dataset.filter;
        renderAnimals(zone);
      });
    });

    zone.innerHTML = "";
    zone.appendChild(bar);

    var grid = document.createElement("div");
    grid.className = "learn-grid";
    BC_DATA.ANIMALS.filter(function (a) {
      return animalFilter === "all" || CATS[a.id] === animalFilter;
    }).forEach(function (a) {
      var seen = seenList.indexOf(a.id) !== -1;
      var card = document.createElement("button");
      card.className = "animal-card story-card";
      card.innerHTML =
        '<img src="' + a.img + '" alt="' + BCi18n.L(a.name) + '">' +
        '<div class="pad">' +
          '<div class="animal-head-row"><h3>' + BCi18n.L(a.name) + '</h3>' +
          '<span class="seen-pill ' + (seen ? "is-seen" : "") + '">' + (seen ? "✓ " + BCi18n.t("learn.seenBadge") : BCi18n.t("learn.tapInspect")) + '</span></div>' +
          '<span class="en">' + BCi18n.L(a.line) + "</span>" +
        "</div>";
      card.addEventListener("click", function () { openAnimal(a.id); });
      grid.appendChild(card);
    });
    zone.appendChild(grid);
  }

  function stepCard(num, titleKey, descKey) {
    return '<div class="rules-step-card"><div class="step-num">' + num + '</div><h4>' + BCi18n.t(titleKey) + '</h4><p>' + BCi18n.t(descKey) + "</p></div>";
  }

  function payoutRow(cls, idx) {
    return '<div class="payout-row ' + cls + '"><span class="badge-tag">' + BCi18n.t("learn.payoutRow" + idx) + '</span><span class="calc">' + BCi18n.t("learn.payoutRow" + idx + "Desc") + '</span><span class="res">' + BCi18n.t("learn.payoutRow" + idx + "Res") + "</span></div>";
  }

  function renderCalcMarkup() {
    var ret = calcMatches === 0 ? 0 : calcStake + calcStake * calcMatches;
    var net = calcMatches === 0 ? -calcStake : calcStake * calcMatches;
    var netStr = (net >= 0 ? "+" : "") + net;
    var diceIds = calcMatches === 0 ? ["bau", "ga", "tom"] : (calcMatches === 1 ? ["cua", "bau", "ga"] : (calcMatches === 2 ? ["cua", "cua", "ca"] : ["cua", "cua", "cua"]));
    var formula = calcMatches === 0
      ? BCi18n.t("learn.calcLose", { s: calcStake })
      : BCi18n.t("learn.calcFormula", { s: calcStake, m: calcMatches, r: ret });

    return '<div class="calc-sandbox">' +
      '<div class="calc-head"><div><h3>' + BCi18n.t("learn.calcTitle") + '</h3><p>' + BCi18n.t("learn.calcSub") + '</p></div><span class="calc-formula-pill">' + formula + '</span></div>' +
      '<div class="calc-grid">' +
        '<div>' +
          '<div class="calc-ctrl-lbl">' + BCi18n.t("learn.calcStake") + '</div>' +
          '<div class="calc-btn-row">' +
            [10, 50, 100, 500].map(function (v) {
              return '<button type="button" class="calc-pill is-stake ' + (calcStake === v ? "active" : "") + '" data-stake="' + v + '">' + v + '</button>';
            }).join("") +
          '</div>' +
          '<div class="calc-ctrl-lbl">' + BCi18n.t("learn.calcMatch") + '</div>' +
          '<div class="calc-btn-row">' +
            [0, 1, 2, 3].map(function (v) {
              return '<button type="button" class="calc-pill is-match ' + (calcMatches === v ? "active" : "") + '" data-match="' + v + '">' + v + '×</button>';
            }).join("") +
          '</div>' +
        '</div>' +
        '<div class="calc-stage">' +
          '<div class="calc-dice-row">' +
            diceIds.map(function (id) {
              var a = byId(id);
              return '<div class="calc-die ' + (id === "cua" ? "is-hit" : "") + '"><img src="' + a.img + '" alt="' + BCi18n.L(a.name) + '"><span>' + BCi18n.L(a.name) + "</span></div>";
            }).join("") +
          '</div>' +
          '<div class="calc-readout">' +
            '<div class="ret-lbl">' + BCi18n.t("learn.calcReturn") + '</div>' +
            '<div class="ret-val ' + (calcMatches === 0 ? "is-zero" : "") + '">' + ret + '</div>' +
            '<div class="net-val">' + BCi18n.t("learn.calcNet", { n: netStr }) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderRules(zone) {
    var box = document.createElement("div");
    box.className = "card-bc learn-rules-box";
    box.innerHTML =
      '<div class="rules-header"><h2>' + BCi18n.t("tab.rules") + '</h2><p class="lead" style="font-size:16px;color:var(--mut-ink);margin:6px 0 0">' + BCi18n.t("learn.rulesIntro") + "</p></div>" +
      '<div class="rules-steps-grid">' +
        stepCard("01", "how.1t", "learn.ruleStep1Desc") +
        stepCard("02", "how.2t", "learn.ruleStep2Desc") +
        stepCard("03", "how.3t", "learn.ruleStep3Desc") +
      "</div>" +
      '<div id="calc-sandbox-host">' + renderCalcMarkup() + "</div>" +
      '<div class="payout-table-card"><h3>' + BCi18n.t("learn.payoutTitle") + '</h3><div class="payout-rows">' +
        payoutRow("lose", 0) + payoutRow("win1", 1) + payoutRow("win2", 2) + payoutRow("win3", 3) +
      "</div>" +
      '<div class="example-box"><strong>' + BCi18n.t("learn.exampleLabel") + ': </strong><span>' + BCi18n.t("learn.rulesNote") + "</span></div>" +
      '<div class="example-box" style="margin-top:8px;border-left-color:var(--gold);"><span>' + BCi18n.t("learn.rulesMultiDesc") + "</span></div></div>" +
      '<div class="rules-cta-bar"><a href="play.html" class="btn-bc btn-red">' + BCi18n.t("learn.playNowBtn") + ' ➜</a><a href="index.html#how-to-play" class="btn-bc btn-ghost">' + BCi18n.t("learn.quickGuideBtn") + "</a></div>";

    zone.appendChild(box);
    wireCalc(box);
  }

  function wireCalc(scope) {
    scope.querySelectorAll("[data-stake]").forEach(function (b) {
      b.addEventListener("click", function () {
        calcStake = Number(b.dataset.stake);
        var host = document.querySelector("#calc-sandbox-host");
        if (host) { host.innerHTML = renderCalcMarkup(); wireCalc(host); }
      });
    });
    scope.querySelectorAll("[data-match]").forEach(function (b) {
      b.addEventListener("click", function () {
        calcMatches = Number(b.dataset.match);
        var host = document.querySelector("#calc-sandbox-host");
        if (host) { host.innerHTML = renderCalcMarkup(); wireCalc(host); }
      });
    });
  }

  function renderOrigins(zone) {
    var box = document.createElement("div");
    box.className = "card-bc learn-static-box";
    var rows = [1, 2, 3].map(function (i) {
      return '<div class="origin-row"><strong>' + BCi18n.t("learn.originRow" + i + "K") + '</strong><span>' + BCi18n.t("learn.originRow" + i + "L") + '</span><span class="vn-col">' + BCi18n.t("learn.originRow" + i + "R") + "</span></div>";
    }).join("");

    box.innerHTML =
      '<div class="rules-header"><h2>' + BCi18n.t("tab.history") + '</h2><p class="lead" style="font-size:15px;color:var(--mut-ink);margin:6px 0 0">' + BCi18n.t("learn.historyBody") + "</p></div>" +
      '<div class="origin-compare-grid">' +
        '<div class="origin-side-card"><h3 style="margin:0 0 4px">' + BCi18n.t("learn.originSource") + '</h3><p class="mut" style="margin:0;font-size:13px">' + BCi18n.t("learn.originSourceSub") + "</p></div>" +
        '<div class="origin-side-card is-vn"><h3 style="margin:0 0 4px">' + BCi18n.t("learn.originLocal") + '</h3><p class="mut" style="margin:0;font-size:13px">' + BCi18n.t("learn.originLocalSub") + "</p></div>" +
      "</div>" +
      '<div class="origin-rows">' + rows + "</div>";
    zone.appendChild(box);
  }

  function renderTet(zone) {
    var box = document.createElement("div");
    box.className = "card-bc learn-static-box";
    var pillars = [1, 2, 3].map(function (i) {
      return '<div class="tet-pillar-card"><div class="pillar-num">' + BCi18n.t("learn.tetP" + i + "N") + '</div><h4>' + BCi18n.t("learn.tetP" + i + "T") + '</h4><p>' + BCi18n.t("learn.tetP" + i + "D") + "</p></div>";
    }).join("");

    box.innerHTML =
      '<div class="rules-header"><h2>' + BCi18n.t("tab.tet") + '</h2><p class="lead" style="font-size:15px;color:var(--mut-ink);margin:6px 0 0">' + BCi18n.t("learn.tetBody") + "</p></div>" +
      '<div class="tet-pillars-grid">' + pillars + "</div>" +
      '<p class="mut" style="font-size:14px;margin:8px 0 0">' + BCi18n.t("learn.tetNote") + "</p>" +
      '<div class="rules-cta-bar"><a href="play.html" class="btn-bc btn-red">' + BCi18n.t("learn.tetToPlay") + ' ➜</a><a href="tet.html" class="btn-bc btn-ghost">' + BCi18n.t("learn.tetToCulture") + "</a></div>";
    zone.appendChild(box);
  }

  function openAnimal(id) {
    var animals = BC_DATA.ANIMALS;
    var idx = -1;
    animals.forEach(function (x, i) { if (x.id === id) idx = i; });
    if (idx === -1) return;
    var a = animals[idx];

    var st = BCStore.load();
    if (st.seenAnimals.indexOf(id) === -1) {
      st.seenAnimals.push(id);
      BCStore.save();
      BCBadges.check("animal_viewed");
      renderProgress();
      if (tab === "animal") {
        var zone = document.querySelector("#learn-zone");
        if (zone) renderAnimals(zone);
      }
    }

    var modal = document.querySelector("#modal-animal");
    var seenCount = (BCStore.load().seenAnimals || []).length;
    modal.querySelector(".box").innerHTML =
      '<div class="close-row" style="justify-content:space-between;align-items:center">' +
        '<span class="seen-pill is-seen">✓ ' + BCi18n.t("learn.seenBadge") + ' (' + seenCount + '/6)</span>' +
        '<button class="icon-btn" data-act="modal-close" aria-label="Close">✕</button>' +
      '</div>' +
      '<div class="animal-modal-grid">' +
        '<img class="animal-modal-art" src="' + a.img + '" alt="' + BCi18n.L(a.name) + '">' +
        '<div>' +
          '<h3 style="margin:0 0 4px">' + BCi18n.L(a.name) + '</h3>' +
          '<div class="animal-lang-badges">' +
            '<span class="animal-lang-pill">VN: ' + a.name.vn + '</span>' +
            '<span class="animal-lang-pill">EN: ' + a.name.en + '</span>' +
            '<span class="animal-lang-pill">ZH: ' + a.name.zh + '</span>' +
          '</div>' +
          '<p style="margin:0 0 8px"><strong>' + BCi18n.L(a.line) + '</strong></p>' +
          '<p style="margin:0;font-size:14px;color:var(--mut-ink)">' + BCi18n.L(a.fact) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="animal-modal-nav">' +
        '<button class="btn-bc btn-sm btn-ghost" id="modal-prev-animal">' + BCi18n.t("learn.prevMascot") + '</button>' +
        '<span class="mono mut" style="font-size:12px">' + (idx + 1) + ' / ' + animals.length + '</span>' +
        '<button class="btn-bc btn-sm btn-gold" id="modal-next-animal">' + BCi18n.t("learn.nextMascot") + '</button>' +
      '</div>';

    modal.classList.add("show");
    modal.onclick = function (e) { if (e.target === modal) modal.classList.remove("show"); };
    modal.querySelector("[data-act=modal-close]").addEventListener("click", function () { modal.classList.remove("show"); });
    modal.querySelector("#modal-prev-animal").addEventListener("click", function () {
      openAnimal(animals[(idx - 1 + animals.length) % animals.length].id);
    });
    modal.querySelector("#modal-next-animal").addEventListener("click", function () {
      openAnimal(animals[(idx + 1) % animals.length].id);
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
  return { boot: boot, renderProgress: renderProgress };
})();
