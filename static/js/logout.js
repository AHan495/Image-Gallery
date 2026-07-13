(function () {
  "use strict";

  window.addEventListener("load", function () {
    document
      .querySelector(".page-logout .backButton")
      .addEventListener("click", function () {
        router.showPage("gallery-list");
      });

    document
      .querySelector(".page-logout .mainButton")
      .addEventListener("click", function () {
        apiService.logout().then(function () {
          router.showPage("login");
        });
      });
  });
})();
