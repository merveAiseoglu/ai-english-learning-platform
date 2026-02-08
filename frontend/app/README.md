# 🎓 AI Powered English Learning Platform

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

An interactive web application for learning English with **AI-powered features**, built with **Angular 18** and **Node.js**.

![Banner](docs/images/banner.png)

## 🚀 Features

- **📚 Vocabulary Learning** - Spaced repetition flashcards with progress tracking
![Vocabulary](docs/images/vocabulary.png)
- **🎧 Listening Practice** - Audio exercises with playback speed control
![Listening](docs/images/listening.png)
- **✍️ Writing Practice** - AI grammar correction and writing prompts via GPT-3.5
![Writing](docs/images/writing.png)
- **🗣️ Speaking Practice** - Uses OpenAI Whisper for high-accuracy speech-to-text conversion and compares user input with target phrases.
![Speaking](docs/images/speaking.png)
- **📖 Reading Comprehension** - Interactive texts with instant word translation
![Reading](docs/images/reading.png)
- **📝 Grammar Lessons** - Structured grammar topics with interactive exercises
![Grammar](docs/images/grammar.png)
- **📊 Progress Dashboard** - Track your daily statistics and learning streak
![Dashboard](docs/images/dashboard.png)
## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 18 (Standalone Components)
- **State Management:** Signals & RxJS
- **Language:** TypeScript
- **Styling:** SCSS / CSS3

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **AI Integration:** OpenAI API (GPT-3.5 Turbo + Whisper)
- **Media Processing:** FFmpeg

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API Key

### 1. Frontend Setup
```bash
cd frontend
npm install
ng serve
```

Access at: `http://localhost:4200`

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

Start the server:

```bash
node server.cjs
```

Backend runs on: `http://localhost:5000`

## 📁 Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/          # Main route components
│   │   │   ├── services/       # API and business logic
│   │   │   ├── shared/         # Reusable UI components
│   │   │   └── models/         # TypeScript interfaces
│   │   └── assets/             # Static files & images
│   └── package.json
│
└── backend/
    ├── server.cjs              # Express server entry point
    ├── uploads/                # Temporary audio storage
    ├── .env                    # Environment variables (GitIgnored)
    └── package.json
```

## 🎯 Usage

1. Start Backend: `node server.cjs`
2. Start Frontend: `ng serve`
3. Open Browser: `http://localhost:4200`
4. **Explore Modules:** Select Vocabulary, Listening, Writing, Speaking, Reading, or Grammar
5. **Start Learning!**

## 🔒 Security Notes

- ⚠️ **Never commit** your `.env` file to Git
- ⚠️ API keys are handled securely in the backend only
- ⚠️ Ensure `environment.ts` (if used for keys) is added to `.gitignore`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Author

- **Merve Aişeoğlu** - *Initial work & Full Stack Development*

