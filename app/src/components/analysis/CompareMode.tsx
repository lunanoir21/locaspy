import { useState } from 'react';
import { useAnalysisStore } from '@/store/analysisStore';
import { motion } from 'framer-motion';
import { MapView } from '@/components/map/MapView';
import { FadeIn, GlowCard } from '@/components/ui/animated-container';
import { 
  X, 
  GitCompare, 
  MapPin, 
  Target,
  Check
} from 'lucide-react';

interface CompareModeProps {
  onClose: () => void;
}

export const CompareMode = ({ onClose }: CompareModeProps) => {
  const { history } = useAnalysisStore();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [compareView, setCompareView] = useState<'grid' | 'map'>('grid');

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selectedResults = history.filter(r => selectedItems.includes(r.id));

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getComparisonStats = () => {
    if (selectedResults.length < 2) return null;

    const distances: number[] = [];
    for (let i = 0; i < selectedResults.length - 1; i++) {
      for (let j = i + 1; j < selectedResults.length; j++) {
        const d = calculateDistance(
          selectedResults[i].location.lat,
          selectedResults[i].location.lng,
          selectedResults[j].location.lat,
          selectedResults[j].location.lng
        );
        distances.push(d);
      }
    }

    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    const minDistance = Math.min(...distances);

    const sameCountry = selectedResults.every(r => r.country === selectedResults[0].country);
    const sameCity = selectedResults.every(r => r.city === selectedResults[0].city);

    return { avgDistance, maxDistance, minDistance, sameCountry, sameCity };
  };

  const stats = getComparisonStats();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Compare Analysis</h2>
            <p className="text-white/50 text-sm">
              {selectedItems.length} selected (max 4)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedItems.length >= 2 && (
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setCompareView('grid')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  compareView === 'grid' ? 'bg-white/10 text-white' : 'text-white/50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setCompareView('map')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  compareView === 'map' ? 'bg-white/10 text-white' : 'text-white/50'
                }`}
              >
                Map
              </button>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Selection Panel */}
        <div className="w-80 border-r border-white/10 p-4 overflow-auto">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-4">
            Select from History ({history.length})
          </p>
          
          <div className="space-y-2">
            {history.map((result) => (
              <motion.button
                key={result.id}
                onClick={() => toggleSelection(result.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 rounded-xl border transition-all text-left ${
                  selectedItems.includes(result.id)
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    selectedItems.includes(result.id)
                      ? 'bg-white border-white'
                      : 'border-white/30'
                  }`}>
                    {selectedItems.includes(result.id) && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {result.city}, {result.country}
                    </p>
                    <p className="text-white/40 text-xs">
                      {result.confidence}% confidence
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Comparison View */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedResults.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <GitCompare className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Select at least 2 analyses to compare</p>
              </div>
            </div>
          ) : compareView === 'grid' ? (
            <div className="space-y-6">
              {/* Stats */}
              {stats && (
                <FadeIn>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <GlowCard className="p-4">
                      <p className="text-white/50 text-xs mb-1">Avg Distance</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.avgDistance.toFixed(1)} km
                      </p>
                    </GlowCard>
                    <GlowCard className="p-4">
                      <p className="text-white/50 text-xs mb-1">Max Distance</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.maxDistance.toFixed(1)} km
                      </p>
                    </GlowCard>
                    <GlowCard className="p-4">
                      <p className="text-white/50 text-xs mb-1">Min Distance</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.minDistance.toFixed(1)} km
                      </p>
                    </GlowCard>
                    <GlowCard className="p-4">
                      <p className="text-white/50 text-xs mb-1">Location Match</p>
                      <p className="text-lg font-bold text-white">
                        {stats.sameCity ? 'Same City' : stats.sameCountry ? 'Same Country' : 'Different'}
                      </p>
                    </GlowCard>
                  </div>
                </FadeIn>
              )}

              {/* Comparison Grid */}
              <div className={`grid gap-4 ${
                selectedResults.length === 2 ? 'grid-cols-2' :
                selectedResults.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
              }`}>
                {selectedResults.map((result, index) => (
                  <FadeIn key={result.id} delay={index * 0.1}>
                    <GlowCard className="overflow-hidden">
                      {/* Image */}
                      <div className="aspect-video bg-zinc-900 relative">
                        <img 
                          src={result.imageUrl} 
                          alt="Analyzed" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-white/50" />
                          <span className="text-white font-medium">
                            {result.city}, {result.country}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-white/40 text-xs">Latitude</p>
                            <p className="text-white font-mono text-sm">{result.location.lat.toFixed(4)}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-white/40 text-xs">Longitude</p>
                            <p className="text-white font-mono text-sm">{result.location.lng.toFixed(4)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-white/50" />
                          <div className="flex-1">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  result.confidence >= 80 ? 'bg-green-400' :
                                  result.confidence >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${result.confidence}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-white text-sm">{result.confidence}%</span>
                        </div>

                        {/* Clues */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-white/50 text-xs mb-2">Key Clues</p>
                          <div className="space-y-1">
                            {result.clues.slice(0, 3).map((clue, i) => (
                              <p key={i} className="text-white/70 text-sm flex items-center gap-2">
                                <span className="w-1 h-1 bg-white/40 rounded-full" />
                                {clue}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </GlowCard>
                  </FadeIn>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full">
              <MapView
                center={selectedResults[0]?.location}
                markers={selectedResults.map(r => ({
                  position: r.location,
                  title: `${r.city}, ${r.country}`,
                  popup: `Confidence: ${r.confidence}%`
                }))}
                height="100%"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CompareMode;
