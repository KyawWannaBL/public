require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// --- Middleware ---
app.use(cors()); // This is the crucial line that fixes connection errors
app.use(express.json());

// --- Original OpenAI Chat Endpoint (for BRIA) ---
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body?.messages?.find(m => m.role === 'user')?.content;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!userMessage) return res.status(400).json({ reply: 'Error: No user message found.' });
    if (!OPENAI_API_KEY) return res.status(500).json({ reply: 'Error: OpenAI API key not configured on server.' });

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: 'system', content: 'You are BRIA, an expert AI assistant for Britium Ventures...' },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 300
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        res.json({ reply: data.choices[0].message.content });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        res.status(500).json({ reply: `An error occurred with the AI service.` });
    }
});

// --- Google Gemini API Endpoint (for Dashboard) ---
app.post('/api/gemini', async (req, res) => {
    const { prompt } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!prompt) return res.status(400).json({ reply: 'Error: No prompt was provided.' });
    if (!GEMINI_API_KEY) return res.status(500).json({ reply: 'Error: Gemini API key not configured on server.' });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    const useSearch = prompt.toLowerCase().includes('google search');
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        ...(useSearch && { tools: [{ "google_search": {} }] })
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
             const errorBody = await response.text();
             throw new Error(`API call failed: ${errorBody}`);
        }
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.json({ reply: text || "Sorry, I couldn't generate a response." });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ reply: `An error occurred while fetching insights.` });
    }
});

// This line is for Vercel to handle the server correctly.
module.exports = app;
