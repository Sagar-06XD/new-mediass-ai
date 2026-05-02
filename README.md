# MediAssist AI 🩺✨

**MediAssist AI** is a state-of-the-art, production-ready medical diagnostic assistant. It combines the power of **Gemini 2.5 Flash** with a local **Retrieval-Augmented Generation (RAG)** pipeline to provide structured, source-attributed medical insights.

![MediAssist AI Banner](https://via.placeholder.com/1200x400/0a0f1d/ffffff?text=MediAssist+AI+Diagnostics)

## 🚀 Features

- **Hybrid Intelligence**: Combines local medical documents (PDFs, raw text) with Gemini's broad medical knowledge.
- **Smart Triage**: Advanced symptom analysis with risk assessment (Low, Medium, High).
- **Dynamic Diagnostics**: Real-time process tracking and structured medical reporting.
- **Specialist Locator**: Automatically identifies and suggests nearby medical specialists based on symptoms.
- **RAG-Powered Learning**: Train the AI on your own medical research or personal health records.
- **Premium UI/UX**: Futuristic dark mode, fluid animations (Framer Motion), and a responsive dashboard.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, SQLite, LangChain.
- **AI/ML**: Google Gemini 2.5 Flash, Google Generative AI Embeddings.

## 📦 Project Structure

```text
├── backend/                # Express server & AI services
│   ├── controllers/        # Request handlers
│   ├── data/               # SQLite DB & training corpus (gitignored)
│   ├── rag/                # Vector store & retrieval logic
│   ├── scripts/            # Training & ingestion scripts
│   ├── services/           # AI, Doctor Search, and Extraction services
│   └── .env.example        # Environment template
├── frontend/               # React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── services/       # API integration
│   │   └── utils/          # Storage & helpers
└── .gitignore              # Project-wide ignore rules
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- Gemini API Key ([Get one here](https://ai.google.dev/))
- Google Places API Key (Optional, for doctor search)

### Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Add your API keys to the `.env` file.
5. Start the server:
   ```bash
   npm start
   ```

### Setup Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔐 Security & Privacy

MediAssist AI is designed with privacy in mind. User data is stored locally in SQLite, and medical training documents remain within your personal corpus.

## ⚠️ Disclaimer

*This application is for educational and informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.*

---
Developed with ❤️ by [Your Name/GitHub Handle]
