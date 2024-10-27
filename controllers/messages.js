const io = require('../app')
const getReceiverSocketId = require('../app')
const customError = require("../customError")
const ChatPreviews = require('../models/chatPreviews')
const Conversations = require("../models/coversations")
const Messages = require("../models/messages")
const mongoose = require('mongoose')

async function sendMessage(req, res, next) {
    try {
      const { message, senderId, receiverId } = req.body
      
      console.log(message)
      // Check if conversation exists between participants
      let conversation = await Conversations.findOne({
        participants: { $all: [senderId, receiverId] }
      })
  
      if (!conversation) {
        // Create new conversation if it doesn't exist
        conversation = await Conversations.create({
          participants: [senderId, receiverId],
        })
      }
  
      // Create a new message
      const newMessage = new Messages({
        senderId,
        receiverId,
        messages: message,
      })
  
      if (newMessage) {
        // Add the message ID to the conversation
        conversation.messages.push(newMessage._id)
        
        let checkIfUserChatPreviewExists = await ChatPreviews.findOne({
            participants: {$all:[senderId, receiverId]}
        })

        if(checkIfUserChatPreviewExists){
           const newChatPreview = await ChatPreviews.findOneAndUpdate({
            participants:{$all: [senderId, receiverId]},
            lastMessage: message
           })

           await newChatPreview.save()

           res.json({message: newChatPreview})
        }

        checkIfUserChatPreviewExists = await ChatPreviews.create({
            participants:{$all: [senderId, receiverId]},
            lastMessage: message
        })

        
        res.json({message: checkIfUserChatPreviewExists})
      }
  
      // Save message and conversation
      await Promise.all([newMessage.save(), conversation.save()])

      const socket = req.socket;

      console.log(socket)
      console.log(newMessage)
      // Get the socket ID of the receiver (if they are online)

        // // Emit the new message to the receiver's socket
        // io.to(senderId).emit('newMessage', newMessage);  // Emit to sender's room
        // io.to(receiverId).emit('newMessage', newMessage)
      
  
      // Return the new message in the response
      res.json({ message: newMessage })
    } catch (err) {
      console.log(err)
      next(customError(err))
    }
  }


  async function getMessage(req, res, next) {
    try {
        const { senderId, receiverId } = req.body;

        console.log(senderId, receiverId, 'get message');

        // Ensure that senderId and receiverId are ObjectId and use `new` keyword
        const conversation = await Conversations.findOne({
            participants: {
                $all: [new mongoose.Types.ObjectId(senderId), new mongoose.Types.ObjectId(receiverId)]
            }
        }).populate('messages');

        console.log(conversation);

        if (!conversation) return res.json({ message: [] });

        // Filter messages to only include those between senderId and receiverId
        const filteredMessages = conversation.messages.filter(msg => 
            (msg.senderId.toString() === senderId && msg.receiverId.toString() === receiverId) || 
            (msg.senderId.toString() === receiverId && msg.receiverId.toString() === senderId)
        );

        console.log(filteredMessages, 'filtered')

        res.json({ message: filteredMessages });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}



async function getUserMessagePreviews(req, res, next) {
    try {
        const { senderId } = req.body;

        console.log(senderId, 'chatt preview id')

        let chatPreviews = await ChatPreviews.find({
            participants: {$all:[senderId]}
        })

        console.log(chatPreviews, 'previews')


        console.log(chatPreviews, 'previews');
        
        res.json({message: chatPreviews});
    } catch (err) {
      console.log(err);
      next(customError(err));
    }
}

  
module.exports = {
    sendMessage,
    getMessage,
    getUserMessagePreviews
}