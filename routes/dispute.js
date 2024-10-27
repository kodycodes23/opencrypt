const express = require('express');
const { submitDispute } = require('../controllers/dispute');
const router = express.Router();

// Route to submit a dispute
router.post('/dispute', submitDispute);

module.exports = router;
