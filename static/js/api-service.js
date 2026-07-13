apiService = (function () {
  "use strict";

  let module = {};

  // Add an image to the gallery
  module.addImage = function (title, url, file) {
    const formData = new FormData();
    formData.append("title", title);
    if (file) {
      formData.append("image", file);
    } else {
      formData.append("url", url);
    }
    return fetch("/api/images", {
      method: "POST",
      body: formData,
    });
  };

  // Delete an image from the gallery
  module.deleteImage = function (imageId) {
    return fetch(`/api/images/${imageId}`, {
      method: "DELETE",
    });
  };

  // Add a comment to an image
  module.addComment = function (imageId, content) {
    if (imageId === -1) return Promise.resolve();
    return fetch(`/api/images/${imageId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  };

  // Delete a comment
  module.deleteComment = function (commentId) {
    return fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
  };

  // Get the next image after a given ID
  module.nextImage = function (imageId) {
    return fetch(`/api/images/${imageId}/next`).then(function (res) {
      if (!res.ok) return undefined;
      return res.json();
    });
  };

  // Get the image right before a given one
  module.prevImage = function (imageId) {
    return fetch(`/api/images/${imageId}/prev`).then(function (res) {
      if (!res.ok) return undefined;
      return res.json();
    });
  };

  // Get the first image
  module.firstImage = function (galleryId) {
    return fetch(`/api/images/gallery/${galleryId}/first`).then(function (res) {
      if (!res.ok) return undefined;
      return res.json();
    });
  };

  // Get paginated comments for an image
  module.getImageComments = function (imageId, page, pageSize) {
    return fetch(
      `/api/images/${imageId}/comments?page=${page}&pageSize=${pageSize}`,
    ).then(function (res) {
      return res.json();
    });
  };

  // Log in as a user
  module.login = function (username, password) {
    return fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then(function (res) {
      return res.json();
    });
  };

  // Sign up as a user
  module.signup = function (username, password) {
    return fetch("/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then(function (res) {
      return res.json();
    });
  };

  // Log out and kill a session
  module.logout = function () {
    return fetch("/api/users/logout", {
      method: "POST",
    }).then(function (res) {
      return res.json();
    });
  };

  // Get paginated list of galleries
  module.getGalleries = function (query, pageSize) {
    let url = `/api/users?pageSize=${pageSize}`;
    if (query.before) url += `&before=${query.before}`;
    if (query.after) url += `&after=${query.after}`;
    return fetch(url).then(function (res) {
      return res.json();
    });
  };

  // Get current authenticated user, or undefined if not authenticated
  module.getCurrentUser = function () {
    return fetch("/api/users/me")
      .then(function (res) {
        if (res.status === 401) return undefined;
        if (!res.ok) return undefined;
        // Safely parse JSON, guarding against empty/non-JSON responses
        return res.json().catch(function () {
          return undefined;
        });
      })
      .catch(function () {
        // Network error or other fetch failure
        return undefined;
      });
  };

  // Get total number of images for a gallery
  module.getGalleryImageCount = function (galleryId) {
    return fetch(`/api/images/gallery/${galleryId}/count`).then(
      function (res) {
        return res.json();
      },
    );
  };

  // Get total number of users
  module.getUserCount = function () {
    return fetch("/api/users/count").then(function (res) {
      return res.json();
    });
  };

  return module;
})();
