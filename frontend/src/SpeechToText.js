import React, { useState } from "react";
import axios from "axios";

const SpeechToText = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState("");

  const handleFileChange = (event) => {
    setAudioFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!audioFile) {
      alert("Please select an audio file first!");
      return;
    }

    const apiKey = "YOUR_ASSEMBLYAI_API_KEY"; // 🔥 Replace with your actual API key

    try {
      // Upload the file to AssemblyAI
      const uploadResponse = await axios.post(
        "https://api.assemblyai.com/v2/upload",
        audioFile,
        {
          headers: {
            authorization: apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const audioUrl = uploadResponse.data.upload_url;

      // Send the file for transcription
      const transcriptionResponse = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        { audio_url: audioUrl },
        {
          headers: { authorization: apiKey },
        }
      );

      const transcriptId = transcriptionResponse.data.id;

      // Polling to check transcription status
      let transcript;
      while (true) {
        const checkResponse = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: { authorization: apiKey },
          }
        );

        transcript = checkResponse.data;
        if (transcript.status === "completed") break;
        if (transcript.status === "failed") {
          alert("Transcription failed.");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
      }

      setTranscription(transcript.text);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div>
      <h2>Speech to Text</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Transcribe</button>
      <p><strong>Transcription:</strong> {transcription}</p>
    </div>
  );
};

export default SpeechToText;
