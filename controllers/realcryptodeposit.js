const customError = require("../customError.js");
const Dispute = require("../models/dispute.js");
const RealCryptoDesposit = require("../models/realcryptodeposit.js");

async function realCryptoDeposit(req, res, next) {
    try {
        const { userId,asset, coinAmount } = req.body;

        if (!userId || !asset || !coinAmount) {
            return next(customError('Some parameters are missing'));
        }

        const realCrypto = new RealCryptoDesposit({
            userId,
            asset,
            coinAmount,
            details:`User with the id ${userId} made a deposit of ${coinAmount} worth of ${asset}. Confirm or reject`,
            status:'pending'
        });

        await realCrypto.save();

        return res.json({ message: realCrypto });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

async function getRealCryptoDepositTransactions(req, res, next) {
    try {
        const transactions = await TransactionHistoryForFiat.find({}).sort({ createdAt: -1 });
            
        // Respond with transactions and pagination details
       return res.status(200).json({
            message:transactions
        });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}


module.exports = {
realCryptoDeposit,
getRealCryptoDepositTransactions
};
