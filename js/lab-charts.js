window.simCanvas = (function () {
  "use strict";

  function fitCanvas(cvs) {
    var dpr = window.devicePixelRatio || 1;
    cvs.width = cvs.clientWidth * dpr;
    cvs.height = cvs.clientHeight * dpr;
    var ctx = cvs.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function draw(bins, series) {
    plotBars(bins);
    plotLine(series);
  }

  function plotBars(counts) {
    var cvs = document.querySelector("#chart-bar");
    if (!cvs) return;
    var g = fitCanvas(cvs);
    var w = cvs.clientWidth, h = cvs.clientHeight, pad = 26;
    g.clearRect(0, 0, w, h);
    var peak = Math.max.apply(null, counts.concat([1]));
    var barW = (w - pad * 2 - 30) / 4;
    var labels = ["0", "1", "2", "3"];
    counts.forEach(function (cnt, i) {
      var bh = (h - pad * 2) * (cnt / peak);
      g.fillStyle = "#274C77";
      g.fillRect(pad + i * (barW + 10), h - pad - bh, barW, bh);
      g.strokeStyle = "#191A1C";
      g.lineWidth = 2;
      g.strokeRect(pad + i * (barW + 10), h - pad - bh, barW, bh);
      g.fillStyle = "#191A1C";
      g.font = "12px 'Space Mono',monospace";
      g.textAlign = "center";
      g.fillText(String(cnt), pad + i * (barW + 10) + barW / 2, h - pad - bh - 6);
      g.fillText(labels[i], pad + i * (barW + 10) + barW / 2, h - 8);
    });
  }

  function plotLine(series) {
    var cvs = document.querySelector("#chart-line");
    if (!cvs) return;
    var g = fitCanvas(cvs);
    var w = cvs.clientWidth, h = cvs.clientHeight, pad = 26;
    g.clearRect(0, 0, w, h);
    var min = Math.min.apply(null, series);
    var max = Math.max.apply(null, series);
    if (Math.abs(max - min) < 0.001) { min -= 1; max += 1; }
    g.strokeStyle = "#C7361F";
    g.lineWidth = 3;
    g.beginPath();
    series.forEach(function (val, i) {
      var x = pad + (w - pad * 2) * (i / (series.length - 1));
      var y = h - pad - (h - pad * 2) * ((val - min) / (max - min));
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.stroke();

    // baseline reference line at starting 1,000 coins
    g.strokeStyle = "#999";
    g.lineWidth = 1;
    g.setLineDash([4, 4]);
    g.beginPath();
    var y0 = h - pad - (h - pad * 2) * ((1000 - min) / (max - min));
    g.moveTo(pad, y0);
    g.lineTo(w - pad, y0);
    g.stroke();
    g.setLineDash([]);
  }

  return { draw: draw };
})();
