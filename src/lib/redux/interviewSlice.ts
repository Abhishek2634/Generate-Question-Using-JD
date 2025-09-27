import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { generateInterviewQuestions, type Question } from '../services/aiService';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  summary: string;
  answers: { question: string; answer: string; score: number }[];
  completedAt?: string;
  duration?: number;
}

interface InterviewSession {
  candidateId: string;
  status: 'in-progress' | 'completed';
  currentQuestionIndex: number;
  answers: string[];
  timer: number;
  questions: Question[];
  startTime: number;
  pausedTime?: number;
}

interface InterviewState {
  candidates: Candidate[];
  currentSession: InterviewSession | null;
  totalInterviews: number;
  averageScore: number;
}

const initialState: InterviewState = {
  candidates: [],
  currentSession: null,
  totalInterviews: 0,
  averageScore: 0,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startNewInterview: (
      state, 
      action: PayloadAction<{ name: string; email: string; phone: string }>
    ) => {
      const now = Date.now();
      const newCandidateId = `cand_${now}`;
      
      const questions = generateInterviewQuestions();
      
      const newCandidate: Candidate = {
        id: newCandidateId,
        ...action.payload,
        score: 0,
        summary: '',
        answers: [],
        completedAt: undefined,
        duration: 0,
      };
      
      state.candidates.push(newCandidate);
      
      const firstQuestion = questions[0];
      state.currentSession = {
        candidateId: newCandidateId,
        status: 'in-progress',
        currentQuestionIndex: 0,
        answers: Array(questions.length).fill(''),
        timer: firstQuestion ? firstQuestion.time : 0,
        questions: questions,
        startTime: now,
      };
    },

    updateCurrentAnswer: (state, action: PayloadAction<string>) => {
      if (state.currentSession?.status === 'in-progress') {
        state.currentSession.answers[state.currentSession.currentQuestionIndex] = action.payload;
      }
    },

    nextQuestion: (state) => {
      if (state.currentSession?.status === 'in-progress') {
        const nextIndex = state.currentSession.currentQuestionIndex + 1;
        const nextQuestionData = state.currentSession.questions[nextIndex];
        
        if (nextQuestionData) {
          state.currentSession.currentQuestionIndex = nextIndex;
          state.currentSession.timer = nextQuestionData.time;
        }
      }
    },

    setTimer: (state, action: PayloadAction<number>) => {
      if (state.currentSession) {
        state.currentSession.timer = Math.max(0, action.payload);
      }
    },

    completeInterview: (
  state, 
  action: PayloadAction<{
    finalScore: number;
    summary: string;
    detailedScores: { question: string; answer: string; score: number }[];
  }>
) => {
  if (!state.currentSession) return;
  
  const { finalScore, summary, detailedScores } = action.payload;
  const candidateIndex = state.candidates.findIndex(
    (c) => c.id === state.currentSession?.candidateId
  );
  
  if (candidateIndex !== -1) {
    const now = Date.now();
    
    // Calculate duration in SECONDS (not minutes)
    const durationInSeconds = state.currentSession.startTime 
      ? Math.max(1, Math.round((now - state.currentSession.startTime) / 1000)) // Divide by 1000 for seconds
      : 1; // Default to 1 second if startTime missing
      
    state.candidates[candidateIndex].score = finalScore;
    state.candidates[candidateIndex].summary = summary;
    state.candidates[candidateIndex].answers = detailedScores;
    state.candidates[candidateIndex].completedAt = new Date().toISOString();
    state.candidates[candidateIndex].duration = durationInSeconds; // Now in seconds
    
    console.log(`✅ Interview completed in ${durationInSeconds} seconds`);
  }
  
  state.currentSession.status = 'completed';
},


    resetCurrentSession: (state) => {
      state.currentSession = null;
    },

    resumeSession: (state) => {
      if (state.currentSession?.status === 'in-progress' && state.currentSession.questions) {
        const qIndex = state.currentSession.currentQuestionIndex;
        const currentQuestion = state.currentSession.questions[qIndex];
        if (currentQuestion) {
          state.currentSession.timer = currentQuestion.time;
        }
      }
    },
  },
});

export const {
  startNewInterview,
  updateCurrentAnswer,
  nextQuestion,
  setTimer,
  completeInterview,
  resetCurrentSession,
  resumeSession,
} = interviewSlice.actions;

export default interviewSlice.reducer;
