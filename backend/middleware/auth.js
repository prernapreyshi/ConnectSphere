const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Not authorised, no token");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "User belonging to this token no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired"));
    }
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }
  next();
};

module.exports = { protect, adminOnly };
