import { useState } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { agentService } from '@/services/agentService';
import type { AnalysisMode, BatchAnalysisConfig } from '@/services/agentService';
import { 
  ProgressBar,
  LoadingDots,
  GlowCard 
} from '@/components/ui/animated-container';
import { 
  Layers, 
  Zap, 
  Search, 
  Microscope, 
  GitCompare,
  Play,
  X,
  Check,
  Clock,
  Trash2,
  Download,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const analysisModes: { mode: AnalysisMode; label: string; icon: React.ElementType; description: string }[] = [
  { mode: 'quick-scan', label: 'Quick Scan', icon: Zap, description: 'Fast analysis for high-confidence images' },
  { mode: 'single', label: 'Standard', icon: Search, description: 'Balanced speed and accuracy' },
  { mode: 'deep-dive', label: 'Deep Dive', icon: Microscope, description: 'Comprehensive analysis with extra clues' },
  { mode: 'compare', label: 'Compare', icon: GitCompare, description: 'Compare with previous results' },
  { mode: 'batch', label: 'Batch', icon: Layers, description: 'Process multiple images' },
];

export const AgentPanel = () => {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<BatchAnalysisConfig>({
    mode: 'single',
    confidence: 50,
    includeSimilar: true,
    generateReport: true,
    autoExport: false
  });

  const {
    tasks,
    currentTask,
    isProcessing,
    selectedMode,
    batchQueue,
    setSelectedMode,
    addToBatchQueue,
    removeFromBatchQueue,
    clearBatchQueue,
    createTask,
    executeTask,
    clearCompletedTasks,
    setCurrentTask
  } = useAgentStore();

  const handleModeSelect = (mode: AnalysisMode) => {
    setSelectedMode(mode);
    setConfig(prev => ({ ...prev, mode }));
  };

  const handleStartAnalysis = async () => {
    if (batchQueue.length === 0) return;

    try {
      const task = createTask(selectedMode);
      await executeTask(task.id, config);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          addToBatchQueue(base64);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-white/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4" />;
      case 'running': return <LoadingDots />;
      case 'failed': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">AI Agent</h2>
              <p className="text-white/50 text-xs">Batch & Advanced Analysis</p>
            </div>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Settings2 className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Analysis Mode Selection */}
      <div className="p-4 border-b border-white/10">
        <p className="text-white/50 text-xs mb-3 uppercase tracking-wider">Analysis Mode</p>
        <div className="grid grid-cols-2 gap-2">
          {analysisModes.map(({ mode, label, icon: Icon, description }) => (
            <motion.button
              key={mode}
              onClick={() => handleModeSelect(mode)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-xl border transition-all text-left ${
                selectedMode === mode
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${selectedMode === mode ? 'text-white' : 'text-white/50'}`} />
              <p className={`text-sm font-medium ${selectedMode === mode ? 'text-white' : 'text-white/70'}`}>
                {label}
              </p>
              <p className="text-xs text-white/40 mt-1">{description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Min Confidence</span>
                  <span className="text-white">{config.confidence}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.confidence}
                  onChange={(e) => setConfig({ ...config, confidence: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Include Similar Images</span>
                <button
                  onClick={() => setConfig({ ...config, includeSimilar: !config.includeSimilar })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.includeSimilar ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: config.includeSimilar ? 24 : 4 }}
                    className="w-4 h-4 bg-zinc-900 rounded-full"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Auto Export Results</span>
                <button
                  onClick={() => setConfig({ ...config, autoExport: !config.autoExport })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.autoExport ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: config.autoExport ? 24 : 4 }}
                    className="w-4 h-4 bg-zinc-900 rounded-full"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Queue */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/50 text-xs uppercase tracking-wider">Queue ({batchQueue.length})</p>
          {batchQueue.length > 0 && (
            <button
              onClick={clearBatchQueue}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-colors mb-4"
        >
          <p className="text-white/50 text-sm">Drop images here to add to queue</p>
        </div>

        {/* Queue Items */}
        <div className="space-y-2">
          <AnimatePresence>
            {batchQueue.map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                    <span className="text-white/40 text-xs">IMG</span>
                  </div>
                  <span className="text-white/70 text-sm">Image {index + 1}</span>
                </div>
                <button
                  onClick={() => removeFromBatchQueue(index)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-xs uppercase tracking-wider">Tasks</p>
              <button
                onClick={clearCompletedTasks}
                className="text-xs text-white/40 hover:text-white/60"
              >
                Clear Completed
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <GlowCard 
                  key={task.id}
                  className={`p-3 cursor-pointer ${currentTask?.id === task.id ? 'border-white/30' : ''}`}
                >
                  <div onClick={() => setCurrentTask(task)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs">
                        {task.images.length} images
                      </span>
                    </div>

                    {task.status === 'running' && (
                      <div className="mt-2">
                        <ProgressBar progress={task.progress} />
                        <p className="text-white/40 text-xs mt-1 text-right">{task.progress}%</p>
                      </div>
                    )}

                    {task.status === 'completed' && (
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-green-400">
                          {task.results.length} successful
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const data = agentService.exportTaskResults(task.id);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `task-${task.id.slice(0, 8)}.json`;
                            a.click();
                          }}
                          className="text-white/40 hover:text-white flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Export
                        </button>
                      </div>
                    )}
                  </div>
                </GlowCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleStartAnalysis}
          disabled={batchQueue.length === 0 || isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-medium
                   hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <LoadingDots />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start {selectedMode === 'batch' ? 'Batch' : ''} Analysis
              {batchQueue.length > 0 && ` (${batchQueue.length})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
