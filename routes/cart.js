import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// GET cart / DELETE (clear) cart
router.route("/:sessionId").get(getCart).delete(clearCart);

// ADD item to cart
router.post("/:sessionId/items", addToCart);

// UPDATE or REMOVE specific item
router
  .route("/:sessionId/items/:productId")
  .put(updateCartItem)
  .delete(removeFromCart);

export default router;