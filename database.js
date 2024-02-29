const Sequelize = require("sequelize");
const dotenv = require("dotenv").config();

const connection = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "mysql",
});

module.exports = { connection };
