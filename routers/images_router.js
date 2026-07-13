import express from "express";
import path from "path";
import multer from "multer";
import { Op } from "sequelize";
import { Image } from "../models/images.js";
import { Comment } from "../models/comments.js";
import { isAuthenticated } from "../middleware/auth.js";

export const imagesRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

async function buildImageResponse(req, image, count) {
  let topComments = [];
  // Only include top comments when the requester is authenticated
  if (req && req.session && req.session.user) {
    topComments = await Comment.findAll({
      where: { ImageId: image.id },
      order: [["createdAt", "DESC"]],
      limit: 3,
    });
  }
  return { image, count, topComments };
}

// Get first image
imagesRouter.get("/gallery/:galleryId/first", async function (req, res) {
  const image = await Image.findOne({
    where: { UserId: req.params.galleryId },
    order: [["id", "ASC"]],
  });
  const count = await Image.count({ where: { UserId: req.params.galleryId } });
  if (!image) return res.status(404).json({ error: "No images found", count });
  return res.json(await buildImageResponse(req, image, count));
});

// Get next image
imagesRouter.get("/:id/next", async function (req, res) {
  const current = await Image.findByPk(req.params.id);
  if (!current) return res.status(404).json({ error: "Image not found" });
  const image = await Image.findOne({
    where: { UserId: current.UserId, id: { [Op.gt]: req.params.id } },
    order: [["id", "ASC"]],
  });
  const count = await Image.count({ where: { UserId: current.UserId } });
  if (!image) return res.status(404).json({ error: "No next image", count });
  return res.json(await buildImageResponse(req, image, count));
});

// Get previous image
imagesRouter.get("/:id/prev", async function (req, res) {
  const current = await Image.findByPk(req.params.id);
  if (!current) return res.status(404).json({ error: "Image not found" });
  const image = await Image.findOne({
    where: { UserId: current.UserId, id: { [Op.lt]: req.params.id } },
    order: [["id", "DESC"]],
  });
  const count = await Image.count({ where: { UserId: current.UserId } });
  if (!image) return res.status(404).json({ error: "No previous image", count });
  return res.json(await buildImageResponse(req, image, count));
});

// Serve image file or redirect to URL
imagesRouter.get("/:id/file", async function (req, res) {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });
  if (image.isLocal) {
    const filePath = path.join(process.cwd(), image.url);
    return res.sendFile(filePath);
  }
  return res.redirect(image.url);
});

// Add an image
imagesRouter.post("/", isAuthenticated, upload.single("image"), async function (req, res) {
  const { title, url } = req.body;
  const isLocal = !!req.file;
  const finalURL = req.file ? `uploads/${req.file.filename}` : url;
  await Image.create({ title, author: req.session.user.username, url: finalURL, isLocal, UserId: req.session.user.id });
  return res.json({ message: "Image created" });
});

// Delete an image and its comments
imagesRouter.delete("/:id", isAuthenticated, async function (req, res) {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });
  if (image.UserId !== req.session.user.id) {
    return res.status(403).json({ error: "Not authorized" });
  }
  await Comment.destroy({ where: { ImageId: req.params.id } });
  await image.destroy();
  return res.json({ message: "Image deleted" });
});

// Get paginated comments for an image (authenticated users only)
imagesRouter.get("/:id/comments", isAuthenticated, async function (req, res) {
  const page = parseInt(req.query.page) || 0;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { count, rows: comments } = await Comment.findAndCountAll({
    where: { ImageId: req.params.id },
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset: page * pageSize,
  });
  const pageCount = Math.max(Math.floor((count - 1) / pageSize) + 1, 1);
  return res.json({ comments, pageCount });
});

// Add a comment to an image
imagesRouter.post("/:id/comments", isAuthenticated, async function (req, res) {
  const { content } = req.body;
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });
  await Comment.create({ author: req.session.user.username, content, ImageId: req.params.id, UserId: req.session.user.id });
  return res.json({ message: "Comment created" });
});

// Get total number of images in a given gallery
imagesRouter.get("/gallery/:galleryId/count", async function (req, res) {
  const count = await Image.count({ where: { UserId: req.params.galleryId } });
  return res.json({ count });
});