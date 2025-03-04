import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SpeechRecognition.css';

// Real estate keywords in multiple languages
const realEstateKeywords = {
  en: [
    "apartment", "house", "villa", "rent", "buy", "sell", "location", "neighborhood",
    "bedroom", "bathroom", "furnished", "mortgage", "loan", "property", "real estate",
    "broker", "agent", "square feet", "budget", "price", "balcony", "garage", "view"
  ],
  hi: [
    "अपार्टमेंट", "मकान", "विला", "किराया", "खरीदना", "बेचना", "स्थान", "मोहल्ला",
    "बेडरूम", "बाथरूम", "सुसज्जित", "बंधक", "ऋण", "संपत्ति", "रियल एस्टेट",
    "दलाल", "एजेंट", "वर्ग फीट", "बजट", "कीमत", "बालकनी", "गैरेज", "दृश्य"
  ],
  mr: [
    "अपार्टमेंट", "घर", "बंगला", "भाडे", "विकत घेणे", "विकणे", "स्थान", "परिसर",
    "बेडरूम", "बाथरूम", "सुसज्जित", "तारण", "कर्ज", "मालमत्ता", "रिअल इस्टेट",
    "दलाल", "एजंट", "चौरस फूट", "अंदाजपत्रक", "किंमत", "गच्ची", "गॅरेज", "दृश्य"
  ],
  te: [
    "అపార్ట్మెంట్", "ఇల్లు", "విల్లా", "అద్దె", "కొనుగోలు", "అమ్మకం", "ప్రదేశం", "పరిసరాలు",
    "పడకగది", "స్నానాలగది", "సజ్జితమైన", "తాకట్టు", "రుణం", "ఆస్తి", "రియల్ ఎస్టేట్",
    "బ్రోకర్", "ఏజెంట్", "చదరపు అడుగులు", "బడ్జెట్", "ధర", "బాల్కనీ", "గ్యారేజ్", "వీక్షణ"
  ]
};

