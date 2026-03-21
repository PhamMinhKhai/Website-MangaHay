// routes/admin.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const Manga = require("../models/Manga");
const Chapter = require("../models/Chapter");
const User = require("../models/User");
const Slider = require("../models/Slider");
const Favorite = require("../models/Favorite");
const ReadingHistory = require("../models/ReadingHistory");
const { isAdmin } = require("../middleware/auth");
const { upload } = require("../middleware/upload");



/* ---------------------------------------------------------
   HELPER: Safe delete file from /public/uploads
--------------------------------------------------------- */
const { deleteFile } = require("../helpers/fileDelete");



/* ---------------------------------------------------------
   1. ADMIN STATISTICS
--------------------------------------------------------- */
router.get("/stats", isAdmin, async (req, res) => {
  try {
    const totalManga = await Manga.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const totalUsers = await User.countDocuments();

    const ongoingManga = await Manga.countDocuments({ status: "Ongoing" });
    const completedManga = await Manga.countDocuments({ status: "Completed" });

    res.json({
      totalManga,
      totalChapters,
      totalUsers,
      ongoingManga,
      completedManga,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/* ---------------------------------------------------------
   1B. GET ALL MANGA (FOR ADMIN PANEL)
--------------------------------------------------------- */
router.get("/manga", isAdmin, async (req, res) => {
  try {
    const { limit = 1000, sort = "updatedAt", order = "desc" } = req.query;
    
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;
    
    // Admin sees ALL manga, including hidden ones
    const manga = await Manga.find()
      .sort(sortOptions)
      .limit(parseInt(limit));
    
    res.json({ manga });
  } catch (e) {
    console.error("Get admin manga error:", e);
    res.status(500).json({ error: "Failed to get manga" });
  }
});

/* ---------------------------------------------------------
   2. CREATE MANGA
--------------------------------------------------------- */
router.post("/manga", isAdmin, async (req, res) => {
  try {
    const { title, author, description, genres, status, coverImage } = req.body;

    if (!coverImage)
      return res.status(400).json({ error: "coverImage URL required" });

    const manga = new Manga({
      title,
      author,
      description,
      coverImage,
      genres: Array.isArray(genres) ? genres : [genres],
      status: status || "Ongoing",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await manga.save();
    res.status(201).json({ success: true, manga });
  } catch (e) {
    res.status(500).json({ error: "Failed to create manga" });
  }
});

/* ---------------------------------------------------------
   3. UPDATE MANGA (auto delete old cover)
--------------------------------------------------------- */
router.put("/manga/:id", isAdmin, async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ error: "Not found" });

    const oldCover = manga.coverImage;

    const { title, author, description, genres, status, coverImage } = req.body;

    if (title) manga.title = title;
    if (author) manga.author = author;
    if (description) manga.description = description;
    if (genres) manga.genres = Array.isArray(genres) ? genres : [genres];
    if (status) manga.status = status;
    if (coverImage) manga.coverImage = coverImage;

    manga.updatedAt = Date.now();

    await manga.save();

    if (coverImage && coverImage !== oldCover) {
      await deleteFile(oldCover);
    }

    res.json({ success: true, manga });
  } catch (e) {
    res.status(500).json({ error: "Failed to update manga" });
  }
});

/* ---------------------------------------------------------
   4. DELETE MANGA (delete chapters & all local image files)
--------------------------------------------------------- */
router.delete("/manga/:id", isAdmin, async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ error: "Manga not found" });

    const delList = [];

    if (manga.coverImage) delList.push(manga.coverImage);

    const chapters = await Chapter.find({ mangaId: manga._id });
    chapters.forEach((c) => {
      if (Array.isArray(c.pages)) {
        c.pages.forEach((p) => {
          if (p) delList.push(p);
        });
      }
    });

    let deletedCount = 0;
    for (const f of delList) {
      if (await deleteFile(f)) deletedCount++;
    }

    await Chapter.deleteMany({ mangaId: manga._id });
    await Favorite.deleteMany({ mangaId: manga._id });
    await ReadingHistory.deleteMany({ mangaId: manga._id });
    await manga.deleteOne();

    res.json({ message: `Manga deleted (${deletedCount} files removed)` });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete manga" });
  }
});

