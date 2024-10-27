const mongoose = require('mongoose');

const ExchangeSchema = new mongoose.Schema(
  {
    userId: { type:String, required: true },
    convertFrom: { type: String, required: true },
    convertTo: { type: String, required: true },
    fromAmount: { type: Number, required: true },
    toAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

const Exchange = mongoose.model('Exchange', ExchangeSchema);

module.exports = Exchange;
