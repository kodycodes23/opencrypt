const express = require('express');
const http = require('http'); // Import http module
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const WebSocket = require('ws'); // Import WebSocket module
const { notFound } = require('./notFound'); // Changed from .js to just filename
const userRouter = require('./routes/user'); // Changed from .js to just filename
const customError = require('./customError'); // Changed from .js to just filename
const kycRouter = require('./routes/kyc'); // Changed from .js to just filename
const escrowRouter = require('./routes/escrow'); // Changed from .js to just filename
const orderRouter = require('./routes/order'); // Changed from .js to just filename
const transactionHistoryRouter = require('./routes/transactionHistory'); // Changed from .js to just filename
const messagesRouter = require('./routes/messages'); // Changed from .js to just filename
const paypal = require('paypal-rest-sdk');
const depositRouter = require('./routes/deposit'); // Changed from .js to just filename
const walletRouter = require('./routes/wallets'); // Changed from .js to just filename
const exchangeRouter = require('./routes/exchange'); // Changed from .js to just filename
const withdrawRouter = require('./routes/withdraw'); // Changed from .js to just filename
const disputeRouter = require('./routes/dispute'); // Changed from .js to just filename
const supportRouter = require('./routes/support'); // Changed from .js to just filename
const fiatWalletRouter = require('./routes/fiatWallet'); // Changed from .js to just filename
const withdrawalForFiatRouter = require('./routes/withdrawalForFiat')
const realCryptoDepositRouter = require('./routes/realcryptodeposit')
const transactionHistoryForFiatRouter = require('./routes/transactionHistoryForFiat')
const {Server} = require('socket.io');
const Messages = require('./models/messages');
const Conversations = require('./models/coversations');
const ChatPreviews = require('./models/chatPreviews');
const escrowIdRouter = require('./routes/escrowId');
const Escrow = require('./models/escrow');
const Orders = require('./models/orders');
const User = require('./models/users');

dotenv.config();

// MongoDB connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error(err.stack); // Log stack trace
    process.exit(1);
  }
};

// Initialize Express
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Use Routes
app.use('/api', userRouter);
app.use('/api', kycRouter);
app.use('/api', escrowRouter);
app.use('/api', messagesRouter);
app.use('/api', orderRouter);
app.use('/api', transactionHistoryRouter);
app.use('/api', depositRouter);
app.use('/api', walletRouter);
app.use('/api', exchangeRouter);
app.use('/api', withdrawRouter);
app.use('/api', disputeRouter);
app.use('/api', supportRouter);
app.use('/api', escrowIdRouter)
app.use('/api', fiatWalletRouter)
app.use('/api', transactionHistoryForFiatRouter)
app.use('/api', withdrawalForFiatRouter)
app.use('/api',realCryptoDepositRouter)



app.get('/', (req, res) => {
  res.send('Coinnet Server is up and running');
});

// 404 Middleware (should be after your routes)
// app.use('*', notFound);

// Error Handling Middleware (should be after all other middlewares)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || 'Server Error',
  };

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// Create HTTP server and attach the Express app
const server = http.createServer(app);

// Create WebSocket server and attach it to the HTTP server
const io = new Server(server)

const useSocketMap = {}; // To track user socket IDs
const onlineUsers = new Map(); // To store the online status of users
const userLastHeartbeat = {}; // Store the last heartbeat timestamp for each user


