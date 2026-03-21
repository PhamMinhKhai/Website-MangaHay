// middleware/upload.js
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;
const config = require("../config/config");

// === 1. Configure Cloudinary ===
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// === 2. Multer (memory storage) ===
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"];
    if (!ok.includes(file.mimetype))
      return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
});

// === 3. Upload buffer to Cloudinary ===
async function uploadToCloudinary(buffer, folder) {
  // Convert to webp first with sharp
  const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `mangahay/${folder}`,
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(webpBuffer);
  });
}

// === 4. Delete from Cloudinary by URL ===
async function deleteFromCloudinary(url) {
  try {
    if (!url || !url.includes("cloudinary")) return false;

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/mangahay/covers/abc.webp
    const parts = url.split("/upload/");
    if (parts.length < 2) return false;

    // Remove version prefix (v123456/) and file extension
    let publicId = parts[1].replace(/^v\d+\//, "");
    publicId = publicId.replace(/\.[^.]+$/, ""); // remove extension

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
    return false;
  }
}

// === 5. Upload handlers ===
async function handleCoverUpload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = await uploadToCloudinary(req.file.buffer, "covers");
    return res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cover upload failed" });
  }
}

async function handlePagesUpload(req, res) {
  try {
    if (!req.files?.length)
      return res.status(400).json({ error: "No files uploaded" });

    const urls = [];
    for (const f of req.files) {
      const url = await uploadToCloudinary(f.buffer, "pages");
      urls.push(url);
    }
    res.json({ urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Pages upload failed" });
  }
}

async function handleSliderUpload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = await uploadToCloudinary(req.file.buffer, "sliders");
    return res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Slider upload failed" });
  }
}

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  handleCoverUpload,
  handlePagesUpload,
  handleSliderUpload,
  cloudinary,
};
