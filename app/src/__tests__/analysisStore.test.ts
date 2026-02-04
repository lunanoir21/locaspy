import { useAnalysisStore } from '@/store/analysisStore';
import type { AnalysisResult } from '@/types';

describe('AnalysisStore', () => {
  beforeEach(() => {
    // Reset store state
    const store = useAnalysisStore.getState();
    store.clearHistory();
    store.clearError();
    store.setCurrentResult(null);
  });

  describe('getStats', () => {
    it('should return correct stats for empty history', () => {
      const store = useAnalysisStore.getState();
      const stats = store.getStats();
      
      expect(stats.total).toBe(0);
      expect(stats.avgConfidence).toBe(0);
      expect(stats.topCountries).toEqual([]);
    });

    it('should calculate stats correctly', () => {
      const store = useAnalysisStore.getState();
      
      const mockResults: AnalysisResult[] = [
        {
          id: '1',
          imageUrl: 'data:image/jpeg;base64,test1',
          location: { lat: 52.52, lng: 13.405 },
          city: 'Berlin',
          country: 'Germany',
          confidence: 80,
          description: 'Test 1',
          clues: ['clue1'],
          createdAt: new Date()
        },
        {
          id: '2',
          imageUrl: 'data:image/jpeg;base64,test2',
          location: { lat: 48.8566, lng: 2.3522 },
          city: 'Paris',
          country: 'France',
          confidence: 70,
          description: 'Test 2',
          clues: ['clue2'],
          createdAt: new Date()
        },
        {
          id: '3',
          imageUrl: 'data:image/jpeg;base64,test3',
          location: { lat: 51.5074, lng: -0.1278 },
          city: 'London',
          country: 'UK',
          confidence: 90,
          description: 'Test 3',
          clues: ['clue3'],
          createdAt: new Date()
        }
      ];

      mockResults.forEach(result => store.addToHistory(result));
      
      const stats = store.getStats();
      
      expect(stats.total).toBe(3);
      expect(stats.avgConfidence).toBe(80); // (80 + 70 + 90) / 3
      expect(stats.topCountries).toContain('Germany');
      expect(stats.topCountries).toContain('France');
      expect(stats.topCountries).toContain('UK');
    });
  });

  describe('deleteResult', () => {
    it('should delete result from history', () => {
      const store = useAnalysisStore.getState();
      
      const mockResult: AnalysisResult = {
        id: '1',
        imageUrl: 'data:image/jpeg;base64,test',
        location: { lat: 52.52, lng: 13.405 },
        city: 'Berlin',
        country: 'Germany',
        confidence: 80,
        description: 'Test',
        clues: ['clue1'],
        createdAt: new Date()
      };

      store.addToHistory(mockResult);
      expect(store.getStats().total).toBe(1);

      store.deleteResult('1');
      expect(store.getStats().total).toBe(0);
    });

    it('should clear current result if deleted result is current', () => {
      const store = useAnalysisStore.getState();
      
      const mockResult: AnalysisResult = {
        id: '1',
        imageUrl: 'data:image/jpeg;base64,test',
        location: { lat: 52.52, lng: 13.405 },
        city: 'Berlin',
        country: 'Germany',
        confidence: 80,
        description: 'Test',
        clues: ['clue1'],
        createdAt: new Date()
      };

      store.addToHistory(mockResult);
      store.setCurrentResult(mockResult);
      
      expect(store.currentResult).not.toBeNull();

      store.deleteResult('1');
      expect(store.currentResult).toBeNull();
    });
  });

  describe('clearHistory', () => {
    it('should clear all history and current result', () => {
      const store = useAnalysisStore.getState();
      
      const mockResult: AnalysisResult = {
        id: '1',
        imageUrl: 'data:image/jpeg;base64,test',
        location: { lat: 52.52, lng: 13.405 },
        city: 'Berlin',
        country: 'Germany',
        confidence: 80,
        description: 'Test',
        clues: ['clue1'],
        createdAt: new Date()
      };

      store.addToHistory(mockResult);
      store.setCurrentResult(mockResult);
      
      store.clearHistory();
      
      expect(store.getStats().total).toBe(0);
      expect(store.currentResult).toBeNull();
    });
  });
});
