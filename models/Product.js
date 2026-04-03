import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true, maxlength: [200, "Name cannot exceed 200 characters"] },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    originalPrice: { type: Number, default: null },
    image: { type: String, required: [true, "Image URL is required"] },
    images: { type: [String], default: [] },
    description: { type: String, required: [true, "Description is required"], trim: true },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Electronics", "Clothing", "Home & Outdoor", "Smartphones", "Laptops", "Cameras", "Audio", "Watches", "Tools", "Sports", "Other"],
    },
    brand: { type: String, default: "Generic", trim: true },
    stock: { type: Number, required: [true, "Stock is required"], min: [0, "Stock cannot be negative"], default: 0 },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    orders: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: false },
    discount: { type: Number, min: 0, max: 100, default: 0 },
    condition: { type: String, enum: ["Brand new", "Refurbished", "Old items"], default: "Brand new" },
    features: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // ✅ NEW: track which admin created this product
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdByName: { type: String, default: "" }, // stored for fast display without populate
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual("inStock").get(function () { return this.stock > 0; });
productSchema.index({ name: "text", description: "text", category: "text", brand: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdBy: 1 }); // ✅ NEW: index for fast admin filtering

export default mongoose.model("Product", productSchema);