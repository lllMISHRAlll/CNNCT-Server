import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectToDB from "./utils/connection.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import eventRoutes from "./routes/event.js";
import availabilityRoutes from "./routes/availability.js";
import { verifyToken } from "./middlware/verify.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

connectToDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use(verifyToken);
app.use("/api/user", userRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/availability", availabilityRoutes);

app.get("/", (req, res) => {
  res.status(200).send({
    message: "Backend server is up and running!!!",
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  res.status(statusCode).json({ success: false, statusCode, message });
});

app.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}`);
});

export default app;
