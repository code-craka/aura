/**
 * AI Engine Foundation Integration Tests
 * 
 * Comprehensive integration tests that verify the complete AI Engine Foundation
 * works correctly with all components integrated.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  AIEngineFactory, 
  ProviderRegistry, 
  AIRouter,
  QueryType,
  CapabilityType 
} from '../ai-engine-factory.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Engine Foundation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await AIEngineFactory.disposeEngine();
  });

  describe('Engine Creation and Configuration', () => {
    it('should create engine with OpenAI provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      const engine = await AIEngineFactory.createEngine(config);

      expect(engine.registry).toBeInstanceOf(ProviderRegistry);
      expect(engine.router).toBeInstanceOf(AIRouter);
      expect(engine.providers.size).toBe(1);
      expect(engine.providers.has('openai-gpt')).toBe(true);
    });

    it('should create privacy-focused engine configuration', () => {
      const config = AIEngineFactory.createPrivacyConfig('test-model');
      
      expect(config.local?.modelName).toBe('test-model');
      expect(config.defaultProvider).toBe('local-ai');
      expect(config.enableFallbacks).toBe(false);
    });

    it('should create hybrid configuration', () => {
      const config = AIEngineFactory.createHybridConfig('api-key', 'local-model');
      
      expect(config.openai?.apiKey).toBe('api-key');
      expect(config.local?.modelName).toBe('local-model');
      expect(config.enableFallbacks).toBe(true);
    });
  });

  describe('Provider Registration and Management', () => {
    it('should register and manage providers correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      const engine = await AIEngineFactory.createEngine(config);

      const providers = engine.registry.getAllProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].provider.name).toBe('openai-gpt');
      expect(providers[0].enabled).toBe(true);
    });

    it('should handle provider registration failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const config = AIEngineFactory.createBasicConfig('invalid-key');
      
      // Should not throw, but log warning
      const engine = await AIEngineFactory.createEngine(config);
      expect(engine.providers.size).toBe(0); // No providers registered due to failure
    });
  });

  describe('Query Processing Integration', () => {
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
            content: 'This is a test response from the AI'
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

    it('should process complete query through the system', async () => {
      // Mock authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      // Mock query response
      mockFetch.mockResolvedValueOnce(mockSuccessResponse);

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      const engine = await AIEngineFactory.createEngine(config);

      const response = await engine.router.processQuery({
        id: 'integration-test-1',
        content: 'Hello, world!',
        type: QueryType.TEXT_GENERATION,
        requirements: {
          capabilities: [CapabilityType.TEXT_GENERATION],
          qualityLevel: 'standard' as const,
          privacyLevel: 'public' as const
        },
        userPreferences: {},
        timestamp: new Date()
      });

      expect(response.content).toBe('This is a test response from the AI');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata.providersUsed).toContain('openai-gpt');
      expect(response.processingTime).toBeGreaterThan(0);
    });

    it('should handle provider selection correctly', async () => {
      // Mock authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      // Mock query response
      mockFetch.mockResolvedValueOnce(mockSuccessResponse);

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      const engine = await AIEngineFactory.createEngine(config);

      // Test provider selection for different query types
      const codeQuery = {
        id: 'code-test',
        content: 'Write a Python function',
        type: QueryType.CODE_GENERATION,
        requirements: {
          capabilities: [CapabilityType.CODE_GENERATION],
          qualityLevel: 'premium' as const,
          privacyLevel: 'public' as const
        },
        userPreferences: {
          qualityPriority: true
        },
        timestamp: new Date()
      };

      const response = await engine.router.processQuery(codeQuery);
      expect(response.metadata.providersUsed).toContain('openai-gpt');
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle provider failures with appropriate fallbacks', async () => {
      // Mock authentication success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      // Mock query failure
      mockFetch.mockRejectedValueOnce(new Error('Provider unavailable'));

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      const engine = await AIEngineFactory.createEngine(config);

      await expect(engine.router.processQuery({
        id: 'fallback-test',
        content: 'Test query',
        type: QueryType.TEXT_GENERATION,
        requirements: {
          capabilities: [CapabilityType.TEXT_GENERATION],
          qualityLevel: 'basic' as const,
          privacyLevel: 'public' as const
        },
        userPreferences: {},
        timestamp: new Date()
      })).rejects.toThrow('Primary provider failed and no fallbacks available');
    });
  });

  describe('Engine Status and Monitoring', () => {
    it('should provide accurate engine status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      await AIEngineFactory.createEngine(config);

      const status = await AIEngineFactory.getEngineStatus();

      expect(status.providersCount).toBe(1);
      expect(status.availableProviders).toHaveLength(1);
      expect(status.routingStats).toBeDefined();
      expect(status.selectionStats).toBeDefined();
    });

    it('should track routing statistics correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 'test',
          choices: [{ message: { content: 'response' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 }
        })
      });

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      const engine = await AIEngineFactory.createEngine(config);

      // Process a query to generate stats
      await engine.router.processQuery({
        id: 'stats-test',
        content: 'Test',
        type: QueryType.TEXT_GENERATION,
        requirements: {
          capabilities: [CapabilityType.TEXT_GENERATION],
          qualityLevel: 'basic' as const,
          privacyLevel: 'public' as const
        },
        userPreferences: {},
        timestamp: new Date()
      });

      const stats = engine.router.getRoutingStats();
      expect(stats.totalQueries).toBe(1);
      expect(stats.queryTypes.get(QueryType.TEXT_GENERATION)).toBe(1);
    });
  });

  describe('Engine Lifecycle Management', () => {
    it('should dispose of engine cleanly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      const config = AIEngineFactory.createBasicConfig('test-api-key');
      const engine = await AIEngineFactory.createEngine(config);

      expect(AIEngineFactory.getInstance()).toBe(engine);

      await AIEngineFactory.disposeEngine();

      expect(AIEngineFactory.getInstance()).toBeNull();
    });

    it('should handle multiple dispose calls gracefully', async () => {
      await AIEngineFactory.disposeEngine(); // Should not throw
      await AIEngineFactory.disposeEngine(); // Should not throw
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration correctly', async () => {
      const validConfig = AIEngineFactory.createBasicConfig('valid-key');
      expect(validConfig.openai?.apiKey).toBe('valid-key');
      expect(validConfig.enableFallbacks).toBe(true);

      const privacyConfig = AIEngineFactory.createPrivacyConfig();
      expect(privacyConfig.local?.modelName).toBeDefined();
      expect(privacyConfig.enableFallbacks).toBe(false);
    });

    it('should handle invalid configurations', async () => {
      const config = {
        openai: {
          apiKey: '', // Invalid empty key
          timeout: 500 // Invalid timeout
        }
      };

      // Should handle gracefully without throwing
      const engine = await AIEngineFactory.createEngine(config);
      expect(engine.providers.size).toBe(0); // No providers due to validation failure
    });
  });
});

describe('Real API Integration Tests', () => {
  it('should work with real OpenAI API when key is provided', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('Skipping real API test - OPENAI_API_KEY not provided');
      return;
    }

    const engine = await AIEngineFactory.createEngine({
      openai: {
        apiKey,
        model: 'gpt-3.5-turbo', // Use cheaper model for testing
        timeout: 15000
      }
    });

    try {
      const response = await engine.router.processQuery({
        id: 'real-api-test',
        content: 'Say exactly "Integration test successful" and nothing else.',
        type: QueryType.TEXT_GENERATION,
        requirements: {
          capabilities: [CapabilityType.TEXT_GENERATION],
          qualityLevel: 'basic' as const,
          privacyLevel: 'public' as const
        },
        userPreferences: {},
        timestamp: new Date()
      });

      expect(response.content).toBeTruthy();
      expect(response.metadata.providersUsed).toContain('openai-gpt');
      expect(response.metadata.costIncurred).toBeGreaterThan(0);
      
      console.log('Real API integration test successful:', {
        content: response.content,
        cost: response.metadata.costIncurred,
        processingTime: response.processingTime
      });
      
    } finally {
      await AIEngineFactory.disposeEngine();
    }
  }, 30000); // 30 second timeout for real API calls
});
