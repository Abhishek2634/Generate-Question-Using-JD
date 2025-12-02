export interface Question {
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time: number;
  category: string;
}

// Keep your existing getAIScoreAndSummary function exactly as is
export const getAIScoreAndSummary = (answers: { question: string; answer: string }[]) => {
  let totalScore = 0;
  
  const detailedScores = answers.map((item, index) => {
    let score = 0;
    const answerLength = item.answer.trim().length;
    const wordCount = item.answer.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    const questionDifficulty = index < 2 ? 'Easy' : index < 5 ? 'Medium' : 'Hard';
    
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
    summary = '🌟 Outstanding performance! Demonstrates exceptional understanding with comprehensive, well-structured answers and excellent technical depth.';
  } else if (finalScore >= 70) {
    summary = '👍 Strong candidate with solid knowledge. Shows good understanding of fundamentals with adequate technical explanations.';
  } else if (finalScore >= 55) {
    summary = '⚡ Decent foundation. Demonstrates basic understanding but needs improvement in providing detailed explanations.';
  } else if (finalScore >= 35) {
    summary = '📚 Below expectations. Shows limited understanding of concepts. Requires significant learning and practice.';
  } else {
    summary = '❌ Needs substantial development. Very limited knowledge of fundamentals. Not ready for the position.';
  }

  return { finalScore, summary, detailedScores };
};
