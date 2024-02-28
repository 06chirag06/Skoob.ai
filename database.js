const Sequelize = require("sequelize");

const connection = new Sequelize("fluxCart", "root", "chirag", {
  host: "127.0.0.1",
  port: 3306,
  dialect: "mysql",
});

module.exports = { connection };
