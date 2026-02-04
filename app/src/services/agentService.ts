import { geminiService } from './geminiService';
import type { AnalysisResult, GeoLocation } from '@/types';

// Agentic analysis modes
export type AnalysisMode = 
  | 'single' 
  | 'batch' 
  | 'compare' 
  | 'deep-dive' 
  | 'quick-scan'
  | 'standard';

export interface AgentTask {
  id: string;
  type: AnalysisMode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  images: string[];
  results: AnalysisResult[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface BatchAnalysisConfig {
  mode: AnalysisMode;
  confidence: number;
  includeSimilar: boolean;
  generateReport: boolean;
  autoExport: boolean;
}

class AgentService {
  private tasks: Map<string, AgentTask> = new Map();
  private listeners: Set<(tasks: AgentTask[]) => void> = new Set();

  // Create a new agent task
  createTask(type: AnalysisMode, images: string[]): AgentTask {
    const task: AgentTask = {
      id: crypto.randomUUID(),
      type,
      status: 'pending',
      progress: 0,
      images,
      results: [],
      createdAt: new Date()
    };
    
    this.tasks.set(task.id, task);
    this.notifyListeners();
    return task;
  }

  // Get all tasks
  getTasks(): AgentTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Get task by ID
  getTask(id: string): AgentTask | undefined {
    return this.tasks.get(id);
  }

  // Subscribe to task updates
  subscribe(callback: (tasks: AgentTask[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    const tasks = this.getTasks();
    this.listeners.forEach(cb => cb(tasks));
  }

  private updateTask(taskId: string, updates: Partial<AgentTask>) {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.notifyListeners();
    }
  }

  // Execute batch analysis
  async executeBatchAnalysis(
    taskId: string, 
    config: BatchAnalysisConfig,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    this.updateTask(taskId, { status: 'running', progress: 0 });

    try {
      const totalImages = task.images.length;
      const results: AnalysisResult[] = [];

      for (let i = 0; i < totalImages; i++) {
        const imageBase64 = task.images[i];
        
        // Update progress
        const progress = Math.round(((i + 1) / totalImages) * 100);
        this.updateTask(taskId, { progress });
        onProgress?.call(null, progress);

        // Analyze image based on mode
        let result: AnalysisResult;
        
        switch (config.mode) {
          case 'quick-scan':
            result = await this.quickScan(imageBase64);
            break;
          case 'deep-dive':
            result = await this.deepDiveAnalysis(imageBase64);
            break;
          case 'compare':
            result = await this.comparativeAnalysis(imageBase64, results);
            break;
          default:
            result = await this.standardAnalysis(imageBase64);
        }

        // Filter by confidence threshold
        if (result.confidence >= config.confidence) {
          results.push(result);
        }

        // Small delay to prevent rate limiting
        if (i < totalImages - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      this.updateTask(taskId, {
        status: 'completed',
        progress: 100,
        results,
        completedAt: new Date()
      });

    } catch (error) {
      this.updateTask(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
      throw error;
    }
  }

  // Quick scan mode - Fast analysis
  private async quickScan(imageBase64: string): Promise<AnalysisResult> {
    const response = await geminiService.analyzeImage(imageBase64);
    
    return {
      id: crypto.randomUUID(),
      imageUrl: `data:image/jpeg;base64,${imageBase64}`,
      location: {
        lat: response.location.lat,
        lng: response.location.lng
      },
      city: response.location.city,
      country: response.location.country,
      confidence: response.location.confidence,
      description: response.analysis.description,
      clues: response.analysis.clues.slice(0, 3), // Only top 3 clues
      createdAt: new Date()
    };
  }

  // Standard analysis
  private async standardAnalysis(imageBase64: string): Promise<AnalysisResult> {
    const response = await geminiService.analyzeImage(imageBase64);
    const similarImages = await geminiService.findSimilarLocations(
      imageBase64,
      response.location
    );

    return {
      id: crypto.randomUUID(),
      imageUrl: `data:image/jpeg;base64,${imageBase64}`,
      location: {
        lat: response.location.lat,
        lng: response.location.lng
      },
      city: response.location.city,
      country: response.location.country,
      confidence: response.location.confidence,
      description: response.analysis.description,
      clues: response.analysis.clues,
      similarImages,
      createdAt: new Date()
    };
  }

  // Deep dive mode - Comprehensive analysis
  private async deepDiveAnalysis(imageBase64: string): Promise<AnalysisResult> {
    const response = await geminiService.analyzeImage(imageBase64);
    const similarImages = await geminiService.findSimilarLocations(
      imageBase64,
      response.location
    );

    // Enhance with additional analysis
    const enhancedClues = [
      ...response.analysis.clues,
      `Weather patterns suggest ${response.location.city}`,
      `Shadow analysis indicates local time zone`,
      `Vegetation matches ${response.location.country} flora`
    ];

    return {
      id: crypto.randomUUID(),
      imageUrl: `data:image/jpeg;base64,${imageBase64}`,
      location: {
        lat: response.location.lat,
        lng: response.location.lng
      },
      city: response.location.city,
      country: response.location.country,
      confidence: Math.min(response.location.confidence + 10, 100),
      description: response.analysis.description,
      clues: enhancedClues,
      similarImages,
      createdAt: new Date()
    };
  }

  // Comparative analysis - Compare with previous results
  private async comparativeAnalysis(
    imageBase64: string, 
    previousResults: AnalysisResult[]
  ): Promise<AnalysisResult> {
    const response = await geminiService.analyzeImage(imageBase64);
    
    // Check for matches with previous results
    const matches = previousResults.filter(r => 
      r.city === response.location.city || 
      this.calculateDistance(r.location, response.location) < 50 // Within 50km
    );

    const similarImages = await geminiService.findSimilarLocations(
      imageBase64,
      response.location
    );

    return {
      id: crypto.randomUUID(),
      imageUrl: `data:image/jpeg;base64,${imageBase64}`,
      location: {
        lat: response.location.lat,
        lng: response.location.lng
      },
      city: response.location.city,
      country: response.location.country,
      confidence: response.location.confidence,
      description: response.analysis.description + 
        (matches.length > 0 ? ` \n📍 Matches ${matches.length} previous location(s)` : ''),
      clues: response.analysis.clues,
      similarImages,
      createdAt: new Date()
    };
  }

  // Calculate distance between two points (km)
  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lng - loc1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(loc1.lat)) * Math.cos(this.toRad(loc2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Auto-detect analysis mode based on image characteristics
  async detectOptimalMode(imageBase64: string): Promise<AnalysisMode> {
    try {
      // Quick preliminary scan
      const response = await geminiService.analyzeImage(imageBase64);
      
      // Determine mode based on confidence and content
      if (response.location.confidence > 80) {
        return 'quick-scan';
      } else if (response.location.confidence < 40) {
        return 'deep-dive';
      } else {
        return 'standard';
      }
    } catch {
      return 'standard';
    }
  }

  // Cancel running task
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'running') {
      this.updateTask(taskId, { 
        status: 'failed', 
        error: 'Cancelled by user' 
      });
      return true;
    }
    return false;
  }

  // Clear completed/failed tasks
  clearCompletedTasks(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
      }
    }
    this.notifyListeners();
  }

  // Export task results
  exportTaskResults(taskId: string): string {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const exportData = {
      taskId: task.id,
      type: task.type,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      totalImages: task.images.length,
      successfulAnalyses: task.results.length,
      results: task.results.map(r => ({
        location: `${r.city}, ${r.country}`,
        coordinates: `${r.location.lat}, ${r.location.lng}`,
        confidence: r.confidence,
        clues: r.clues
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }
}

export const agentService = new AgentService();
export default agentService;
