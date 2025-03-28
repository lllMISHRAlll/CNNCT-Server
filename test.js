// const moment = require("moment-timezone");
import moment from "moment-timezone";

// Utility function to convert event date, time, and duration to UTC timestamps
function getEventTimeInUTC(date, time, period, timezone, duration) {
  // Parse to local time using DD/MM/YY format
  const formattedTime = `${date} ${time} ${period}`;
  // Parse using DD/MM/YY instead of MM/DD/YY
  const eventStart = moment
    .tz(formattedTime, "DD/MM/YY hh:mm A", timezone)
    .utc();
  // Calculate event end time by adding duration in hours
  const eventEnd = eventStart.clone().add(duration, "hours");
  return { start: eventStart.valueOf(), end: eventEnd.valueOf() };
}

// Function to check for overlapping events
function hasOverlap(events) {
  const utcEvents = events.map((event) =>
    getEventTimeInUTC(
      event.date,
      event.time,
      event.period,
      event.timezone,
      event.duration
    )
  );

  for (let i = 0; i < utcEvents.length; i++) {
    for (let j = i + 1; j < utcEvents.length; j++) {
      const eventA = utcEvents[i];
      const eventB = utcEvents[j];
      if (eventA.start < eventB.end && eventA.end > eventB.start) {
        return true;
      }
    }
  }
  return false;
}

// Function to check if events fall within availability time
function isWithinAvailability(events, availability) {
  const utcEvents = events.map((event) =>
    getEventTimeInUTC(
      event.date,
      event.time,
      event.period,
      event.timezone,
      event.duration
    )
  );

  for (const event of utcEvents) {
    // Get the event's day of the week in UTC
    const eventDay = moment.utc(event.start).day();
    const availableSlots = availability.get(eventDay.toString());
    if (!availableSlots) return false;

    const isInRange = availableSlots.some((slot) => {
      // Get the event's UTC date in YYYY-MM-DD format
      const eventDate = moment.utc(event.start).format("YYYY-MM-DD");
      // Parse the slot times on the event's UTC date
      const slotStart = moment
        .tz(`${eventDate} ${slot.startTime}`, "YYYY-MM-DD HH:mm", "UTC")
        .valueOf();
      const slotEnd = moment
        .tz(`${eventDate} ${slot.endTime}`, "YYYY-MM-DD HH:mm", "UTC")
        .valueOf();

      // Uncomment the following lines to debug slot and event times:
      // console.log("event.start", event.start);
      // console.log("slotStart", slotStart);
      // console.log("event.end", event.end);
      // console.log("slotEnd", slotEnd);

      // Check that the event starts at or after slotStart and ends on or before slotEnd
      return event.start >= slotStart && event.end <= slotEnd;
    });

    if (!isInRange) return false;
  }
  return true;
}

// Example Usage
const events = [
  {
    date: "31/03/24",
    time: "03:00",
    period: "PM",
    timezone: "Africa/Bujumbura", // UTC+2
    duration: 2,
  },
  {
    date: "31/03/24",
    time: "02:00",
    period: "PM",
    timezone: "Africa/Bujumbura", // UTC+2
    duration: 2,
  },
];

const availability = new Map([
  ["0", [{ startTime: "00:00", endTime: "23:59" }]],
  ["1", [{ startTime: "00:00", endTime: "23:59" }]],
  ["2", [{ startTime: "00:00", endTime: "23:59" }]],
  ["3", [{ startTime: "00:00", endTime: "23:59" }]],
  ["4", [{ startTime: "00:00", endTime: "23:59" }]],
  ["5", [{ startTime: "00:00", endTime: "23:59" }]],
  ["6", [{ startTime: "00:00", endTime: "23:59" }]],
]);

console.log("Has Overlap:", hasOverlap(events));
console.log(
  "Is Within Availability:",
  isWithinAvailability(events, availability)
);
