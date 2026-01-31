import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post("/api/fix-text", async (req, res) => {
  const { text, mode, tone } = req.body;

  if (!text) return res.status(400).json({ error: "No text provided" });

  let systemPrompt = "";

  if (mode === "format") {
    systemPrompt = `Rewrite the text in a ${tone || "formal"} tone. 
Output only the rewritten text. Do NOT add explanations or chat.`;
  } else if (mode === "clean") {
    systemPrompt = "Fix grammar, spelling, punctuation. Output only the corrected text.";
  } else if (mode === "ai") {
    systemPrompt = "Rewrite the text to sound completely human-written. Output only the rewritten text.";
  } else {
    systemPrompt = "Rewrite the text clearly. Output only the rewritten text.";
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();

    // Try multiple ways to read the AI result
    const result =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
      "No response from AI";

    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
