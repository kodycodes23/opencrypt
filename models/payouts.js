const mongoose = require('mongoose');
const { Schema } = mongoose;

const PayoutSchema = new Schema(
    {
        userId: {
            type: String
        },
        wallet_id: {
            type: Number
        },
        amount: {
            type: Number
        },
        isConfirmed: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Use mongoose.models to avoid recompiling the model in watch mode
const Payout = mongoose.models?.Payout || mongoose.model("Payout", PayoutSchema);

module.exports = PayoutSchema;
