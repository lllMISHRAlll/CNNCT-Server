import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format!"],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Minimum length is 6"],
      select: false,
    },
    availability: {
      type: [{ day: Number, startTime: String, endTime: String }],
      default: [
        { day: 0, startTime: "00:00", endTime: "00:00" },
        { day: 1, startTime: "00:00", endTime: "23:59" },
        { day: 2, startTime: "00:00", endTime: "23:59" },
        { day: 3, startTime: "00:00", endTime: "23:59" },
        { day: 4, startTime: "00:00", endTime: "23:59" },
        { day: 5, startTime: "00:00", endTime: "23:59" },
        { day: 6, startTime: "00:00", endTime: "23:59" },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
