/**
 * Setup Script for MangaHay
 * This script helps set up the initial environment
 */

const fs = require('fs');
const path = require('path');

console.log(' Setting up MangaHay...\n');

// Create necessary directories
const directories = [
  'uploads',
  'uploads/covers',
  'uploads/pages',
  'uploads/sliders'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

