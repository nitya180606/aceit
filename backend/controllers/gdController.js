const GDSession = require('../models/GDSession');
const {
  generateParticipantResponse,
  getRespondingParticipants,
  generateGDFeedback
} = require('../services/gdService');

// START a GD session
const startGD = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Please provide a GD topic' });
    }

    // Opening message from Alex to kick off discussion
    const openingMessage = await generateParticipantResponse(
      'Alex',
      topic,
      [],
      'Let us begin the discussion'
    );

    const session = await GDSession.create({
      user: req.user._id,
      topic,
      messages: [
        {
          participant: 'Alex',
          message: openingMessage
        }
      ]
    });

    res.status(201).json({
      sessionId: session._id,
      topic: session.topic,
      timeLimit: session.timeLimit,
      messages: session.messages
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEND message and get AI responses
const sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    const session = await GDSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ message: 'GD session already completed' });
    }

    // Add user message
    session.messages.push({
      participant: 'user',
      message
    });

    // Decide which AI participants respond
    const respondingParticipants = getRespondingParticipants();
    const aiResponses = [];

    for (const participant of respondingParticipants) {
      const response = await generateParticipantResponse(
        participant,
        session.topic,
        session.messages,
        message
      );

      session.messages.push({
        participant,
        message: response
      });

      aiResponses.push({
        participant,
        message: response
      });
    }

    await session.save();

    res.json({
      aiResponses,
      totalMessages: session.messages.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// END session and get feedback
const endGD = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await GDSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Generate feedback
    const feedback = await generateGDFeedback(
      session.topic,
      session.messages
    );

    session.feedback = feedback;
    session.status = 'completed';
    await session.save();

    res.json({
      completed: true,
      topic: session.topic,
      totalMessages: session.messages.length,
      feedback
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all GD sessions for user
const getGDSessions = async (req, res) => {
  try {
    const sessions = await GDSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-messages');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single GD session
const getGDSession = async (req, res) => {
  try {
    const session = await GDSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startGD, sendMessage, endGD, getGDSessions, getGDSession };