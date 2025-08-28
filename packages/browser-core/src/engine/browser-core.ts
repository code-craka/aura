// Aura Browser Core Engine - Main Integration
// Brings together all browser core components for Task 2 implementation

import { ChromiumEngine, createChromiumEngine, NativeChromiumEngine } from './chromium-engine';
import { AIIntegrationHooks, createAIIntegrationHooks } from './ai-integration-hooks';
import { ProcessManager, createProcessManager, IPCManager, createIPCManager } from './process-manager';
import { TabManager, createTabManager, TabManagerConfig } from './tab-manager';
import { EventBus, createEventBus, TabEventProcessor, ProcessEventProcessor, AIEventProcessor } from './event-system';

export interface BrowserCoreConfig {
  maxTabs: number;
  maxProcesses: number;
  memoryLimit: number; // MB
  enableAI: boolean;
  securityLevel: 'standard' | 'elevated' | 'restricted';
  autoSuspendTabs: boolean;
  eventStorageEnabled: boolean;
}

export interface BrowserCore {
  // Core components
  readonly chromiumEngine: ChromiumEngine;
  readonly aiHooks: AIIntegrationHooks;
  readonly processManager: ProcessManager;
  readonly tabManager: TabManager;
  readonly eventBus: EventBus;
  readonly ipcManager: IPCManager;

  // Lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Utility methods
  getStats(): Promise<BrowserStats>;
  optimize(): Promise<void>;
}

export interface BrowserStats {
  tabs: {
    total: number;
    active: number;
    suspended: number;
  };
  processes: {
    total: number;
    healthy: number;
    degraded: number;
    critical: number;
  };
  memory: {
    used: number;
    limit: number;
    available: number;
  };
  performance: {
    averageLoadTime: number;
    averageMemoryPerTab: number;
    eventProcessingRate: number;
  };
}

// Main Browser Core Implementation
export class AuraBrowserCore implements BrowserCore {
  public readonly chromiumEngine: ChromiumEngine;
  public readonly aiHooks: AIIntegrationHooks;
  public readonly processManager: ProcessManager;
  public readonly tabManager: TabManager;
  public readonly eventBus: EventBus;
  public readonly ipcManager: IPCManager;

  private config: BrowserCoreConfig;
  private initialized: boolean = false;
  private nativeEngine: NativeChromiumEngine;

  constructor(nativeEngine: NativeChromiumEngine, config: BrowserCoreConfig) {
    this.nativeEngine = nativeEngine;
    this.config = config;

    // Initialize IPC first as it's needed by other components
    this.ipcManager = createIPCManager();

    // Create process manager
    this.processManager = createProcessManager(this.ipcManager);

    // Create event bus
    this.eventBus = createEventBus();

    // Create chromium engine wrapper
    this.chromiumEngine = createChromiumEngine(nativeEngine);

    // Create AI integration hooks
    this.aiHooks = createAIIntegrationHooks();

    // Create tab manager with configuration
    const tabManagerConfig: TabManagerConfig = {
      maxTabs: config.maxTabs,
      defaultSpaceId: 'default-space',
      suspensionStrategy: {
        type: 'time-based',
        threshold: 30, // 30 minutes
        gracePeriod: 5 // 5 minutes
      },
      memoryThreshold: config.memoryLimit,
      autoSaveState: true,
      enableAdvancedSearch: true,
      enableTabHistory: true,
      maxHistoryEntries: 1000,
      enableAIFeatures: config.enableAI
    };
    this.tabManager = createTabManager(this.processManager, tabManagerConfig);

    // Register event processors
    this.registerEventProcessors();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Publish browser startup event
      await this.eventBus.publish({
        id: `startup_${Date.now()}`,
        type: 'browser-startup' as any,
        timestamp: new Date(),
        source: 'browser-core',
        data: { config: this.config },
        metadata: {
          priority: 'high' as any,
          correlationId: 'browser-startup'
        }
      });

      // Initialize native chromium engine
      await this.initializeNativeEngine();

      // Create default space and initial setup
      await this.initializeDefaultSpace();

      // Start background processes
      await this.startBackgroundProcesses();

      // Setup event forwarding between components
      this.setupEventForwarding();

      this.initialized = true;

      console.log('Aura Browser Core initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser core:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Publish shutdown event
      await this.eventBus.publish({
        id: `shutdown_${Date.now()}`,
        type: 'browser-shutdown' as any,
        timestamp: new Date(),
        source: 'browser-core',
        data: {},
        metadata: {
          priority: 'high' as any,
          correlationId: 'browser-shutdown'
        }
      });

      // Shutdown components in reverse order
      await this.tabManager.optimizeMemory(); // Suspend all tabs

      // Destroy all processes
      const processes = await this.processManager.listProcesses();
      for (const process of processes) {
        await this.processManager.destroyProcess(process.id);
      }

      // Shutdown managers
      (this.tabManager as any).destroy();
      (this.processManager as any).destroy();
      (this.eventBus as any).destroy();

      this.initialized = false;

      console.log('Aura Browser Core shutdown successfully');
    } catch (error) {
      console.error('Error during browser core shutdown:', error);
      throw error;
    }
  }

