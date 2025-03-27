import Event from "../models/eventModel.js";
import User from "../models/userModel.js";
import createError from "../utils/error.js";
import moment from "moment-timezone";

// Fetch user availability
const getUserAvailability = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  return user.availability;
};

// Convert event time to moment object
const getEventTime = (event) => {
  const eventStart = moment.tz(
    `${event.date} ${event.time} ${event.period}`,
    "YYYY-MM-DD hh:mm A",
    event.timezone
  );
  const eventEnd = eventStart.clone().add(event.duration, "minutes");
  return { eventStart, eventEnd };
};

// Check if event is within availability
const isWithinAvailability = (eventStart, eventEnd, availability) => {
  const day = eventStart.day(); // Ensure day matches availability keys (0-6)
  const slots = availability[day] || [];

  return slots.some((slot) => {
    const slotStart = moment.tz(
      eventStart.format("YYYY-MM-DD") + " " + slot.startTime,
      "YYYY-MM-DD HH:mm",
      eventStart.tz()
    );
    const slotEnd = moment.tz(
      eventStart.format("YYYY-MM-DD") + " " + slot.endTime,
      "YYYY-MM-DD HH:mm",
      eventStart.tz()
    );

    return (
      eventStart.isBetween(slotStart, slotEnd, null, "[)") &&
      eventEnd.isBetween(slotStart, slotEnd, null, "[)")
    );
  });
};

// Check if event overlaps with other events
const checkOverlappingEvents = (event, allEvents) => {
  const { eventStart, eventEnd } = getEventTime(event);

  for (const otherEvent of allEvents) {
    if (otherEvent._id.equals(event._id)) continue;

    const { eventStart: otherStart, eventEnd: otherEnd } =
      getEventTime(otherEvent);

    if (
      (eventStart.isBefore(otherEnd) && eventEnd.isAfter(otherStart)) ||
      (otherStart.isBefore(eventEnd) && otherEnd.isAfter(eventStart))
    ) {
      return true; // Conflict detected
    }
  }

  return false;
};

// Main function to get events with conflict detection
export const getEventsWithConflicts = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Fetch user availability
    const availability = await getUserAvailability(userId);

    // Fetch events where user is either creator or participant
    const events = await Event.find({
      $or: [
        { createdBy: userId },
        { participants: { $elemMatch: { userId: userId } } },
      ],
    });

    // Process events with conflict detection
    const formattedEvents = events.map((event) => {
      const { eventStart, eventEnd } = getEventTime(event);
      let isConflict = false;
      let reason = "";

      if (
        !isWithinAvailability(eventStart, eventEnd, availability, event.date)
      ) {
        isConflict = true;
        reason = "Unavilability";
        // Conflict due to availability
      }

      if (checkOverlappingEvents(event, events)) {
        isConflict = true; // Conflict due to overlapping meeting
        reason = "Overlaping Events";
      }

      return { ...event.toObject(), isConflict, reason };
    });

    res.status(200).json({ events: formattedEvents, userId, availability });
  } catch (error) {
    next(
      createError(400, error.message || "Failed to fetch associated events")
    );
  }
};
