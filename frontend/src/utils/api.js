import axios from 'axios';

const NEWS_API_KEY = "f27c0ff37bea4278b84b7bb5cf71fe48";
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

const handleApiError = (error) => {
  if (error.response) {
    console.error("API Error Response:", error.response.data);
    return {
      error: true,
      message: error.response.data.error || "Server error",
      status: error.response.status,
      details: error.response.data.details || {}
    };
  } else if (error.request) {
    console.error("API No Response:", error.request);
    return {
      error: true,
      message: "No response from server. Please check if the backend server is running.",
      status: 0
    };
  } else {
    console.error("API Request Error:", error.message);
    return {
      error: true,
      message: "Failed to send request: " + error.message,
      status: 0
    };
  }
};

export const getRealEstateNews = async (pageSize = 5) => {
  try {
    console.log('Fetching real estate news...');
    const query = "real estate OR property market OR housing India";
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        apiKey: NEWS_API_KEY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: pageSize
      }
    });
    if (response.data && response.data.articles) {
      console.log(`Fetched ${response.data.articles.length} news articles`);
      return { success: true, data: response.data.articles };
    } else {
      console.error('Invalid news response structure:', response.data);
      return { success: false, message: 'Invalid response from News API' };
    }
  } catch (error) {
    console.error('News API error:', error);
    if (error.response && error.response.status === 429) {
      return { success: false, message: 'News API rate limit exceeded. Please try again later.' };
    }
    if (error.response && error.response.status === 401) {
      return { success: false, message: 'News API authentication failed. Please check your API key.' };
    }
    return { success: false, message: error.message || 'Failed to fetch news' };
  }
};

export const sendChatMessage = async (prompt, sourceLanguage, targetLanguage) => {
  try {
    console.log(`Sending chat request to ${API_BASE_URL}/chatbot`);
    const response = await apiClient.post('/chatbot', { prompt, sourceLanguage, targetLanguage });
    return response.data;
  } catch (error) {
    console.error("Chat request failed:", error);
    return handleApiError(error);
  }
};

export const checkServerConnection = async () => {
  try {
    console.log(`Checking server connection at ${API_BASE_URL}/health`);
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000, withCredentials: true });
    console.log("Server connection successful");
    return true;
  } catch (error) {
    console.error("Server connection check failed:", error);
    return false;
  }
};

export const getProperties = async (filters = {}) => {
  try {
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
  getRealEstateNews,
  checkServerConnection,
  getProperties
};
