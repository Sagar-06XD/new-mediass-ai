require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const abhaRoutes = require('./routes/abha');
const doctorRoutes = require('./routes/doctor');
const trainRoutes = require('./routes/train');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
// Render / Docker need explicit bind — default can fail health checks on some hosts
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Set().add(new Date().toISOString()).values().next().value}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/abha', authMiddleware, abhaRoutes);
app.use('/api/doctor', authMiddleware, doctorRoutes);
app.use('/api/train', authMiddleware, trainRoutes);

const path = require('path');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Doctor AI backend is running',
    frontend: 'http://localhost:5176',
    health: '/health',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'running' });
});

// Serve the compiled React frontend statically (Uncomment when deploying to production)
// app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve index.html for React Router
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
  console.log(`- Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`- ABHA API: http://localhost:${PORT}/api/abha/link`);
  console.log(`- Frontend: http://localhost:${PORT}`);
});
