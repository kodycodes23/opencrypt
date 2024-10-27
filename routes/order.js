const express = require('express');
const {
    postOrderToUsers,
    getAllOrdersFromDb,
    getOffersBasedOnSelectedCoin
} = require('../controllers/order');

const router = express.Router();

// Route to create a new order
router.post('/orders/post', postOrderToUsers);

// Route to get all orders
router.get('/orders/get', getAllOrdersFromDb);

// Route to get offers based on selected coin
router.post('/orders/get/offers', getOffersBasedOnSelectedCoin);

module.exports = router;
