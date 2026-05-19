require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');

const questions = [
  // QUANTITATIVE
  {
    question: "A train travels 360 km in 4 hours. What is its speed in km/h?",
    options: ["80", "90", "100", "110"],
    correctAnswer: "90",
    category: "quantitative",
    difficulty: "easy",
    explanation: "Speed = Distance/Time = 360/4 = 90 km/h"
  },
  {
    question: "If 20% of a number is 80, what is the number?",
    options: ["300", "350", "400", "450"],
    correctAnswer: "400",
    category: "quantitative",
    difficulty: "easy",
    explanation: "20% of x = 80, so x = 80/0.20 = 400"
  },
  {
    question: "A shopkeeper sells an item for Rs.1200 at a profit of 20%. What is the cost price?",
    options: ["Rs.900", "Rs.950", "Rs.1000", "Rs.1050"],
    correctAnswer: "Rs.1000",
    category: "quantitative",
    difficulty: "medium",
    explanation: "CP = SP/1.20 = 1200/1.20 = Rs.1000"
  },
  {
    question: "Two pipes A and B can fill a tank in 12 and 18 hours respectively. How long will they take together?",
    options: ["6.2 hours", "7.2 hours", "8.2 hours", "9.2 hours"],
    correctAnswer: "7.2 hours",
    category: "quantitative",
    difficulty: "medium",
    explanation: "Combined rate = 1/12 + 1/18 = 5/36. Time = 36/5 = 7.2 hours"
  },
  {
    question: "What is the compound interest on Rs.10000 at 10% per annum for 2 years?",
    options: ["Rs.2000", "Rs.2100", "Rs.2200", "Rs.2300"],
    correctAnswer: "Rs.2100",
    category: "quantitative",
    difficulty: "medium",
    explanation: "CI = 10000(1.1)^2 - 10000 = 12100 - 10000 = Rs.2100"
  },
  {
    question: "If a:b = 2:3 and b:c = 4:5, what is a:c?",
    options: ["6:15", "8:15", "10:15", "12:15"],
    correctAnswer: "8:15",
    category: "quantitative",
    difficulty: "medium",
    explanation: "a:b:c = 8:12:15, so a:c = 8:15"
  },
  {
    question: "A man walks at 5 km/h and runs at 10 km/h. He covers 30 km partly by walking and partly by running in 4 hours. Find distance walked.",
    options: ["5 km", "10 km", "15 km", "20 km"],
    correctAnswer: "10 km",
    category: "quantitative",
    difficulty: "hard",
    explanation: "Let walking distance = x. x/5 + (30-x)/10 = 4. Solving: x = 10 km"
  },
  {
    question: "The average of 5 numbers is 40. If one number is excluded the average becomes 35. What is the excluded number?",
    options: ["55", "60", "65", "70"],
    correctAnswer: "60",
    category: "quantitative",
    difficulty: "easy",
    explanation: "Total = 5×40 = 200. New total = 4×35 = 140. Excluded = 200-140 = 60"
  },
  {
    question: "In how many ways can the letters of the word 'LEADER' be arranged?",
    options: ["360", "480", "720", "960"],
    correctAnswer: "360",
    category: "quantitative",
    difficulty: "hard",
    explanation: "LEADER has 6 letters with E repeated twice. Arrangements = 6!/2! = 360"
  },
  {
    question: "What is the probability of getting a sum of 7 when two dice are thrown?",
    options: ["1/6", "5/36", "7/36", "1/4"],
    correctAnswer: "1/6",
    category: "quantitative",
    difficulty: "medium",
    explanation: "Favorable outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. Total = 36. P = 6/36 = 1/6"
  },

  // LOGICAL
  {
    question: "If BOOK is coded as CPPL, how is DESK coded?",
    options: ["EFLT", "EFTL", "ETFL", "EFTK"],
    correctAnswer: "EFTL",
    category: "logical",
    difficulty: "easy",
    explanation: "Each letter is shifted by +1. D→E, E→F, S→T, K→L"
  },
  {
    question: "Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64",
    options: ["37", "50", "64", "26"],
    correctAnswer: "64",
    category: "logical",
    difficulty: "medium",
    explanation: "Pattern: 1²+1, 2²+1, 3²+1... The series should be 65 not 64"
  },
  {
    question: "All cats are animals. Some animals are dogs. Which conclusion is valid?",
    options: [
      "Some cats are dogs",
      "All animals are cats",
      "Some animals are cats",
      "All dogs are cats"
    ],
    correctAnswer: "Some animals are cats",
    category: "logical",
    difficulty: "medium",
    explanation: "Since all cats are animals, some animals must be cats"
  },
  {
    question: "If A is to the north of B, and C is to the east of B, in which direction is A from C?",
    options: ["North-East", "North-West", "South-East", "South-West"],
    correctAnswer: "North-West",
    category: "logical",
    difficulty: "medium",
    explanation: "A is north of B, C is east of B. So A is to the North-West of C"
  },
  {
    question: "Complete the series: 3, 8, 15, 24, 35, ?",
    options: ["45", "46", "47", "48"],
    correctAnswer: "48",
    category: "logical",
    difficulty: "easy",
    explanation: "Pattern: n²-1 where n=2,3,4... Next: 7²-1 = 48"
  },
  {
    question: "Pointing to a man, a woman says 'His mother is the only daughter of my mother'. How is the woman related to the man?",
    options: ["Grandmother", "Mother", "Sister", "Aunt"],
    correctAnswer: "Mother",
    category: "logical",
    difficulty: "hard",
    explanation: "Only daughter of my mother = myself. So the man's mother is the woman herself"
  },
  {
    question: "If in a code language, COMPUTER is written as RFUVQNPC, how is MEDICINE written?",
    options: ["MFEJDJOF", "EOJDEJFM", "EOJDJEFM", "MFEJDOFJ"],
    correctAnswer: "EOJDEJFM",
    category: "logical",
    difficulty: "hard",
    explanation: "Each letter is reversed and shifted. Apply same pattern to MEDICINE"
  },
  {
    question: "Find next term: 1, 1, 2, 3, 5, 8, 13, ?",
    options: ["18", "19", "20", "21"],
    correctAnswer: "21",
    category: "logical",
    difficulty: "easy",
    explanation: "Fibonacci series: each number is sum of previous two. 8+13 = 21"
  },
  {
    question: "Six people A,B,C,D,E,F sit in a row. A sits next to B. C sits next to D. B is not next to C. E and F sit at the ends. Who sits in the middle?",
    options: ["A and D", "B and C", "A and C", "B and D"],
    correctAnswer: "B and C",
    category: "logical",
    difficulty: "hard",
    explanation: "F-A-B-C-D-E or E-D-C-B-A-F arrangement. B and C sit in middle positions"
  },
  {
    question: "A clock shows 3:15. What is the angle between the hour and minute hands?",
    options: ["0°", "7.5°", "15°", "22.5°"],
    correctAnswer: "7.5°",
    category: "logical",
    difficulty: "medium",
    explanation: "At 3:15, minute hand at 90°, hour hand at 97.5°. Difference = 7.5°"
  },

  // VERBAL
  {
    question: "Choose the word most similar in meaning to 'ELOQUENT':",
    options: ["Fluent", "Silent", "Confused", "Angry"],
    correctAnswer: "Fluent",
    category: "verbal",
    difficulty: "medium",
    explanation: "Eloquent means fluent or persuasive in speaking"
  },
  {
    question: "Choose the word most opposite in meaning to 'BENEVOLENT':",
    options: ["Kind", "Cruel", "Generous", "Helpful"],
    correctAnswer: "Cruel",
    category: "verbal",
    difficulty: "easy",
    explanation: "Benevolent means kind and generous. Antonym is cruel/malevolent"
  },
  {
    question: "Fill in the blank: The committee _____ to a decision after hours of debate.",
    options: ["came", "arrived", "reached", "got"],
    correctAnswer: "reached",
    category: "verbal",
    difficulty: "easy",
    explanation: "'Reached a decision' is the correct idiomatic expression"
  },
  {
    question: "Identify the error: 'He is one of the student who has passed the exam.'",
    options: [
      "He is one of",
      "the student who",
      "has passed",
      "the exam"
    ],
    correctAnswer: "the student who",
    category: "verbal",
    difficulty: "medium",
    explanation: "Should be 'students who have' — plural subject needs plural verb"
  },
  {
    question: "Choose the correctly spelled word:",
    options: ["Accomodate", "Accommodate", "Acommodate", "Acomodate"],
    correctAnswer: "Accommodate",
    category: "verbal",
    difficulty: "easy",
    explanation: "Accommodate has double 'c' and double 'm'"
  },
  {
    question: "Choose the best meaning of the idiom 'Beat around the bush':",
    options: [
      "To hit plants",
      "To avoid the main topic",
      "To work hard",
      "To search for something"
    ],
    correctAnswer: "To avoid the main topic",
    category: "verbal",
    difficulty: "medium",
    explanation: "Beat around the bush means to avoid speaking directly about a topic"
  },
  {
    question: "Select the word that best completes the analogy: Doctor:Hospital::Teacher:?",
    options: ["Student", "School", "Book", "Classroom"],
    correctAnswer: "School",
    category: "verbal",
    difficulty: "easy",
    explanation: "A doctor works in a hospital, a teacher works in a school"
  },
  {
    question: "Which sentence is grammatically correct?",
    options: [
      "Neither Ram nor Shyam are coming",
      "Neither Ram nor Shyam is coming",
      "Neither Ram nor Shyam were coming",
      "Neither Ram nor Shyam have come"
    ],
    correctAnswer: "Neither Ram nor Shyam is coming",
    category: "verbal",
    difficulty: "medium",
    explanation: "With neither/nor, verb agrees with the closer subject (Shyam = singular)"
  },
  {
    question: "Choose the word closest in meaning to 'EPHEMERAL':",
    options: ["Eternal", "Temporary", "Ancient", "Spiritual"],
    correctAnswer: "Temporary",
    category: "verbal",
    difficulty: "hard",
    explanation: "Ephemeral means lasting for a very short time"
  },
  {
    question: "Rearrange to form a meaningful sentence: 'always/hard work/success/leads/to'",
    options: [
      "Success always leads to hard work",
      "Hard work always leads to success",
      "Always hard work leads to success",
      "Hard work leads always to success"
    ],
    correctAnswer: "Hard work always leads to success",
    category: "verbal",
    difficulty: "easy",
    explanation: "The natural order is Subject + Adverb + Verb + Prepositional phrase"
  }
];

const seedQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert new questions
    await Question.insertMany(questions);
    console.log(`Successfully seeded ${questions.length} questions!`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedQuestions();