import express from "express";
const router = express.Router();
import {
  placeOrder, getMyOrders, getOrder,
  getAllOrders, getMyAdminOrders, updateOrderStatus, cancelOrder,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/auth.js";

// ── Public / guest ────────────────────────────────────────────────────────────
router.post("/", placeOrder);
router.get("/my", getMyOrders);

// ── Admin routes — MUST be above /:id ────────────────────────────────────────
router.get("/admin/all", protect, adminOnly, getAllOrders);        // superadmin: all orders
router.get("/admin/mine", protect, adminOnly, getMyAdminOrders);  // ✅ NEW: this admin's orders only
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

// ── Param routes — last ───────────────────────────────────────────────────────
router.get("/:id", getOrder);
router.put("/:id/cancel", cancelOrder);

export default router;