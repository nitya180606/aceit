const { anonymizeResume } = require('../utils/helper');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callAI = async (prompt) => {
  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (geminiError) {
    console.log('Gemini failed, switching to Groq:', geminiError.message);
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
      });
      return completion.choices[0].message.content;
    } catch (groqError) {
      throw new Error('Both AI providers failed: ' + groqError.message);
    }
  }
};

const generateFirstQuestion = async (resumeText, mode) => {
  const safeResume = anonymizeResume(resumeText);
  const modeInstructions = {
    friendly: 'You are a friendly interviewer who guides candidates gently.',
    strict: 'You are a strict interviewer who gives no hints.',
    pressure: 'You are a high-pressure interviewer who challenges every answer.',
    hr: 'You are an HR interviewer focusing on behavioral questions.'
  };

  const prompt = `
    You are conducting a job interview. 
    ${modeInstructions[mode]}
    
    Here is the candidate's resume:
    ${safeResume}
    
    Ask the FIRST interview question based on their background.
    Ask only ONE question. Be specific to their projects and skills.
    Do not say anything else, just ask the question directly.
  `;

  return await callAI(prompt);
};

const generateFollowUpQuestion = async (resumeText, conversationHistory, mode) => {
  const safeResume = anonymizeResume(resumeText);
  const modeInstructions = {
    friendly: 'You are a friendly interviewer who guides candidates gently.',
    strict: 'You are a strict interviewer who gives no hints.',
    pressure: 'You are a high-pressure interviewer who challenges every answer.',
    hr: 'You are an HR interviewer focusing on behavioral questions.'
  };

  const historyText = conversationHistory
    .map(h => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.message}`)
    .join('\n');

  const prompt = `
    You are conducting a job interview.
    ${modeInstructions[mode]}
    
    Candidate's resume:
    ${safeResume}
    
    Conversation so far:
    ${historyText}
    
    Based on the candidate's last answer, ask ONE relevant follow-up question.
    Do not repeat previous questions.
    Do not say anything else, just ask the question directly.
  `;

  return await callAI(prompt);
};

const generateFeedback = async (resumeText, conversationHistory) => {
  const safeResume = anonymizeResume(resumeText);
  const historyText = conversationHistory
    .map(h => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.message}`)
    .join('\n');

  const prompt = `
    You are an expert interview evaluator.
    
    Candidate's resume:
    ${safeResume}
    
    Complete interview conversation:
    ${historyText}
    
    Provide detailed feedback in this exact JSON format:
    {
      "overallScore": <number 0-100>,
      "technicalKnowledge": <number 0-100>,
      "communication": <number 0-100>,
      "confidence": <number 0-100>,
      "logicalThinking": <number 0-100>,
      "strengths": [<list of strengths>],
      "weaknesses": [<list of weaknesses>],
      "whyYouMightNotGetSelected": "<honest reason>",
      "improvementSuggestions": [<list of specific suggestions>],
      "summary": "<2-3 sentence overall summary>"
    }
    
    Return ONLY the JSON, no extra text.
  `;

  const text = await callAI(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

module.exports = { generateFirstQuestion, generateFollowUpQuestion, generateFeedback };