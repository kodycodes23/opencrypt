const mongoose = require('mongoose')

const ConversationsSchema = mongoose.Schema({
    participants:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Users'
        }
    ],
    messages:[
        {
           type: mongoose.Schema.Types.ObjectId,
            ref:'Messages',
            default:[]
    }
],
},{timestamps: true})


const Conversations = mongoose.model('Conversations', ConversationsSchema)


module.exports =  Conversations
