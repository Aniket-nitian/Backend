import { Router } from "express";
import registerUser from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//http://localhost:3000/api/v1/users/register
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  registerUser
);

//http://localhost:3000/api/v1/users/login
//?router.route("/login").post(registerUser);

export default router;
