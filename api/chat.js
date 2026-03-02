const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load context once at startup — edit api/context.md to update the AI's knowledge
const michaelContext = fs.readFileSync(path.join(__dirname, 'context.md'), 'utf-8');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
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
