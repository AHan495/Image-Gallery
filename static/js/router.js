let router = (function () {
  "use strict";

  const pages = ["login", "signup", "gallery-list", "logout", "gallery"];

  function showPage(pageId) {
    pages.forEach(function (id) {
      const el = document.querySelector(".page-" + id);
      if (id === pageId) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });

    // Call optional on-show hook for the page if defined: window['onShowPage_<pageId>']
    try {
      const hook = window["onShowPage_" + pageId];
      if (typeof hook === "function") hook();
    } catch (e) {
      // ignore errors from hooks
    }
  }

  return { showPage };
})();