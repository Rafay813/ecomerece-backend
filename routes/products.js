import express from "express";
import {
  getProducts, getMyAdminProducts, getProduct,
  createProduct, updateProduct, deleteProduct,
  getCategories, getFeaturedProducts,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get("/", getProducts);                          // all active products (store)
router.get("/featured", getFeaturedProducts);          // featured products
router.get("/meta/categories", getCategories);         // all categories

// ── Admin routes — MUST be above /:id ────────────────────────────────────────
// ✅ NEW: only products created by the logged-in admin
router.get("/admin/mine", protect, adminOnly, getMyAdminProducts);

// ── Param routes — last ───────────────────────────────────────────────────────
router.get("/:id", getProduct);                        // single product
router.post("/", protect, adminOnly, createProduct);   // create product
router.put("/:id", protect, adminOnly, updateProduct); // update product
router.delete("/:id", protect, adminOnly, deleteProduct); // delete product

export default router;