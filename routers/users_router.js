import express from "express";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { User } from "../models/users.js";

export const usersRouter = express.Router();

const SALT_ROUNDS = 10;

// Sign up
usersRouter.post("/signup", async function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const existing = await User.findOne({ where: { username } });
  if (existing) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, saltedHashedPassword: hash });

  // Middleware in app.js has express-session hook up req.session
  req.session.user = { id: user.id, username: user.username };

  return res.json({ username: user.username });
});

// Log in
usersRouter.post("/login", async function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const match = await bcrypt.compare(password, user.saltedHashedPassword);
  if (!match) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // Middleware in app.js has express-session hook up req.session
  req.session.user = { id: user.id, username: user.username };

  return res.json({ username: user.username });
});

// Log out
usersRouter.post("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) return res.status(500).json({ error: "Could not log out" });
    return res.json({ message: "Logged out" });
  });
});

// Get current session user
usersRouter.get("/me", function (req, res) {
  if (req.session.user) {
    return res.json(req.session.user);
  }
  return res.status(401).json({ error: "Not authenticated" });
});

// Get paginated list of users (galleries)
usersRouter.get("/", async function (req, res) {
  const pageSize = parseInt(req.query.pageSize) || 10;
  const before = parseInt(req.query.before) || null;
  const after = parseInt(req.query.after) || null;

  let whereClause = {};
  if (before) {
    whereClause = { id: { [Op.lt]: before } };
  } else if (after) {
    whereClause = { id: { [Op.gt]: after } };
  }

  const users = await User.findAll({
    attributes: ["id", "username"],
    where: whereClause,
    order: [["id", "DESC"]],
    limit: pageSize,
  });

  const hasPrev =
    users.length > 0
      ? (await User.count({ where: { id: { [Op.gt]: users[0].id } } })) > 0
      : false;

  const hasNext =
    users.length > 0
      ? (await User.count({
          where: { id: { [Op.lt]: users[users.length - 1].id } },
        })) > 0
      : false;

  return res.json({
    galleries: users.map(function (user) {
      return { userId: user.id, username: user.username };
    }),
    hasPrev,
    hasNext,
  });
});

// Get total number of users
usersRouter.get("/count", async function (req, res) {
  const count = await User.count();
  return res.json({ count });
});