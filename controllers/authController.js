import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ── Generate JWT ──────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

// ── Send token response ───────────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
};

// ── REGISTER ──────────────────────────────────────────────────────────────────
// POST /api/auth/register
// If role = "user"  → status: active  → can login immediately
// If role = "admin" → status: pending → must wait for existing admin approval
const register = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Only allow "user" or "admin" as role
    const requestedRole = role === "admin" ? "admin" : "user";

    // If requesting admin role → status is "pending" (needs approval)
    // If requesting user role  → status is "active" (login immediately)
    const status = requestedRole === "admin" ? "pending" : "active";

    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole,
      status,
    });

    // If admin request → don't send token, just notify
    if (requestedRole === "admin") {
      return res.status(201).json({
        success: true,
        isPending: true,
        message: "Admin request submitted. Please wait for an existing admin to approve your account.",
      });
    }

    // Normal user → send token so they're logged in immediately
    sendTokenResponse(user, 201, res);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check if admin request is still pending
    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        isPending: true,
        message: "Your admin request is pending approval. Please wait for an admin to approve your account.",
      });
    }

    // Check if rejected
    if (user.status === "rejected") {
      return res.status(403).json({
        success: false,
        isRejected: true,
        message: "Your admin request was rejected. You can register as a regular user instead.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account has been deactivated" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET ME ────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
// PUT /api/auth/me  (protected)
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE PASSWORD ───────────────────────────────────────────────────────────
// PUT /api/auth/password  (protected)
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: GET ALL USERS ──────────────────────────────────────────────────────
// GET /api/auth/users  (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users, total: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: GET PENDING ADMIN REQUESTS ─────────────────────────────────────────
// GET /api/auth/users/pending  (admin only)
const getPendingRequests = async (req, res) => {
  try {
    const pending = await User.find({ role: "admin", status: "pending" }).sort({ createdAt: -1 });
    res.json({ success: true, data: pending, total: pending.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: APPROVE ADMIN REQUEST ──────────────────────────────────────────────
// PUT /api/auth/users/:id/approve  (admin only)
const approveAdminRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.status !== "pending") {
      return res.status(400).json({ success: false, message: "This request is not pending" });
    }

    user.status = "active";
    user.role = "admin";
    await user.save();

    res.json({
      success: true,
      message: `${user.name}'s admin request approved. They can now login.`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: REJECT ADMIN REQUEST ───────────────────────────────────────────────
// PUT /api/auth/users/:id/reject  (admin only)
const rejectAdminRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.status !== "pending") {
      return res.status(400).json({ success: false, message: "This request is not pending" });
    }

    user.status = "rejected";
    await user.save();

    res.json({
      success: true,
      message: `${user.name}'s admin request rejected.`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: DELETE USER ────────────────────────────────────────────────────────
// DELETE /api/auth/users/:id  (admin only)
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
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
};