io.on('connection', (socket) => {
  console.log('Socket.IO connection established');

  // Get userId from the query when a socket connects
  const userId = socket.handshake.query.userId;

  // If userId exists, map it to the socket ID and join the user to a room
  if (userId) {
    useSocketMap[userId] = socket.id;
    socket.join(userId); // Join room named by userId

    console.log(`User ${userId} connected and joined room ${userId}`);

    //check escrow socket


    socket.on('userOnline', async ({ userId }) => {
      try {
        console.log(userId)
        if(userId){
        console.log(userId, 'from user online')
          await User.findByIdAndUpdate(userId, { isOnline: true });
          console.log(`User ${userId} is online`);
        }
      } catch (error) {
          console.error(error);
      }
  });


  socket.on('checkSellerOnlineStatus', async ({ userId }) => {
    try {
      console.log('Received checkSellerOnlineStatus event from user:', userId);
  
      // Step 1: Find online users
      const onlineUsers = await User.find({ isOnline: true }).select('_id');
      const onlineUserIds = onlineUsers.map(user => user._id);
  
      // Step 2: Find orders with online sellers
      const ordersWithOnlineSellers = await Orders.find({
        userId: { $in: onlineUserIds } // Orders where userId is in the list of online users
      }).populate({
        path: 'userId', // Populate user data
        match: { isOnline: true } // Only match online users
      });
  
      // Step 3: Emit the filtered orders to the client
      console.log(ordersWithOnlineSellers, 'online orders');
      socket.emit('onlineSellersOrders', ordersWithOnlineSellers);
      socket.emit('isLoading', {isOnlineSellersLoading: false });
  
    } catch (error) {
      console.error('Error fetching online sellers orders:', error);
    }
  });
  


    socket.on('checkEscrow', async({escrowId,senderId, receiverId}) => {

     const response = await Escrow.findById(escrowId)

     const receiverSocketId = useSocketMap[receiverId]

  
     io.to(senderId).emit('checkEscrow',  response)

     io.to(receiverSocketId).emit('checkEscrow', response)
    })

    // Listen for 'sendMessage' event from the sender
    socket.on('sendMessage', async ({ message, senderId, receiverId, image}, callback) => {
      callback({ status: 'success' });

      console.log(message, senderId, receiverId, image, 'socket')
      try {
        // Find conversation or create a new one
        let conversation = await Conversations.findOne({
          participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
          conversation = await Conversations.create({
            participants: [senderId, receiverId],
          });
        }

        // Create a new message
        const newMessage = new Messages({
          senderId,
          receiverId,
          messages: message,
          image
        });

// Check if chat preview exists
let checkIfUserChatPreviewExists = await ChatPreviews.findOne({
  participants: { $all: [senderId, receiverId] }  // $all only for querying
});

if (!checkIfUserChatPreviewExists) {
  // Create new chat preview
  checkIfUserChatPreviewExists = await ChatPreviews.create({
    participants: [senderId, receiverId], // Direct array of ObjectId
    recentMessage: message,
    recentImage: image
  });

  
} else {
  // Update existing chat preview with the new message
  console.log(image, 'image from update')
  checkIfUserChatPreviewExists = await ChatPreviews.findOneAndUpdate(
    { participants: { $all: [senderId, receiverId] } },
    { recentImage: image, recentMessage: message},
    { new: true }
  );
}


  

        // Add the new message to the conversation
        conversation.messages.push(newMessage._id);
     await Promise.all([newMessage.save(), conversation.save()]);

        // console.log(escrow, 'escrow data')

        // Emit the message to the sender's socket
        socket.to(senderId).emit('newMessage', newMessage);  // To sender


        // Emit the message to the receiver's socket if they are online
        const receiverSocketId = useSocketMap[receiverId];
     
          io.to(receiverSocketId).emit('newMessage', newMessage);  // To receiver

 
      } catch (err) {
        console.error('Error sending message:', err);
      }
    });

    // Handle socket disconnection
    socket.on('heartbeat', () => {
      userLastHeartbeat[userId] = Date.now();
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      setTimeout(async () => {
        const lastHeartbeat = userLastHeartbeat[userId];
        if (lastHeartbeat && Date.now() - lastHeartbeat > 15000) { // 15 seconds timeout
          await User.findByIdAndUpdate(userId, { isOnline: false });
          console.log(`User ${userId} is now offline due to inactivity.`);
        }
      }, 15000); // 15-second grace period before marking offline
    });
  }
});

// Define the Port
const PORT = process.env.PORT || 3000;

// Connect to the database first, then start the server
server.listen(PORT, async () => {
  try {
    console.log('Server connected');
    await connectDB();
    console.log('Connected to database');
  } catch (err) {
    console.error('Error starting server:', err.message);
  }
});
