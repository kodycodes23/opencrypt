const mongoose = require('mongoose')

const MessagesSchema = mongoose.Schema({
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    receiverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    messages:{
        type: String,
        default:null
    },
    image:{
        type:String,
        default:null
    }
},{timestamps: true})


const Messages = mongoose.model('Messages', MessagesSchema)


module.exports =  Messages
