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
        
        // Set black background
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Header with logo area
        doc.setFillColor(20, 20, 20);
        doc.rect(0, 0, 210, 40, 'F');
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('GEOSPY AI', 20, 20);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Geolocation Analysis Report', 20, 28);
        
        // Report ID and Date
        doc.setFontSize(9);
        doc.text(`Report ID: ${currentResult.id.slice(0, 8).toUpperCase()}`, 150, 20);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 26);
        
        // Divider
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(0.5);
        doc.line(20, 42, 190, 42);
        
        let yPos = 55;
        
        // EXECUTIVE SUMMARY
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('EXECUTIVE SUMMARY', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 200);
        
        // Location Box
        doc.setFillColor(30, 30, 30);
        doc.roundedRect(20, yPos, 170, 25, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('IDENTIFIED LOCATION', 25, yPos + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`${currentResult.city}, ${currentResult.country}`, 25, yPos + 14);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.text(`Coordinates: ${currentResult.location.lat.toFixed(6)}, ${currentResult.location.lng.toFixed(6)}`, 25, yPos + 20);
        yPos += 35;
        
        // Confidence Score
        doc.setFillColor(30, 30, 30);
        doc.roundedRect(20, yPos, 80, 20, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('CONFIDENCE SCORE', 25, yPos + 7);
        
        // Confidence color
        const confColor = currentResult.confidence >= 80 ? [34, 197, 94] : 
                         currentResult.confidence >= 50 ? [234, 179, 8] : [239, 68, 68];
        doc.setTextColor(...confColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${currentResult.confidence}%`, 25, yPos + 16);
        
        // Analysis Date
        doc.setFillColor(30, 30, 30);
        doc.roundedRect(110, yPos, 80, 20, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('ANALYSIS DATE', 115, yPos + 7);
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        doc.text(currentResult.createdAt.toLocaleDateString(), 115, yPos + 16);
        yPos += 30;
        
        // ANALYSIS DETAILS
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('ANALYSIS DETAILS', 20, yPos);
        yPos += 10;
        
        // Description
        doc.setFillColor(30, 30, 30);
        doc.roundedRect(20, yPos, 170, 30, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Description', 25, yPos + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        const descLines = doc.splitTextToSize(currentResult.description, 160);
        doc.text(descLines, 25, yPos + 14);
        yPos += 40;
        
        // KEY INDICATORS
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('KEY INDICATORS', 20, yPos);
        yPos += 10;
        
        currentResult.clues.forEach((clue, index) => {
          if (yPos > 250) {
            doc.addPage();
            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, 210, 297, 'F');
            yPos = 20;
          }
          
          doc.setFillColor(30, 30, 30);
          doc.roundedRect(20, yPos, 170, 15, 3, 3, 'F');
          
          // Number badge
          doc.setFillColor(60, 60, 60);
          doc.circle(28, yPos + 7.5, 4, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}`, 26.5, yPos + 9);
          
          // Clue text
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(200, 200, 200);
          const clueLines = doc.splitTextToSize(clue, 150);
          doc.text(clueLines, 35, yPos + 9);
          yPos += 20;
        });
        
        // Add new page for image
        doc.addPage();
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 297, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('ANALYZED IMAGE', 20, 20);
        
        // Add image
        try {
          const img = new Image();
          img.src = currentResult.imageUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL('image/jpeg');
          
          doc.addImage(imgData, 'JPEG', 20, 30, 170, 120);
        } catch (error) {
          console.error('Failed to add image to PDF:', error);
        }
        
        // Footer on all pages
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFillColor(20, 20, 20);
          doc.rect(0, 287, 210, 10, 'F');
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(8);
          doc.text('GeoSpy AI - Confidential Report', 20, 293);
          doc.text(`Page ${i} of ${pageCount}`, 180, 293);
        }

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
