const express = require('express');
const {
    initializeMoneyDepositWithPaystack,
    verifyPaymentWithPaystackWebhook,
    initializeMoneyDepositWithFlutterwave,
    verifyPaymentWithFlutterwaveWebhook,
    initializeMoneyDepositWithPaypal,
    verifyPaymentWithPaypalWebhooK,
    initializeMoneyDepositWithPaystackFoTransferFiat,
    initializeMoneyDepositWithFlutterwaveToTransferFiat,
    initializeMoneyDepositWithPaypalForTransferFiat,
    initializeAndVerifyPaymentWithCoinnetFiat
} = require('../controllers/deposit');

const router = express.Router();

router.post('/paystack/initialize', initializeMoneyDepositWithPaystack);
router.post('/paystack/fiat/initialize', initializeMoneyDepositWithPaystackFoTransferFiat);
router.post('/flutterwave/fiat/initialize', initializeMoneyDepositWithFlutterwaveToTransferFiat);
router.post('/paypal/fiat/initialize', initializeMoneyDepositWithPaypalForTransferFiat);
router.post('/paystack/webhook/verify', verifyPaymentWithPaystackWebhook);
router.post('/flutterwave/initialize', initializeMoneyDepositWithFlutterwave);
router.post('/flutterwave/webhook/verify', verifyPaymentWithFlutterwaveWebhook);
router.post('/paypal/initialize', initializeMoneyDepositWithPaypal);
router.post('/paypal/webhook/verify', verifyPaymentWithPaypalWebhooK);
router.post('/coinnet/fiat/initialize', initializeAndVerifyPaymentWithCoinnetFiat);

module.exports = router;
