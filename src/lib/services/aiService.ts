export interface Question {
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time: number;
  category: string;
}

const questionDatabase = {
  Easy: [
    {
      category: 'JavaScript Fundamentals',
      questions: [
        'What is the difference between `let`, `const`, and `var` in JavaScript?',
        'Explain the concept of closures in JavaScript with a simple example.',
        'What is hoisting in JavaScript? Give an example.',
        'Explain the difference between `==` and `===` in JavaScript.',
      ]
    },
    {
      category: 'React Basics',
      questions: [
        'What is React and why is it popular for building web applications?',
        'What are React components? Explain functional vs class components.',
        'What is JSX and how does it work in React?',
        'What are props in React and how do you pass data between components?',
      ]
    }
  ],
  Medium: [
    {
      category: 'React Intermediate',
      questions: [
        'What are React Hooks? Explain useState and useEffect.',
        'Describe the React component lifecycle methods.',
        'What is the useContext hook and when would you use it?',
        'Explain controlled vs uncontrolled components in React.',
      ]
    },
    {
      category: 'Node.js Fundamentals',
      questions: [
        'What is Node.js and how does it differ from browser JavaScript?',
        'Explain the event-driven architecture of Node.js.',
        'What is npm and how do you manage dependencies?',
        'Explain the module system in Node.js (CommonJS vs ES Modules).',
      ]
    }
  ],
  Hard: [
    {
      category: 'Advanced React',
      questions: [
        'How do you optimize React performance? Discuss memoization techniques.',
        'Explain React Context API vs Redux for state management.',
        'What are React Server Components and their benefits?',
        'How do you implement code splitting and lazy loading in React?',
      ]
    },
    {
      category: 'Advanced Node.js & Full-Stack',
      questions: [
        'Explain the event loop in Node.js and how it handles asynchronous operations.',
        'How do you implement authentication and authorization in a full-stack app?',
        'What are microservices and how would you design them with Node.js?',
        'How do you handle database connections and optimize queries?',
      ]
    }
  ]
};

export const generateInterviewQuestions = (): Question[] => {
  const questions: Question[] = [];
  const usedQuestions = new Set<string>();
  
  const structure = [
    { difficulty: 'Easy', count: 2, time: 20 },
    { difficulty: 'Medium', count: 2, time: 60 },
    { difficulty: 'Hard', count: 2, time: 120 }
  ];
  
  structure.forEach(({ difficulty, count, time }) => {
    const difficultyPool = questionDatabase[difficulty as keyof typeof questionDatabase];
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let selectedQuestion: Question | null = null;
      
      while (!selectedQuestion && attempts < 20) {
        const randomCategory = difficultyPool[Math.floor(Math.random() * difficultyPool.length)];
        const randomQuestionText = randomCategory.questions[
          Math.floor(Math.random() * randomCategory.questions.length)
        ];
        
        if (!usedQuestions.has(randomQuestionText)) {
          selectedQuestion = {
            text: randomQuestionText,
            difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
            time: time,
            category: randomCategory.category
          };
          usedQuestions.add(randomQuestionText);
        }
        attempts++;
      }
      
      if (selectedQuestion) {
        questions.push(selectedQuestion);
      }
    }
  });
  
  return questions;
};

export const getAIScoreAndSummary = (answers: { question: string; answer: string }[]) => {
  let totalScore = 0;
  
  const detailedScores = answers.map((item, index) => {
    let score = 0;
    const answerLength = item.answer.trim().length;
    const wordCount = item.answer.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    const questionDifficulty = index < 2 ? 'Easy' : index < 4 ? 'Medium' : 'Hard';
    
    if (answerLength === 0) {
      score = 0;
    } else {
      let baseScore = 0;
      
      if (questionDifficulty === 'Easy') {
        if (wordCount >= 15) baseScore = 7;
        else if (wordCount >= 10) baseScore = 5;
        else if (wordCount >= 5) baseScore = 3;
        else baseScore = 1;
      } else if (questionDifficulty === 'Medium') {
        if (wordCount >= 25) baseScore = 7;
        else if (wordCount >= 15) baseScore = 5;
        else if (wordCount >= 8) baseScore = 3;
        else baseScore = 1;
      } else {
        if (wordCount >= 40) baseScore = 7;
        else if (wordCount >= 25) baseScore = 5;
        else if (wordCount >= 15) baseScore = 3;
        else baseScore = 1;
      }
      
      const technicalKeywords = [
        'react', 'javascript', 'typescript', 'node', 'async', 'await', 'promise',
        'component', 'hook', 'state', 'props', 'event', 'closure', 'scope',
        'const', 'let', 'var', 'hoisting', 'lifecycle', 'redux', 'express',
        'middleware', 'api', 'database', 'frontend', 'backend', 'framework'
      ];
      
      const keywordMatches = technicalKeywords.filter(keyword => 
        item.answer.toLowerCase().includes(keyword)
      ).length;
      
      const keywordBonus = Math.min(3, Math.floor(keywordMatches / 2));
      score = Math.min(10, baseScore + keywordBonus);
    }
    
    totalScore += score;
    return { ...item, score: Math.round(score) };
  });

  const finalScore = Math.round((totalScore / (answers.length * 10)) * 100);

  let summary = '';
  
  if (finalScore >= 85) {
    summary = '🌟 Outstanding performance! Demonstrates exceptional understanding of full-stack development with React and Node.js. Provides comprehensive, well-structured answers with excellent technical depth.';
  } else if (finalScore >= 70) {
    summary = '👍 Strong candidate with solid full-stack knowledge. Shows good understanding of React and Node.js fundamentals with adequate technical explanations.';
  } else if (finalScore >= 55) {
    summary = '⚡ Decent foundation in full-stack development. Demonstrates basic understanding of React and Node.js concepts but needs improvement in providing detailed explanations.';
  } else if (finalScore >= 35) {
    summary = '📚 Below expectations. Shows limited understanding of full-stack development concepts. Requires significant learning and practice.';
  } else {
    summary = '❌ Needs substantial development. Very limited knowledge of React and Node.js fundamentals. Not ready for a full-stack development position.';
  }

  return { finalScore, summary, detailedScores };
};
