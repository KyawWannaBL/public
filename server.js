// server.js
// =====================================
// Express server for:
// 1. Chat API (OpenAI GPT models)
// 2. Contact form email with attachments
// =====================================

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const multer = require("multer");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve static files (e.g., chat.html, contact.html, styles, etc.)
app.use(express.static(path.join(__dirname)));

// =====================================================
// 1. CHAT ROUTE (OpenAI GPT)
// Uses: process.env.OPENAI_API_KEY
// =====================================================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 🔑 Chat API key from .env
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // You can change to gpt-4o, gpt-4.1, etc.
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Could not reach the Chat server" });
  }
});

// =====================================================
// 2. EMAIL ROUTE (Nodemailer + Multer)
// Uses: process.env.MAIL_USER + process.env.MAIL_PASS
// =====================================================
const upload = multer({ storage: multer.memoryStorage() });

app.post("/send-email", upload.array("attachments[]"), async (req, res) => {
  try {
    // Configure transporter (SMTP example: Gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        // 🔑 Email credentials from .env
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    // Prepare attachments from uploaded files
    const files = req.files.map(file => ({
      filename: file.originalname,
      content: file.buffer
    }));

    // Build email content
    const mailOptions = {
      from: `"Website Contact" <${process.env.MAIL_USER}>`,
      to: "info@britiumventures.com", // Replace with your receiving address
      subject: "New Quotation Request",
      text: `
Full Name: ${req.body.fullName}
Company: ${req.body.companyName}
Email: ${req.body.email}
Phone: ${req.body.phone}

Inquiry:
${req.body.inquiryDetails}
      `,
      attachments: files
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.json({ message: "Request sent ✔" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ message: "Error sending email ❌" });
  }
});

// =====================================================
// START SERVER
// =====================================================
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
