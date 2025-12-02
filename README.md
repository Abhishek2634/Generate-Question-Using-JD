# AI-Powered Interview Assistant

An intelligent interview platform that generates role-specific questions using AI and provides automated candidate assessment.



## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Routes](#api-routes)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
  - [For Candidates (Interviewee)](#for-candidates-interviewee)
  - [For Interviewers (Dashboard)](#for-interviewers-dashboard)
- [Customization](#customization)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author & Acknowledgments](#author--acknowledgments)
- [Security & Privacy](#security--privacy)

---

## Overview

AI-Powered Interview Assistant is a modern full-stack web application (Next.js + TypeScript) that streamlines technical interviews by using Google Gemini AI to:

- Generate role-specific interview questions from job descriptions.
- Time and present questions to candidates.
- Score responses with AI-driven assessment and provide an overall candidate report.
- Store and preview uploaded resumes.

The app is intended for recruiters, hiring managers, startups, and educational institutions to get objective, automated interview support.

---

## Key Features

- AI-Powered question generation (Google Gemini)
  - Produces 7 tailored interview questions per job description
  - Categorizes by difficulty (Easy, Medium, Hard)
  - Assigns time limits per difficulty
- Smart candidate assessment
  - Per-question score (0–10)
  - Overall interview score (0–100)
  - Performance classification (Excellent / Good / Fair / Poor)
  - AI-generated feedback and summary
- Resume processing
  - PDF and DOCX upload
  - Automatic name/email/phone extraction
- Session persistence
  - Redux Persist to preserve interview state across refreshes
  - "Welcome Back" modal to resume interrupted interviews
- Timed interview experience with auto-submit on timeout
- Analytics dashboard with filters, per-candidate view, CSV export
- Responsive UI using Ant Design

---

## Tech Stack

- Next.js 15 (App Router + Server Components)
- React 19 + TypeScript
- Ant Design 5
- Redux Toolkit + Redux Persist
- Google Generative AI (Gemini)
- Mammoth (DOCX parsing) and PDF-parse (PDF extraction)
- ESLint, PostCSS

---

## Quick Start

Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Google Gemini API key

Clone and install

```bash
git clone https://github.com/Abhishek2634/ai-interview-assistant.git
cd ai-interview-assistant
npm install
# or
yarn install
# or
pnpm install
```

Configure environment

Create a `.env.local` in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open your browser: http://localhost:3000

---

## API Routes

The app exposes a couple of core API endpoints (serverless routes in `app/api`):

- POST /api/generate-questions
  - Purpose: Generate interview questions from a job description using Gemini AI.
  - Request body:
    ```json
    {
      "jobDescription": "string (50-5000 characters)"
    }
    ```
  - Response:
    ```json
    {
      "questions": [
        {
          "text": "Question text?",
          "difficulty": "Easy | Medium | Hard",
          "time": 120 | 180 | 240,
          "category": "Technical Skills | Problem Solving | ..."
        }
      ],
      "success": true
    }
    ```
  - Errors:
    - 400: Invalid/missing job description
    - 429: Rate limit exceeded (retry after 60s)
    - 503: AI service overloaded
    - 500: Server error

- POST /api/upload-resume
  - Purpose: Upload and store candidate resume files.
  - Request: FormData with `file`
  - Response:
    ```json
    {
      "url": "/uploads/resumes/timestamp_filename.pdf"
    }
    ```

Notes:
- The prompt and logic to control distribution (2 Easy, 3 Medium, 2 Hard) and time limits live in `app/api/generate-questions/route.ts`.
- Scoring is implemented in `lib/services/aiService.ts`.

---

## Project Structure

ai-interview-assistant/
- app/
  - api/
    - generate-questions/route.ts
    - upload-resume/route.ts
  - globals.css
  - layout.tsx
  - page.tsx
- components/
  - IntervieweeView.tsx
  - InterviewerDashboard.tsx
  - WelcomeBackModal.tsx
- lib/
  - redux/
    - store.ts
    - interviewSlice.ts
  - services/
    - aiService.ts
- public/
  - uploads/ (resume storage, gitignored)
- .env.local
- next.config.js
- package.json
- tsconfig.json
- README.md

---

## Usage Guide

### For Candidates (Interviewee)

1. Job Description
   - Paste a job description (min 50 characters).
   - Click "Generate Interview Questions" — AI generates 7 questions (~5s).
2. Candidate Info
   - Upload Resume (optional) — supports PDF and DOCX.
   - Ensure name, email, and phone fields are filled.
   - Click "Start Interview".
3. Interview Flow
   - Answer 7 timed questions sequentially.
   - Time limits: Easy 120s, Medium 180s, Hard 240s.
   - Answers auto-submit on timeout. Max answer length ~2000 characters.
4. Results
   - Immediate per-question and overall scores.
   - AI-generated summary and recommendations.

### For Interviewers (Dashboard)

- View, search, and filter candidates by name/email/phone or performance level.
- Sortable candidate table by score, date, etc.
- Click "View Details" to inspect Q&A, per-question scores, and resume (if uploaded).
- Export filtered results to CSV for reporting.

---

## Customization

- Question distribution and time limits: edit `app/api/generate-questions/route.ts` and the prompt used for Gemini.
- Scoring weights: modify `lib/services/aiService.ts` to adjust base score, keyword bonuses, and difficulty multipliers.
- Theme: change colors and styles in `app/globals.css`.
- Persisted storage: Redux Persist config is in `lib/redux/store.ts`.

---

## Deployment

Recommended: Vercel

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your_username/ai-interview-assistant.git
git push -u origin main
```

2. Deploy on Vercel:
- Import repository
- Add environment variable `GEMINI_API_KEY`
- Deploy

Other platforms: Netlify, Railway, Render — ensure `GEMINI_API_KEY` is set and build commands are configured.

---

## Troubleshooting

- "API key not configured": ensure `.env.local` exists and `GEMINI_API_KEY` is valid.
- "Failed to generate questions": check internet / API key / rate limits (wait 60s).
- Resume upload fails: ensure file size < 10MB and format is PDF/DOCX. Confirm `public/uploads/resumes/` exists and is writeable in dev.
- Session not persisting: verify `localStorage` is enabled and Redux Persist is configured.

---

## Roadmap

Planned enhancements:
- Video interviews with recording
- Custom question banks by role/department
- More advanced analytics and charts
- Multi-language support
- ATS integration and calendar scheduling
- Team collaboration and multi-user support
- Mobile app (React Native)

---

## Contributing

Contributions are welcome!

- Fork the repo
- Create a feature branch (`git checkout -b feature/amazing-feature`)
- Commit changes (`git commit -m "Add amazing feature"`)
- Push to branch and open a PR

Development guidelines:
- Follow ESLint rules and TypeScript typing
- Add tests and update README for new features

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## Author & Acknowledgments

Author: Your Name  
GitHub: @yourusername  
LinkedIn: your-profile

Acknowledgments:
- Google Gemini AI
- Ant Design
- Vercel
- Next.js team

---

## Security & Privacy

- Resume files are stored locally in `/public/uploads/` (gitignored).
- Candidate data is stored client-side (localStorage). For production use, migrate to a secure database.
- API keys are stored in environment variables (`.env.local`) and should never be committed.
- For production:
  - Use authenticated access (NextAuth or similar)
  - Use cloud storage (S3/Cloudinary) for resumes
  - Add rate limiting, CSRF protection, and HTTPS

