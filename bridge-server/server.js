const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    // Force existing sockets in this room to leave if they are not the current one
    // In a production app, we'd track who is 'desktop' vs 'mobile'
    // For this MVP, we just notify the room. The Desktop will handle the state update.
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    
    // Broadcast to the room that a new controller joined. 
    // Desktop will receive this and can reset its connection state.
    socket.to(roomId).emit('mobile-connected', { socketId: socket.id }); 
  });

  socket.on('motion-data', (data) => {
    socket.to(data.roomId).emit('motion-data', data);
  });

  socket.on('menu-action', (data) => {
    socket.to(data.roomId).emit('menu-action', data);
  });

  socket.on('state-update', (data) => {
    socket.to(data.roomId).emit('state-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Bridge server listening on port ${PORT}`);
});