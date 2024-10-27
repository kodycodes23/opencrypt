const express = require('express');
const { createTransactionHistory, getTransactionHistory } = require('../controllers/transactionHistory');

const router = express.Router();

router.post('/transaction-history', createTransactionHistory); // Record a transaction

router.get('/transaction-history/:userId', getTransactionHistory); // Get transaction history for a user

module.exports = router;
