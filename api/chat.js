const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const michaelContext = `
You are a helpful AI assistant for Michael McKenzie's professional portfolio website.
Michael is a Business Intelligence Developer at SpartanNash.
Skills: Snowflake, Power BI, Data Modeling, SQL, Python (Pandas/Spark/Snowpark), Machine Learning.
Key Work:
1. "The Strategist": Migrated Hyperion to Power BI (40% boost, $20k savings).
2. "The Engineer": Optimized Snowflake pipelines/architecture at SpartanNash.
3. "The Visualizer": Real-time Solana crypto dashboard.

Michael is passionate about turning messy data into intuitive, high-performance tools.
Answer questions about Michael's work, skills, and background professionally and concisely.
If a question is outside Michael's professional scope, politely steer it back.
`;

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

            console.log("Using model: gemini-2.5-pro");
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-pro",
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
