/**
 * AI Engine Factory
 * 
 * Main entry point for creating and configuring the AI Engine with all providers
 * and routing capabilities. Provides a simple interface for initializing the complete
 * AI infrastructure.
 */

import { ProviderRegistry } from './registry/provider-registry.js';
import { AIRouter } from './router/ai-router.js';
import { OpenAIProvider, OpenAIConfig } from './providers/openai-provider.js';
import { LocalAIProvider } from './providers/local-ai-provider.js';
import { AIProvider } from './interfaces/ai-provider.js';

export interface AIEngineConfig {
  openai?: OpenAIConfig;
  local?: {
    modelName: string;
    maxMemoryUsage?: number;
    enableGPUAcceleration?: boolean;
  };
  defaultProvider?: string;
  enableFallbacks?: boolean;
}

export interface AIEngineComponents {
  registry: ProviderRegistry;
  router: AIRouter;
  providers: Map<string, AIProvider>;
}

/**
 * AI Engine Factory - Creates and configures the complete AI system
 */
export class AIEngineFactory {
  private static instance: AIEngineComponents | null = null;

  /**
   * Create a new AI Engine instance with the specified configuration
   */
  static async createEngine(config: AIEngineConfig): Promise<AIEngineComponents> {
    const registry = new ProviderRegistry();
    const router = new AIRouter(registry);
    const providers = new Map<string, AIProvider>();

    // Initialize OpenAI provider if configured
    if (config.openai?.apiKey) {
      try {
        const openaiProvider = new OpenAIProvider(config.openai);
        await registry.registerProvider(openaiProvider, {
          priority: 80,
          enabled: true,
          tags: ['cloud', 'high-quality', 'general-purpose']
        });
        providers.set('openai-gpt', openaiProvider);
        console.log('✅ OpenAI provider registered successfully');
      } catch (error) {
        console.warn('⚠️  Failed to register OpenAI provider:', (error as Error).message);
      }
    }

    // Initialize Local AI provider if configured
    if (config.local?.modelName) {
      try {
        const localProvider = new LocalAIProvider({
          modelName: config.local.modelName,
          maxMemoryUsage: config.local.maxMemoryUsage,
          enableGPUAcceleration: config.local.enableGPUAcceleration
        });
        await localProvider.initialize();
        await registry.registerProvider(localProvider, {
          priority: 60,
          enabled: true,
          fallbackFor: ['openai-gpt'], // Local as fallback for cloud providers
          tags: ['local', 'privacy', 'offline']
        });
        providers.set('local-ai', localProvider);
        console.log('✅ Local AI provider registered successfully');
      } catch (error) {
        console.warn('⚠️  Failed to register Local AI provider:', (error as Error).message);
      }
    }

    // Set up event logging
    AIEngineFactory.setupEventLogging(registry, router);

    const components: AIEngineComponents = {
      registry,
      router,
      providers
    };

    AIEngineFactory.instance = components;
    return components;
  }

  /**
   * Get the current AI Engine instance (singleton pattern)
   */
  static getInstance(): AIEngineComponents | null {
    return AIEngineFactory.instance;
  }

  /**
   * Add a custom provider to the existing engine
   */
  static async addProvider(
    provider: AIProvider,
    options: {
      priority?: number;
      enabled?: boolean;
      fallbackFor?: string[];
      tags?: string[];
    } = {}
  ): Promise<void> {
    const engine = AIEngineFactory.getInstance();
    if (!engine) {
      throw new Error('AI Engine not initialized. Call createEngine() first.');
    }

    await engine.registry.registerProvider(provider, options);
    engine.providers.set(provider.name, provider);
    console.log(`✅ Custom provider ${provider.name} registered successfully`);
  }

  /**
   * Remove a provider from the engine
   */
  static async removeProvider(providerId: string): Promise<void> {
    const engine = AIEngineFactory.getInstance();
    if (!engine) {
      throw new Error('AI Engine not initialized. Call createEngine() first.');
    }

    await engine.registry.unregisterProvider(providerId);
    engine.providers.delete(providerId);
    console.log(`✅ Provider ${providerId} removed successfully`);
  }

