const mongoose = require('mongoose');

const KycSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
},
bvnNumber:{
    type:Number,
    required:true
},
bvnPhoto:{
type:String,
default:null
},
ninNumber:{
    type:Number,
    required:true
},
ninPhoto:{
    type:String,
    required:true,
    unique:true
},
isBvnVerified:{
    type:Boolean,
    default:false
},
isNinVerified:{
  type:Boolean,
  default:false
},
isUserVerified:{
    type:Boolean,
    default:false
}
});

const Kyc = mongoose.model('Kyc', KycSchema);


module.exports = Kyc;
