window.anim = (function () {
  "use strict";

  var palette = ["#C7361F", "#FFC93C", "#274C77", "#FAF3E7"];

  function isReduced() {
    return appShell.reducedMotion();
  }

  function confetti(big) {
    if (isReduced()) return;
    var cvs = document.createElement("canvas");
    cvs.className = "confetti-canvas";
    cvs.setAttribute("aria-hidden", "true");
    var dpr = window.devicePixelRatio || 1;
    cvs.width = window.innerWidth * dpr;
    cvs.height = window.innerHeight * dpr;
    document.body.appendChild(cvs);
    var ctx = cvs.getContext("2d");
    ctx.scale(dpr, dpr);

    var w = window.innerWidth, h = window.innerHeight;
    var y0 = h * 0.42;
    var total = big ? 90 : 45;
    var bits = [];
    for (var i = 0; i < total; i++) {
      var ang = Math.random() * Math.PI - Math.PI;
      var spd = (big ? 9 : 6) + Math.random() * (big ? 7 : 4);
      bits.push({
        x: w / 2, y: y0,
        vx: Math.cos(ang) * spd * 2.2,
        vy: Math.sin(ang) * spd,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: palette[i % palette.length]
      });
    }

    var startTs = null, duration = 1500;
    function step(ts) {
      if (!startTs) startTs = ts;
      var dt = ts - startTs;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        b.vy += 0.32;
        b.x += b.vx; b.y += b.vy;
        b.vx *= 0.985;
        b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.globalAlpha = Math.max(0, 1 - dt / duration);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }
      if (dt < duration) requestAnimationFrame(step);
      else cvs.remove();
    }
    requestAnimationFrame(step);
  }

  function shake(el, cls) {
    if (isReduced() || !el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 450);
  }

  function countUp(el, fromVal, toVal, ms, unit) {
    if (!el) return;
    if (isReduced() || fromVal === toVal) {
      el.textContent = toVal.toLocaleString("vi-VN") + " " + unit;
      return;
    }
    var startTs = null;
    function step(ts) {
      if (!startTs) startTs = ts;
      var p = Math.min(1, (ts - startTs) / ms);
      var eased = 1 - Math.pow(1 - p, 3);
      var cur = Math.round(fromVal + (toVal - fromVal) * eased);
      el.textContent = cur.toLocaleString("vi-VN") + " " + unit;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return { confetti: confetti, shake: shake, countUp: countUp };
})();
