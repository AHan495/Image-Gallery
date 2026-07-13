import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  saltedHashedPassword: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
