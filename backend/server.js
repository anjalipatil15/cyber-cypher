const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Speech-to-Text Route
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;

    // Upload file to AssemblyAI
    const uploadResponse = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      require("fs").createReadStream(req.file.path),
      { headers: { authorization: assemblyApiKey } }
    );

    const audioUrl = uploadResponse.data.upload_url;

    // Request transcription
    const transcribeResponse = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: audioUrl },
      { headers: { authorization: assemblyApiKey } }
    );

    const transcriptId = transcribeResponse.data.id;

    // Polling until transcription is complete
    let transcriptData;
    while (true) {
      const response = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        { headers: { authorization: assemblyApiKey } }
      );

      transcriptData = response.data;

      if (transcriptData.status === "completed") break;
      if (transcriptData.status === "failed") return res.status(500).json({ error: "Transcription failed" });

      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait before retrying
    }

    res.json({ transcript: transcriptData.text });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Translation Route
app.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) return res.status(400).json({ error: "Missing text or target language" });

    const translateResponse = await axios.post(process.env.LIBRETRANSLATE_URL, {
      q: text,
      source: "auto",
      target: targetLang,
      format: "text",
    });

    res.json({ translatedText: translateResponse.data.translatedText });
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ error: "Translation failed" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
