const express = require("express");
// const cors = require("cors");
const contactRouter = require("./contactRouter");
const bodyParser = require("body-parser");

const server = express();

// server.use(cors());

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

server.use(contactRouter);

server.listen(8000, (err) => {
  if (err) console.log(err);
  else console.log("Server is running on port 8000");
});
