/**
 * AI Engine Usage Examples
 * 
 * Demonstrates how to use the AI Engine Foundation with different configurations
 * and use cases. This file serves as both documentation and integration tests.
 */

import { 
  AIEngineFactory, 
  initializeAIEngine,
  initializePrivateAIEngine,
  AIEngineComponents,
  QueryType,
  CapabilityType
} from '../ai-engine-factory.js';

/**
 * Example 1: Basic OpenAI Setup
 */
export async function basicOpenAIExample(apiKey: string): Promise<void> {
  console.log('🚀 Basic OpenAI Example');
  
  // Initialize with OpenAI
  const engine = await initializeAIEngine(apiKey);
  
  try {
    // Simple text generation
    const response = await engine.router.processQuery({
      id: 'example-1',
      content: 'Explain quantum computing in simple terms',
      type: QueryType.TEXT_GENERATION,
      requirements: {
        capabilities: [CapabilityType.TEXT_GENERATION],
        qualityLevel: 'standard',
        privacyLevel: 'public'
      },
      userPreferences: {
        qualityPriority: true
      },
      timestamp: new Date()
    });

    console.log('📄 Response:', response.content);
    console.log('⏱️  Processing time:', response.processingTime, 'ms');
    console.log('💰 Cost:', '$' + response.metadata.costIncurred.toFixed(4));
    console.log('🎯 Confidence:', response.confidence);
    
  } finally {
    await AIEngineFactory.disposeEngine();
  }
}

/**
 * Example 2: Streaming Response
 */
export async function streamingExample(apiKey: string): Promise<void> {
  console.log('🚀 Streaming Response Example');
  
  const engine = await initializeAIEngine(apiKey);
  
  try {
    console.log('📝 Streaming response:');
    process.stdout.write('AI: ');
    
    for await (const chunk of engine.router.processStreamingQuery({
      id: 'stream-example',
      content: 'Write a short story about a robot discovering emotions',
      type: QueryType.CREATIVE_WRITING,
      requirements: {
        capabilities: [CapabilityType.TEXT_GENERATION],
        qualityLevel: 'premium',
        privacyLevel: 'public',
        requiresStreaming: true
      },
      userPreferences: {
        qualityPriority: true
      },
      timestamp: new Date()
    })) {
      if (chunk.delta) {
        process.stdout.write(chunk.delta);
      }
      
      if (chunk.complete) {
        console.log('\n\n✅ Streaming complete');
        console.log('⏱️  Total processing time:', chunk.complete.processingTime, 'ms');
        break;
      }
    }
    
  } finally {
    await AIEngineFactory.disposeEngine();
  }
}

/**
 * Example 3: Privacy-First Local Processing
 */
export async function privacyExample(): Promise<void> {
  console.log('🚀 Privacy-First Local Processing Example');
  
  try {
    const engine = await initializePrivateAIEngine('llama2-7b');
    
    // Process sensitive query locally
    const response = await engine.router.processQuery({
      id: 'privacy-example',
      content: 'Help me draft a confidential business proposal',
      type: QueryType.TEXT_GENERATION,
      requirements: {
        capabilities: [CapabilityType.TEXT_GENERATION],
        qualityLevel: 'standard',
        privacyLevel: 'confidential'
      },
      userPreferences: {
        privacyFirst: true
      },
      timestamp: new Date()
    });

    console.log('📄 Local response:', response.content);
    console.log('🔒 Privacy level: Confidential (processed locally)');
    console.log('💰 Cost: $0 (local processing)');
    
  } catch (error) {
    console.log('⚠️  Local AI not available:', (error as Error).message);
    console.log('📝 Would require model download and setup');
  } finally {
    await AIEngineFactory.disposeEngine();
  }
}

/**
 * Example 4: Hybrid Cloud + Local Setup
 */
export async function hybridExample(apiKey: string): Promise<void> {
  console.log('🚀 Hybrid Cloud + Local Example');
  
  const config = AIEngineFactory.createHybridConfig(apiKey, 'llama2-7b');
  const engine = await AIEngineFactory.createEngine(config);
  
  try {
    // Process different types of queries
    const queries = [
      {
        content: 'What is the weather like today?',
        privacy: 'public' as const,
        description: 'Public query - can use cloud'
      },
      {
        content: 'Analyze my personal financial data: ...',
        privacy: 'confidential' as const,
        description: 'Sensitive query - should use local'
      }
    ];

    for (const query of queries) {
      console.log(`\n📝 ${query.description}`);
      
      try {
        const response = await engine.router.processQuery({
          id: `hybrid-${Date.now()}`,
          content: query.content,
          type: QueryType.ANALYSIS,
          requirements: {
            capabilities: [CapabilityType.TEXT_GENERATION],
            qualityLevel: 'standard',
            privacyLevel: query.privacy
          },
          userPreferences: {
            privacyFirst: query.privacy === 'confidential'
          },
          timestamp: new Date()
        });

        console.log(`✅ Processed by: ${response.metadata.providersUsed.join(', ')}`);
        console.log(`💰 Cost: $${response.metadata.costIncurred.toFixed(4)}`);
        
      } catch (error) {
        console.log(`❌ Failed: ${(error as Error).message}`);
      }
    }
    
  } finally {
    await AIEngineFactory.disposeEngine();
  }
}

