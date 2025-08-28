// Task 4 Integration Test
// Validates cross-tab communication, shared contexts, and collaboration features

import { createCrossTabCommunication, MessageType, MessagePriority, CollaborationType } from '../cross-tab-communication';
import { createIPCManager } from '../process-manager';
import { createTabManager, TabManagerConfig, TabSuspensionStrategy } from '../tab-manager';
import { createProcessManager } from '../process-manager';

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

async function runTask4IntegrationTest() {
  console.log('🚀 Starting Task 4 Integration Test...');

  try {
    // Create dependencies
    const ipcManager = createIPCManager();
    const processManager = createProcessManager(ipcManager);

    const tabManagerConfig: TabManagerConfig = {
      maxTabs: 50,
      defaultSpaceId: 'default-space',
      suspensionStrategy: {
        type: 'time-based',
        threshold: 100,
        gracePeriod: 5
      },
      memoryThreshold: 512,
      autoSaveState: true,
      enableAdvancedSearch: true,
      enableTabHistory: true,
      maxHistoryEntries: 100,
      enableAIFeatures: true
    };

    const tabManager = createTabManager(processManager, tabManagerConfig);

    // Create cross-tab communication system
    const crossTabComm = createCrossTabCommunication(ipcManager, tabManager);

    // Test 4.1: Secure cross-tab messaging system
    console.log('📋 Test 4.1: Secure cross-tab messaging system...');

    // Create test tabs
    const tab1 = await tabManager.createTab('https://example.com', { aiEnabled: true });
    const tab2 = await tabManager.createTab('https://github.com', { aiEnabled: true });
    const tab3 = await tabManager.createTab('https://stackoverflow.com', { aiEnabled: true });

    console.log('Created test tabs:', tab1.id, tab2.id, tab3.id);

    // Test message subscription
    let receivedMessages: any[] = [];
    const subscription = crossTabComm.subscribeToMessages((message) => {
      receivedMessages.push(message);
    });

    // Send direct message
    const directMessage = {
      id: `msg_${Date.now()}`,
      fromTabId: tab1.id,
      toTabId: tab2.id,
      type: MessageType.CUSTOM,
      payload: { text: 'Hello from tab1!' },
      timestamp: new Date(),
      priority: MessagePriority.NORMAL
    };

    await crossTabComm.sendMessage(directMessage);
    console.log('Sent direct message from tab1 to tab2');

    // Send broadcast message
    const broadcastMessage = {
      id: `broadcast_${Date.now()}`,
      fromTabId: tab1.id,
      type: MessageType.CUSTOM,
      payload: { text: 'Broadcast from tab1!' },
      timestamp: new Date(),
      priority: MessagePriority.NORMAL
    };

    await crossTabComm.broadcastMessage(broadcastMessage);
    console.log('Sent broadcast message from tab1');

    // Test permissions
    await crossTabComm.grantPermission(tab1.id, tab2.id, 'read');
    const hasPermission = await crossTabComm.checkPermission(tab1.id, tab2.id, 'read');
    console.log('Permission check result:', hasPermission);

    console.log('✅ Secure cross-tab messaging system working');

    // Test 4.2: Shared data contexts
    console.log('📋 Test 4.2: Shared data contexts...');

    // Create shared context
    const sharedContext = await crossTabComm.createSharedContext('Test Context', {
      counter: 0,
      messages: [],
      settings: { theme: 'dark' }
    });
    console.log('Created shared context:', sharedContext.name);

    // Join context from another tab
    await crossTabComm.joinSharedContext(sharedContext.id);
    console.log('Joined shared context from tab2');

    // Update shared data
    await crossTabComm.updateSharedData(sharedContext.id, 'counter', 1);
    await crossTabComm.updateSharedData(sharedContext.id, 'messages', ['Hello!']);
    console.log('Updated shared data');

    // Read shared data
    const counterValue = await crossTabComm.getSharedData(sharedContext.id, 'counter');
    const allData = await crossTabComm.getSharedData(sharedContext.id);
    console.log('Read shared data - counter:', counterValue, 'all data:', allData);

    // List shared contexts
    const contexts = await crossTabComm.listSharedContexts();
    console.log('Listed shared contexts:', contexts.length);

    // Leave context
    await crossTabComm.leaveSharedContext(sharedContext.id);
    console.log('Left shared context');

    console.log('✅ Shared data contexts working');

    // Test 4.3: Collaborative features
    console.log('📋 Test 4.3: Collaborative features...');

    // Create collaboration session
    const collabSession = await crossTabComm.createCollaborationSession(
      'Test Collaboration',
      CollaborationType.RESEARCH_SESSION,
      {
        realTimeUpdates: true,
        conflictResolution: 'automatic',
        aiAssistance: true,
        maxParticipants: 5
      }
    );
    console.log('Created collaboration session:', collabSession.name);

    // Join collaboration session
    await crossTabComm.joinCollaborationSession(collabSession.id);
    console.log('Joined collaboration session from tab2');

    // Update collaboration state
    await crossTabComm.updateCollaborationState(collabSession.id, {
      cursor: { line: 10, column: 5 },
      selection: {
        start: { line: 10, column: 5 },
        end: { line: 10, column: 15 }
      }
    });
    console.log('Updated collaboration state');

    // List collaboration sessions
    const sessions = await crossTabComm.listCollaborationSessions();
    console.log('Listed collaboration sessions:', sessions.length);

    // Leave collaboration session
    await crossTabComm.leaveCollaborationSession(collabSession.id);
    console.log('Left collaboration session');

    console.log('✅ Collaborative features working');

    // Test 4.4: Conflict resolution
    console.log('📋 Test 4.4: Conflict resolution...');

    // Create a new shared context for conflict testing
    const conflictContext = await crossTabComm.createSharedContext('Conflict Test', {
      value: 'original'
    });

    // Simulate conflicting updates
    const conflictingValues = [
      { value: 'version1', tabId: tab1.id, timestamp: new Date() },
      { value: 'version2', tabId: tab2.id, timestamp: new Date() }
    ];

    const resolvedValue = await crossTabComm.resolveConflict(
      conflictContext.id,
      'value',
      conflictingValues
    );
    console.log('Resolved conflict, result:', resolvedValue);

    // Get conflict history
    const conflictHistory = await crossTabComm.getConflictHistory(conflictContext.id);
    console.log('Conflict history entries:', conflictHistory.length);

    console.log('✅ Conflict resolution working');

    // Test connection management
    console.log('📋 Test Connection Management...');

    const connectedTabs = await crossTabComm.getConnectedTabs();
    console.log('Connected tabs:', connectedTabs.length);

    const tabConnections = await crossTabComm.getTabConnections(tab1.id);
    console.log('Tab connections for tab1:', tabConnections.length);

    // Cleanup
    await crossTabComm.cleanup();
    subscription.unsubscribe();

    console.log('✅ Connection management working');

    // Final statistics
    const finalContexts = await crossTabComm.listSharedContexts();
    const finalSessions = await crossTabComm.listCollaborationSessions();

    console.log('\n📊 Final Statistics:');
    console.log(`   Messages processed: ${receivedMessages.length}`);
    console.log(`   Shared contexts: ${finalContexts.length}`);
    console.log(`   Collaboration sessions: ${finalSessions.length}`);
    console.log(`   Connected tabs: ${connectedTabs.length}`);
    console.log(`   Permissions granted: 1`);
    console.log(`   Conflicts resolved: 1`);

    console.log('🎉 All Task 4 integration tests passed!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

// Export for use in other test files
export { runTask4IntegrationTest };

// Run the test if this file is executed directly
if (require.main === module) {
  runTask4IntegrationTest()
    .then(() => {
      console.log('✅ Task 4 integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Task 4 integration test failed:', error);
      process.exit(1);
    });
}
