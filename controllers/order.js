const customError = require("../customError.js");
const Orders = require("../models/orders.js");
const Wallets = require("../models/wallets.js");

// Function to post a new order to users
async function postOrderToUsers(req, res, next) {
    try {
        const { userId, coin, paymentType, limits, sellersName, sellersImage, quantity, sellersRate } = req.body;
        
        // Check if the user has sufficient funds
        const getUserWallet = await Wallets.findOne({ userId });

        if (!getUserWallet || getUserWallet.balances[coin] < quantity) {
            return next(customError('You have insufficient funds for the sell'));
        }
    
        // Create a new order
        const newOrder = new Orders({
            userId,
            coin,
            limits,
            quantity,
            sellersRate,
            sellersName,
            sellersImage,
            paymentType,
            isUserOnline: true
        });
        
        // Save the order to the database
        await newOrder.save();
        
        // Send a response back to the client
        res.status(201).json({
            message: "Order successfully created",
            order: newOrder
        });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Function to get all orders from the database
async function getAllOrdersFromDb(req, res, next) {
    try {
        const getAllOffers = await Orders.find({});
        // console.log(getAllOffers);

        return res.json({ message: getAllOffers });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}


// Function to get offers based on the selected coin or payment method
async function getOffersBasedOnSelectedCoin(req, res, next) {
    try {
        const { coin, isPaymentMethod = false, paymentType } = req.body;

        let fetchOffers;

        if (isPaymentMethod) {
            fetchOffers = await Orders.find({ paymentType });
        } else {
            fetchOffers = await Orders.find({ coin });
        }

        // console.log('sellers', fetchOffers);

        return res.json({ message: fetchOffers });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}


module.exports = {
    postOrderToUsers,
    getAllOrdersFromDb,
    getOffersBasedOnSelectedCoin
};
