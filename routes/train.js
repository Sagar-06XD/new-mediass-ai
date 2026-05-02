const express = require('express');
const router = express.Router();
const { upload, uploadDocument, trainText, trainingStatus } = require('../controllers/trainController');

// GET /api/train/status
router.get('/status', trainingStatus);

// POST /api/train/upload
router.post('/upload', (req, res, next) => {
  upload.array('files')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, uploadDocument);

// POST /api/train/process (dummy endpoint since uploadDocument processes it instantly)
router.post('/process', (req, res) => {
  // Currently processing happens async in uploadDocument, so just return success
  res.json({ status: "success", message: "Training initiated." });
});

// POST /api/train/text
router.post('/text', trainText);

module.exports = router;
