// socket/socketHandler.js
// Sets up Socket.io for real-time live chat between customers and support agents.
// Each conversation gets its own "room" (named by conversation id) so messages
// are only broadcast to participants of that specific chat.

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const initSocket = (io) => {
  // Authenticate the socket connection using the JWT passed in the handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.user.role})`);

    // Join the room for a specific conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    // Handle a new live chat message
    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const senderType = socket.user.role === 'customer' ? 'customer' : 'agent';

        const message = await Message.create({
          conversation: conversationId,
          senderType,
          sender: socket.user._id,
          content,
        });

        // Broadcast to everyone in the conversation room, including the sender,
        // so all connected clients (customer + agent) stay in sync.
        io.to(conversationId).emit('new_message', {
          _id: message._id,
          conversation: conversationId,
          senderType,
          sender: { _id: socket.user._id, name: socket.user.name },
          content,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    // Typing indicator for a nicer live-chat UX
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('user_typing', {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = initSocket;
