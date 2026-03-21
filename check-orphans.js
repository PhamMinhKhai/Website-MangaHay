// Script to check for orphaned chapters
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config/config');

const Chapter = require('./models/Chapter');
const Manga = require('./models/Manga');

async function checkOrphanedChapters() {
  try {
    await mongoose.connect(config.mongodbURI);
    console.log('Connected to MongoDB');

    const allChapters = await Chapter.find();
    console.log(`Total chapters in DB: ${allChapters.length}`);

    const allManga = await Manga.find();
    console.log(`Total manga in DB: ${allManga.length}`);

    const mangaIds = new Set(allManga.map(m => m._id.toString()));

    const orphanedChapters = [];
    for (const chapter of allChapters) {
      if (!mangaIds.has(chapter.mangaId.toString())) {
        orphanedChapters.push({
          _id: chapter._id,
          mangaId: chapter.mangaId,
          chapterNumber: chapter.chapterNumber
        });
      }
    }

    console.log(`\nOrphaned chapters (chapters with no manga): ${orphanedChapters.length}`);
    if (orphanedChapters.length > 0) {
      console.log('Orphaned chapters:', JSON.stringify(orphanedChapters, null, 2));
    }

    console.log('\nChapters by manga:');
    for (const manga of allManga) {
      const chapterCount = allChapters.filter(c => c.mangaId.toString() === manga._id.toString()).length;
      console.log(`- ${manga.title}: ${chapterCount} chapters (isPublished: ${manga.isPublished})`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrphanedChapters();
