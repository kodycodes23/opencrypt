const mongoose = require('mongoose');
const { Schema } = mongoose;

const RealCryptoDespositSchema = new Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        asset: {
            type: String,
            required: true
        },
        coinAmount: {
            type: Number,
        },
        status: {
            type: String, 
            default: 'pending'
        },
        details: {
            type: String,
            required: true 
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

const RealCryptoDesposit = mongoose.model('RealCryptoDesposit', RealCryptoDespositSchema);

module.exports = RealCryptoDesposit;
