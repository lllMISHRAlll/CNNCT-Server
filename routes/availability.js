import express from "express";
import { createAvailability } from "../controllers/availability.js";

const router = express.Router();

router.post("/inputhours", createAvailability);
export default router;
