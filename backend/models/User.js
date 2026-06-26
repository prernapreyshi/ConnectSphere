const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-z0-9_]+$/, "Username can only contain letters, numbers and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never return password in queries by default
    },
    avatar: {
      type: String,
      default: "",
    },
    headline: {
      type: String,
      default: "",
      maxlength: [220, "Headline cannot exceed 220 characters"],
    },
    bio: {
      type: String,
      default: "",
      maxlength: [2600, "Bio cannot exceed 2600 characters"],
    },
    location: {
      type: String,
      default: "",
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    website: {
      type: String,
      default: "",
    },
    skills: [{ type: String, trim: true }],
    experience: [
      {
        title: { type: String, required: true },
        company: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String, default: "" },
      },
    ],
    education: [
      {
        school: { type: String, required: true },
        degree: { type: String, required: true },
        field: { type: String, default: "" },
        startYear: { type: Number },
        endYear: { type: Number },
      },
    ],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connectionRequests: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    refreshToken: {
      type: String,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: connection count
userSchema.virtual("connectionCount").get(function () {
  return this.connections?.length || 0;
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ name: "text", headline: "text", skills: "text" });

const User = mongoose.model("User", userSchema);
module.exports = User;
