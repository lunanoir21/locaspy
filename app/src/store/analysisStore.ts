import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnalysisState, AnalysisResult } from '@/types';
import { geminiService } from '@/services/geminiService';
import { authService } from '@/services/authService';

interface AnalysisStore extends AnalysisState {
  analyzeImage: (imageBase64: string, userId?: string) => Promise<void>;
  analyzeImageWithValidation: (imageBase64: string, userId?: string) => Promise<{
    result: AnalysisResult;
    validation: { isConfirmed: boolean; confidenceAdjustment: number; details: string };
    verification: { isMatch: boolean; distance: number; actualLocation: string };
  }>;
  setCurrentResult: (result: AnalysisResult | null) => void;
  addToHistory: (result: AnalysisResult) => void;
  clearHistory: () => void;
  clearError: () => void;
  exportToPDF: () => Promise<Blob>;
  shareAnalysis: () => Promise<string>;
  deleteResult: (id: string) => void;
  getStats: () => { total: number; avgConfidence: number; topCountries: string[] };
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      currentResult: null,
      history: [],
      isAnalyzing: false,
      error: null,
      session: null,

      analyzeImage: async (imageBase64: string, userId?: string) => {
        set({ isAnalyzing: true, error: null });
        try {
          const geminiResponse = await geminiService.analyzeImage(imageBase64);
          
          const geoInfo = await geminiService.reverseGeocode(
            geminiResponse.location.lat,
            geminiResponse.location.lng
          );

          const similarImages = await geminiService.findSimilarLocations(
            imageBase64,
            geminiResponse.location
          );

          const result: AnalysisResult = {
            id: crypto.randomUUID(),
            imageUrl: `data:image/jpeg;base64,${imageBase64}`,
            location: {
              lat: geminiResponse.location.lat,
              lng: geminiResponse.location.lng
            },
            city: geoInfo.city || geminiResponse.location.city,
            country: geoInfo.country || geminiResponse.location.country,
            confidence: geminiResponse.location.confidence,
            description: geminiResponse.analysis.description,
            clues: geminiResponse.analysis.clues,
            similarImages,
            createdAt: new Date(),
            userId
          };

          if (userId) {
            await authService.incrementAnalysisCount(userId);
          }

          set(state => ({
            currentResult: result,
            history: [result, ...state.history].slice(0, 100),
            isAnalyzing: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Analysis failed',
            isAnalyzing: false 
          });
          throw error;
        }
      },

      analyzeImageWithValidation: async (imageBase64: string, userId?: string) => {
        set({ isAnalyzing: true, error: null });
        
        try {
          // Primary analysis
          const geminiResponse = await geminiService.analyzeImage(imageBase64);
          
          // Cross-validation
          const validation = await geminiService.crossValidateLocation(imageBase64, geminiResponse);
          
          // Coordinate verification
          const verification = await geminiService.verifyCoordinates(
            `${geminiResponse.location.city}, ${geminiResponse.location.country}`,
            geminiResponse.location.lat,
            geminiResponse.location.lng
          );

          // Adjust confidence based on validation
          let finalConfidence = geminiResponse.location.confidence + validation.confidenceAdjustment;
          
          if (!verification.isMatch) {
            finalConfidence = Math.min(finalConfidence, 50);
          }
          
          finalConfidence = Math.max(0, Math.min(100, finalConfidence));

          const geoInfo = await geminiService.reverseGeocode(
            geminiResponse.location.lat,
            geminiResponse.location.lng
          );

          const similarImages = await geminiService.findSimilarLocations(
            imageBase64,
            geminiResponse.location
          );

          const result: AnalysisResult = {
            id: crypto.randomUUID(),
            imageUrl: `data:image/jpeg;base64,${imageBase64}`,
            location: {
              lat: geminiResponse.location.lat,
              lng: geminiResponse.location.lng
            },
            city: geoInfo.city || geminiResponse.location.city,
            country: geoInfo.country || geminiResponse.location.country,
            confidence: Math.round(finalConfidence),
            description: geminiResponse.analysis.description,
            clues: geminiResponse.analysis.clues,
            similarImages,
            createdAt: new Date(),
            userId
          };

          if (userId) {
            await authService.incrementAnalysisCount(userId);
          }

          set(state => ({
            currentResult: result,
            history: [result, ...state.history].slice(0, 100),
            isAnalyzing: false
          }));

          return { result, validation, verification };
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Analysis failed',
            isAnalyzing: false 
          });
          throw error;
        }
      },

      setCurrentResult: (result: AnalysisResult | null) => {
        set({ currentResult: result });
      },

      addToHistory: (result: AnalysisResult) => {
        set(state => ({
          history: [result, ...state.history].slice(0, 100)
        }));
      },

      clearHistory: () => {
        set({ history: [], currentResult: null });
      },

      clearError: () => {
        set({ error: null });
      },

      deleteResult: (id: string) => {
        set(state => ({
          history: state.history.filter(h => h.id !== id),
          currentResult: state.currentResult?.id === id ? null : state.currentResult
        }));
      },

      getStats: () => {
        const { history } = get();
        const total = history.length;
        const avgConfidence = total > 0 
          ? Math.round(history.reduce((sum, h) => sum + h.confidence, 0) / total)
          : 0;
        
        const countryCounts: Record<string, number> = {};
        history.forEach(h => {
          countryCounts[h.country] = (countryCounts[h.country] || 0) + 1;
        });
        
        const topCountries = Object.entries(countryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([country]) => country);

        return { total, avgConfidence, topCountries };
      },

      exportToPDF: async () => {
        const { currentResult } = get();
        if (!currentResult) {
          throw new Error('No analysis to export');
        }

        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('GeoSpy Analysis Report', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Location: ${currentResult.city}, ${currentResult.country}`, 20, 40);
        doc.text(`Coordinates: ${currentResult.location.lat.toFixed(4)}, ${currentResult.location.lng.toFixed(4)}`, 20, 50);
        doc.text(`Confidence: ${currentResult.confidence}%`, 20, 60);
        doc.text(`Date: ${currentResult.createdAt.toLocaleString()}`, 20, 70);
        
        doc.setFontSize(14);
        doc.text('Analysis:', 20, 90);
        doc.setFontSize(12);
        const splitDescription = doc.splitTextToSize(currentResult.description, 170);
        doc.text(splitDescription, 20, 100);
        
        doc.setFontSize(14);
        doc.text('Key Clues:', 20, 130);
        doc.setFontSize(12);
        currentResult.clues.forEach((clue, index) => {
          doc.text(`${index + 1}. ${clue}`, 20, 140 + (index * 10));
        });

        return doc.output('blob');
      },

      shareAnalysis: async () => {
        const { currentResult } = get();
        if (!currentResult) {
          throw new Error('No analysis to share');
        }

        const shareId = btoa(currentResult.id).replace(/[^a-zA-Z0-9]/g, '');
        const shareUrl = `${window.location.origin}/share/${shareId}`;
        
        await navigator.clipboard.writeText(shareUrl);
        
        return shareUrl;
      }
    }),
    {
      name: 'analysis-storage',
      partialize: (state) => ({ history: state.history })
    }
  )
);
