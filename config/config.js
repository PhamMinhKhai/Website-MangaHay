module.exports = {
  port: process.env.PORT || 3000,

  mongodbURI:
    process.env.MONGODB_URI ||
    "mongodb+srv://khai:khai12345@cluster0.froxx5x.mongodb.net/mangahay?retryWrites=true&w=majority&appName=Cluster0",

  sessionSecret: process.env.SESSION_SECRET || "change-this",
  nodeEnv: process.env.NODE_ENV || "development",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "jwt-secret",
  jwtExpiresIn: "24h",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret",
  jwtRefreshExpiresIn: "7d",

  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["*"],

  // Predefined genres
genres: [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Romance",
    "Fantasy",
    "Horror",
    "Mystery",
    "Psychological",
    "Sci-Fi",
    "Slice of Life",
    "Supernatural",
    "Sports",
    "Mecha",
  ],

  // Upload limits
  maxCoverSize: 5 * 1024 * 1024,
  maxPageSize: 10 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