const SpeechRecognition = ({ currentLanguage }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [highlightedText, setHighlightedText] = useState('');
  const [realEstateInfo, setRealEstateInfo] = useState('No real estate keywords detected.');
  const [notes, setNotes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Initialize speech recognition
  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = currentLanguage === 'en' ? 'en-US' : 
                                   currentLanguage === 'hi' ? 'hi-IN' : 
                                   currentLanguage === 'mr' ? 'mr-IN' : 'te-IN';
      
      recognitionRef.current.onresult = handleRecognitionResult;
      recognitionRef.current.onerror = handleRecognitionError;
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    } catch (error) {
      console.error("Speech recognition not supported:", error);
    }
    
    // Clean up
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [currentLanguage, isListening]);

  const handleRecognitionResult = (event) => {
    let finalTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      }
    }
    
    if (finalTranscript) {
      setTranscription(prevTranscription => prevTranscription + finalTranscript);
      highlightKeywords(prevTranscription => prevTranscription + finalTranscript);
      getRealEstateInfo(finalTranscript);
    }
  };

  const handleRecognitionError = (event) => {
    console.error("Recognition error:", event.error);
    if (event.error === 'no-speech') {
      console.log("No speech detected");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscription('');
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        
        // Optional: Send for server-side processing if needed
        // uploadAudioForProcessing(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const highlightKeywords = (text) => {
    if (!text) return;
    
    let highlightedContent = text;
    const keywords = realEstateKeywords[currentLanguage] || realEstateKeywords.en;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlightedContent = highlightedContent.replace(regex, `<span class="highlight">${keyword}</span>`);
    });
    
    setHighlightedText(highlightedContent);
  };

  const getRealEstateInfo = (text) => {
    if (!text) return;
    
    const keywords = realEstateKeywords[currentLanguage] || realEstateKeywords.en;
    const matchedKeywords = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      setRealEstateInfo(`
        <strong>Detected Keywords:</strong> ${matchedKeywords.join(", ")} <br>
        <div class="real-estate-suggestions">
          <h4>Suggested Actions:</h4>
          <ul>
            ${matchedKeywords.map(keyword => `
              <li>Add "${keyword}" to client preferences</li>
            `).join('')}
            <li>Create follow-up reminder based on these keywords</li>
            <li>Search property database for matches</li>
          </ul>
        </div>
      `);
    } else {
      setRealEstateInfo("No real estate keywords detected.");
    }
  };

  const saveNote = () => {
    if (transcription.trim()) {
      const newNote = {
        id: Date.now(),
        text: transcription,
        translatedText: translatedText,
        date: new Date().toLocaleString(),
        keywords: extractKeywords(transcription)
      };
      
      setNotes(prevNotes => [...prevNotes, newNote]);
      setTranscription('');
      setTranslatedText('');
      setHighlightedText('');
      setRealEstateInfo('Note saved! Start a new recording.');
    }
  };

  const extractKeywords = (text) => {
    const keywords = realEstateKeywords[currentLanguage] || realEstateKeywords.en;
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const translateText = async () => {
    if (!transcription.trim()) {
      alert("No text to translate!");
      return;
    }

    try {
      // Using your backend service for translation
      const response = await axios.post(
        "http://localhost:5000/live-translate",
        {
          audioUrl: transcription, // We're sending text, not audio
          targetLanguage
        }
      );

      setTranslatedText(response.data.translation);
    } catch (error) {
      console.error("Translation error:", error);
      alert("Failed to translate text. Is the server running?");
    }
  };

  return (
    <div className="speech-recognition-container">
      <section className="controls-section">
        <h2>Real-Time Speech Recognition & Translation</h2>
        <div className="control-buttons">
          <button 
            onClick={toggleListening}
            className={`speech-btn ${isListening ? 'speech-btn-active' : ''}`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`recording-btn ${isRecording ? 'recording-btn-active' : ''}`}
          >
            {isRecording ? 'Stop Recording' : 'Record Audio'}
          </button>
          
          <button onClick={saveNote} className="save-btn">
            Save Note
          </button>
        </div>
        
        <div className="language-controls">
          <label>
            Translation Target:
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="language-select"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
              <option value="te">Telugu</option>
            </select>
          </label>
          
          <button onClick={translateText} className="translate-btn">
            Translate
          </button>
        </div>
      </section>
      
      <section className="transcription-section">
        <div className="transcription-box">
          <h3>Transcribed Text:</h3>
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Your speech will appear here..."
            rows="4"
            className="transcription-textarea"
          />
        </div>
        
        {translatedText && (
          <div className="translation-box">
            <h3>Translated Text:</h3>
            <div className="translation-content">{translatedText}</div>
          </div>
        )}
      </section>
      
      <section className="analysis-section">
        <div className="keywords-box">
          <h3>Highlighted Keywords:</h3>
          <div 
            className="highlighted-content"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        </div>
        
        <div className="real-estate-box">
          <h3>Real Estate Information:</h3>
          <div 
            className="real-estate-content"
            dangerouslySetInnerHTML={{ __html: realEstateInfo }}
          />
        </div>
      </section>
      
      {audioURL && (
        <section className="audio-playback">
          <h3>Recorded Audio:</h3>
          <audio src={audioURL} controls className="audio-player" />
          <button onClick={() => {
            const a = document.createElement('a');
            a.href = audioURL;
            a.download = `real-estate-conversation-${new Date().toISOString()}.wav`;
            a.click();
          }} className="download-btn">
            Download Recording
          </button>
        </section>
      )}
      
      <section className="saved-notes">
        <h3>Saved Notes</h3>
        {notes.length === 0 ? (
          <p className="no-notes">You don't have any notes yet.</p>
        ) : (
          <div className="notes-list">
            {notes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <span className="note-date">{note.date}</span>
                  <button 
                    onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                    className="delete-note"
                  >
                    ×
                  </button>
                </div>
                <div className="note-content">{note.text}</div>
                {note.translatedText && (
                  <div className="note-translation">{note.translatedText}</div>
                )}
                {note.keywords.length > 0 && (
                  <div className="note-keywords">
                    <strong>Keywords:</strong> {note.keywords.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SpeechRecognition;