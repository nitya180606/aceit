const { GoogleGenerativeAI } = require('@google/generative-ai');
const SQLProblem = require('../models/SQLProblem');
const CodingProblem = require('../models/CodingProblem');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Generate SQL problem using AI
const generateSQLProblem = async (difficulty) => {
  const prompt = `
    Generate a ${difficulty} SQL problem for placement preparation.
    Return ONLY this exact JSON format, no extra text:
    {
      "title": "<problem title>",
      "description": "<problem description>",
      "tableStructure": "<CREATE TABLE statements>",
      "sampleData": "<INSERT statements with sample data>",
      "expectedOutput": "<the correct SQL query solution>",
      "difficulty": "${difficulty}",
      "hints": ["<hint 1>", "<hint 2>"]
    }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json|```/g, '').trim();
  const problemData = JSON.parse(cleaned);

  // Save to MongoDB for reference
  const problem = await SQLProblem.create(problemData);
  return problem;
};

// Generate coding problem using AI
const generateCodingProblem = async (difficulty) => {
  const prompt = `
    Generate a ${difficulty} coding problem for placement preparation.
    Focus on DSA topics like arrays, strings, linked lists, trees.
    Return ONLY this exact JSON format, no extra text:
    {
      "title": "<problem title>",
      "description": "<detailed problem description>",
      "inputFormat": "<input format description>",
      "outputFormat": "<output format description>",
      "constraints": "<constraints like 1 <= n <= 1000>",
      "sampleInput": "<sample input>",
      "sampleOutput": "<sample output>",
      "testCases": [
        { "input": "<input1>", "expectedOutput": "<output1>", "isHidden": false },
        { "input": "<input2>", "expectedOutput": "<output2>", "isHidden": false },
        { "input": "<input3>", "expectedOutput": "<output3>", "isHidden": true },
        { "input": "<input4>", "expectedOutput": "<output4>", "isHidden": true }
      ],
      "difficulty": "${difficulty}",
      "category": "<arrays/strings/trees/etc>"
    }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json|```/g, '').trim();
  const problemData = JSON.parse(cleaned);

  // Save to MongoDB
  const problem = await CodingProblem.create(problemData);
  return problem;
};

module.exports = { generateSQLProblem, generateCodingProblem };