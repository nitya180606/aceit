const Community = require('../models/Community');

// CREATE a post
const createPost = async (req, res) => {
  try {
    const { company, role, experience, rounds, difficulty, result, tags } = req.body;

    const post = await Community.create({
      user: req.user._id,
      company,
      role,
      experience,
      rounds,
      difficulty,
      result,
      tags
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all posts
const getPosts = async (req, res) => {
  try {
    const { company, difficulty, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (company) filter.company = new RegExp(company, 'i');
    if (difficulty) filter.difficulty = difficulty;

    const posts = await Community.find(filter)
      .populate('user', 'name')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Community.countDocuments(filter);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single post
const getPost = async (req, res) => {
  try {
    const post = await Community.findById(req.params.id)
      .populate('user', 'name')
      .populate('comments.user', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPVOTE a post
const upvotePost = async (req, res) => {
  try {
    const post = await Community.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyUpvoted = post.upvotes.includes(req.user._id);

    if (alreadyUpvoted) {
      // Remove upvote
      post.upvotes = post.upvotes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Add upvote
      post.upvotes.push(req.user._id);
    }

    await post.save();

    res.json({
      upvotes: post.upvotes.length,
      upvoted: !alreadyUpvoted
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Community.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      text
    });

    await post.save();

    // Return populated post
    const updatedPost = await Community.findById(req.params.id)
      .populate('comments.user', 'name');

    res.status(201).json(updatedPost.comments);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE post (only owner)
const deletePost = async (req, res) => {
  try {
    const post = await Community.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getPosts, getPost, upvotePost, addComment, deletePost };