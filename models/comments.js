import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Image } from "./images.js";
import { User } from "./users.js";

export const Comment = sequelize.define("Comment", {
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Sequelize has createdAt columns automatically. Just use that for date
});

Comment.belongsTo(Image);
Image.hasMany(Comment);
Comment.belongsTo(User);
User.hasMany(Comment);