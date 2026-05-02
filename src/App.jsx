import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InsightsPanel from './components/InsightsPanel';
import EmergencyAlert from './components/EmergencyAlert';
import TrainingPage from './components/TrainingPage';
import AuthPage from './components/AuthPage';
import {
  checkHealthAPI,
  fetchTrainingStatusAPI,
  queryModelAPI,
  resetChatSession,
  uploadFileAPI,
  getChatSessionId,
  setChatSessionId,
} from './services/api';
import {
  loadConsultationStore,
  saveConsultationStore,
  upsertConsultationInStore,
  reviveMessages,
  summariesFromStore,
  latestInsightsFromMessages,
} from './utils/consultationStorage';

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
    doctors: [
      { name: "Dr. Sarah Chen", specialty: "Neurologist", rating: 4.8, distance: "0.5 km" },
      { name: "Dr. James Wilson", specialty: "Neurologist", rating: 4.9, distance: "1.2 km" }
    ],
    isEmergency: false,
  },
  {
    understanding: "You're describing severe chest pain radiating to your left arm with shortness of breath and sweating. This is a potentially life-threatening emergency that requires immediate attention.",
    causes: ["Myocardial infarction (heart attack)", "Unstable angina", "Pulmonary embolism", "Aortic dissection", "Severe anxiety/panic attack"],
    riskLevel: "high",
    recommendations: ["CALL EMERGENCY SERVICES (108) IMMEDIATELY", "Chew an aspirin (325mg) if not allergic", "Sit or lie down in a comfortable position", "Loosen tight clothing", "Do NOT drive yourself to the hospital"],
    doctorSuggestion: "Emergency Medicine / Cardiologist",
    symptoms: ["Severe chest pain", "Left arm radiation", "Shortness of breath", "Sweating"],
    confidence: 95,
    specialist: "Cardiologist",
    doctors: [
      { name: "Dr. Robert Vance", specialty: "Cardiologist", rating: 4.9, distance: "0.3 km" },
      { name: "City Heart Center", specialty: "Emergency Cardiology", rating: 4.8, distance: "0.9 km" }
    ],
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

const DEFAULT_GREETING_TEXT =
  "Hello! I'm MeAssist AI, an AI medical assistant. I can help organize symptoms and provide general health guidance, but I am not a real doctor and this is not a medical diagnosis.\n\nPlease describe what you're experiencing, and I'll provide structured health insights.";

const makeDefaultGreeting = () => ({
  id: Date.now(),
  role: 'ai',
  text: DEFAULT_GREETING_TEXT,
  timestamp: new Date(),
});

const makeNewConsultGreeting = () => ({
  id: Date.now(),
  role: 'ai',
  text: "Starting a new consultation. Please describe your symptoms or health concerns.",
  timestamp: new Date(),
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [darkMode, setDarkMode] = useState(false);
  const [consultationId, setConsultationId] = useState(null);
  const [consultationSummaries, setConsultationSummaries] = useState([]);
  const [messages, setMessages] = useState([makeDefaultGreeting()]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [insights, setInsights] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(true);
  const [mockIndex, setMockIndex] = useState(0);
  const [currentView, setCurrentView] = useState('chat');

  // Backend health + real training corpus / vector-store status (when logged in)
  useEffect(() => {
    const check = async () => {
      try {
        const res = await checkHealthAPI();
        if (!isAuthenticated || !localStorage.getItem('token')) {
          setIsTrained(Boolean(res.is_trained) || res.status === 'ok');
          return;
        }
        try {
          const st = await fetchTrainingStatusAPI();
          setIsTrained(Boolean(st?.is_trained));
        } catch {
          setIsTrained(Boolean(res.is_trained) || res.status === 'ok');
        }
      } catch {
        setIsTrained(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Dark mode class on body
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  /** Load or create persisted consultations for this user */
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;

    const store = loadConsultationStore(uid);
    if (!store.orderedIds.length) {
      const cid = crypto.randomUUID();
      const msgs = [makeDefaultGreeting()];
      upsertConsultationInStore(store, { id: cid, sessionId: getChatSessionId(), messages: msgs });
      store.activeId = cid;
      saveConsultationStore(uid, store);
      setConsultationId(cid);
      setMessages(msgs);
      setConsultationSummaries(summariesFromStore(store));
      return;
    }

    const active =
      store.activeId && store.byId[store.activeId] ? store.activeId : store.orderedIds[0];
    const entry = store.byId[active];
    setChatSessionId(entry.sessionId);
    setConsultationId(active);
    const revived = reviveMessages(entry.messages);
    setMessages(revived);
    const ins = latestInsightsFromMessages(revived);
    setInsights(ins);
    setIsEmergency(Boolean(ins?.isEmergency));
    setConsultationSummaries(summariesFromStore(store));
  }, [user?.id]);

  /** Keep localStorage and sidebar list in sync with the active consultation */
  useEffect(() => {
    const uid = user?.id;
    if (!uid || !consultationId) return;

    const store = loadConsultationStore(uid);
    upsertConsultationInStore(store, {
      id: consultationId,
      sessionId: getChatSessionId(),
      messages,
    });
    store.activeId = consultationId;
    saveConsultationStore(uid, store);
    setConsultationSummaries(summariesFromStore(store));
  }, [messages, consultationId, user?.id]);

  const handleSend = async (text) => {
    const query = text || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg = { id: Date.now(), role: 'user', text: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setProcessStatus('Analyzing symptoms...');

    // Dynamic process status sequence
    const statusSequence = [
      { text: 'Analyzing symptoms...', delay: 0 },
      { text: 'Consulting local medical database...', delay: 1500 },
      { text: 'Searching for nearby specialists...', delay: 3000 },
      { text: 'Generating diagnostic report...', delay: 4500 }
    ];

    statusSequence.forEach(item => {
      setTimeout(() => {
        setIsLoading(currentLoading => {
          if (currentLoading) setProcessStatus(item.text);
          return currentLoading;
        });
      }, item.delay);
    });

    try {
      let aiMsg;

      if (!user) {
        // Mock delay
        await new Promise(r => setTimeout(r, 2000));
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
      } else {
        try {
          const data = await queryModelAPI(query);
          const intent = data.intent || 'medical';

          if (intent === 'greeting' || intent === 'general' || intent === 'followup') {
            aiMsg = {
              id: Date.now() + 1,
              role: 'ai',
              text: data.text,
              timestamp: new Date(),
            };
          } else {
            const responseData = {
              understanding: data.understanding || data.text || data.answer,
              causes: data.causes || [],
              riskLevel: (data.risk || data.urgency || 'low').toLowerCase(),
              recommendations: data.recommendations || [],
              specialist: data.doctor || 'General Physician',
              doctors: data.doctors || [],
              confidence: Math.round((data.confidence ?? (data.type === 'chat' ? 0.75 : 0.85)) * 100),
              isEmergency: data.emergency || false,
              sources: data.sources || [],
              symptoms: data.symptoms || [],
              updated: data.updated || false,
            };
            aiMsg = {
              id: Date.now() + 1,
              role: 'ai',
              structured: responseData,
              text: data.text,
              timestamp: new Date(),
            };
            setInsights(responseData);
            setIsEmergency(responseData.isEmergency);
          }
        } catch (error) {
          console.error('Chat API Error:', error);
          const status = error.response?.status;
          const errorMsg = error.response?.data?.error || error.message;
          
          aiMsg = {
            id: Date.now() + 1,
            role: 'ai',
            text: status === 401 
              ? 'Your session has expired. Please log out and log back in.' 
              : `Backend Error: ${errorMsg}. Please ensure the server is running on port 5001.`,
            timestamp: new Date(),
          };
        }
      }

      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
      setProcessStatus('');
    }
  };

  const handleNewConsultation = () => {
    const uid = user?.id;
    if (uid && consultationId) {
      const store = loadConsultationStore(uid);
      upsertConsultationInStore(store, {
        id: consultationId,
        sessionId: getChatSessionId(),
        messages,
      });
      const newSid = resetChatSession();
      const nid = crypto.randomUUID();
      const fresh = [makeNewConsultGreeting()];
      upsertConsultationInStore(store, {
        id: nid,
        sessionId: newSid,
        messages: fresh,
      });
      store.activeId = nid;
      saveConsultationStore(uid, store);
      setConsultationId(nid);
      setMessages(fresh);
      setConsultationSummaries(summariesFromStore(store));
    } else {
      resetChatSession();
      setMessages([makeNewConsultGreeting()]);
    }
    setInsights(null);
    setIsEmergency(false);
    setCurrentView('chat');
  };

  const handleSelectConsultation = (id) => {
    const uid = user?.id;
    if (!uid || id === consultationId) return;

    const store = loadConsultationStore(uid);
    const entry = store.byId[id];
    if (!entry) return;

    if (consultationId) {
      upsertConsultationInStore(store, {
        id: consultationId,
        sessionId: getChatSessionId(),
        messages,
      });
    }

    setChatSessionId(entry.sessionId);
    setConsultationId(id);
    const revived = reviveMessages(entry.messages);
    setMessages(revived);
    const ins = latestInsightsFromMessages(revived);
    setInsights(ins);
    setIsEmergency(Boolean(ins?.isEmergency));
    store.activeId = id;
    saveConsultationStore(uid, store);
    setConsultationSummaries(summariesFromStore(store));
    setCurrentView('chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    resetChatSession();
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

  if (!isAuthenticated) {
    return <AuthPage onLogin={(userData) => {
      setIsAuthenticated(true);
      setUser(userData);
    }} />;
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0a0f1d] text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-[0.07] ${darkMode ? 'bg-blue-500' : 'bg-blue-300'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-[0.05] ${darkMode ? 'bg-purple-500' : 'bg-purple-300'}`} />
      </div>

      {/* Emergency Alert */}
      <AnimatePresence>
        {isEmergency && (
          <EmergencyAlert onDismiss={() => setIsEmergency(false)} darkMode={darkMode} />
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative z-10">
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
                onLogout={handleLogout}
                userEmail={user?.email}
                consultations={consultationSummaries}
                activeConsultationId={consultationId}
                onSelectConsultation={handleSelectConsultation}
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
            <div className="flex-1 flex flex-col min-w-0">
               {/* Process Indicator Bar */}
               <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`px-6 py-2 flex items-center justify-center gap-3 border-b overflow-hidden ${darkMode ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent"
                    />
                    <span className={`text-xs font-bold tracking-wide uppercase ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {processStatus}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

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
            </div>

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
