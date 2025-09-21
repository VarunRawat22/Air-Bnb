const Booking = require('../models/booking');
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');

// Show booking form
module.exports.showBookingForm = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.query;
    
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Listing not found');
        return res.redirect('/listings');
    }

    // Check if user is trying to book their own listing
    if (listing.owner && listing.owner.toString() === req.user._id.toString()) {
        req.flash('error', 'You cannot book your own listing');
        return res.redirect(`/listings/${id}`);
    }

    // Calculate total price
    let totalPrice = 0;
    let nights = 0;
    
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const diffTime = Math.abs(checkOutDate - checkInDate);
        nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalPrice = listing.price * nights;
    }

    res.render('bookings/new', { 
        listing, 
        checkIn, 
        checkOut, 
        guests: guests || 1,
        totalPrice,
        nights
    });
});

// Create booking
module.exports.createBooking = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests, specialRequests } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Listing not found');
        return res.redirect('/listings');
    }

    // Check if listing has an owner
    if (!listing.owner) {
        req.flash('error', 'This listing is not available for booking. Please contact support.');
        return res.redirect(`/listings/${id}`);
    }

    // Check if user is trying to book their own listing
    if (listing.owner.toString() === req.user._id.toString()) {
        req.flash('error', 'You cannot book your own listing');
        return res.redirect(`/listings/${id}`);
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
        req.flash('error', 'Check-in date cannot be in the past');
        return res.redirect(`/listings/${id}/book`);
    }

    if (checkOutDate <= checkInDate) {
        req.flash('error', 'Check-out date must be after check-in date');
        return res.redirect(`/listings/${id}/book`);
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
        listing: id,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            {
                checkIn: { $lt: checkOutDate },
                checkOut: { $gt: checkInDate }
            }
        ]
    });

    if (conflictingBooking) {
        req.flash('error', 'This property is not available for the selected dates');
        return res.redirect(`/listings/${id}/book`);
    }

    // Calculate total price
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = listing.price * nights;

    // Create booking
    const booking = new Booking({
        listing: id,
        guest: req.user._id,
        host: listing.owner,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: parseInt(guests),
        totalPrice,
        nights,
        specialRequests
    });

    await booking.save();

    req.flash('success', 'Booking created successfully! Please complete the payment to confirm.');
    res.redirect(`/bookings/${booking._id}/payment`);
});

// Show booking details
module.exports.showBooking = wrapAsync(async (req, res) => {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
        .populate('listing')
        .populate('guest')
        .populate('host');

    if (!booking) {
        req.flash('error', 'Booking not found');
        return res.redirect('/bookings');
    }

    // Check if user is authorized to view this booking
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isHost = booking.host._id.toString() === req.user._id.toString();
    
    if (!isGuest && !isHost) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/bookings');
    }

    res.render('bookings/show', { booking, isGuest, isHost });
});

// Show user's bookings
module.exports.index = wrapAsync(async (req, res) => {
    const userBookings = await Booking.find({
        $or: [
            { guest: req.user._id },
            { host: req.user._id }
        ]
    })
    .populate('listing')
    .populate('guest')
    .populate('host')
    .sort({ createdAt: -1 });

    res.render('bookings/index', { bookings: userBookings });
});

// Show payment page
module.exports.showPayment = wrapAsync(async (req, res) => {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
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

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
        req.flash('error', 'Payment already completed');
        return res.redirect(`/bookings/${id}`);
    }

    res.render('bookings/payment', { booking });
});

// Cancel booking
module.exports.cancelBooking = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id)
        .populate('listing')
        .populate('guest');

    if (!booking) {
        req.flash('error', 'Booking not found');
        return res.redirect('/bookings');
    }

    // Check if user can cancel
    if (!booking.canBeCancelled()) {
        req.flash('error', 'This booking cannot be cancelled');
        return res.redirect(`/bookings/${id}`);
    }

    // Check if user is authorized to cancel
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();
    
    if (!isGuest && !isHost) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/bookings');
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = isGuest ? 'guest' : 'host';
    await booking.save();

    req.flash('success', 'Booking cancelled successfully');
    res.redirect(`/bookings/${id}`);
});

// Get booking availability
module.exports.getAvailability = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
        return res.json({ available: true });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflictingBooking = await Booking.findOne({
        listing: id,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            {
                checkIn: { $lt: checkOutDate },
                checkOut: { $gt: checkInDate }
            }
        ]
    });

    res.json({ available: !conflictingBooking });
});

// Calculate booking price
module.exports.calculatePrice = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.query;

    const listing = await Listing.findById(id);
    if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
    }

    if (!checkIn || !checkOut) {
        return res.json({ totalPrice: 0, nights: 0 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = listing.price * nights;

    res.json({ totalPrice, nights });
}); 