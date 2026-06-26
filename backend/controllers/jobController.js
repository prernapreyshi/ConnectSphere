const Job = require("../models/Job");
const { ApiError, asyncHandler } = require("../utils/apiResponse");

// GET /api/jobs — list jobs with filters + pagination
const getJobs = asyncHandler(async (req, res) => {
  const { q, type, experience, location, cursor, limit = 10 } = req.query;

  const query = { status: "open" };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };
  if (type) query.type = type;
  if (experience) query.experience = experience;
  if (location) query.location = { $regex: location, $options: "i" };
  if (q) query.$text = { $search: q };

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1)
    .populate("postedBy", "name username avatar headline");

  const hasMore = jobs.length > parseInt(limit);
  const data = hasMore ? jobs.slice(0, parseInt(limit)) : jobs;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  res.json({ success: true, jobs: data, hasMore, nextCursor });
});

// GET /api/jobs/:id
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("postedBy", "name username avatar headline")
    .populate("applicants.user", "name username avatar headline");

  if (!job) throw new ApiError(404, "Job not found");
  res.json({ success: true, job });
});

// POST /api/jobs — create job listing
const createJob = asyncHandler(async (req, res) => {
  const { title, company, location, type, experience, description, requirements, skills, salary, applicationUrl, deadline } = req.body;

  if (!title || !company || !location || !type || !description) {
    throw new ApiError(400, "Title, company, location, type and description are required");
  }

  const job = await Job.create({
    postedBy: req.user._id,
    title, company, location, type, experience,
    description, requirements, skills, salary,
    applicationUrl, deadline,
  });

  await job.populate("postedBy", "name username avatar");
  res.status(201).json({ success: true, job });
});

// PUT /api/jobs/:id — update job
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.postedBy.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorised");

  const allowed = ["title", "company", "location", "type", "experience", "description",
    "requirements", "skills", "salary", "applicationUrl", "deadline", "status"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) job[f] = req.body[f]; });

  await job.save();
  res.json({ success: true, job });
});

// DELETE /api/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorised");
  }
  await job.deleteOne();
  res.json({ success: true, message: "Job deleted" });
});

// POST /api/jobs/:id/apply — one-click apply
const applyForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "open") throw new ApiError(400, "This job is no longer accepting applications");

  const alreadyApplied = job.applicants.some((a) => a.user.toString() === req.user._id.toString());
  if (alreadyApplied) throw new ApiError(400, "You have already applied for this job");

  job.applicants.push({ user: req.user._id });
  await job.save();

  res.json({ success: true, message: "Application submitted!", applicantCount: job.applicants.length });
});

// DELETE /api/jobs/:id/apply — withdraw application
const withdrawApplication = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  job.applicants = job.applicants.filter((a) => a.user.toString() !== req.user._id.toString());
  await job.save();
  res.json({ success: true, message: "Application withdrawn" });
});

// GET /api/jobs/my/posted — jobs posted by current user
const getMyPostedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, jobs });
});

// GET /api/jobs/my/applied — jobs user has applied to
const getMyApplications = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ "applicants.user": req.user._id })
    .sort({ createdAt: -1 })
    .populate("postedBy", "name username avatar");
  res.json({ success: true, jobs });
});

module.exports = {
  getJobs, getJob, createJob, updateJob, deleteJob,
  applyForJob, withdrawApplication, getMyPostedJobs, getMyApplications,
};
