// server.js
require("dotenv").config();
const express = require("express");
const compression = require("compression");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");
const fs = require("fs/promises");
const connectDB = require("./config/database");
const config = require("./config/config");
const {
  upload,
  handleCoverUpload,
  handlePagesUpload,
  handleSliderUpload,
} = require("./middleware/upload");

// Init
const app = express();
connectDB();

// === Proxy (IMPORTANT for CDN performance behind nginx / cloudflare) ===
app.set("trust proxy", true);

// === CORS (optimized) ===
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      config.allowedOrigins.includes("*") ||
      config.allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};
app.use(cors(corsOptions));

// === Body parsing ===
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));



app.use(
  compression({
    level: 6,
    threshold: 1024, // chỉ nén file >= 1KB
  })
);
//STATIC
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "7d", // cache 7 ngày
  })
);

// === Session ===
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.mongodbURI,
      touchAfter: 24 * 3600,
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
    },
  })
);

// === View engine ===
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Expose session user to templates
app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? {
        id: req.session.userId,
        username: req.session.username,
        isAdmin: req.session.isAdmin,
      }
    : null;
  next();
});

app.post("/api/uploads/covers", upload.single("cover"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { handleCoverUpload } = require("./middleware/upload");

    // handleCoverUpload already returns JSON with url
    await handleCoverUpload(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cover upload failed" });
  }
});

app.post("/api/uploads/pages", upload.array("pages", 200), async (req, res) => {
  try {
    const { handlePagesUpload } = require("./middleware/upload");
    await handlePagesUpload(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Pages upload failed" });
  }
});

app.post("/api/uploads/sliders", upload.single("slider"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { handleSliderUpload } = require("./middleware/upload");
    await handleSliderUpload(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Slider upload failed" });
  }
});
// === Secure delete-files (ASYNC for performance) ===
const { isAdmin } = require("./middleware/auth");

app.post("/api/delete-files", isAdmin, async (req, res) => {
  const { filePaths } = req.body;
  if (!Array.isArray(filePaths) || filePaths.length === 0)
    return res.status(400).json({ error: "Invalid filePaths array" });

  const { deleteFile } = require("./helpers/fileDelete");
  const results = { deleted: [], errors: [] };

  for (const fp of filePaths) {
    try {
      if (await deleteFile(fp)) {
        results.deleted.push(fp);
      } else {
        results.errors.push({ file: fp, error: "Failed to delete" });
      }
    } catch (e) {
      results.errors.push({ file: fp, error: e.message });
    }
  }

  res.json(results);
});

// === Main routes ===
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mobile/auth", require("./routes/mobile-auth"));
app.use("/api/mobile/user", require("./routes/mobile-user"));
app.use("/api/manga", require("./routes/manga"));
app.use("/api/chapters", require("./routes/chapters"));
app.use("/api/user", require("./routes/user"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/sliders", require("./routes/slider"));
app.use("/api/genres", require("./routes/genreRoutes"));
app.use("/api/comments", require("./routes/comments"));
app.use("/", require("./routes/pages"));

// === Error handlers ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("json")))
    return res.status(500).json({ error: "Something went wrong!" });

  res.status(500).render("500", { title: "Error" });
});

app.use((req, res) => res.status(404).render("404", { title: "Not found" }));

// === Start ===
const PORT = config.port || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
