import express from "express";
const router = express.Router();

// Import controllers
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  getAllUsers,
  getPendingRequests,
  approveAdminRequest,
  rejectAdminRequest,
  deleteUser,
} from "../controllers/authController.js";

// Import middleware
import { protect, adminOnly } from "../middleware/auth.js";

// ── Public Routes ─────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Protected Routes ──────────────────────────
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/password", protect, updatePassword);

// ── Admin Routes ──────────────────────────────
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/users/pending", protect, adminOnly, getPendingRequests);
router.put("/users/:id/approve", protect, adminOnly, approveAdminRequest);
router.put("/users/:id/reject", protect, adminOnly, rejectAdminRequest);
router.delete("/users/:id", protect, adminOnly, deleteUser);

// ✅ IMPORTANT: export default
export default router;