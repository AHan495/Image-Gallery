(function () {
  "use strict";

  // Initialization (run once)
  window.addEventListener("load", function () {
    document.querySelector(".page-login .backButton").addEventListener("click", function () {
      router.showPage("gallery-list");
    });

    document.querySelector(".page-login .signUpText").addEventListener("click", function () {
      router.showPage("signup");
    });

    document.querySelector(".page-login .login-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.querySelector(".page-login .loginUsername").value;
      const password = document.querySelector(".page-login .loginPassword").value;
      document.querySelector(".page-login .login-form").reset();

      apiService.login(username, password).then(function (res) {
        if (res.error) {
          return;
        }
        doGalleryList();
        router.showPage("gallery-list");
      });
    });
  });

  // Called every time the login page is shown
  window["onShowPage_login"] = function () {
    apiService.getCurrentUser().then(function (user) {
      if (user) {
        doGalleryList();
        router.showPage("gallery-list");
      }
    });
  };
})();