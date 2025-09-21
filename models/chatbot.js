const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatbotMessageSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    intent: {
        type: String,
        enum: ['booking_help', 'payment_help', 'cancellation_help', 'general_help', 'technical_support'],
        default: 'general_help'
    },
    isResolved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
chatbotMessageSchema.index({ user: 1, sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatbotMessage', chatbotMessageSchema);
