const mongoose = require('mongoose');

const ChatPreviewsSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    }
  ],
  recentMessage: {
    type: String,
    default: null
  },
  recentImage: {
    type: String,
    default: null
  }
}, { timestamps: true });

const ChatPreviews = mongoose.model('ChatPreviews', ChatPreviewsSchema);

module.exports = ChatPreviews;
