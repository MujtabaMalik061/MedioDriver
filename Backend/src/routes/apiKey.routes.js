// src/routes/auth.routes.js
import express from "express";
import {
  genApiKey,
  getApiKeys,
  uploadMediaByApiKeys,
  deleteApiKey,
  getUserApiUsage,
  getApiUsageByDate,
  getApiUsageByMonth,
  getApiDetails,
} from "../controllers/apiKey.controller.js";
import { upload } from "../middlewares/media.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/gen", verifyToken, genApiKey);
router.get("/get-keys", verifyToken, getApiKeys);
router.post("/upload-media", upload.array("files", 5), uploadMediaByApiKeys);
router.delete("/del-key/:keyId", verifyToken, deleteApiKey);
router.get("/api-usage", verifyToken, getUserApiUsage);
router.get("/api-uage-by-date", verifyToken, getApiUsageByDate);
router.get("/api-uage-by-month", verifyToken, getApiUsageByMonth);
router.get("/api-details/:keyId", verifyToken, getApiDetails);

export default router;
