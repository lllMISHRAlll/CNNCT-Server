import mongoose from "mongoose";

const connection = { isConnected: null };

const connectToDB = async () => {
  try {
    if (connection.isConnected) return;

    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected:", db.connection.host);
    connection.isConnected = db.connection.readyState;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectToDB;
