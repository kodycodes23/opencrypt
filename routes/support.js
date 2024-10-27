const express = require('express');
const { sendMessageToCustomerCare } = require('../controllers/support');

const router = express.Router();

router.post('/support',sendMessageToCustomerCare);

module.exports = router;
