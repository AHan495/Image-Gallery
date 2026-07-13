import express from "express";
import { Comment } from "../models/comments.js";
import { Image } from "../models/images.js";
import { isAuthenticated } from "../middleware/auth.js";

export const commentsRouter = express.Router();

// Delete a comment
commentsRouter.delete("/:id", isAuthenticated, async function (req, res) {
  const comment = await Comment.findByPk(req.params.id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const image = await Image.findByPk(comment.ImageId);
  const isGalleryOwner = image && image.UserId === req.session.user.id;
  const isCommentOwner = comment.UserId === req.session.user.id;

  if (!isGalleryOwner && !isCommentOwner) {
    return res.status(403).json({ error: "Not authorized" });
  }

  await comment.destroy();
  return res.json({ message: "Comment deleted" });
});
