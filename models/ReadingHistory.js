const mongoose = require('mongoose');

const readingHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mangaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manga',
    required: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  chapterNumber: {
    type: Number,
    required: true
  },
  pageNumber: {
    type: Number,
    default: 0
  },
  lastRead: {
    type: Date,
    default: Date.now
  }
});

// Compound index for user and manga
readingHistorySchema.index({ userId: 1, mangaId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingHistory', readingHistorySchema);

