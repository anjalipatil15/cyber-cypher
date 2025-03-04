const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// AssemblyAI API Key (Replace with your actual API key)
const ASSEMBLYAI_API_KEY = "your_assemblyai_api_key";

// 🔹 POST route to handle audio transcription
app.post("/transcribe", async (req, res) => {
    try {
        const { audioUrl } = req.body; // Get audio URL from request

        if (!audioUrl) {
            return res.status(400).json({ error: "Audio URL is required" });
        }

        // Step 1: Send audio to AssemblyAI for processing
        const response = await axios.post(
            "https://api.assemblyai.com/v2/transcript",
            { audio_url: audioUrl },
            { headers: { authorization: ASSEMBLYAI_API_KEY } }
        );

        const transcriptId = response.data.id;
        console.log(`Transcription started: ${transcriptId}`);

        // Step 2: Check the transcription status until it's completed
        let transcript;
        while (true) {
            const statusResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                { headers: { authorization: ASSEMBLYAI_API_KEY } }
            );

            transcript = statusResponse.data;
            if (transcript.status === "completed") {
                break;
            } else if (transcript.status === "failed") {
                return res.status(500).json({ error: "Transcription failed" });
            }

            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s before checking again
        }

        // Step 3: Return the transcribed text
        res.json({ text: transcript.text });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// 🔹 Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
