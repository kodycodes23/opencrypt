const express = require('express');
const {
    createEscrowOnOfferClick,
    buyerVerifiesMoneyIsTransferred,
    sellerVerifiesPayment,
    getEscrowCurrentStatus
} = require('../controllers/escrow');

const router = express.Router();

// Route to create escrow when an offer is clicked
router.post('/escrow/create', createEscrowOnOfferClick);

// Route to complete an escrow
router.post('/escrow/complete', sellerVerifiesPayment);

// Route to pend an escrow
router.post('/escrow/pend', buyerVerifiesMoneyIsTransferred);

// Route to check the current status of an escrow
router.post('/escrow/check/status', getEscrowCurrentStatus);

module.exports = router;
