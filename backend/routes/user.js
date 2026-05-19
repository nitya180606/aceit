const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  uploadResume, 
  getATSScore,
  getPerformanceDashboard 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/resume', protect, upload.single('resume'), uploadResume);
router.post('/ats', protect, getATSScore);
router.get('/dashboard', protect, getPerformanceDashboard);

module.exports = router;