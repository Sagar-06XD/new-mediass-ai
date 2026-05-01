import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InsightsPanel from './components/InsightsPanel';
import EmergencyAlert from './components/EmergencyAlert';
import TrainingPage from './components/TrainingPage';
import { checkHealthAPI, queryModelAPI, uploadFileAPI } from './services/api';

// Mock structured AI responses
const MOCK_RESPONSES = [
  {
    understanding: "You're experiencing persistent headache with dizziness and neck stiffness. These symptoms together can indicate several conditions ranging from tension headaches to more serious conditions.",
    causes: ["Tension headache from stress or poor posture", "Dehydration or low blood sugar", "Cervicogenic headache originating from neck", "Migraine with associated symptoms", "Rarely: meningitis if fever present"],
    riskLevel: "medium",
    recommendations: ["Rest in a quiet, dark room", "Stay well-hydrated (8+ glasses of water)", "Apply a cold or warm compress to the neck", "Avoid screens for at least 1-2 hours", "Take OTC pain reliever if no contraindications"],
    doctorSuggestion: "Neurologist or General Physician",
    symptoms: ["Persistent headache", "Dizziness", "Neck stiffness"],
    confidence: 78,
    specialist: "Neurologist",
    isEmergency: false,
  },
  {
    understanding: "You're describing severe chest pain radiating to your left arm with shortness of breath and sweating. This is a potentially life-threatening emergency that requires immediate attention.",
    causes: ["Myocardial infarction (heart attack)", "Unstable angina", "Pulmonary embolism", "Aortic dissection", "Severe anxiety/panic attack"],
    riskLevel: "high",
    recommendations: ["CALL EMERGENCY SERVICES (911) IMMEDIATELY", "Chew an aspirin (325mg) if not allergic", "Sit or lie down in a comfortable position", "Loosen tight clothing", "Do NOT drive yourself to the hospital"],
    doctorSuggestion: "Emergency Medicine / Cardiologist",
    symptoms: ["Severe chest pain", "Left arm radiation", "Shortness of breath", "Sweating"],
    confidence: 95,
    specialist: "Cardiologist",
    isEmergency: true,
  },
  {
    understanding: "You're experiencing a runny nose, mild sore throat, and fatigue for the past 3 days. This presentation is typical of a viral upper respiratory infection.",
    causes: ["Common cold (rhinovirus)", "Seasonal influenza", "Allergic rhinitis", "COVID-19 (mild presentation)", "Sinusitis"],
    riskLevel: "low",
    recommendations: ["Get plenty of rest (7-9 hours per night)", "Drink warm fluids (soup, herbal tea)", "Use saline nasal rinse", "Take vitamin C and zinc supplements", "Monitor temperature – seek care if fever > 103°F"],
    doctorSuggestion: "General Physician (if symptoms persist > 10 days)",
    symptoms: ["Runny nose", "Sore throat", "Fatigue"],
    confidence: 88,
    specialist: "General Physician",
    isEmergency: false,
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: "Hello! I'm **Mediass AI**, your intelligent medical assistant. I can help analyze your symptoms and provide structured health insights.\n\nPlease describe what you're experiencing, and I'll provide a detailed medical analysis.",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(true);
  const [mockIndex, setMockIndex] = useState(0);
  const [currentView, setCurrentView] = useState('chat');

  // Check backend health + trained status
  useEffect(() => {
    const check = async () => {
      try {
        const res = await checkHealthAPI();
        setIsTrained(Boolean(res.is_trained) || res.status === 'ok');
      } catch {}
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  // Dark mode class on body
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleSend = async (text) => {
    const query = text || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg = { id: Date.now(), role: 'user', text: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(async () => {
      try {
        let aiMsg;

        if (isTrained) {
          // ── Real backend path ──────────────────────────────────────────────
          try {
            const data = await queryModelAPI(query);
            const intent = data.intent || 'medical';

            if (intent === 'greeting' || intent === 'general' || intent === 'followup') {
              // Plain chat bubble — no structured card, no insights update
              aiMsg = {
                id: Date.now() + 1,
                role: 'ai',
                text: data.text,
                timestamp: new Date(),
              };
              // Do NOT update insights panel for non-medical replies
            } else {
              // Full medical structured response
              const responseData = {
                understanding: data.understanding || data.answer,
                causes: data.causes || ["Based on your medical data"],
                riskLevel: (data.risk || data.urgency || 'low').toLowerCase(),
                recommendations: data.recommendations || ["Consult a specialist if symptoms persist"],
                doctorSuggestion: data.doctor || 'General Physician',
                confidence: Math.round((data.confidence || 0.85) * 100),
                isEmergency: data.emergency || false,
                sources: data.sources || [],
                updated: data.updated || false,
              };
              aiMsg = {
                id: Date.now() + 1,
                role: 'ai',
                structured: responseData,
                timestamp: new Date(),
              };
              setInsights(responseData);
              setIsEmergency(responseData.isEmergency);
            }
          } catch {
            // Fall back to mock if API fails
            const mockData = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
            setMockIndex(i => i + 1);
            aiMsg = {
              id: Date.now() + 1,
              role: 'ai',
              structured: mockData,
              timestamp: new Date(),
            };
            setInsights(mockData);
            setIsEmergency(mockData.isEmergency);
          }
        } else {
          // ── Demo / mock path ───────────────────────────────────────────────
          const mockData = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
          setMockIndex(i => i + 1);
          aiMsg = {
            id: Date.now() + 1,
            role: 'ai',
            structured: mockData,
            timestamp: new Date(),
          };
          setInsights(mockData);
          setIsEmergency(mockData.isEmergency);
        }

        setMessages(prev => [...prev, aiMsg]);
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  const handleNewConsultation = () => {
    setMessages([{
      id: Date.now(),
      role: 'ai',
      text: "Starting a new consultation. Please describe your symptoms or health concerns.",
      timestamp: new Date(),
    }]);
    setInsights(null);
    setIsEmergency(false);
    setCurrentView('chat');
  };

  const handleFileUpload = async (file) => {
    try {
      await uploadFileAPI(file);
      const sysMsg = { id: Date.now(), role: 'system', text: `✅ File "${file.name}" uploaded successfully. You can now train the AI.`, timestamp: new Date() };
      setMessages(prev => [...prev, sysMsg]);
    } catch {
      const sysMsg = { id: Date.now(), role: 'system', text: `❌ Failed to upload "${file.name}". Please try again.`, timestamp: new Date() };
      setMessages(prev => [...prev, sysMsg]);
    }
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Emergency Alert */}
      <AnimatePresence>
        {isEmergency && (
          <EmergencyAlert onDismiss={() => setIsEmergency(false)} darkMode={darkMode} />
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0"
            >
              <Sidebar
                darkMode={darkMode}
                onNewConsultation={handleNewConsultation}
                isTrained={isTrained}
                setCurrentView={setCurrentView}
                currentView={currentView}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {currentView === 'training' ? (
          <div className="flex-1 overflow-y-auto">
            <TrainingPage />
          </div>
        ) : (
          <>
            {/* Chat Window */}
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              inputText={inputText}
              setInputText={setInputText}
              onSend={handleSend}
              onFileUpload={handleFileUpload}
              darkMode={darkMode}
              onToggleDark={() => setDarkMode(d => !d)}
              onToggleSidebar={() => setSidebarOpen(s => !s)}
              onToggleInsights={() => setInsightsPanelOpen(p => !p)}
              sidebarOpen={sidebarOpen}
              isTrained={isTrained}
            />

            {/* Insights Panel */}
            <AnimatePresence>
              {insightsPanelOpen && (
                <motion.div
                  key="insights"
                  initial={{ x: 320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 320, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex-shrink-0"
                >
                  <InsightsPanel insights={insights} darkMode={darkMode} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
