/**
 * OpenAI GPT Provider Implementation
 * 
 * Implements the AIProvider interface for OpenAI GPT models including GPT-4,
 * with comprehensive error handling, rate limiting, cost tracking, and streaming support.
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

export interface OpenAIConfig extends ProviderConfig {
  model?: string;
  organization?: string;
  projectId?: string;
  maxRetries?: number;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  }>;
}

/**
 * OpenAI Provider for GPT models
 */
export class OpenAIProvider extends BaseAIProvider implements StreamingAIProvider {
  private readonly baseUrl: string;
  private readonly apiVersion: string = '2024-02-15';
  private requestCount: number = 0;
  private rateLimitInfo: {
    requestsRemaining?: number;
    tokensRemaining?: number;
    resetTime?: Date;
  } = {};

  constructor(config: OpenAIConfig) {
    const capabilities: ModelCapability[] = [
      {
        type: CapabilityType.TEXT_GENERATION,
        maxTokens: 128000, // GPT-4 Turbo context length
        supportedFormats: ['text/plain', 'application/json'],
        specializations: ['reasoning', 'creativity', 'analysis'],
        costPerToken: 0.00001, // Approximate cost per token
        averageLatency: 2000
      },
      {
        type: CapabilityType.CONVERSATION,
        maxTokens: 128000,
        supportedFormats: ['text/plain'],
        specializations: ['multi-turn', 'context-aware'],
        costPerToken: 0.00001,
        averageLatency: 2500
      },
      {
        type: CapabilityType.CODE_GENERATION,
        maxTokens: 128000,
        supportedFormats: ['text/plain', 'text/code'],
        specializations: ['multiple-languages', 'debugging', 'optimization'],
        costPerToken: 0.00001,
        averageLatency: 3000
      },
      {
        type: CapabilityType.FUNCTION_CALLING,
        maxTokens: 128000,
        supportedFormats: ['application/json'],
        specializations: ['structured-output', 'tool-use'],
        costPerToken: 0.00001,
        averageLatency: 2000
      }
    ];

    super('openai-gpt', 'OpenAI GPT', capabilities, config);
    
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  /**
   * Send query to OpenAI API
   */
  async sendQuery(query: string, options?: QueryOptions): Promise<ProviderResponse> {
    const startTime = new Date();
    
    try {
      this.validateQueryOptions(options);
      await this.checkRateLimits();

      const config = this._config as OpenAIConfig;
      const requestBody = this.buildRequestBody(query, options, config);
      
      const response = await this.withRetry(async () => {
        return await this.makeRequest('/chat/completions', requestBody);
      });

      const openaiResponse = await response.json() as OpenAIResponse;
      
      if (!response.ok) {
        throw this.createErrorFromResponse(openaiResponse as unknown as OpenAIError);
      }

      this.updateRateLimitInfo(response.headers);
      
      const providerResponse = this.transformResponse(openaiResponse, startTime);
      this.recordRequest(startTime, true);
      this.emit('response', providerResponse);

      return providerResponse;
    } catch (error) {
      this.recordRequest(startTime, false);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Send streaming query to OpenAI API
   */
  async* sendStreamingQuery(
    query: string,
    options?: QueryOptions
  ): AsyncIterable<StreamResponse> {
    try {
      this.validateQueryOptions(options);
      await this.checkRateLimits();

      const config = this._config as OpenAIConfig;
      const requestBody = this.buildRequestBody(query, options, config, true);

      const response = await this.makeRequest('/chat/completions', requestBody);
      
      if (!response.ok) {
        const errorData = await response.json() as OpenAIError;
        throw this.createErrorFromResponse(errorData);
      }

      this.updateRateLimitInfo(response.headers);

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6);
              
              if (data === '[DONE]') {
                yield {
                  content: fullContent,
                  delta: '',
                  done: true,
                  usage: {
                    promptTokens: this.estimateTokenCount(query),
                    completionTokens: this.estimateTokenCount(fullContent),
                    totalTokens: this.estimateTokenCount(query + fullContent)
                  }
                };
                return;
              }

              try {
                const chunk = JSON.parse(data) as OpenAIStreamChunk;
                const delta = chunk.choices[0]?.delta?.content || '';
                
                if (delta) {
                  fullContent += delta;
                  yield {
                    content: fullContent,
                    delta,
                    done: false
                  };
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Authenticate with OpenAI API
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/models');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if OpenAI API is available
   */
  protected async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${this._config.apiKey}`,
          'User-Agent': 'Aura-Browser/1.0'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build request body for OpenAI API
   */
  private buildRequestBody(
    query: string,
    options?: QueryOptions,
    config?: OpenAIConfig,
    stream: boolean = false
  ): object {
    const temperature = options?.temperature ?? config?.defaultTemperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? config?.defaultMaxTokens ?? 2048;
    const model = config?.model ?? 'gpt-4-turbo';

    return {
      model,
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: options?.topP ?? 1,
      frequency_penalty: options?.frequencyPenalty ?? 0,
      presence_penalty: options?.presencePenalty ?? 0,
      stream,
      ...(stream && { stream_options: { include_usage: true } })
    };
  }

  /**
   * Make HTTP request to OpenAI API
   */
  private async makeRequest(endpoint: string, body?: object): Promise<Response> {
    const config = this._config as OpenAIConfig;
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Aura-Browser/1.0'
    };

    if (config.organization) {
      headers['OpenAI-Organization'] = config.organization;
    }

    if (config.projectId) {
      headers['OpenAI-Project'] = config.projectId;
    }

    const requestOptions: RequestInit = {
      method: body ? 'POST' : 'GET',
      headers,
      signal: AbortSignal.timeout(this._config.timeout || 30000)
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    this.requestCount++;
    return await fetch(url, requestOptions);
  }

  /**
   * Transform OpenAI response to provider response
   */
  private transformResponse(openaiResponse: OpenAIResponse, startTime: Date): ProviderResponse {
    const choice = openaiResponse.choices[0];
    const processingTime = Date.now() - startTime.getTime();

    return {
      content: choice.message.content,
      usage: {
        promptTokens: openaiResponse.usage.prompt_tokens,
        completionTokens: openaiResponse.usage.completion_tokens,
        totalTokens: openaiResponse.usage.total_tokens
      },
      metadata: this.createMetadata(
        openaiResponse.model,
        openaiResponse.id,
        processingTime
      ),
      confidence: this.calculateConfidence(choice.finish_reason, choice.message.content),
      finishReason: choice.finish_reason
    };
  }

  /**
   * Calculate response confidence based on finish reason and content
   */
  private calculateConfidence(finishReason: string, content: string): number {
    let confidence = 0.8; // Base confidence

    switch (finishReason) {
      case 'stop':
        confidence = 0.9; // Natural completion
        break;
      case 'length':
        confidence = 0.7; // Cut off due to length
        break;
      case 'content_filter':
        confidence = 0.3; // Content was filtered
        break;
      default:
        confidence = 0.6; // Unknown reason
    }

    // Adjust based on content length (very short responses might be incomplete)
    if (content.length < 10) {
      confidence *= 0.7;
    }

    return confidence;
  }

  /**
   * Create error from OpenAI API response
   */
  private createErrorFromResponse(errorResponse: OpenAIError): Error {
    const error = errorResponse.error;
    let message = `OpenAI API Error: ${error.message}`;

    if (error.type) {
      message += ` (Type: ${error.type})`;
    }

    if (error.code) {
      message += ` (Code: ${error.code})`;
    }

    const apiError = new Error(message);
    (apiError as any).type = error.type;
    (apiError as any).code = error.code;
    (apiError as any).param = error.param;

    return apiError;
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const requestsRemaining = headers.get('x-ratelimit-remaining-requests');
    const tokensRemaining = headers.get('x-ratelimit-remaining-tokens');
    const resetRequests = headers.get('x-ratelimit-reset-requests');
    const resetTokens = headers.get('x-ratelimit-reset-tokens');

    if (requestsRemaining) {
      this.rateLimitInfo.requestsRemaining = parseInt(requestsRemaining, 10);
    }

    if (tokensRemaining) {
      this.rateLimitInfo.tokensRemaining = parseInt(tokensRemaining, 10);
    }

    // Use the earliest reset time
    const resetTimes = [resetRequests, resetTokens]
      .filter(Boolean)
      .map(reset => new Date(Date.now() + (parseInt(reset!, 10) * 1000)));

    if (resetTimes.length > 0) {
      this.rateLimitInfo.resetTime = new Date(Math.min(...resetTimes.map(d => d.getTime())));
    }

    // Update provider status
    this._status.rateLimitRemaining = this.rateLimitInfo.requestsRemaining;
    this._status.rateLimitReset = this.rateLimitInfo.resetTime;
  }

  /**
   * Check rate limits before making request
   */
  private async checkRateLimits(): Promise<void> {
    if (this.rateLimitInfo.requestsRemaining !== undefined && 
        this.rateLimitInfo.requestsRemaining <= 0) {
      
      const resetTime = this.rateLimitInfo.resetTime;
      if (resetTime && resetTime > new Date()) {
        this.handleRateLimit(resetTime);
        throw new Error(`Rate limit exceeded. Reset at ${resetTime.toISOString()}`);
      }
    }
  }

  /**
   * Estimate cost for a query
   */
  async estimateCost(query: string, options?: QueryOptions): Promise<number> {
    const inputTokens = this.estimateTokenCount(query);
    const maxOutputTokens = options?.maxTokens || 2048;
    
    // GPT-4 Turbo pricing (approximate)
    const inputCostPerToken = 0.00001;  // $0.01 per 1K tokens
    const outputCostPerToken = 0.00003; // $0.03 per 1K tokens
    
    return (inputTokens * inputCostPerToken) + (maxOutputTokens * outputCostPerToken);
  }

  /**
   * Get current latency
   */
  async getLatency(): Promise<number> {
    if (this._metrics.totalRequests === 0) {
      return 0;
    }

    return this._metrics.totalLatency / this._metrics.totalRequests;
  }

  /**
   * Get request statistics
   */
  getRequestStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitInfo: {
      requestsRemaining?: number;
      tokensRemaining?: number;
      resetTime?: Date;
    };
  } {
    return {
      totalRequests: this.requestCount,
      successfulRequests: this._metrics.successfulRequests,
      failedRequests: this._metrics.failedRequests,
      rateLimitInfo: {
        requestsRemaining: this.rateLimitInfo.requestsRemaining,
        tokensRemaining: this.rateLimitInfo.tokensRemaining,
        resetTime: this.rateLimitInfo.resetTime
      }
    };
  }

  /**
   * Reset request statistics
   */
  resetStats(): void {
    this.requestCount = 0;
    this._metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatency: 0
    };
    this.rateLimitInfo = {};
  }
}
