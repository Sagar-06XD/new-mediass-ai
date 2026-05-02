const express = require('express');
const router = express.Router();
const { fetchDoctors } = require('../controllers/doctorController');

// POST /api/doctor
router.post('/', fetchDoctors);

module.exports = router;
