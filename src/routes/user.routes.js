import { Router } from "express";
import registerUser from "../controllers/user.controllers.js";

const router = Router();

//http://localhost:3000/api/v1/users/register
router.route("/register").post(registerUser);

//http://localhost:3000/api/v1/users/login
//?router.route("/login").post(registerUser);

export default router;
