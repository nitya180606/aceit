const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const SQLProblem = require('../models/SQLProblem');
const TestResult = require('../models/TestResult');
const { generateSQLProblem, generateCodingProblem } = require('../services/testAIService');

// GET random aptitude questions by category
const getAptitudeQuestions = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    const filter = category ? { category } : {};
    
    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(limit) } },
      { $project: { correctAnswer: 0, explanation: 0 } }
    ]);

    res.json({
      questions,
      totalQuestions: questions.length,
      timeLimit: 30 * 60 // 30 minutes in seconds
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SUBMIT aptitude answers
const submitAptitude = async (req, res) => {
  try {
    const { answers, timeTaken, category } = req.body;
    // answers = [{ questionId, selectedAnswer }]

    let correct = 0;
    const detailedResults = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) correct++;

      detailedResults.push({
        questionId: answer.questionId,
        question: question.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      });
    }

    const score = Math.round((correct / answers.length) * 100);

    // Save result
    await TestResult.create({
      user: req.user._id,
      testType: 'aptitude',
      score,
      totalQuestions: answers.length,
      correctAnswers: correct,
      timeTaken,
      category,
      answers: detailedResults
    });

    res.json({
      score,
      correct,
      total: answers.length,
      timeTaken,
      detailedResults
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET AI generated SQL problem
const getSQLProblem = async (req, res) => {
  try {
    const { difficulty = 'medium' } = req.query;
    const problem = await generateSQLProblem(difficulty);
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SUBMIT SQL answer
const submitSQL = async (req, res) => {
  try {
    const { problemId, userQuery, timeTaken } = req.body;

    const problem = await SQLProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Simple check — compare normalized queries
    const normalize = (q) => q.toLowerCase().replace(/\s+/g, ' ').trim();
    const isCorrect = normalize(userQuery) === normalize(problem.expectedOutput);

    const score = isCorrect ? 100 : 0;

    await TestResult.create({
      user: req.user._id,
      testType: 'sql',
      score,
      totalQuestions: 1,
      correctAnswers: isCorrect ? 1 : 0,
      timeTaken,
      answers: [{ userQuery, expectedQuery: problem.expectedOutput, isCorrect }]
    });

    res.json({
      isCorrect,
      score,
      expectedQuery: problem.expectedOutput,
      feedback: isCorrect
        ? 'Correct! Your query matches the expected output.'
        : 'Incorrect. Check your query and try again.'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET AI generated coding problem
const getCodingProblem = async (req, res) => {
  try {
    const { difficulty = 'medium' } = req.query;
    const problem = await generateCodingProblem(difficulty);
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SUBMIT coding solution via Judge0
const submitCoding = async (req, res) => {
  try {
    const { code, language, problemId, timeTaken } = req.body;
    // language should be: "python", "java", "c", "cpp", "javascript"

    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const results = [];
    let passedCount = 0;

    for (const testCase of problem.testCases) {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language,
          version: '*',
          files: [{ content: code }],
          stdin: testCase.input
        })
      });

        const result = await response.json();
console.log('Piston response:', JSON.stringify(result, null, 2)); // ← add this
      const actualOutput = (result.run.stdout || '').trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      if (passed) passedCount++;

      if (!testCase.isHidden) {
        results.push({
          input: testCase.input,
          expectedOutput,
          actualOutput,
          passed,
          stderr: result.run.stderr || null
        });
      } else {
        results.push({
          input: 'Hidden Test Case',
          passed,
          status: passed ? 'Accepted' : 'Wrong Answer'
        });
      }
    }

    const score = Math.round((passedCount / problem.testCases.length) * 100);

    await TestResult.create({
      user: req.user._id,
      testType: 'coding',
      score,
      totalQuestions: problem.testCases.length,
      correctAnswers: passedCount,
      timeTaken,
      answers: results
    });

    res.json({
      score,
      passedCount,
      totalTestCases: problem.testCases.length,
      results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET user test history
const getTestResults = async (req, res) => {
  try {
    const results = await TestResult.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-answers');

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAptitudeQuestions,
  submitAptitude,
  getSQLProblem,
  submitSQL,
  getCodingProblem,
  submitCoding,
  getTestResults
};