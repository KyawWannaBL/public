// In server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Make sure cors is required
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000; // Vercel will manage the port

// --- Middleware ---
app.use(cors()); // This is the crucial line that fixes the CORS error
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Create a public 'uploads' directory if it doesn't exist
// NOTE: On Vercel, this directory is temporary and will be cleared on redeploy.
const uploadsDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/public/uploads', express.static(uploadsDir));

// Configure multer to store files in the temporary directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- API Endpoint ---
app.post('/api/chat', upload.single('image'), async (req, res) => {
    const { message } = req.body;
    const file = req.file;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'API key is not configured on the server.' });
    }

    const content = [];
    if (message) {
        content.push({ type: 'text', text: message });
    }

    if (file) {
        // IMPORTANT: Use your live Vercel URL
        const liveUrl = 'https://public-g3wcg8sos-britium-ventures-website.vercel.app'; 
        const imageUrl = `${liveUrl}/public/uploads/${file.filename}`;
        content.push({
            type: 'image_url',
            image_url: { url: imageUrl }
        });
    }

    if (content.length === 0) {
        return res.status(400).json({ error: 'No message or file provided.' });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{
                    role: "user",
                    content: content
                }],
                max_tokens: 300
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Error calling OpenAI:", error);
        res.status(500).json({ error: "Failed to communicate with AI service." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});