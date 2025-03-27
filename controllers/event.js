import createError from "../utils/error.js";
import Event from "../models/eventModel.js";
import User from "../models/userModel.js";

export const createEvent = async (req, res, next) => {
  try {
    let { participants, ...eventData } = req.body;

    participants = await Promise.all(
      participants.map(async (participant) => {
        const user = await User.findOne({ email: participant.email });

        return {
          email: participant.email,
          name: user?.name || participant.email.split("@")[0],
          userId: user?._id || null,
          status: participant.status?.toUpperCase() || "PENDING",
        };
      })
    );

    const newEvent = new Event({
      ...eventData,
      participants,
      createdBy: req.user.userId,
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    next(createError(400, error.message || "Failed to create event"));
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const events = await Event.find({
      $or: [
        { createdBy: userId },
        { participants: { $elemMatch: { userId: userId } } },
      ],
    });

    res.status(200).json({ events, userId });
  } catch (error) {
    next(createError(400, "Failed to fetch associated events"));
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, {
      new: true,
    });
    if (!updatedEvent) return next(createError(404, "Event not found"));

    res
      .status(200)
      .json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    next(createError(400, error.message || "Failed to update event"));
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.eventId);

    if (!deletedEvent) return next(createError(404, "Event not found"));

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    next(createError(400, error.message || "Failed to delete event"));
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.body;
    const { eventId } = req.params;

    if (!status) {
      return next(createError(400, "Missing required fields"));
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return next(createError(404, "Event not found"));
    }

    const participant = event.participants.find(
      (p) => p.userId.toString() === userId
    );
    if (!participant) {
      return next(createError(404, "Participant not found"));
    }

    participant.status = status.toUpperCase();
    await event.save();

    res
      .status(200)
      .json({ success: true, message: "Status updated successfully", event });
  } catch (error) {
    next(createError(500, error.message || "Server error"));
  }
};
