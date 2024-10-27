const Exchange = require("../models/exchange.js");
const TransactionHistory = require("../models/transactionsHistory.js");
const Wallets = require("../models/wallets.js");
const {v4} = require('uuid')

async function convertCoin(req, res, next) {
  const { userId, convertFrom, convertTo, fromAmount, toAmount } = req.body;

  console.log(fromAmount, toAmount,'exchange')
  try {
    // Find the user's wallet
    const wallet = await Wallets.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    // Check if the user has enough balance in the 'convertFrom' coin
    if (wallet.balances[convertFrom] < fromAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Update the wallet balances using $inc
    const updateResult = await Wallets.updateOne(
      { userId },
      {
        $inc: {
          [`balances.${convertFrom}`]: -fromAmount, // Deduct from 'convertFrom' balance
          [`balances.${convertTo}`]: toAmount // Add to 'convertTo' balance
        }
      }
    );

    console.log(updateResult);
    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ success: false, message: 'Failed to update wallet balances' });
    }

    console.log('success');
    // Save the exchange transaction
    const exchange = new Exchange({
      userId,
      convertFrom,
      convertTo,
      fromAmount,
      toAmount,
    });

    const newTransaction = new TransactionHistory({
      userId,
      transactionType: 'exchange',
      asset: convertTo,
      amountInFiat: toAmount,
      status:'completed',
      details:`coin exchange from ${convertFrom} to ${convertTo}`,
      txId: v4(),
      coinAmount: toAmount,
      rId: v4()
  });

  console.log(newTransaction)

    await newTransaction.save();

    await exchange.save();

    res.status(200).json({ success: true, exchange });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}

module.exports = {
  convertCoin
};
