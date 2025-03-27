import express from "express";
import {
  changeStatus,
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from "../controllers/event.js";
import { getEventsWithConflicts } from "../controllers/conflict.js";

const router = express.Router();

router.post("/createevent", createEvent);
router.put("/updateevent/:eventId", updateEvent);
router.get("/getevents", getEvents);
router.delete("/deleteevent/:eventId", deleteEvent);
router.patch("/updatestatus/:eventId", changeStatus);
router.get("/getconflicts", getEventsWithConflicts);
export default router;
