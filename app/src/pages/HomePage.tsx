import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { AdvancedMapView } from '@/components/map/AdvancedMapView';
import { AnalysisPanel } from '@/components/analysis/AnalysisPanel';
import { ImageUploader } from '@/components/analysis/ImageUploader';
import { AgentPanel } from '@/components/agent/AgentPanel';
import { CompareMode } from '@/components/analysis/CompareMode';
import { ResultModal } from '@/components/analysis/ResultModal';
import { useAuthStore } from '@/store/authStore';
import { useAnalysisStore } from '@/store/analysisStore';
import { useAgentStore } from '@/store/agentStore';
import type { GeoLocation } from '@/types';
import { 
  LoadingDots,
  PageTransition 
} from '@/components/ui/animated-container';
import { 
  Upload, 
  PanelRight,
  X,
  Bot,
  GitCompare,
  Sparkles
} from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mapCenter, setMapCenter] = useState<GeoLocation>({ lat: 52.5200, lng: 13.4050 });
  const [showUploader, setShowUploader] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showCompareMode, setShowCompareMode] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'analysis' | 'agent'>('analysis');
  const [viewMode, setViewMode] = useState<'map' | 'satellite' | 'terrain'>('map');
  
  const { checkAuth, user, isAuthenticated } = useAuthStore();
  const { 
    analyzeImage, 
    currentResult, 
    isAnalyzing, 
    history,
    setCurrentResult 
  } = useAnalysisStore();

  const { batchQueue, addToBatchQueue } = useAgentStore();

  // Safe translation function
  const translate = (key: string) => {
    try {
      return t(key as any) || key;
    } catch (e) {
      return key;
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [checkAuth, isAuthenticated, navigate]);

  useEffect(() => {
    if (currentResult) {
      setMapCenter(currentResult.location);
      // Show result modal when analysis completes
      setShowResultModal(true);
    }
  }, [currentResult]);

  const handleImageSelect = async (imageBase64: string) => {
    try {
      // Check if API key is configured
      const apiKey = localStorage.getItem('gemini-api-key') || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert('API anahtarı yapılandırılmamış. Lütfen Ayarlar sayfasından API anahtarınızı girin.');
        navigate('/settings');
        return;
      }

      // Add to agent batch queue
      addToBatchQueue(imageBase64);
      
      // Also run immediate analysis
      await analyzeImage(imageBase64, user?.id);
      setShowUploader(false);
    } catch (error) {
      console.error('Analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analiz başarısız oldu';
      alert(`Hata: ${errorMessage}\n\nLütfen API anahtarınızı Ayarlar sayfasından kontrol edin.`);
    }
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  const handleHistoryClick = () => {
    if (history.length > 0) {
      setCurrentResult(history[0]);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <PageTransition>
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
        <Header 
          onSearch={handleSearch} 
          onHistoryClick={handleHistoryClick}
          onCompareClick={() => setShowCompareMode(true)}
        />
        
        <main className="flex-1 flex overflow-hidden relative">
          {/* Map Section */}
          <div className="flex-1 relative">
            <AdvancedMapView 
              center={mapCenter}
              analysisResult={currentResult}
              height="100%"
            />

            {/* Floating Action Buttons */}
            <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
              {/* Upload Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUploader(true)}
                className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-medium
                         shadow-lg hover:shadow-xl transition-shadow"
              >
                <Upload className="w-5 h-5" />
                {t('home.uploadImage')}
              </motion.button>

              {/* Quick Actions */}
              <AnimatePresence>
                {showUploader && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-zinc-950 border border-white/15 rounded-2xl p-4 shadow-2xl w-80"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium">{translate('home.uploadImage')}</h3>
                      <button 
                        onClick={() => setShowUploader(false)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <ImageUploader 
                      onImageSelect={handleImageSelect}
                      isAnalyzing={isAnalyzing}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Side Controls */}
            <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
              {/* Agent Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAgentPanel(!showAgentPanel);
                  if (!showAgentPanel) setActiveSidebar('agent');
                }}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                  showAgentPanel 
                    ? 'bg-white text-black border-white' 
                    : 'bg-zinc-900 text-white border-white/20 hover:bg-zinc-800'
                }`}
              >
                <Bot className="w-5 h-5" />
                {batchQueue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {batchQueue.length}
                  </span>
                )}
              </motion.button>

              {/* Compare Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCompareMode(true)}
                className="w-12 h-12 bg-zinc-900 border border-white/20 rounded-xl
                         flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <GitCompare className="w-5 h-5 text-white" />
              </motion.button>

              {/* Panel Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPanel(!showPanel)}
                className="w-12 h-12 bg-zinc-900 border border-white/20 rounded-xl
                         flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <PanelRight className={`w-5 h-5 text-white transition-transform ${showPanel ? '' : 'rotate-180'}`} />
              </motion.button>
            </div>

            {/* View Mode Toggle */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-zinc-900/90 backdrop-blur border border-white/20 rounded-xl p-1 flex gap-1">
                {(['map', 'satellite', 'terrain'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === mode 
                        ? 'bg-white text-black' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {translate(`home.${mode}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Status Indicator */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000]"
              >
                <div className="bg-zinc-900/90 backdrop-blur border border-white/20 rounded-full px-6 py-3 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  <span className="text-white text-sm">{translate('home.aiAnalyzing')}</span>
                  <LoadingDots />
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <AnimatePresence mode="wait">
            {showPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 384, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="border-l border-white/10 overflow-hidden"
              >
                {activeSidebar === 'analysis' ? (
                  <AnalysisPanel 
                    result={currentResult}
                    isAnalyzing={isAnalyzing}
                  />
                ) : (
                  <AgentPanel />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent Panel (Slide-over) */}
          <AnimatePresence>
            {showAgentPanel && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute right-0 top-0 bottom-0 w-96 z-[1001]"
              >
                <AgentPanel />
                <button
                  onClick={() => setShowAgentPanel(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="h-8 bg-black border-t border-white/10 flex items-center justify-between px-4 text-xs text-white/40">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Gemini AI Powered
            </span>
            <span>•</span>
            <span>OpenStreetMap + CartoDB</span>
          </div>
          <div className="flex items-center gap-4">
            <span>v2.0.0</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Help</a>
          </div>
        </footer>

        {/* Compare Mode Modal */}
        <AnimatePresence>
          {showCompareMode && (
            <CompareMode onClose={() => setShowCompareMode(false)} />
          )}
        </AnimatePresence>

        {/* Result Modal */}
        <AnimatePresence>
          {showResultModal && currentResult && (
            <ResultModal 
              result={currentResult} 
              onClose={() => setShowResultModal(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default HomePage;
