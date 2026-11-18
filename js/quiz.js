window.quizBox = (function () {
  "use strict";

  var qIdx = 0, score = 0, running = false, log = [];
  var host;

  function $(sel) { return document.querySelector(sel); }

  function begin() {
    qIdx = 0; score = 0; running = true; log = [];
    showQuestion();
  }

  function drawSteps() {
    var total = studyData.QUIZ.length;
    var pips = [];
    for (var i = 0; i < total; i++) {
      var cls = "quiz-pip";
      if (i < log.length) cls += log[i] ? " is-ok" : " is-bad";
      else if (i === qIdx && running) cls += " is-cur";
      pips.push('<span class="' + cls + '"></span>');
    }
    return '<div class="quiz-pips">' + pips.join("") + "</div>";
  }

  function showQuestion() {
    var item = studyData.QUIZ[qIdx];
    var total = studyData.QUIZ.length;
    host.innerHTML =
      '<div class="quiz-bar"><strong class="mono">' +
      lang.t("quiz.q", { x: qIdx + 1, y: total }) + "</strong>" +
      '<span class="mono mut">' + lang.t("quiz.correct", { x: score }) + "</span></div>" +
      drawSteps() +
      '<div class="quiz-q">' + lang.L(item.q) + "</div>" +
      '<div class="quiz-opts">' +
      item.opts.map(function (o, i) {
        return '<button class="quiz-opt" data-i="' + i + '">' + lang.L(o) + "</button>";
      }).join("") +
      "</div>" +
      '<div id="quiz-why"></div>';

    host.querySelectorAll(".quiz-opt").forEach(function (b) {
      b.addEventListener("click", function () { pickOption(Number(b.dataset.i)); });
    });
  }

  function pickOption(choice) {
    if (!running) return;
    var item = studyData.QUIZ[qIdx];
    var total = studyData.QUIZ.length;
    var btns = host.querySelectorAll(".quiz-opt");
    btns.forEach(function (b) { b.disabled = true; });

    var right = choice === item.a;
    log[qIdx] = right;
    if (right) {
      score += 1;
      sfx.pop();
    } else {
      sfx.lose();
      btns[item.a].classList.add("right");
    }
    btns[choice].classList.add(right ? "right" : "wrong");

    var countSpan = host.querySelector(".quiz-bar span");
    if (countSpan) countSpan.textContent = lang.t("quiz.correct", { x: score });
    var stepsEl = host.querySelector(".quiz-pips");
    if (stepsEl) stepsEl.outerHTML = drawSteps();

    var atEnd = qIdx >= total - 1;
    var noteBox = host.querySelector("#quiz-why");
    noteBox.innerHTML = '<div class="quiz-why"><span>' + lang.L(item.why) + "</span></div>";

    var nextBtn = document.createElement("button");
    nextBtn.className = "btn-bc " + (atEnd ? "btn-red" : "btn-gold");
    nextBtn.textContent = lang.t(atEnd ? "quiz.finish" : "quiz.next");
    nextBtn.addEventListener("click", function () {
      if (atEnd) return endQuiz();
      qIdx += 1;
      showQuestion();
    });
    noteBox.querySelector(".quiz-why").appendChild(nextBtn);
  }

  function endQuiz() {
    running = false;
    var total = studyData.QUIZ.length;
    var prize = score * 25 + (score === total ? 100 : 0);
    var data = saveStore.load();
    data.balance += prize;
    data.stats.peak = Math.max(data.stats.peak || 0, data.balance);
    if (score > data.bestQuiz) data.bestQuiz = score;
    saveStore.save();
    if (score === total) awards.check("quiz_perfect");
    if (window.appShell && appShell.renderCoins) appShell.renderCoins();
    if (window.learnPage && learnPage.renderProgress) learnPage.renderProgress();
    sfx.win();

    host.innerHTML =
      '<div class="quiz-bar"><strong class="mono">' + lang.t("quiz.score", { x: score }) + "</strong>" +
      '<span class="mono mut">' + lang.t("quiz.bestScore", { x: data.bestQuiz }) + "</span></div>" +
      drawSteps() +
      '<div class="quiz-q">' + lang.t("quiz.reward", { n: prize }) +
      (score === total ? " " + lang.t("quiz.perfect") : "") + "</div>" +
      '<button class="btn-bc btn-gold" id="quiz-replay">' + lang.t("quiz.replay") + "</button>";

    host.querySelector("#quiz-replay").addEventListener("click", begin);
  }

  function showIntro() {
    var data = saveStore.load();
    host.innerHTML =
      '<div class="quiz-bar"><strong>' + lang.t("quiz.title") + "</strong>" +
      (data.bestQuiz ? '<span class="mono mut">' + lang.t("quiz.bestScore", { x: data.bestQuiz }) + "</span>" : "") +
      "</div>" +
      "<p>" + lang.t("quiz.sub") + "</p>" +
      '<button class="btn-bc btn-gold" id="quiz-start">' + lang.t("quiz.start") + "</button>";
    host.querySelector("#quiz-start").addEventListener("click", begin);
  }

  function boot() {
    host = $("#quiz-zone");
    if (!host) return;
    showIntro();
    lang.onLangChange(function () { if (!running) showIntro(); });
  }

  document.addEventListener("DOMContentLoaded", boot);
  return { boot: boot, start: begin };
})();
