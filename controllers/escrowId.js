const customError = require("../customError")
const EscrowIds = require("../models/escrowId")
const mongoose = require('mongoose')


async function sendEscrowId(req, res, next) {
    try {
      const { senderId, receiverId, escrowId } = req.body;
  
      // Convert to ObjectId if they are not already
      const senderObjectId = new mongoose.Types.ObjectId(senderId);
      const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
  
      console.log(senderObjectId, receiverObjectId, escrowId, 'body');
  
      // Check if an escrow with the given participants exists
      let checkIfUserWithEscrowIdExist = await EscrowIds.findOne({
        participants: { $all: [senderObjectId, receiverObjectId] }
      });
  
      if (checkIfUserWithEscrowIdExist) {
        // If it exists, update the escrowId
        checkIfUserWithEscrowIdExist = await EscrowIds.findOneAndUpdate(
          { participants: { $all: [senderObjectId, receiverObjectId] } },
          { escrowId },
          { new: true }
        );
        console.log(checkIfUserWithEscrowIdExist, 'updating escrow id');
      } else {
        // If it doesn't exist, create a new entry
        checkIfUserWithEscrowIdExist = new EscrowIds({
          participants: [senderObjectId, receiverObjectId],
          escrowId
        });
  
        console.log(checkIfUserWithEscrowIdExist, 'creating escrow id');
        await checkIfUserWithEscrowIdExist.save();
      }
  
      res.json({ message: checkIfUserWithEscrowIdExist });
    } catch (err) {
      console.log(err);
      next(customError(err));
    }
}


async function getEscrowId(req,res,next){
    try{
        const {senderId, receiverId} = req.body

        const senderObjectId = new mongoose.Types.ObjectId(senderId);
        const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
  
        
        let checkIfUserWithEscrowIdExist = await EscrowIds.findOne({
            participants:{$all:[senderObjectId, receiverObjectId]}
        })

        if(!checkIfUserWithEscrowIdExist) return next(customError('Escrow id not found'))

        console.log(checkIfUserWithEscrowIdExist, 'get escrow')

        res.json({message: checkIfUserWithEscrowIdExist})
    }
    catch(err){
        console.log(err)
        next(customError(err))
    }
}

module.exports = {
    sendEscrowId,
    getEscrowId
}