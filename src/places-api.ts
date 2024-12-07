import axios from 'axios';
import { LocationBias, PlacesResponse } from './types';

export class PlacesAPI {
  private readonly baseUrl = 'https://places.googleapis.com/v1/places:searchText';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPlaces(
    query: string,
    locationBias?: LocationBias,
    maxResults: number = 5
  ): Promise<PlacesResponse> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          textQuery: query,
          location_bias: locationBias,
          maxResultCount: maxResults,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.generativeSummary,places.areaSummary,contextualContents',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }
} 