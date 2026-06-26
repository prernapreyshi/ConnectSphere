const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendTokens, generateAccessToken, verifyRefreshToken, generateRefreshToken } = require("../utils/jwt");
const { ApiError, asyncHandler } = require("../utils/apiResponse");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  // Check existing user
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Username";
    throw new ApiError(409, `${field} already in use`);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  sendTokens(res, user, 201);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Get user with password (select: false on schema)
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshToken");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  sendTokens(res, user);
});

// POST /api/auth/refresh
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "No refresh token");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const newAccessToken = generateAccessToken(user._id);

  res.status(200).json({ success: true, accessToken: newAccessToken });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

module.exports = { register, login, refreshAccessToken, logout, getMe };
