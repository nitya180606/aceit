const mongoose = require('mongoose');

const sqlProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tableStructure: {
    type: String,
    required: true
  },
  sampleData: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  hints: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('SQLProblem', sqlProblemSchema);