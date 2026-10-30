import ApiKey from "../models/apiKey.model.js";
import KeyUsage from "../models/apiUsage.model.js";
import Media from "../models/media.model.js";
import User from "../models/user.model.js";
import { getBucket } from "../config/gridfs.js";
import { Readable } from "stream";
import mongoose from "mongoose";
import { Backend_Url } from "../config/env.js";
import crypto from "crypto";

export const genApiKey = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "API key name is required" });
    }
    let newKey;
    let isUnique = false;

    while (!isUnique) {
      const randomPart = crypto.randomBytes(10).toString("hex").slice(0, 18);
      newKey = `md_sk_${randomPart}`;

      const existing = await ApiKey.findOne({ key: newKey });
      if (!existing) isUnique = true;
    }

    const apiKey = await ApiKey.create({
      name,
      key: newKey,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "API key created successfully",
      apiKey: {
        _id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    console.error("Generate API key error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ keys });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadMediaByApiKeys = async (req, res) => {
  try {
    const { apikey } = req.headers;
    if (!apikey) {
      return res.status(400).json({ message: "API key required" });
    }
    const key = await ApiKey.findOne({ key: apikey });
    if (!key) return res.status(404).json({ message: "Invalid API key" });

    const user = await User.findById(key.createdBy);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const isPremium = user.role === "premium";

    let totalCreditsRequired = 0;
    req.files.forEach((file) => {
      const sizeInMB = file.size / (1024 * 1024);
      totalCreditsRequired += Math.ceil(sizeInMB) * 2;
    });

    if (!isPremium && user.credits < totalCreditsRequired) {
      return res.status(400).json({
        message: `${totalCreditsRequired} credits required`,
        requiredCredits: totalCreditsRequired,
        availableCredits: user.credits,
      });
    }

    const bucket = getBucket();
    const uploadedFiles = [];

    await Promise.all(
      req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const readableStream = Readable.from(file.buffer);
            const uploadStream = bucket.openUploadStream(file.originalname, {
              contentType: file.mimetype,
            });

            readableStream.pipe(uploadStream);

            uploadStream.on("finish", async () => {
              const newMedia = await Media.create({
                filename: file.originalname,
                contentType: file.mimetype,
                size: file.size,
                gridfsId: uploadStream.id,
                uploadBy: user._id,
              });

              uploadedFiles.push({
                ...newMedia.toObject(),
                fileId: newMedia._id,
                fileUrl: `${Backend_Url}/api/media/get-media/${newMedia._id}`,
                uploadedAt: newMedia.createdAt,
              });

              resolve();
            });

            uploadStream.on("error", reject);
          }),
      ),
    );

    if (!isPremium) {
      user.credits -= totalCreditsRequired;
      await user.save();
    }

    const today = new Date().toISOString().split("T")[0];
    await KeyUsage.findOneAndUpdate(
      { apiKey: key._id, user: user._id, date: today },
      { $inc: { calls: req.files.length } },
      { upsert: true },
    );
    key.keyCalles += req.files.length;
    key.lastUsed = new Date();
    await key.save();

    res.status(201).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
      ...(!isPremium && {
        creditsUsed: totalCreditsRequired,
        remainingCredits: user.credits,
      }),
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    if (!keyId) {
      return res.status(400).json({ message: "API key ID is required" });
    }

    const key = await ApiKey.findById(keyId);

    if (!key) {
      return res.status(404).json({ message: "API key not found" });
    }

    if (key.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this key" });
    }

    await ApiKey.deleteOne({ _id: keyId });
    await KeyUsage.deleteMany({ apiKey: keyId });

    res.status(200).json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Delete API key error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserApiUsage = async (req, res) => {
  try {
    const total = await KeyUsage.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, totalCalls: { $sum: "$calls" } } },
    ]);

    res.status(200).json({ totalCalls: total[0]?.totalCalls || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getApiUsageByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const total = await KeyUsage.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, totalCalls: { $sum: "$calls" } } },
    ]);

    res.status(200).json({ totalCalls: total[0]?.totalCalls || 0 });
  } catch (error) {
    console.error("Get API usage by date error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getApiUsageByMonth = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: "Month is required" });
    const [year, mon] = month.split("-").map(Number);
    if (!year || !mon)
      return res.status(400).json({ message: "Invalid month format" });

    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const total = await KeyUsage.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, totalCalls: { $sum: "$calls" } } },
    ]);

    res.status(200).json({ totalCalls: total[0]?.totalCalls || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
