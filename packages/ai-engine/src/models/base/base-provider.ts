/**
 * Abstract Base Provider Class
 * 
 * Provides common functionality and patterns for all AI provider implementations.
 * Handles authentication, rate limiting, error handling, and metrics collection.
 */

import { EventEmitter } from 'events';
import {
  AIProvider,
  ProviderConfig,
  ProviderStatus,
  ModelCapability,
  QueryOptions,
  ProviderResponse,
  TokenUsage,
  ProviderMetadata,
  ProviderEvents
} from '../interfaces/ai-provider.js';

export abstract class BaseAIProvider extends EventEmitter implements AIProvider {
  protected _config: ProviderConfig;
  protected _status: ProviderStatus;
  protected _metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalLatency: number;
    lastRequestTime?: Date;
  };

  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly capabilities: ModelCapability[],
    config: ProviderConfig
  ) {
    super();
    this._config = { ...config };
    this._status = {
      isAvailable: false,
      lastChecked: new Date(),
      latency: 0,
      errorRate: 0
    };
    this._metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatency: 0
    };
  }

  get config(): ProviderConfig {
    return { ...this._config };
  }

  /**
   * Abstract method for sending queries - must be implemented by subclasses
   */
  abstract sendQuery(query: string, options?: QueryOptions): Promise<ProviderResponse>;

  /**
   * Abstract method for authentication - must be implemented by subclasses
   */
  abstract authenticate(): Promise<boolean>;

  /**
   * Check provider availability with caching
   */
  async isAvailable(): Promise<boolean> {
    const now = new Date();
    const cacheAge = now.getTime() - this._status.lastChecked.getTime();
    
    // Cache availability check for 30 seconds
    if (cacheAge < 30000) {
      return this._status.isAvailable;
    }

    try {
      const available = await this.checkAvailability();
      this._status = {
        ...this._status,
        isAvailable: available,
        lastChecked: now
      };
      
      this.emit('status-change', this._status);
      return available;
    } catch (error) {
      this._status = {
        ...this._status,
        isAvailable: false,
        lastChecked: now
      };
      
      this.emit('error', error as Error);
      return false;
    }
  }

  /**
   * Get current provider status
   */
  async getStatus(): Promise<ProviderStatus> {
    await this.isAvailable(); // Refresh status
    return { ...this._status };
  }

  /**
   * Estimate cost for a query (default implementation)
   */
  async estimateCost(query: string, options?: QueryOptions): Promise<number> {
    const tokenCount = this.estimateTokenCount(query);
    const capability = this.capabilities.find(cap => cap.costPerToken);
    
    if (!capability?.costPerToken) {
      return 0; // No cost information available
    }

    const maxTokens = options?.maxTokens || capability.maxTokens;
    const totalTokens = tokenCount + maxTokens;
    
    return totalTokens * capability.costPerToken;
  }

  /**
   * Get current latency metrics
   */
  async getLatency(): Promise<number> {
    if (this._metrics.totalRequests === 0) {
      return 0;
    }
    
    return this._metrics.totalLatency / this._metrics.totalRequests;
  }

  /**
   * Validate provider configuration
   */
  async validateConfig(): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!this._config.apiKey) {
      errors.push('API key is required');
    }

    if (this._config.timeout && this._config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }

    if (this._config.retries && (this._config.retries < 0 || this._config.retries > 10)) {
      errors.push('Retries must be between 0 and 10');
    }

    // Test authentication if config seems valid
    if (errors.length === 0) {
      try {
        const authResult = await this.authenticate();
        if (!authResult) {
          errors.push('Authentication failed with provided credentials');
        }
      } catch (error) {
        errors.push(`Authentication error: ${(error as Error).message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Update provider configuration
   */
  async updateConfig(config: Partial<ProviderConfig>): Promise<void> {
    this._config = { ...this._config, ...config };
    
    // Re-validate after config update
    const validation = await this.validateConfig();
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors?.join(', ')}`);
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.removeAllListeners();
  }

  /**
   * Protected helper methods for subclasses
   */

  /**
   * Record request metrics
   */
  protected recordRequest(startTime: Date, success: boolean): void {
    const endTime = new Date();
    const latency = endTime.getTime() - startTime.getTime();

    this._metrics.totalRequests++;
    this._metrics.totalLatency += latency;
    this._metrics.lastRequestTime = endTime;

    if (success) {
      this._metrics.successfulRequests++;
    } else {
      this._metrics.failedRequests++;
    }

    // Update error rate
    this._status.errorRate = this._metrics.failedRequests / this._metrics.totalRequests;
    this._status.latency = this._metrics.totalLatency / this._metrics.totalRequests;
  }

  /**
   * Handle rate limiting
   */
  protected handleRateLimit(resetTime?: Date): void {
    this._status.rateLimitReset = resetTime;
    this._status.rateLimitRemaining = 0;
    this.emit('rate-limit', resetTime || new Date(Date.now() + 60000));
  }

  /**
   * Create standardized response metadata
   */
  protected createMetadata(
    model: string,
    requestId?: string,
    processingTime?: number
  ): ProviderMetadata {
    return {
      model,
      provider: this.name,
      requestId,
      timestamp: new Date(),
      processingTime: processingTime || 0
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  protected estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Apply retry logic with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this._config.retries || 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Abstract method for checking availability - must be implemented by subclasses
   */
  protected abstract checkAvailability(): Promise<boolean>;

  /**
   * Validate query options
   */
  protected validateQueryOptions(options?: QueryOptions): void {
    if (!options) return;

    if (options.temperature !== undefined) {
      if (options.temperature < 0 || options.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
      }
    }

    if (options.maxTokens !== undefined) {
      if (options.maxTokens < 1) {
        throw new Error('Max tokens must be at least 1');
      }
    }

    if (options.topP !== undefined) {
      if (options.topP < 0 || options.topP > 1) {
        throw new Error('Top P must be between 0 and 1');
      }
    }
  }
}