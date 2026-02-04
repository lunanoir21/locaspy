import { create } from 'zustand';
import { agentService, type AgentTask, type AnalysisMode, type BatchAnalysisConfig } from '@/services/agentService';

interface AgentState {
  tasks: AgentTask[];
  currentTask: AgentTask | null;
  isProcessing: boolean;
  selectedMode: AnalysisMode;
  batchQueue: string[];
  
  // Actions
  setSelectedMode: (mode: AnalysisMode) => void;
  addToBatchQueue: (imageBase64: string) => void;
  removeFromBatchQueue: (index: number) => void;
  clearBatchQueue: () => void;
  createTask: (type: AnalysisMode, images?: string[]) => AgentTask;
  executeTask: (taskId: string, config: BatchAnalysisConfig) => Promise<void>;
  cancelTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  refreshTasks: () => void;
  setCurrentTask: (task: AgentTask | null) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isProcessing: false,
  selectedMode: 'single',
  batchQueue: [],

  setSelectedMode: (mode: AnalysisMode) => {
    set({ selectedMode: mode });
  },

  addToBatchQueue: (imageBase64: string) => {
    set(state => ({ batchQueue: [...state.batchQueue, imageBase64] }));
  },

  removeFromBatchQueue: (index: number) => {
    set(state => ({
      batchQueue: state.batchQueue.filter((_, i) => i !== index)
    }));
  },

  clearBatchQueue: () => {
    set({ batchQueue: [] });
  },

  createTask: (type: AnalysisMode, images?: string[]) => {
    const { batchQueue } = get();
    const imagesToUse = images || batchQueue;
    
    if (imagesToUse.length === 0) {
      throw new Error('No images to analyze');
    }

    const task = agentService.createTask(type, imagesToUse);
    set(state => ({ 
      tasks: [task, ...state.tasks],
      currentTask: task,
      batchQueue: images ? state.batchQueue : [] // Clear queue if using it
    }));
    return task;
  },

  executeTask: async (taskId: string, config: BatchAnalysisConfig) => {
    set({ isProcessing: true });
    
    try {
      await agentService.executeBatchAnalysis(taskId, config, () => {
        // Progress updates are handled by the service's subscription
      });
    } finally {
      set({ isProcessing: false });
    }
  },

  cancelTask: (taskId: string) => {
    agentService.cancelTask(taskId);
    set({ isProcessing: false });
  },

  clearCompletedTasks: () => {
    agentService.clearCompletedTasks();
    set(state => ({
      tasks: state.tasks.filter(t => t.status === 'pending' || t.status === 'running')
    }));
  },

  refreshTasks: () => {
    const tasks = agentService.getTasks();
    set({ tasks });
  },

  setCurrentTask: (task: AgentTask | null) => {
    set({ currentTask: task });
  }
}));

// Subscribe to agent service updates
agentService.subscribe((tasks) => {
  useAgentStore.setState({ tasks });
});
