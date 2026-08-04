import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { globalSearch } from "../controllers/search.controller.js";

const router = express.Router();
router.get("/", isLoggedIn, globalSearch);
export default router;
