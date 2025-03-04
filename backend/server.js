const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import Apify Service
const { startMagicBricksScraper } = require('./apifyService');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:3000",  // React development server default
    "http://localhost:3001",  // Alternative React port
    "http://localhost:3002",  // Your current React port
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

// Translation URLs with fallbacks
const LIBRETRANSLATE_URLS = [
  process.env.LIBRETRANSLATE_URL || "https://translate.argosopentech.com/translate",
  "https://libretranslate.de/translate"
];

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "up",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Attempt translation with multiple services
async function attemptTranslation(text, sourceLanguage, targetLanguage) {
  for (const url of LIBRETRANSLATE_URLS) {
    try {
      console.log(`Attempting translation with URL: ${url}`);
      const response = await axios.post(
        url,
        {
          q: text,
          source: sourceLanguage || "en",
          target: targetLanguage
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000 // 10 second timeout
        }
      );
      return response.data.translatedText;
    } catch (error) {
      console.error(`Translation failed with URL ${url}:`, error.message);
      // Continue to next URL if this one fails
    }
  }
  // If all URLs fail, throw an error
  throw new Error("All translation services unavailable");
}

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

// Cache for property data to avoid frequent API calls
let propertyCache = {
  timestamp: null,
  data: null,
  expiresIn: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Get property listings from MagicBricks
app.get('/api/properties', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check if we have valid cache
    if (propertyCache.data && 
        propertyCache.timestamp && 
        (now - propertyCache.timestamp < propertyCache.expiresIn)) {
      console.log('Returning cached property data');
      
      // Filter cached data based on current request parameters
      let filteredProperties = propertyCache.data;
      if (req.query.city && req.query.city !== propertyCache.params?.city) {
        console.log(`Cache parameters don't match: ${req.query.city} vs ${propertyCache.params?.city}`);
        // Skip cache if city is different
      } else {
        return res.json(filteredProperties);
      }
    }
    
    // Extract search parameters from request
    const searchParams = {
      bedrooms: req.query.bedrooms || '2,3',
      propertyType: req.query.propertyType || 'Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment,Residential-House,Villa',
      city: req.query.city || 'New-Delhi'
    };
    
    console.log(`Fetching properties with parameters:`, searchParams);
    
    // Call Apify service
    const result = await startMagicBricksScraper(searchParams);
    
    if (!result.success) {
      console.error('Error from Apify service:', result.error);
      return res.status(500).json({ 
        error: 'Failed to fetch properties from Apify',
        details: result.error 
      });
    }
    
    // Standardize the property data format
    const properties = result.data.map(item => ({
      id: item.id || `mb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: item.name || 'Property Listing',
      price: item.price_display_value || `₹${item.price?.toLocaleString()}` || 'Price on request',
      location: item.address || (item.city_name ? `${item.city_name}` : 'Location not specified'),
      bedrooms: item.bedrooms?.toString() || 'Not specified',
      bathrooms: item.bathrooms?.toString() || 'Not specified',
      area: `${item.covered_area || item.carpet_area || ''} ${item.cov_area_unit || item.carp_area_unit || 'sq.ft.'}`,
      description: item.description || item.seo_description || 'No description available',
      imageUrl: item.image_url || '',
      url: item.url ? `https://www.magicbricks.com/${item.url}` : '',
      landmark: item.landmark || '',
      ownerName: item.owner_name || '',
      postedDate: item.posted_date ? new Date(item.posted_date).toLocaleDateString() : '',
      source: 'MagicBricks'
    }));
    
    const responseData = { properties };
    
    // Update cache
    propertyCache = {
      timestamp: now,
      data: responseData,
      params: searchParams,
      expiresIn: propertyCache.expiresIn
    };
    
    console.log(`Returning ${properties.length} properties`);
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      error: 'Failed to fetch properties',
      details: error.message
    });
  }
});

// Live Translation Route - Modified to handle both audio and text
app.post("/live-translate", async (req, res) => {
  const { audioUrl, targetLanguage } = req.body;

  if (!audioUrl || !targetLanguage) {
    return res.status(400).json({ error: "audioUrl and targetLanguage are required" });
  }

  try {
    // Check if audioUrl is a URL or text content
    const isUrl = typeof audioUrl === 'string' && 
                  (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'));
    let transcriptionText = '';
    
    if (isUrl) {
      // Handle as audio URL for transcription
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
      
      transcriptionText = transcript.text;
    } else {
      // Handle as direct text input (no transcription needed)
      transcriptionText = audioUrl;
    }

    // Step 3: Translate the text using our helper function with multiple services
    const translatedText = await attemptTranslation(transcriptionText, "en", targetLanguage);

    // Step 4: Return the Translated Text
    res.json({
      transcription: transcriptionText,
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Chatbot server running on port ${PORT}`);
  console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
});