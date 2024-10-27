const express = require('express');
const { 
    getTotalSumOfAssetsInFiat, 
    getUserWalletBalances, 
    sendCoinsBetweenUsers 
} = require('../controllers/walletBalance');

const router = express.Router();

router.post('/wallets/balances', getUserWalletBalances);
router.post('/wallets/send/coin', sendCoinsBetweenUsers);
router.post('/wallets/totalbalance', getTotalSumOfAssetsInFiat);

module.exports = router;
