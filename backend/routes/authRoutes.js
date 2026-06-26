const express = require("express");
const router = express.Router();
const { register, login, refreshAccessToken, logout, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, username, email, password]
 *             properties:
 *               name: { type: string, example: "Ravi Kumar" }
 *               username: { type: string, example: "ravi_kumar" }
 *               email: { type: string, example: "ravi@example.com" }
 *               password: { type: string, minLength: 8, example: "securepass123" }
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 accessToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       409: { description: "Email or username already exists" }
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "ravi@example.com" }
 *               password: { type: string, example: "securepass123" }
 *     responses:
 *       200:
 *         description: Login successful — access token in body, refresh token in httpOnly cookie
 *       401: { description: "Invalid credentials" }
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using httpOnly cookie
 *     security: []
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 accessToken: { type: string }
 *       401: { description: "Invalid or expired refresh token" }
 */
router.post("/refresh", refreshAccessToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and clear refresh token cookie
 *     responses:
 *       200: { description: "Logged out successfully" }
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { description: "Not authenticated" }
 */
router.get("/me", protect, getMe);

module.exports = router;
