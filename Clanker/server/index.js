const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend access
    methods: ["GET", "POST"]
  }
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('find_partner', () => {
    // If the same user presses find partner multiple times, ignore
    if (waitingUser === socket) return;

    if (waitingUser) {
      // Partner found
      const roomName = `room_${waitingUser.id}_${socket.id}`;
      
      socket.join(roomName);
      waitingUser.join(roomName);

      // Caller needs to create WebRTC offer, other waits for it
      waitingUser.emit('match_found', { caller: true });
      socket.emit('match_found', { caller: false });
      
      console.log(`Matched ${waitingUser.id} and ${socket.id} into ${roomName}`);
      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit('waiting');
      console.log(`User ${socket.id} is waiting for a partner`);
    }
  });

  // Relay WebRTC signaling data
  const relayToPartner = (event) => {
    socket.on(event, (payload) => {
      // Find user's current valid room
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      if (rooms.length > 0) {
        socket.to(rooms[0]).emit(event, payload);
      }
    });
  };

  relayToPartner('offer');
  relayToPartner('answer');
  relayToPartner('ice_candidate');

  // Handle a user skipping their partner
  socket.on('leave_partner', () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(roomId => {
      socket.to(roomId).emit('partner_left');
      socket.leave(roomId);
    });
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(roomId => {
      socket.to(roomId).emit('partner_left');
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
