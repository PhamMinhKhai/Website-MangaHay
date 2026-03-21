const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ReadingHistory = require("../models/ReadingHistory");
const config = require("../config/config");

// Middleware để xác thực JWT (cho mobile)
function authenticateMobileToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
}

// Lấy lịch sử đọc truyện (Mobile)
router.get("/history", authenticateMobileToken, async (req, res) => {
  try {
    const history = await ReadingHistory.find({ userId: req.userId })
      .populate("mangaId", "title coverUrl")
      .populate("chapterId", "title chapterNumber")
      .sort({ lastRead: -1 })
      .limit(50);

    const validHistory = history.filter(
      (item) => item.mangaId && item.chapterId
    );

    res.json({
      success: true,
      message: "Fetched reading history successfully",
      data: validHistory,
    });
  } catch (error) {
    console.error("Mobile get history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reading history",
    });
  }
});

module.exports = router;
