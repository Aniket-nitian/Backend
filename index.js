const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.port || 5000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/twitter", (req, res) => {
  res.send("Hello Twitter!");
});

app.get("/instagram", (req, res) => {
  res.send("<h1>Welcome to Instagram page</h1>");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
