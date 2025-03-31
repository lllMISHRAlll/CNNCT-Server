import Event from "../models/eventModel.js";
import createError from "../utils/error.js";
import moment from "moment-timezone";
import User from "../models/userModel.js";

const getEventTimeInUTC = (date, time, period, timezone, duration, id) => {
  const formattedTime = `${date} ${time} ${period}`;
  const eventStart = moment
    .tz(formattedTime, "DD/MM/YYYY hh:mm A", timezone)
    .utc();
  const eventEnd = eventStart.clone().add(duration, "hours");
  return { start: eventStart.valueOf(), end: eventEnd.valueOf(), id };
};

function hasOverlap(events) {
  const conflict = new Map();
  const utcEvents = events.map((event) =>
    getEventTimeInUTC(
      event.date,
      event.time,
      event.period,
      event.timezone,
      event.duration,
      event.id
    )
  );

  for (let i = 0; i < utcEvents.length; i++) {
    for (let j = i + 1; j < utcEvents.length; j++) {
      const eventA = utcEvents[i];
      const eventB = utcEvents[j];

      if (eventA.start < eventB.end && eventA.end > eventB.start) {
        if (!conflict.has(eventA.id)) {
          conflict.set(eventA.id, { conflict: true });
        }
      }
    }
  }

  return Array.from(conflict, ([e1, value]) => ({ e1, ...value }));
}

function isWithinAvailability(event, availability) {
  const utcEvent = getEventTimeInUTC(
    event.date,
    event.time,
    event.period,
    event.timezone,
    event.duration,
    event.id
  );

  const eventDay = moment(utcEvent.start).tz(event.timezone).day().toString();
  const availableSlots = availability.get(eventDay);

  if (!availableSlots) return { [event.id]: false };

  const isAvailable = availableSlots.some((slot) => {
    const eventDate = moment(utcEvent.start)
      .tz(event.timezone)
      .format("YYYY-MM-DD");

    const eventStart12 = moment(utcEvent.start)
      .tz(event.timezone)
      .format("YYYY-MM-DD hh:mm A");
    const eventEnd12 = moment(utcEvent.end)
      .tz(event.timezone)
      .format("YYYY-MM-DD hh:mm A");

    const slotStart12 = moment
      .tz(
        `${eventDate} ${slot.startTime}`,
        "YYYY-MM-DD hh:mm A",
        event.timezone
      )
      .format("YYYY-MM-DD hh:mm A");
    const slotEnd12 = moment
      .tz(`${eventDate} ${slot.endTime}`, "YYYY-MM-DD hh:mm A", event.timezone)
      .format("YYYY-MM-DD hh:mm A");

    return (
      moment(eventStart12, "YYYY-MM-DD hh:mm A").isSameOrAfter(
        moment(slotStart12, "YYYY-MM-DD hh:mm A")
      ) &&
      moment(eventEnd12, "YYYY-MM-DD hh:mm A").isSameOrBefore(
        moment(slotEnd12, "YYYY-MM-DD hh:mm A")
      )
    );
  });

  return { [event.id]: isAvailable };
}

function convertAvailability(inputMap) {
  const dayMap = {
    Mon: "1",
    Tue: "2",
    Wed: "3",
    Thu: "4",
    Fri: "5",
    Sat: "6",
    Sun: "0",
  };

  function convertTo24(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);
    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  const outputMap = new Map();

  for (const [dayAbbr, intervals] of inputMap.entries()) {
    const dayNumber = dayMap[dayAbbr];
    if (dayNumber !== undefined) {
      const convertedIntervals = intervals.map((interval) => ({
        startTime: convertTo24(interval.startTime),
        endTime: convertTo24(interval.endTime),
      }));
      outputMap.set(dayNumber, convertedIntervals);
    }
  }

  return outputMap;
}

function convertEvents(inputEvents) {
  return inputEvents.map((event) => ({
    date: event.date,
    time: event.time,
    period: event.period,
    timezone: event.timezone,
    duration: event.duration,
    id: event.id,
  }));
}

export const getEventsWithConflicts = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const availability = new Map(
      [...user.availability]
        .filter(([day]) => day !== "Sun")
        .map(([day, slots]) => [
          day,
          slots.map(({ from, to }) => ({
            startTime: from,
            endTime: to,
          })),
        ])
    );

    const events = await Event.find({
      $or: [
        { createdBy: userId },
        { participants: { $elemMatch: { userId } } },
      ],
    });
    const formattedEvents = convertEvents(events);
    const formattedAvialability = convertAvailability(availability);
    const conflict = hasOverlap(formattedEvents);
    const availabilityConflict = [];
    formattedEvents.map((event) => {
      const response = isWithinAvailability(event, formattedAvialability);
      availabilityConflict.push(response);
    });
    res.status(200).json({
      eventConflict: conflict,
      availableForThisMeeting: availabilityConflict,
    });
  } catch (error) {
    next(
      createError(500, error.message || "Failed to fetch associated events")
    );
  }
};
