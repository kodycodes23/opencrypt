const customError = require('../customError.js');
const TransactionHistoryForFiat = require('../models/transactionHistoryForFiat.js');
const TransactionHistory = require('../models/transactionsHistory.js');

// Function to get transaction history records for a user
async function getTransactionHistoryForFiat(req, res, next) {
    try {
        const { userId } = req.params;

        const transactions = await TransactionHistoryForFiat.find({userId}).sort({ createdAt: -1 });
            
        // Respond with transactions and pagination details
        res.status(200).json({
            message:transactions
        });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

async function getTransactionForReceiverTransferForFiat(req,res,next){
    try{
      const {receiverId} = req.body

      const findTransactionTransfer = await TransactionHistoryForFiat.find({receiverIdForTransfer:receiverId})

      if(!findTransactionTransfer || findTransactionTransfer.length === 0) return next(customError('No transfer fiat for receiver'))


      res.json({message: findTransactionTransfer})
    }
    catch(err){
        console.log(err)
        next(customError(err))
    }
}

module.exports = {
    getTransactionHistoryForFiat,
    getTransactionForReceiverTransferForFiat
};
