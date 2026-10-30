import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";
import ApiUsage from "../models/apiUsage.model.js";
import Media from "../models/media.model.js";
import { Backend_Url } from "../config/env.js";

// GET /api/admin/users?page=1&limit=10&search=
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const filter = {
      role: { $ne: "admin" },
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({ users, total, page, limit });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/users/:userId
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [mediaCount, apiUsageAgg, purchases] = await Promise.all([
      Media.countDocuments({ uploadBy: userId }),
      ApiUsage.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, totalCalls: { $sum: "$calls" } } },
      ]),
      Payment.find({ userId }).lean(),
    ]);

    const totalApiCalls = apiUsageAgg[0]?.totalCalls || 0;

    return res.status(200).json({
      user,
      mediaCount,
      totalApiCalls,
      purchases,
    });
  } catch (err) {
    console.error("getUserById error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/users/:userId/suspend
export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "approved" ? "rejected" : "approved";
    await user.save();

    const updated = await User.findById(userId).select("-password").lean();
    return res.status(200).json({ message: "User status updated", user: updated });
  } catch (err) {
    console.error("suspendUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/users/:userId
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/dashboard
export const getAdminDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalMedia, storageAgg, apiAgg] = await Promise.all([
      User.countDocuments({}),
      Media.countDocuments({}),
      Media.aggregate([{ $group: { _id: null, total: { $sum: "$size" } } }]),
      ApiUsage.aggregate([{ $group: { _id: null, total: { $sum: "$calls" } } }]),
    ]);
    const formatStorage = (bytes) => {
      if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + " GB";
      if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + " MB";
      if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + " KB";
      return bytes + " B";
    };
    return res.status(200).json({
      totalUsers,
      totalMedia,
      totalStorage: formatStorage(storageAgg[0]?.total || 0),
      totalApiCalls: apiAgg[0]?.total || 0,
    });
  } catch (err) {
    console.error("getAdminDashboardStats error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/media?page=1&limit=10&search=&contentType=
export const getAdminMediaRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const contentType = req.query.contentType || "";
    const skip = (page - 1) * limit;
    const filter = {};
    if (search) filter.filename = { $regex: search, $options: "i" };
    if (contentType && contentType !== "all") filter.contentType = { $regex: contentType, $options: "i" };
    const [files, total] = await Promise.all([
      Media.find(filter).populate("uploadBy", "name email profilImg role").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(filter),
    ]);
    const filesWithUrl = files.map((f) => ({ ...f, fileUrl: `${Backend_Url}/api/media/get-media/${f._id}` }));
    return res.status(200).json({ files: filesWithUrl, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("getAdminMediaRecords error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/payments?page=1&limit=10
export const getAdminPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({}).populate("userId", "name email profilImg role").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments({}),
    ]);
    return res.status(200).json({ payments, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("getAdminPayments error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/api-stats
export const getAdminApiStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [todayAgg, monthAgg, userStats] = await Promise.all([
      ApiUsage.aggregate([{ $match: { date: { $gte: startOfToday, $lt: endOfToday } } }, { $group: { _id: null, total: { $sum: "$calls" } } }]),
      ApiUsage.aggregate([{ $match: { date: { $gte: startOfMonth, $lt: endOfMonth } } }, { $group: { _id: null, total: { $sum: "$calls" } } }]),
      ApiUsage.aggregate([
        { $group: { _id: "$user", totalCalls: { $sum: "$calls" } } },
        { $sort: { totalCalls: -1 } },
        { $limit: 20 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        { $project: { totalCalls: 1, "userInfo.name": 1, "userInfo.email": 1, "userInfo.role": 1, "userInfo.profilImg": 1 } },
      ]),
    ]);
    return res.status(200).json({ todayCalls: todayAgg[0]?.total || 0, monthCalls: monthAgg[0]?.total || 0, userStats });
  } catch (err) {
    console.error("getAdminApiStats error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/users/:userId/role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["user", "premium"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be one of: user, premium" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password").lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User role updated", user });
  } catch (err) {
    console.error("updateUserRole error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
