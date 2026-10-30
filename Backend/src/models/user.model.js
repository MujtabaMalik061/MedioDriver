// src/models/user.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profilImg: { type: String, default: "" },
    role: {
      type: String,
      enum: ["user", "admin", "premium"],
      default: "user",
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

const User = model("User", userSchema);

export default User;
