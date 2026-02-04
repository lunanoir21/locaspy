import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { GeminiAnalysisResponse, AnalysisResult, GeoLocation } from '@/types';

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private cache: Map<string, { result: GeminiAnalysisResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  constructor() {
    const apiKey = localStorage.getItem('gemini-api-key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    const modelName = localStorage.getItem('gemini-model') || 'gemini-2.5-flash';
    if (!apiKey) {
      console.warn('Gemini API key not configured');
    }
    console.log('Initializing Gemini with model:', modelName);
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  private getCacheKey(imageBase64: string): string {
    return imageBase64.slice(0, 100);
  }

  private getFromCache(imageBase64: string): GeminiAnalysisResponse | null {
    const key = this.getCacheKey(imageBase64);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private setCache(imageBase64: string, result: GeminiAnalysisResponse): void {
    const key = this.getCacheKey(imageBase64);
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  async analyzeImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<GeminiAnalysisResponse> {
    // Check cache first
    const cached = this.getFromCache(imageBase64);
    if (cached) {
      console.log('Using cached analysis result');
      return cached;
    }

    // Check if API key is configured
    const apiKey = localStorage.getItem('gemini-api-key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === '') {
      throw new Error('Gemini API key is not configured. Please add your API key in Settings.');
    }

    // Reinitialize with current API key and model
    const modelName = localStorage.getItem('gemini-model') || 'gemini-2.5-flash';
    console.log('Using Gemini model:', modelName);
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });

    try {
      const prompt = `You are an expert geolocation analyst. Analyze this image and determine the geographic location with high precision.

CRITICAL: Be conservative with your confidence. Only provide high confidence (>70%) if you see CLEAR, UNAMBIGUOUS indicators.

Look for these HIGH-CONFIDENCE indicators (in order of reliability):
1. Street signs with clear text and language
2. License plates with country codes
3. Store/restaurant chains with location-specific names
4. Unique landmarks (Eiffel Tower, etc.)
5. Architecture specific to a region
6. Vehicle types and road markings
7. Vegetation and climate indicators
8. People's clothing and cultural elements

Provide analysis in this exact JSON format:
{
  "location": {
    "city": "Exact City Name",
    "country": "Exact Country Name",
    "lat": 52.5200,
    "lng": 13.4050,
    "confidence": 85
  },
  "analysis": {
    "description": "Brief, factual description",
    "clues": ["Specific clue 1", "Specific clue 2"],
    "reasoning": "Step-by-step reasoning"
  }
}

Confidence Guidelines:
- 90-100%: Unique landmark or clear street sign with coordinates
- 70-89%: Multiple strong indicators (architecture + language + vehicles)
- 50-69%: Some indicators but ambiguous
- 30-49%: Weak indicators, educated guess
- 0-29%: Cannot determine location`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text);
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', text);
        throw new Error('Invalid response format from Gemini. The AI did not return valid JSON.');
      }

      const parsedResponse: GeminiAnalysisResponse = JSON.parse(jsonMatch[0]);
      
      // Validate response structure
      if (!parsedResponse.location || !parsedResponse.analysis) {
        throw new Error('Invalid response structure from Gemini');
      }
      
      // Validate and adjust confidence
      const validated = this.validateAnalysis(parsedResponse, text);
      parsedResponse.location.confidence = validated.confidence;
      
      // Cache the result
      this.setCache(imageBase64, parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('Gemini analysis error:', error);
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw error;
        }
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later or check your Gemini API quota.');
        }
        if (error.message.includes('Invalid response')) {
          throw error;
        }
      }
      throw new Error('Failed to analyze image with AI. Please check your internet connection and try again.');
    }
  }

  private validateAnalysis(response: GeminiAnalysisResponse, rawText: string): ValidationResult {
    const reasons: string[] = [];
    let confidence = response.location.confidence;
    
    // Check for uncertainty indicators in raw text
    const uncertaintyWords = ['maybe', 'possibly', 'might', 'could be', 'appears to be', 'seems like', 'probably'];
    const hasUncertainty = uncertaintyWords.some(word => rawText.toLowerCase().includes(word));
    
    if (hasUncertainty && confidence > 60) {
      confidence = Math.min(confidence, 60);
      reasons.push('Uncertainty detected in reasoning');
    }

    // Check for high-confidence indicators
    const highConfidenceIndicators = [
      'street sign', 'license plate', 'store name', 'landmark',
      'unique architecture', 'specific language', 'flag', 'coordinates'
    ];
    
    const hasHighConfidenceIndicator = highConfidenceIndicators.some(indicator => 
      response.analysis.clues.some(clue => clue.toLowerCase().includes(indicator))
    );

    if (!hasHighConfidenceIndicator && confidence > 70) {
      confidence = Math.min(confidence, 70);
      reasons.push('No high-confidence indicators found');
    }

    // Validate coordinates are reasonable
    const { lat, lng } = response.location;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      confidence = Math.min(confidence, 30);
      reasons.push('Invalid coordinates');
    }

    // Check if location is in water (simplified check)
    if (this.isLikelyWater(lat, lng)) {
      confidence = Math.min(confidence, 20);
      reasons.push('Location appears to be in water');
    }

    // Validate clue quality
    if (response.analysis.clues.length < 2 && confidence > 50) {
      confidence = Math.min(confidence, 50);
      reasons.push('Insufficient clues');
    }

    return {
      isValid: confidence >= 30,
      confidence: Math.round(confidence),
      reasons
    };
  }

  private isLikelyWater(lat: number, lng: number): boolean {
    // Simplified water detection - major oceans
    const waterRegions = [
      // Pacific Ocean
      { latMin: -60, latMax: 60, lngMin: 120, lngMax: 180 },
      { latMin: -60, latMax: 60, lngMin: -180, lngMax: -80 },
      // Atlantic Ocean
      { latMin: -60, latMax: 70, lngMin: -80, lngMax: 20 },
      // Indian Ocean
      { latMin: -60, latMax: 30, lngMin: 20, lngMax: 120 },
    ];

    return waterRegions.some(region => 
      lat >= region.latMin && lat <= region.latMax &&
      lng >= region.lngMin && lng <= region.lngMax
    );
  }

  async crossValidateLocation(imageBase64: string, primaryResult: GeminiAnalysisResponse): Promise<{
    isConfirmed: boolean;
    confidenceAdjustment: number;
    details: string;
  }> {
    try {
      const prompt = `Cross-validate this location analysis. The AI suggested: ${primaryResult.location.city}, ${primaryResult.location.country}.

Look at the image again and answer:
1. Are there any contradictions to this location?
2. Are there alternative locations that could fit?
3. How certain is this identification?

Respond in JSON format:
{
  "isConfirmed": true/false,
  "confidenceAdjustment": -10,
  "details": "Explanation of validation"
}`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { isConfirmed: true, confidenceAdjustment: 0, details: 'No validation performed' };
    } catch (error) {
      console.error('Cross-validation error:', error);
      return { isConfirmed: true, confidenceAdjustment: 0, details: 'Validation failed' };
    }
  }

  async findSimilarLocations(imageBase64: string, location: GeoLocation): Promise<string[]> {
    try {
      const prompt = `Based on this image and location (lat: ${location.lat}, lng: ${location.lng}), suggest 3 visually similar nearby landmarks or locations. Return only location names as JSON array.`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Similar locations error:', error);
      return [];
    }
  }

  async generateDetailedReport(result: AnalysisResult): Promise<string> {
    try {
      const prompt = `Generate a comprehensive geolocation report for:
Location: ${result.city}, ${result.country}
Coordinates: ${result.location.lat}, ${result.location.lng}
Confidence: ${result.confidence}%
Clues: ${result.clues.join(', ')}

Structure:
1. Executive Summary
2. Visual Evidence Analysis
3. Location Verification Methods
4. Confidence Assessment with justification
5. Limitations and Uncertainties
6. Recommendations for further verification`;

      const result2 = await this.model.generateContent(prompt);
      const response = await result2.response;
      return response.text();
    } catch (error) {
      console.error('Report generation error:', error);
      return 'Failed to generate detailed report';
    }
  }

  // Reverse geocoding with Nominatim (OpenStreetMap)
  async reverseGeocode(lat: number, lng: number): Promise<{ city: string; country: string; displayName: string }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { headers: { 'User-Agent': 'GeoSpy/1.0' } }
      );
      const data = await response.json();
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown',
        displayName: data.display_name || 'Unknown location'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { city: 'Unknown', country: 'Unknown', displayName: 'Unknown location' };
    }
  }

  // Search locations with Nominatim
  async searchLocations(query: string): Promise<{ name: string; lat: number; lng: number }[]> {
    if (!query.trim()) return [];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'GeoSpy/1.0' } }
      );
      const data = await response.json();
      
      return data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  }

  // Verify coordinates match the claimed location
  async verifyCoordinates(location: string, lat: number, lng: number): Promise<{
    isMatch: boolean;
    distance: number;
    actualLocation: string;
  }> {
    try {
      const geoResult = await this.reverseGeocode(lat, lng);
      const searchResults = await this.searchLocations(location);
      
      if (searchResults.length === 0) {
        return { isMatch: false, distance: Infinity, actualLocation: geoResult.displayName };
      }

      const claimedLocation = searchResults[0];
      const distance = this.calculateDistance(lat, lng, claimedLocation.lat, claimedLocation.lng);
      
      // Consider it a match if within 50km
      const isMatch = distance < 50;
      
      return {
        isMatch,
        distance,
        actualLocation: geoResult.displayName
      };
    } catch (error) {
      console.error('Verification error:', error);
      return { isMatch: false, distance: Infinity, actualLocation: 'Unknown' };
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const geminiService = new GeminiService();
export default geminiService;
