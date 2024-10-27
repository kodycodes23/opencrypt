const customError = require('../customError.js');
const TransactionHistory = require('../models/transactionsHistory.js');

// Function to create a new transaction history record
async function createTransactionHistory(req, res, next) {
    try {
        const { userId, transactionType, asset, amount, status, details } = req.body;

        // Create a new transaction history entry
        const newTransaction = new TransactionHistory({
            userId,
            transactionType,
            asset,
            amount,
            status,
            details,
        });

        await newTransaction.save();

        // Respond with success message and the new transaction record
        res.status(201).json({ message: "Transaction history recorded successfully", transaction: newTransaction });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Function to get transaction history records for a user
async function getTransactionHistory(req, res, next) {
    try {
        const { userId } = req.params;
        const { transactionType, status, limit = 10, page = 1 } = req.query;

        // Build the query object
        const query = { userId };

        if (transactionType) {
            query.transactionType = transactionType;
        }

        if (status) {
            query.status = status;
        }

        // Retrieve the transactions with pagination
        const transactions = await TransactionHistory.find(query)
            .limit(parseInt(limit, 10))
            .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
            .sort({ createdAt: -1 });

        // Count total number of documents matching the query
        const count = await TransactionHistory.countDocuments(query);

        // Respond with transactions and pagination details
        res.status(200).json({
            transactions,
            totalPages: Math.ceil(count / parseInt(limit, 10)),
            currentPage: parseInt(page, 10)
        });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

module.exports = {
    createTransactionHistory,
    getTransactionHistory
};
