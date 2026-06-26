const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: [true, "Job title is required"], trim: true, maxlength: 100 },
    company: { type: String, required: [true, "Company is required"], trim: true, maxlength: 100 },
    location: { type: String, required: [true, "Location is required"], trim: true },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
      required: true,
    },
    experience: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "any"],
      default: "any",
    },
    description: { type: String, required: [true, "Description is required"], maxlength: 5000 },
    requirements: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: "INR" },
      period: { type: String, enum: ["month", "year", "hour"], default: "year" },
    },
    applicationUrl: { type: String, trim: true },
    applicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        appliedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["applied", "viewed", "shortlisted", "rejected"], default: "applied" },
      },
    ],
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    deadline: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

jobSchema.virtual("applicantCount").get(function () { return this.applicants?.length || 0; });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ title: "text", company: "text", description: "text" });

module.exports = mongoose.model("Job", jobSchema);
