const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ConnectSphere API",
      version: "1.0.0",
      description: "REST API for ConnectSphere — a professional networking platform",
      contact: { name: "ConnectSphere Team", email: "api@connectsphere.dev" },
    },
    servers: [
      { url: "http://localhost:5000/api", description: "Development" },
      { url: "https://connectsphere-api.onrender.com/api", description: "Production" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token — obtained from /auth/login",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            avatar: { type: "string" },
            headline: { type: "string" },
            bio: { type: "string" },
            location: { type: "string" },
            website: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            connections: { type: "array", items: { type: "string" } },
            followers: { type: "array", items: { type: "string" } },
            following: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string" },
            author: { $ref: "#/components/schemas/User" },
            content: { type: "string" },
            images: { type: "array", items: { type: "object", properties: { url: { type: "string" }, publicId: { type: "string" } } } },
            likes: { type: "array", items: { type: "string" } },
            likeCount: { type: "integer" },
            commentCount: { type: "integer" },
            isRepost: { type: "boolean" },
            hashtags: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Job: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            company: { type: "string" },
            location: { type: "string" },
            type: { type: "string", enum: ["full-time", "part-time", "contract", "internship", "remote"] },
            experience: { type: "string", enum: ["entry", "mid", "senior", "lead", "any"] },
            description: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            applicantCount: { type: "integer" },
            status: { type: "string", enum: ["open", "closed", "draft"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Registration, login, token refresh" },
      { name: "Users", description: "Profiles, connections, follow" },
      { name: "Posts", description: "Feed, create, like, comment, repost" },
      { name: "Jobs", description: "Job listings and applications" },
      { name: "Messages", description: "Direct messaging" },
      { name: "Notifications", description: "Activity notifications" },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
