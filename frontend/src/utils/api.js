import axios from 'axios';

// Base API URL - Change to your production URL when deploying
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create configured axios instance with timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// API Error handler with improved messaging
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error("API Error Response:", error.response.data);
    return {
      error: true,
      message: error.response.data.error || "Server error",
      status: error.response.status,
      details: error.response.data.details || {}
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error("API No Response:", error.request);
    
    // Check if it's a CORS issue
    if (error.message && error.message.includes('NetworkError')) {
      return {
        error: true,
        message: "CORS error: Make sure your backend server is configured to accept requests from this origin.",
        status: 0
      };
    }
    
    return {
      error: true,
      message: "No response from server. Please check if the backend server is running.",
      status: 0
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("API Request Error:", error.message);
    return {
      error: true,
      message: "Failed to send request: " + error.message,
      status: 0
    };
  }
};

// Chatbot API
export const sendChatMessage = async (prompt, sourceLanguage, targetLanguage) => {
  try {
    console.log(`Sending chat request to ${API_BASE_URL}/chatbot`);
    
    const response = await apiClient.post('/chatbot', {
      prompt,
      sourceLanguage,
      targetLanguage
    });
    
    return response.data;
  } catch (error) {
    console.error("Chat request failed:", error);
    return handleApiError(error);
  }
};

// Translation API
export const translateText = async (text, targetLanguage) => {
  try {
    console.log(`Sending translation request to ${API_BASE_URL}/live-translate`);
    
    const response = await apiClient.post('/live-translate', {
      audioUrl: text, // Using text as audioUrl parameter due to API design
      targetLanguage
    });
    
    return response.data;
  } catch (error) {
    console.error("Translation request failed:", error);
    return handleApiError(error);
  }
};

// Audio Translation API
export const translateAudio = async (audioBlob, targetLanguage) => {
  try {
    console.log(`Sending audio translation request to ${API_BASE_URL}/audio-translate`);
    
    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('targetLanguage', targetLanguage);
    
    // Override content-type header for multipart/form-data
    const response = await axios.post(`${API_BASE_URL}/audio-translate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      timeout: 30000 // Longer timeout for audio processing
    });
    
    return response.data;
  } catch (error) {
    console.error("Audio translation request failed:", error);
    return handleApiError(error);
  }
};

// Check if server is running
export const checkServerConnection = async () => {
  try {
    console.log(`Checking server connection at ${API_BASE_URL}/health`);
    await axios.get(`${API_BASE_URL}/health`, { 
      timeout: 5000,
      withCredentials: true
    });
    console.log("Server connection successful");
    return true;
  } catch (error) {
    console.error("Server connection check failed:", error);
    return false;
  }
};

// Mock API for client data (replace with actual backend API when ready)
let mockClients = [];

export const getClients = async () => {
  // In a real app, this would be an API call
  try {
    // For demo: Check if we have mock data in storage
    if (mockClients.length === 0) {
      // If no mock data, check if we can load from local storage
      const storedClients = localStorage.getItem('realEstateClients');
      if (storedClients) {
        mockClients = JSON.parse(storedClients);
      }
    }
    
    return { success: true, data: mockClients };
  } catch (error) {
    return handleApiError(error);
  }
};

export const addClient = async (clientData) => {
  // In a real app, this would be an API call
  try {
    const newClient = {
      id: Date.now(),
      ...clientData,
      lastContact: new Date().toISOString(),
      conversations: []
    };
    
    mockClients.push(newClient);
    
    // Save to local storage for persistence
    localStorage.setItem('realEstateClients', JSON.stringify(mockClients));
    
    return { success: true, data: newClient };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateClient = async (clientId, clientData) => {
  // In a real app, this would be an API call
  try {
    const index = mockClients.findIndex(client => client.id === clientId);
    if (index === -1) {
      return { error: true, message: "Client not found" };
    }
    
    mockClients[index] = {
      ...mockClients[index],
      ...clientData
    };
    
    // Save to local storage for persistence
    localStorage.setItem('realEstateClients', JSON.stringify(mockClients));
    
    return { success: true, data: mockClients[index] };
  } catch (error) {
    return handleApiError(error);
  }
};

export const addClientNote = async (clientId, note) => {
  // In a real app, this would be an API call
  try {
    const index = mockClients.findIndex(client => client.id === clientId);
    if (index === -1) {
      return { error: true, message: "Client not found" };
    }
    
    const updatedNotes = mockClients[index].notes 
      ? `${mockClients[index].notes}\n\n${note}`
      : note;
    
    mockClients[index].notes = updatedNotes;
    mockClients[index].lastContact = new Date().toISOString();
    
    // Save to local storage for persistence
    localStorage.setItem('realEstateClients', JSON.stringify(mockClients));
    
    return { success: true, data: mockClients[index] };
  } catch (error) {
    return handleApiError(error);
  }
};

export const addClientConversation = async (clientId, conversationData) => {
  // In a real app, this would be an API call
  try {
    const index = mockClients.findIndex(client => client.id === clientId);
    if (index === -1) {
      return { error: true, message: "Client not found" };
    }
    
    const newConversation = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...conversationData
    };
    
    if (!mockClients[index].conversations) {
      mockClients[index].conversations = [];
    }
    
    mockClients[index].conversations.push(newConversation);
    mockClients[index].lastContact = new Date().toISOString();
    
    // Save to local storage for persistence
    localStorage.setItem('realEstateClients', JSON.stringify(mockClients));
    
    return { success: true, data: newConversation };
  } catch (error) {
    return handleApiError(error);
  }
};
// Get properties from the API
export const getProperties = async (filters = {}) => {
    try {
      // Convert filters object to query params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      console.log(`Fetching properties with filters: ${params.toString()}`);
      const response = await apiClient.get(`/api/properties?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

export default {
  sendChatMessage,
  translateText,
  translateAudio,
  getClients,
  addClient,
  updateClient,
  addClientNote,
  addClientConversation,
  checkServerConnection
};