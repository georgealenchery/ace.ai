Welcome to Ace.AI!

“Ace” your interviews with an AI-powered voice simulation.

Ace.AI is what you wish you had when preparing for interviews, both technical and behavioral. It helps users practice interviews in a realistic, conversational setting. Using AI for voice interaction and intelligent feedback, Ace.AI simulates realistic pressures encountered in interviews, and evaluates users on their performance with actionable insights.

--Features--
Voice Based Interviews: Practice interviews using real-time AI voice interaction powered by ElevenLabs.
Behavioral vs. Technical Mode: Simulates both behavioral and technical communication-style interviews.
Dynamic Questioning: AI adapts to your responses and asks relevant follow-ups like a real interviewer.
Automated Feedback and Scoring:
Get structured feedback on:
  - Clarity
  - Technical Accuracy
  - Communication
  - Overall Performance
Quick Performance and Fast, Real Time Experience: Low latency conversation with natural voice responses.

Tech Stack
Frontend:
Next.js
React
Tailwind CSS
ElevenLabs React SDK

Backend:
Node.js
Express
OpenAI API

APIs
ElevenLabs (voice, text-to-speech)
OpenAI (evaluation and feedback)

Setup Instructions

1. Clone the repository

git clone https://github.com/YOUR_USERNAME/ai-interviewer.git
cd ai-interviewer

Backend Setup
cd backend
npm install

Create a .env file:

OPENAI_API_KEY=your_openai_api_key

Run the backend:

npm run dev

Frontend Setup
cd frontend
npm install

Create a .env.local file:

NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
Run the frontend:

npm run dev
Running the App
Frontend: http://localhost:3000
Backend: http://localhost:3001
How It Works
User starts a mock interview
ElevenLabs agent conducts a voice-based interview
User responds via microphone
Transcript is processed
Backend evaluates responses using OpenAI
Structured feedback is returned and displayed
MVP Scope
Voice-based interview flow
5-question interview session
Basic feedback scoring system
Clean UI for interaction
Future Improvements
Advanced analytics dashboard
Role-specific interview tracks
Resume-based personalization
Live coding interview mode
Video + body language analysis

Team:
George Alenchery
Andriana Slisko
Lorenna Solis Rivera
Jackson Bryant

Built in under 48 hours as part of a hackathon challenge using ElevenLabs.


