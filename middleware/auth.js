import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ success: false, message: "Token is no longer valid" });
    if (!user.isActive) return res.status(401).json({ success: false, message: "Account has been deactivated" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token is invalid or expired" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ success: false, message: "Access denied: admins only" });
};

export { protect, adminOnly };