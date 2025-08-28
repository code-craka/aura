/**
 * Local AI Model Provider
 * 
 * Provides local AI processing capabilities using WebAssembly for privacy-sensitive
 * operations and offline functionality. Supports model download, management, and
 * optimized local inference.
 */

import { BaseAIProvider } from '../base/base-provider.js';
import {
  ProviderConfig,
  ProviderResponse,
  QueryOptions,
  ModelCapability,
  CapabilityType,
  TokenUsage,
  StreamingAIProvider,
  StreamResponse
} from '../interfaces/ai-provider.js';
import { LocalModelManager } from './local/model-manager.js';
import { WebAssemblyEngine } from './local/wasm-engine.js';
import { OfflineCapabilityDetector } from './local/offline-detector.js';
import { LocalModelOptimizer } from './local/performance-optimizer.js';

export interface LocalModelConfig extends ProviderConfig {
  modelPath?: string;
  modelName: string;
  maxMemoryUsage?: number; // MB
  enableGPUAcceleration?: boolean;
  cacheSize?: number; // MB
  quantization?: 'int8' | 'int4' | 'fp16' | 'fp32';
  threads?: number;
}

export interface LocalModelInfo {
  name: string;
  size: number; // bytes
  version: string;
  capabilities: CapabilityType[];
  quantization: string;
  downloadUrl: string;
  checksum: string;
  isDownloaded: boolean;
  isLoaded: boolean;
}

/**
 * Local AI Provider for on-device model execution
 */
export class LocalAIProvider extends BaseAIProvider implements StreamingAIProvider {
  private modelManager: LocalModelManager;
  private wasmEngine: WebAssemblyEngine;
  private offlineDetector: OfflineCapabilityDetector;
  private optimizer: LocalModelOptimizer;
  private currentModel?: LocalModelInfo;
  private isModelLoaded: boolean = false;

  constructor(config: LocalModelConfig) {
    const capabilities: ModelCapability[] = [
      {
        type: CapabilityType.TEXT_GENERATION,
        maxTokens: 4096,
        supportedFormats: ['text/plain'],
        specializations: ['privacy-safe', 'offline'],
        costPerToken: 0, // No cost for local processing
        averageLatency: 500 // Estimated local processing latency
      },
      {
        type: CapabilityType.TEXT_COMPLETION,
        maxTokens: 2048,
        supportedFormats: ['text/plain'],
        specializations: ['privacy-safe', 'offline'],
        costPerToken: 0,
        averageLatency: 300
      },
      {
        type: CapabilityType.CONVERSATION,
        maxTokens: 4096,
        supportedFormats: ['text/plain'],
        specializations: ['privacy-safe', 'offline'],
        costPerToken: 0,
        averageLatency: 600
      }
    ];

    super('local-ai', 'Local AI Model', capabilities, config);

    this.modelManager = new LocalModelManager();
    this.wasmEngine = new WebAssemblyEngine();
    this.offlineDetector = new OfflineCapabilityDetector();
    this.optimizer = new LocalModelOptimizer();
  }

  /**
   * Initialize the local AI provider
   */
  async initialize(): Promise<void> {
    try {
      // Initialize WebAssembly engine
      await this.wasmEngine.initialize();

      // Check for available models
      const config = this._config as LocalModelConfig;
      if (config.modelName) {
        await this.loadModel(config.modelName);
      }

      // Start offline capability monitoring
      this.offlineDetector.startMonitoring();
      
      this._status.isAvailable = true;
    } catch (error) {
      this._status.isAvailable = false;
      throw new Error(`Failed to initialize local AI provider: ${(error as Error).message}`);
    }
  }

