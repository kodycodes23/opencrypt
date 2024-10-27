const axios = require('axios');
const customError = require('../customError.js');
const Wallets = require('../models/wallets.js');
const { generateReference } = require('../utils/generateReference.js');
const paypal = require('paypal-rest-sdk'); // Ensure you have this library installed
const Flutterwave = require('flutterwave-node-v3'); // Ensure you have this library installed
const Payments = require('../models/payments.js');
// const TransactionHistory = require('../models/transactionHistory.js'); // Ensure you have this model

// Withdraw funds using PayPal
async function withdrawWithPaypalForFiat(req, res, next) {
    try {
        const { userId, amount, currency, coin, recipientEmail, coinAmount} = req.body;

        // Find the user's wallet ate PayPal payout
        const payout = {
            sender_batch_header: {
                sender_batch_id: `batch_${new Date().getTime()}`,
                email_subject: "You have a payout!",
                email_message: `You have received a payout! Thanks for using our service!`,
            },
            items: [
                {
                    recipient_type: "EMAIL",
                    amount: {
                        value: amount,
                        currency: currency,
                    },
                    receiver: recipientEmail,
                    note: userId,
                    sender_item_id: `item_${new Date().getTime()}`,
                },
            ],
        };

        paypal.payout.create(payout, async (error, payoutResponse) => {
            if (error) {
                console.error("Payout error:", error);
                return next(customError("Payout failed", 500));
            }
            const checkIfPaymentExists = await Payments.find({ safeId:'coinnetapp' });

            if (checkIfPaymentExists.length > 0 || !checkIfPaymentExists) {
                const updatePaymentAmt = await Payments.findByIdAndUpdate(checkIfPaymentExists[0]._id, {
                    amount,
                    accessCode: '',
                    coin,
                    coinAmount
                },   {
                    new: true,
                    runValidators: true
                });
                console.log(updatePaymentAmt, 'update')
                return res.json({message: 'withdrawal initiated'});
            } else {
                const savePaymentInitiationInDb = new Payments({
                    accessCode:'',
                    amount,
                    isConfirmed: false,
                    userId,
                    coin,
                    coinAmount,
                    safeId:'coinnetapp'
                });
    
                await savePaymentInitiationInDb.save();
    
                console.log(savePaymentInitiationInDb)

                return res.json({message: 'withdrawal initiated'});

            }
    
        });
    } catch (err) {
        console.log("Error in withdrawal:", err);
        next(customError(err));
    }
}

// Withdraw funds using Flutterwave
async function withdrawalWithFlutterwaveForFiat(req, res, next) {
    try {
        const { code = '999992', account_number = '8039914037', amount = '1000', narration } = req.body;

        console.log(code, account_number)
        const details = {

            account_bank: '044',
            account_number: '0690000031',
            amount,
            currency: "NGN",
            narration: narration || "Payment for things",
            reference: generateReference(),
            callback_url: "https://www.flutterwave.com/ng/",
            debit_currency: "NGN"
        };


        const flw = new Flutterwave('FLWPUBK-bda2610bba76c349ed9f384d822f7839-X','FLWSECK-1dc108d927b1c947965432de9a7ff9b8-192206c57cavt-X')

        const response = await flw.Transfer.initiate(details);

        if(response.message === 'Please enable IP Whitelisting to access this service'){
            return next(customError('Please enable IP Whitelisting to access this service'))
        }
        else if(response.message ==='This request cannot be processed. Please contact your account administrator'){
            return next(customError('This request cannot be processed. Please contact customer support'))
        }
        console.log(response)
        return res.json({ message: response });
    } catch (err) {
        console.log(err);
        next(customError(err))
    }
}

// Withdraw funds using Paystack
async function withdrawalWithPaystackForFiat(req, res, next) {
    try {
        const transferData = req.body;

        transferData.reference = generateReference();

        console.log(transferData)

        const response = await axios.post('https://api.paystack.co/transfer', transferData, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SK_LIVE}`,
                'Content-Type': 'application/json'
            }
        });

        return res.json({ message: response.data });
    } catch (error) {
        console.error(error);
        return next(customError(error));
    }
}

// List Nigerian banks
async function listNigerianBanks(req, res, next) {
    try {
        const response = await axios.get('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer sk_test_8b983dd225c5a8b73a783a5c2f1f92291270a377`
            },
            params: {
                currency: 'NGN'
            }
        });

        return res.json({ message: response.data });
    } catch (err) {
        console.log(err);
        return next(customError(err));
    }
}

module.exports = {
    withdrawWithPaypalForFiat,
    withdrawalWithFlutterwaveForFiat,
    withdrawalWithPaystackForFiat,
    listNigerianBanks
};
