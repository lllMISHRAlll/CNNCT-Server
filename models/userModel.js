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
    username: {
      type: String,
      unique: true,
      required: true,
    },
    preference: {
      type: String,
    },
    availability: {
      type: Map,
      of: [
        {
          from: String,
          to: String,
        },
      ],
      default: {
        Mon: [{ from: "12:00 AM", to: "11:59 PM" }],
        Tue: [{ from: "12:00 AM", to: "11:59 PM" }],
        Wed: [{ from: "12:00 AM", to: "11:59 PM" }],
        Thu: [{ from: "12:00 AM", to: "11:59 PM" }],
        Fri: [{ from: "12:00 AM", to: "11:59 PM" }],
        Sat: [{ from: "12:00 AM", to: "11:59 PM" }],
        Sun: [{ from: "00:00 AM", to: "00:00 PM" }],
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
