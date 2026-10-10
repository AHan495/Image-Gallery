# Web Gallery

A multi-user image gallery single-page app. Anyone can browse galleries; logged-in users can comment, and each user manages their own gallery. Built for UTSC CSCC09 (Programming on the Web), with a vanilla JS frontend and an Express + SQLite backend.

## Features

- Session-based authentication: sign up, log in, log out (bcrypt salted hashes, express-session)
- Gallery list with cursor-based pagination (`before` / `after` user IDs)
- Gallery viewer with a TikTok-style vertical slide interface: scroll wheel or swipe to move between images, with CSS transitions and a scroll cooldown
- Add images by file upload (multer) or by URL
- Comments: a 3-comment preview on each image plus a full paginated comments view (10 per page), visible and writable only when logged in
- Role-based permissions enforced on the server:
  - only the gallery owner can add or delete images
  - a comment can be deleted by its author or by the gallery owner
  - unauthenticated requests get 401, unauthorized ones get 403
- Short-polling (every 5 seconds) for new galleries and for images added or deleted in the gallery you're viewing, shown as click-to-dismiss notifications

## Tech stack

**Backend:** Node.js (ES modules), Express 5, express-session, bcrypt, Sequelize ORM with SQLite, multer

**Frontend:** vanilla JavaScript, no framework. Includes `meact`, a small React-inspired state library written for this project (`useState` returns a `[key, getter, setter]` triple; `useEffect` re-runs a callback whenever its dependency states change), a tiny page router, and an `apiService` module wrapping all fetch calls.

**Tooling:** Docker, Prettier

## Architecture notes

- The gallery viewer uses three rotating slide containers (previous / current / next). On navigation the containers swap roles and the freed one is reset, which keeps transitions smooth.
- All gallery state (current image, comments, page numbers, open panels) lives in `meact` states, and a single `useEffect` re-renders the active slide when any of them change.
- Image responses bundle `{ image, count, topComments }`, and top comments are only included for authenticated requesters.

## API overview

Images (`/api/images`):

    GET    /gallery/:galleryId/first    first image in a gallery
    GET    /gallery/:galleryId/count    number of images in a gallery
    GET    /:id/next                    next image in the same gallery
    GET    /:id/prev                    previous image in the same gallery
    GET    /:id/file                    serve the file (or redirect to the URL)
    POST   /                            add an image (auth required)
    DELETE /:id                         delete an image and its comments (owner only)
    GET    /:id/comments                paginated comments (auth required)
    POST   /:id/comments                add a comment (auth required)

Users (`/api/users`):

    POST   /signup                      create account and start session
    POST   /login                       log in
    POST   /logout                      destroy session
    GET    /me                          current session user
    GET    /                            paginated list of galleries
    GET    /count                       total number of users

Comments (`/api/comments`):

    DELETE /:id                         delete a comment (comment author or gallery owner)

## Project structure

    app.js          entry point
    datasource.js   Sequelize / SQLite setup
    middleware/     auth middleware (isAuthenticated)
    models/         User, Image, Comment and their associations
    routers/        images, users and comments routes
    static/         frontend
      index.html    single page with all views
      styles/       CSS
      js/           meact, api-service, router, and one file per page
    Dockerfile      container build

## Running locally

    npm install
    node app.js

Create a `.env` file in the project root:

    SESSION_SECRET=your-long-random-string

Uploaded files are stored in `uploads/`.

## Notes

Originally a course assignment, deployed on a DigitalOcean droplet behind HTTPS.

