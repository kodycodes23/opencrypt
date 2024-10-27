const customError = require("../customError.js");
const axios = require("axios");
const paypal = require("paypal-rest-sdk");
const { generateReference } = require("../utils/generateReference.js");
const Payments = require("../models/payments.js");
const Wallets = require("../models/wallets.js");
const TransactionHistory = require("../models/transactionsHistory.js");
const {v4} = require('uuid')
const crypto = require('crypto');
const crc32 = require("buffer-crc32")
const fs = require("fs/promises")
const path = require('path');
const FiatWallet = require("../models/fiatWallet.js");
const TransactionHistoryForFiat = require("../models/transactionHistoryForFiat.js");
 

// Configure PayPal with your credentials
paypal.configure({
    mode: 'sandbox', // 'sandbox' or 'live'
    client_id: "AdZFeXk-7w1XuRE4UkVwXsLZKaOsXpZ4E9LaOcyXORxjzEktOV6I-I3QCOiwPzn2LKA9p9irbfOBhVdf",
    client_secret: 'EEdVR2p22Ss-Mz7mWbB6E0W94dGjxAHDeGKRGMHiGsGzwhWkHhIDfY8JQgH004OlJyGURUyws1humEwm',
});

// Paystack payment verification
async function verifyPaymentReference(req, res, next) {
    const { reference } = req.params;
    const API_SECRET_KEY = 'pk_test_0133f64e00899249ada12ecb48d00df37ebea68e'; // Replace with your actual Paystack secret key

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${API_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.data.status === 'success') {
            return res.json({ message: response.data });
        } else {
            next(customError('Invalid Transaction'));
        }
    } catch (error) {
        console.error('Error verifying payment reference:', error);
        next(customError(error));
    }
}
async function initializeMoneyDepositWithPaystackFoTransferFiat(req, res, next) {
    const { email, amount, userId, name } = await req.body;
    const API_SECRET_KEY = 'sk_live_f63bfe020e8a8709347dbd60722bbc96aaec245b';

    console.log(amount, 'paystack amount')
    const amountInKobo = amount * 100; // Convert NGN to Kobo

    const transactionDetails = {
        email,
        amount: Math.floor(amountInKobo),
        metadata: {
            display_name: name,
            variable_name: name,
            value: name,
            userId
        },
    };

    console.log(transactionDetails, 'transaction details for paystack')

    try {
        const response = await axios.post('https://api.paystack.co/transaction/initialize', transactionDetails, {
            headers: {
                Authorization: `Bearer ${API_SECRET_KEY}`
            }
        });

        const checkIfPaymentExists = await Payments.find({ userId });

        if (checkIfPaymentExists.length > 0 || !checkIfPaymentExists) {
            const updatePaymentAmt = await Payments.findByIdAndUpdate(checkIfPaymentExists[0]._id, {
                amount: Math.floor(amountInKobo),
                accessCode: response.data.data.reference,
                isFiat:true,
            });
        } else {
            const savePaymentInitiationInDb = new Payments({
                accessCode: response.data.data.reference,
                amount: Math.floor(amountInKobo),
                isConfirmed: false,
                userId,
                isFiat:true,
            });

            await savePaymentInitiationInDb.save();
            return res.json({ message: response.data });
        }

        return res.json({ message: response.data });

    } catch (error) {
        console.log(error);
        return next(customError(error));
    }
}

async function initializeMoneyDepositWithPaystack(req, res, next) {
    const { email, amount, coinAmount, userId, coin, name } = await req.body;
    const API_SECRET_KEY = 'sk_live_f63bfe020e8a8709347dbd60722bbc96aaec245b';

    const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')

    const amountInNGN = amount * response.data.usd.ngn; // Convert USD to NGN
    const amountInKobo = amountInNGN * 100; // Convert NGN to Kobo


    console.log(amountInNGN)

    const transactionDetails = {
        email,
        amount: Math.floor(amountInKobo),
        metadata: {
            display_name: name,
            variable_name: name,
            value: name,
            userId
        },
        callback_url:"myapp://(tabs)/wallet",
    };

    try {
        const response = await axios.post('https://api.paystack.co/transaction/initialize', transactionDetails, {
            headers: {
                Authorization: `Bearer ${API_SECRET_KEY}`
            }
        });

        const checkIfPaymentExists = await Payments.find({ userId });

        if (checkIfPaymentExists.length > 0 || !checkIfPaymentExists) {
            const updatePaymentAmt = await Payments.findByIdAndUpdate(checkIfPaymentExists[0]._id, {
                amount: Math.floor(amountInKobo),
                accessCode: response.data.data.reference,
                coin,
                coinAmount,
                isFiat:false
            });
        } else {
            const savePaymentInitiationInDb = new Payments({
                accessCode: response.data.data.reference,
                amount: Math.floor(amountInKobo),
                isConfirmed: false,
                userId,
                coin,
                coinAmount,
                isFiat:false
            });

            await savePaymentInitiationInDb.save();
            return res.json({ message: response.data });
        }

        return res.json({ message: response.data });

    } catch (error) {
        console.log(error);
        return next(customError(error));
    }
}

