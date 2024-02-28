const { INTEGER, STRING, ENUM, DATE } = require("sequelize");
const { connection } = require("./database");

const Contacts = connection.define(
  "contacts",
  {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    phoneNumber: {
      type: STRING,
      allowNull: true,
    },
    email: {
      type: STRING,
      allowNull: true,
    },
    linkedId: {
      type: INTEGER,
      allowNull: true,
    },
    linkPrecedence: {
      type: ENUM("primary", "secondary"),
      allowNull: false,
    },
    createdAt: {
      type: DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DATE,
      allowNull: true,
    },
  },
  { timestamps: false, freezeTableName: true }
);

module.exports = { Contacts };
