import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    period: {
      type: String,
      enum: ["AM", "PM"],
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    participants: [
      {
        email: {
          type: String,
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        status: {
          type: String,
          enum: ["ACCEPTED", "REJECTED", "PENDING"],
          default: "PENDING",
        },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Event", EventSchema);
