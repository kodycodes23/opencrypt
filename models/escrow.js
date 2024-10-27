const mongoose = require('mongoose');


const EscrowSchema = new mongoose.Schema({
    amount: Number,
    asset: String,
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    fiatAmount:{
      type:String,
      default:null
    },
    coin:{
      type:String,
      default:null
    },
    chatId:{
      type:String,
      default:null
    },
    coinRate:{
      type:String
    }
  });

  const Escrow = mongoose.model('Escrow', EscrowSchema);

  module.exports = Escrow;
