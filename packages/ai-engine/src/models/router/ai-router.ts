/**
 * AI Router and Orchestrator
 * 
 * Central coordination system for all AI operations with intelligent routing,
 * fallback handling, response aggregation, and query optimization.
 */

import {
  AIProvider,
  ProviderResponse,
  QueryOptions,
  CapabilityType,
  StreamingAIProvider,
  StreamResponse
} from '../interfaces/ai-provider.js';
import { 
  ProviderRegistry, 
  ProviderSelectionCriteria 
} from '../registry/provider-registry.js';

export enum QueryType {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  CONVERSATION = 'conversation',
  SUMMARIZATION = 'summarization',
  TRANSLATION = 'translation',
  ANALYSIS = 'analysis',
  CREATIVE_WRITING = 'creative_writing',
  QUESTION_ANSWERING = 'question_answering'
}

export interface ModelRequirements {
  capabilities: CapabilityType[];
  maxLatency?: number;
  maxCost?: number;
  requiresStreaming?: boolean;
  qualityLevel: 'basic' | 'standard' | 'premium';
  privacyLevel: 'public' | 'private' | 'confidential';
}

export interface UserPreferences {
  preferredProviders?: string[];
  avoidProviders?: string[];
  costSensitive?: boolean;
  speedPriority?: boolean;
  qualityPriority?: boolean;
  privacyFirst?: boolean;
}

export interface BrowserContext {
  activeTab?: {
    url: string;
    title: string;
    content?: string;
  };
  relatedTabs?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
  userActivity?: {
    lastAction: string;
    timestamp: Date;
  };
  temporalContext?: {
    timeOfDay: string;
    sessionDuration: number;
  };
}

export interface Source {
  type: 'web' | 'tab' | 'history' | 'knowledge';
  url?: string;
  title?: string;
  snippet?: string;
  confidence: number;
}

export interface ResponseMetadata {
  providersUsed: string[];
  totalProcessingTime: number;
  fallbacksTriggered: number;
  cacheHit: boolean;
  costIncurred: number;
  qualityScore: number;
}

export interface AIQuery {
  id: string;
  content: string;
  type: QueryType;
  context?: BrowserContext;
  requirements: ModelRequirements;
  userPreferences: UserPreferences;
  timestamp: Date;
}

export interface AIResponse {
  id: string;
  content: string;
  confidence: number;
  sources: Source[];
  metadata: ResponseMetadata;
  processingTime: number;
  cached: boolean;
}

/**
 * AI Router - Central orchestrator for all AI operations
 */
export class AIRouter {
  private providerRegistry: ProviderRegistry;
  private fallbackHistory = new Map<string, { count: number; lastAttempt: Date }>();
  private queryHistory: AIQuery[] = [];
  private readonly maxHistorySize = 1000;

  constructor(providerRegistry: ProviderRegistry) {
    this.providerRegistry = providerRegistry;
  }

