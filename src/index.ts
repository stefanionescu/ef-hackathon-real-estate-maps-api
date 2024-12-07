import { config } from 'dotenv';
import { PlacesAPI } from './places-api';
import OpenAI from 'openai';
import { z } from "zod";

config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY as string;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is not set');
}

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface CategoryQuery {
  category: string;
  queries: string[];
}

const categories: CategoryQuery[] = [
  {
    category: 'Schools',
    queries: [
      'Best private schools',
      'Top public schools',
      'International schools'
    ]
  },
  {
    category: 'Restaurants',
    queries: [
      'Fine dining restaurants',
      'Family restaurants',
      'Vegetarian restaurants'
    ]
  },
  {
    category: 'Supermarkets',
    queries: [
      'Organic supermarkets',
      'Wholesale supermarkets',
      'Local grocery stores'
    ]
  }
];

const LocationSummary = z.object({
  overview: z.string(),
  highlights: z.array(z.string()),
  priceRange: z.string().optional(),
  bestFor: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5),
});

const locationAnalysisSchema = {
  name: "location_analysis_schema",
  schema: {
    type: "object",
    properties: {
      overview: {
        type: "string",
        description: "A brief overview of the location or category"
      },
      highlights: {
        type: "array",
        items: { type: "string" },
        description: "Key highlights or notable features"
      },
      priceRange: {
        type: "string",
        description: "Optional price range indicator"
      },
      bestFor: {
        type: "array",
        items: { type: "string" },
        description: "Target audiences or best use cases"
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description: "Optional warnings or considerations"
      },
      rating: {
        type: "number",
        minimum: 1,
        maximum: 5,
        description: "Overall rating from 1 to 5"
      }
    },
    required: ["overview", "highlights", "bestFor", "rating"]
  }
};

async function summarizeWithAI(places: any[]) {
  try {
    const placesText = places.map(place => `
      Name: ${place.displayName?.text || 'No name'}
      Overview: ${place.generativeSummary?.overview?.text || ''}
      Description: ${place.generativeSummary?.description?.text || ''}
      Area Info: ${place.areaSummary?.contentBlocks?.map((block: { topic: string; content: { text: string } }) => 
        `${block.topic}: ${block.content?.text}`
      ).join('\n') || ''}
    `).join('\n\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are analyzing locations in Mountain View, CA. Provide a structured analysis in JSON format."
        },
        {
          role: "user",
          content: `Analyze these places and provide a JSON summary:\n\n${placesText}`
        }
      ],
      response_format: { type: "json_object" },
      tools: [{
        type: "function",
        function: {
          name: "analyze_location",
          parameters: locationAnalysisSchema.schema
        }
      }],
      tool_choice: { type: "function", function: { name: "analyze_location" } }
    });

    const result = JSON.parse(response.choices[0].message.tool_calls?.[0].function.arguments || '{}');
    return LocationSummary.parse(result);
  } catch (error) {
    console.error('Error in summarizeWithAI:', error);
    return null;
  }
}

async function main() {
  const placesAPI = new PlacesAPI(API_KEY);

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
    const response = await placesAPI.searchPlaces('Schools', mountainViewBias);
    console.log('API Response:', JSON.stringify(response, null, 2));

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
        if (contextualContent?.reviews?.[0]?.text?.text) {
          console.log('\nTop Review:');
          console.log(`"${contextualContent.reviews[0].text.text}"`);
        }
      });

      const summary = await summarizeWithAI(response.places);
      if (summary) {
        console.log('\n=== AI SUMMARY ===');
        console.log('Overview:', summary.overview);
        console.log('Highlights:', summary.highlights.join(', '));
        console.log('Best For:', summary.bestFor.join(', '));
        if (summary.warnings) {
          console.log('Warnings:', summary.warnings.join(', '));
        }
        console.log('Rating:', '⭐'.repeat(summary.rating));
      }
    } else {
      console.log('No places found in the response');
      console.log('Response structure:', response);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 