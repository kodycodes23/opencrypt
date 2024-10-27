const express = require('express');
const { getUserDocumentsAndInfo, updateUserDocumentsAndInfo } = require('../controllers/kyc');

const router = express.Router();

router.post('/kyc/send', getUserDocumentsAndInfo);

router.post('/kyc/update', updateUserDocumentsAndInfo)

module.exports = router;
