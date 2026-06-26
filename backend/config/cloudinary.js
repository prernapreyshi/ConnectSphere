const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "connectsphere/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  },
});

const postImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "connectsphere/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPostImage = multer({ storage: postImageStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadAvatar, uploadPostImage };
