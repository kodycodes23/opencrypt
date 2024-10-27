const express = require('express');
const { convertCoin } = require('../controllers/exchange');

const router = express.Router();

router.post('/exchange', convertCoin);

module.exports = router;
