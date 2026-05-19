const { GoogleGenerativeAI } = require('@google/generative-ai');
const { anonymizeResume } = require('../utils/helper');

const atsGenAI = new GoogleGenerativeAI(process.env.GEMINI_ATS_API_KEY);
const atsModel = atsGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const analyzeATS = async (resumeText, jobDescription) => {
  const safeResume = anonymizeResume(resumeText);

  const prompt = `
    You are an expert ATS (Applicant Tracking System) analyzer.
    
    Analyze this resume against the job description and return feedback.
    
    RESUME:
    ${safeResume}
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    Return ONLY this exact JSON format, no extra text:
    {
      "atsScore": <number 0-100>,
      "matchedKeywords": [<keywords found in both resume and job description>],
      "missingKeywords": [<important keywords in job description missing from resume>],
      "formatScore": <number 0-100>,
      "contentScore": <number 0-100>,
      "sectionAnalysis": {
        "hasEducation": <true/false>,
        "hasExperience": <true/false>,
        "hasSkills": <true/false>,
        "hasProjects": <true/false>,
        "hasSummary": <true/false>,
        "hasCertifications": <true/false>
      },
      "improvements": [<list of specific actionable improvements>],
      "overallFeedback": "<2-3 sentence summary of resume strength for this job>"
    }
  `;

  try {
    const result = await atsModel.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error('ATS analysis failed: ' + error.message);
  }
};

module.exports = { analyzeATS };