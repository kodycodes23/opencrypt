const mongoose = require('mongoose');
const { Schema } = mongoose;

const BanksSchema = new Schema(
    {
        userId: {
            type: String,
            default: null
        },
        bankName: {
            type: String,
            default: null
        },
        accountNumber:{
           type: Number,
           default:null
        },
        bankCode:{
            type: Number,
            default:null
        },
        accountName:{
            type:String,
            default: null
        },
        userId:{
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

// Use mongoose.models to avoid recompiling the model in watch mode
const Banks = mongoose.models?.Banks || mongoose.model("Banks", BanksSchema);

module.exports = Banks;
