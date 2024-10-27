const express = require('express');
const { withdrawalWithPaystackForFiat, withdrawalWithFlutterwaveForFiat } = require('../controllers/withdrawalForFiat');

const router = express.Router();

// router.post("/withdraw/flutterwave", withdrawalWithFlutterwave);
// router.post("/withdraw/paypal", withdrawWithPaypal);
// router.get("/list/banks", listNigerianBanks);
router.post("/withdraw/flutterwave/fiat", withdrawalWithFlutterwaveForFiat);

module.exports = router;
