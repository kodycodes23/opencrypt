const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionHistoryForFiatSchema = new Schema(
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
        amount:{
           type:String
        },
        name:{
    type: String,
    default:null,
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
        receiverIdForTransfer:{
            type: String,
            default:null
        },
        receiverNote:{
            type: String,
            default:null
        }
    },
    { timestamps: true }
);

const TransactionHistoryForFiat = mongoose.model('TransactionHistoryForFiat', TransactionHistoryForFiatSchema);

module.exports = TransactionHistoryForFiat;
