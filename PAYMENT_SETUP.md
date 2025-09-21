# Payment Integration Setup Guide

## 🚀 **Payment Integration Features**

Your Air BnB project now includes a comprehensive payment system with the following features:

### **✅ What's Implemented:**

1. **Booking System**
   - Create bookings with date selection
   - Guest/host management
   - Availability checking
   - Price calculation

2. **Stripe Payment Integration**
   - Secure credit/debit card processing
   - Payment intent creation
   - Real-time payment status
   - Webhook handling

3. **Booking Management**
   - View all bookings (as guest or host)
   - Booking details with status tracking
   - Cancellation with refund processing
   - Payment history

4. **Security Features**
   - PCI DSS compliant payment processing
   - Encrypted payment data
   - Secure webhook verification
   - User authorization checks

## 🔧 **Setup Instructions**

### **1. Install Dependencies**

```bash
npm install stripe moment uuid
```

### **2. Environment Variables**

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### **3. Get Stripe Keys**

1. **Sign up for Stripe**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get Test Keys**: 
   - Go to Dashboard → Developers → API Keys
   - Copy your **Publishable key** and **Secret key**
   - Use test keys for development (start with `pk_test_` and `sk_test_`)

### **4. Set Up Webhooks (Optional but Recommended)**

1. **Install Stripe CLI**: Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. **Login to Stripe**: `stripe login`
3. **Forward webhooks**: `stripe listen --forward-to localhost:8080/bookings/webhook`
4. **Copy webhook secret**: Use the webhook signing secret provided

### **5. Test the Integration**

1. **Start your server**: `npm run dev`
2. **Create a listing** (if you don't have one)
3. **Book a listing** as a different user
4. **Test payment** with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Expired: `4000 0000 0000 0069`

## 📋 **New Routes Added**

### **Booking Routes:**
- `GET /bookings` - View all user bookings
- `GET /bookings/new/:id` - Booking form
- `POST /bookings/new/:id` - Create booking
- `GET /bookings/:id` - Booking details
- `GET /bookings/:id/payment` - Payment page
- `POST /bookings/:id/cancel` - Cancel booking

### **Payment Routes:**
- `POST /bookings/:bookingId/create-payment-intent` - Create payment intent
- `GET /bookings/payment/success` - Payment success page
- `GET /bookings/payment/failure` - Payment failure page
- `POST /bookings/:bookingId/refund` - Process refund
- `POST /bookings/webhook` - Stripe webhook handler

### **API Routes:**
- `GET /bookings/availability/:id` - Check availability
- `GET /bookings/calculate-price/:id` - Calculate booking price

## 🎯 **How to Use**

### **For Guests:**
1. Browse listings
2. Click "Book Now" on a listing
3. Select dates and number of guests
4. Complete payment with Stripe
5. View booking confirmation

### **For Hosts:**
1. Create listings
2. View incoming bookings
3. Manage booking status
4. Receive payments (minus commission)

## 🔒 **Security Features**

- **Payment Data**: Never stored on your server
- **PCI Compliance**: Handled by Stripe
- **Webhook Verification**: Ensures payment authenticity
- **User Authorization**: Only authorized users can access bookings
- **Input Validation**: All booking data is validated

## 💰 **Commission System**

- **3% service fee** on all bookings
- **Automatic calculation** in booking model
- **Host payout** = Total price - Commission
- **Transparent breakdown** in booking details

## 🚨 **Important Notes**

1. **Test Mode**: Use Stripe test keys for development
2. **Webhooks**: Essential for production (handles payment confirmations)
3. **Error Handling**: Comprehensive error handling for failed payments
4. **Refunds**: Automatic refund calculation based on cancellation policy
5. **Security**: Never log or store sensitive payment information

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Stripe is not defined"**
   - Check if Stripe.js is loaded
   - Verify publishable key is correct

2. **"Payment failed"**
   - Check Stripe dashboard for error details
   - Verify secret key is correct
   - Check webhook configuration

3. **"Booking not found"**
   - Ensure booking ID is valid
   - Check user authorization

4. **"Webhook verification failed"**
   - Verify webhook secret is correct
   - Check webhook endpoint URL

## 📞 **Support**

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For application issues:
- Check server logs for error details
- Verify all environment variables are set
- Ensure database connection is working

## 🎉 **Next Steps**

Your payment integration is now complete! Consider adding:

1. **Email notifications** for booking confirmations
2. **SMS notifications** for important updates
3. **Analytics dashboard** for booking insights
4. **Multi-currency support** for international users
5. **Subscription payments** for premium features

Happy coding! 🚀 