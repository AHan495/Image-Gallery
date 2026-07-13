doGallery = function (userID) {
  "use strict";

  // Set up Meact
  // States:
  // - addImagePageOn -> Determines whether the addImagePage is enabled or not (Bool)
  // - fullCommentsPageOn -> Determines whether the fullCommentsPage is enabled or not (Bool)
  // - currentImageID -> Image ID of the current Image (Int)
  // - totalImages -> Number of images in the database (Int)
  // - comments -> Comments of the current image (Array of Comments)
  // - topComments -> The 3 top comments (Array of Comments)
  // - pageCount -> Number of comment pages in the full comment view (Int)
  // - commentPage -> current page of comments being viewed (Int)
  // - imageTitle -> Title of the current image (STR)
  // - imageAuthor -> Author of the current image (STR)
  // - imageURL -> URL of the current image (STR)
  const [addimagePageOn, getAddimagePageOn, setAddimagePageOn] =
    meact.useState(false);
  const [fullCommentsPageOn, getFullCommentsPageOn, setFullCommentsPageOn] =
    meact.useState(false);
  const [currentImageID, getCurrentImageID, setCurrentImageID] =
    meact.useState(-1);
  const [currentImageURL, getCurrentImageURL, setCurrentImageURL] =
    meact.useState("./assets/Placeholder.png");
  const [totalImages, getTotalImages, setTotalImages] = meact.useState(0);
  const [comments, getComments, setComments] = meact.useState([]);
  const [topcomments, getTopComments, setTopComments] = meact.useState([]);
  const [pageCount, getPageCount, setPageCount] = meact.useState(0);
  const [commentPage, getCommentPage, setCommentPage] = meact.useState(0);
  const [imageTitle, getImageTitle, setImageTitle] =
    meact.useState("Image Title");
  const [imageAuthor, getImageAuthor, setImageAuthor] =
    meact.useState("Image Author");

  const scrollCooldown = 400;

  // Polling interval — declared here so it can be cleared in the back button handler
  let imagePollInterval = null;

  let previousContainer = document.querySelector(".slidePrev");
  let currentContainer = document.querySelector(".slideCurr");
  let nextContainer = document.querySelector(".slideNext");

  function showLoading() {
    document.querySelector(".loading-container").classList.remove("hidden");
  }

  function hideLoading() {
    document.querySelector(".loading-container").classList.add("hidden");
  }

  // Shows a notification banner at the top of the gallery page
  function showNotification(message, onClick) {
    const notification = document.querySelector(".page-gallery .notification");
    notification.textContent = message;
    notification.classList.remove("hidden");
    // Clone to remove any existing listeners
    notification.replaceWith(notification.cloneNode(true));
    const fresh = document.querySelector(".page-gallery .notification");
    fresh.textContent = message;
    fresh.classList.remove("hidden");
    fresh.addEventListener("click", function () {
      fresh.classList.add("hidden");
      if (onClick) onClick();
    });
  }

  // Helper to set all image-related state from a { image, count, topComments } response
  // Reduces repeated code as this pattern is seen several times
  function applyImageResponse(data) {
    setCurrentImageID(data.image.id);
    setImageTitle(data.image.title);
    setImageAuthor(data.image.author);
    setCurrentImageURL(`/api/images/${data.image.id}/file`);
    setTotalImages(data.count);
    setTopComments(data.topComments);
  }

  // Helper to refresh paginated comments
  // Reduces repeated code as this pattern is seen several times
  function refreshComments() {
    // Only fetch full paginated comments if user is authenticated. Otherwise clear comments.
    return apiService.getCurrentUser().then(function (user) {
      if (!user) {
        setComments([]);
        setPageCount(0);
        return;
      }
      return apiService
        .getImageComments(getCurrentImageID(), getCommentPage(), 10)
        .then(function (imageComments) {
          if (!imageComments || imageComments.error) {
            setComments([]);
            setPageCount(0);
            return;
          }
          setComments(imageComments.comments);
          setPageCount(imageComments.pageCount);
        });
    });
  }

  // Makes a comment element. isFullPage determines styling.
  // user is the current session user, used to determine delete button visibility.
  function makeComment(comment, isFullPage, user) {
    // Can delete if you own the comment or own the gallery
    const canDelete =
      user && (user.id === comment.UserId || user.id === userID);

    const newComment = document.createElement("div");
    if (isFullPage) {
      newComment.className = "row comment fullPageComment";
      newComment.innerHTML = `
        <div class="commentElementAuthor">
          <div class="authorName fullCommentText">${comment.author}</div>
          <div class="commentDate fullCommentText">${comment.createdAt}</div>
        </div>
        <div class="commentElementContent fullCommentText">${comment.content}</div>
        <button class="commentElementUI deleteCommentButton iconButton ${canDelete ? "" : "hidden"}"></button>
        `;
    } else {
      newComment.className = "row comment align-items-center";
      newComment.innerHTML = `
        <div class="commentElementAuthor">
          <div class="authorName commentText">${comment.author}</div>
          <div class="commentDate commentText">${comment.createdAt}</div>
        </div>
        <div class="commentElementContent commentText commentElementShrink">${comment.content}</div>
        <button class="commentElementUI deleteCommentButton iconButton ${canDelete ? "" : "hidden"}"></button>
        `;
    }
    // Attach event listeners for deletion
    newComment.dataset.id = comment.id;
    newComment
      .querySelector(".deleteCommentButton")
      .addEventListener("click", function () {
        showLoading();
        apiService
          .deleteComment(comment.id)
          .then(function () {
            return refreshComments();
          })
          .then(function () {
            return apiService.getCurrentUser();
          })
          .then(function (currentUser) {
            if (!currentUser) {
              setTopComments([]);
              hideLoading();
              return;
            }
            return apiService
              .getImageComments(getCurrentImageID(), 0, 3)
              .then(function (top) {
                setTopComments((top && top.comments) || []);
                hideLoading();
              });
          });
      });

    return newComment;
  }

  function fillSlideHTML(slide) {
    slide.innerHTML = `
      <!-- UI -->
      <button class="addImageBtn uiElement iconButton"></button>
      <p class="imageTitle uiElement"></p>
      <p class="imageAuthor uiElement"></p>
      <button class="deleteImage uiElement iconButton"></button>
      <button class="backButton backButtonGallery uiElement iconButton"></button>
      <p class="totalImages uiElement"></p>

      <!-- Add Image Page -->
      <div class="addImagePage">
        <button
          class="exitAddImageForm uiElement iconButton uiAddImageElement"
        ></button>
        <form class="addItemForm addImageForm">
          <input
            type="text"
            class="mainButton col-12 addImageTitle"
            placeholder="Enter the Title of the Image"
            name="imageTitle"
            required
          />
          <input
            type="text"
            class="mainButton col-12 addImageURL"
            placeholder="Enter the URL of the Image"
            name="imageURL"
          />
          <input
            type="file"
            class="mainButton col-12 addImageFile"
            name="imageFile"
            accept="image/*"
          />
          <button type="submit" class="mainButton col-12">Submit</button>
        </form>
      </div>

      <!-- Comments Page -->
      <div class="fullCommentsPage">
      </div>

      <!-- Image -->
      <img src="./assets/Placeholder.png" class="image" />

      <!-- Comment Preview -->
      <div class="comments">
        <div class="commentsBox"></div>
      </div>
      `;
  }

  // user is the current session user, used to determine button visibility
  function fillSlideContent(slide, title, author, url, user) {
    const isOwner = user && user.id === userID;

    // Toggle visibility of addImagePage and fullComments as needed
    slide
      .querySelector(".addImagePage")
      .classList.toggle("addImagePageOn", getAddimagePageOn());
    slide
      .querySelector(".fullCommentsPage")
      .classList.toggle(".fullCommentsPageOn", getFullCommentsPageOn());

    // Show add/delete image buttons only to gallery owner
    slide.querySelector(".addImageBtn").classList.toggle("hidden", !isOwner);
    slide.querySelector(".deleteImage").classList.toggle("hidden", !isOwner);

    // Set Content
    slide.querySelector(".image").src = url;
    slide.querySelector(".imageTitle").textContent = title;
    slide.querySelector(".imageAuthor").textContent = author;
    slide.querySelector(".totalImages").textContent =
      `Total Images: ${getTotalImages()}`;

    // Empty Comments
    slide.querySelector(".commentsBox").innerHTML = "";
    slide.querySelector(".fullCommentsPage").innerHTML = "";

    if (getCurrentImageID() === -1) {
      // No images are in database. Put helper text in comments box
      slide
        .querySelector(".commentsBox")
        .insertAdjacentHTML(
          "afterbegin",
          `<p class="helpText">No images are in the database!</p>`,
        );
    }
  }

  // user is the current session user, used to determine comment visibility and delete button
  function fillSlideComments(slide, user) {
    const isLoggedIn = !!user;

    // If not logged in, show login prompt and return early
    if (!isLoggedIn) {
      slide
        .querySelector(".commentsBox")
        .insertAdjacentHTML(
          "afterbegin",
          `<p class="helpText">Log in to view comments</p>`,
        );
      return;
    }

    // Set top comments
    getTopComments().forEach(function (comment) {
      const newComment = makeComment(comment, false, user);
      slide.querySelector(".commentsBox").append(newComment);
    });

    if (getCurrentImageID() !== -1) {
      if (getTopComments().length === 0) {
        // No comments on this image. Put helper text in comments box
        slide
          .querySelector(".commentsBox")
          .insertAdjacentHTML(
            "afterbegin",
            `<p class="helpText">No comments yet!</p>`,
          );
      }

      // Add open full comments button
      slide.querySelector(".commentsBox").insertAdjacentHTML(
        "afterbegin",
        `<button class="openFullComments commentInput helpText">
          Open Full Comments Section
        </button>`,
      );
    }

    // Add pagination
    slide.querySelector(".fullCommentsPage").insertAdjacentHTML(
      "afterbegin",
      `<div class="row">
          <p class="fullCommentText helpText firstPage clickableText">First Page</p>
          <p class="fullCommentText helpText previousPage clickableText">Previous Page</p>
          <p class="fullCommentText helpText nextPage clickableText">Next Page</p>
          <p class="fullCommentText helpText lastPage clickableText">Last Page</p>
        </div>`,
    );

    // Add event handlers for pagination, based off of pageCount
    const pageCount = getPageCount();
    const currentPage = getCommentPage();

    // Not the first page so add event handlers to go backwards
    if (currentPage !== 0) {
      slide.querySelector(".firstPage").addEventListener("click", function () {
        showLoading();
        setCommentPage(0);
        refreshComments().then(function () {
          hideLoading();
        });
      });

      slide
        .querySelector(".previousPage")
        .addEventListener("click", function () {
          showLoading();
          setCommentPage(currentPage - 1);
          refreshComments().then(function () {
            hideLoading();
          });
        });
    }

    // Not the last page so add event handlers to go forwards
    if (currentPage < pageCount - 1) {
      slide.querySelector(".lastPage").addEventListener("click", function () {
        showLoading();
        setCommentPage(pageCount - 1);
        refreshComments().then(function () {
          hideLoading();
        });
      });

      slide.querySelector(".nextPage").addEventListener("click", function () {
        showLoading();
        setCommentPage(currentPage + 1);
        refreshComments().then(function () {
          hideLoading();
        });
      });
    }

    // Set Full Page Comments, with scroller
    const scroller = document.createElement("div");
    scroller.classList.add("fullCommentsScroller");
    slide.querySelector(".fullCommentsPage").prepend(scroller);
    getComments().forEach(function (comment) {
      const newComment = makeComment(comment, true, user);
      slide.querySelector(".fullCommentsScroller").append(newComment);
    });

    if (getComments().length === 0) {
      // No comments on this image. Put helper text in scroller
      slide
        .querySelector(".fullCommentsScroller")
        .insertAdjacentHTML(
          "afterbegin",
          `<p class="fullCommentText helpText">No comments yet!</p>`,
        );
    }

    // Add form stuff to fullCommentsPage
    slide.querySelector(".fullCommentsPage").insertAdjacentHTML(
      "afterbegin",
      `<button
            class="exitFullComments uiElement iconButton uiAddImageElement"
          ></button>
          <form class="addItemForm addCommentForm">
            <p class="helpText">Add a Comment</p>
            <input
              type="text"
              class="commentInput col-12 commentInputContent"
              placeholder="Comment Content"
              name="commentContent"
              required
            />
            <button type="submit" class="commentInput col-12 helpText">Submit</button>
          </form>
          <p class="fullCommentText helpText">All Comments</p>`,
    );

    slide
      .querySelector(".fullCommentsPage")
      .classList.toggle("fullCommentsPageOn", getFullCommentsPageOn());

    // Event listeners for opening and closing full comments
    if (getCurrentImageID() !== -1) {
      slide
        .querySelector(".openFullComments")
        .addEventListener("click", function () {
          setFullCommentsPageOn(true);
        });
    }

    slide
      .querySelector(".exitFullComments")
      .addEventListener("click", function () {
        setFullCommentsPageOn(false);
      });

    slide
      .querySelector(".addCommentForm")
      .addEventListener("submit", function (e) {
        // prevent from refreshing the page on submit
        e.preventDefault();
        // read form elements
        let content = slide.querySelector(".commentInputContent").value;
        // clean form
        slide.querySelector(".addCommentForm").reset();

        // Add to database
        showLoading();
        apiService
          .addComment(getCurrentImageID(), content)
          .then(function () {
            return refreshComments();
          })
          .then(function () {
            return apiService.getCurrentUser();
          })
          .then(function (currentUser) {
            if (!currentUser) {
              setTopComments([]);
              hideLoading();
              return;
            }
            return apiService
              .getImageComments(getCurrentImageID(), 0, 3)
              .then(function (top) {
                setTopComments((top && top.comments) || []);
                hideLoading();
              });
          });
      });
  }

  function fillSlideListeners(slide) {
    // Add event listeners
    slide.querySelector(".addImageBtn").addEventListener("click", function () {
      setAddimagePageOn(true);
    });

    slide
      .querySelector(".exitAddImageForm")
      .addEventListener("click", function () {
        setAddimagePageOn(false);
      });

    slide.querySelector(".deleteImage").addEventListener("click", function () {
      // Save what to go to after deletion
      showLoading();
      apiService
        .nextImage(getCurrentImageID())
        .then(function (nextData) {
          // If there is no next image, see if you can go to the previous image instead.
          if (nextData === undefined) {
            return apiService.prevImage(getCurrentImageID());
          }
          return nextData;
        })
        .then(function (nextData) {
          // Delete
          return apiService.deleteImage(getCurrentImageID()).then(function () {
            return nextData;
          });
        })
        .then(function (nextData) {
          if (nextData === undefined) {
            // There is no next image. Placeholders are set.
            setCurrentImageID(-1);
            setImageAuthor("Image Author");
            setImageTitle("Image Title");
            setCurrentImageURL("./assets/Placeholder.png");
            setTotalImages(0);
            setTopComments([]);
            setComments([]);
            hideLoading();
            return;
          }
          // There is a next image, go to it.
          applyImageResponse(nextData);
          return refreshComments();
        })
        .then(function () {
          hideLoading();
        });
    });

    // Back button — remove scroll listeners and stop polling before leaving gallery
    slide.querySelector(".backButton").addEventListener("click", function () {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      clearInterval(imagePollInterval);
      router.showPage("gallery-list");
    });

    // Set up form submissions
    slide
      .querySelector(".addImageForm")
      .addEventListener("submit", function (e) {
        // prevent from refreshing the page on submit
        e.preventDefault();
        // read form elements
        let title = slide.querySelector(".addImageTitle").value;
        let url = slide.querySelector(".addImageURL").value;
        let file = slide.querySelector(".addImageFile").files[0];
        // clean form
        slide.querySelector(".addImageForm").reset();
        // Add to database
        showLoading();
        apiService
          .addImage(title, url, file)
          .then(function () {
            // Update page if needed
            if (getCurrentImageID() === -1) {
              return apiService.firstImage(userID).then(function (data) {
                applyImageResponse(data);
                return refreshComments();
              });
            } else {
              // Will be innacurate if other people add/delete images. Solely a frontend change. But good enough.
              setTotalImages(getTotalImages() + 1);
            }
          })
          .then(function () {
            // Finally, close addImagePage
            setAddimagePageOn(false);
            hideLoading();
          });
      });
  }

  // Fetch current user then fill the slide with appropriate content
  function fillSlide(slide, title, author, url) {
    apiService.getCurrentUser().then(function (user) {
      fillSlideHTML(slide);
      fillSlideContent(slide, title, author, url, user);
      fillSlideComments(slide, user);
      fillSlideListeners(slide);
    });
  }

  function goToImage(data, direction) {
    // Do nothing if there is nothing to go to
    if (data === undefined) {
      return;
    }

    const { image } = data;

    if (direction === "next") {
      fillSlide(
        nextContainer,
        image.title,
        image.author,
        `/api/images/${image.id}/file`,
      );
      currentContainer.classList.remove("active");
      currentContainer.classList.add("above");
      nextContainer.classList.remove("below");
      nextContainer.classList.add("active");

      setTimeout(function () {
        const freed = previousContainer;
        previousContainer = currentContainer;
        currentContainer = nextContainer;
        nextContainer = freed;

        freed.style.transition = "none";
        freed.classList.remove("above", "active");
        freed.classList.add("below");
        freed.innerHTML = "";
        freed.style.transition = "";
      }, scrollCooldown);
    } else if (direction === "previous") {
      fillSlide(
        previousContainer,
        image.title,
        image.author,
        `/api/images/${image.id}/file`,
      );
      currentContainer.classList.remove("active");
      currentContainer.classList.add("below");
      previousContainer.classList.remove("above");
      previousContainer.classList.add("active");

      setTimeout(function () {
        const freed = nextContainer;
        nextContainer = currentContainer;
        currentContainer = previousContainer;
        previousContainer = freed;

        freed.style.transition = "none";
        freed.classList.remove("below", "active");
        freed.classList.add("above");
        freed.innerHTML = "";
        freed.style.transition = "";
      }, scrollCooldown);
    }

    applyImageResponse(data);
    return refreshComments();
  }

  // Scrolling event listeners
  // Prevent scrolling too quickly in succession
  let scrollIsOnCooldown = false;

  // Named functions so they can be removed when leaving the gallery
  function onWheel(e) {
    if (scrollIsOnCooldown || getAddimagePageOn() || getFullCommentsPageOn()) {
      return;
    }

    scrollIsOnCooldown = true;
    setTimeout(() => (scrollIsOnCooldown = false), 500);

    if (e.deltaY > 0) {
      showLoading();
      apiService
        .nextImage(getCurrentImageID())
        .then(function (data) {
          return goToImage(data, "next");
        })
        .then(function () {
          hideLoading();
        });
    } else {
      showLoading();
      apiService
        .prevImage(getCurrentImageID())
        .then(function (data) {
          return goToImage(data, "previous");
        })
        .then(function () {
          hideLoading();
        });
    }
  }

  // Touch start needs to be in scope for touch start and end
  let touchStartY = 0;
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (scrollIsOnCooldown || getAddimagePageOn() || getFullCommentsPageOn()) {
      return;
    }
    const deltaY = touchStartY - e.changedTouches[0].clientY;

    // Ignore small swipes
    if (Math.abs(deltaY) < 50) return;

    // Swipe up and down
    scrollIsOnCooldown = true;
    setTimeout(() => (scrollIsOnCooldown = false), 500);

    if (deltaY > 0) {
      showLoading();
      apiService
        .nextImage(getCurrentImageID())
        .then(function (data) {
          return goToImage(data, "next");
        })
        .then(function () {
          hideLoading();
        });
    } else {
      showLoading();
      apiService
        .prevImage(getCurrentImageID())
        .then(function (data) {
          return goToImage(data, "previous");
        })
        .then(function () {
          hideLoading();
        });
    }
  }

  window.addEventListener("wheel", onWheel);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });

  // Once page is loaded, use useEffect to update page whenever anything updates
  meact.useEffect(() => {
    fillSlide(
      document.querySelector(".active"),
      getImageTitle(),
      getImageAuthor(),
      getCurrentImageURL(),
    );
  }, [
    addimagePageOn,
    fullCommentsPageOn,
    currentImageID,
    currentImageURL,
    totalImages,
    comments,
    topcomments,
    pageCount,
    commentPage,
    imageTitle,
    imageAuthor,
  ]);

  // Initialize with the first image, then start polling for new images every 5 seconds
  showLoading();
  apiService
    .firstImage(userID)
    .then(function (data) {
      if (data !== undefined) {
        applyImageResponse(data);
        return refreshComments();
      }
    })
    .then(function () {
      hideLoading();
      // Start polling for new images after initial load
      let knownImageCount = getTotalImages();
      imagePollInterval = setInterval(function () {
        apiService.getGalleryImageCount(userID).then(function (data) {
          if (data.count !== knownImageCount) {
            const increased = data.count > knownImageCount;
            knownImageCount = data.count;
            showNotification(
              increased
                ? "A new image was added! Click to dismiss."
                : "An image was deleted! Click to dismiss.",
              null,
            );
          }
        });
      }, 5000);
    });
}