  /**
   * Send query to local AI model
   */
  async sendQuery(query: string, options?: QueryOptions): Promise<ProviderResponse> {
    const startTime = new Date();
    
    try {
      this.validateQueryOptions(options);
      
      if (!this.isModelLoaded || !this.currentModel) {
        throw new Error('No model loaded for local processing');
      }

      // Check if we're offline and need to use local processing
      const isOffline = await this.offlineDetector.isOffline();
      if (!isOffline && !this.shouldUseLocalProcessing(query)) {
        throw new Error('Local processing not required for this query');
      }

      // Optimize query for local processing
      const optimizedOptions = await this.optimizer.optimizeQuery(query, options);

      // Process query through WebAssembly engine
      const result = await this.wasmEngine.processQuery(
        query,
        this.currentModel,
        optimizedOptions
      );

      const response: ProviderResponse = {
        content: result.content,
        usage: result.usage,
        metadata: this.createMetadata(
          this.currentModel.name,
          `local-${Date.now()}`,
          Date.now() - startTime.getTime()
        ),
        confidence: result.confidence,
        finishReason: result.finishReason
      };

      this.recordRequest(startTime, true);
      this.emit('response', response);

      return response;
    } catch (error) {
      this.recordRequest(startTime, false);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Send streaming query to local AI model
   */
  async* sendStreamingQuery(
    query: string,
    options?: QueryOptions
  ): AsyncIterable<StreamResponse> {
    if (!this.isModelLoaded || !this.currentModel) {
      throw new Error('No model loaded for local processing');
    }

    this.validateQueryOptions(options);

    // Optimize query for streaming
    const optimizedOptions = await this.optimizer.optimizeQuery(query, {
      ...options,
      stream: true
    });

    // Stream results from WebAssembly engine
    for await (const chunk of this.wasmEngine.processStreamingQuery(
      query,
      this.currentModel,
      optimizedOptions
    )) {
      yield {
        content: chunk.content,
        delta: chunk.delta,
        done: chunk.done,
        usage: chunk.usage
      };
    }
  }

  /**
   * Load a specific model for local processing
   */
  async loadModel(modelName: string): Promise<void> {
    try {
      // Check if model is already downloaded
      const modelInfo = await this.modelManager.getModelInfo(modelName);
      
      if (!modelInfo.isDownloaded) {
        await this.downloadModel(modelName);
      }

      // Load model into WebAssembly engine
      await this.wasmEngine.loadModel(modelInfo);
      
      this.currentModel = modelInfo;
      this.isModelLoaded = true;

      // Optimize model for current hardware
      await this.optimizer.optimizeModel(modelInfo);
      
    } catch (error) {
      this.isModelLoaded = false;
      throw new Error(`Failed to load model ${modelName}: ${(error as Error).message}`);
    }
  }

  /**
   * Download a model for local use
   */
  async downloadModel(modelName: string): Promise<void> {
    const modelInfo = await this.modelManager.getModelInfo(modelName);
    
    if (modelInfo.isDownloaded) {
      return; // Already downloaded
    }

    try {
      await this.modelManager.downloadModel(modelInfo, (progress) => {
        // Emit download progress events
        this.emit('download-progress', {
          modelName,
          progress,
          downloaded: progress.downloaded,
          total: progress.total
        });
      });
    } catch (error) {
      throw new Error(`Failed to download model ${modelName}: ${(error as Error).message}`);
    }
  }

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<LocalModelInfo[]> {
    return await this.modelManager.listAvailableModels();
  }

  /**
   * Get list of downloaded models
   */
  async getDownloadedModels(): Promise<LocalModelInfo[]> {
    return await this.modelManager.listDownloadedModels();
  }

  /**
   * Remove a downloaded model
   */
  async removeModel(modelName: string): Promise<void> {
    await this.modelManager.removeModel(modelName);
    
    if (this.currentModel?.name === modelName) {
      this.currentModel = undefined;
      this.isModelLoaded = false;
    }
  }

  /**
   * Check if local processing should be used for a query
   */
  private shouldUseLocalProcessing(query: string): boolean {
    // Use local processing for privacy-sensitive content
    const sensitivePatterns = [
      /password/i,
      /ssn|social security/i,
      /credit card|cc number/i,
      /personal information/i,
      /private/i,
      /confidential/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(query));
  }

  /**
   * Authenticate (always returns true for local provider)
   */
  async authenticate(): Promise<boolean> {
    return true; // No authentication needed for local processing
  }

  /**
   * Check availability of local processing
   */
  protected async checkAvailability(): Promise<boolean> {
    try {
      // Check if WebAssembly is supported
      if (!this.wasmEngine.isSupported()) {
        return false;
      }

      // Check if we have sufficient resources
      const hasResources = await this.optimizer.checkResourceAvailability();
      if (!hasResources) {
        return false;
      }

      // Check if at least one model is available
      const models = await this.modelManager.listDownloadedModels();
      return models.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current resource usage
   */
  async getResourceUsage(): Promise<{
    memoryUsage: number;
    cpuUsage: number;
    modelSize: number;
  }> {
    return await this.optimizer.getResourceUsage();
  }

  /**
   * Optimize performance settings
   */
  async optimizePerformance(): Promise<void> {
    if (this.currentModel) {
      await this.optimizer.optimizeModel(this.currentModel);
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    await this.wasmEngine.dispose();
    this.offlineDetector.stopMonitoring();
    await super.dispose();
  }
}