  /**
   * Process an AI query with intelligent routing and fallback
   */
  async processQuery(query: string, options: QueryOptions = {}): Promise<ProviderResponse> {
    const startTime = Date.now();
    
    try {
      // Create AIQuery object from string
      const aiQuery = this.createAIQuery(query, options);
      
      // Store query in history
      this.addToHistory(aiQuery);

      // Analyze query and determine selection criteria
      const criteria = await this.analyzeQuery(aiQuery);

      // Select primary provider
      const provider = await this.providerRegistry.selectProvider(criteria);
      if (!provider) {
        throw new Error('No suitable AI provider available for query');
      }

      // Attempt primary provider
      try {
        const response = await this.executeQuery(provider, aiQuery);
        return this.createProviderResponse(
          aiQuery,
          response,
          [provider.name],
          startTime,
          false
        );
      } catch (error) {
        // Primary provider failed, try fallback
        return await this.handleFallback(provider.name, aiQuery, startTime, error as Error);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create AIQuery object from string query
   */
  private createAIQuery(query: string, options: QueryOptions = {}): AIQuery {
    return {
      id: this.generateQueryId(),
      content: query,
      type: this.inferQueryType(query),
      requirements: {
        capabilities: [CapabilityType.TEXT_GENERATION],
        qualityLevel: 'standard',
        privacyLevel: 'public',
        requiresStreaming: options.stream || false
      },
      userPreferences: {
        costSensitive: false,
        speedPriority: false,
        qualityPriority: false
      },
      timestamp: new Date()
    };
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Infer query type from content
   */
  private inferQueryType(query: string): QueryType {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('code') || lowerQuery.includes('function') || lowerQuery.includes('class')) {
      return QueryType.CODE_GENERATION;
    }
    if (lowerQuery.includes('summarize') || lowerQuery.includes('summary')) {
      return QueryType.SUMMARIZATION;
    }
    if (lowerQuery.includes('translate')) {
      return QueryType.TRANSLATION;
    }
    if (lowerQuery.includes('analyze') || lowerQuery.includes('analysis')) {
      return QueryType.ANALYSIS;
    }
    if (lowerQuery.includes('write') || lowerQuery.includes('create')) {
      return QueryType.CREATIVE_WRITING;
    }
    if (lowerQuery.includes('?') || lowerQuery.includes('what') || lowerQuery.includes('how')) {
      return QueryType.QUESTION_ANSWERING;
    }
    
    return QueryType.TEXT_GENERATION;
  }

  /**
   * Process streaming query
   */
  async* processStreamingQuery(
    query: string,
    options: QueryOptions = {}
  ): AsyncIterable<{ delta: string; complete?: ProviderResponse }> {
    const aiQuery = this.createAIQuery(query, { ...options, stream: true });
    
    try {
      const criteria = await this.analyzeQuery(aiQuery);
      criteria.requiresStreaming = true;

      const provider = await this.providerRegistry.selectProvider(criteria);
      if (!provider) {
        throw new Error('No suitable streaming AI provider available');
      }

      const streamingProvider = provider as StreamingAIProvider;
      if (!('sendStreamingQuery' in streamingProvider)) {
        throw new Error('Selected provider does not support streaming');
      }

      let fullContent = '';
      const startTime = Date.now();

      try {
        for await (const chunk of streamingProvider.sendStreamingQuery(query, options)) {
          fullContent += chunk.delta;
          yield { delta: chunk.delta };
        }

        // Create final response
        const finalResponse = this.createProviderResponse(
          aiQuery,
          { content: fullContent, model: provider.name },
          [provider.name],
          startTime,
          false
        );

        yield { delta: '', complete: finalResponse };
      } catch (error) {
        throw new Error(`Streaming failed: ${(error as Error).message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute query with specific provider
   */
  private async executeQuery(
    provider: AIProvider,
    query: AIQuery
  ): Promise<{ content: string; model: string }> {
    try {
      const response = await provider.sendQuery(query.content, {
        stream: false
      });

      return {
        content: response.content,
        model: provider.name
      };
    } catch (error) {
      throw new Error(`Provider ${provider.name} failed: ${(error as Error).message}`);
    }
  }

  /**
   * Handle fallback when primary provider fails
   */
  private async handleFallback(
    failedProvider: string,
    query: AIQuery,
    startTime: number,
    error: Error
  ): Promise<ProviderResponse> {
    // Record fallback attempt
    const fallbackRecord = this.fallbackHistory.get(failedProvider) || { count: 0, lastAttempt: new Date() };
    fallbackRecord.count++;
    fallbackRecord.lastAttempt = new Date();
    this.fallbackHistory.set(failedProvider, fallbackRecord);

    // Get fallback provider
    const criteria = await this.analyzeQuery(query);
    const fallbackProvider = await this.providerRegistry.selectProvider(criteria);

    if (!fallbackProvider || fallbackProvider.name === failedProvider) {
      throw new Error(`No fallback providers available after ${failedProvider} failed: ${error.message}`);
    }

    try {
      const response = await this.executeQuery(fallbackProvider, query);
      return this.createProviderResponse(
        query,
        response,
        [failedProvider, fallbackProvider.name],
        startTime,
        false,
        1
      );
    } catch (fallbackError) {
      throw new Error(`Both primary (${failedProvider}) and fallback (${fallbackProvider.name}) providers failed`);
    }
  }

  /**
   * Create ProviderResponse from AI response
   */
  private createProviderResponse(
    query: AIQuery,
    response: { content: string; model: string },
    providersUsed: string[],
    startTime: number,
    cached: boolean,
    fallbacksTriggered: number = 0
  ): ProviderResponse {
    const processingTime = Date.now() - startTime;

    return {
      content: response.content,
      usage: {
        promptTokens: this.estimateTokens(query.content),
        completionTokens: this.estimateTokens(response.content),
        totalTokens: this.estimateTokens(query.content) + this.estimateTokens(response.content)
      },
      metadata: {
        model: response.model,
        provider: providersUsed[providersUsed.length - 1],
        timestamp: new Date(),
        processingTime
      }
    };
  }

  /**
   * Estimate token count (simplified)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate estimated cost
   */
  private calculateCost(content: string): number {
    const tokens = this.estimateTokens(content);
    return tokens * 0.00001; // Simplified cost calculation
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(content: string): number {
    if (content.length < 10) return 0.3;
    if (content.length < 100) return 0.7;
    return 0.9;
  }

  /**
   * Analyze query to determine provider selection criteria
   */
  private async analyzeQuery(query: AIQuery): Promise<ProviderSelectionCriteria> {
    return {
      requiredCapabilities: query.requirements.capabilities,
      maxLatency: query.requirements.maxLatency || 30000,
      maxCost: query.requirements.maxCost || 1.0,
      requiresStreaming: query.requirements.requiresStreaming || false,
      priority: query.userPreferences.speedPriority ? 'speed' : 
                query.userPreferences.qualityPriority ? 'quality' :
                query.userPreferences.costSensitive ? 'cost' : 'availability'
    };
  }

  /**
   * Add query to history
   */
  private addToHistory(query: AIQuery): void {
    this.queryHistory.push(query);
    
    // Maintain history size limit
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get query history
   */
  getQueryHistory(): AIQuery[] {
    return [...this.queryHistory];
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.queryHistory = [];
  }

  /**
   * Get fallback statistics
   */
  getFallbackStats(): Map<string, { count: number; lastAttempt: Date }> {
    return new Map(this.fallbackHistory);
  }

  /**
   * Reset fallback history
   */
  resetFallbackHistory(): void {
    this.fallbackHistory.clear();
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalQueries: number;
    fallbackCount: number;
    averageProcessingTime: number;
    providerUsage: Record<string, number>;
  } {
    const totalQueries = this.queryHistory.length;
    const fallbackCount = Array.from(this.fallbackHistory.values())
      .reduce((sum, record) => sum + record.count, 0);
    
    return {
      totalQueries,
      fallbackCount,
      averageProcessingTime: 0, // Simplified for now
      providerUsage: {} // Simplified for now
    };
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    this.clearHistory();
    this.resetFallbackHistory();
  }
}