/**
 * Example 5: Error Handling and Fallbacks
 */
export async function fallbackExample(apiKey: string): Promise<void> {
  console.log('🚀 Error Handling and Fallbacks Example');
  
  const engine = await initializeAIEngine(apiKey);
  
  try {
    // Simulate provider failure by using invalid API key temporarily
    const openaiProvider = engine.providers.get('openai-gpt');
    if (openaiProvider) {
      await openaiProvider.updateConfig({ apiKey: 'invalid-key' });
    }

    console.log('📝 Testing fallback behavior with invalid credentials...');
    
    try {
      const response = await engine.router.processQuery({
        id: 'fallback-example',
        content: 'Generate a simple greeting',
        type: QueryType.TEXT_GENERATION,
        requirements: {
          capabilities: [CapabilityType.TEXT_GENERATION],
          qualityLevel: 'basic',
          privacyLevel: 'public'
        },
        userPreferences: {},
        timestamp: new Date()
      });

      console.log('✅ Fallback successful:', response.content);
      console.log('🔄 Fallbacks triggered:', response.metadata.fallbacksTriggered);
      
    } catch (error) {
      console.log('❌ All providers failed:', (error as Error).message);
    }
    
  } finally {
    await AIEngineFactory.disposeEngine();
  }
}

/**
 * Example 6: Multiple Provider Aggregation
 */
export async function aggregationExample(apiKey: string): Promise<void> {
  console.log('🚀 Multiple Provider Aggregation Example');
  
  const engine = await initializeAIEngine(apiKey);
  
  try {
    // Get multiple providers for comparison
    const providers = engine.registry.getEnabledProviders()
      .map(reg => reg.provider)
      .slice(0, 2); // Use up to 2 providers

    if (providers.length < 2) {
      console.log('⚠️  Need at least 2 providers for aggregation example');
      return;
    }

    console.log(`📝 Aggregating responses from ${providers.length} providers...`);
    
    const response = await engine.router.aggregateResponses({
      id: 'aggregation-example',
      content: 'Explain the concept of machine learning',
      type: QueryType.TEXT_GENERATION,
      requirements: {
        capabilities: [CapabilityType.TEXT_GENERATION],
        qualityLevel: 'premium',
        privacyLevel: 'public'
      },
      userPreferences: {
        qualityPriority: true
      },
      timestamp: new Date()
    }, providers);

    console.log('📄 Best aggregated response:', response.content);
    console.log('🔄 Providers used:', response.metadata.providersUsed.join(', '));
    console.log('⭐ Quality score:', response.metadata.qualityScore);
    
  } finally {
    await AIEngineFactory.disposeEngine();
  }
}

/**
 * Example 7: Engine Status and Monitoring
 */
export async function monitoringExample(apiKey: string): Promise<void> {
  console.log('🚀 Engine Status and Monitoring Example');
  
  const engine = await initializeAIEngine(apiKey);
  
  try {
    // Get engine status
    const status = await AIEngineFactory.getEngineStatus();
    
    console.log('📊 Engine Status:');
    console.log(`   Providers: ${status.providersCount}`);
    console.log(`   Available: ${status.availableProviders.join(', ')}`);
    console.log(`   Total Queries: ${status.routingStats.totalQueries}`);
    
    // Process a few queries to generate some stats
    for (let i = 0; i < 3; i++) {
      await engine.router.processQuery({
        id: `monitoring-${i}`,
        content: `Test query number ${i + 1}`,
        type: QueryType.TEXT_GENERATION,
        requirements: {
          capabilities: [CapabilityType.TEXT_GENERATION],
          qualityLevel: 'basic',
          privacyLevel: 'public'
        },
        userPreferences: {},
        timestamp: new Date()
      });
    }

    // Get updated stats
    const updatedStatus = await AIEngineFactory.getEngineStatus();
    console.log('\n📈 Updated Stats:');
    console.log(`   Total Queries: ${updatedStatus.routingStats.totalQueries}`);
    console.log('   Selection Stats:', updatedStatus.selectionStats);
    
  } finally {
    await AIEngineFactory.disposeEngine();
  }
}

/**
 * Run all examples (for demonstration)
 */
export async function runAllExamples(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  Set OPENAI_API_KEY environment variable to run examples');
    return;
  }

  console.log('🚀 Running AI Engine Foundation Examples\n');
  
  try {
    await basicOpenAIExample(apiKey);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await streamingExample(apiKey);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await privacyExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await hybridExample(apiKey);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await fallbackExample(apiKey);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await aggregationExample(apiKey);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await monitoringExample(apiKey);
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
  
  console.log('\n✅ All examples completed');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
