const User = require('../models/User');

// GET profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only fields that were sent
    user.name = req.body.name || user.name;
    user.skills = req.body.skills || user.skills;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      skills: updatedUser.skills,
      resume: updatedUser.resume
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const { extractTextFromPDF } = require('../services/resumeService');

// UPLOAD RESUME
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // Extract text from PDF
    const resumeText = await extractTextFromPDF(req.file.path);
    // const resumeText = await extractTextFromPDF(req.file.path);
console.log('Resume text length:', resumeText.length);
console.log('First 100 chars:', resumeText.substring(0, 100));
    // Force update using findByIdAndUpdate
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          resume: req.file.path,
          resumeText: resumeText
        }
      },
      { new: true }
    );

    res.json({
      message: 'Resume uploaded successfully',
      filePath: req.file.path,
      textLength: resumeText.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { analyzeATS } = require('../services/atsService');

// ATS SCORE
const getATSScore = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ message: 'Please provide a job description' });
    }

    const user = await User.findById(req.user._id);
    if (!user.resumeText) {
      return res.status(400).json({ message: 'Please upload your resume first' });
    }

    const atsResult = await analyzeATS(user.resumeText, jobDescription);

    // Save ATS result to user performance history
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          performanceHistory: {
            type: 'ats',
            score: atsResult.atsScore,
            date: new Date(),
            details: atsResult
          }
        }
      }
    );

    res.json(atsResult);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const TestResult = require('../models/TestResult');
const Interview = require('../models/Interview');
const GDSession = require('../models/GDSession');

// GET performance dashboard
const getPerformanceDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all test results
    const testResults = await TestResult.find({ user: userId })
      .sort({ createdAt: -1 });

    // Get all interviews
    const interviews = await Interview.find({ 
      user: userId, 
      status: 'completed' 
    }).sort({ createdAt: -1 });

    // Get all GD sessions
    const gdSessions = await GDSession.find({ 
      user: userId, 
      status: 'completed' 
    }).sort({ createdAt: -1 });

    // Get user with ATS history
    const user = await User.findById(userId);
    const atsHistory = user.performanceHistory
      .filter(p => p.type === 'ats')
      .slice(-5); // last 5 ATS scores

    // Calculate aptitude stats
    const aptitudeResults = testResults.filter(r => r.testType === 'aptitude');
    const aptitudeAvg = aptitudeResults.length
      ? Math.round(aptitudeResults.reduce((sum, r) => sum + r.score, 0) / aptitudeResults.length)
      : 0;

    // Calculate SQL stats
    const sqlResults = testResults.filter(r => r.testType === 'sql');
    const sqlAvg = sqlResults.length
      ? Math.round(sqlResults.reduce((sum, r) => sum + r.score, 0) / sqlResults.length)
      : 0;

    // Calculate interview stats
    const interviewAvg = interviews.length
      ? Math.round(interviews.reduce((sum, i) => sum + (i.feedback?.overallScore || 0), 0) / interviews.length)
      : 0;

    // Calculate GD stats
    const gdAvg = gdSessions.length
      ? Math.round(gdSessions.reduce((sum, g) => sum + (g.feedback?.overallScore || 0), 0) / gdSessions.length)
      : 0;

    // Calculate ATS avg
    const atsAvg = atsHistory.length
      ? Math.round(atsHistory.reduce((sum, a) => sum + a.score, 0) / atsHistory.length)
      : 0;

    // Test score trends (last 5 of each)
    const aptitudeTrend = aptitudeResults.slice(0, 5).map(r => ({
      score: r.score,
      category: r.category,
      date: r.createdAt
    }));

    const sqlTrend = sqlResults.slice(0, 5).map(r => ({
      score: r.score,
      date: r.createdAt
    }));

    const interviewTrend = interviews.slice(0, 5).map(i => ({
      score: i.feedback?.overallScore || 0,
      mode: i.mode,
      date: i.createdAt
    }));

    const gdTrend = gdSessions.slice(0, 5).map(g => ({
      score: g.feedback?.overallScore || 0,
      topic: g.topic,
      date: g.createdAt
    }));

    // Identify weak areas
    const weakAreas = [];
    if (aptitudeAvg < 60) weakAreas.push('Aptitude — needs improvement');
    if (sqlAvg < 60) weakAreas.push('SQL — needs improvement');
    if (interviewAvg < 60) weakAreas.push('Interview skills — needs improvement');
    if (gdAvg < 60) weakAreas.push('Group Discussion — needs improvement');

    // Identify strong areas
    const strongAreas = [];
    if (aptitudeAvg >= 80) strongAreas.push('Aptitude — strong');
    if (sqlAvg >= 80) strongAreas.push('SQL — strong');
    if (interviewAvg >= 80) strongAreas.push('Interview skills — strong');
    if (gdAvg >= 80) strongAreas.push('Group Discussion — strong');

    res.json({
      overview: {
        totalTestsTaken: testResults.length,
        totalInterviews: interviews.length,
        totalGDSessions: gdSessions.length,
        totalATSChecks: atsHistory.length
      },
      averageScores: {
        aptitude: aptitudeAvg,
        sql: sqlAvg,
        interview: interviewAvg,
        gd: gdAvg,
        ats: atsAvg
      },
      trends: {
        aptitude: aptitudeTrend,
        sql: sqlTrend,
        interview: interviewTrend,
        gd: gdTrend,
        ats: atsHistory
      },
      strengths: strongAreas,
      weakAreas,
      recentActivity: {
        lastTest: testResults[0] || null,
        lastInterview: interviews[0] || null,
        lastGD: gdSessions[0] || null
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { getProfile, updateProfile, uploadResume, getATSScore, getPerformanceDashboard};