const express = require('express');
const router = express.Router();
const {
  getAptitudeQuestions,
  submitAptitude,
  getSQLProblem,
  submitSQL,
  getCodingProblem,
  submitCoding,
  getTestResults
} = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

router.get('/aptitude/questions', protect, getAptitudeQuestions);
router.post('/aptitude/submit', protect, submitAptitude);
router.get('/sql/problem', protect, getSQLProblem);
router.post('/sql/submit', protect, submitSQL);
router.get('/coding/problem', protect, getCodingProblem);
router.post('/coding/submit', protect, submitCoding);
router.get('/results', protect, getTestResults);

module.exports = router;