export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  analysisCount: number;
  isPremium: boolean;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  location: GeoLocation;
  city: string;
  country: string;
  confidence: number;
  description: string;
  clues: string[];
  similarImages?: string[];
  createdAt: Date;
  userId?: string;
}

export interface AnalysisSession {
  id: string;
  results: AnalysisResult[];
  currentIndex: number;
  createdAt: Date;
}

export interface GeminiAnalysisResponse {
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
    confidence: number;
  };
  analysis: {
    description: string;
    clues: string[];
    reasoning: string;
  };
}

export interface MapMarker {
  id: string;
  position: GeoLocation;
  title: string;
  type: 'analysis' | 'search' | 'user';
  popup?: string;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  location: GeoLocation;
  type: 'city' | 'country' | 'landmark' | 'address';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AnalysisState {
  currentResult: AnalysisResult | null;
  history: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;
  session: AnalysisSession | null;
}
