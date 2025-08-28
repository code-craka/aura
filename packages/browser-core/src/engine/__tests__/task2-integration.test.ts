// Task 2 Integration Test
// Validates that all browser core components work together correctly

import { createBrowserCore, defaultBrowserCoreConfig } from '../browser-core';
import { createChromiumEngine } from '../chromium-engine';

// Mock native engine for testing
const mockNativeEngine = {
  initialize: async () => Promise.resolve(),
  shutdown: async () => Promise.resolve(),
  createTab: async (url: string) => Promise.resolve('tab-1'),
  destroyTab: async (id: string) => Promise.resolve(),
  navigateTab: async (id: string, url: string) => Promise.resolve(),
  extractContent: async (id: string) => Promise.resolve({
    title: 'Test Page',
    url: 'https://example.com',
    text: 'Test content',
    html: '<html><body>Test content</body></html>',
    metadata: {
      contentType: 'text/html',
      language: 'en'
    },
    elements: []
  }),
  injectScript: async (id: string, script: string) => Promise.resolve('result'),
  getMemoryUsage: async () => Promise.resolve(100 * 1024 * 1024), // 100MB
  getProcessInfo: async () => Promise.resolve({ pid: 1234, memory: 100 * 1024 * 1024 }),
  addEventListener: (eventType: string, callback: Function) => {},
  removeEventListener: (eventType: string, callback: Function) => {}
};

async function runTask2IntegrationTest() {
  console.log('🚀 Starting Task 2 Integration Test...');

  try {
    const browserCore = await initializeBrowserCore();
    await validateComponentAvailability(browserCore);
    await performCoreOperations(browserCore);
    await runOptimizationAndStats(browserCore);
    await shutdownBrowserCore(browserCore);

    console.log('🎉 All Task 2 integration tests passed!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

async function initializeBrowserCore() {
  // Create browser core with mock engine
  const browserCore = createBrowserCore(mockNativeEngine, defaultBrowserCoreConfig);

  // Test 1: Initialize browser core
  console.log('📋 Test 1: Initializing browser core...');
  await browserCore.initialize();
  console.log('✅ Browser core initialized successfully');

  return browserCore;
}

async function validateComponentAvailability(browserCore: any) {
  // Test 2: Check component availability
  console.log('📋 Test 2: Checking component availability...');
  if (!browserCore.chromiumEngine) throw new Error('ChromiumEngine not available');
  if (!browserCore.aiHooks) throw new Error('AIIntegrationHooks not available');
  if (!browserCore.processManager) throw new Error('ProcessManager not available');
  if (!browserCore.tabManager) throw new Error('TabManager not available');
  if (!browserCore.eventBus) throw new Error('EventBus not available');
  if (!browserCore.ipcManager) throw new Error('IPCManager not available');
  console.log('✅ All components are available');
}

async function performCoreOperations(browserCore: any) {
  // Test 3: Get initial stats
  console.log('📋 Test 3: Getting initial stats...');
  const initialStats = await browserCore.getStats();
  console.log('Initial stats:', initialStats);
  console.log('✅ Stats retrieved successfully');

  // Test 4: Create a tab
  console.log('📋 Test 4: Creating a tab...');
  const tab = await browserCore.tabManager.createTab('https://example.com', {
    spaceId: 'default-space',
    groupId: undefined,
    aiEnabled: true
  });
  console.log('Created tab:', tab);
  console.log('✅ Tab created successfully');

  // Test 5: List tabs
  console.log('📋 Test 5: Listing tabs...');
  const tabs = await browserCore.tabManager.listTabs();
  console.log('Tabs:', tabs.length, 'tab(s)');
  console.log('✅ Tabs listed successfully');

  // Test 6: Publish an event
  console.log('📋 Test 6: Publishing an event...');
  await browserCore.eventBus.publish({
    id: 'test-event-1',
    type: 'test-event' as any,
    timestamp: new Date(),
    source: 'test',
    data: { message: 'Hello from integration test!' },
    metadata: {
      priority: 'low' as any,
      correlationId: 'test-123'
    }
  });
  console.log('✅ Event published successfully');

  // Test 7: Get events
  console.log('📋 Test 7: Getting events...');
  const events = await browserCore.eventBus.getEvents();
  console.log('Events:', events.length, 'event(s)');
  console.log('✅ Events retrieved successfully');
}

async function runOptimizationAndStats(browserCore: any) {
  // Test 8: Run optimization
  console.log('📋 Test 8: Running optimization...');
  await browserCore.optimize();
  console.log('✅ Optimization completed successfully');

  // Test 9: Get final stats
  console.log('📋 Test 9: Getting final stats...');
  const finalStats = await browserCore.getStats();
  console.log('Final stats:', finalStats);
  console.log('✅ Final stats retrieved successfully');
}

async function shutdownBrowserCore(browserCore: any) {
  // Test 10: Shutdown browser core
  console.log('📋 Test 10: Shutting down browser core...');
  await browserCore.shutdown();
  console.log('✅ Browser core shutdown successfully');
}

// Export for use in other test files
export { runTask2IntegrationTest };

// Run the test if this file is executed directly
if (require.main === module) {
  runTask2IntegrationTest()
    .then(() => {
      console.log('✅ Task 2 integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Task 2 integration test failed:', error);
      process.exit(1);
    });
}
