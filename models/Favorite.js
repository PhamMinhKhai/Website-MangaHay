const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for user and manga
favoriteSchema.index({ userId: 1, mangaId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

