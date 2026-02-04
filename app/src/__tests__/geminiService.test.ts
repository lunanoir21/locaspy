import { geminiService } from '@/services/geminiService';
import { describe, it, expect, beforeEach } from 'vitest';

describe('GeminiService', () => {
  beforeEach(() => {
    // Clear cache before each test
    (geminiService as any).cache.clear();
  });

  describe('validateAnalysis', () => {
    it('should reduce confidence when uncertainty words are present', () => {
      const response = {
        location: {
          city: 'Test City',
          country: 'Test Country',
          lat: 52.52,
          lng: 13.405,
          confidence: 85
        },
        analysis: {
          description: 'Test description',
          clues: ['clue1', 'clue2'],
          reasoning: 'This might be the location'
        }
      };

      const result = (geminiService as any).validateAnalysis(response, response.analysis.reasoning);
      
      expect(result.confidence).toBeLessThan(85);
      expect(result.reasons).toContain('Uncertainty detected in reasoning');
    });

    it('should reduce confidence for invalid coordinates', () => {
      const response = {
        location: {
          city: 'Test City',
          country: 'Test Country',
          lat: 999,
          lng: 999,
          confidence: 90
        },
        analysis: {
          description: 'Test description',
          clues: ['clue1', 'clue2'],
          reasoning: 'Clear indicators'
        }
      };

      const result = (geminiService as any).validateAnalysis(response, response.analysis.reasoning);
      
      expect(result.confidence).toBeLessThanOrEqual(30);
      expect(result.reasons).toContain('Invalid coordinates');
    });

    it('should reduce confidence for water locations', () => {
      const response = {
        location: {
          city: 'Ocean',
          country: 'Pacific',
          lat: 0,
          lng: -160,
          confidence: 80
        },
        analysis: {
          description: 'Test description',
          clues: ['clue1', 'clue2'],
          reasoning: 'Clear indicators'
        }
      };

      const result = (geminiService as any).validateAnalysis(response, response.analysis.reasoning);
      
      expect(result.confidence).toBeLessThanOrEqual(20);
      expect(result.reasons).toContain('Location appears to be in water');
    });

    it('should reduce confidence for insufficient clues', () => {
      const response = {
        location: {
          city: 'Test City',
          country: 'Test Country',
          lat: 52.52,
          lng: 13.405,
          confidence: 80
        },
        analysis: {
          description: 'Test description',
          clues: ['only one clue'],
          reasoning: 'Clear indicators'
        }
      };

      const result = (geminiService as any).validateAnalysis(response, response.analysis.reasoning);
      
      expect(result.confidence).toBeLessThanOrEqual(50);
      expect(result.reasons).toContain('Insufficient clues');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const distance = (geminiService as any).calculateDistance(
        52.52, 13.405,  // Berlin
        48.8566, 2.3522  // Paris
      );

      // Distance between Berlin and Paris is approximately 878 km
      expect(distance).toBeGreaterThan(800);
      expect(distance).toBeLessThan(950);
    });

    it('should return 0 for same coordinates', () => {
      const distance = (geminiService as any).calculateDistance(
        52.52, 13.405,
        52.52, 13.405
      );

      expect(distance).toBe(0);
    });
  });

  describe('isLikelyWater', () => {
    it('should identify Pacific Ocean as water', () => {
      const isWater = (geminiService as any).isLikelyWater(0, -160);
      expect(isWater).toBe(true);
    });

    it('should identify Berlin as land', () => {
      const isWater = (geminiService as any).isLikelyWater(52.52, 13.405);
      expect(isWater).toBe(false);
    });
  });
});
