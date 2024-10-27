const express = require('express');
const { getTransactionHistoryForFiat, getTransactionForReceiverTransferForFiat } = require('../controllers/transactionHistoryForFiat');

const router = express.Router();

router.get('/transaction-history-fiat/:userId', getTransactionHistoryForFiat); // Get transaction history for a user

router.post('/transaction-history-fiat/receiver', getTransactionForReceiverTransferForFiat); // Get transaction history for a user

module.exports = router;
