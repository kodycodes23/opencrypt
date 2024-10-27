const mongoose = require('mongoose');
const { Schema } = mongoose;

const FiatWalletSchema = new Schema(
    {
        userId: {
            type: String,
            required: true
        },
        balance: {
            NGN: { type: Number, default: 0 },
            EUR: { type: Number, default: 0 },
            USD: { type: Number, default: 0 },
            GHS: { type: Number, default: 0 },
            ZAR: { type: Number, default: 0 },
        },
        dailyTransactionLimit: {
            limit: { type: Number, default: 200000 },  // Example limit (adjust as needed)
            amountUsed: { type: Number, default: 0 },  // Tracks how much has been sent today
            lastTransactionDate: { type: Date, default: null } // Timestamp of last transaction
        },
        maxTransactionAmount: {
            type: Number, default: 100000 // Example max amount per transaction (adjust as needed)
        }
    },
    { timestamps: true }
);

const FiatWallet = mongoose.models?.FiatWallet || mongoose.model("FiatWallet", FiatWalletSchema);

module.exports = FiatWallet;
