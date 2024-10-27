const express = require('express');

const { sendFiatBetweenUsers, getUserWalletBalances, convertCurrencies } = require('../controllers/fiatWallet');

const router = express.Router();

router.post('/wallets/fiat/balances', getUserWalletBalances);
router.post('/wallets/send/fiat', sendFiatBetweenUsers);
router.post('/wallets/convert/fiat', convertCurrencies);

module.exports = router;

