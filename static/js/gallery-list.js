function doGalleryList() {
  "use strict";

  const pageSize = 10;
  let firstId = null;
  let lastId = null;

  // Clear any previous polling interval from a prior visit to this page
  if (window._galleryPollInterval) {
    clearInterval(window._galleryPollInterval);
  }

  // Shows a notification banner at the top of the gallery list page
  function showNotification(message, onClick) {
    const notification = document.querySelector(
      ".page-gallery-list .notification",
    );
    notification.replaceWith(notification.cloneNode(true));
    const fresh = document.querySelector(".page-gallery-list .notification");
    fresh.textContent = message;
    fresh.classList.remove("hidden");
    fresh.addEventListener("click", function () {
      fresh.classList.add("hidden");
      if (onClick) onClick();
    });
  }

  function updateMainButton(user) {
    const mainBtn = document.querySelector(".page-gallery-list .mainButton");
    if (!mainBtn) return;
    // Remove existing handlers
    mainBtn.replaceWith(mainBtn.cloneNode(true));
    const fresh = document.querySelector(".page-gallery-list .mainButton");

    if (user) {
      fresh.textContent = "Log out";
      fresh.addEventListener("click", function () {
        router.showPage("logout");
      });
    } else {
      fresh.textContent = "Log in";
      fresh.addEventListener("click", function () {
        router.showPage("login");
      });
    }
  }

  function loadPage(query) {
    apiService.getGalleries(query, pageSize).then(function (data) {
      const container = document.querySelector(".galleryList");
      container.innerHTML = "";

      data.galleries.forEach(function (gallery) {
        const entry = document.createElement("div");
        entry.className = "comment galleryEntry clickableText";
        entry.textContent = gallery.username + "'s gallery";
        entry.addEventListener("click", function () {
          doGallery(gallery.userId);
          router.showPage("gallery");
        });
        container.append(entry);
      });

      if (data.galleries.length > 0) {
        firstId = data.galleries[0].userId;
        lastId = data.galleries[data.galleries.length - 1].userId;
      }

      const prevBtn = document.querySelector(
        ".page-gallery-list .previousPage",
      );
      const nextBtn = document.querySelector(".page-gallery-list .nextPage");

      if (data.hasPrev) {
        prevBtn.classList.remove("hidden");
        prevBtn.onclick = function () {
          loadPage({ after: firstId });
        };
      } else {
        prevBtn.classList.add("hidden");
      }

      if (data.hasNext) {
        nextBtn.classList.remove("hidden");
        nextBtn.onclick = function () {
          loadPage({ before: lastId });
        };
      } else {
        nextBtn.classList.add("hidden");
      }
    });
  }

  // When shown or initialized, update main button then load page
  apiService.getCurrentUser().then(function (user) {
    updateMainButton(user);
    loadPage({});
  });

  // Start polling for new galleries every 5 seconds
  let knownGalleryCount = 0;
  apiService.getUserCount().then(function (data) {
    knownGalleryCount = data.count;
  });

  window._galleryPollInterval = setInterval(function () {
    apiService.getUserCount().then(function (data) {
      if (data.count > knownGalleryCount) {
        knownGalleryCount = data.count;
        showNotification(
          "A new gallery was added! Click to go to the start.",
          function () {
            loadPage({});
          },
        );
      }
    });
  }, 5000);

  // Expose doGalleryList as the page's on-show handler so router can call it whenever page is shown
  window["onShowPage_gallery-list"] = function () {
    apiService.getCurrentUser().then(function (user) {
      updateMainButton(user);
      loadPage({});
    });
  };
}
