/**
 * Sample Data Seeder (Optional)
 * Run this to add sample data for testing
 * Usage: node seed-sample.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Manga = require('./models/Manga');
const config = require('./config/config');

async function seedData() {
  try {
    console.log(' Connecting to MongoDB...');
    await mongoose.connect(config.mongodbURI);
    console.log(' Connected to MongoDB\n');

    // Create admin user
    console.log(' Creating admin user...');
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (!existingAdmin) {
      const admin = new User({
        username: 'admin',
        email: 'admin@mangahay.com',
        password: 'admin123',
        isAdmin: true
      });
      await admin.save();
      console.log(' Admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('     IMPORTANT: Change this password after first login!\n');
    } else {
      console.log('✓ Admin user already exists\n');
    }

    // Create sample user
    console.log(' Creating sample user...');
    const existingUser = await User.findOne({ username: 'reader' });
    
    if (!existingUser) {
      const user = new User({
        username: 'reader',
        email: 'reader@example.com',
        password: 'reader123'
      });
      await user.save();
      console.log(' Sample user created');
      console.log('   Username: reader');
      console.log('   Password: reader123\n');
    } else {
      console.log('✓ Sample user already exists\n');
    }

    // Sample manga data
    console.log(' Creating sample manga...');
    const sampleManga = [
      {
        title: 'Sample Manga 1',
        author: 'John Doe',
        description: 'An exciting action-packed adventure story about a hero who discovers hidden powers and must save the world from an ancient evil.',
        coverImage: '/uploads/covers/placeholder.jpg',
        genres: ['Action', 'Adventure', 'Fantasy'],
        status: 'Ongoing'
      },
      {
        title: 'Sample Manga 2',
        author: 'Jane Smith',
        description: 'A romantic comedy about two high school students who accidentally switch bodies and must navigate each other\'s lives.',
        coverImage: '/uploads/covers/placeholder.jpg',
        genres: ['Romance', 'Comedy', 'Slice of Life'],
        status: 'Completed'
      }
    ];

    for (const mangaData of sampleManga) {
      const existing = await Manga.findOne({ title: mangaData.title });
      if (!existing) {
        const manga = new Manga(mangaData);
        await manga.save();
        console.log(` Created: ${mangaData.title}`);
      } else {
        console.log(`✓ Already exists: ${mangaData.title}`);
      }
    }


  } catch (error) {
    console.error(' Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run seeder
seedData();

