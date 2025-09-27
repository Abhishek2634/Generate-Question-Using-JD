# 🤖 AI-Powered Interview Assistant
=================================

> A modern, intelligent interview platform built with Next.js that conducts automated technical interviews for full-stack React/Node.js positions.



*   **Interviewee Tab**: Interactive interview experience with real-time timer and progress tracking
    
*   **Interviewer Dashboard**: Comprehensive candidate management and analytics
    

🎯 **Smart Interview Flow**
---------------------------

*   **Resume Upload**: Automatic parsing of PDF/DOCX files to extract candidate information
    
*   **Dynamic Question Generation**: AI-powered question selection for React/Node.js roles
    
*   **Timed Questions**: Progressive difficulty with specific time limits
    
    *   Easy: 20 seconds (JavaScript fundamentals)
        
    *   Medium: 60 seconds (React/Node.js concepts)
        
    *   Hard: 120 seconds (Advanced full-stack topics)
        

🧠 **AI-Powered Assessment**
----------------------------

*   **Intelligent Scoring**: Advanced algorithm analyzing answer quality, technical keywords, and completeness
    
*   **Automated Summaries**: Comprehensive performance evaluation with actionable feedback
    
*   **Performance Classification**: Excellent, Good, Fair, Poor ratings with detailed breakdowns
    

💾 **Session Management**
-------------------------

*   **Persistent Storage**: Redux Persist ensures no data loss on page refresh
    
*   **Welcome Back Modal**: Seamless session resumption for interrupted interviews
    
*   **Real-time Progress**: Live timer with visual progress indicators
    

📊 **Analytics & Export**
-------------------------

*   **Candidate Dashboard**: Sortable table with search and filtering capabilities
    
*   **Performance Statistics**: Average scores, completion rates, and duration tracking
    
*   **CSV Export**: Comprehensive data export including questions, answers, and scores
    
*   **Detailed View**: Individual candidate analysis with complete interview history
    

### 🚀 Quick Start
--------------

### Prerequisites
-------------

*   Node.js 18.0.0 or higher
    
*   npm or yarn package manager
    

### Installation
------------

**Clone the repository**
    
```bash
git clone https://github.com/Abhishek2634/Swipe--YC-S21--SDE-Intern-Assignment.git
```

**Install dependencies**
```bash
    npm install
```
    

**Start development server**
```bash
    npm run dev
```


**Open your browser**Navigate to http://localhost:3000
    

### 🛠️ Tech Stack
--------------

**Frontend Framework**
----------------------

*   **Next.js 15.0.0**: React framework with App Router
    
*   **TypeScript**: Type-safe development
    
*   **Ant Design 5.21+**: Professional UI component library
    

**State Management**
--------------------

*   **Redux Toolkit**: Modern Redux with simplified setup
    
*   **Redux Persist**: Session persistence across browser sessions
    

**File Processing**
-------------------

*   **PDF Parse**: Resume parsing from PDF files
    
*   **Mammoth**: DOCX file processing support
    

**Development Tools**
---------------------

*   **ESLint**: Code quality and consistency
    
*   **PostCSS**: CSS processing and optimization
    

### 🎮 Usage Guide
--------------

**For Candidates (Interviewee Tab)**
------------------------------------

1.  **Upload Resume** (Optional)
    
    *   Drag and drop PDF/DOCX file
        
    *   System automatically extracts name, email, and phone
        
2.  **Complete Profile**
    
    *   Fill in any missing information
        
    *   Click "Start Interview"
        
3.  **Take Interview**
    
    *   Answer 6 questions progressively (Easy → Medium → Hard)
        
    *   Each question has a specific time limit
        
    *   Progress bar shows remaining time
        
    *   Automatic submission when time expires
        
4.  **View Results**
    
    *   Instant AI-generated score and feedback
        
    *   Detailed performance summary
        

**For Interviewers (Dashboard Tab)**
------------------------------------

1.  **View Candidates**
    
    *   Sortable list of all completed interviews
        
    *   Search by name, email, or phone
        
    *   Filter by performance level
        
2.  **Analyze Performance**
    
    *   Detailed candidate view with Q&A breakdown
        
    *   Individual question scoring
        
    *   Performance statistics
        
3.  **Export Data**
    
    *   Download comprehensive CSV reports
        
    *   Include all interview data and analytics
        

### ⚙️ Configuration
----------------

**Question Customization**
--------------------------

Modify src/lib/services/aiService.ts to:

*   Add new question categories
    
*   Adjust difficulty levels
    
*   Change time limits
    
*   Update scoring criteria
    

**UI Customization**
--------------------

Update src/app/globals.css for:

*   Color schemes
    
*   Typography
    
*   Component styling
    
*   Responsive breakpoints
    

### 🔧 API Routes
-------------

**POST /api/parse-resume**
--------------------------

*   **Purpose**: Extract information from uploaded resume files
    
*   **Accepts**: PDF/DOCX files via FormData
    
*   **Returns**: JSON object with name, email, phone
    

### 📊 Performance & Analytics
--------------------------

**Scoring Algorithm**
---------------------

*   **Base Score**: Answer length and word count analysis
    
*   **Technical Keywords**: Bonus points for relevant terminology
    
*   **Difficulty Adjustment**: Weighted scoring based on question complexity
    
*   **Final Calculation**: Normalized to 0-100 scale
    

**Performance Metrics**
-----------------------

*   **Duration Tracking**: Interview completion time in seconds
    
*   **Success Rates**: Percentage of completed vs. abandoned interviews
    
*   **Average Scores**: Aggregate performance across all candidates
    
*   **Trend Analysis**: Performance patterns over time
    

### 🚀 Deployment
-------------

**Vercel (Recommended)**
------------------------

1.  Fork the repository
    
2.  Create a feature branch (git checkout -b feature/amazing-feature)
    
3.  Commit your changes (git commit -m 'Add amazing feature')
    
4.  Push to the branch (git push origin feature/amazing-feature)
    
5.  Open a Pull Request
    

### 📝 License
----------

This project is licensed under the MIT License - see the [LICENSE](https://www.perplexity.ai/search/LICENSE) file for details.

### 🐛 Known Issues
---------------

*   Resume parsing accuracy depends on file formatting
    
*   Session persistence requires localStorage support
    
*   PDF parsing may timeout on very large files
    

### 🔮 Future Enhancements
----------------------

*    Video interview capability
    
*    Custom question sets per role
    
*    Advanced analytics dashboard
    
*    Multi-language support
    
*    Integration with ATS systems
    
*    Real-time collaborative interviews
    

### 📞 Support
----------

For questions and support:

*   Create an [issue](https://github.com/yourusername/ai-interview-assistant/issues)
    
*   Email: [support@yourcompany.com](mailto:abhishek.fst1@gmail.com)
    

**Built with ❤️ for modern recruitment needs**