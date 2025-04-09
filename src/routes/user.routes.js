import { Router } from "express";
import registerUser from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

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
//?router.route("/login").post(registerUser);

export default router;
