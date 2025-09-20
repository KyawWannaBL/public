export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader("Access-Control-Allow-Origin", "https://www.britiumventures.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // --- Handle Preflight (CORS OPTIONS) ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Only allow POST ---
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Parse Request ---
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

  try {
    // --- Call OpenAI ---
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are BRIA, Britium Ventures' AI assistant. Be clear, concise, and helpful. Answer in friendly business tone.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ reply: data.error?.message || "OpenAI error" });
    }

    const reply = data.choices?.[0]?.message?.content || "⚠️ No response from AI.";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ reply: "⚠️ Server error. Please try again." });
  }
}
