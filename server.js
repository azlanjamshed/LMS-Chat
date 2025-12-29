const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});
app.use(express.static("public"));
// 🔥 Socket.io connection handler
// io.on('connection', (socket) => {
//     console.log('✅ User connected:', socket.id);

//     socket.on('chat-message', (msg) => {
//         console.log('📨 Message:', msg);
//         io.emit('chat-message', msg); // Send to ALL users
//     });

//     socket.on('disconnect', () => {
//         console.log('❌ User disconnected:', socket.id);
//     });
// });
io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`✅ ${socket.id} joined room: ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`❌ ${socket.id} left room: ${roomId}`);
    });

    // Update chat-message to send ONLY to room
    socket.on('chat-message', (data) => {
        const { message, roomId } = data;
        io.to(roomId).emit('chat-message', {
            message,
            roomId,
            timestamp: new Date()
        });
        console.log(`📨 Room ${roomId}: ${message}`);
    });

});

app.get('/', (req, res) => {
    res.send(`
    <h1>🚀 LMS Chat Server + Socket.io Ready!</h1>
    <p>Open <a href="/chatRoom.html">Chat Demo</a></p>
  `);
});

server.listen(3000, () => {
    console.log('✅ Server + Socket.io on http://localhost:3000');
});
