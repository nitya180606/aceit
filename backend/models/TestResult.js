const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    enum: ['aptitude', 'sql', 'coding'],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0
  },
  answers: {
    type: Array,
    default: []
  },
  category: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);