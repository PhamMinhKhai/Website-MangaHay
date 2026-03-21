const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  mangaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Manga",
    required: true,
  },
  chapterNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    trim: true,
    default: "",
  },
  pages: [
    {
      type: String,
      required: true,
    },
  ],
  releaseDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for manga and chapter number
chapterSchema.index({ mangaId: 1, chapterNumber: 1 }, { unique: true });

module.exports = mongoose.model("Chapter", chapterSchema);
