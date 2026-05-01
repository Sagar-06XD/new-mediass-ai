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
  if (ext !== '.pdf' && ext !== '.txt') {
    return cb(new Error('Only PDF and TXT files are allowed'));
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
      return res.status(400).json({ error: 'No files uploaded or invalid file format. Please upload PDF or TXT.' });
    }

    // Process all uploaded files asynchronously
    for (const file of req.files) {
      const filePath = file.path;
      const filename = file.originalname;
      processUploadedFile(filePath, filename);
    }

    // Return immediate response as requested
    return res.json({ status: "training started", filesProcessed: req.files.length });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to process document upload' });
  }
};

const trainText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const chunksProcessed = await processRawText(text);

    return res.json({ status: "success", chunks: chunksProcessed });
  } catch (error) {
    console.error('Train Text Error:', error);
    res.status(500).json({ error: 'Failed to process text training' });
  }
};

module.exports = {
  upload,
  uploadDocument,
  trainText
};
