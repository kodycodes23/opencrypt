const mongoose = require('mongoose');
const { Schema } = mongoose;

const Orderschema = new Schema(
    {
        userId: {
            type: String
        },
        coin: {
            type: String
        },
        isUserOnline:{
          type:Boolean,
          default: false
        },
        limits:{
            type:String
        },
        quantity:{
            type:String
        },
        sellersRate:{
            type:String
        },
        sellersName:{
            type:String
        },
        sellersImage:{
            type:String
        },
        accountNumber:{
            type:String
        },
        bankName:{
            type:String
        },
        paymentType:{
            type:String
        }

        
    },
    { timestamps: true }
);

// Use mongoose.models to avoid recompiling the model in watch mode
const Orders =  mongoose.model("Orders", Orderschema);
module.exports = Orders;

