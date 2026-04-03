import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const getOrCreateCart = async (sessionId) => {
  let cart = await Cart.findOne({ sessionId }).populate("items.product");
  if (!cart) {
    cart = await Cart.create({ sessionId, items: [] });
  }
  return cart;
};

const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.params.sessionId);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: "Not enough stock" });
    }

    let cart = await getOrCreateCart(req.params.sessionId);

    const existingIndex = cart.items.findIndex(
      (item) => item.product._id?.toString() === productId || item.product?.toString() === productId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity), price: product.price });
    }

    await cart.save();
    await cart.populate("items.product");

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await getOrCreateCart(req.params.sessionId);

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product._id?.toString() === req.params.productId ||
        item.product?.toString() === req.params.productId
    );

    if (itemIndex < 0) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    if (Number(quantity) <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }

    await cart.save();
    await cart.populate("items.product");

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.params.sessionId);

    cart.items = cart.items.filter(
      (item) =>
        item.product._id?.toString() !== req.params.productId &&
        item.product?.toString() !== req.params.productId
    );

    await cart.save();
    await cart.populate("items.product");

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.params.sessionId);
    cart.items = [];
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };