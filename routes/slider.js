const express = require("express");
const router = express.Router();
const Slider = require("../models/Slider");
const { deleteFile } = require("../helpers/fileDelete");

// Get active sliders for public display
router.get("/", async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true })
      .sort({ order: 1 })
      .limit(10);
    res.json(sliders);
  } catch (error) {
    console.error("Get sliders error:", error);
    res.status(500).json({ error: "Failed to get sliders" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: "Not found" });

    await deleteFile(slider.image);

    await slider.deleteOne();
    res.json({ message: "Slider deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
