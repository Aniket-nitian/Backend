import { Router } from "express";
import {
  loginUser,
  logoutuser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

//http://localhost:3000/api/v1/users/register
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "CoverImages", maxCount: 1 },
  ]),
  registerUser
);

//http://localhost:3000/api/v1/users/login
router.route("/login").post(loginUser);
//? secure routes
router.route("/logout").post(verifyJWT, logoutuser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
