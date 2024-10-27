const express = require('express');
const { sendEscrowId, getEscrowId } = require('../controllers/escrowId');
const router = express.Router();

// Route to submit a dispute
router.post('/escrowid/send', sendEscrowId);

router.post('/escrowid/get', getEscrowId);

module.exports = router;
