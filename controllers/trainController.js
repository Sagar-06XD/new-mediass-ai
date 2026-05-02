const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processUploadedFile, processRawText } = require('../services/ragService');

// Ensure temp directory exists
const TEMP_DIR = path.join(__dirname, '../data/temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.pdf', '.txt', '.xlsx', '.xls', '.csv'];
  if (!allowed.includes(ext)) {
    return cb(new Error('Only PDF, TXT, Excel (.xlsx/.xls), and CSV files are allowed'));
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadDocument = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded or invalid file format. Please upload PDF, TXT, Excel (.xlsx/.xls), or CSV.' });
    }

    const userId = req.user.id;
    let chunksProcessed = 0;
    const errors = [];

    for (const file of req.files) {
      try {
        const filePath = file.path;
        const filename = file.originalname;
        const count = await processUploadedFile(userId, filePath, filename);
        chunksProcessed += count || 0;
      } catch (fileError) {
        console.error(`[TrainController] Error processing ${file.originalname}:`, fileError.message);
        errors.push({ file: file.originalname, error: fileError.message });
      }
    }

    if (errors.length > 0 && chunksProcessed === 0) {
      return res.status(500).json({ 
        status: 'error', 
        error: 'All files failed to process',
        details: errors 
      });
    }

    return res.json({ 
      status: 'success', 
      filesProcessed: req.files.length - errors.length, 
      chunks: chunksProcessed,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to process document upload: ' + error.message });
  }
};

/** GET corpus size for authenticated user — drives UI "trained" state */
const trainingStatus = (req, res) => {
  try {
    const userId = req.user.id;
    const corpusPath = path.join(__dirname, `../data/user_${userId}/training_corpus.json`);
    let corpusChunks = 0;
    if (fs.existsSync(corpusPath)) {
      try {
        const arr = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
        corpusChunks = Array.isArray(arr) ? arr.length : 0;
      } catch {
        corpusChunks = 0;
      }
    }
    const hasVectors = fs.existsSync(path.join(__dirname, `../data/user_${userId}/vector_store`));
    return res.json({
      corpusChunks,
      hasVectorStore: hasVectors,
      is_trained: corpusChunks > 0 || hasVectors,
    });
  } catch (error) {
    console.error('Training status Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const trainText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input is required' });
    }

    if (text.trim().length < 10) {
      return res.status(400).json({ error: 'Text is too short. Please provide meaningful content (at least 10 characters).' });
    }

    const userId = req.user.id;
    console.log(`[TrainController] Received ${text.length} chars of text for training from user ${userId}.`);

    const chunksProcessed = await processRawText(userId, text);

    console.log(`[TrainController] Training completed: ${chunksProcessed} chunks stored.`);

    return res.json({ 
      status: 'success', 
      chunks: chunksProcessed,
      message: `Successfully trained on ${chunksProcessed} text chunks. The AI will now use this data when answering questions.`
    });
  } catch (error) {
    console.error('Train Text Error:', error);
    res.status(500).json({ error: 'Failed to process text training: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadDocument,
  trainText,
  trainingStatus,
};
