// routes/manga.js
const express = require("express");
const router = express.Router();
const Manga = require("../models/Manga");
const Chapter = require("../models/Chapter");
const ReadingHistory = require("../models/ReadingHistory");
const Favorite = require("../models/Favorite");
const { isAuthenticated, optionalAuth } = require("../middleware/auth");
const { deleteFile } = require("../helpers/fileDelete");

// SEARCH
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query || query.trim() === "") return res.json({ manga: [] });
    const regex = new RegExp(query, "i");
    const results = await Manga.find({
      $or: [{ title: { $regex: regex } }, { author: { $regex: regex } }],
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ manga: results });
  } catch (error) {
    console.error("Search manga error:", error);
    res.status(500).json({ error: "Failed to get manga" });
  }
});

// LIST (with filters)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      genre,
      status,
      search,
      author,
      sort = "updatedAt",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;
    const query = { isPublished: true };
    if (genre) query.genres = genre;
    if (status) query.status = status;
    if (author) query.author = { $regex: author, $options: "i" };
    else if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const manga = await Manga.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);
    const total = await Manga.countDocuments(query);
    res.json({
      manga,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    console.error("Get manga error:", error);
    res.status(500).json({ error: "Failed to get manga" });
  }
});

// SINGLE MANGA
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ error: "Manga not found" });

    const isAdmin = req.session && req.session.isAdmin;
    
    // If manga is hidden and user is not admin, return 404
    if (!manga.isPublished && !isAdmin) {
      return res.status(404).json({ error: "Manga not found" });
    }

    const viewedManga = req.session.viewedManga || [];
    const mangaIdStr = req.params.id;

    if (!isAdmin && !viewedManga.includes(mangaIdStr)) {
      manga.views += 1;
      await manga.save();
      if (!req.session.viewedManga) req.session.viewedManga = [];
      req.session.viewedManga.push(mangaIdStr);
    }

    const chapters = await Chapter.find({ mangaId: req.params.id }).sort({
      chapterNumber: -1,
    });

    let isFavorited = false;
    let readingHistory = null;
    if (req.isAuthenticated && req.userId) {
      const favorite = await Favorite.findOne({
        userId: req.userId,
        mangaId: req.params.id,
      });
      isFavorited = !!favorite;
      readingHistory = await ReadingHistory.findOne({
        userId: req.userId,
        mangaId: req.params.id,
      });
    }

    res.json({ manga, chapters, isFavorited, readingHistory });
  } catch (error) {
    console.error("Get manga error:", error);
    res.status(500).json({ error: "Failed to get manga" });
  }
});

// FEATURED & LATEST
router.get("/featured/list", async (req, res) => {
  try {
    const featured = await Manga.find({ isPublished: true })
      .sort({ views: -1, updatedAt: -1 })
      .limit(10);
    res.json(featured);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get featured" });
  }
});
router.get("/latest/updates", async (req, res) => {
  try {
    const latestChapters = await Chapter.find()
      .sort({ releaseDate: -1 })
      .limit(20)
      .populate("mangaId");
    const valid = latestChapters.filter((c) => c.mangaId !== null && c.mangaId.isPublished);
    res.json(valid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get latest" });
  }
});
router.get("/genre/:genre", async (req, res) => {
  try {
    const mangas = await Manga.find({ genres: req.params.genre, isPublished: true });
    res.json({ manga: mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Cannot get by genre" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ error: "Not found" });

    // delete cover file
    if (manga.cover) {
      await deleteFile(manga.cover);
    }

    await manga.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
