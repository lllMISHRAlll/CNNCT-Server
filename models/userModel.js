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
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    availability: {
      type: [{ day: String, startTime: String, endTime: String }],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
