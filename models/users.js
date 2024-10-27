const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: null,
    unique: true,
    required: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isAboveEighteen: {
    type: Boolean,
    default: false
  },
  subAccountId: { 
    type: String,
    default: null
  },
  session: {
    type: Object,
    default: null
  },
  isUserVerified: {
    type: Boolean,
    default: false
  },
  userAuthId: {
    type: String,
    default: null
  },
  otpId: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  isOnline:{
    type:Boolean,
    default: false
  },
  isNewUser:{
    type:Boolean,
    default: false
  },
  // Uncomment and add the relevant schemas if needed
  // funds: {
  //   BTC: { type: Number, default: 0 },
  //   ETH: { type: Number, default: 0 },
  //   USDT: { type: Number, default: 0 }
  // },
  // depositAddress: {
  //   BTC: String,
  //   ETH: String,
  //   USDT: String
  // },
  // paymentMethods: [
  //   {
  //     type: { type: String, enum: ['bank', 'card'] },
  //     details: Schema.Types.Mixed
  //   }
  // ],
  // escrows: [EscrowSchema]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
