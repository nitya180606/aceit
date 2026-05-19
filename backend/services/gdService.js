const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Call AI with fallback
const callAI = async (prompt) => {
  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (geminiError) {
    console.log('Gemini failed, switching to Groq:', geminiError.message);
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
    });
    return completion.choices[0].message.content;
  }
};

const personalities = {
  Alex: `You are Alex, a dominant and confident GD participant. 
    You speak assertively, sometimes interrupt others politely, 
    make strong points with examples, and try to lead the discussion. 
    Keep responses to 2-3 sentences maximum.`,

  Sam: `You are Sam, a logical and analytical GD participant. 
    You give structured responses with data and facts, 
    build on others' points methodically, and stay calm. 
    Keep responses to 2-3 sentences maximum.`,

  Jordan: `You are Jordan, a passive but thoughtful GD participant. 
    You speak less frequently, agree with good points, 
    occasionally add a small insight, and avoid confrontation. 
    Keep responses to 1-2 sentences maximum.`
};

// Generate AI participant response
const generateParticipantResponse = async (participant, topic, conversationHistory, userMessage) => {
  const historyText = conversationHistory
    .map(m => `${m.participant}: ${m.message}`)
    .join('\n');

  const prompt = `
    You are participating in a Group Discussion on the topic: "${topic}"
    
    ${personalities[participant]}
    
    Conversation so far:
    ${historyText}
    
    The user just said: "${userMessage}"
    
    Respond naturally as ${participant} based on your personality.
    Do NOT include your name in the response.
    Keep it conversational and relevant to the topic.
  `;

  return await callAI(prompt);
};

// Decide which AI participants respond
const getRespondingParticipants = () => {
  const random = Math.random();
  if (random < 0.4) return ['Alex'];
  if (random < 0.65) return ['Alex', 'Sam'];
  if (random < 0.80) return ['Sam'];
  if (random < 0.90) return ['Jordan'];
  return ['Alex', 'Sam', 'Jordan'];
};

// Generate GD feedback
const generateGDFeedback = async (topic, messages) => {
  const userMessages = messages
    .filter(m => m.participant === 'user')
    .map(m => m.message)
    .join('\n');

  const fullConversation = messages
    .map(m => `${m.participant}: ${m.message}`)
    .join('\n');

  const prompt = `
    Evaluate this student's performance in a Group Discussion.
    
    Topic: ${topic}
    
    Full conversation:
    ${fullConversation}
    
    Student's contributions:
    ${userMessages}
    
    Provide feedback in this exact JSON format:
    {
      "overallScore": <number 0-100>,
      "communication": <number 0-100>,
      "leadership": <number 0-100>,
      "clarity": <number 0-100>,
      "participation": <number 0-100>,
      "strengths": [<list of strengths>],
      "weaknesses": [<list of weaknesses>],
      "suggestions": [<list of improvements>],
      "summary": "<2-3 sentence overall summary>"
    }
    
    Return ONLY the JSON, no extra text.
  `;

  const text = await callAI(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

module.exports = {
  generateParticipantResponse,
  getRespondingParticipants,
  generateGDFeedback
};