const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Manga = require('../models/Manga');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET /api/comments/admin/recent - Get 50 most recent comments (Admin Only)
// IMPORTANT: This route must come BEFORE /:mangaId to avoid route conflicts
router.get('/admin/recent', isAdmin, async (req, res) => {
  try {
    // Fetch 50 most recent comments with user and manga data
    const comments = await Comment.find()
      .populate('user', 'username email')
      .populate('manga', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching recent comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent comments'
    });
  }
});

// POST /api/comments/:mangaId - Create a comment (Auth required)
router.post('/:mangaId', isAuthenticated, async (req, res) => {
  try {
    const { mangaId } = req.params;
    const { content } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    // Verify manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        error: 'Manga not found'
      });
    }

    // Create comment
    const comment = new Comment({
      user: req.userId,
      manga: mangaId,
      content: content.trim()
    });

    await comment.save();

    // Populate user data before returning
    await comment.populate('user', 'username email');

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// GET /api/comments/:mangaId - Get comments for a specific manga (Public)
router.get('/:mangaId', async (req, res) => {
  try {
    const { mangaId } = req.params;

    // Verify manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        error: 'Manga not found'
      });
    }

    // Get comments with populated user data
    const comments = await Comment.find({ manga: mangaId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// DELETE /api/comments/:id - Delete a comment (Auth required with role-based logic)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Authorization check:
    // - Admins can delete any comment
    // - Regular users can only delete their own comments
    if (!req.isAdmin && comment.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only delete your own comments'
      });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

module.exports = router;

