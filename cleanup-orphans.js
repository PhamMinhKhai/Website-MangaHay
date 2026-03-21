// Script to clean up orphaned chapters
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config/config');

const Chapter = require('./models/Chapter');
const Manga = require('./models/Manga');

async function cleanupOrphanedChapters() {
  try {
    await mongoose.connect(config.mongodbURI);
    console.log('Connected to MongoDB');

    const allChapters = await Chapter.find();
    console.log(`Total chapters before cleanup: ${allChapters.length}`);

    const allManga = await Manga.find();
    const mangaIds = new Set(allManga.map(m => m._id.toString()));

    const orphanedChapters = [];
    for (const chapter of allChapters) {
      if (!mangaIds.has(chapter.mangaId.toString())) {
        orphanedChapters.push(chapter._id);
      }
    }

    if (orphanedChapters.length === 0) {
      console.log('No orphaned chapters found!');
    } else {
      console.log(`Found ${orphanedChapters.length} orphaned chapters`);
      console.log('Deleting orphaned chapters...');
      
      const result = await Chapter.deleteMany({ _id: { $in: orphanedChapters } });
      console.log(`Deleted ${result.deletedCount} orphaned chapters`);
      
      const remainingChapters = await Chapter.countDocuments();
      console.log(`Total chapters after cleanup: ${remainingChapters}`);
    }

    await mongoose.disconnect();
    console.log('\nCleanup complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedChapters();
