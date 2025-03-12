const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();


const { startMagicBricksScraper, startHousingComScraper, fetchAllProperties } = require('./apifyService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:3000",  
    "http://localhost:3001",  
    "http://localhost:3002",  
    "http://localhost:5000"   
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, 
}));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: "Too many requests, please try again later"
});
app.use(limiter);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || "b6b429b14ef94aa5a081cdf35d612088";

const LIBRETRANSLATE_URLS = [
  process.env.LIBRETRANSLATE_URL || "https://translate.argosopentech.com/translate",
  "https://libretranslate.de/translate"
];

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "up",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

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
          timeout: 10000 
        }
      );
      return response.data.translatedText;
    } catch (error) {
      console.error(`Translation failed with URL ${url}:`, error.message);
     
    }
  }
 
  throw new Error("All translation services unavailable");
}


app.post("/chatbot", async (req, res) => {
  const { prompt, sourceLanguage, targetLanguage } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });


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

let propertyCache = {
  timestamp: null,
  data: null,
  expiresIn: 60 * 60 * 1000, 
};

app.get('/api/properties', async (req, res) => {
  try {
    const now = Date.now();

    const searchParams = {
      bedrooms: req.query.bedrooms || '2,3',
      propertyType: req.query.propertyType || 'Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment,Residential-House,Villa',
      city: req.query.city || 'New-Delhi',
      source: req.query.source || 'all' // 'all', 'magicbricks', or 'housing'
    };
    
    // Generate cache key based on all search parameters to ensure proper caching
    const cacheKey = `${searchParams.source}-${searchParams.city}-${searchParams.bedrooms}-${searchParams.propertyType}`;
    
    // Check if we have valid cache for these specific parameters
    if (propertyCache.data && 
        propertyCache.timestamp && 
        propertyCache.cacheKey === cacheKey &&
        (now - propertyCache.timestamp < propertyCache.expiresIn)) {
      console.log(`Returning cached property data for ${cacheKey}`);
      return res.json(propertyCache.data);
    }
    
    console.log(`Fetching properties with parameters:`, searchParams);
    
    let result;
    
    // Call appropriate Apify service based on source
    if (searchParams.source === 'magicbricks') {
      result = await startMagicBricksScraper(searchParams);
    } else if (searchParams.source === 'housing') {
      result = await startHousingComScraper(searchParams);
    } else {
      // Fetch from both sources
      result = await fetchAllProperties(searchParams);
    }
    
    if (!result.success) {
      console.error(`Error from Apify service for ${searchParams.city}:`, result.error);
      return res.status(500).json({ 
        success: false,
        error: `Failed to fetch properties from ${searchParams.city}`,
        details: result.error,
        message: `We're currently experiencing difficulties fetching properties in ${searchParams.city}. Please try again later or try a different city.`
      });
    }
    
    // Check if we got empty results
    const properties = result.properties || result.data || [];
    if (properties.length === 0) {
      console.log(`No properties found for ${searchParams.city}`);
      return res.json({
        success: true,
        properties: [],
        message: `No properties found matching your criteria in ${searchParams.city}`
      });
    }
    
    // Standardize the property data format if needed
    const standardizedProperties = properties.map(item => {
      // If it's already in our standard format, return as is
      if (item.source) {
        return item;
      }
      
      // Otherwise, transform to standard format (for MagicBricks data)
      return {
        id: item.id || `mb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: item.name || item.title || 'Property Listing',
        price: item.price_display_value || (item.price ? `₹${item.price.toLocaleString()}` : 'Price on request'),
        location: item.address || item.location || (item.city_name ? `${item.city_name}` : 'Location not specified'),
        bedrooms: item.bedrooms?.toString() || searchParams.bedrooms || 'Not specified',
        bathrooms: item.bathrooms?.toString() || 'Not specified',
        area: item.area || `${item.covered_area || item.carpet_area || ''} ${item.cov_area_unit || item.carp_area_unit || 'sq.ft.'}`,
        description: item.description || item.seo_description || 'No description available',
        imageUrl: item.imageUrl || item.image_url || '',
        url: item.url ? (item.url.startsWith('http') ? item.url : `https://www.magicbricks.com/${item.url}`) : '',
        landmark: item.landmark || '',
        ownerName: item.owner_name || '',
        postedDate: item.posted_date ? new Date(item.posted_date).toLocaleDateString() : '',
        source: item.source || 'MagicBricks'
      };
    });
    
    const responseData = { 
      success: true,
      properties: standardizedProperties,
      city: searchParams.city,
      source: searchParams.source,
      count: standardizedProperties.length
    };
    
    // Update cache with the new key
    propertyCache = {
      timestamp: now,
      data: responseData,
      cacheKey: cacheKey,
      expiresIn: 30 * 60 * 1000 // 30 minutes
    };
    
    console.log(`Returning ${standardizedProperties.length} properties for ${searchParams.city}`);
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch properties',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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