const express = require('express');
const router = express.Router();
const { startInterview, submitAnswer, getInterviews, getInterview } = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startInterview);
router.post('/answer', protect, submitAnswer);
router.get('/', protect, getInterviews);
router.get('/:id', protect, getInterview);

module.exports = router;