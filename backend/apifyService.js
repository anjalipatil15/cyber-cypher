const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with API token from environment variables
const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

/**
 * Fetches property data from MagicBricks using Apify
 * @param {Object} searchParams - Search parameters like city, bedrooms, etc.
 * @returns {Promise<Object>} - Success status and property data
 */
async function startMagicBricksScraper(searchParams = {}) {
  try {
    // Default parameters
    const bedrooms = searchParams.bedrooms || '2,3';
    const propertyType = searchParams.propertyType || 'Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment,Residential-House,Villa';
    const cityName = searchParams.city || 'New-Delhi';
    
    // Construct URL for MagicBricks
    const url = `https://www.magicbricks.com/property-for-sale/residential-real-estate?bedroom=${bedrooms}&proptype=${propertyType}&cityName=${cityName}`;
    
    console.log(`Starting Apify scraper for URL: ${url}`);
    
    // Create input configuration for Apify
    const input = {
      urls: [url],
      max_items_per_url: 30,
      max_retries_per_url: 2,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
        apifyProxyCountry: "IN"  // Changed from "US" to "IN" (ISO code for India)
      }
    };
    
    // Run the Actor and wait for it to finish
    // Using the Actor ID "OGrVzUv64ImXJ1Cen" from their example
    const run = await client.actor("OGrVzUv64ImXJ1Cen").call(input);
    
    // Fetch dataset items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`Scraping complete, fetched ${items.length} properties`);
    return { success: true, data: items };
  } catch (error) {
    console.error('Apify scraper error:', error);
    return { success: false, error: error.message || "Failed to fetch property data" };
  }
}

module.exports = {
  startMagicBricksScraper
};