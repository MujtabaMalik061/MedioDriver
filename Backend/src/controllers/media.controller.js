import Media from "../models/media.model.js";
import User from "../models/user.model.js";
import { getBucket } from "../config/gridfs.js";
import { Readable } from "stream";
import mongoose from "mongoose";
import { Backend_Url } from "../config/env.js";

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const creditRequired = req.body?.creditRequired === "true";

    let requiredCredits = 0;
    let user = null;

    if (creditRequired) {
      const fileSizeInMB = req.file.size / (1024 * 1024);
      requiredCredits = Math.ceil(fileSizeInMB) * 2;

      user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPremium = user.role === "premium";

      if (!isPremium && user.credits < requiredCredits) {
        return res.status(400).json({
          message: `${requiredCredits} credits required to upload this file`,
          requiredCredits,
          availableCredits: user.credits,
        });
      }

      if (isPremium) {
        requiredCredits = 0;
      }
    }

    const bucket = getBucket();
    const readableStream = Readable.from(req.file.buffer);

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    readableStream.pipe(uploadStream);

    uploadStream.on("finish", async () => {
      if (creditRequired && user) {
        user.credits -= requiredCredits;
        await user.save();
      }

      const newMedia = await Media.create({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        gridfsId: uploadStream.id,
        uploadBy: req.user?.id,
      });

      res.status(201).json({
        message: "File uploaded successfully",
        fileId: newMedia._id,
        fileUrl: `${Backend_Url}/api/media/get-media/${newMedia._id}`,
        ...(creditRequired && {
          creditsUsed: requiredCredits,
          remainingCredits: user.credits,
        }),
      });
    });

    uploadStream.on("error", (err) => {
      res.status(500).json({ message: err.message });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadMultipleMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let totalCreditsRequired = 0;
    req.files.forEach((file) => {
      const fileSizeInMB = file.size / (1024 * 1024);
      totalCreditsRequired += Math.ceil(fileSizeInMB) * 2;
    });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPremium = user.role === "premium";

    if (!isPremium && user.credits < totalCreditsRequired) {
      return res.status(400).json({
        message: `${totalCreditsRequired} credits required to upload these files`,
        requiredCredits: totalCreditsRequired,
        availableCredits: user.credits,
      });
    }

    const bucket = getBucket();
    const uploadedFiles = [];

    await Promise.all(
      req.files.map((file) => {
        return new Promise((resolve, reject) => {
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
              uploadBy: req.user.id,
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
        });
      }),
    );

    if (!isPremium) {
      user.credits -= totalCreditsRequired;
      await user.save();
    }

    res.status(201).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
      ...(!isPremium && {
        creditsUsed: totalCreditsRequired,
        remainingCredits: user.credits,
      }),
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ message: "File not found" });
    }
    if (media.uploadBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this file" });
    }
    const bucket = getBucket();
    await bucket.delete(new mongoose.Types.ObjectId(media.gridfsId));
    await Media.findByIdAndDelete(id);
    res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "File not found" });
    }

    await Media.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    );

    const bucket = getBucket();

    res.set("Content-Type", media.contentType);
    res.set("Content-Disposition", "inline");
    const downloadStream = bucket.openDownloadStream(media.gridfsId);

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTodayUploads = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const media = await Media.find({
      uploadBy: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });
    const formattedMedia = media.map((m) => ({
      fileId: m._id,
      filename: m.filename,
      size: m.size,
      contentType: m.contentType,
      fileUrl: `${Backend_Url}/api/media/get-media/${m._id}`,
      uploadedAt: m.createdAt,
    }));

    res.status(200).json({
      message: "Today's uploads fetched successfully",
      files: formattedMedia,
    });
  } catch (error) {
    console.error("Get today uploads error:", error);
    res.status(500).json({ message: "Failed to fetch today's uploads" });
  }
};

export const getMediaRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, contentType, search } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);

    const filter = {
      uploadBy: req.user.id,
    };

    if (contentType) {
      filter.contentType = { $regex: contentType, $options: "i" };
    }

    if (search) {
      filter.filename = { $regex: search, $options: "i" };
    }

    const [media, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),

      Media.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const filesWithUrl = media.map((m) => ({
      ...m.toObject(),
      fileUrl: `${Backend_Url}/api/media/get-media/${m._id}`,
    }));

    res.status(200).json({
      message: "User media fetched successfully",
      files: filesWithUrl,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get media records error:", error);
    res.status(500).json({ message: "Failed to fetch media records" });
  }
};
