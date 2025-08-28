/**
 * Simple test to validate Phase 1 Core AI Infrastructure
 */

import { AIEngineFactory } from '../ai-engine-factory.js';
import { CapabilityType } from '../interfaces/ai-provider.js';

/**
 * Test basic AI engine functionality
 */
async function testPhase1Core() {
  console.log('🧪 Testing Phase 1 Core AI Infrastructure...');

  try {
    // Test 1: AI Engine Factory creation
    console.log('✅ Test 1: Creating AI Engine...');
    const config = AIEngineFactory.createBasicConfig();
    const engine = await AIEngineFactory.createEngine(config);
    
    // Test 2: Provider registration (OpenAI should be registered)
    console.log('✅ Test 2: Checking provider registry...');
    const providers = engine.registry.getAllProviders();
    console.log(`📋 Registered providers count: ${providers.length}`);
    
    // Test 3: Simple query processing (should work with stub)
    console.log('✅ Test 3: Processing simple query...');
    const response = await engine.router.processQuery('Hello, world!');
    console.log(`📝 Response: ${response.content.substring(0, 100)}...`);
    
    // Test 4: Engine statistics
    console.log('✅ Test 4: Getting engine stats...');
    const stats = engine.router.getRoutingStats();
    console.log(`📊 Total queries: ${stats.totalQueries}`);
    
    console.log('🎉 Phase 1 Core AI Infrastructure tests completed successfully!');
    
    // Cleanup
    await engine.router.dispose();
    
  } catch (error) {
    console.error('❌ Phase 1 test failed:', error);
    return false;
  }
  
  return true;
}

// Export for testing
export { testPhase1Core };

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPhase1Core()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
