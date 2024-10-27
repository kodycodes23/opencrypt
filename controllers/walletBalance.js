const { v4 } = require("uuid");
const customError = require("../customError.js");
const TransactionHistory = require("../models/transactionsHistory.js");
const Wallets = require("../models/wallets.js");

// Send coins between users
async function sendCoinsBetweenUsers(req, res, next) {
    try {
        const { userId, receiverId, amount, coin, note, } = req.body;

        const [checkIfUserWalletExists, checkIfReceiverWalletExists] = await Promise.all([
            Wallets.findOne({ userId }),
            Wallets.findOne({ userId: receiverId })
        ]);

        console.log(coin);
        console.log(checkIfUserWalletExists);

        if (!checkIfUserWalletExists) return next(customError('Sender wallet not found'));
        if (!checkIfReceiverWalletExists) return next(customError('Receiver wallet not found'));

        // Check if the coin exists in the user's balances
        if (!checkIfUserWalletExists.balances[coin]) {
            return next(customError(`Sender does not have any ${coin}`));
        }

        if (checkIfUserWalletExists.balances[coin] < amount) {
            return next(customError('Insufficient balance'));
        }

        const [updateUserWallet, updateReceiverWallet] = await Promise.all([
            Wallets.findByIdAndUpdate(
                checkIfUserWalletExists._id,
                {
                    $set: {
                        [`balances.${coin}`]: checkIfUserWalletExists.balances[coin] - amount
                    }
                },
                {
                    new: true,
                    runValidators: true
                }),
            Wallets.findByIdAndUpdate(
                checkIfReceiverWalletExists._id,
                {
                    $set: {
                        [`balances.${coin}`]: (checkIfReceiverWalletExists.balances[coin] || 0) + amount
                    }
                },
                {
                    new: true,
                    runValidators: true
                })
        ]);

        console.log(updateUserWallet);
        console.log('user');
        console.log(updateReceiverWallet);
        console.log('friend');
        receiverId, amount, coin

    const newTransaction = new TransactionHistory({
        userId,
        transactionType: 'send',
        asset: coin,
        amountInFiat: amount,
        status:'completed',
        details:`sent coin to user - ${receiverId}`,
        txId: v4(),
        coinAmount: amount,
        rId: v4()
    });

    await newTransaction.save()
  
        return res.json({ message: 'Sent successfully' });

    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Get total sum of assets in fiat
async function getTotalSumOfAssetsInFiat(req, res, next) {
    try {
        const { userId, btcDollarRate, ethDollarRate, bnbDollarRate, usdcDollarRate } = req.body;

        console.log(userId, 'total sum')

        console.log(btcDollarRate, ethDollarRate, bnbDollarRate, usdcDollarRate);
        const walletBalances = await Wallets.findOne({ userId });

        if (!walletBalances) {
            return next(customError('Wallet not found'));
        }

        const btc = (walletBalances.balances['BTC'] || 0) * btcDollarRate;
        const eth = (walletBalances.balances['ETH'] || 0) * ethDollarRate;
        const bnb = (walletBalances.balances['BNB'] || 0) * bnbDollarRate;
        const usdc = (walletBalances.balances['USDC'] || 0) * usdcDollarRate;

        const getSum = btc + eth + bnb + usdc;

        console.log(getSum);
        return res.json({ message: getSum });

    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Get user wallet balances
async function getUserWalletBalances(req, res, next) {
    try {
        const { userId } = req.body;

        const response = await Wallets.findOne({ userId });

        console.log(response, 'old wallet');
        if (!response) {
            const newWallet = new Wallets({
                userId: userId,
                balances: {
                    BTC: 0,
                    ETH: 0,
                    USDC: 0,
                    BNB: 0
                }
            });
            await newWallet.save();

            console.log('new wallet', newWallet);

            return res.json({ message: newWallet.balances });
        }

        return res.json({ message: response.balances });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

module.exports = {
    sendCoinsBetweenUsers,
    getTotalSumOfAssetsInFiat,
    getUserWalletBalances
};
