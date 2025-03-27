import User from "../models/userModel.js";

export const createAvailability = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({ message: "Availability data is required" });
    }

    const convertTo12Hour = (time) => {
      let [hour, minute] = time.split(":").map(Number);
      let period = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )} ${period}`;
    };

    const formattedAvailability = {};
    Object.keys(availability).forEach((day) => {
      formattedAvailability[day] = availability[day].map((slot) => ({
        from: convertTo12Hour(slot.from),
        to: convertTo12Hour(slot.to),
      }));
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { availability: formattedAvailability },
      { new: true }
    ).select("availability");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Availability updated successfully",
      availability: user.availability,
      userId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
