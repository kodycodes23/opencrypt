const express = require('express');
const { 
    withdrawWithPaypal, 
    listNigerianBanks, 
    withdrawalWithFlutterwave, 
    withdrawalWithPaystack, 
    storeBankDetails,
    getBankDetails
} = require('../controllers/withdrawal');

const router = express.Router();

router.post("/withdraw/flutterwave", withdrawalWithFlutterwave);
router.post("/withdraw/paypal", withdrawWithPaypal);
router.get("/list/banks", listNigerianBanks);
router.post("/withdraw/paystack", withdrawalWithPaystack);

router.post('/store/bank/details', storeBankDetails)

router.get('/get/bank/details/:userId', getBankDetails)

module.exports = router;
