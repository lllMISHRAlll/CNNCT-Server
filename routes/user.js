import express from "express";
import { getUserInfo, updateUser } from "../controllers/auth.js";

const router = express.Router();

router.get("/userinfo", getUserInfo);
router.patch("/updateuser", updateUser);
export default router;
