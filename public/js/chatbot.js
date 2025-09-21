class ChatbotWidget {
    constructor() {
        this.isOpen = false;
        this.sessionId = null;
        this.isTyping = false;
        this.init();
    }

    init() {
        this.createWidget();
        this.bindEvents();
        this.loadQuickHelp();
    }

    createWidget() {
        console.log('Creating chatbot widget...');
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'chatbot-toggle';
        toggleButton.innerHTML = '💬';
        toggleButton.title = 'Open Chat Support';
        
        // Add inline styles as fallback
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s, box-shadow 0.3s;
            z-index: 1001;
        `;
        
        document.body.appendChild(toggleButton);
        console.log('Toggle button created and added to DOM');

        // Create widget container
        const widget = document.createElement('div');
        widget.className = 'chatbot-widget';
        widget.innerHTML = `
            <div class="chatbot-header">
                <div>
                    <h5>AirBnB Assistant</h5>
                    <div class="chatbot-status">
                        <span class="status-dot"></span>
                        Online
                    </div>
                </div>
                <button class="chatbot-close">×</button>
            </div>
            <div class="chatbot-messages" id="chatbotMessages">
                <div class="quick-help">
                    <div class="quick-help-title">Quick Help</div>
                    <div class="quick-help-buttons" id="quickHelpButtons">
                        <!-- Quick help buttons will be loaded here -->
                    </div>
                </div>
            </div>
            <div class="chatbot-input-container">
                <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Type your message...">
                <button class="chatbot-send" id="chatbotSend">→</button>
            </div>
        `;
        document.body.appendChild(widget);

        this.toggleButton = toggleButton;
        this.widget = widget;
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatbotInput');
        this.sendButton = document.getElementById('chatbotSend');
        this.quickHelpButtons = document.getElementById('quickHelpButtons');
    }

    bindEvents() {
        // Toggle widget
        this.toggleButton.addEventListener('click', () => this.toggle());
        
        // Close widget
        this.widget.querySelector('.chatbot-close').addEventListener('click', () => this.close());
        
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send on Enter key
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = this.input.scrollHeight + 'px';
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.widget.classList.toggle('open', this.isOpen);
        this.toggleButton.classList.toggle('open', this.isOpen);
        this.toggleButton.innerHTML = this.isOpen ? '✕' : '💬';
        
        if (this.isOpen) {
            this.input.focus();
            if (this.messagesContainer.children.length === 1) { // Only quick help
                this.addBotMessage("Hello! I'm your AirBnB assistant. How can I help you today?");
            }
        }
    }

    close() {
        this.isOpen = false;
        this.widget.classList.remove('open');
        this.toggleButton.classList.remove('open');
        this.toggleButton.innerHTML = '💬';
    }

    async loadQuickHelp() {
        // Use predefined quick help topics as fallback
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

        try {
            const response = await fetch('/chatbot/quick-help');
            const data = await response.json();
            
            if (data.success) {
                this.quickHelpButtons.innerHTML = data.topics.map(topic => 
                    `<button class="quick-help-btn" data-intent="${topic.intent}">${topic.icon} ${topic.title}</button>`
                ).join('');
            } else {
                throw new Error('API response not successful');
            }
        } catch (error) {
            console.log('Using fallback quick help topics');
            // Use fallback topics
            this.quickHelpButtons.innerHTML = quickHelpTopics.map(topic => 
                `<button class="quick-help-btn" data-intent="${topic.intent}">${topic.icon} ${topic.title}</button>`
            ).join('');
        }

        // Bind quick help button events
        this.quickHelpButtons.querySelectorAll('.quick-help-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const intent = btn.dataset.intent;
                this.sendQuickHelp(intent);
            });
        });
    }

    async sendQuickHelp(intent) {
        const messages = {
            'booking_help': 'I need help with booking a property',
            'payment_help': 'I have payment issues',
            'cancellation_help': 'I want to cancel my booking',
            'technical_support': 'I have a technical problem',
            'general_help': 'I need general help'
        };

        const message = messages[intent] || 'I need help';
        this.input.value = message;
        await this.sendMessage();
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message || this.isTyping) return;

        // Add user message to UI
        this.addUserMessage(message);
        this.input.value = '';
        this.input.style.height = 'auto';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.sessionId = data.sessionId;
                this.hideTypingIndicator();
                this.addBotMessage(data.response);
            } else {
                this.hideTypingIndicator();
                this.addBotMessage("Sorry, I'm having trouble processing your request. Please try again.");
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            
            // Provide fallback responses based on message content
            const fallbackResponse = this.getFallbackResponse(message);
            this.addBotMessage(fallbackResponse);
        }
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('book') || lowerMessage.includes('reserve') || lowerMessage.includes('stay')) {
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

Need help with any specific step? Just ask!`;
        }
        
        if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('card')) {
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

Having payment issues? Let me know the specific problem!`;
        }
        
        if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
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

Need help cancelling a specific booking? I can guide you through it!`;
        }
        
        if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('bug')) {
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

What specific technical issue are you experiencing?`;
        }
        
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

Just ask me anything! I'm here to make your booking experience smooth and easy.`;
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.textContent = message;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        // Format message with markdown-like styling
        const formattedMessage = this.formatMessage(message);
        messageDiv.innerHTML = formattedMessage;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(message) {
        // Convert **text** to <strong>text</strong>
        let formatted = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert line breaks to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Convert bullet points
        formatted = formatted.replace(/^• /gm, '• ');
        
        return formatted;
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        typingDiv.id = 'typingIndicator';
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    // Public method to open widget programmatically
    open() {
        if (!this.isOpen) {
            this.toggle();
        }
    }

    // Public method to close widget programmatically
    close() {
        if (this.isOpen) {
            this.toggle();
        }
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chatbot script loaded');
    
    // Always initialize chatbot (remove login check for now)
    try {
        window.chatbot = new ChatbotWidget();
        console.log('Chatbot widget initialized successfully');
    } catch (error) {
        console.error('Error initializing chatbot:', error);
    }
});

// Add some helpful page-specific triggers
document.addEventListener('DOMContentLoaded', function() {
    // Add help buttons to booking pages
    if (window.location.pathname.includes('/bookings/new/')) {
        const bookingForm = document.querySelector('form');
        if (bookingForm) {
            const helpButton = document.createElement('button');
            helpButton.type = 'button';
            helpButton.className = 'btn btn-outline-info btn-sm mt-2';
            helpButton.innerHTML = '💬 Need Help? Ask our Assistant';
            helpButton.addEventListener('click', () => {
                if (window.chatbot) {
                    window.chatbot.open();
                }
            });
            bookingForm.appendChild(helpButton);
        }
    }

    // Add help button to payment pages
    if (window.location.pathname.includes('/payment')) {
        const paymentCard = document.querySelector('.card');
        if (paymentCard) {
            const helpButton = document.createElement('button');
            helpButton.type = 'button';
            helpButton.className = 'btn btn-outline-info btn-sm';
            helpButton.innerHTML = '💬 Payment Help';
            helpButton.style.position = 'absolute';
            helpButton.style.top = '10px';
            helpButton.style.right = '10px';
            helpButton.addEventListener('click', () => {
                if (window.chatbot) {
                    window.chatbot.open();
                }
            });
            paymentCard.style.position = 'relative';
            paymentCard.appendChild(helpButton);
        }
    }
});
