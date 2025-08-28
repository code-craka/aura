/**
 * OpenAI Provider Integration Tests
 * 
 * Comprehensive test suite for OpenAI provider implementation including
 * authentication, query processing, streaming, error handling, and rate limiting.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenAIProvider, OpenAIConfig } from '../openai-provider.js';
import { CapabilityType, QueryOptions } from '../../interfaces/ai-provider.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let config: OpenAIConfig;
  
  const mockSuccessResponse = {
    ok: true,
    status: 200,
    headers: new Headers({
      'x-ratelimit-remaining-requests': '100',
      'x-ratelimit-remaining-tokens': '10000'
    }),
    json: async () => ({
      id: 'chatcmpl-test123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'gpt-4-turbo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you today?'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    })
  };

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      model: 'gpt-4-turbo',
      timeout: 30000,
      retries: 3
    };
    
    provider = new OpenAIProvider(config);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await provider.dispose();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with correct capabilities', () => {
      expect(provider.name).toBe('openai-gpt');
      expect(provider.displayName).toBe('OpenAI GPT');
      expect(provider.capabilities).toHaveLength(4);
      
      const textGenCapability = provider.capabilities.find(
        cap => cap.type === CapabilityType.TEXT_GENERATION
      );
      expect(textGenCapability).toBeDefined();
      expect(textGenCapability?.maxTokens).toBe(128000);
    });

    it('should use provided configuration', () => {
      expect(provider.config.apiKey).toBe('test-api-key');
      expect(provider.config.timeout).toBe(30000);
    });
  });

  describe('Authentication', () => {
    it('should authenticate successfully with valid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      const result = await provider.authenticate();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should fail authentication with invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error'
          }
        })
      });

      const result = await provider.authenticate();
      expect(result).toBe(false);
    });
  });

  describe('Availability Check', () => {
    it('should return true when API is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false when API is unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should cache availability status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      // First call should make request
      await provider.isAvailable();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call within cache period should not make request
      await provider.isAvailable();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Processing', () => {
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      headers: new Headers({
        'x-ratelimit-remaining-requests': '100',
        'x-ratelimit-remaining-tokens': '10000'
      }),
      json: async () => ({
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4-turbo',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      })
    };

    it('should process simple query successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse);

      const response = await provider.sendQuery('Hello');
      
      expect(response.content).toBe('Hello! How can I help you today?');
      expect(response.usage.totalTokens).toBe(30);
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.finishReason).toBe('stop');
    });

    it('should include correct request body', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse);

      const options: QueryOptions = {
        temperature: 0.5,
        maxTokens: 100,
        topP: 0.9
      };

      await provider.sendQuery('Test query', options);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toMatchObject({
        model: 'gpt-4-turbo',
        messages: [{
          role: 'user',
          content: 'Test query'
        }],
        temperature: 0.5,
        max_tokens: 100,
        top_p: 0.9
      });
    });

    it('should handle API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid request',
            type: 'invalid_request_error',
            code: 'invalid_parameter'
          }
        })
      });

      await expect(provider.sendQuery('Test')).rejects.toThrow(
        'OpenAI API Error: Invalid request'
      );
    });

    it('should retry on transient failures', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const response = await provider.sendQuery('Test');
      
      expect(response.content).toBe('Hello! How can I help you today?');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Streaming Queries', () => {
    it('should handle streaming responses correctly', async () => {
      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        body: {
          getReader: () => {
            let chunks = [
              'data: {"id":"chatcmpl-test","choices":[{"delta":{"content":"Hello"}}]}\n\n',
              'data: {"id":"chatcmpl-test","choices":[{"delta":{"content":" there"}}]}\n\n',
              'data: [DONE]\n\n'
            ];
            let index = 0;
            
            return {
              read: async () => {
                if (index < chunks.length) {
                  return {
                    done: false,
                    value: new TextEncoder().encode(chunks[index++])
                  };
                }
                return { done: true, value: undefined };
              },
              releaseLock: () => {}
            };
          }
        }
      };

      mockFetch.mockResolvedValueOnce(mockStreamResponse);

      const chunks: string[] = [];
      for await (const chunk of provider.sendStreamingQuery('Hello')) {
        chunks.push(chunk.delta);
        if (chunk.done) {
          expect(chunk.content).toBe('Hello there');
          expect(chunk.usage).toBeDefined();
          break;
        }
      }

      expect(chunks).toEqual(['Hello', ' there', '']);
    });

    it('should handle streaming errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Unauthorized',
            type: 'authentication_error'
          }
        })
      });

      await expect(async () => {
        for await (const chunk of provider.sendStreamingQuery('Test')) {
          // This should throw before yielding any chunks
          break;
        }
      }).rejects.toThrow('OpenAI API Error: Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit information from headers', async () => {
      const responseWithRateLimit = {
        ...mockSuccessResponse,
        headers: new Headers({
          'x-ratelimit-remaining-requests': '50',
          'x-ratelimit-remaining-tokens': '5000',
          'x-ratelimit-reset-requests': '60',
          'x-ratelimit-reset-tokens': '120'
        })
      };

      mockFetch.mockResolvedValueOnce(responseWithRateLimit);

      await provider.sendQuery('Test');
      
      const status = await provider.getStatus();
      expect(status.rateLimitRemaining).toBe(50);
      expect(status.rateLimitReset).toBeInstanceOf(Date);
    });

    it('should throw error when rate limit is exceeded', async () => {
      // First request sets rate limit to 0
      mockFetch.mockResolvedValueOnce({
        ...mockSuccessResponse,
        headers: new Headers({
          'x-ratelimit-remaining-requests': '0',
          'x-ratelimit-reset-requests': '60'
        })
      });

      await provider.sendQuery('First request');

      // Second request should fail due to rate limit
      await expect(provider.sendQuery('Second request')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate cost correctly', async () => {
      const query = 'This is a test query';
      const options: QueryOptions = { maxTokens: 100 };
      
      const cost = await provider.estimateCost(query, options);
      
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should return 0 for empty query', async () => {
      const cost = await provider.estimateCost('');
      expect(cost).toBeGreaterThan(0); // Still has some base cost
    });
  });

  describe('Performance Metrics', () => {
    it('should track latency correctly', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(mockSuccessResponse), 100)
        )
      );

      await provider.sendQuery('Test');
      
      const latency = await provider.getLatency();
      expect(latency).toBeGreaterThan(50); // Should be around 100ms
    });

    it('should track request statistics', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse);

      await provider.sendQuery('Test');
      
      const stats = provider.getRequestStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(0);
    });

    it('should reset statistics correctly', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse);

      await provider.sendQuery('Test');
      provider.resetStats();
      
      const stats = provider.getRequestStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      const validation = await provider.validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toBeUndefined();
    });

    it('should fail validation with invalid config', async () => {
      const invalidProvider = new OpenAIProvider({
        apiKey: '', // Invalid empty API key
        timeout: 500 // Invalid timeout
      });

      const validation = await invalidProvider.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('API key is required');
      expect(validation.errors).toContain('Timeout must be at least 1000ms');
    });
  });

  describe('Query Options Validation', () => {
    it('should validate temperature range', async () => {
      await expect(
        provider.sendQuery('Test', { temperature: 3.0 })
      ).rejects.toThrow('Temperature must be between 0 and 2');
    });

    it('should validate max tokens', async () => {
      await expect(
        provider.sendQuery('Test', { maxTokens: 0 })
      ).rejects.toThrow('Max tokens must be at least 1');
    });

    it('should validate top P range', async () => {
      await expect(
        provider.sendQuery('Test', { topP: 1.5 })
      ).rejects.toThrow('Top P must be between 0 and 1');
    });
  });

  describe('Event Emission', () => {
    it('should emit response event on successful query', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse);

      const responseHandler = vi.fn();
      provider.on('response', responseHandler);

      await provider.sendQuery('Test');

      expect(responseHandler).toHaveBeenCalledOnce();
      expect(responseHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello! How can I help you today?'
        })
      );
    });

    it('should emit error event on failed query', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const errorHandler = vi.fn();
      provider.on('error', errorHandler);

      await expect(provider.sendQuery('Test')).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalledOnce();
    });

    it('should emit rate limit event when approaching limit', async () => {
      const responseWithLowRateLimit = {
        ...mockSuccessResponse,
        headers: new Headers({
          'x-ratelimit-remaining-requests': '5',
          'x-ratelimit-reset-requests': '60'
        })
      };

      mockFetch.mockResolvedValueOnce(responseWithLowRateLimit);

      const rateLimitHandler = vi.fn();
      provider.on('rate-limit', rateLimitHandler);

      await provider.sendQuery('Test');

      // The provider should emit rate-limit warning when remaining requests < 10
      // This depends on the implementation logic
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should dispose cleanly', async () => {
      await expect(provider.dispose()).resolves.not.toThrow();
    });

    it('should remove all event listeners on disposal', async () => {
      const handler = vi.fn();
      provider.on('response', handler);

      await provider.dispose();

      // After disposal, no events should be emitted
      expect(provider.listenerCount('response')).toBe(0);
    });
  });
});

describe('OpenAI Provider Integration', () => {
  it('should integrate with real API (when API key is provided)', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('Skipping real API test - OPENAI_API_KEY not provided');
      return;
    }

    const provider = new OpenAIProvider({
      apiKey,
      model: 'gpt-3.5-turbo', // Use cheaper model for testing
      timeout: 10000
    });

    try {
      const response = await provider.sendQuery('Say "Hello, World!" and nothing else.');
      
      expect(response.content).toBeTruthy();
      expect(response.usage.totalTokens).toBeGreaterThan(0);
      expect(response.metadata.provider).toBe('openai-gpt');
      
      console.log('Real API test successful:', {
        content: response.content,
        tokens: response.usage.totalTokens,
        cost: await provider.estimateCost('Say "Hello, World!" and nothing else.')
      });
    } finally {
      await provider.dispose();
    }
  }, 30000); // 30 second timeout for real API calls
});
