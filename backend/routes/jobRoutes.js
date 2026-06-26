const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getJobs, getJob, createJob, updateJob, deleteJob,
  applyForJob, withdrawApplication, getMyPostedJobs, getMyApplications,
} = require("../controllers/jobController");

router.get("/my/posted", protect, getMyPostedJobs);
router.get("/my/applied", protect, getMyApplications);

router.get("/", protect, getJobs);
router.post("/", protect, createJob);
router.get("/:id", protect, getJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);
router.post("/:id/apply", protect, applyForJob);
router.delete("/:id/apply", protect, withdrawApplication);

module.exports = router;

/**
 * @swagger
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List open jobs with filters
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [full-time, part-time, contract, internship, remote] }
 *       - in: query
 *         name: experience
 *         schema: { type: string, enum: [entry, mid, senior, lead, any] }
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Full-text search
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 jobs: { type: array, items: { $ref: '#/components/schemas/Job' } }
 *                 hasMore: { type: boolean }
 *                 nextCursor: { type: string }
 *   post:
 *     tags: [Jobs]
 *     summary: Post a new job listing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, company, location, type, description]
 *             properties:
 *               title: { type: string }
 *               company: { type: string }
 *               location: { type: string }
 *               type: { type: string, enum: [full-time, part-time, contract, internship, remote] }
 *               experience: { type: string, enum: [entry, mid, senior, lead, any] }
 *               description: { type: string }
 *               requirements: { type: array, items: { type: string } }
 *               skills: { type: array, items: { type: string } }
 *               salary:
 *                 type: object
 *                 properties:
 *                   min: { type: number }
 *                   max: { type: number }
 *                   currency: { type: string, default: INR }
 *               deadline: { type: string, format: date }
 *     responses:
 *       201: { description: "Job created" }
 *
 * /jobs/{id}/apply:
 *   post:
 *     tags: [Jobs]
 *     summary: Apply for a job
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Application submitted" }
 *       400: { description: "Already applied or job closed" }
 */
