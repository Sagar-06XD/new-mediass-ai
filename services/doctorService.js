const axios = require('axios');

const getNearbyDoctors = async (specialist, location = "near me") => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    // If no API key is provided, return mock data instantly
    if (!apiKey || apiKey === 'your_google_places_key_here') {
      console.log('[DoctorService] No active Google Places API key found. Returning mock doctors.');
      return getMockDoctors(specialist);
    }

    const query = encodeURIComponent(`${specialist} ${location}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;

    console.log(`[DoctorService] Fetching doctors from Google Places API for query: ${specialist} ${location}`);
    
    const response = await axios.get(url);
    const results = response.data.results;

    if (!results || results.length === 0) {
      console.warn('[DoctorService] No doctors found from Google Places. Returning mock doctors.');
      return getMockDoctors(specialist);
    }

    // Process top 3-5 results
    const topDoctors = results.slice(0, 4).map(place => {
      return {
        name: place.name,
        rating: place.rating || 0,
        address: place.formatted_address,
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0
      };
    });

    console.log(`[DoctorService] Successfully fetched ${topDoctors.length} doctors.`);
    return topDoctors;

  } catch (error) {
    console.error('[DoctorService] Google Places API failed:', error.message);
    // Never block the main response if API fails
    return getMockDoctors(specialist);
  }
};

const getMockDoctors = (specialist) => {
  return [
    {
      name: `City Health ${specialist || 'General'} Clinic`,
      rating: 4.8,
      address: "123 Medical Drive, Health City",
      lat: 28.6139,
      lng: 77.2090
    },
    {
      name: `Premier ${specialist || 'Specialist'} Care`,
      rating: 4.5,
      address: "45 Wellness Ave, Health City",
      lat: 28.6239,
      lng: 77.2190
    },
    {
      name: `Dr. Smith's ${specialist || 'Family'} Practice`,
      rating: 4.2,
      address: "88 Care Lane, Health City",
      lat: 28.6339,
      lng: 77.2290
    }
  ].slice(0, 3);
};

module.exports = {
  getNearbyDoctors
};
