const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.port || 5000;

const data = {
  name: "Aniket",
  age: 21,
  email: "aniket@gmail.com",
  phone: "1234567890",
  address: "Mumbai",
  gender: "Male",
  hobbies: ["Reading", "Coding", "Gaming"],
  education: "Graduation",
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/twitter", (req, res) => {
  res.send("Hello Twitter!");
});

app.get("/instagram", (req, res) => {
  res.send("<h1>Welcome to Instagram page</h1>");
});

app.get("/data", (req, res) => {
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
