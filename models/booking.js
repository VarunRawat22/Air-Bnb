const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    nights: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentIntentId: {
        type: String
    },
    refundId: {
        type: String
    },
    commission: {
        type: Number,
        default: 0
    },
    hostPayout: {
        type: Number,
        default: 0
    },
    specialRequests: {
        type: String
    },
    cancellationReason: {
        type: String
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: String,
        enum: ['guest', 'host', 'admin']
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

// Calculate nights before saving
bookingSchema.pre('save', function(next) {
    if (this.checkIn && this.checkOut) {
        const checkIn = new Date(this.checkIn);
        const checkOut = new Date(this.checkOut);
        const diffTime = Math.abs(checkOut - checkIn);
        this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Calculate commission (3% of total price)
    this.commission = Math.round(this.totalPrice * 0.03);
    this.hostPayout = this.totalPrice - this.commission;
    
    this.updatedAt = new Date();
    next();
});

// Virtual for formatted dates
bookingSchema.virtual('checkInFormatted').get(function() {
    return this.checkIn ? this.checkIn.toLocaleDateString() : '';
});

bookingSchema.virtual('checkOutFormatted').get(function() {
    return this.checkOut ? this.checkOut.toLocaleDateString() : '';
});

bookingSchema.virtual('totalPriceFormatted').get(function() {
    return this.totalPrice ? `₹${this.totalPrice.toLocaleString('en-IN')}` : '';
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    const now = new Date();
    const checkInDate = new Date(this.checkIn);
    const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
    
    return this.status === 'confirmed' && daysUntilCheckIn > 1;
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefundAmount = function() {
    const now = new Date();
    const checkInDate = new Date(this.checkIn);
    const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilCheckIn >= 7) {
        return this.totalPrice; // Full refund
    } else if (daysUntilCheckIn >= 1) {
        return Math.round(this.totalPrice * 0.5); // 50% refund
    } else {
        return 0; // No refund
    }
};

module.exports = mongoose.model('Booking', bookingSchema); 