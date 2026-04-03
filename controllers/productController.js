import Product from "../models/Product.js";

// ── Public: Get all active products (for store browsing) ──────────────────────
const getProducts = async (req, res) => {
  try {
    const {
      search, category, brand, minPrice, maxPrice,
      condition, rating, sort = "createdAt",
      page = 1, limit = 10, featured,
    } = req.query;

    const filter = { isActive: true };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (condition) filter.condition = condition;
    if (featured === "true") filter.isFeatured = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (rating) filter.rating = { $gte: Number(rating) };

    const sortOptions = {
      createdAt: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      orders: { orders: -1 },
      name: { name: 1 },
    };
    const sortQuery = sortOptions[sort] || sortOptions.createdAt;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: Get only THIS admin's products ─────────────────────────────────────
// GET /api/products/admin/mine
const getMyAdminProducts = async (req, res) => {
  try {
    const {
      search, category, page = 1, limit = 12,
    } = req.query;

    // ✅ Only return products created by the logged-in admin
    const filter = { createdBy: req.user._id };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Create product — save which admin created it ───────────────────────────────
const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user._id,           // ✅ tag with admin's ID
      createdByName: req.user.name || "", // ✅ store name for fast display
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Update product — only the admin who created it can update ─────────────────
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ✅ Only the admin who created it can edit it
    if (product.createdBy && product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own products" });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Delete product — only the admin who created it can delete ─────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ✅ Only the admin who created it can delete it
    if (product.createdBy && product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own products" });
    }

    await product.deleteOne();
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", { isActive: true });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .sort({ orders: -1 })
      .limit(10);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getProducts, getMyAdminProducts, getProduct, createProduct,
  updateProduct, deleteProduct, getCategories, getFeaturedProducts,
};