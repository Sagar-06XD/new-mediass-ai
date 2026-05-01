require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const abhaRoutes = require('./routes/abha');
const doctorRoutes = require('./routes/doctor');
const trainRoutes = require('./routes/train');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/abha', abhaRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/train', trainRoutes);

const path = require('path');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'running' });
});

// Serve the compiled React frontend statically (Uncomment when deploying to production)
// app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve index.html for React Router
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`- Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`- ABHA API: http://localhost:${PORT}/api/abha/link`);
  console.log(`- Frontend: http://localhost:${PORT}`);
});
