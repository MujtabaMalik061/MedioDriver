// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import ApiKey from "../models/apiKey.model.js";
import User from "../models/user.model.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT error:", err);
      return res.status(403).json({ message: "Failed to authenticate token" });
    }
    req.user = decoded;
    next();
  });
};

export const verifyTokenOrApiKey = async (req, res, next) => {
  const apikey = req.headers["apikey"];

  if (apikey) {
    try {
      const key = await ApiKey.findOne({ key: apikey });
      if (!key) return res.status(401).json({ message: "Invalid API key" });

      const user = await User.findById(key.createdBy);
      if (!user) return res.status(404).json({ message: "User not found" });

      req.user = { id: user._id.toString(), role: user.role };
      req.apiKeyId = key._id;
      return next();
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "No token or API key provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Failed to authenticate token" });
    }
    req.user = decoded;
    next();
  });
};
