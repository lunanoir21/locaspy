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
      const prompt = `You are a WORLD-CLASS geolocation expert with 20+ years of OSINT experience. Your reputation depends on ACCURACY over speed. You MUST be EXTREMELY CONSERVATIVE with confidence scores.

🚨 CRITICAL MISSION: MINIMIZE FALSE POSITIVES AT ALL COSTS 🚨

═══════════════════════════════════════════════════════════════
TIER SYSTEM - STRICT EVIDENCE REQUIREMENTS
═══════════════════════════════════════════════════════════════

🏆 TIER 1 - DEFINITIVE PROOF (Confidence: 85-100%)
REQUIRES: 3+ of these SPECIFIC, VERIFIABLE indicators:
✓ Readable street signs with EXACT street names (not generic "Main St")
✓ License plates with VISIBLE country/region codes
✓ Business signs with VERIFIABLE addresses or phone numbers
✓ Unique landmarks with KNOWN GPS coordinates (Eiffel Tower, Big Ben, etc.)
✓ Government buildings with IDENTIFIABLE architectural features
✓ Metro/train stations with VISIBLE line numbers and station names
✓ Postal codes, area codes visible in image
✓ Specific chain stores UNIQUE to one country (not McDonald's/Starbucks)

⚠️ WARNING: If you don't have 3+ TIER 1 indicators, MAX confidence is 70%!

🥈 TIER 2 - STRONG EVIDENCE (Confidence: 55-75%)
REQUIRES: 4+ of these indicators TOGETHER:
✓ Architectural style + Language on signs + Vehicle types
✓ Road markings + Traffic signs + Electrical infrastructure
✓ Climate indicators + Vegetation + Building materials
✓ Urban planning style + Street furniture + Sidewalk patterns
✓ Regional chain stores + Local advertising + Cultural elements

⚠️ WARNING: TIER 2 alone = MAX 65% confidence!

🥉 TIER 3 - MODERATE EVIDENCE (Confidence: 30-50%)
✓ General architectural style (could match 5+ countries)
✓ Climate and vegetation (broad geographic area)
✓ Vehicle types (common across multiple regions)
✓ Generic urban/rural characteristics

⚠️ WARNING: TIER 3 alone = MAX 45% confidence!

❌ TIER 4 - INSUFFICIENT EVIDENCE (Confidence: 0-25%)
✓ Generic buildings that could be anywhere
✓ Natural landscapes without unique features
✓ Common objects without regional specificity
✓ Ambiguous features

═══════════════════════════════════════════════════════════════
MANDATORY VERIFICATION PROCESS (FOLLOW EVERY STEP!)
═══════════════════════════════════════════════════════════════

STEP 1: EVIDENCE COLLECTION
- List EVERY visible indicator in the image
- Classify each indicator by TIER (1, 2, 3, or 4)
- Count indicators per tier

STEP 2: CONTRADICTION CHECK
- Do ANY indicators contradict each other?
- If YES: REDUCE confidence by 30% immediately
- Example: European architecture + Asian license plates = CONTRADICTION

STEP 3: ALTERNATIVE LOCATIONS
- List 3 OTHER locations that could match these indicators
- If you can easily find alternatives: REDUCE confidence by 20%

STEP 4: SPECIFICITY TEST
- Are your indicators SPECIFIC or GENERIC?
- Generic (e.g., "modern building"): REDUCE confidence by 15%
- Specific (e.g., "Deutsche Bahn station sign"): INCREASE confidence by 10%

STEP 5: CONFIDENCE CALCULATION
Base Score = 0%
+ TIER 1 indicators: +20% each (max 3 counted)
+ TIER 2 indicators: +10% each (max 4 counted)
+ TIER 3 indicators: +5% each (max 3 counted)
- Contradictions: -30%
- Easy alternatives: -20%
- Generic indicators: -15%
- Uncertainty words in reasoning: -10%

FINAL SCORE = MAX(0, MIN(100, Base Score))

STEP 6: REALITY CHECK
- If confidence > 70% but you have doubts: SET TO 60%
- If confidence > 80% but not 100% certain: SET TO 70%
- If confidence > 90% but not a famous landmark: SET TO 80%

═══════════════════════════════════════════════════════════════
FORBIDDEN PHRASES (NEVER USE THESE!)
═══════════════════════════════════════════════════════════════
❌ "appears to be" → Use "is" or lower confidence
❌ "seems like" → Use "is" or lower confidence
❌ "possibly" → Lower confidence by 20%
❌ "might be" → Lower confidence by 20%
❌ "could be" → Lower confidence by 20%
❌ "likely" → Lower confidence by 15%
❌ "probably" → Lower confidence by 15%
❌ "suggests" → Lower confidence by 10%

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (STRICT JSON - NO MARKDOWN!)
═══════════════════════════════════════════════════════════════

{
  "location": {
    "city": "EXACT City Name OR 'Unknown' if uncertain",
    "country": "EXACT Country Name OR 'Unknown' if uncertain",
    "lat": 52.5200,
    "lng": 13.4050,
    "confidence": 45
  },
  "analysis": {
    "description": "FACTUAL description of what you see (no speculation)",
    "clues": [
      "TIER 1: Specific evidence with details",
      "TIER 2: Supporting evidence with context",
      "TIER 3: General observation"
    ],
    "reasoning": "STEP-BY-STEP: 1) Evidence collected: [list]. 2) Tier classification: [counts]. 3) Contradictions: [yes/no]. 4) Alternatives: [list]. 5) Confidence calculation: [show math]. 6) Final decision: [why this confidence]"
  }
}

═══════════════════════════════════════════════════════════════
REMEMBER: IT'S BETTER TO SAY "I DON'T KNOW" (30% confidence)
THAN TO GUESS WRONG (70% confidence)!
═══════════════════════════════════════════════════════════════`;

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
    
    // Advanced validation with multiple checks
    
    // 1. Check for uncertainty indicators in raw text
    const uncertaintyWords = [
      'maybe', 'possibly', 'might', 'could be', 'appears to be', 
      'seems like', 'probably', 'perhaps', 'likely', 'suggest',
      'indicate', 'may be', 'unclear', 'difficult to determine'
    ];
    const uncertaintyCount = uncertaintyWords.filter(word => 
      rawText.toLowerCase().includes(word)
    ).length;
    
    if (uncertaintyCount > 0) {
      const penalty = Math.min(uncertaintyCount * 10, 40);
      confidence = Math.max(confidence - penalty, 0);
      reasons.push(`Uncertainty detected (${uncertaintyCount} indicators) - reduced by ${penalty}%`);
    }

    // 2. Check for high-confidence indicators (TIER 1)
    const tier1Indicators = [
      'street sign', 'street name', 'license plate', 'plate number',
      'store name', 'business name', 'landmark', 'monument',
      'unique architecture', 'specific language', 'flag', 'coordinates',
      'postal code', 'area code', 'metro station', 'train station'
    ];
    
    const tier1Count = tier1Indicators.filter(indicator => 
      response.analysis.clues.some(clue => clue.toLowerCase().includes(indicator))
    ).length;

    // 3. Check for medium-confidence indicators (TIER 2)
    const tier2Indicators = [
      'architecture', 'building style', 'road marking', 'traffic sign',
      'vehicle type', 'chain store', 'restaurant chain', 'electrical',
      'climate', 'vegetation', 'urban planning'
    ];
    
    const tier2Count = tier2Indicators.filter(indicator => 
      response.analysis.clues.some(clue => clue.toLowerCase().includes(indicator))
    ).length;

    // 4. Confidence adjustment based on indicator quality
    if (tier1Count === 0 && confidence > 70) {
      confidence = Math.min(confidence, 70);
      reasons.push('No TIER 1 indicators - capped at 70%');
    }
    
    if (tier1Count === 0 && tier2Count < 2 && confidence > 50) {
      confidence = Math.min(confidence, 50);
      reasons.push('Insufficient strong indicators - capped at 50%');
    }

    // 5. Validate coordinates are reasonable
    const { lat, lng } = response.location;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      confidence = Math.min(confidence, 20);
      reasons.push('Invalid coordinates detected');
    }

    // 6. Check if location is in water (enhanced check)
    if (this.isLikelyWater(lat, lng)) {
      confidence = Math.min(confidence, 15);
      reasons.push('Location appears to be in water body');
    }

    // 7. Validate clue quality and quantity
    if (response.analysis.clues.length < 2) {
      confidence = Math.min(confidence, 40);
      reasons.push('Insufficient clues provided');
    }
    
    if (response.analysis.clues.length < 1) {
      confidence = Math.min(confidence, 20);
      reasons.push('No clues provided');
    }

    // 8. Check for generic descriptions
    const genericTerms = ['building', 'street', 'road', 'tree', 'sky', 'generic'];
    const genericCount = genericTerms.filter(term =>
      response.analysis.description.toLowerCase().includes(term)
    ).length;
    
    if (genericCount > 2 && confidence > 40) {
      confidence = Math.min(confidence, 40);
      reasons.push('Description too generic');
    }

    // 9. Cross-validation: Check if city/country are "Unknown"
    if (response.location.city.toLowerCase().includes('unknown') || 
        response.location.country.toLowerCase().includes('unknown')) {
      confidence = Math.min(confidence, 30);
      reasons.push('Location marked as unknown');
    }

    // 10. Reasoning quality check
    if (response.analysis.reasoning.length < 50) {
      confidence = Math.min(confidence, 50);
      reasons.push('Insufficient reasoning provided');
    }

    // Final confidence score
    confidence = Math.max(0, Math.min(100, Math.round(confidence)));

    return {
      isValid: confidence >= 20,
      confidence: confidence,
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
