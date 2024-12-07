export interface LocationBias {
  rectangle: {
    low: {
      latitude: number;
      longitude: number;
    };
    high: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface PlacesResponse {
  places: Place[];
  contextualContents?: ContextualContent[];
}

export interface Place {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  generativeSummary?: {
    overview?: {
      text: string;
      languageCode: string;
    };
    description?: {
      text: string;
      languageCode: string;
    };
  };
  areaSummary?: {
    contentBlocks: ContentBlock[];
    flagContentUri: string;
  };
}

export interface ContextualContent {
  reviews: Review[];
  photos: Photo[];
  justifications: Justification[];
}

export interface ContentBlock {
  topic: string;
  content: {
    text: string;
    languageCode: string;
  };
  references: {
    places: string[];
  };
}

export interface Review {
  name: string;
  rating: number;
  text: {
    text: string;
    languageCode: string;
  };
  authorAttribution: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
}

export interface Photo {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: {
    displayName: string;
    uri?: string;
    photoUri?: string;
  }[];
}

export interface Justification {
  reviewJustification?: {
    highlightedText: {
      text: string;
      highlightedTextRanges: {
        startIndex: number;
        endIndex: number;
      }[];
    };
    review: Review;
  };
  businessAvailabilityAttributesJustification?: {
    dineIn: boolean;
  };
} 