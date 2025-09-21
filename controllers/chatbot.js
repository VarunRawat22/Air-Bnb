const ChatbotMessage = require('../models/chatbot');
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');
const { v4: uuidv4 } = require('uuid');

// AI-like response generator
class ChatbotAI {
    constructor() {
        this.responses = {
            greeting: [
                "Hello! I'm your AirBnB assistant. How can I help you today?",
                "Hi there! I'm here to help with your booking needs. What would you like to know?",
                "Welcome! I can assist you with bookings, payments, cancellations, and more. What's on your mind?"
            ],
            booking_help: [
                "I can help you with the booking process! Here's how to book a property:",
                "Let me guide you through booking a stay:",
                "I'll walk you through the booking process step by step:"
            ],
            payment_help: [
                "I can help you with payment issues. Here's what you need to know:",
                "Let me assist you with payment-related questions:",
                "I'll help you understand the payment process:"
            ],
            cancellation_help: [
                "I can help you with cancellation policies and procedures:",
                "Let me explain our cancellation policy:",
                "I'll guide you through the cancellation process:"
            ],
            technical_support: [
                "I'm here to help with technical issues. Let me assist you:",
                "I can help troubleshoot technical problems:",
                "Let me help you resolve this technical issue:"
            ],
            general_help: [
                "I'm here to help! What would you like to know?",
                "I can assist you with various topics. What's your question?",
                "How can I help you today?"
            ]
        };
    }

    // Analyze user message and determine intent
    analyzeIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('book') || lowerMessage.includes('reserve') || lowerMessage.includes('stay')) {
            return 'booking_help';
        }
        if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('card') || lowerMessage.includes('stripe')) {
            return 'payment_help';
        }
        if (lowerMessage.includes('cancel') || lowerMessage.includes('refund') || lowerMessage.includes('policy')) {
            return 'cancellation_help';
        }
        if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('bug') || lowerMessage.includes('not working')) {
            return 'technical_support';
        }
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
            return 'general_help';
        }
        
        return 'general_help';
    }

    // Generate contextual response based on intent and user data
    generateResponse(intent, userMessage, user = null, userBookings = []) {
        let response = "";
        
        switch (intent) {
            case 'booking_help':
                response = this.getBookingHelpResponse(userBookings);
                break;
            case 'payment_help':
                response = this.getPaymentHelpResponse(userBookings);
                break;
            case 'cancellation_help':
                response = this.getCancellationHelpResponse(userBookings);
                break;
            case 'technical_support':
                response = this.getTechnicalSupportResponse();
                break;
            case 'general_help':
                response = this.getGeneralHelpResponse();
                break;
            default:
                response = this.getGeneralHelpResponse();
        }
        
        return response;
    }

    getBookingHelpResponse(userBookings = []) {
        return `🏠 **Booking Process Guide**

**Step 1: Find a Property**
• Browse listings on the homepage
• Use the search bar to filter by location, dates, and guests
• Click on any listing to view details

**Step 2: Check Availability**
• Select your check-in and check-out dates
• Choose the number of guests
• The system will show if the property is available

**Step 3: Complete Booking**
• Click "Book Now" on the listing page
• Fill in your booking details
• Review the price breakdown
• Click "Continue to Payment"

**Step 4: Payment**
• Complete payment using our secure Stripe system
• You'll receive a confirmation email

**Current Bookings:** ${userBookings.length > 0 ? `You have ${userBookings.length} active booking(s).` : 'You have no active bookings.'}

Need help with any specific step? Just ask!`;
    }

    getPaymentHelpResponse(userBookings = []) {
        return `💳 **Payment Help Guide**

**Payment Methods:**
• We accept all major credit/debit cards
• Payments are processed securely through Stripe
• Your card information is never stored on our servers

**Payment Process:**
1. Select your booking dates and details
2. Click "Continue to Payment"
3. Enter your card details securely
4. Complete the payment
5. Receive instant confirmation

**Security:**
• All payments are PCI DSS compliant
• 256-bit SSL encryption
• No sensitive data stored locally

**Refund Policy:**
• 7+ days before check-in: 100% refund
• 1-7 days before check-in: 50% refund
• Less than 24 hours: No refund

**Current Bookings:** ${userBookings.length > 0 ? `You have ${userBookings.length} booking(s) with payment status.` : 'No bookings found.'}

Having payment issues? Let me know the specific problem!`;
    }

    getCancellationHelpResponse(userBookings = []) {
        return `❌ **Cancellation Policy & Help**

**Our Cancellation Policy:**
• **7+ days before check-in:** Full refund (100%)
• **1-7 days before check-in:** 50% refund
• **Less than 24 hours:** No refund

**How to Cancel:**
1. Go to "My Bookings" in your account
2. Find the booking you want to cancel
3. Click "Cancel Booking"
4. Select a reason for cancellation
5. Confirm the cancellation

**Refund Processing:**
• Refunds are processed automatically
• Processing time: 5-10 business days
• Refund amount depends on cancellation timing

**Current Bookings:** ${userBookings.length > 0 ? `You have ${userBookings.length} booking(s) that can be cancelled.` : 'No cancellable bookings found.'}

Need help cancelling a specific booking? I can guide you through it!`;
    }

    getTechnicalSupportResponse() {
        return `🔧 **Technical Support**

**Common Issues & Solutions:**

**Page Not Loading:**
• Clear your browser cache
• Try refreshing the page
• Check your internet connection

**Payment Issues:**
• Ensure your card details are correct
• Check if your bank allows online transactions
• Try a different payment method

**Login Problems:**
• Reset your password
• Check your email for verification
• Clear browser cookies

**Booking Problems:**
• Check if dates are available
• Ensure you're not booking your own property
• Verify guest count is within limits

**Still Having Issues?**
• Try logging out and back in
• Use a different browser
• Contact our support team

What specific technical issue are you experiencing?`;
    }

    getGeneralHelpResponse() {
        return `🤖 **How Can I Help You?**

I'm your AirBnB assistant and I can help with:

**📋 Booking Process**
• How to find and book properties
• Understanding availability
• Booking requirements

**💳 Payment & Billing**
• Payment methods and security
• Understanding charges
• Refund policies

**❌ Cancellations**
• How to cancel bookings
• Refund calculations
• Policy explanations

**🔧 Technical Support**
• Website issues
• Login problems
• Error troubleshooting

**📞 General Questions**
• Account management
• Property information
• Platform features

Just ask me anything! I'm here to make your booking experience smooth and easy.`;
    }
}

