import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAIScoreAndSummary, type Question } from '../services/aiService';

// Candidate type (with resumeUrl support)
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  summary: string;
  answers: { question: string; answer: string; score: number }[];
  resumeUrl?: string; // <- Add resume support here!
  completedAt?: string;
  duration?: number;
  jobDescription?: string;
}

// Interview session state
interface InterviewSession {
  candidateId: string;
  status: 'in-progress' | 'completed';
  currentQuestionIndex: number;
  answers: string[];
  timer: number;
  questions: Question[];
  startTime: number;
  pausedTime?: number;
  jobDescription?: string;
}

interface InterviewState {
  candidates: Candidate[];
  currentSession: InterviewSession | null;
  totalInterviews: number;
  averageScore: number;
  pendingJobDescription: string | null;
  generatedQuestions: Question[] | null;
}

const initialState: InterviewState = {
  candidates: [],
  currentSession: null,
  totalInterviews: 0,
  averageScore: 0,
  pendingJobDescription: null,
  generatedQuestions: null,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setJobDescription: (state, action: PayloadAction<string>) => {
      state.pendingJobDescription = action.payload;
    },
    setGeneratedQuestions: (state, action: PayloadAction<Question[]>) => {
      state.generatedQuestions = action.payload;
    },

    startNewInterview: (
      state,
      action: PayloadAction<{ name: string; email: string; phone: string; resumeUrl?: string }>
    ) => {
      const now = Date.now();
      const newCandidateId = `cand_${now}`;
      const questions = state.generatedQuestions || [];
      if (questions.length === 0) return;
      const newCandidate: Candidate = {
        id: newCandidateId,
        ...action.payload,
        score: 0,
        summary: '',
        answers: [],
        completedAt: undefined,
        duration: 0,
        jobDescription: state.pendingJobDescription || undefined,
      };
      state.candidates.push(newCandidate);
      state.currentSession = {
        candidateId: newCandidateId,
        status: 'in-progress',
        currentQuestionIndex: 0,
        answers: Array(questions.length).fill(''),
        timer: questions[0]?.time || 0,
        questions,
        startTime: now,
        jobDescription: state.pendingJobDescription || undefined,
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
        const durationInSeconds = state.currentSession.startTime
          ? Math.max(1, Math.round((now - state.currentSession.startTime) / 1000))
          : 1;
        state.candidates[candidateIndex].score = finalScore;
        state.candidates[candidateIndex].summary = summary;
        state.candidates[candidateIndex].answers = detailedScores;
        state.candidates[candidateIndex].completedAt = new Date().toISOString();
        state.candidates[candidateIndex].duration = durationInSeconds;
      }
      state.currentSession.status = 'completed';
    },

    resetCurrentSession: (state) => {
      state.currentSession = null;
      state.pendingJobDescription = null;
      state.generatedQuestions = null;
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
  setJobDescription,
  setGeneratedQuestions,
  startNewInterview,
  updateCurrentAnswer,
  nextQuestion,
  setTimer,
  completeInterview,
  resetCurrentSession,
  resumeSession,
} = interviewSlice.actions;

export default interviewSlice.reducer;
