const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPost,
  upvotePost,
  addComment,
  deletePost
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPost);
router.get('/', protect, getPosts);
router.get('/:id', protect, getPost);
router.put('/:id/upvote', protect, upvotePost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;