const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-key-change-in-production';

function generateToken(userId, username) {
    return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

let users = []; // Temporary storage
let nextId = 1;

function register(username, password) {
    const user = { id: nextId++, username, password };
    users.push(user);
    return user;
}

function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    return user;
}

module.exports = { register, login, generateToken, verifyToken };
