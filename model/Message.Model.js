const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: String,
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now, index: true }
});

// 🔥 Fast queries by room + time
messageSchema.index({ roomId: 1, timestamp: -1 });
const messageModel = mongoose.model('Message', messageSchema);
module.exports = messageModel
