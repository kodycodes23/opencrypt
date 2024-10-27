const { v4 } = require("uuid");
const customError = require("../customError.js");
const TransactionHistory = require("../models/transactionsHistory.js");
const FiatWallet = require("../models/fiatWallet.js");
const TransactionHistoryForFiat = require("../models/transactionHistoryForFiat.js");

// Send coins between users
async function sendFiatBetweenUsers(req, res, next) {
    try {
        const { userId, receiverId, amount, note, percent } = req.body;

        console.log(amount, percent)
        const [checkIfUserWalletExists, checkIfReceiverWalletExists] = await Promise.all([
            FiatWallet.findOne({ userId }),
            FiatWallet.findOne({ userId: receiverId })
        ]);

        if (!checkIfUserWalletExists) return next(customError('Sender wallet not found'));
        if (!checkIfReceiverWalletExists) return next(customError('Receiver wallet not found'));

        // Reset daily limit if the day has passed
        const now = new Date();
        if (!checkIfUserWalletExists.dailyTransactionLimit.lastTransactionDate || 
            checkIfUserWalletExists.dailyTransactionLimit.lastTransactionDate.toDateString() !== now.toDateString()) {
            checkIfUserWalletExists.dailyTransactionLimit.amountUsed = 0;
        }

        // Check maximum transaction limit
        if (amount > checkIfUserWalletExists.maxTransactionAmount) {
            return next(customError(`Transaction amount exceeds the maximum limit of ${checkIfUserWalletExists.maxTransactionAmount}`));
        }

        // Check if daily transaction limit is exceeded
        const remainingDailyLimit = checkIfUserWalletExists.dailyTransactionLimit.limit - checkIfUserWalletExists.dailyTransactionLimit.amountUsed;

        
        if (amount > remainingDailyLimit) {
            return next(customError(`Daily transaction limit exceeded. You can only send ${remainingDailyLimit} more today.`));
        }

        // Check if the user has enough balance
        if (checkIfUserWalletExists.balance['NGN'] < amount) {
            return next(customError('Insufficient balance'));
        }

        console.log(checkIfUserWalletExists,'existing wallet')

        // Proceed with sending
        const [updateUserWallet, updateReceiverWallet] = await Promise.all([
            FiatWallet.findByIdAndUpdate(
                checkIfUserWalletExists._id,
                {
                    $set: {
                        [`balance.NGN`]: checkIfUserWalletExists.balance['NGN'] - +amount,
                        'dailyTransactionLimit.lastTransactionDate': now
                    },
                    $inc: { 'dailyTransactionLimit.amountUsed': +amount }  // Ensure amount is cast as a number
                },
                { new: true, runValidators: true }
            ),
            FiatWallet.findByIdAndUpdate(
                checkIfReceiverWalletExists._id,
                {
                    $set: {
                        [`balance.NGN`]: (checkIfReceiverWalletExists.balance['NGN'] || 0) + +percent
                    }
                },
                { new: true, runValidators: true }
            )
            
        ]);

        console.log(updateReceiverWallet)
        
        // Record the transaction
        const newTransaction = new TransactionHistoryForFiat({
            userId,
            transactionType: 'transfer',
            amount,
            status: 'completed',
            details: `Payment to user with the address - ${receiverId}`,
            txId: v4(),
            rId: v4(),
            name: 'You made a transfer',
            receiverIdForTransfer: receiverId,
            receiverNote: 'You have an incoming cash transfer'
        });
        await newTransaction.save();

        console.log(newTransaction)
        return res.json({ message: 'Sent successfully' });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Get user wallet balances
async function getUserWalletBalances(req, res, next) {
    try {
        const { userId } = req.body;

        const response = await FiatWallet.findOne({ userId });

        console.log(response, 'old wallet');
        if (!response || response.length === 0) {
            const newWallet =  new FiatWallet({
                userId: userId,
                balance: {
                    NGN: 0,
                    EUR: 0,
                    USD: 0,
                    GHS: 0,
                    ZAR: 0,
                }
            });


            await newWallet.save();

            console.log('new wallet', newWallet);

            return res.json({ message: newWallet });
        }

        console.log(response, 'fiat wallet')

        return res.json({ message: response });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

async function convertCurrencies(req,res,next) {
    try{
       const {fromAmount, toAmount, fromCurrency, toCurrency, userId} = req.body


       console.log(fromAmount, toAmount, toCurrency, fromCurrency)
       const checkIfUserWalletExists = await FiatWallet.findOne({ userId })

       if (!checkIfUserWalletExists) return next(customError('Sender wallet not found'));
       
       const [findAndUpdateUserFromCurrencyWallet,findAndUpdateUserToCurrencyWallet] = await Promise.all([
        FiatWallet.findByIdAndUpdate(
        checkIfUserWalletExists._id,
        {
            $set: {
                [`balance.${fromCurrency}`]: +checkIfUserWalletExists.balance[fromCurrency] - +fromAmount
            }
        },
        {
            new: true,
            runValidators: true
        }),
        FiatWallet.findByIdAndUpdate(
            checkIfUserWalletExists._id,
            {
                $set: {
                    [`balance.${toCurrency}`]: +checkIfUserWalletExists.balance[toCurrency] + +toAmount
                }
            },
            {
                new: true,
                runValidators: true
            }),
    ])

    console.log(findAndUpdateUserFromCurrencyWallet,'from currency')
    console.log(findAndUpdateUserToCurrencyWallet, 'to currency')


    return res.json({message: 'Currency exchange successful'})

    }
    catch(err){
        console.log(err)
       next(customError(err))
    }
}

module.exports ={
    sendFiatBetweenUsers,
    getUserWalletBalances,
    convertCurrencies
}