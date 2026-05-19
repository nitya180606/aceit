const anonymizeResume = (resumeText) => {
  let anonymized = resumeText;

  // Remove email addresses
  anonymized = anonymized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL REDACTED]'
  );

  // Remove phone numbers
  anonymized = anonymized.replace(
    /(\+91[-\s]?)?[6-9]\d{9}|\+?[\d\s\-().]{10,15}/g,
    '[PHONE REDACTED]'
  );

  // Remove LinkedIn URLs
  anonymized = anonymized.replace(
    /linkedin\.com\/in\/[^\s]*/g,
    '[LINKEDIN REDACTED]'
  );

  // Remove GitHub URLs
  anonymized = anonymized.replace(
    /github\.com\/[^\s]*/g,
    '[GITHUB REDACTED]'
  );

  // Remove portfolio/personal URLs
  anonymized = anonymized.replace(
    /https?:\/\/[^\s]*/g,
    '[URL REDACTED]'
  );

  return anonymized;
};

module.exports = { anonymizeResume };