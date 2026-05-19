const Interview = require('../models/Interview');
const User = require('../models/User');
const { generateFirstQuestion, generateFollowUpQuestion, generateFeedback } = require('../services/aiService');

// Start a new interview
const startInterview = async (req, res) => {
  try {
    const { mode } = req.body;

    // Get user with resume text
    const user = await User.findById(req.user._id);
    if (!user.resumeText) {
      return res.status(400).json({ message: 'Please upload your resume first' });
    }

    // Generate first question
    const firstQuestion = await generateFirstQuestion(user.resumeText, mode || 'friendly');

    // Create interview session
    const interview = await Interview.create({
      user: req.user._id,
      mode: mode || 'friendly',
      conversationHistory: [
        { role: 'ai', message: firstQuestion }
      ],
      questionCount: 1
    });

    res.status(201).json({
      interviewId: interview._id,
      question: firstQuestion,
      questionNumber: 1,
      mode: interview.mode
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit answer and get next question
const submitAnswer = async (req, res) => {
  try {
    const { interviewId, answer } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'Interview already completed' });
    }

    // Add user answer to history
    interview.conversationHistory.push({ role: 'user', message: answer });

    // Check if we should end interview (after 5 questions)
    if (interview.questionCount >= 5) {
      // Generate feedback
      const user = await User.findById(req.user._id);
      const feedback = await generateFeedback(user.resumeText, interview.conversationHistory);

      interview.feedback = feedback;
      interview.status = 'completed';
      await interview.save();

      return res.json({
        completed: true,
        feedback
      });
    }

    // Generate follow-up question
    const user = await User.findById(req.user._id);
    const nextQuestion = await generateFollowUpQuestion(
      user.resumeText,
      interview.conversationHistory,
      interview.mode
    );

    // Add AI question to history
    interview.conversationHistory.push({ role: 'ai', message: nextQuestion });
    interview.questionCount += 1;
    await interview.save();

    res.json({
      completed: false,
      question: nextQuestion,
      questionNumber: interview.questionCount,
      mode: interview.mode
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get interview history
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-conversationHistory');

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single interview with full conversation
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startInterview, submitAnswer, getInterviews, getInterview };