const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['friendly', 'strict', 'pressure', 'hr'],
    default: 'friendly'
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  conversationHistory: [
    {
      role: {
        type: String,
        enum: ['ai', 'user']
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  feedback: {
    type: Object,
    default: null
  },
  questionCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);