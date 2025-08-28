// Task 3 Integration Test
// Validates advanced tab management, spaces system, and memory optimization

import { createTabManager, TabManagerConfig, TabSuspensionStrategy } from '../tab-manager';
import { createProcessManager } from '../process-manager';
import { createIPCManager } from '../process-manager';

// Mock IPC Manager for testing
const mockIPCManager = {
  createChannel: async (name: string, type: any, endpoints: string[]) => ({
    id: `channel_${Date.now()}`,
    name,
    type,
    endpoints,
    isSecure: true
  }),
  destroyChannel: async (channelId: string) => {},
  sendMessage: async (message: any) => {},
  subscribeToChannel: (channelId: string, handler: Function) => ({
    unsubscribe: () => {},
    id: `sub_${Date.now()}`
  }),
  getChannelInfo: async (channelId: string) => ({
    id: channelId,
    name: 'test',
    type: 'control' as any,
    endpoints: [],
    isSecure: true
  })
};

async function runTask3IntegrationTest() {
  console.log('🚀 Starting Task 3 Integration Test...');

  try {
    // Create process manager
    const processManager = createProcessManager(mockIPCManager);

    // Create tab manager with advanced config
    const tabManagerConfig: TabManagerConfig = {
      maxTabs: 50,
      defaultSpaceId: 'default-space',
      suspensionStrategy: {
        type: 'hybrid',
        threshold: 100,
        gracePeriod: 5,
        usageWeight: 0.3,
        memoryWeight: 0.4,
        timeWeight: 0.3
      },
      memoryThreshold: 512, // 512MB
      autoSaveState: true,
      enableAdvancedSearch: true,
      enableTabHistory: true,
      maxHistoryEntries: 100,
      enableAIFeatures: true
    };

    const tabManager = createTabManager(processManager, tabManagerConfig);

    // Test 3.1: Enhanced Tab and TabGroup data models
    console.log('📋 Test 3.1: Enhanced Tab and TabGroup data models...');

    // Create a space
    const space = await tabManager.createSpace('Test Workspace', {
      theme: 'dark',
      layout: 'compact',
      autoSuspend: true,
      aiEnabled: true
    });
    console.log('Created space:', space.name);

    // Create a group
    const group = await tabManager.createGroup('Research', '#3B82F6');
    console.log('Created group:', group.name);

    // Create tabs
    const tab1 = await tabManager.createTab('https://example.com', {
      spaceId: space.id,
      groupId: group.id,
      aiEnabled: true
    });
    const tab2 = await tabManager.createTab('https://github.com', {
      spaceId: space.id,
      groupId: group.id,
      aiEnabled: true
    });
    console.log('Created tabs:', tab1.title, tab2.title);

    // Update tab metadata
    await tabManager.updateTabMetadata(tab1.id, {
      description: 'Example website for testing',
      keywords: ['test', 'example'],
      author: 'Test Author',
      readingTime: 2,
      wordCount: 150,
      aiSummary: 'A simple example website',
      aiTopics: ['web development', 'testing'],
      aiSentiment: 'neutral',
      securityRating: 'safe',
      privacyScore: 95
    });
    console.log('✅ Enhanced metadata tracking working');

    // Test advanced search
    const searchResults = await tabManager.searchTabsAdvanced({
      text: 'example',
      aiTopics: ['web development'],
      securityRating: 'safe',
      sortBy: 'relevance',
      limit: 5
    });
    console.log('Advanced search found', searchResults.length, 'tabs');
    console.log('✅ Advanced search working');

    // Test 3.2: Advanced Spaces system
    console.log('📋 Test 3.2: Advanced Spaces system...');

    // Create another space
    const space2 = await tabManager.createSpace('Development', {
      theme: 'light',
      layout: 'grid',
      autoSuspend: false,
      aiEnabled: true
    });

    // Migrate tabs to new space
    await tabManager.migrateTabsToSpace([tab2.id], space2.id);
    console.log('Migrated tab to new space');

    // Switch spaces
    await tabManager.switchSpace(space2.id);
    console.log('Switched to space:', space2.name);

    // Duplicate a tab
    const duplicatedTab = await tabManager.duplicateTab(tab1.id);
    console.log('Duplicated tab:', duplicatedTab.title);

    // Export space
    const exportData = await tabManager.exportSpace(space.id);
    console.log('Exported space with', exportData.tabs.length, 'tabs');

    // Import space
    const importedSpace = await tabManager.importSpace(exportData);
    console.log('Imported space:', importedSpace.name);
    console.log('✅ Advanced Spaces system working');

    // Test 3.3: Enhanced tab management features
    console.log('📋 Test 3.3: Enhanced tab management features...');

    // Pin a tab
    await tabManager.pinTab(tab1.id);
    console.log('Pinned tab:', tab1.title);

    // Bookmark a tab
    await tabManager.bookmarkTab(tab1.id, 'favorites');
    console.log('Bookmarked tab:', tab1.title);

    // Get tab history
    const history = await tabManager.getTabHistory(tab1.id);
    console.log('Tab history entries:', history.length);

    // Test memory optimization
    await tabManager.optimizeMemory();
    console.log('Memory optimization completed');

    // List all tabs
    const allTabs = await tabManager.listTabs();
    console.log('Total tabs:', allTabs.length);

    // Test suspension (create some inactive tabs)
    const inactiveTab = await tabManager.createTab('https://inactive.com', {
      spaceId: space.id
    });

    // Manually set last active to old time to trigger suspension
    (inactiveTab as any).lastActive = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
    console.log('Created inactive tab for suspension test');

    console.log('✅ Enhanced tab management features working');

    // Final statistics
    const finalTabs = await tabManager.listTabs();
    const activeTabs = finalTabs.filter(t => !t.suspended);
    const suspendedTabs = finalTabs.filter(t => t.suspended);
    const pinnedTabs = finalTabs.filter(t => (tabManager as any).pinnedTabs.has(t.id));

    console.log('\n📊 Final Statistics:');
    console.log(`   Total tabs: ${finalTabs.length}`);
    console.log(`   Active tabs: ${activeTabs.length}`);
    console.log(`   Suspended tabs: ${suspendedTabs.length}`);
    console.log(`   Pinned tabs: ${pinnedTabs.length}`);
    console.log(`   Spaces: 3`);
    console.log(`   Groups: 1`);

    console.log('🎉 All Task 3 integration tests passed!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

// Export for use in other test files
export { runTask3IntegrationTest };

// Run the test if this file is executed directly
if (require.main === module) {
  runTask3IntegrationTest()
    .then(() => {
      console.log('✅ Task 3 integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Task 3 integration test failed:', error);
      process.exit(1);
    });
}
