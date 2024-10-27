const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionHistorySchema = new Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        transactionType: {
            type: String,
            // enum: ['deposit', 'withdrawal', 'purchase', 'sale', 'transfer', 'escrow'], 
            required: true
        },
        asset: {
            type: String,
            required: true
        },
        coinAmount: {
            type: Number,
        },
        amountInFiat:{
           type:String
        },
        status: {
            type: String, 
            default: 'pending'
        },
        details: {
            type: String,
            required: true // Could store more information such as recipient details, transaction ID, etc.
        },
        txId:{
            type:String
        },
        rId:{
            type:String
        },
    },
    { timestamps: true }
);

const TransactionHistory = mongoose.model('TransactionHistory', TransactionHistorySchema);

module.exports = TransactionHistory;
