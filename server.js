// In server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// --- File Upload Setup (Multer) ---
// Create a public 'uploads' directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer to store files in 'public/uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the uploaded files statically
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- API Endpoint ---
app.post('/api/chat', upload.single('image'), async (req, res) => {
    const { message } = req.body; // User's text message
    const file = req.file; // The uploaded file object from multer
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const content = [];
    
    // Add the text message to the content payload
    if (message) {
        content.push({ type: 'text', text: message });
    }

    // If a file was uploaded, create a public URL and add it to the payload
    if (file) {
        // IMPORTANT: Replace 'https://your-backend-url.onrender.com' with your actual deployed backend URL
        const imageUrl = `https://your-backend-url.onrender.com/public/uploads/${file.filename}`;
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
                model: "gpt-4o", // Using the correct model
                messages: [
                    {
                        role: "user",
                        content: content // The array containing text and/or image URL
                    }
                ],
                max_tokens: 300
            })
        });
        
        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Error calling OpenAI:", error);
        res.status(500).json({ error: "Failed to communicate with AI service." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});