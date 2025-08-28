/**
 * Cache Manager Interface for AI Engine Foundation
 * Provides semantic response caching with vector similarity matching
 */

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  cacheSize: number;
  memoryUsage: number;
}

export interface CachedResponse {
  response: AIResponse;
  timestamp: Date;
  hitCount: number;
  lastAccessed: Date;
  semanticKey: string;
  embedding: number[];
  ttl?: number;
}

export interface CacheKey {
  queryHash: string;
  semanticHash: string;
  contextHash?: string;
  userHash?: string;
}

export interface OptimizationReport {
  recommendedActions: string[];
  performanceMetrics: CacheStats;
  memoryOptimization: {
    currentUsage: number;
    recommendedLimit: number;
    itemsToEvict: number;
  };
  hitRateAnalysis: {
    currentRate: number;
    targetRate: number;
    improvementSuggestions: string[];
  };
}

export interface ResponseCache {
  get(key: string): Promise<CachedResponse | null>;
  set(key: string, response: AIResponse, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  getStats(): Promise<CacheStats>;
  optimize(): Promise<OptimizationReport>;
  
  // Semantic similarity methods
  findSimilar(queryEmbedding: number[], threshold?: number): Promise<CachedResponse[]>;
  generateSemanticKey(query: string, context?: any): Promise<string>;
  
  // Cache management
  clear(): Promise<void>;
  evictExpired(): Promise<number>;
  warmCache(queries: string[]): Promise<void>;
}

export interface AIResponse {
  content: string;
  confidence: number;
  sources: Source[];
  metadata: ResponseMetadata;
  processingTime: number;
}

export interface Source {
  url?: string;
  title?: string;
  type: 'web' | 'document' | 'context' | 'knowledge';
  relevance: number;
}

export interface ResponseMetadata {
  model: string;
  provider: string;
  tokens: number;
  cost: number;
  timestamp: Date;
  queryType: string;
}