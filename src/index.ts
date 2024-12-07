import { config } from 'dotenv';
import { PlacesAPI } from './places-api';

// Load environment variables
config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY as string;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is not set');
}

async function main() {
  const placesAPI = new PlacesAPI(API_KEY);

  // Example location bias for Mountain View, CA
  const mountainViewBias = {
    rectangle: {
      low: {
        latitude: 37.415,
        longitude: -122.091,
      },
      high: {
        latitude: 37.429,
        longitude: -122.065,
      },
    },
  };

  try {
    // Example: Search for spicy vegetarian restaurants
    const response = await placesAPI.searchPlaces(
      'Schools',
      mountainViewBias
    );

    // Debug the response structure
    console.log('API Response:', JSON.stringify(response, null, 2));

    // Check if response and places exist before processing
    if (response && response.places && Array.isArray(response.places)) {
      response.places.forEach((place, index) => {
        console.log('\n-------------------');
        console.log(`Place ${index + 1}: ${place.displayName?.text || 'No name available'}`);
        
        if (place.generativeSummary?.overview) {
          console.log('\nOverview:');
          console.log(place.generativeSummary.overview.text);
        }

        if (place.generativeSummary?.description) {
          console.log('\nDetailed Description:');
          console.log(place.generativeSummary.description.text);
        }

        if (place.areaSummary) {
          console.log('\nArea Information:');
          place.areaSummary.contentBlocks.forEach(block => {
            console.log(`\n${block.topic.toUpperCase()}:`);
            console.log(block.content.text);
          });
        }

        const contextualContent = response.contextualContents?.[index];
        if (contextualContent?.reviews && contextualContent.reviews.length > 0) {
          console.log('\nTop Review:');
          console.log(`"${contextualContent.reviews[0].text.text}"`);
        }
      });
    } else {
      console.log('No places found in the response');
      console.log('Response structure:', response);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 