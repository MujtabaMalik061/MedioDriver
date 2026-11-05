import express from "express";
import { upload } from "../middlewares/media.middleware.js";
import {
  uploadMedia,
  uploadMultipleMedia,
  deleteMedia,
  getMediaById,
  getTodayUploads,
  getMediaRecords,
} from "../controllers/media.controller.js";
import { verifyToken, verifyTokenOrApiKey } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/upload-media", verifyTokenOrApiKey, upload.single("file"), uploadMedia);
router.post("/upload-multiple-media", verifyTokenOrApiKey, upload.array("files", 5), uploadMultipleMedia);
router.delete("/delete-media/:id", verifyToken, deleteMedia);
router.get("/today-uploads", verifyToken, getTodayUploads);
router.get("/get-media/:id", getMediaById);
router.get("/media-records", verifyToken, getMediaRecords);

export default router;
