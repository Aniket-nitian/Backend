import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//? datbase connection method_2.
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(connectionInstance.connection.host);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
