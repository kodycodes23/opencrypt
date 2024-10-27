const express = require('express');
const { realCryptoDeposit, getRealCryptoDepositTransactions } = require('../controllers/realcryptodeposit');

const router = express.Router();

router.post('/deposit/realcrypto', realCryptoDeposit);

router.get('/get/realcrypto/history', getRealCryptoDepositTransactions);

module.exports = router;
