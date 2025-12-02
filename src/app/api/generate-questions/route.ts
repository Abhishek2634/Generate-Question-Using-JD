import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Retry helper function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const is503Error = error?.message?.includes('503') || 
                         error?.message?.includes('overloaded') ||
                         error?.message?.includes('UNAVAILABLE');
      const is429Error = error?.message?.includes('429') || 
                         error?.message?.includes('Resource exhausted') ||
                         error?.message?.includes('quota');
      
      if ((is503Error || is429Error) && !isLastAttempt) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not configured in .env.local');
      return NextResponse.json(
        { error: 'API key not configured. Please add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // ✅ Use gemini-2.5-flash (confirmed available in your API key)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });
    
    // Parse request body
    const { jobDescription } = await req.json();
    
    // Validate job description
    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }
    
    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description must be at least 50 characters long" },
        { status: 400 }
      );
    }
    
    if (jobDescription.length > 5000) {
      return NextResponse.json(
        { error: "Job description must be less than 5000 characters" },
        { status: 400 }
      );
    }
    
    // Create prompt for Gemini
    const prompt = `You are an expert technical interviewer. Based on the following job description, generate EXACTLY 7 interview questions.

Job Description:
${jobDescription}

Requirements:
1. Generate exactly 7 questions (2 Easy, 3 Medium, 2 Hard)
2. Questions should directly relate to skills and requirements mentioned in the job description
3. Mix technical knowledge questions, behavioral questions, and situational questions
4. Make questions specific and relevant to the role
5. Return ONLY a valid JSON array, no markdown formatting, no extra text

Return format (ONLY THIS JSON STRUCTURE):
[
  {"text": "Your question here?", "difficulty": "Easy", "time": 120, "category": "Technical Skills"},
  {"text": "Your question here?", "difficulty": "Easy", "time": 120, "category": "Domain Knowledge"},
  {"text": "Your question here?", "difficulty": "Medium", "time": 180, "category": "Problem Solving"},
  {"text": "Your question here?", "difficulty": "Medium", "time": 180, "category": "Experience"},
  {"text": "Your question here?", "difficulty": "Medium", "time": 180, "category": "Behavioral"},
  {"text": "Your question here?", "difficulty": "Hard", "time": 240, "category": "Advanced Technical"},
  {"text": "Your question here?", "difficulty": "Hard", "time": 240, "category": "System Design"}
]

Time allocations:
- Easy questions: 120 seconds (2 minutes)
- Medium questions: 180 seconds (3 minutes)
- Hard questions: 240 seconds (4 minutes)

Generate the 7 questions now:`;
    
    console.log('🤖 Generating questions with gemini-2.5-flash...');
    
    // Call Gemini API with retry logic
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    }, 3, 2000);
    
    const response = result.response;
    let output = response.text();
    
    console.log('📝 Raw response received from Gemini');
    
    // Clean up markdown formatting if present
    output = output.replace(/``````\n?/g, '').trim();
    
    // Remove any leading/trailing text that's not part of JSON
    const jsonStart = output.indexOf('[');
    const jsonEnd = output.lastIndexOf(']');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Invalid response format: No JSON array found');
    }
    
    output = output.substring(jsonStart, jsonEnd + 1);
    
    // Parse JSON
    let questions;
    try {
      questions = JSON.parse(output);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw output:', output);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate response structure
    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }
    
    if (questions.length !== 7) {
      throw new Error(`Expected 7 questions, got ${questions.length}`);
    }
    
    // Validate each question has required fields
    const validQuestions = questions.every((q, index) => {
      const isValid = q.text && 
                     q.difficulty && 
                     typeof q.time === 'number' && 
                     q.category;
      
      if (!isValid) {
        console.error(`❌ Invalid question at index ${index}:`, q);
      }
      
      return isValid;
    });
    
    if (!validQuestions) {
      throw new Error('Some questions are missing required fields (text, difficulty, time, category)');
    }
    
    console.log('✅ Successfully generated and validated 7 questions');
    
    return NextResponse.json({ 
      questions,
      success: true 
    });
    
  } catch (error: any) {
    console.error('❌ Question generation error:', error.message);
    console.error('Error details:', error);
    
    // Handle specific error types
    if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Please wait 60 seconds and try again.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }
    
    if (error?.message?.includes('503') || error?.message?.includes('overloaded')) {
      return NextResponse.json(
        { 
          error: 'AI service is temporarily overloaded. Please try again in a moment.',
          retryAfter: 5
        },
        { status: 503 }
      );
    }
    
    if (error?.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your GEMINI_API_KEY in .env.local' },
        { status: 401 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate questions. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
