const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load context once at startup — edit api/context.md to update the AI's knowledge
const michaelContext = fs.readFileSync(path.join(__dirname, 'context.md'), 'utf-8');

// --- Rate Limiting Setup (In-Memory per Vercel Container) ---
const ipRequestCounts = new Map();
let globalRequestCount = 0;
let lastResetTime = Date.now();

// Clean up maps every 5 minutes to prevent memory leaks in warm lambda instances
setInterval(() => {
    ipRequestCounts.clear();
    globalRequestCount = 0;
    lastResetTime = Date.now();
}, 5 * 60 * 1000);

module.exports = async (req, res) => {
    // 1. CORS PROTECTION — Only allow your actual domains
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://personal-project-site-9mybyt38a-mckenzm4s-projects.vercel.app', // Update this to your actual Vercel URL
        'https://mckenzm4.github.io' // Update this if you use GitHub Pages custom domains
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Allow same-origin/no-origin (like curl / server-side) just in case, but you can block this too
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        // 2. RATE LIMITING (IP Based & Global)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

        // Reset counters if 1 minute has passed
        if (Date.now() - lastResetTime > 60 * 1000) {
            ipRequestCounts.clear();
            globalRequestCount = 0;
            lastResetTime = Date.now();
        }

        const userRequests = ipRequestCounts.get(ip) || 0;

        // Limit: 5 requests per IP per minute
        if (userRequests >= 5) {
            return res.status(429).json({
                reply: "Whoa, slow down! I'm an AI assistant, not a highly-caffeinated data engineer typing at 200WPM. Please wait a minute before asking another question."
            });
        }

        // Limit: 50 requests global per container per minute (stops DDoS spikes)
        if (globalRequestCount >= 50) {
            return res.status(429).json({
                reply: "The site is experiencing heavy traffic right now and my circuits are full. Try reaching out to Michael directly on LinkedIn for now."
            });
        }

        // Increment counters
        ipRequestCounts.set(ip, userRequests + 1);
        globalRequestCount++;

        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            console.log("Using model: gemini-2.5-flash");
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: michaelContext,
            });

            const result = await model.generateContent(message);
            const aiReply = result.response.text();

            return res.json({ reply: aiReply });

        } catch (error) {
            console.error('Error calling Gemini:', error);
            return res.status(500).json({ error: 'Failed to communicate with AI' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
