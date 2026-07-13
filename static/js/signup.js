(function () {
  "use strict";

  // Initialization (run once)
  window.addEventListener("load", function () {
    document.querySelector(".page-signup .backButton").addEventListener("click", function () {
      router.showPage("gallery-list");
    });

    document.querySelector(".page-signup .signup-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.querySelector(".page-signup .signupUsername").value;
      const password = document.querySelector(".page-signup .signupPassword").value;
      document.querySelector(".page-signup .signup-form").reset();

      apiService.signup(username, password).then(function (res) {
        if (res.error) {
          return;
        }
        doGalleryList();
        router.showPage("gallery-list");
      });
    });
  });

  // Called every time the signup page is shown
  window["onShowPage_signup"] = function () {
    apiService.getCurrentUser().then(function (user) {
      if (user) {
        doGalleryList();
        router.showPage("gallery-list");
      }
    });
  };
})();