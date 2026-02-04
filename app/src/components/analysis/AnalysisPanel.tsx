import { useState } from 'react';
import type { AnalysisResult } from '@/types';
import { useAnalysisStore } from '@/store/analysisStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Copy, 
  Check, 
  FileDown, 
  Share2, 
  Target,
  Lightbulb,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Meh
} from 'lucide-react';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const AnalysisPanel = ({ result, isAnalyzing }: AnalysisPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const { exportToPDF, shareAnalysis } = useAnalysisStore();

  const handleCopyCoordinates = () => {
    if (result) {
      navigator.clipboard.writeText(`${result.location.lat}, ${result.location.lng}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportToPDF();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geospy-analysis-${result?.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleShare = async () => {
    try {
      await shareAnalysis();
      // Show success toast or notification
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-2 border-white/10 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-t-white rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="w-8 h-8 text-white/60" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Analyzing Image...</h3>
        <p className="text-white/50 text-center text-sm">
          Our AI is examining visual clues, architecture, text, and geographic indicators
        </p>
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <ImageIcon className="w-10 h-10 text-white/30" />
        </div>
        <h3 className="text-lg font-medium text-white/70 mb-2">No Analysis Yet</h3>
        <p className="text-white/40 text-sm max-w-xs">
          Upload an image to get started with AI-powered geolocation analysis
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 mx-4 mt-4 w-auto">
          <TabsTrigger 
            value="results"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Results
          </TabsTrigger>
          <TabsTrigger 
            value="similar"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Similar Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="flex-1 flex flex-col p-4 m-0 mt-4">
          {/* Analyzed Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 mb-4">
            <img 
              src={result.imageUrl} 
              alt="Analyzed" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-sm text-white/80 line-clamp-2">{result.description}</p>
            </div>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <MapPin className="w-4 h-4" />
                Latitude
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-mono">{result.location.lat.toFixed(4)}</span>
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
                Longitude
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-mono">{result.location.lng.toFixed(4)}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Target className="w-4 h-4" />
                City
              </div>
              <span className="text-white font-medium">{result.city}</span>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Target className="w-4 h-4" />
                Country
              </div>
              <span className="text-white font-medium">{result.country}</span>
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Confidence</span>
              <span className={`text-lg font-bold ${
                result.confidence >= 80 ? 'text-green-400' :
                result.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {result.confidence}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  result.confidence >= 80 ? 'bg-green-400' :
                  result.confidence >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${result.confidence}%` }}
              />
            </div>
          </div>

          {/* Clues */}
          <div className="flex-1 overflow-auto">
            <h4 className="text-white/70 text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Key Clues
            </h4>
            <div className="space-y-2">
              {result.clues.map((clue, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 bg-white/5 rounded-lg p-3"
                >
                  <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs text-white/60 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-white/80 text-sm">{clue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share GeoSpy
            </Button>
          </div>

          {/* Feedback */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-center text-white/50 text-sm mb-3">How&apos;d we do?</p>
            <div className="flex justify-center gap-4">
              <button className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <ThumbsUp className="w-5 h-5 text-white/60" />
              </button>
              <button className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <Meh className="w-5 h-5 text-white/60" />
              </button>
              <button className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <ThumbsDown className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="similar" className="flex-1 p-4 m-0 mt-4">
          {result.similarImages && result.similarImages.length > 0 ? (
            <div className="space-y-4">
              {result.similarImages.map((location, index) => (
                <div 
                  key={index}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white/30" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{location}</h4>
                      <p className="text-white/50 text-sm">Similar location nearby</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ImageIcon className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/50">No similar images found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisPanel;
