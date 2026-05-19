const express = require('express');
const router = express.Router();
const {
  startGD,
  sendMessage,
  endGD,
  getGDSessions,
  getGDSession
} = require('../controllers/gdController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startGD);
router.post('/message', protect, sendMessage);
router.post('/end', protect, endGD);
router.get('/', protect, getGDSessions);
router.get('/:id', protect, getGDSession);

module.exports = router;