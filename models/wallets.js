const mongoose = require('mongoose');
const { Schema } = mongoose;

const WalletSchema = new Schema(
  {
    userId: {
      type: String,
      required: true, // Ensure userId is always provided
      unique: true, // Prevent multiple wallets for the same user
    },
    balances: {
      BTC: { type: Number, default: 0 },
      ETH: { type: Number, default: 0 },
      USDC: { type: Number, default: 0 },
      BNB: { type: Number, default: 0 },
    },
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Use mongoose.models to avoid recompiling the model in watch mode
const Wallets = mongoose.model("Wallets", WalletSchema);

module.exports = Wallets;
