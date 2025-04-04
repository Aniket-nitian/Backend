import mongoose from "mongoose";
//require("dotenv").config();
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

//? datbase connection method_2
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 1000, () => {
      console.log(`Server is running at port:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });

//? datbase connection method_1.
//!function connectDB() {}
/*
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", error => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server is running at port:${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
})();

*/
