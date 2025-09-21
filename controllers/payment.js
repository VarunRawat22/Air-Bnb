const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');

// Create payment intent
module.exports.createPaymentIntent = wrapAsync(async (req, res) => {
    if (!stripe) {
        req.flash('error', 'Payment system is not configured. Please contact support.');
        return res.redirect('/bookings');
    }

    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
        .populate('listing')
        .populate('guest');

    if (!booking) {
        req.flash('error', 'Booking not found');
        return res.redirect('/bookings');
    }

    // Check if user is the guest
    if (booking.guest._id.toString() !== req.user._id.toString()) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/bookings');
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ booking: bookingId });
    if (existingPayment && existingPayment.status === 'succeeded') {
        req.flash('error', 'Payment already completed');
        return res.redirect(`/bookings/${bookingId}`);
    }

    try {
        // Create or retrieve Stripe customer
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: req.user.email,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email: req.user.email,
                name: req.user.username || req.user.email,
                metadata: {
                    userId: req.user._id.toString()
                }
            });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: booking.totalPrice * 100, // Convert to paise
            currency: 'inr',
            customer: customer.id,
            metadata: {
                bookingId: bookingId,
                userId: req.user._id.toString(),
                listingId: booking.listing._id.toString()
            },
            description: `Booking for ${booking.listing.title}`,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Create or update payment record
        const paymentData = {
            booking: bookingId,
            user: req.user._id,
            amount: booking.totalPrice,
            paymentMethod: 'card',
            paymentIntentId: paymentIntent.id,
            stripeCustomerId: customer.id,
            status: 'pending',
            metadata: {
                listingTitle: booking.listing.title,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                guests: booking.guests
            }
        };

        if (existingPayment) {
            await Payment.findByIdAndUpdate(existingPayment._id, paymentData);
        } else {
            await Payment.create(paymentData);
        }

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);
        req.flash('error', 'Failed to create payment. Please try again.');
        res.status(500).json({ error: 'Payment creation failed' });
    }
});

// Handle payment success
module.exports.paymentSuccess = wrapAsync(async (req, res) => {
    const { paymentIntentId } = req.query;
    
    if (!paymentIntentId) {
        req.flash('error', 'Invalid payment information');
        return res.redirect('/bookings');
    }

    try {
        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            req.flash('error', 'Payment was not successful');
            return res.redirect('/bookings');
        }

        // Update payment record
        const payment = await Payment.findOne({ paymentIntentId });
        if (!payment) {
            req.flash('error', 'Payment record not found');
            return res.redirect('/bookings');
        }

        payment.status = 'succeeded';
        payment.paymentMethodDetails = {
            paymentMethod: paymentIntent.payment_method,
            last4: paymentIntent.charges.data[0]?.payment_method_details?.card?.last4
        };
        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.booking);
        if (booking) {
            booking.status = 'confirmed';
            booking.paymentStatus = 'paid';
            await booking.save();
        }

        req.flash('success', 'Payment successful! Your booking has been confirmed.');
        res.redirect(`/bookings/${payment.booking}`);

    } catch (error) {
        console.error('Payment success handling error:', error);
        req.flash('error', 'Error processing payment success');
        res.redirect('/bookings');
    }
});

// Handle payment failure
module.exports.paymentFailure = wrapAsync(async (req, res) => {
    const { paymentIntentId } = req.query;
    
    if (paymentIntentId) {
        const payment = await Payment.findOne({ paymentIntentId });
        if (payment) {
            payment.status = 'failed';
            await payment.save();
        }
    }

    req.flash('error', 'Payment failed. Please try again.');
    res.redirect('/bookings');
});

// Process refund
module.exports.processRefund = wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId)
        .populate('listing')
        .populate('guest');

    if (!booking) {
        req.flash('error', 'Booking not found');
        return res.redirect('/bookings');
    }

    // Check if user can cancel
    if (!booking.canBeCancelled()) {
        req.flash('error', 'This booking cannot be cancelled');
        return res.redirect(`/bookings/${bookingId}`);
    }

    // Check if user is authorized to cancel
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();
    
    if (!isGuest && !isHost) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/bookings');
    }

    try {
        if (!stripe) {
            req.flash('error', 'Payment system is not configured. Please contact support.');
            return res.redirect(`/bookings/${bookingId}`);
        }

        const payment = await Payment.findOne({ booking: bookingId });
        if (!payment || payment.status !== 'succeeded') {
            req.flash('error', 'No successful payment found for refund');
            return res.redirect(`/bookings/${bookingId}`);
        }

        const refundAmount = booking.calculateRefundAmount();
        
        if (refundAmount === 0) {
            req.flash('error', 'No refund available for this booking');
            return res.redirect(`/bookings/${bookingId}`);
        }

        // Process refund through Stripe
        const refund = await stripe.refunds.create({
            payment_intent: payment.paymentIntentId,
            amount: refundAmount * 100, // Convert to paise
            reason: 'requested_by_customer',
            metadata: {
                bookingId: bookingId,
                reason: reason,
                cancelledBy: isGuest ? 'guest' : 'host'
            }
        });

        // Update payment record
        payment.refundId = refund.id;
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        await payment.save();

        // Update booking status
        booking.status = 'cancelled';
        booking.cancellationReason = reason;
        booking.cancelledAt = new Date();
        booking.cancelledBy = isGuest ? 'guest' : 'host';
        await booking.save();

        req.flash('success', `Booking cancelled successfully. Refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed.`);
        res.redirect(`/bookings/${bookingId}`);

    } catch (error) {
        console.error('Refund processing error:', error);
        req.flash('error', 'Error processing refund. Please contact support.');
        res.redirect(`/bookings/${bookingId}`);
    }
});

// Get payment status
module.exports.getPaymentStatus = wrapAsync(async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ error: 'Payment system not configured' });
    }

    const { paymentIntentId } = req.params;
    
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        res.json({ status: paymentIntent.status });
    } catch (error) {
        console.error('Payment status check error:', error);
        res.status(500).json({ error: 'Failed to check payment status' });
    }
});

// Webhook handler for Stripe events
module.exports.stripeWebhook = async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ error: 'Payment system not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object);
                break;
            case 'charge.refunded':
                await handleRefundSuccess(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent) {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    if (payment) {
        payment.status = 'succeeded';
        await payment.save();

        const booking = await Booking.findById(payment.booking);
        if (booking) {
            booking.status = 'confirmed';
            booking.paymentStatus = 'paid';
            await booking.save();
        }
    }
}

async function handlePaymentFailure(paymentIntent) {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    if (payment) {
        payment.status = 'failed';
        await payment.save();
    }
}

async function handleRefundSuccess(charge) {
    const payment = await Payment.findOne({ paymentIntentId: charge.payment_intent });
    if (payment) {
        payment.status = 'refunded';
        await payment.save();
    }
} 