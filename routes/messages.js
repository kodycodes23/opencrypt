const express = require('express');
const { sendMessage, getMessage, getUserMessagePreviews } = require('../controllers/messages');

const router = express.Router();

// Route to initiate chat between two users
router.post('/messages/send', sendMessage);

router.post('/messages/get', getMessage)

router.post('/chat-preview', getUserMessagePreviews);

// // Route to get chat previews
// router.get('/messages/preview/:userId', getChatPreviews);

// // Route to get current chat between users
// router.post('/messages', getCurrentChatBetweenUsers);

// router.post('/messages/one', getASingleChatBetweenUsers);

module.exports = router;
