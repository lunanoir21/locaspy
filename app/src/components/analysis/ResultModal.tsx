import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Target, Lightbulb, FileDown, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AnalysisResult } from '@/types';
import { useAnalysisStore } from '@/store/analysisStore';
import { Button } from '@/components/ui/button';

interface ResultModalProps {
  result: AnalysisResult;
  onClose: () => void;
}

export const ResultModal = ({ result, onClose }: ResultModalProps) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const { exportToPDF, shareAnalysis } = useAnalysisStore();

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(`${result.location.lat}, ${result.location.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportToPDF();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geospy-analysis-${result.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('PDF export failed. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      await shareAnalysis();
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-950 border border-white/15 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">{t('analysis.results')}</h2>
              <p className="text-white/50 text-sm mt-1">
                {result.city}, {result.country}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Image */}
              <div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 mb-4">
                  <img 
                    src={result.imageUrl} 
                    alt="Analyzed" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Confidence */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-sm">{t('analysis.confidence')}</span>
                    <span className={`text-2xl font-bold ${
                      result.confidence >= 80 ? 'text-green-400' :
                      result.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.confidence >= 80 ? 'bg-green-400' :
                        result.confidence >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4">
                {/* Location Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      {t('analysis.latitude')}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono text-lg">{result.location.lat.toFixed(4)}</span>
                      <button 
                        onClick={handleCopyCoordinates}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      {t('analysis.longitude')}
                    </div>
                    <span className="text-white font-mono text-lg">{result.location.lng.toFixed(4)}</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Target className="w-4 h-4" />
                      {t('analysis.city')}
                    </div>
                    <span className="text-white font-medium">{result.city}</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Target className="w-4 h-4" />
                      {t('analysis.country')}
                    </div>
                    <span className="text-white font-medium">{result.country}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">Description</h4>
                  <p className="text-white/70 text-sm">{result.description}</p>
                </div>

                {/* Clues */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-white/70 text-sm font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {t('analysis.keyClues')}
                  </h4>
                  <div className="space-y-2">
                    {result.clues.map((clue, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 bg-white/5 rounded-lg p-3"
                      >
                        <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs text-white/60 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-white/80 text-sm">{clue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Actions */}
          <div className="border-t border-white/10 p-6">
            <div className="flex gap-3">
              <Button
                onClick={handleExportPDF}
                className="flex-1 bg-white text-black hover:bg-gray-100 font-medium py-6"
              >
                <FileDown className="w-5 h-5 mr-2" />
                {t('analysis.exportPDF')}
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 py-6"
              >
                <Share2 className="w-5 h-5 mr-2" />
                {t('analysis.share')}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResultModal;
