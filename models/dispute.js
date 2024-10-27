const mongoose = require('mongoose');
const { Schema } = mongoose;

const DisputeSchema = new Schema(
    {
        userId: {
            type: String
        },
        title:{
        type: String
        },
        message: {
            type: String
        },
        screenshot:{
            type:String
        }
    },
    { timestamps: true }
);

// Use mongoose.models to avoid recompiling the model in watch mode
const Dispute = mongoose.models?.Dispute || mongoose.model("Dispute", DisputeSchema);

module.exports = Dispute