// Initialize chatbot AI
const chatbotAI = new ChatbotAI();

// Send message to chatbot
module.exports.sendMessage = wrapAsync(async (req, res) => {
    const { message, sessionId } = req.body;
    const userId = req.user ? req.user._id : null;
    
    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();

    // Analyze user intent
    const intent = chatbotAI.analyzeIntent(message);

    // Get user's recent bookings for context
    let userBookings = [];
    if (userId) {
        userBookings = await Booking.find({ 
            $or: [{ guest: userId }, { host: userId }],
            status: { $in: ['pending', 'confirmed'] }
        }).populate('listing').limit(5);
    }

    // Generate AI response
    const response = chatbotAI.generateResponse(intent, message, req.user, userBookings);

    // Save conversation to database
    const chatbotMessage = new ChatbotMessage({
        user: userId,
        sessionId: currentSessionId,
        message: message.trim(),
        response: response,
        intent: intent
    });

    await chatbotMessage.save();

    res.json({
        success: true,
        response: response,
        sessionId: currentSessionId,
        intent: intent,
        timestamp: new Date()
    });
});

// Get chat history for a session
module.exports.getChatHistory = wrapAsync(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user ? req.user._id : null;

    const messages = await ChatbotMessage.find({
        sessionId: sessionId,
        ...(userId && { user: userId })
    }).sort({ createdAt: 1 });

    res.json({
        success: true,
        messages: messages
    });
});

// Get user's chat sessions
module.exports.getUserSessions = wrapAsync(async (req, res) => {
    const userId = req.user._id;

    const sessions = await ChatbotMessage.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: '$sessionId',
                lastMessage: { $last: '$message' },
                lastResponse: { $last: '$response' },
                messageCount: { $sum: 1 },
                lastActivity: { $last: '$createdAt' },
                intent: { $last: '$intent' }
            }
        },
        { $sort: { lastActivity: -1 } },
        { $limit: 10 }
    ]);

    res.json({
        success: true,
        sessions: sessions
    });
});

// Mark message as resolved
module.exports.markAsResolved = wrapAsync(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await ChatbotMessage.findOneAndUpdate(
        { _id: messageId, user: userId },
        { isResolved: true },
        { new: true }
    );

    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }

    res.json({
        success: true,
        message: 'Message marked as resolved'
    });
});

// Get quick help topics
module.exports.getQuickHelp = wrapAsync(async (req, res) => {
    const quickHelpTopics = [
        {
            title: "How to Book a Property",
            description: "Step-by-step guide to booking your stay",
            intent: "booking_help",
            icon: "🏠"
        },
        {
            title: "Payment Issues",
            description: "Help with payments and billing",
            intent: "payment_help",
            icon: "💳"
        },
        {
            title: "Cancel a Booking",
            description: "How to cancel and get refunds",
            intent: "cancellation_help",
            icon: "❌"
        },
        {
            title: "Technical Problems",
            description: "Website and app troubleshooting",
            intent: "technical_support",
            icon: "🔧"
        },
        {
            title: "Account Help",
            description: "Login, profile, and account issues",
            intent: "general_help",
            icon: "👤"
        }
    ];

    res.json({
        success: true,
        topics: quickHelpTopics
    });
});
