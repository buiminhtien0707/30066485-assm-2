window.lang = (function () {
  "use strict";
  var dicts = {
    vn: window.stringsVn,
    en: window.stringsEn,
    zh: window.stringsZh
  };
  var subs = [];

  function current() {
    return (window.saveStore && saveStore.load().lang) || "en";
  }

  function str(key, vars) {
    var d = dicts[current()] || dicts.en || dicts.vn;
    var out = d[key] !== undefined ? d[key] : (dicts.en && dicts.en[key] !== undefined ? dicts.en[key] : (dicts.vn && dicts.vn[key] !== undefined ? dicts.vn[key] : key));
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        out = out.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return out;
  }

  function pick(obj) {
    if (obj == null) return "";
    return obj[current()] !== undefined ? obj[current()] : (obj.en || obj.vn || "");
  }

  function translateDom() {
    document.documentElement.lang = current() === "zh" ? "zh-CN" : (current() === "vn" ? "vi" : "en");
    var page = document.body.dataset.page;
    if (page) document.title = str("brand.full") + ": " + str("nav." + page);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = str(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", str(el.getAttribute("data-i18n-aria")));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", str(el.getAttribute("data-i18n-ph")));
    });
    document.querySelectorAll(".lang-group button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === current());
    });
    subs.forEach(function (fn) { fn(current()); });
  }

  function setLang(code) {
    var st = saveStore.load();
    st.lang = code;
    try { localStorage.setItem("bc_lang_user_chosen", "true"); } catch (e) {}
    saveStore.save();
    translateDom();
  }

  function watch(fn) { subs.push(fn); }

  return { t: str, L: pick, apply: translateDom, setLang: setLang, onLangChange: watch, lang: current };
})();
