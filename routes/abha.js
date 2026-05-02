const express = require('express');
const router = express.Router();
const { linkUserABHA, fetchUserProfile } = require('../controllers/abhaController');

// POST /api/abha/link
router.post('/link', linkUserABHA);

// GET /api/abha/profile/:userId
router.get('/profile/:userId', fetchUserProfile);

module.exports = router;
