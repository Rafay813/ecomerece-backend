import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  // ✅ NEW: track which admin listed this product so orders can be routed correctly
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  adminName: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sessionId: { type: String },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "Pakistan" },
    },
    paymentMethod: {
      type: String,
      enum: ["cod"],
      default: "cod",
    },
    itemsTotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 10 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    isPaid: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    notes: { type: String },

    // ✅ NEW: which admins have items in this order (for fast filtering)
    adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);