const express = require("express");
const router = express.Router();
const Chapter = require("../models/Chapter");
const ReadingHistory = require("../models/ReadingHistory");
const { optionalAuth, isAuthenticated } = require("../middleware/auth");
const { deleteFile } = require("../helpers/fileDelete");
const archiver = require("archiver");
const path = require("path");
const fs = require("fs");
const { sanitizeFilename } = require("../helpers/sanitizeFilename");

// GET MANGA BY :ID
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate("mangaId");
    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    if (!chapter.mangaId) {
      return res
        .status(404)
        .json({ error: "Manga not found for this chapter" });
    }

    const allChapters = await Chapter.find({ mangaId: chapter.mangaId })
      .sort({ chapterNumber: 1 })
      .select("_id chapterNumber title");

    const currentIndex = allChapters.findIndex(
      (c) => c._id.toString() === req.params.id
    );
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
    const nextChapter =
      currentIndex < allChapters.length - 1
        ? allChapters[currentIndex + 1]
        : null;

    // Build base URL: prefer PUBLIC_URL else derive from request (supports ngrok / emulator)
    const base =
      process.env.PUBLIC_URL && process.env.PUBLIC_URL.trim() !== ""
        ? process.env.PUBLIC_URL.replace(/\/$/, "")
        : `${req.get("x-forwarded-proto") || req.protocol}://${
            req.get("x-forwarded-host") || req.get("host")
          }`;

    // Convert stored page entries to full URLs
    const formattedPages = (chapter.pages || []).map((page) => {
      if (!page) return page;
      if (page.startsWith("http://") || page.startsWith("https://"))
        return page;

      if (page.startsWith("http://") || page.startsWith("https://")) {
        return page;
      }
      return `${base}/${page.replace(/^\/+/, "")}`;
    });

    const formattedChapter = {
      ...chapter.toObject(),
      pages: formattedPages,
    };

    res.json({
      chapter: formattedChapter,
      prevChapter,
      nextChapter,
      allChapters,
    });
  } catch (error) {
    console.error("Get chapter error:", error);
    res.status(500).json({ error: "Failed to get chapter" });
  }
});
// Save reading progress
router.post("/:id/progress", isAuthenticated, async (req, res) => {
  try {
    const { pageNumber } = req.body;
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    await ReadingHistory.findOneAndUpdate(
      {
        userId: req.userId,
        mangaId: chapter.mangaId,
      },
      {
        chapterId: chapter._id,
        chapterNumber: chapter.chapterNumber,
        pageNumber: pageNumber || 0,
        lastRead: new Date(),
      },
      { upsert: true, new: true }
    );
    res.json({ message: "Progress saved" });
  } catch (error) {
    console.error("Save progress error:", error);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// Download chapter as ZIP
router.get("/download/:id", isAuthenticated, async (req, res) => {
  try {
    // Fetch chapter and populate manga information
    const chapter = await Chapter.findById(req.params.id).populate("mangaId");
    
    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    if (!chapter.mangaId) {
      return res.status(404).json({ error: "Manga not found for this chapter" });
    }

    // Create sanitized filename for the ZIP
    const mangaTitle = sanitizeFilename(chapter.mangaId.title);
    const chapterNum = chapter.chapterNumber;
    const zipFilename = `${mangaTitle} - Chap ${chapterNum}.zip`;

    // Initialize archiver
    const archive = archiver("zip", {
      zlib: { level: 9 } // Maximum compression
    });

    // Set response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);

    // Pipe archive to response
    archive.pipe(res);

    // Handle archive warnings and errors
    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn("Archive warning:", err);
      } else {
        throw err;
      }
    });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create archive" });
      }
    });

    // Track if we added any files
    let filesAdded = 0;

    // Add each page image to the archive
    for (const pageURL of chapter.pages) {
      try {
        // Get filename from Cloudinary URL
        let filename = pageURL.split("/").pop().split("?")[0];
        
        // Fetch the image from Cloudinary
        const response = await fetch(pageURL);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          archive.append(buffer, { name: filename });
          filesAdded++;
        } else {
          console.warn(`Failed to fetch page from Cloudinary, skipping: ${pageURL}`);
        }
      } catch (err) {
        console.error(`Error processing page ${pageURL}:`, err);
        // Continue with next file
      }
    }

    // Check if we added any files
    if (filesAdded === 0) {
      console.warn(`No files found for chapter ${req.params.id}`);
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error("Download chapter error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to download chapter" });
    }
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ error: "Not found" });

    // delete all page images
    for (const pageURL of chapter.pages) {
      await deleteFile(pageURL);
    }

    await chapter.deleteOne();
    res.json({ message: "Chapter deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
