/* quiz.js - Learn page quiz: 8 questions, segmented progress pips, xu rewards */
window.BCQuiz = (function () {
  "use strict";

  var idx = 0, correct = 0, active = false, history = [];
  var root;

  function $(sel) { return document.querySelector(sel); }

  function start() {
    idx = 0; correct = 0; active = true; history = [];
    renderQuestion();
  }

  function renderPips() {
    var total = BC_CONTENT.QUIZ.length;
    var items = [];
    for (var i = 0; i < total; i++) {
      var cls = "quiz-pip";
      if (i < history.length) cls += history[i] ? " is-ok" : " is-bad";
      else if (i === idx && active) cls += " is-cur";
      items.push('<span class="' + cls + '"></span>');
    }
    return '<div class="quiz-pips">' + items.join("") + "</div>";
  }

  function renderQuestion() {
    var q = BC_CONTENT.QUIZ[idx];
    var total = BC_CONTENT.QUIZ.length;
    var html =
      '<div class="quiz-bar"><strong class="mono">' +
      BCi18n.t("quiz.q", { x: idx + 1, y: total }) + "</strong>" +
      '<span class="mono mut">' + BCi18n.t("quiz.correct", { x: correct }) + "</span></div>" +
      renderPips() +
      '<div class="quiz-q">' + BCi18n.L(q.q) + "</div>" +
      '<div class="quiz-opts">' +
      q.opts.map(function (o, i) {
        return '<button class="quiz-opt" data-i="' + i + '">' + BCi18n.L(o) + "</button>";
      }).join("") +
      "</div>" +
      '<div id="quiz-why"></div>';
    root.innerHTML = html;

    root.querySelectorAll(".quiz-opt").forEach(function (b) {
      b.addEventListener("click", function () { answer(Number(b.dataset.i)); });
    });
  }

  function answer(i) {
    if (!active) return;
    var q = BC_CONTENT.QUIZ[idx];
    var total = BC_CONTENT.QUIZ.length;
    var opts = root.querySelectorAll(".quiz-opt");
    opts.forEach(function (b) { b.disabled = true; });

    var ok = i === q.a;
    history[idx] = ok;
    if (ok) {
      correct += 1;
      BCAudio.pop();
    } else {
      BCAudio.lose();
      opts[q.a].classList.add("right");
    }
    opts[i].classList.add(ok ? "right" : "wrong");

    var statSpan = root.querySelector(".quiz-bar span");
    if (statSpan) statSpan.textContent = BCi18n.t("quiz.correct", { x: correct });
    var pipsHost = root.querySelector(".quiz-pips");
    if (pipsHost) pipsHost.outerHTML = renderPips();

    var isLast = idx >= total - 1;
    var whyBox = root.querySelector("#quiz-why");
    whyBox.innerHTML = '<div class="quiz-why"><span>' + BCi18n.L(q.why) + "</span></div>";

    var btn = document.createElement("button");
    btn.className = "btn-bc " + (isLast ? "btn-red" : "btn-gold");
    btn.textContent = BCi18n.t(isLast ? "quiz.finish" : "quiz.next");
    btn.addEventListener("click", function () {
      if (isLast) return finish();
      idx += 1;
      renderQuestion();
    });
    whyBox.querySelector(".quiz-why").appendChild(btn);
  }

  function finish() {
    active = false;
    var total = BC_CONTENT.QUIZ.length;
    var reward = correct * 25 + (correct === total ? 100 : 0);
    var st = BCStore.load();
    st.balance += reward;
    st.stats.peak = Math.max(st.stats.peak || 0, st.balance);
    if (correct > st.bestQuiz) st.bestQuiz = correct;
    BCStore.save();
    if (correct === total) BCBadges.check("quiz_perfect");
    if (window.BCUI && BCUI.renderCoins) BCUI.renderCoins();
    if (window.BCPageLearn && BCPageLearn.renderProgress) BCPageLearn.renderProgress();
    BCAudio.win();

    root.innerHTML =
      '<div class="quiz-bar"><strong class="mono">' + BCi18n.t("quiz.score", { x: correct }) + "</strong>" +
      '<span class="mono mut">' + BCi18n.t("quiz.bestScore", { x: st.bestQuiz }) + "</span></div>" +
      renderPips() +
      '<div class="quiz-q">' + BCi18n.t("quiz.reward", { n: reward }) +
      (correct === total ? " " + BCi18n.t("quiz.perfect") : "") + "</div>" +
      '<button class="btn-bc btn-gold" id="quiz-replay">' + BCi18n.t("quiz.replay") + "</button>";

    root.querySelector("#quiz-replay").addEventListener("click", start);
  }

  /* intro screen */
  function renderIntro() {
    var st = BCStore.load();
    root.innerHTML =
      '<div class="quiz-bar"><strong>' + BCi18n.t("quiz.title") + "</strong>" +
      (st.bestQuiz ? '<span class="mono mut">' + BCi18n.t("quiz.bestScore", { x: st.bestQuiz }) + "</span>" : "") +
      "</div>" +
      "<p>" + BCi18n.t("quiz.sub") + "</p>" +
      '<button class="btn-bc btn-gold" id="quiz-start">' + BCi18n.t("quiz.start") + "</button>";
    root.querySelector("#quiz-start").addEventListener("click", start);
  }

  function boot() {
    root = $("#quiz-zone");
    if (!root) return;
    renderIntro();
    BCi18n.onLangChange(function () { if (!active) renderIntro(); });
  }

  document.addEventListener("DOMContentLoaded", boot);
  return { boot: boot, start: start };
})();
