const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve all your static files (HTML, CSS, JS, Images)
app.use(express.static(__dirname));

// Route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('ERROR: GEMINI_API_KEY is missing or not set in .env file!');
} else {
    // Log masked key for safety
    console.log(`API Key loaded: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Load context from file — same source as Vercel deployment
const michaelContext = fs.readFileSync(path.join(__dirname, 'api', 'context.md'), 'utf-8');

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Query: "${message}"`);

        // Use gemini-2.5-pro
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Combining context + message into a single prompt for maximum compatibility
        const prompt = `System Context: ${michaelContext}\n\nUser Question: ${message}`;

        const result = await model.generateContent(prompt);
        const aiReply = result.response.text();

        console.log("Gemini responded successfully.");
        res.json({ reply: aiReply });

    } catch (error) {
        console.error('--- GEMINI API ERROR ---');
        console.error('Message:', error.message);
        if (error.stack) console.error('Stack:', error.stack.split('\n')[0]);

        // Check if it's a quota/rate limit error
        const isQuotaError = error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many Requests');

        if (isQuotaError) {
            return res.status(429).json({
                error: 'quota_exceeded',
                reply: "Looks like Michael's AI is temporarily offline — apparently even algorithms have limits when you're this in-demand. The free tier quota has been hit for the day. In the meantime, skip the middleman and reach out to Michael directly via LinkedIn or email — both are on his resume. He's probably faster anyway."
            });
        }

        res.status(500).json({ error: 'Failed to communicate with AI' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
