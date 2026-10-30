import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";
import { initGridFS } from "../config/gridfs.js";

if (!DB_URI) {
  throw new Error(
    "Please define the DB_URI environment variable inside .env.<development/production>.local",
  );
}

const connectToDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      initGridFS();
      return;
    }
    await mongoose.connect(DB_URI);
    initGridFS();
    console.log(`Connected to DB successfully in ${NODE_ENV} mode`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectToDB;
