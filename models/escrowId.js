const mongoose = require('mongoose')

const EscrowIdSchema = mongoose.Schema({
    participants:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Users'
        }
    ],
    escrowId:[
        {
           type: String,
            ref:'Escrow',
            default:null
        }
],
},{timestamps: true})


const EscrowIds = mongoose.model('EscrowIds', EscrowIdSchema)


module.exports =  EscrowIds
