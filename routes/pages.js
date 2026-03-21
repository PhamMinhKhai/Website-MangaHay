const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  isAdmin,
  optionalAuth,
} = require("../middleware/auth");

// Home page
router.get("/", optionalAuth, (req, res) => {
  res.render("index", { title: "Home - MangaHay" });
});

// Login page
router.get("/login", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("login", { title: "Login - MangaHay" });
});

// Register page
router.get("/register", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("register", { title: "Register - MangaHay" });
});

// Browse/Library page
router.get("/library", optionalAuth, (req, res) => {
  res.render("library", { title: "Library - MangaHay" });
});

// Manga details page
router.get("/manga/:id", optionalAuth, (req, res) => {
  res.render("manga-details", {
    title: "Manga Details - MangaHay",
    mangaId: req.params.id,
  });
});

// Reader page
router.get("/read/:chapterId", optionalAuth, (req, res) => {
  res.render("reader", {
    title: "Reader - MangaHay",
    chapterId: req.params.chapterId,
  });
});

// User profile page
router.get("/profile", isAuthenticated, (req, res) => {
  res.render("profile", { title: "Profile - MangaHay" });
});

// Admin dashboard
router.get("/admin", isAdmin, (req, res) => {
  res.render("admin/dashboard", { title: "Admin Dashboard - MangaHay" });
});

// Admin manga management
router.get("/admin/manga", isAdmin, (req, res) => {
  res.render("admin/manga", { title: "Manage Manga - MangaHay" });
});

// Admin add manga
router.get("/admin/manga/add", isAdmin, (req, res) => {
  res.render("admin/add-manga", { title: "Add Manga - MangaHay" });
});

// Admin edit manga
router.get("/admin/manga/edit/:id", isAdmin, (req, res) => {
  res.render("admin/edit-manga", {
    title: "Edit Manga - MangaHay",
    mangaId: req.params.id,
  });
});

// Admin chapter management
router.get("/admin/manga/:id/chapters", isAdmin, (req, res) => {
  res.render("admin/chapters", {
    title: "Manage Chapters - MangaHay",
    mangaId: req.params.id,
  });
});

// Admin user management
router.get("/admin/users", isAdmin, (req, res) => {
  res.render("admin/users", { title: "Manage Users - MangaHay" });
});

// Admin slider management
router.get("/admin/sliders", isAdmin, (req, res) => {
  res.render("admin/sliders", { title: "Manage Sliders - MangaHay" });
});

// Admin comment management
router.get("/admin/comments", isAdmin, (req, res) => {
  res.render("admin/comments", { title: "Quản Lý Bình Luận - MangaHay" });
});

module.exports = router;
