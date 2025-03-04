import React, { useState, useRef } from "react";
import axios from "axios";
import RecordRTC from "recordrtc";

const SpeechToText = () => {
    const [transcription, setTranscription] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const recorderRef = useRef(null);  // 🔹 Store the recorder instance persistently

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorderRef.current = new RecordRTC(stream, { type: "audio" }); // 🔹 Assign recorder
        recorderRef.current.startRecording();
        setIsRecording(true);
    };

    const stopRecording = async () => {
        if (!recorderRef.current) return;  // 🔹 Prevent errors if stop is clicked before start
        setIsRecording(false);
        
        recorderRef.current.stopRecording(async () => {
            const audioBlob = recorderRef.current.getBlob();
            const formData = new FormData();
            formData.append("audio", audioBlob, "audio.wav");

            try {
                const response = await axios.post("http://localhost:5000/", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setTranscription(response.data.transcript);
            } catch (error) {
                console.error("Error transcribing:", error);
            }
        });
    };

    return (
        <div>
            <h2>🎙 AssemblyAI Speech to Text</h2>
            <button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            <p><strong>Transcribed Text:</strong> {transcription}</p>
        </div>
    );
};

export default SpeechToText;
