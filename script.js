// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navMenu.classList.remove('active'));
        });
    }

    // ================================
    // AI Chatbot
    // ================================

    const chatToggle = document.querySelector('.chatbot-toggle');
    const chatWidget = document.querySelector('.chatbot-widget');
    const chatClose = document.querySelector('.chatbot-close');
    const chatForm = document.getElementById('chatbot-form');
    const chatInput = document.getElementById('chatbot-input');
    const chatMessages = document.getElementById('chatbot-messages');
    const chatSendButton = document.getElementById('chatbot-send');

    // Groq configuration (Llama 3.1 8B Instant)
    // IMPORTANT: For production, NEVER expose this key in frontend JS.
    // Use a backend proxy instead. This is only for local/demo usage.
    const GROQ_API_KEY = 'enter your groq api key here ';
    const GROQ_MODEL = 'llama-3.1-8b-instant';

    function openChat() {
        if (!chatWidget) return;
        chatWidget.classList.add('is-open');
        chatWidget.setAttribute('aria-hidden', 'false');
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 150);
        }
    }

    function closeChat() {
        if (!chatWidget) return;
        chatWidget.classList.remove('is-open');
        chatWidget.setAttribute('aria-hidden', 'true');
    }

    function appendMessage(text, sender = 'bot') {
        if (!chatMessages) return;
        const wrapper = document.createElement('div');
        wrapper.className = `chatbot-message chatbot-message--${sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'chatbot-message-content';
        bubble.textContent = text;

        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendToAI(message) {
        if (!GROQ_API_KEY || GROQ_API_KEY.startsWith('YOUR_')) {
            appendMessage('The AI key is not configured yet. Please add your Groq API key in "script.js" to enable live answers.', 'bot');
            return;
        }

        try {
            chatSendButton.disabled = true;
            appendMessage('Thinking about your question...', 'bot');

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content:
                                'You are a friendly local guide for Sikkim, India. Answer questions about Sikkim, its Buddhist monasteries, travel logistics, culture, and history in clear and concise English. Keep answers 3–6 sentences long unless the user asks for more detail.'
                        },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();

            // Remove the "thinking" message (last bot bubble) before adding real answer
            const allMessages = chatMessages.querySelectorAll('.chatbot-message--bot');
            const lastBot = allMessages[allMessages.length - 1];
            if (lastBot) {
                lastBot.remove();
            }

            if (data && data.error) {
                const details = data.error.message || 'Unknown error from Groq API.';
                appendMessage('Groq error: ' + details, 'bot');
                console.error('Groq API error response:', data);
                return;
            }

            const reply =
                data &&
                data.choices &&
                data.choices[0] &&
                data.choices[0].message &&
                data.choices[0].message.content;

            if (!response.ok || !reply) {
                appendMessage('Sorry, I could not reach the AI service right now. Please try again later.', 'bot');
                console.error('Groq API unexpected response:', data);
                return;
            }

            appendMessage(reply.trim(), 'bot');
        } catch (err) {
            appendMessage('There was a network error while contacting the AI service.', 'bot');
            console.error('Groq network/fetch error:', err);
        } finally {
            chatSendButton.disabled = false;
        }
    }

    if (chatToggle && chatWidget && chatForm && chatInput && chatMessages && chatSendButton && chatClose) {
        chatToggle.addEventListener('click', openChat);
        chatClose.addEventListener('click', closeChat);

        chatForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user');
            chatInput.value = '';
            sendToAI(text);
        });
    }
});
