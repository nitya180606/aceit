const mongoose = require('mongoose');

const gdSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  messages: [
    {
      participant: {
        type: String, // 'user', 'Alex', 'Sam', 'Jordan'
        required: true
      },
      message: {
        type: String,
        required: true
      },
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
  timeLimit: {
    type: Number,
    default: 15 * 60 // 15 minutes in seconds
  }
}, { timestamps: true });

module.exports = mongoose.model('GDSession', gdSessionSchema);