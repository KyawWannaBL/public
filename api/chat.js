// api/chat.js
// This runs on Vercel's serverless environment

export default async function handler(req, res) {
  // 1. Check for POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method Not Allowed' });
  }

  const { message } = req.body;
  
  // 2. Load API Keys from Vercel Environment Variables
  const apiKey = process.env.OPENAI_API_KEY;
  const assistantId = process.env.OPENAI_ASSISTANT_ID;

  if (!apiKey || !assistantId) {
    return res.status(500).json({ reply: "Configuration Error: API Keys missing on server." });
  }

  try {
    // --- A. Create Thread & Run ---
    const runResponse = await fetch("https://api.openai.com/v1/threads/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        thread: {
          messages: [{ role: "user", content: message }]
        }
      })
    });

    const runData = await runResponse.json();
    if (runData.error) throw new Error(runData.error.message);
    
    const threadId = runData.thread_id;
    const runId = runData.id;

    // --- B. Poll for Completion (Wait for AI to think) ---
    let status = "queued";
    let attempts = 0;

    while (status !== "completed") {
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      // Prevent infinite loops (timeout after ~20 seconds)
      if (attempts > 20) {
        return res.status(504).json({ reply: "The AI is taking too long to respond. Please try again." });
      }

      const checkResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });
      
      const checkData = await checkResponse.json();
      status = checkData.status;

      if (status === "failed" || status === "cancelled") {
        throw new Error("AI Assistant failed to process request.");
      }
    }

    // --- C. Get the Message ---
    const msgResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });

    const msgData = await msgResponse.json();
    let reply = msgData.data[0].content[0].text.value;

    // Remove citations like 【4:0†source】
    reply = reply.replace(/【.*?】/g, '');

    return res.status(200).json({ reply: reply });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ reply: "System Error: " + error.message });
  }
}