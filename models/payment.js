const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'inr'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet'],
        required: true
    },
    paymentIntentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'cancelled'],
        default: 'pending'
    },
    refundId: {
        type: String
    },
    refundAmount: {
        type: Number
    },
    refundReason: {
        type: String
    },
    stripeCustomerId: {
        type: String
    },
    paymentMethodDetails: {
        type: Schema.Types.Mixed
    },
    metadata: {
        type: Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
paymentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for formatted amount
paymentSchema.virtual('amountFormatted').get(function() {
    return this.amount ? `₹${this.amount.toLocaleString('en-IN')}` : '';
});

// Virtual for formatted refund amount
paymentSchema.virtual('refundAmountFormatted').get(function() {
    return this.refundAmount ? `₹${this.refundAmount.toLocaleString('en-IN')}` : '';
});

module.exports = mongoose.model('Payment', paymentSchema); 