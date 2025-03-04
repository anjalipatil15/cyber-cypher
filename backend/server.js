const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:3000",  // React development server
    "http://localhost:3001",  // Alternative React port
    "http://localhost:5000"   // Express server
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later"
});
app.use(limiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AssemblyAI API Key
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || "b6b429b14ef94aa5a081cdf35d612088";

// Translation API (LibreTranslate)
const LIBRETRANSLATE_URL = "https://libretranslate.de/translate";

// Chatbot Route with Multilingual Support
app.post("/chatbot", async (req, res) => {
  const { prompt, sourceLanguage, targetLanguage } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

    // Enhanced prompt for multilingual context
    const enhancedPrompt = `Context: This is a real estate communication assistant handling a multilingual conversation.
Source Language: ${sourceLanguage || 'Not specified'}
Target Language: ${targetLanguage || 'Not specified'}

Original Prompt: ${prompt}

Please provide a professional, culturally sensitive response in ${targetLanguage}.`;

    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    const formattedResponse = response.replace(/\n/g, "<br>");

    res.json({
      reply: formattedResponse,
      sourceLanguage,
      targetLanguage
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      error: "Failed to generate chatbot response",
      details: error.message
    });
  }
});

// Live Translation Route
app.post("/live-translate", async (req, res) => {
  const { audioUrl, targetLanguage } = req.body;

  if (!audioUrl || !targetLanguage) {
    return res.status(400).json({ error: "audioUrl and targetLanguage are required" });
  }

  try {
    // Step 1: Start Real-Time Transcription
    const transcriptionResponse = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: audioUrl,
        language_code: "en" // Transcribe in English (default)
      },
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          "Content-Type": "application/json"
        },
      }
    );

    const transcriptId = transcriptionResponse.data.id;

    // Step 2: Poll for Transcription Result
    let transcript;
    while (true) {
      const checkResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            authorization: ASSEMBLYAI_API_KEY,
            "Content-Type": "application/json"
          },
        }
      );

      transcript = checkResponse.data;
      if (transcript.status === "completed") break;
      if (transcript.status === "failed") {
        throw new Error("Transcription failed");
      }

      // Wait 3 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Step 3: Translate the Transcribed Text
    const translationResponse = await axios.post(
      LIBRETRANSLATE_URL,
      {
        q: transcript.text,
        source: "en", // Source language (English)
        target: targetLanguage // Target language (e.g., "hi" for Hindi)
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
      }
    );

    const translatedText = translationResponse.data.translatedText;

    // Step 4: Return the Translated Text
    res.json({
      transcription: transcript.text,
      translation: translatedText,
      targetLanguage
    });
  } catch (error) {
    console.error("Live translation error:", error);
    res.status(500).json({
      error: "Failed to perform live translation",
      details: error.message
    });
  }
});

// Route to handle direct text translation (no audio)
app.post("/translate-text", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "Text and targetLanguage are required" });
  }

  try {
    const source = sourceLanguage || "auto";
    
    const translationResponse = await axios.post(
      LIBRETRANSLATE_URL,
      {
        q: text,
        source: source,
        target: targetLanguage
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const translatedText = translationResponse.data.translatedText;

    res.json({
      originalText: text,
      translation: translatedText,
      sourceLanguage,
      targetLanguage
    });
  } catch (error) {
    console.error("Text translation error:", error);
    res.status(500).json({
      error: "Failed to translate text",
      details: error.message
    });
  }
});

// Route for audio upload and transcription
app.post("/upload-audio", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const audioFile = req.files.audio;
    const uploadPath = path.join(uploadsDir, audioFile.name);

    // Save the file
    await audioFile.mv(uploadPath);

    // Return the file path for further processing
    res.json({
      success: true,
      filePath: uploadPath,
      fileName: audioFile.name
    });
  } catch (error) {
    console.error("Audio upload error:", error);
    res.status(500).json({
      error: "Failed to upload audio file",
      details: error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Chatbot server running on port ${PORT}`);
});