  async getStats(): Promise<BrowserStats> {
    const [tabs, processes] = await Promise.all([
      this.tabManager.listTabs(),
      this.processManager.listProcesses()
    ]);

    const activeTabs = tabs.filter(tab => !tab.suspended);
    const suspendedTabs = tabs.filter(tab => tab.suspended);

    const healthyProcesses = processes.filter(p => p.health === 'healthy' as any);
    const degradedProcesses = processes.filter(p => p.health === 'degraded' as any);
    const criticalProcesses = processes.filter(p => p.health === 'critical' as any);

    // Calculate memory usage
    const totalMemoryUsed = processes.reduce((sum, p) => sum + p.memoryUsage, 0);
    const memoryLimit = this.config.memoryLimit * 1024 * 1024; // Convert to bytes

    return {
      tabs: {
        total: tabs.length,
        active: activeTabs.length,
        suspended: suspendedTabs.length
      },
      processes: {
        total: processes.length,
        healthy: healthyProcesses.length,
        degraded: degradedProcesses.length,
        critical: criticalProcesses.length
      },
      memory: {
        used: totalMemoryUsed,
        limit: memoryLimit,
        available: Math.max(0, memoryLimit - totalMemoryUsed)
      },
      performance: {
        averageLoadTime: 0, // Would be calculated from actual metrics
        averageMemoryPerTab: tabs.length > 0 ? totalMemoryUsed / tabs.length : 0,
        eventProcessingRate: 0 // Would be calculated from event bus metrics
      }
    };
  }

  async optimize(): Promise<void> {
    // Run optimization across all components
    await Promise.all([
      this.tabManager.optimizeMemory(),
      this.processManager.monitorProcesses(),
      this.eventBus.getEvents() // This would trigger cleanup
    ]);
  }

  private async initializeNativeEngine(): Promise<void> {
    // This would initialize the native Chromium engine
    // For now, this is a placeholder
    console.log('Initializing native Chromium engine...');
  }

  private async initializeDefaultSpace(): Promise<void> {
    // Create default space if it doesn't exist
    try {
      await this.tabManager.createSpace('Default Workspace', {
        theme: 'default',
        layout: 'grid',
        autoSuspend: this.config.autoSuspendTabs,
        aiEnabled: this.config.enableAI
      });
    } catch (error) {
      // Space might already exist
      console.log('Default space already exists or failed to create:', error);
    }
  }

  private async startBackgroundProcesses(): Promise<void> {
    // Start essential background processes
    const processes = [
      { type: 'main' as any, config: { securityLevel: 'elevated' as any } },
      { type: 'network' as any, config: { securityLevel: 'standard' as any } },
      { type: 'gpu' as any, config: { securityLevel: 'standard' as any } }
    ];

    for (const process of processes) {
      try {
        await this.processManager.createProcess(process.type, process.config);
      } catch (error) {
        console.warn(`Failed to start ${process.type} process:`, error);
      }
    }

    if (this.config.enableAI) {
      try {
        await this.processManager.createProcess('ai' as any, {
          securityLevel: 'elevated' as any,
          aiEnabled: true
        });
      } catch (error) {
        console.warn('Failed to start AI process:', error);
      }
    }
  }

  private registerEventProcessors(): void {
    const tabProcessor = new TabEventProcessor();
    const processProcessor = new ProcessEventProcessor();
    const aiProcessor = new AIEventProcessor();

    (this.eventBus as any).registerProcessor(tabProcessor);
    (this.eventBus as any).registerProcessor(processProcessor);
    (this.eventBus as any).registerProcessor(aiProcessor);
  }

  private setupEventForwarding(): void {
    // Forward events from various components to the event bus
    this.setupTabEventForwarding();
    this.setupProcessEventForwarding();
    this.setupChromiumEventForwarding();
  }

  private setupTabEventForwarding(): void {
    // Forward tab manager events to event bus
    const tabManager = this.tabManager as any;
    if (tabManager.emit) {
      const originalEmit = tabManager.emit.bind(tabManager);
      tabManager.emit = (event: string, data: any) => {
        // Forward to event bus
        this.eventBus.publish({
          id: `tab_${Date.now()}`,
          type: event as any,
          timestamp: new Date(),
          source: 'tab-manager',
          data
        }).catch(error => console.warn('Failed to publish tab event:', error));

        // Call original emit
        return originalEmit(event, data);
      };
    }
  }

  private setupProcessEventForwarding(): void {
    // Forward process manager events to event bus
    const processManager = this.processManager as any;
    if (processManager.emit) {
      const originalEmit = processManager.emit.bind(processManager);
      processManager.emit = (event: string, data: any) => {
        // Forward to event bus
        this.eventBus.publish({
          id: `process_${Date.now()}`,
          type: event as any,
          timestamp: new Date(),
          source: 'process-manager',
          data
        }).catch(error => console.warn('Failed to publish process event:', error));

        // Call original emit
        return originalEmit(event, data);
      };
    }
  }

  private setupChromiumEventForwarding(): void {
    // Forward chromium engine events to event bus
    const chromiumEngine = this.chromiumEngine as any;
    if (chromiumEngine.addEventListener) {
      // This would need to be implemented based on the actual event system
      // For now, this is a placeholder
    }
  }
}

// Factory function to create browser core
export function createBrowserCore(nativeEngine: NativeChromiumEngine, config: BrowserCoreConfig): BrowserCore {
  return new AuraBrowserCore(nativeEngine, config);
}

// Default configuration
export const defaultBrowserCoreConfig: BrowserCoreConfig = {
  maxTabs: 100,
  maxProcesses: 20,
  memoryLimit: 1024, // 1GB
  enableAI: true,
  securityLevel: 'standard',
  autoSuspendTabs: true,
  eventStorageEnabled: true
};
