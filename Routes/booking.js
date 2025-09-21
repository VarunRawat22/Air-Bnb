const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware.js');
const wrapAsync = require('../utils/wrapAsync');
const bookingController = require('../controllers/bookings.js');
const paymentController = require('../controllers/payment.js');

// Booking routes
router.get('/', isLoggedIn, wrapAsync(bookingController.index));

router.get('/new/:id', isLoggedIn, wrapAsync(bookingController.showBookingForm));
router.post('/new/:id', isLoggedIn, wrapAsync(bookingController.createBooking));

router.get('/:id', isLoggedIn, wrapAsync(bookingController.showBooking));
router.get('/:id/payment', isLoggedIn, wrapAsync(bookingController.showPayment));

router.post('/:id/cancel', isLoggedIn, wrapAsync(bookingController.cancelBooking));

// API routes for availability and pricing
router.get('/availability/:id', wrapAsync(bookingController.getAvailability));
router.get('/calculate-price/:id', wrapAsync(bookingController.calculatePrice));

// Payment routes
router.post('/:bookingId/create-payment-intent', isLoggedIn, wrapAsync(paymentController.createPaymentIntent));
router.get('/payment/success', wrapAsync(paymentController.paymentSuccess));
router.get('/payment/failure', wrapAsync(paymentController.paymentFailure));
router.post('/:bookingId/refund', isLoggedIn, wrapAsync(paymentController.processRefund));
router.get('/payment/status/:paymentIntentId', wrapAsync(paymentController.getPaymentStatus));

// Webhook route (no authentication needed)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router; 