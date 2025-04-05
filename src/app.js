import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//? From where data is comming
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//? Data comming in JSON form
app.use(express.json({ limit: "10mb" }));

//? Data comming in URL form
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//?
app.use(express.static("public"));
app.use(cookieParser());

//?routes import
import userRouter from "./routes/user.routes.js";

//?routes declaration
app.use("/api/v1/users", userRouter); //at this route userRoutes will activate

export default app;
