/**
 * Core AI Provider Interface
 * 
 * Standardized interface for all AI model providers in Project Aura.
 * This interface ensures consistent behavior across different AI models
 * while allowing for provider-specific optimizations.
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderMetadata {
  model: string;
  provider: string;
  version?: string;
  requestId?: string;
  timestamp: Date;
  processingTime: number;
}

export interface ProviderResponse {
  content: string;
  usage: TokenUsage;
  metadata: ProviderMetadata;
  confidence?: number;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'function_call';
}

export interface QueryOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  timeout?: number;
  retries?: number;
}

export enum CapabilityType {
  TEXT_GENERATION = 'text_generation',
  TEXT_COMPLETION = 'text_completion',
  CODE_GENERATION = 'code_generation',
  CONVERSATION = 'conversation',
  FUNCTION_CALLING = 'function_calling',
  MULTIMODAL = 'multimodal',
  EMBEDDING = 'embedding',
  FINE_TUNING = 'fine_tuning'
}

export interface ModelCapability {
  type: CapabilityType;
  maxTokens: number;
  supportedFormats: string[];
  specializations: string[];
  costPerToken?: number;
  averageLatency?: number;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface ProviderStatus {
  isAvailable: boolean;
  lastChecked: Date;
  latency: number;
  errorRate: number;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

/**
 * Provider Events Interface
 */
export interface ProviderEvents {
  'status-change': (status: ProviderStatus) => void;
  'rate-limit': (resetTime: Date) => void;
  'error': (error: Error) => void;
  'response': (response: ProviderResponse) => void;
}

/**
 * Core AI Provider Interface
 * 
 * All AI model providers must implement this interface to ensure
 * consistent behavior and enable intelligent routing and fallback.
 */
export interface AIProvider {
  /** Unique identifier for this provider */
  readonly name: string;
  
  /** Human-readable display name */
  readonly displayName: string;
  
  /** Provider capabilities and specifications */
  readonly capabilities: ModelCapability[];
  
  /** Current provider configuration */
  readonly config: ProviderConfig;
  
  /**
   * Send a query to the AI model
   * @param query The text query to process
   * @param options Optional query parameters
   * @returns Promise resolving to the provider response
   */
  sendQuery(query: string, options?: QueryOptions): Promise<ProviderResponse>;
  
  /**
   * Check if the provider is currently available
   * @returns Promise resolving to availability status
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get detailed provider status information
   * @returns Promise resolving to current status
   */
  getStatus(): Promise<ProviderStatus>;
  
  /**
   * Calculate estimated cost for a query
   * @param query The query text
   * @param options Query options that may affect cost
   * @returns Estimated cost in USD
   */
  estimateCost(query: string, options?: QueryOptions): Promise<number>;
  
  /**
   * Get current latency metrics
   * @returns Average response time in milliseconds
   */
  getLatency(): Promise<number>;
  
  /**
   * Authenticate with the provider
   * @returns Promise resolving to authentication success
   */
  authenticate(): Promise<boolean>;
  
  /**
   * Validate provider configuration
   * @returns Promise resolving to validation result
   */
  validateConfig(): Promise<{ valid: boolean; errors?: string[] }>;
  
  /**
   * Update provider configuration
   * @param config New configuration to apply
   */
  updateConfig(config: Partial<ProviderConfig>): Promise<void>;
  
  /**
   * Clean up resources and connections
   */
  dispose(): Promise<void>;
}

/**
 * Stream response interface for real-time processing
 */
export interface StreamResponse {
  content: string;
  delta: string;
  done: boolean;
  usage?: Partial<TokenUsage>;
}

/**
 * Extended interface for providers that support streaming
 */
export interface StreamingAIProvider extends AIProvider {
  /**
   * Send a streaming query to the AI model
   * @param query The text query to process
   * @param options Optional query parameters
   * @returns AsyncIterable of stream responses
   */
  sendStreamingQuery(
    query: string, 
    options?: QueryOptions
  ): AsyncIterable<StreamResponse>;
}

/**
 * Provider registration information
 */
export interface ProviderRegistration {
  provider: AIProvider;
  priority: number;
  enabled: boolean;
  fallbackFor?: string[];
  tags?: string[];
}