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
io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    socket.on('chat-message', (msg) => {
        console.log('📨 Message:', msg);
        io.emit('chat-message', msg); // Send to ALL users
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send(`
    <h1>🚀 LMS Chat Server + Socket.io Ready!</h1>
    <p>Open <a href="/chat.html">Chat Demo</a></p>
  `);
});

server.listen(3000, () => {
    console.log('✅ Server + Socket.io on http://localhost:3000');
});