/* ---------------------------------------------------------
   5. TOGGLE MANGA STATUS (HIDE/SHOW)
--------------------------------------------------------- */
router.put("/manga/toggle-status/:id", isAdmin, async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ error: "Manga not found" });

    // Toggle the isPublished status
    manga.isPublished = !manga.isPublished;
    await manga.save();

    res.json({ 
      message: `Manga ${manga.isPublished ? 'shown' : 'hidden'} successfully`,
      manga 
    });
  } catch (e) {
    console.error("Toggle status error:", e);
    res.status(500).json({ error: "Failed to toggle manga status" });
  }
});

/* ---------------------------------------------------------
   6. ADD CHAPTER
--------------------------------------------------------- */
router.post("/manga/:mangaId/chapters", isAdmin, async (req, res) => {
  try {
    const { chapterNumber, title, pages } = req.body;

    if (!Array.isArray(pages) || pages.length === 0)
      return res.status(400).json({ error: "pages[] required" });

    const chapter = new Chapter({
      mangaId: req.params.mangaId,
      chapterNumber: parseFloat(chapterNumber),
      title: title || "",
      pages,
    });

    await chapter.save();
    await Manga.findByIdAndUpdate(req.params.mangaId, {
      updatedAt: Date.now(),
    });

    res.json({ success: true, chapter });
  } catch (e) {
    res.status(500).json({ error: "Failed to add chapter" });
  }
});

/* ---------------------------------------------------------
   6. DELETE CHAPTER
--------------------------------------------------------- */
router.delete("/chapters/:id", isAdmin, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ error: "Not found" });

    let deleted = 0;
    for (const p of chapter.pages) {
      if (p && await deleteFile(p)) deleted++;
    }

    await ReadingHistory.deleteMany({ chapterId: chapter._id });
    await chapter.deleteOne();

    res.json({ message: `Deleted chapter (${deleted} files removed)` });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete chapter" });
  }
});

/* ---------------------------------------------------------
   7. USER MANAGEMENT
--------------------------------------------------------- */
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Failed to get users" });
  }
});

router.put("/users/:id/role", isAdmin, async (req, res) => {
  try {
    const { isAdmin: setAdmin } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: setAdmin },
      { new: true }
    ).select("-password");

    res.json({ message: "Role updated", user });
  } catch (e) {
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/* ---------------------------------------------------------
   8. SLIDER CRUD
--------------------------------------------------------- */
router.get("/sliders", isAdmin, async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ order: 1 });
    res.json(sliders);
  } catch (e) {
    res.status(500).json({ error: "Failed to load sliders" });
  }
});

router.post("/sliders", isAdmin, upload.single("image"), async (req, res) => {
  console.log("Incoming slider payload:", req.body, req.file);

  try {
    if (!req.file) return res.status(400).json({ error: "image required" });

    // Cloudinary upload is handled by multer in middleware/upload.js now,
    // wait, slider upload logic in admin.js vs middleware/upload.js? Let's check this block!
    const { uploadToCloudinary } = require("../middleware/upload");
    const filename = `slider-${Date.now()}.webp`;
    const url = await uploadToCloudinary(req.file.buffer, "sliders");

    const slider = new Slider({
      title: req.body.title,
      description: req.body.description,
      image: url,
      linkUrl: req.body.linkUrl,
      linkText: req.body.linkText || "Read Now",
      order: parseInt(req.body.order) || 0,
      isActive: true,
    });

    await slider.save();
    res.json({ success: true, slider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create slider" });
  }
});

router.put("/sliders/:id", isAdmin, async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: "Not found" });

    const old = slider.image;

    const { title, description, image, linkUrl, linkText, order } = req.body;

    if (title) slider.title = title;
    if (description !== undefined) slider.description = description;
    if (image) slider.image = image;
    if (linkUrl !== undefined) slider.linkUrl = linkUrl;
    if (linkText) slider.linkText = linkText;
    if (order !== undefined) slider.order = order;

    await slider.save();

    if (image && image !== old) {
      await deleteFile(old);
    }

    res.json({ success: true, slider });
  } catch (e) {
    res.status(500).json({ error: "Failed to update slider" });
  }
});

router.delete("/sliders/:id", isAdmin, async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: "Not found" });

    await deleteFile(slider.image);

    await slider.deleteOne();

    res.json({ message: "Slider deleted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete slider" });
  }
});

/* --------------------------------------------------------- */
module.exports = router;
