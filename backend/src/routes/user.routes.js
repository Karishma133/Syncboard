import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  userRegister, userVerify, userLogin, logout, forgetPassword, resetPassword, getMe
} from "../controllers/user.controllers.js";

const router = express.Router();

router.post("/register", userRegister);
router.get("/verify/:token", userVerify);
router.post("/login", userLogin);
router.post("/logout", isLoggedIn, logout);
router.post("/forget-password", forgetPassword);
router.post("/resetpassword/:token", resetPassword);
router.get("/me", isLoggedIn, getMe);

export default router;
