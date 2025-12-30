require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { register, login, generateToken, verifyToken } = require('./model/User.Model'); // ✅ Fixed path
const mongoose = require('mongoose');
const Message = require('./model/Message.Model'); // ✅ Fixed name + path

const app = express();
const server = http.createServer(app);
const CryptoJS = require('crypto-js');
const ENCRYPT_KEY = 'lms-chat-secret-2025-change-this';
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Encrypt function
function encryptMessage(text) {
    return CryptoJS.AES.encrypt(text, ENCRYPT_KEY).toString();
}

// Decrypt function  
function decryptMessage(encrypted) {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPT_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}
app.use(express.static("public"));
app.use(express.json());

// 🔥 CONNECT MONGODB FIRST
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

// 🔥 FIXED: Real JWT in login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = login(username, password);
    if (user) {
        const token = generateToken(user.id, user.username); // ✅ REAL JWT!
        res.json({ success: true, token, username: user.username });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const user = register(username, password);
    res.json({ success: true, userId: user.id, username: user.username });
});

// 🔥 JWT Socket.io middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Invalid token'));
    socket.user = decoded;
    console.log(`🔐 ${socket.user.username} authenticated`);
    next();
});

io.on('connection', (socket) => {
    socket.on('join-room', async (roomId) => {
        socket.join(roomId);
        console.log(`✅ ${socket.id} joined room: ${roomId}`);

        // 🔥 Load chat history
        const recentMessages = await Message.find({ roomId })
            .sort({ timestamp: -1 }).limit(50)
            .sort({ timestamp: 1 });
        socket.emit('chat-history', recentMessages);

        // User count
        const clients = io.sockets.adapter.rooms.get(roomId);
        const userCount = clients ? clients.size : 0;
        io.to(roomId).emit('room-users', { roomId, userCount });
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`❌ ${socket.id} left room: ${roomId}`);
        const clients = io.sockets.adapter.rooms.get(roomId);
        const userCount = clients ? clients.size : 0;
        io.to(roomId).emit('room-users', { roomId, userCount });
    });

    socket.on('chat-message', async (data) => {
        const { message, roomId } = data;
        const username = socket.user.username; // ✅ Use authenticated user

        // 🔥 FIXED: Use Message model
        const encryptedMessage = encryptMessage(message);
        const newMessage = new Message({
            roomId,
            username,
            message: encryptedMessage // Save encrypted!
        });
        await newMessage.save();

        // Send ENCRYPTED to clients (decrypt on frontend)
        io.to(roomId).emit('chat-message', {
            message: encryptedMessage,
            username,
            roomId,
            timestamp: new Date()
        });
        console.log(`📨 [${username}] ${roomId}: ${message}`);
    });
    // 🔥 TYPING INDICATORS
    socket.on('typing', (data) => {
        socket.to(data.roomId).emit('user-typing', { username: data.username, roomId: data.roomId });
    });

    socket.on('stop-typing', (data) => {
        socket.to(data.roomId).emit('user-stopped-typing', { username: data.username, roomId: data.roomId });
    });

});

app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 LMS Chat Server Ready!</h1>
        <p><a href="/chatRoom.html">Open Chat</a></p>
    `);
});

server.listen(3000, () => {
    console.log('✅ Server + Socket.io on http://localhost:3000');
});