async function verifyPaymentWithPaystackWebhook(req, res, next) {
    try {
        const eventData = req.body;

        // Handle Deposit Event
        if (eventData.event === 'charge.success') {
            const { amount, customer, metadata } = eventData.data;
            const { userId } = metadata;

            const getPaymentAmount = await Payments.find({ userId });
if(!getPaymentAmount[0].isFiat){
            if (amount === getPaymentAmount[0].amount) {
                const checkForAnExistingWallet = await Wallets.find({ userId });

                if (checkForAnExistingWallet.length > 0) {
                    const coinType = getPaymentAmount[0].coin;
                    const amountToAdd = +getPaymentAmount[0].coinAmount;

                    const updateWallet = await Wallets.findByIdAndUpdate(
                        checkForAnExistingWallet[0]._id,
                        {
                            $set: {
                                [`balances.${coinType}`]: checkForAnExistingWallet[0].balances[coinType] + amountToAdd
                            }
                        },
                        {
                            new: true,
                            runValidators: true
                        }
                    );

                console.log(updateWallet, 'updated wallet')
                    
            const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')

               const amountInUSD =  (getPaymentAmount[0].amount / 100) / response.data.usd.ngn; // Convert USD to NGN
                    
                    // Create a new transaction history entry
                    const newTransaction = new TransactionHistory({
                        userId,
                        transactionType: 'deposit',
                        asset: coinType,
                        amountInFiat: amountInUSD,
                        status: 'completed',
                        details: `Coin deposit for ${coinType} using Paystack`,
                        txId: v4(),
                        coinAmount: amountToAdd,
                        rId: v4()
                    });

                    await newTransaction.save();
                    return res.json({ message: 'Balance has been updated successfully', updateWallet });
                } else {
                    const coinType = getPaymentAmount[0].coin;
                    const amountToAdd = +getPaymentAmount[0].coinAmount;

                    const newUserWallet = new Wallets({
                        userId: userId,
                        balances: {
                            BTC: coinType === 'BTC' ? amountToAdd : 0,
                            ETH: coinType === 'ETH' ? amountToAdd : 0,
                            USDC: coinType === 'USDC' ? amountToAdd : 0,
                            BNB: coinType === 'BNB' ? amountToAdd : 0
                        }
                    });

                    const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')

                    const amountInUSD =  (getPaymentAmount[0].amount / 100)  / response.data.usd.ngn; // Convert USD to NGN

                    const newTransaction = new TransactionHistory({
                        userId,
                        transactionType: 'deposit',
                        asset: coinType,
                        amountInFiat: amountInUSD,
                        status: 'completed',
                        details: `Coin deposit for ${coinType} using Paystack`,
                        txId: v4(),
                        coinAmount: amountToAdd,
                        rId: v4()
                    });

                    await newTransaction.save();
                    await newUserWallet.save();
                    return res.json({ message: 'Balance has been updated successfully', newUserWallet });
                }
            } else {
                return res.json({ message: 'The amount does not match the amount in our server' });
            }
            
        }
        else{
            if (amount === getPaymentAmount[0].amount) {
                const checkForAnExistingWallet = await FiatWallet.find({ userId });

                if (checkForAnExistingWallet.length > 0) {
                    const amountToAdd = +getPaymentAmount[0].amount / 100;

                    console.log(amountToAdd, 'amountToAdd')

                    const updateWallet = await FiatWallet.findByIdAndUpdate(
                        checkForAnExistingWallet[0]._id,
                        {
                            $set: {
                                [`balance.NGN`]: checkForAnExistingWallet[0].balance['NGN'] + amountToAdd
                            }
                        },
                        {
                            new: true,
                            runValidators: true
                        }
                    );

                    // Create a new transaction history entry
                    const newTransaction = new TransactionHistoryForFiat({
                        userId,
                        transactionType: 'deposit',
                        amount:amountToAdd,
                        status: 'completed',
                        details: `Deposited funds to account`,
                        txId: v4(),
                        rId: v4(),
                        name: 'You made a deposit using paystack'
                    });


                    await newTransaction.save();
                    return res.json({ message: 'Balance has been updated successfully', updateWallet });
                } else {
                    const amountToAdd = +getPaymentAmount[0].amount / 100;

                    console.log(amountToAdd, 'amount to add')

                    const newUserWallet = new FiatWallet({
                        userId: userId,
                        balance: {
                            NGN: amountToAdd,
                            EUR: 0,
                            USD: 0,
                            GHS: 0,
                            ZAR: 0,
                        }
                    });

                    const newTransaction = new TransactionHistoryForFiat({
                        userId,
                        transactionType: 'deposit',
                        amount: amountToAdd,
                        status: 'completed',
                        details: `Deposited funds to account`,
                        txId: v4(),
                        rId: v4(),
                        name: 'You made a deposit using paystack'
                    });


                    await newTransaction.save();
                    await newUserWallet.save();

                    
                    console.log(newUserWallet, 'new wallet')

                    return res.json({ message: 'Balance has been updated successfully', newUserWallet });
                }
            } else {
                return res.json({ message: 'The amount does not match the amount in our server' });
            }
        }

        // Handle Withdrawal Event
        } else if (eventData.event === 'transfer.success') {
            const { amount, reference, recipient, metadata } = eventData.data;
            const { userId } = metadata;

            // Update the user's wallet balance
            const checkForAnExistingWallet = await Wallets.findOne({ userId });

            if (checkForAnExistingWallet) {
                const coinType = metadata.coinType; // Assume you store the coin type in metadata
                const amountToDeduct = +metadata.coinAmount; // Assume you store the amount in metadata

                const updateWallet = await Wallets.findByIdAndUpdate(
                    checkForAnExistingWallet._id,
                    {
                        $set: {
                            [`balances.${coinType}`]: checkForAnExistingWallet.balances[coinType] - amountToDeduct
                        }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                // Create a new transaction history entry for withdrawal
                const newTransaction = new TransactionHistory({
                    userId,
                    transactionType: 'withdrawal',
                    asset: coinType,
                    amountInFiat: amount,
                    status: 'completed',
                    details: `Coin withdrawal for ${coinType} using Paystack`,
                    txId: reference,
                    coinAmount: amountToDeduct,
                    rId: v4()
                });

                await newTransaction.save();
                return res.json({ message: 'Withdrawal has been completed successfully', updateWallet });
            } else {
                return res.status(404).json({ message: 'Wallet not found' });
            }
        } else {
            return res.status(400).json({ message: 'Event not handled' });
        }
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// Flutterwave

async function initializeMoneyDepositWithFlutterwaveToTransferFiat(req, res, next) {
    const { email, amount, userId, name, phone } = await req.body;
    const API_SECRET_KEY =  'FLWSECK-1dc108d927b1c947965432de9a7ff9b8-192206c57cavt-X'

    const transactionDetails = {
        tx_ref: generateReference(),
        amount,
        currency: 'NGN',
        redirect_url: 'app.lexisdevelopment.coinnet://(tabs)',
        customer: {
            email,
            name: name,
            phone_number: phone + ',' + userId,
        },
        customizations: {
            title: 'Coinnet Cash Topup',
        },
        meta: {
            user_id: userId
        },
        configurations: {
            session_duration: 10, // Session timeout in minutes (maxValue: 1440)    
            max_retry_attempt: 5 // Max retry (int)
        }
    };

    try {
        const response = await axios.post('https://api.flutterwave.com/v3/payments', transactionDetails, {
            headers: {
                Authorization: `Bearer ${API_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const checkIfPaymentExists = await Payments.find({ userId });

        if (checkIfPaymentExists.length > 0 || !checkIfPaymentExists) {
            const updatePaymentAmt = await Payments.findByIdAndUpdate(checkIfPaymentExists[0]._id, {
                amount,
                accessCode: response.data.data.reference,
                isFiat:true
            });
        } else {
            const savePaymentInitiationInDb = new Payments({
                accessCode: response.data.data.reference,
                amount,
                isConfirmed: false,
                userId,
                isFiat:true
            });

            await savePaymentInitiationInDb.save();
            return res.json({ message: response.data });
        }

        return res.json({ message: response.data });

    } catch (error) {
        console.log(error);
        return next(customError(error));
    }
}


async function initializeMoneyDepositWithFlutterwave(req, res, next) {
    const { email, amount, coin, coinAmount, userId, name, phone } = await req.body;
    const API_SECRET_KEY = 'FLWSECK-1dc108d927b1c947965432de9a7ff9b8-192206c57cavt-X'

    const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')

    const amountInNGN = amount * response.data.usd.ngn; // Convert USD to NGN

    const transactionDetails = {
        tx_ref: generateReference(),
        amount: amountInNGN,
        currency: 'NGN',
        redirect_url: 'myapp://(tabs)/wallet',
        customer: {
            email,
            name: name,
            phone_number: phone + ',' + userId,
        },
        customizations: {
            title: 'Coinnet Coin Topup',
        },
        meta: {
            user_id: userId
        },
        configurations: {
            session_duration: 10, // Session timeout in minutes (maxValue: 1440)    
            max_retry_attempt: 5 // Max retry (int)
        }
    };

    try {
        const response = await axios.post('https://api.flutterwave.com/v3/payments', transactionDetails, {
            headers: {
                Authorization: `Bearer ${API_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const checkIfPaymentExists = await Payments.find({ userId });

        if (checkIfPaymentExists.length > 0 || !checkIfPaymentExists) {
            const updatePaymentAmt = await Payments.findByIdAndUpdate(checkIfPaymentExists[0]._id, {
                amount: amountInNGN,
                accessCode: response.data.data.reference,
                coin,
                coinAmount,
                isFiat: false
            });
        } else {
            const savePaymentInitiationInDb = new Payments({
                accessCode: response.data.data.reference,
                amount: amountInNGN,
                isConfirmed: false,
                userId,
                coin,
                coinAmount,
                isFiat:false
            });

            await savePaymentInitiationInDb.save();
            return res.json({ message: response.data });
        }

        return res.json({ message: response.data });

    } catch (error) {
        console.log(error);
        return next(customError(error));
    }
}

async function verifyPaymentWithFlutterwaveWebhook(req, res, next) {
    try {
        const eventData = req.body;

        console.log(eventData)

        if (eventData.event === 'charge.completed') {
            const { amount, customer } = eventData.data;
            const { phone_number } = customer;
            const userId = phone_number.split(',')[1];

            const getPaymentAmount = await Payments.find({ userId });

            if(!getPaymentAmount[0].isFiat){
            if (amount === getPaymentAmount[0].amount) {
                const checkForAnExistingWallet = await Wallets.find({ userId });

                if (checkForAnExistingWallet.length > 0 || !checkForAnExistingWallet) {
                    
                    const coinType = getPaymentAmount[0].coin; // This will hold the coin type, e.g., "BTC"
                    const amountToAdd = +getPaymentAmount[0].coinAmount; // The amount to add to the wallet balance

                    const updateWallet = await Wallets.findByIdAndUpdate(
                        checkForAnExistingWallet[0]._id,
                        {
                            $set: {
                                [`balances.${coinType}`]: checkForAnExistingWallet[0].balances[coinType] + amountToAdd
                            }
                        },
                        {
                            new: true,
                            runValidators: true
                        }
                    );

                    const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')

                    const amountInUSD =  getPaymentAmount[0].amount / response.data.usd.ngn; // Convert USD to NGN


                    const newTransaction = new TransactionHistory({
                        userId,
                        transactionType: 'deposit',
                        asset: coinType,
                        amountInFiat: amountInUSD,
                        status: 'completed',
                        details: `Coin deposit for ${coinType} using Flutterwave`,
                        txId: v4(),
                        coinAmount: amountToAdd,
                        rId: v4()
                    });

                    console.log(newTransaction);

                    await newTransaction.save();

                    return res.json({ message: 'Balance has been updated successfully', updateWallet });
                } else {

                    const coinType = getPaymentAmount[0].coin;
                    const amountToAdd = +getPaymentAmount[0].coinAmount;

                    const newUserWallet = new Wallets({
                        userId: userId,
                        balances: {
                            BTC: coinType === 'BTC' ? amountToAdd : 0,
                            ETH: coinType === 'ETH' ? amountToAdd : 0,
                            USDC: coinType === 'USDC' ? amountToAdd : 0,
                            BNB: coinType === 'BNB' ? amountToAdd : 0
                        }
                    });

                    const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')

                    const amountInUSD =  getPaymentAmount[0].amount / response.data.usd.ngn; // Convert USD to NGN

                    const newTransaction = new TransactionHistory({
                        userId,
                        transactionType: 'deposit',
                        asset: coinType,
                        amountInFiat: amountInUSD,
                        status: 'completed',
                        details: `Coin deposit for ${coinType} using Flutterwave`,
                        txId: v4(),
                        coinAmount: amountToAdd,
                        rId: v4()
                    });

                    console.log(newTransaction);

                    await newTransaction.save();
                    await newUserWallet.save();

                    return res.json({ message: 'Balance has been updated successfully', newUserWallet });
                }
            } else {
                return res.json({ message: 'The amount does not match the amount in our server' });
            }
        }
        else {
            if (amount === getPaymentAmount[0].amount) {
                const checkForAnExistingWallet = await FiatWallet.find({ userId });

                if (checkForAnExistingWallet.length > 0 || !checkForAnExistingWallet) {
        
                    const amountToAdd = +getPaymentAmount[0].amount; // The amount to add to the wallet balance

                    const updateWallet = await FiatWallet.findByIdAndUpdate(
                        checkForAnExistingWallet[0]._id,
                        {
                            $set: {
                                [`balance.NGN`]: checkForAnExistingWallet[0].balance['NGN'] + amountToAdd  
                            }
                        },
                        {
                            new: true,
                            runValidators: true
                        }
                    );
                    const newTransaction = new TransactionHistoryForFiat({
                        userId,
                        transactionType: 'deposit',
                        amount: amountToAdd,
                        status: 'completed',
                        details: `Deposited funds to account`,
                        txId: v4(),
                        rId: v4(),
                        name: 'You made a deposit using flutterwave'
                    });

                    console.log(newTransaction);

                    await newTransaction.save();

                    return res.json({ message: 'Balance has been updated successfully', updateWallet });
                } else {

                    const amountToAdd = +getPaymentAmount[0].amount; // The amount to add to the wallet balance

                    const newUserWallet = new FiatWallet({
                        userId: userId,
                        balance: {
                            NGN: amountToAdd,
                            EUR: 0,
                            USD: 0,
                            GHS: 0,
                            ZAR: 0,
                        }
                    });

                    const newTransaction = new TransactionHistoryForFiat({
                        userId,
                        transactionType: 'deposit',
                        amount: amountToAdd,
                        status: 'completed',
                        details: `Deposited funds to account`,
                        txId: v4(),
                        rId: v4(),
                        name: 'You made a deposit using flutterwave'
                    });


                    console.log(newTransaction);

                    await newTransaction.save();
                    await newUserWallet.save();

                    return res.json({ message: 'Balance has been updated successfully', newUserWallet });
                }
            } else {
                return res.json({ message: 'The amount does not match the amount in our server' });
            }
        }
        } else if (eventData.event === 'transfer.success') {
            const { amount, customer } = eventData.data;
            const { phone_number } = customer;
            const userId = phone_number.split(',')[1]; // Assuming userId is after the comma

            // Retrieve payment record
            const getPaymentAmount = await Payments.find({ userId });

            if (!getPaymentAmount[0].isFiat) {
                // Non-fiat wallet (crypto) withdrawal
                if (amount === getPaymentAmount[0].amount) {
                    const checkForAnExistingWallet = await Wallets.find({ userId });

                    if (checkForAnExistingWallet.length > 0 || !checkForAnExistingWallet) {
                        const coinType = getPaymentAmount[0].coin; // The coin type (e.g., BTC)
                        const amountToSubtract = +getPaymentAmount[0].coinAmount; // Amount to deduct

                        // Deduct amount from crypto wallet balance
                        const updateWallet = await Wallets.findByIdAndUpdate(
                            checkForAnExistingWallet[0]._id,
                            {
                                $set: {
                                    [`balances.${coinType}`]: checkForAnExistingWallet[0].balances[coinType] - amountToSubtract
                                }
                            },
                            {
                                new: true,
                                runValidators: true
                            }
                        );

                        // Record the withdrawal transaction
                        const newTransaction = new TransactionHistory({
                            userId,
                            transactionType: 'withdrawal',
                            asset: coinType,
                            amountInFiat: getPaymentAmount[0].amount,
                            status: 'completed',
                            details: `Coin withdrawal for ${coinType} using Flutterwave`,
                            txId: v4(),
                            coinAmount: amountToSubtract,
                            rId: v4()
                        });

                        console.log(newTransaction);
                        await newTransaction.save();

                        return res.json({ message: 'Balance has been updated successfully', updateWallet });
                    } else {
                        return res.json({ message: 'Wallet not found' });
                    }
                } else {
                    return res.json({ message: 'The amount does not match the amount in our server' });
                }
            } else {
                // Fiat wallet withdrawal
                if (amount === getPaymentAmount[0].amount) {
                    const checkForAnExistingWallet = await FiatWallet.find({ userId });

                    if (checkForAnExistingWallet.length > 0 || !checkForAnExistingWallet) {
                        const amountToSubtract = +getPaymentAmount[0].amount; // Amount to deduct

                        // Deduct amount from fiat wallet
                        const updateWallet = await FiatWallet.findByIdAndUpdate(
                            checkForAnExistingWallet[0]._id,
                            {
                                $set: {
                                    [`balance.NGN`]: checkForAnExistingWallet[0].balance['NGN'] - amountToSubtract
                                }
                            },
                            {
                                new: true,
                                runValidators: true
                            }
                        );

                        // Record the withdrawal transaction for fiat
                        const newTransaction = new TransactionHistoryForFiat({
                            userId,
                            transactionType: 'withdrawal',
                            amount: amountToSubtract,
                            status: 'completed',
                            details: `Withdrawn funds from fiat account`,
                            txId: v4(),
                            rId: v4(),
                            name: 'You made a withdrawal using Flutterwave'
                        });

                        console.log(newTransaction);
                        await newTransaction.save();

                        return res.json({ message: 'Balance has been updated successfully', updateWallet });
                    } else {
                        return res.json({ message: 'Fiat Wallet not found' });
                    }
                } else {
                    return res.json({ message: 'The amount does not match the amount in our server' });
                }
            }
    }
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


async function initializeMoneyDepositWithPaypalForTransferFiat(req, res,next){
    try{
        const {amount, userId, } = req.body

        console.log(amount, userId)

        const paymentData = {
            intent: `sale`,
            payer: {
              payment_method: 'paypal',
            },
            redirect_urls: {
              return_url: 'myapp://(fiattabs)', // URL to redirect after payment approval
              cancel_url: 'myapp://(fiattabs)',  // URL to redirect if payment is canceled
            },
            transactions: [
              {
                amount: {
                  total: amount,
                  currency: 'USD',
                },
                description: userId,
              },
            ],
          };
        
          paypal.payment.create(paymentData, async (error, payment) => {
            if (error) {
              console.error('Error creating payment:', error);
              res.status(500).send('Error creating payment');
            } else {
              // Extract the approval URL from the response
              const approvalUrl = payment.links.find((link) => link.rel === 'approval_url').href;

              
        const checkIfPaymentExists = await Payments.find({ userId });

        if (checkIfPaymentExists.length > 0 || !checkIfPaymentExists) {
            const updatePaymentAmt = await Payments.findByIdAndUpdate(checkIfPaymentExists[0]._id, {
                amount,
                accessCode: payment.id,
                isFiat:true
            },   {
                new: true,
                runValidators: true
            });
            console.log(updatePaymentAmt, 'update')
            return res.json({message: approvalUrl});
        } else {

            const savePaymentInitiationInDb = new Payments({
                accessCode: payment.id,
                amount,
                isConfirmed: false,
                userId,
                isFiat:true
            });

            await savePaymentInitiationInDb.save();

            console.log(savePaymentInitiationInDb)

            return res.json({message: approvalUrl});
        }

        
            }
          });
    }
    catch(err){
        console.log(err)
     next(customError(err))
    }
}

async function initializeMoneyDepositWithPaypal(req, res,next){
    try{
        const {amount, userId, coinAmount, coin, } = req.body

        console.log(amount, userId, coinAmount, coin)

        const paymentData = {
            intent: `sale`,
            payer: {
              payment_method: 'paypal',
            },
            redirect_urls: {
              return_url: 'myapp://(tabs)/wallet', // URL to redirect after payment approval
              cancel_url: 'myapp://(tabs)/wallet',  // URL to redirect if payment is canceled
            },
            transactions: [
              {
                amount: {
                  total: amount,
                  currency: 'USD',
                },
                description: userId,
              },
            ],
          };
        
          paypal.payment.create(paymentData, async (error, payment) => {
            if (error) {
              console.error('Error creating payment:', error);
              res.status(500).send('Error creating payment');
            } else {
              // Extract the approval URL from the response
              const approvalUrl = payment.links.find((link) => link.rel === 'approval_url').href;

              
        const checkIfPaymentExists = await Payments.find({ userId });

        if (checkIfPaymentExists.length > 0 || !checkIfPaymentExists) {
            const updatePaymentAmt = await Payments.findByIdAndUpdate(checkIfPaymentExists[0]._id, {
                amount,
                accessCode: payment.id,
                coin,
                coinAmount,
                isFiat:false
            },   {
                new: true,
                runValidators: true
            });
            console.log(updatePaymentAmt, 'update')
            return res.json({message: approvalUrl});
        } else {

            const savePaymentInitiationInDb = new Payments({
                accessCode: payment.id,
                amount,
                isConfirmed: false,
                userId,
                coin,
                coinAmount,
                isFiat:false
            });

            await savePaymentInitiationInDb.save();

            console.log(savePaymentInitiationInDb)

            return res.json({message: approvalUrl});
        }

        
            }
          });
    }
    catch(err){
        console.log(err)
     next(customError(err))
    }
}

// async function downloadAndCache(url, cacheKey) {
//   if (!cacheKey) {

//     cacheKey = url.replace(/\W+/g, '-');
    
//   }


// const CACHE_DIR = path.join(__dirname, 'cache')

//   const filePath = `${CACHE_DIR}/${cacheKey}`;

//   // Check if cached file exists
//   const cachedData = await fs.readFile(filePath, 'utf-8').catch(() => null);
//   if (cachedData) {
//     return cachedData;
//   }

//   // Download the file if not cached
//   const response = await fetch(url);
//   const data = await response.text();
//   await fs.writeFile(filePath, data);

//   return data;
// }

// // Function to verify the signature
// async function verifySignature(event, headers) {
//   console.log(event, 'from body');
//   console.log(headers, 'from headers');

//   const transmissionId = headers['paypal-transmission-id'];
//   const timeStamp = headers['paypal-transmission-time'];
//   const WEBHOOK_ID = '0B226803HM146825D'

//   // Convert the event object to a string before calculating the CRC32 checksum
//   const eventString = JSON.stringify(event);
//   const crc = parseInt("0x" + crc32(eventString).toString('hex'));

//   console.log(crc);

//   const message = `${transmissionId}|${timeStamp}|${WEBHOOK_ID}|${crc}`;
//   console.log(`Original signed message ${message}`);

//   const certPem = await downloadAndCache(headers['paypal-cert-url']);

//   // Create buffer from base64-encoded signature
//   const signatureBuffer = Buffer.from(headers['paypal-transmission-sig'], 'base64');

//   // Create a verification object
//   const verifier = crypto.createVerify('SHA256');

//   // Add the original message to the verifier
//   verifier.update(message);

//   return verifier.verify(certPem, signatureBuffer);
// }

// Controller function to handle PayPal webhook verification
async function verifyPaymentWithPaypalWebhooK(req, res, next) {
  try {
    const webhookEvent = req.body;
    // const headers = req.headers;

    // const isSignatureValid = await verifySignature(webhookEvent, headers);

    // console.log(isSignatureValid);

    // Handle the event

    console.log(webhookEvent)
    console.log(webhookEvent.resource.transactions)


    if (webhookEvent.event_type === 'PAYMENTS.PAYMENT.CREATED') {

        const userId = webhookEvent?.resource?.transactions[0]?.description
        const amount = webhookEvent?.resource?.transactions[0]?.amount.total
    
    

        console.log(typeof amount, 'amount web')
        const getPaymentAmount = await Payments.find({ userId });

        console.log(getPaymentAmount,'getpayment')

    
        if(!getPaymentAmount[0].isFiat){
        if (+amount === getPaymentAmount[0].amount) {
            const checkForAnExistingWallet = await Wallets.find({ userId });

            console.log(checkForAnExistingWallet, 'existing user')
            if (checkForAnExistingWallet.length > 0 || !checkForAnExistingWallet) {
                const coinType = getPaymentAmount[0].coin; // This will hold the coin type, e.g., "BTC"
                const amountToAdd = +getPaymentAmount[0].coinAmount; // The amount to add to the wallet balance

                const updateWallet = await Wallets.findByIdAndUpdate(
                    checkForAnExistingWallet[0]._id,
                    {
                        $set: {
                            [`balances.${coinType}`]: checkForAnExistingWallet[0].balances[coinType] + amountToAdd
                        }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                

              const newTransaction = new TransactionHistory({
                userId,
                transactionType: 'deposit',
                asset: coinType,
                amountInFiat: getPaymentAmount[0].amount,
                status:'completed',
                details:`coin deposit for ${coinType} using paypal`,
                txId: v4(),
                coinAmount: amountToAdd,
                rId: v4()
            });

              
    
              await newTransaction.save()

                console.log(newTransaction, 'transaction')
                
                console.log(updateWallet, 'wallet')
      
                return res.json({ message: 'Balance have been updated successfully', updateWallet });
            } else {
                const coinType = getPaymentAmount[0].coin; // This will hold the coin type, e.g., "BTC"
                const amountToAdd = +getPaymentAmount[0].coinAmount; // The amount to add to the wallet balance

                const newUserWallet = new Wallets({
                    userId: userId,
                    balances: {
                        BTC: coinType === 'BTC' ? amountToAdd : 0,
                        ETH: coinType === 'ETH' ? amountToAdd : 0,
                        USDC: coinType === 'USDC' ? amountToAdd : 0,
                        BNB: coinType === 'BNB' ? amountToAdd : 0
                    }
                });
                
                const newTransaction = new TransactionHistory({
                  userId,
                  transactionType: 'deposit',
                  asset: coinType,
                  amountInFiat: getPaymentAmount[0].amount,
                  status:'completed',
                  details:`coin deposit for ${coinType} using paypal`,
                  txId: v4(),
                  coinAmount: amountToAdd,
                  rId: v4()
              });

              
              console.log(newTransaction)
      

              await newTransaction.save()

                await newUserWallet.save();
              
                return res.json({ message: 'Balance have been updated successfully', updateUserWallet });
            }
        } else {
            return res.json({ message: 'The amount does not match the amount in our server' });
        }
        
    }
    else{
        
        if (+amount === getPaymentAmount[0].amount) {
        const checkForAnExistingWallet = await FiatWallet.find({ userId });

        console.log(checkForAnExistingWallet, 'existing user')
        if (checkForAnExistingWallet.length > 0 || !checkForAnExistingWallet) {
            const usdRate = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
    
            const amountToAdd = +getPaymentAmount[0].amount * usdRate.data.usd.ngn; // The amount to add to the wallet balance

            const updateWallet = await FiatWallet.findByIdAndUpdate(
                checkForAnExistingWallet[0]._id,
                {
                    $set: {
                        [`balance.NGN`]: checkForAnExistingWallet[0].balance['NGN'] + amountToAdd
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            
            const newTransaction = new TransactionHistoryForFiat({
                userId,
                transactionType: 'deposit',
                amount:amountToAdd,
                status: 'completed',
                details: `Deposited funds to account`,
                txId: v4(),
                rId: v4(),
                name: 'You made a deposit using paypal'
            });

          

          await newTransaction.save()

            console.log(newTransaction, 'transaction')
            
            console.log(updateWallet, 'wallet')
  
            return res.json({ message: 'Balance have been updated successfully', updateWallet });
        } else {
            const usdRate = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
    
            const amountToAdd = +getPaymentAmount[0].amount * usdRate.data.usd.ngn; // The amount to add to the wallet balance

      
            const newUserWallet = new FiatWallet({
                userId: userId,
                balance: {
                    NGN: amountToAdd,
                    EUR: 0,
                    USD: 0,
                    GHS: 0,
                    ZAR: 0,
                }
            });
            
            const newTransaction = new TransactionHistoryForFiat({
                userId,
                transactionType: 'deposit',
                amount:amountToAdd,
                status: 'completed',
                details: `Deposited funds to account`,
                txId: v4(),
                rId: v4(),
                name: 'You made a deposit using paypal'
            });


          
          console.log(newTransaction)
  

          await newTransaction.save()

            await newUserWallet.save();
          
            console.log(newUserWallet,'for paypal')
            return res.json({ message: 'Balance have been updated successfully', newUserWallet });
        
    }
}
else{
    return res.json({ message: 'The amount does not match the amount in our server' });
}
    }
    } else if (webhookEvent.event_type === 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED'){
         withdrawalUserId = webhookEvent.resource.payout_item.note

         console.log(withdrawalUserId, 'from unclaimed')
         
    } else if(webhookEvent.event_type === 'PAYMENT.PAYOUTSBATCH.SUCCESS'){

        console.log(webhookEvent.resource)
        const getPaymentAmount = await Payments.find({ safeId: 'coinnetapp' });

        console.log(getPaymentAmount,'getpayment from success')

        if (+webhookEvent.resource.amount === getPaymentAmount[0].amount) {
            const checkForAnExistingWallet = await Wallets.find({ userId: getPaymentAmount[0].userId });

            console.log(checkForAnExistingWallet, 'existing user from success')

            if (checkForAnExistingWallet.length > 0 || !checkForAnExistingWallet) {
                const coinType = getPaymentAmount[0].coin; // This will hold the coin type, e.g., "BTC"
                const amountToSubstract = +getPaymentAmount[0].coinAmount; // The amount to add to the wallet balance

                console.log(coinType, amountToSubstract, 'from success')

                const updateWallet = await Wallets.findByIdAndUpdate(
                    checkForAnExistingWallet[0]._id,
                    {
                        $set: {
                            [`balances.${coinType}`]: checkForAnExistingWallet[0].balances[coinType] - amountToSubstract
                        }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                

              const newTransaction = new TransactionHistory({
                userId,
                transactionType: 'deposit',
                asset: coinType,
                amountInFiat: getPaymentAmount[0].amount,
                status:'completed',
                details:`coin deposit for ${coinType} using flutterwave`,
                txId: v4(),
                coinAmount: amountToSubstract,
                rId: v4()
            });

              
    
              await newTransaction.save()

                console.log(newTransaction, 'transaction from success')
                
                console.log(updateWallet, 'wallet from success')
      
                return res.json({ message: 'Balance have been updated successfully', updateWallet });
            } else {
                const coinType = getPaymentAmount[0].coin; // This will hold the coin type, e.g., "BTC"
                const amountToAdd = +getPaymentAmount[0].coinAmount; // The amount to add to the wallet balance

                const newUserWallet = new Wallets({
                    userId: userId,
                    balances: {
                        BTC: coinType === 'BTC' ? amountToAdd : 0,
                        ETH: coinType === 'ETH' ? amountToAdd : 0,
                        USDC: coinType === 'USDC' ? amountToAdd : 0,
                        BNB: coinType === 'BNB' ? amountToAdd : 0
                    }
                });
                
                const newTransaction = new TransactionHistory({
                  userId,
                  transactionType: 'deposit',
                  asset: coinType,
                  amountInFiat: getPaymentAmount[0].amount,
                  status:'completed',
                  details:`coin deposit for ${coinType} using flutterwave`,
                  txId: v4(),
                  coinAmount: amountToAdd,
                  rId: v4()
              });

              
              console.log(newTransaction, 'from transaction history')
      

              await newTransaction.save()

                await newUserWallet.save();
              
                return res.json({ message: 'Balance have been updated successfully', updateUserWallet });
            }
        } else {
            return res.json({ message: 'The amount does not match the amount in our server' });
        }
    
        
    } else {
        // const userId = webhookEvent?.resource?.transactions[0]?.description
        // const amount = webhookEvent?.resource?.transactions[0]?.amount.total
    
    
        // const newTransaction = new TransactionHistory({
        //     userId,
        //     transactionType: 'deposit',
        //     asset: coinType,
        //     amountInFiat: getPaymentAmount[0].amount,
        //     status:'failed',
        //     details:`coin deposit for ${coinType} using flutterwave`,
        //     txId: v4(),
        //     coinAmount: amountToAdd,
        //     rId: v4()
        // });

        // await newTransaction.save()

        res.status(200).json({ message: 'Event not handled' });
    }
  } catch (err) {
    console.log(err);
    next(customError(err));
  }
}

async function initializeAndVerifyPaymentWithCoinnetFiat(req, res,next){
     try{
        const {userId, coin, amount, coinAmount} = req.body

        console.log(userId, coin, amount, coinAmount)
        const [checkForAnExistingWallet, checkForUserFiatWallet] = await Promise.all([
            Wallets.find({ userId }),
            FiatWallet.find({userId})
        ])

        console.log(checkForAnExistingWallet, checkForUserFiatWallet[0], 'wallet, fiat wallet')

        const usdRate = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')

        if (checkForAnExistingWallet.length > 0 && checkForUserFiatWallet.length > 0 && checkForUserFiatWallet) {

        if(checkForUserFiatWallet[0].balance['NGN'] < (+amount * usdRate.data.usd.ngn)) return next(customError('Insufficient Balance in fiat'))

            const coinType = coin

            const amountToAdd = +coinAmount 

            const [updateWallet, updateFiatWallet] = await Promise.all([
                Wallets.findByIdAndUpdate(
                checkForAnExistingWallet[0]._id,
                {
                    $set: {
                        [`balances.${coinType}`]: checkForAnExistingWallet[0].balances[coinType] + amountToAdd
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            ), 
            FiatWallet.findByIdAndUpdate(
                checkForUserFiatWallet[0]._id,
                {
                    $set: {
                        [`balance.NGN`]: checkForUserFiatWallet[0].balance['NGN'] - (+amount * usdRate.data.usd.ngn)
                    }
                },
                { new: true, runValidators: true }
            )
        ]);

    console.log(updateWallet, updateFiatWallet, 'updated wallet, updated fiat wallet')

            // Create a new transaction history entry
            const newTransaction = new TransactionHistory({
                userId,
                transactionType: 'deposit',
                asset: coinType,
                amountInFiat: amount,
                status: 'completed',
                details: `Coin deposit for ${coinType} using Coinnet`,
                txId: v4(),
                coinAmount: amountToAdd,
                rId: v4()
            });

            const newTransactionForFiat = new TransactionHistoryForFiat({
                userId,
                transactionType: 'coin topup',
                amount: +amount * usdRate.data.usd.ngn,
                status: 'completed',
                details: `You successfully bought ${coinType} using your balance`,
                txId: v4(),
                rId: v4(),
                name: `You made a coin top up for - ${coinType}`,
            });

            await Promise.all([
                newTransaction.save(),
                newTransactionForFiat.save()
            ])

            console.log(newTransaction, newTransactionForFiat, 'transaction, transction forfiat')

            return res.json({ message: 'Balance has been updated successfully', updateWallet });
        } else {
            const coinType = coin
            const amountToAdd = +coinAmount

            const newUserWallet = new Wallets({
                userId: userId,
                balances: {
                    BTC: coinType === 'BTC' ? amountToAdd : 0,
                    ETH: coinType === 'ETH' ? amountToAdd : 0,
                    USDC: coinType === 'USDC' ? amountToAdd : 0,
                    BNB: coinType === 'BNB' ? amountToAdd : 0
                }
            });

          const updateFiatWallet = await FiatWallet.findByIdAndUpdate(
                checkIfReceiverWalletExists._id,
                {
                    $set: {
                        [`balance.NGN`]: (checkForUserFiatWallet.balance['NGN'] || 0) - (+amount * usdRate.data.usd.ngn)
                    }
                },
                { new: true, runValidators: true }
            )

            const newTransaction = new TransactionHistory({
                userId,
                transactionType: 'deposit',
                asset: coinType,
                amountInFiat: +amount,
                status: 'completed',
                details: `Coin deposit for ${coinType} using Coinnet`,
                txId: v4(),
                coinAmount: amountToAdd,
                rId: v4()
            });
            const newTransactionForFiat = new TransactionHistoryForFiat({
                userId,
                transactionType: 'coin topup',
                amount:+amount * usdRate.data.usd.ngn,
                status: 'completed',
                details: `You successfully bought ${coinType} using your balance`,
                txId: v4(),
                rId: v4(),
                name: `You made a coin top up for - ${coinType}`,
            });

            await Promise.all([
                 newTransaction.save(),
                 newUserWallet.save(),
                 newTransactionForFiat.save()
                
            ])
            return res.json({ message: 'Balance has been updated successfully', newUserWallet });
        }
     }
     catch(err){
        console.log(err)
        next(customError(err))
     }
}
module.exports = {
  verifyPaymentWithPaypalWebhooK,
};

module.exports = {
  verifyPaymentReference,
  initializeMoneyDepositWithPaystack,
  verifyPaymentWithPaystackWebhook,
  initializeMoneyDepositWithFlutterwave,
  verifyPaymentWithFlutterwaveWebhook,
  initializeMoneyDepositWithPaypal,
  verifyPaymentWithPaypalWebhooK,
  initializeMoneyDepositWithFlutterwaveToTransferFiat,
  initializeMoneyDepositWithPaypalForTransferFiat,
  initializeMoneyDepositWithPaystackFoTransferFiat,
  initializeAndVerifyPaymentWithCoinnetFiat
};