  /**
   * Get engine health and status
   */
  static async getEngineStatus(): Promise<{
    providersCount: number;
    availableProviders: string[];
    routingStats: any;
    selectionStats: any;
  }> {
    const engine = AIEngineFactory.getInstance();
    if (!engine) {
      throw new Error('AI Engine not initialized. Call createEngine() first.');
    }

    const enabledProviders = engine.registry.getEnabledProviders();
    const availableProviders: string[] = [];

    // Check availability of each provider
    for (const registration of enabledProviders) {
      const isAvailable = await registration.provider.isAvailable();
      if (isAvailable) {
        availableProviders.push(registration.provider.name);
      }
    }

    return {
      providersCount: enabledProviders.length,
      availableProviders,
      routingStats: engine.router.getRoutingStats(),
      selectionStats: Object.fromEntries(engine.registry.getSelectionStats())
    };
  }

  /**
   * Dispose of the AI Engine and clean up resources
   */
  static async disposeEngine(): Promise<void> {
    const engine = AIEngineFactory.getInstance();
    if (!engine) {
      return;
    }

    // Dispose of all providers
    for (const provider of engine.providers.values()) {
      await provider.dispose();
    }

    // Dispose of router and registry
    await engine.router.dispose();
    await engine.registry.dispose();

    AIEngineFactory.instance = null;
    console.log('✅ AI Engine disposed successfully');
  }

  /**
   * Set up event logging for debugging and monitoring
   * NOTE: Event handling will be implemented in Phase 2
   */
  private static setupEventLogging(registry: ProviderRegistry, router: AIRouter): void {
    // Event logging will be implemented when EventEmitter interfaces are properly set up
    console.log('Event logging setup deferred to Phase 2');
  }

  /**
   * Create a basic configuration for quick setup
   */
  static createBasicConfig(openaiApiKey?: string): AIEngineConfig {
    const config: AIEngineConfig = {
      enableFallbacks: true
    };

    if (openaiApiKey) {
      config.openai = {
        apiKey: openaiApiKey,
        model: 'gpt-4-turbo',
        timeout: 30000,
        retries: 3
      };
    }

    return config;
  }

  /**
   * Create a privacy-focused configuration with local processing
   */
  static createPrivacyConfig(localModelName: string = 'llama2-7b'): AIEngineConfig {
    return {
      local: {
        modelName: localModelName,
        maxMemoryUsage: 4096, // 4GB
        enableGPUAcceleration: true
      },
      defaultProvider: 'local-ai',
      enableFallbacks: false // No cloud fallbacks for privacy
    };
  }

  /**
   * Create a hybrid configuration with both cloud and local providers
   */
  static createHybridConfig(openaiApiKey: string, localModelName: string = 'llama2-7b'): AIEngineConfig {
    return {
      openai: {
        apiKey: openaiApiKey,
        model: 'gpt-4-turbo',
        timeout: 30000,
        retries: 2
      },
      local: {
        modelName: localModelName,
        maxMemoryUsage: 2048, // 2GB for hybrid setup
        enableGPUAcceleration: true
      },
      defaultProvider: 'openai-gpt',
      enableFallbacks: true
    };
  }
}

/**
 * Convenience function to quickly initialize AI Engine with OpenAI
 */
export async function initializeAIEngine(openaiApiKey: string): Promise<AIEngineComponents> {
  const config = AIEngineFactory.createBasicConfig(openaiApiKey);
  return await AIEngineFactory.createEngine(config);
}

/**
 * Convenience function to initialize privacy-focused AI Engine
 */
export async function initializePrivateAIEngine(localModelName?: string): Promise<AIEngineComponents> {
  const config = AIEngineFactory.createPrivacyConfig(localModelName);
  return await AIEngineFactory.createEngine(config);
}

/**
 * Export commonly used types for consumers
 */
export {
  ProviderRegistry,
  AIRouter,
  OpenAIProvider,
  LocalAIProvider
};

export * from './interfaces/ai-provider.js';
export * from './router/ai-router.js';
