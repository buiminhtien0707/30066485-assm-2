window.learnPage = (function () {
  "use strict";

  var curTab = "rules";
  var simStake = 100;
  var simHits = 2;
  var filterGroup = "all";
  var GROUPS = { bau: "garden", cua: "water", tom: "water", ca: "water", ga: "garden", huou: "swap" };

  function readStartTab() {
    var hash = (location.hash || "").replace("#", "").toLowerCase();
    var queryTab = new URLSearchParams(location.search).get("tab");
    var allowed = ["rules", "animal", "history", "tet"];
    if (allowed.indexOf(hash) !== -1) return hash;
    if (allowed.indexOf(queryTab) !== -1) return queryTab;
    return "rules";
  }

  function openTab(next) {
    curTab = next;
    document.querySelectorAll(".tab").forEach(function (el) {
      el.classList.toggle("active", el.dataset.tab === curTab);
    });
    drawView();
  }

  function boot() {
    if (!document.querySelector("#learn-root")) return;
    curTab = readStartTab();
    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { openTab(b.dataset.tab); });
    });
    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace("#", "").toLowerCase();
      if (["rules", "animal", "history", "tet"].indexOf(h) !== -1) openTab(h);
    });
    openTab(curTab);
    lang.onLangChange(drawView);
  }

  function renderProgress() {
    var box = document.querySelector("#learn-progress");
    if (!box) return;
    var data = saveStore.load();
    var seen = (data.seenAnimals || []).length;
    var best = data.bestQuiz || 0;
    var pct = Math.round(((seen / 6 + best / 8) / 2) * 100);
    box.innerHTML =
      '<div class="learn-mastery">' +
        '<div class="learn-mastery-track">' +
          '<div class="learn-mastery-head"><span>' + lang.t("learn.progressLabel") + '</span><span class="learn-mastery-pct">' + pct + "%</span></div>" +
          '<div class="learn-prog-rail"><div class="learn-prog-fill" style="width:' + pct + '%"></div></div>' +
          '<p class="learn-mastery-hint">' + lang.t("learn.progressHint") + "</p>" +
        "</div>" +
        '<div class="learn-mastery-stats">' +
          '<div class="mastery-stat-pill"><div class="num">' + seen + '/6</div><div class="lbl">' + lang.t("learn.mascotsSeen") + "</div></div>" +
          '<div class="mastery-stat-pill"><div class="num">' + best + '/8</div><div class="lbl">' + lang.t("learn.quizBest") + "</div></div>" +
        "</div>" +
      "</div>";
  }

  function drawView() {
    renderProgress();
    var zone = document.querySelector("#learn-zone");
    if (!zone) return;
    zone.innerHTML = "";
    zone.className = "learn-full";
    if (curTab === "animal") return drawMascots(zone);
    if (curTab === "history") return drawHistory(zone);
    if (curTab === "rules") return drawRules(zone);
    if (curTab === "tet") return drawTetTab(zone);
  }

  function getMascot(id) {
    return gameConfig.MASCOTS.filter(function (a) { return a.id === id; })[0];
  }

  function stripToneMarks(txt) {
    return (txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d").replace(/\u0110/g, "D");
  }

  function drawMascots(zone) {
    var data = saveStore.load();
    var seenIds = data.seenAnimals || [];
    var filters = [
      { id: "all", key: "learn.filterAll" },
      { id: "water", key: "learn.filterWater" },
      { id: "garden", key: "learn.filterGarden" },
      { id: "swap", key: "learn.filterSwap" }
    ];

    var bar = document.createElement("div");
    bar.className = "animal-filter-bar";
    bar.innerHTML = filters.map(function (f) {
      return '<button class="animal-filter-btn ' + (filterGroup === f.id ? "active" : "") + '" data-filter="' + f.id + '">' + lang.t(f.key) + "</button>";
    }).join("");
    bar.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () {
        filterGroup = b.dataset.filter;
        drawMascots(zone);
      });
    });

    zone.innerHTML = "";
    zone.appendChild(bar);

    var grid = document.createElement("div");
    grid.className = "learn-grid";
    gameConfig.MASCOTS.filter(function (a) {
      return filterGroup === "all" || GROUPS[a.id] === filterGroup;
    }).forEach(function (a) {
      var seen = seenIds.indexOf(a.id) !== -1;
      var card = document.createElement("button");
      card.className = "animal-card story-card";
      card.innerHTML =
        '<img src="' + a.img + '" alt="' + lang.L(a.name) + '">' +
        '<div class="pad">' +
          '<div class="animal-head-row"><h3>' + lang.L(a.name) + "</h3>" +
          '<span class="seen-pill ' + (seen ? "is-seen" : "") + '">' + (seen ? "✓ " + lang.t("learn.seenBadge") : lang.t("learn.tapInspect")) + "</span></div>" +
          '<span class="en">' + lang.L(a.line) + "</span>" +
        "</div>";
      card.addEventListener("click", function () { openMascot(a.id); });
      grid.appendChild(card);
    });
    zone.appendChild(grid);
  }

  function stepBox(num, titleKey, descKey) {
    return '<div class="rules-step-card"><div class="step-num">' + num + "</div><h4>" + lang.t(titleKey) + "</h4><p>" + lang.t(descKey) + "</p></div>";
  }

  function rateRow(cls, idx) {
    return '<div class="payout-row ' + cls + '"><span class="badge-tag">' + lang.t("learn.payoutRow" + idx) + '</span><span class="calc">' + lang.t("learn.payoutRow" + idx + "Desc") + '</span><span class="res">' + lang.t("learn.payoutRow" + idx + "Res") + "</span></div>";
  }

  function sandboxHtml() {
    var ret = simHits === 0 ? 0 : simStake + simStake * simHits;
    var net = simHits === 0 ? -simStake : simStake * simHits;
    var netStr = (net >= 0 ? "+" : "") + net;
    var sampleFaces = simHits === 0 ? ["bau", "ga", "tom"] : (simHits === 1 ? ["cua", "bau", "ga"] : (simHits === 2 ? ["cua", "cua", "ca"] : ["cua", "cua", "cua"]));
    var formula = simHits === 0
      ? lang.t("learn.calcLose", { s: simStake })
      : lang.t("learn.calcFormula", { s: simStake, m: simHits, r: ret });

    return '<div class="calc-sandbox">' +
      '<div class="calc-head"><div><h3>' + lang.t("learn.calcTitle") + "</h3><p>" + lang.t("learn.calcSub") + '</p></div><span class="calc-formula-pill">' + formula + "</span></div>" +
      '<div class="calc-grid">' +
        "<div>" +
          '<div class="calc-ctrl-lbl">' + lang.t("learn.calcStake") + "</div>" +
          '<div class="calc-btn-row">' +
            [10, 50, 100, 500].map(function (v) {
              return '<button type="button" class="calc-pill is-stake ' + (simStake === v ? "active" : "") + '" data-stake="' + v + '">' + v + "</button>";
            }).join("") +
          "</div>" +
          '<div class="calc-ctrl-lbl">' + lang.t("learn.calcMatch") + "</div>" +
          '<div class="calc-btn-row">' +
            [0, 1, 2, 3].map(function (v) {
              return '<button type="button" class="calc-pill is-match ' + (simHits === v ? "active" : "") + '" data-match="' + v + '">' + v + "×</button>";
            }).join("") +
          "</div>" +
        "</div>" +
        '<div class="calc-stage">' +
          '<div class="calc-dice-row">' +
            sampleFaces.map(function (id) {
              var a = getMascot(id);
              return '<div class="calc-die ' + (id === "cua" ? "is-hit" : "") + '"><img src="' + a.img + '" alt="' + lang.L(a.name) + '"><span>' + lang.L(a.name) + "</span></div>";
            }).join("") +
          "</div>" +
          '<div class="calc-readout">' +
            '<div class="ret-lbl">' + lang.t("learn.calcReturn") + "</div>" +
            '<div class="ret-val ' + (simHits === 0 ? "is-zero" : "") + '">' + ret + "</div>" +
            '<div class="net-val">' + lang.t("learn.calcNet", { n: netStr }) + "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function drawRules(zone) {
    var card = document.createElement("div");
    card.className = "card-bc learn-rules-box";
    card.innerHTML =
      '<div class="rules-header"><h2>' + lang.t("tab.rules") + '</h2><p class="lead" style="font-size:16px;color:var(--mut-ink);margin:6px 0 0">' + lang.t("learn.rulesIntro") + "</p></div>" +
      '<div class="rules-steps-grid">' +
        stepBox("01", "how.1t", "learn.ruleStep1Desc") +
        stepBox("02", "how.2t", "learn.ruleStep2Desc") +
        stepBox("03", "how.3t", "learn.ruleStep3Desc") +
      "</div>" +
      '<div id="calc-sandbox-host">' + sandboxHtml() + "</div>" +
      '<div class="payout-table-card"><h3>' + lang.t("learn.payoutTitle") + '</h3><div class="payout-rows">' +
        rateRow("lose", 0) + rateRow("win1", 1) + rateRow("win2", 2) + rateRow("win3", 3) +
      "</div>" +
      '<div class="example-box"><strong>' + lang.t("learn.exampleLabel") + ": </strong><span>" + lang.t("learn.rulesNote") + "</span></div>" +
      '<div class="example-box" style="margin-top:8px;border-left-color:var(--gold);"><span>' + lang.t("learn.rulesMultiDesc") + "</span></div></div>" +
      '<div class="rules-cta-bar"><a href="play.html" class="btn-bc btn-red">' + lang.t("learn.playNowBtn") + ' ➜</a><a href="index.html#how-to-play" class="btn-bc btn-ghost">' + lang.t("learn.quickGuideBtn") + "</a></div>";

    zone.appendChild(card);
    bindSandbox(card);
  }

  function bindSandbox(scope) {
    scope.querySelectorAll("[data-stake]").forEach(function (b) {
      b.addEventListener("click", function () {
        simStake = Number(b.dataset.stake);
        var host = document.querySelector("#calc-sandbox-host");
        if (host) { host.innerHTML = sandboxHtml(); bindSandbox(host); }
      });
    });
    scope.querySelectorAll("[data-match]").forEach(function (b) {
      b.addEventListener("click", function () {
        simHits = Number(b.dataset.match);
        var host = document.querySelector("#calc-sandbox-host");
        if (host) { host.innerHTML = sandboxHtml(); bindSandbox(host); }
      });
    });
  }

  function drawHistory(zone) {
    var box = document.createElement("div");
    box.className = "card-bc learn-static-box";
    var rowsHtml = [1, 2, 3].map(function (i) {
      return '<div class="origin-row"><strong>' + lang.t("learn.originRow" + i + "K") + "</strong><span>" + lang.t("learn.originRow" + i + "L") + '</span><span class="vn-col">' + lang.t("learn.originRow" + i + "R") + "</span></div>";
    }).join("");

    box.innerHTML =
      '<div class="rules-header"><h2>' + lang.t("tab.history") + '</h2><p class="lead" style="font-size:15px;color:var(--mut-ink);margin:6px 0 0">' + lang.t("learn.historyBody") + "</p></div>" +
      '<div class="origin-compare-grid">' +
        '<div class="origin-side-card"><h3 style="margin:0 0 4px">' + lang.t("learn.originSource") + '</h3><p class="mut" style="margin:0;font-size:13px">' + lang.t("learn.originSourceSub") + "</p></div>" +
        '<div class="origin-side-card is-vn"><h3 style="margin:0 0 4px">' + lang.t("learn.originLocal") + '</h3><p class="mut" style="margin:0;font-size:13px">' + lang.t("learn.originLocalSub") + "</p></div>" +
      "</div>" +
      '<div class="origin-rows">' + rowsHtml + "</div>";
    zone.appendChild(box);
  }

  function drawTetTab(zone) {
    var box = document.createElement("div");
    box.className = "card-bc learn-static-box";
    var cols = [1, 2, 3].map(function (i) {
      return '<div class="tet-pillar-card"><div class="pillar-num">' + lang.t("learn.tetP" + i + "N") + "</div><h4>" + lang.t("learn.tetP" + i + "T") + "</h4><p>" + lang.t("learn.tetP" + i + "D") + "</p></div>";
    }).join("");

    box.innerHTML =
      '<div class="rules-header"><h2>' + lang.t("tab.tet") + '</h2><p class="lead" style="font-size:15px;color:var(--mut-ink);margin:6px 0 0">' + lang.t("learn.tetBody") + "</p></div>" +
      '<div class="tet-pillars-grid">' + cols + "</div>" +
      '<p class="mut" style="font-size:14px;margin:8px 0 0">' + lang.t("learn.tetNote") + "</p>" +
      '<div class="rules-cta-bar"><a href="play.html" class="btn-bc btn-red">' + lang.t("learn.tetToPlay") + ' ➜</a><a href="tet.html" class="btn-bc btn-ghost">' + lang.t("learn.tetToCulture") + "</a></div>";
    zone.appendChild(box);
  }

  function openMascot(id) {
    var list = gameConfig.MASCOTS;
    var idx = -1;
    list.forEach(function (x, i) { if (x.id === id) idx = i; });
    if (idx === -1) return;
    var a = list[idx];

    var data = saveStore.load();
    if (data.seenAnimals.indexOf(id) === -1) {
      data.seenAnimals.push(id);
      saveStore.save();
      awards.check("animal_viewed");
      renderProgress();
      if (curTab === "animal") {
        var zone = document.querySelector("#learn-zone");
        if (zone) drawMascots(zone);
      }
    }

    var modal = document.querySelector("#modal-animal");
    var stateNow = saveStore.load();
    var seenTotal = (stateNow.seenAnimals || []).length;
    var vnTag = (stateNow.lang || "en") === "en" ? stripToneMarks(a.name.vn) : a.name.vn;

    modal.querySelector(".box").innerHTML =
      '<div class="close-row" style="justify-content:space-between;align-items:center">' +
        '<span class="seen-pill is-seen">✓ ' + lang.t("learn.seenBadge") + " (" + seenTotal + "/6)</span>" +
        '<button class="icon-btn" data-act="modal-close" aria-label="Close">✕</button>' +
      "</div>" +
      '<div class="animal-modal-grid">' +
        '<img class="animal-modal-art" src="' + a.img + '" alt="' + lang.L(a.name) + '">' +
        "<div>" +
          '<h3 style="margin:0 0 4px">' + lang.L(a.name) + "</h3>" +
          '<div class="animal-lang-badges">' +
            '<span class="animal-lang-pill">VN: ' + vnTag + "</span>" +
            '<span class="animal-lang-pill">EN: ' + a.name.en + "</span>" +
            '<span class="animal-lang-pill">ZH: ' + a.name.zh + "</span>" +
          "</div>" +
          '<p style="margin:0 0 8px"><strong>' + lang.L(a.line) + "</strong></p>" +
          '<p style="margin:0;font-size:14px;color:var(--mut-ink)">' + lang.L(a.fact) + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="animal-modal-nav">' +
        '<button class="btn-bc btn-sm btn-ghost" id="modal-prev-animal">' + lang.t("learn.prevMascot") + "</button>" +
        '<span class="mono mut" style="font-size:12px">' + (idx + 1) + " / " + list.length + "</span>" +
        '<button class="btn-bc btn-sm btn-gold" id="modal-next-animal">' + lang.t("learn.nextMascot") + "</button>" +
      "</div>";

    modal.classList.add("show");
    modal.onclick = function (e) { if (e.target === modal) modal.classList.remove("show"); };
    modal.querySelector("[data-act=modal-close]").addEventListener("click", function () { modal.classList.remove("show"); });
    modal.querySelector("#modal-prev-animal").addEventListener("click", function () {
      openMascot(list[(idx - 1 + list.length) % list.length].id);
    });
    modal.querySelector("#modal-next-animal").addEventListener("click", function () {
      openMascot(list[(idx + 1) % list.length].id);
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
  return { boot: boot, renderProgress: renderProgress };
})();
