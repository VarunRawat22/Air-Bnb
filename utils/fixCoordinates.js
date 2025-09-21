const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import the Listing model
const Listing = require('../models/listing.js');

// Helper function to get coordinates from location using OpenStreetMap Nominatim (free)
async function getCoordinatesFromLocation(location) {
  if (!location) {
    return null;
  }
  
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: location,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'AirBnB-Clone/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        type: 'Point',
        coordinates: [parseFloat(result.lon), parseFloat(result.lat)]
      };
    }
  } catch (error) {
    console.error('Geocoding error for location:', location, error.message);
  }
  
  return null;
}

async function fixCoordinates() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
    console.log('Connected to MongoDB');

    // Find all listings that don't have proper coordinates
    const listings = await Listing.find({
      $or: [
        { geometry: { $exists: false } },
        { 'geometry.coordinates': { $size: 0 } },
        { 'geometry.coordinates': { $exists: false } }
      ]
    });

    console.log(`Found ${listings.length} listings without coordinates`);

    for (const listing of listings) {
      console.log(`Processing listing: ${listing.title} (${listing.location})`);
      
      if (listing.location) {
        const geometry = await getCoordinatesFromLocation(listing.location);
        
        if (geometry) {
          listing.geometry = geometry;
          await listing.save();
          console.log(`✅ Updated coordinates for: ${listing.title} - ${JSON.stringify(geometry.coordinates)}`);
        } else {
          console.log(`❌ Could not get coordinates for: ${listing.title} (${listing.location})`);
        }
      } else {
        console.log(`⚠️ No location for listing: ${listing.title}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Finished fixing coordinates');
    
  } catch (error) {
    console.error('Error fixing coordinates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script if called directly
if (require.main === module) {
  fixCoordinates();
}

module.exports = { fixCoordinates }; 