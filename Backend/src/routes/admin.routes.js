import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
  getAllUsers,
  getUserById,
  suspendUser,
  deleteUser,
  updateUserRole,
  getAdminDashboardStats,
  getAdminMediaRecords,
  getAdminPayments,
  getAdminApiStats,
} from "../controllers/admin.controller.js";

const router = Router();
router.use(verifyToken, verifyAdmin);

router.get("/dashboard", getAdminDashboardStats);
router.get("/media", getAdminMediaRecords);
router.get("/payments", getAdminPayments);
router.get("/api-stats", getAdminApiStats);

router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.patch("/users/:userId/suspend", suspendUser);
router.delete("/users/:userId", deleteUser);
router.patch("/users/:userId/role", updateUserRole);

export default router;
