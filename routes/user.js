const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Favorite = require("../models/Favorite");
const ReadingHistory = require("../models/ReadingHistory");
const { isAuthenticated } = require("../middleware/auth");

/* ========================================================
  1️ Các route cho web (dùng cookie session / JWT)
======================================================== */

// Get user profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Change password
router.put("/change-password", isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ error: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Get favorites
router.get("/favorites", isAuthenticated, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.userId })
      .populate("mangaId")
      .sort({ addedAt: -1 });

    const validFavorites = favorites.filter((fav) => fav.mangaId !== null);
    res.json(validFavorites);
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ error: "Failed to get favorites" });
  }
});

// Add to favorites
router.post("/favorites/:mangaId", isAuthenticated, async (req, res) => {
  try {
    const existing = await Favorite.findOne({
      userId: req.userId,
      mangaId: req.params.mangaId,
    });

    if (existing) {
      return res.status(400).json({ error: "Already in favorites" });
    }

    const favorite = new Favorite({
      userId: req.userId,
      mangaId: req.params.mangaId,
    });

    await favorite.save();
    res.json({ message: "Added to favorites" });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// Remove from favorites
router.delete("/favorites/:mangaId", isAuthenticated, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({
      userId: req.userId,
      mangaId: req.params.mangaId,
    });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// Get reading history (WEB)
router.get("/history", isAuthenticated, async (req, res) => {
  try {
    const history = await ReadingHistory.find({ userId: req.userId })
      .populate("mangaId")
      .populate("chapterId")
      .sort({ lastRead: -1 })
      .limit(50);

    const validHistory = history.filter(
      (item) => item.mangaId && item.chapterId
    );
    res.json(validHistory);
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Failed to get history" });
  }
});

// Delete account
router.delete("/account", isAuthenticated, async (req, res) => {
  try {
    const userId = req.userId;

    await User.findByIdAndDelete(userId);
    await Favorite.deleteMany({ userId });
    await ReadingHistory.deleteMany({ userId });

    if (req.session) req.session.destroy();

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

/* ========================================================
  2️ Các route dành riêng cho MOBILE APP (không cần auth)
======================================================== */

//  Lưu lịch sử đọc (cho app Flutter)
router.post("/history", async (req, res) => {
  try {
    const {
      userId,
      mangaId,
      chapterId,
      mangaTitle,
      chapterTitle,
      coverImage,
      pageNumber = 1,
      chapterNumber = 1,
    } = req.body;

    if (!userId || !mangaId || !chapterId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Try to get chapter to know total pages (for clamping)
    let maxPages = null;
    try {
      const Chapter = require("../models/Chapter");
      const ch = await Chapter.findById(chapterId).select("pages");
      if (ch && Array.isArray(ch.pages)) {
        maxPages = ch.pages.length;
      }
    } catch (err) {
      // ignore if Chapter lookup fails; we still proceed
      console.warn("Could not fetch chapter for clamp:", err.message);
    }

    // Ensure pageNumber is numeric
    let pageNum = parseInt(pageNumber, 10) || 1;
    if (maxPages !== null) {
      if (pageNum < 1) pageNum = 1;
      if (pageNum > maxPages) pageNum = maxPages;
    } else {
      if (pageNum < 1) pageNum = 1;
    }

    const existing = await ReadingHistory.findOne({ userId, mangaId });

    if (existing) {
      // Update fields and set lastRead to now
      existing.chapterId = chapterId;
      existing.chapterNumber = chapterNumber || existing.chapterNumber || 1;
      existing.pageNumber = pageNum;
      existing.mangaTitle = mangaTitle || existing.mangaTitle;
      existing.chapterTitle = chapterTitle || existing.chapterTitle;
      existing.coverImage = coverImage || existing.coverImage;
      existing.lastRead = new Date();
      await existing.save();
    } else {
      const newHistory = new ReadingHistory({
        userId,
        mangaId,
        chapterId,
        chapterNumber,
        pageNumber: pageNum,
        mangaTitle,
        chapterTitle,
        coverImage,
        lastRead: new Date(),
      });
      await newHistory.save();
    }

    res.json({ message: "History saved successfully", pageNumber: pageNum });
  } catch (error) {
    console.error(" Save history error:", error);
    res.status(500).json({ error: "Failed to save history" });
  }
});

//  Lấy lịch sử đọc (cho app Flutter)
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await ReadingHistory.find({ userId })
      .populate("mangaId")
      .populate("chapterId")
      .sort({ lastRead: -1 })
      .limit(50);

    const formatted = history.map((item) => ({
      _id: item._id,
      userId: item.userId,
      mangaId: item.mangaId,
      chapterId: item.chapterId,
      mangaTitle: item.mangaId?.title || item.mangaTitle,
      chapterTitle: item.chapterId?.title || item.chapterTitle,
      coverImage: item.mangaId?.coverImage || item.coverImage,
      lastRead: item.lastRead,
      chapterNumber: item.chapterNumber || item.chapterId?.chapterNumber || 1,
      pageNumber: item.pageNumber != null ? item.pageNumber : 1,
    }));

    res.json({ history: formatted });
  } catch (error) {
    console.error(" Get history error:", error);
    res.status(500).json({ error: "Failed to get history" });
  }
});
//  Lấy danh sách yêu thích (cho app Flutter)
router.get("/favorites/:userId", async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.params.userId })
      .populate("mangaId")
      .sort({ addedAt: -1 });

    const formatted = favorites
      .filter((f) => f.mangaId)
      .map((f) => ({
        _id: f._id,
        userId: f.userId,
        mangaId: f.mangaId._id,
        title: f.mangaId.title,
        coverImage: f.mangaId.coverImage,
        author: f.mangaId.author,
      }));

    res.json({ favorites: formatted });
  } catch (err) {
    console.error(" Get favorites (app) error:", err);
    res.status(500).json({ error: "Failed to get favorites" });
  }
});

//  Thêm vào yêu thích (cho app Flutter)
router.post("/favorites", async (req, res) => {
  try {
    const { userId, mangaId } = req.body;
    if (!userId || !mangaId)
      return res.status(400).json({ error: "Missing userId or mangaId" });

    const existing = await Favorite.findOne({ userId, mangaId });
    if (existing) return res.json({ message: "Already in favorites" });

    const fav = new Favorite({ userId, mangaId });
    await fav.save();

    res.json({ message: "Added to favorites" });
  } catch (err) {
    console.error(" Add favorite (app) error:", err);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

//  Xóa khỏi yêu thích (cho app Flutter)
router.delete("/favorites", async (req, res) => {
  try {
    const { userId, mangaId } = req.body;
    if (!userId || !mangaId)
      return res.status(400).json({ error: "Missing userId or mangaId" });

    await Favorite.findOneAndDelete({ userId, mangaId });
    res.json({ message: "Removed from favorites" });
  } catch (err) {
    console.error(" Remove favorite (app) error:", err);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

module.exports = router;
