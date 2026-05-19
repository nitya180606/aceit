const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, { timestamps: true });

const communitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  rounds: [
    {
      roundName: String,
      description: String,
      questions: [String]
    }
  ],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  result: {
    type: String,
    enum: ['selected', 'rejected', 'pending'],
    default: 'pending'
  },
  upvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  comments: [commentSchema],
  tags: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Community', communitySchema);