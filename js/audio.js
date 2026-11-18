window.sfx = (function () {
  "use strict";
  var audioCtx = null, masterGain = null;

  function ensureCtx() {
    if (!audioCtx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function isMuted() { return saveStore.load().muted; }

  function noiseBurst(at, freq, dur, vol) {
    var c = audioCtx, len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(); src.buffer = buf;
    var filter = c.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = freq;
    var gain = c.createGain(); gain.gain.value = vol;
    src.connect(filter); filter.connect(gain); gain.connect(masterGain);
    src.start(at);
  }

  function playTone(at, freq, dur, wave, vol, endFreq) {
    var osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = wave || "triangle"; osc.frequency.setValueAtTime(freq, at);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(at); osc.stop(at + dur + 0.02);
  }

  return {
    init: function () { ensureCtx(); },
    rattle: function (secs) {
      if (isMuted() || !ensureCtx()) return;
      var t0 = audioCtx.currentTime, hits = Math.floor((secs || 1.4) / 0.09);
      for (var i = 0; i < hits; i++) noiseBurst(t0 + i * 0.09 + Math.random() * 0.02, 1800 + Math.random() * 900, 0.05, 0.5);
    },
    chip: function () {
      if (isMuted() || !ensureCtx()) return;
      playTone(audioCtx.currentTime, 950, 0.06, "square", 0.18);
    },
    clack: function (freq) {
      if (isMuted() || !ensureCtx()) return;
      playTone(audioCtx.currentTime, freq || 600, 0.05, "triangle", 0.22, 320);
    },
    thud: function () {
      if (isMuted() || !ensureCtx()) return;
      playTone(audioCtx.currentTime, 140, 0.14, "sine", 0.28, 70);
    },
    pop: function () {
      if (isMuted() || !ensureCtx()) return;
      playTone(audioCtx.currentTime, 420, 0.09, "triangle", 0.2, 720);
    },
    win: function () {
      if (isMuted() || !ensureCtx()) return;
      var t0 = audioCtx.currentTime;
      [523, 659, 784, 1047].forEach(function (f, i) { playTone(t0 + i * 0.09, f, 0.16, "triangle", 0.25); });
    },
    lose: function () {
      if (isMuted() || !ensureCtx()) return;
      playTone(audioCtx.currentTime, 220, 0.3, "sine", 0.3, 130);
    },
    drum: function () {
      if (isMuted() || !ensureCtx()) return;
      var t0 = audioCtx.currentTime;
      playTone(t0, 150, 0.25, "sine", 0.5, 60);
      noiseBurst(t0, 300, 0.12, 0.4);
    }
  };
})();
