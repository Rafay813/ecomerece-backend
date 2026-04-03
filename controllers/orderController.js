import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ── Place COD order ───────────────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, sessionId, notes } = req.body;

    if (!shippingAddress?.fullName || !shippingAddress?.phone ||
        !shippingAddress?.address || !shippingAddress?.city) {
      return res.status(400).json({ success: false, message: "Complete shipping address required" });
    }

    const cart = await Cart.findOne({ sessionId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Build order items — tag each with adminId of who listed the product
    const orderItems = [];
    const adminIdSet = new Set(); // collect all unique adminIds in this order

    for (const item of cart.items) {
      const product = item.product;
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for: ${product?.name || "a product"}`,
        });
      }

      // ✅ Attach the admin who listed this product to the order item
      const adminId = product.createdBy || null;
      const adminName = product.createdByName || "";
      if (adminId) adminIdSet.add(adminId.toString());

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: item.price,
        quantity: item.quantity,
        adminId,   // ✅ which admin gets this item
        adminName, // ✅ admin name for display
      });
    }

    const itemsTotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = itemsTotal > 500 ? 0 : 10;
    const taxAmount = parseFloat((itemsTotal * 0.08).toFixed(2));
    const totalAmount = parseFloat((itemsTotal + shippingCost + taxAmount).toFixed(2));

    const order = await Order.create({
      user: req.user?._id || null,
      sessionId,
      items: orderItems,
      shippingAddress,
      paymentMethod: "cod",
      itemsTotal,
      shippingCost,
      taxAmount,
      totalAmount,
      status: "confirmed",
      notes: notes || "",
      adminIds: [...adminIdSet], // ✅ all admins who have items in this order
    });

    // Reduce stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, orders: item.quantity },
      });
    }

    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get my orders (customer) ──────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const filter = req.user
      ? { $or: [{ user: req.user._id }, { sessionId }] }
      : { sessionId };

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get single order ──────────────────────────────────────────────────────────
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product", "name image price");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: Get only orders that contain THIS admin's products ─────────────────
// GET /api/orders/admin/mine
export const getMyAdminOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // ✅ Only return orders where this admin has at least one item
    const filter = { adminIds: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [allOrders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name email"),
      Order.countDocuments(filter),
    ]);

    // ✅ For each order, only show the items that belong to THIS admin
    const orders = allOrders.map((order) => {
      const myItems = order.items.filter(
        (item) => item.adminId && item.adminId.toString() === req.user._id.toString()
      );
      const myItemsTotal = myItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return {
        ...order.toObject(),
        items: myItems,           // only this admin's items
        itemsTotal: myItemsTotal, // recalculated for this admin's items only
      };
    });

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: Get ALL orders (superadmin view) ───────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("user", "name email"),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: Update order status ────────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // ✅ Make sure this admin has items in this order before allowing status update
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const hasItems = order.adminIds?.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!hasItems) {
      return res.status(403).json({ success: false, message: "You can only update orders containing your products" });
    }

    const update = { status };
    if (status === "delivered") {
      update.isDelivered = true;
      update.deliveredAt = new Date();
      update.isPaid = true;
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Cancel order ──────────────────────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (["shipped", "delivered"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel a shipped or delivered order" });
    }
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, orders: -item.quantity },
      });
    }
    order.status = "cancelled";
    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};